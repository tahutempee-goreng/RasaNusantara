import { test, expect } from '@playwright/test';

test('recipe portions scale amounts without changing pantry or the original recipe', async ({ page }) => {
 await page.goto('/resep/tekwan-contoh');
 await expect(page.getByRole('heading',{name:'Tekwan',exact:true})).toBeVisible();
 const row=page.locator('.recipe-ingredients li').filter({hasText:'Ikan tenggiri'});
 const original=await row.locator('b').innerText();
 const base=await page.getByLabel('Takaran untuk').inputValue();
 const target=Number(base)>6?Math.floor(Number(base)/2):Number(base)*2;
 await page.getByLabel('Takaran untuk').selectOption(String(target));
 const scaled=await row.locator('b').innerText();
 expect(scaled).not.toBe(original);
 await page.getByRole('link',{name:'Mulai Cooking Mode'}).click(); await expect(page.locator('.cooking-header')).toContainText(String(target)+' porsi'); await page.getByRole('link',{name:'Detail resep'}).click(); await expect(page.getByLabel('Takaran untuk')).toHaveValue(String(target));
 await page.getByLabel('Takaran untuk').selectOption(base);await expect(row.locator('b')).toHaveText(original);
 await page.goto('/resep/tekwan-contoh');await expect(row.locator('b')).toHaveText(original);
 await expect(page.getByText('Persiapan',{exact:true})).toBeVisible();await expect(page.getByText('Memasak',{exact:true})).toBeVisible();
});

test('cooking exposes current-step ingredients, keyboard focus and persistent step navigation',async({page})=>{
 await page.goto('/masak/tekwan-contoh');
 await page.locator('.step-ingredients summary').click();await expect(page.locator('.step-ingredients .ingredient-list')).toBeVisible();
 await page.getByRole('button',{name:'Langkah berikutnya'}).click();
 await expect(page.getByRole('heading',{name:'Campur adonan'})).toBeFocused();
 await page.getByRole('navigation',{name:'Alur memasak'}).getByRole('button',{name:'Siapkan kaldu',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Siapkan kaldu'})).toBeFocused();
 await page.reload();await page.getByRole('button',{name:'Lanjutkan progres'}).click();await expect(page.getByRole('heading',{name:'Siapkan kaldu'})).toBeVisible();
 await expect(page.locator('.advisor-context')).toContainText('Tekwan');
});

test('all published recipes have readable detail, image provenance, facts and source links',async({page,request})=>{
 const catalog=await (await request.get('/api/catalog')).json();
 for(const recipe of catalog.recipes){
  await page.goto('/resep/'+recipe.slug);
  await expect(page.getByRole('heading',{name:recipe.title,exact:true})).toBeVisible();
  await expect.poll(()=>page.locator('.dish-portrait img').evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.dish-portrait figcaption')).toHaveCount(0); await expect(page.getByRole('contentinfo').getByRole('link',{name:'Tentang & kredit'})).toHaveAttribute('href','/tentang');
  await expect(page.locator('.recipe-facts dd')).toHaveCount(3);
  await expect(page.locator('.recipe-directions .recipe-step-flow li')).toHaveCount(recipe.steps.length);
  await page.getByRole('tab',{name:'Cerita & sumber'}).click();await page.locator('.culture summary').click();expect(await page.locator('.culture a').count()).toBeGreaterThan(0);
 }
});


test('compact recipe sections retain every ingredient through category pages and keyboard tabs',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();const recipe=catalog.recipes.find((r:any)=>r.slug==='rendang');
 await page.goto('/resep/rendang');const panel=page.locator('#bahan-resep');await expect(panel).toBeVisible();const names=new Set<string>();
 for(const label of ['Inti','Bumbu & pendukung','Opsional']){
  const group=panel.getByRole('button',{name:new RegExp('^'+label)});if(!await group.count())continue;await group.click();
  while(true){const items=panel.locator('.ingredient-list li');expect(await items.count()).toBeLessThanOrEqual(6);for(const name of await items.locator(':scope > span').evaluateAll(nodes=>nodes.map(n=>n.childNodes[0].textContent!.trim())))names.add(name);
   const next=panel.getByRole('button',{name:'Berikutnya',exact:true});if(!await next.count()||await next.isDisabled())break;await next.click();
  }
 }
 expect([...names].sort()).toEqual(recipe.ingredients.map((item:any)=>catalog.ingredients.find((i:any)=>i.id===item.ingredientId).name).sort());
 const tab=page.getByRole('tab',{name:'Bahan & takaran'});await tab.focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Langkah memasak'})).toHaveAttribute('aria-selected','true');await expect(page.locator('#langkah-resep')).toBeVisible();await expect(panel).toBeHidden();
 await page.getByRole('tab',{name:'Cerita & sumber'}).click();await expect(page.locator('#cerita-resep')).toBeVisible();await page.reload();await expect(page.getByRole('tab',{name:'Cerita & sumber'})).toHaveAttribute('aria-selected','true');
});

test('recipe directions show ordered navigation, current instruction and next step without saving cooking progress',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();const recipe=catalog.recipes.find((r:any)=>r.slug==='rendang');
 await page.goto('/resep/rendang#langkah-resep');const panel=page.locator('#langkah-resep');
 const flow=panel.getByRole('navigation',{name:'Alur memasak'});await expect(flow.getByRole('button')).toHaveCount(recipe.steps.length);
 await expect(flow.getByRole('button').first()).toHaveAttribute('aria-current','step');
 await panel.getByRole('button',{name:'Langkah berikutnya'}).click();await expect(panel.getByRole('heading',{name:recipe.steps[1].title,exact:true})).toBeFocused();
 await expect(flow.getByRole('button').nth(1)).toHaveAttribute('aria-current','step');
 await flow.getByRole('button').last().click();await expect(panel.locator('.direction-instruction')).toHaveText(recipe.steps.at(-1).instruction);
 await expect(panel.getByRole('link',{name:'Mulai Cooking Mode'})).toHaveAttribute('href',/porsi=/);
 expect(await page.evaluate(id=>localStorage.getItem('rn:cook:'+id),recipe.id)).toBeNull();
 await panel.getByRole('button',{name:'Sebelumnya'}).click();await expect(panel.getByRole('heading',{name:recipe.steps.at(-2).title,exact:true})).toBeFocused();
});

test('phone step titles stay visible and the active step scrolls inside its rail',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/resep/rendang#langkah-resep');
 const panel=page.locator('#langkah-resep');await panel.scrollIntoViewIfNeeded();
 await expect(panel.locator('.flow-title').first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await panel.getByRole('button',{name:'Langkah berikutnya'}).click();await panel.getByRole('button',{name:'Langkah berikutnya'}).click();
 const active=panel.locator('[aria-current=step]');await expect(active.locator('.flow-title')).toBeVisible();
 const visible=await active.evaluate(node=>{const b=node.getBoundingClientRect(),a=node.closest('ol')!.getBoundingClientRect();return b.left>=a.left-1&&b.right<=a.right+1});expect(visible).toBe(true);
 await page.goto('/masak/rendang');await expect(page.locator('.recipe-step-flow .flow-title').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
