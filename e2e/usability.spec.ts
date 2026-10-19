import { test, expect, type Page } from '@playwright/test';

async function pantryItem(page: Page, name: string, checked: boolean) {
  const search = page.getByRole('searchbox', { name: 'Cari bahan', exact: true });
  await search.fill(name);
  await page.getByRole('checkbox', { name, exact: true }).setChecked(checked);
  await search.fill('');
}


test('published catalog has thirteen complete sourced recipes, distinct art, and varied times', async ({ request }) => {
  const catalog = await (await request.get('/api/catalog')).json();
  expect(catalog.mode).toBe('curated'); expect(catalog.recipes).toHaveLength(13);
  expect(new Set(catalog.recipes.map((recipe: any) => recipe.image.path)).size).toBe(13);
  expect(new Set(catalog.recipes.map((recipe: any) => recipe.prepMinutes + recipe.cookMinutes)).size).toBeGreaterThan(6);
  for (const recipe of catalog.recipes) {
    expect(recipe.status).toBe('published'); expect(recipe.sourceIds.length).toBeGreaterThan(0);
    expect(recipe.culture.sourceIds.length).toBeGreaterThan(0); expect(recipe.steps.length).toBeGreaterThanOrEqual(4);
    expect(recipe.adaptationNote).toContain('Belum diuji memasak langsung');
    expect((await request.get(recipe.image.path)).ok()).toBe(true);
  }
});

test('live search reaches a real 100%, updates when ingredients are removed, and persists', async ({ page, request }) => {
  const catalog = await (await request.get('/api/catalog')).json();
  const recipe = catalog.recipes.find((item: any) => item.id === 'pindang-contoh');
  await page.goto('/cari');
  await page.getByRole('button', { name: 'Palembang', exact: true }).click();
  await page.getByText('Filter tambahan', { exact: true }).click();
  await page.getByLabel('Bahan utama resep', { exact: true }).selectOption('patin');
  for (const item of recipe.ingredients.filter((item: any) => item.role !== 'optional')) {
    const ingredient = catalog.ingredients.find((ingredient: any) => ingredient.id === item.ingredientId);
    await pantryItem(page, ingredient.name, true);
  }
  const card = page.locator('.live-match[data-recipe-id="pindang-contoh"]');
  await expect(card.locator('[data-score]')).toHaveAttribute('data-score', '100');
  await expect(card).toContainText('Semua bahan wajib tersedia');
  await pantryItem(page, 'Garam', false);
  await expect(card.locator('[data-score]')).not.toHaveAttribute('data-score', '100');
  await expect(card.locator('.missing-ingredients')).toContainText('Garam');
  await pantryItem(page, 'Kemangi', true);
  const score = await card.locator('[data-score]').getAttribute('data-score');
  await pantryItem(page, 'Kemangi', false);
  await expect(card.locator('[data-score]')).toHaveAttribute('data-score', score!);
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Ikan patin', exact: true })).toBeChecked();
  await page.getByRole('searchbox', { name: 'Cari bahan', exact: true }).fill('Garam');
  await expect(page.getByRole('checkbox', { name: 'Garam', exact: true })).not.toBeChecked();
  await expect(card.locator('[data-score]')).toHaveAttribute('data-score', score!);
});

test('each region and dish type filters UI ingredients and matches the API', async ({ page, request }) => {
  const catalog = await (await request.get('/api/catalog')).json();
  const allIds = catalog.ingredients.map((item: any) => item.id);
  await page.addInitScript(ids => localStorage.setItem('rn:wizard', JSON.stringify({ version: 1, input: { dishType: 'berkuah', mainIngredientId: null, ingredientIds: ids } })), allIds);
  await page.goto('/cari');
  for (const [regionId, label] of [['palembang', 'Palembang'], ['padang', 'Padang / Minang'], ['jawa', 'Jawa'], ['makassar', 'Makassar']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    for (const dishType of ['berkuah', 'kering']) {
      await page.getByRole('radio', { name: dishType === 'berkuah' ? /Berkuah/ : /Kering/ }).check();
      const expected = await (await request.post('/api/match', { data: { regionId, dishType, mainIngredientId: null, ingredientIds: allIds } })).json();
      await expect(page.locator('.live-match')).toHaveCount(expected.results.length);
      const expectedIngredients = new Set(catalog.recipes.filter((recipe: any) => recipe.regionId === regionId && recipe.dishType === dishType).flatMap((recipe: any) => recipe.ingredients.map((item: any) => item.ingredientId)));
      const found: (string | null)[] = [];
      for (const category of ['Utama','Bumbu','Pelengkap']) {
        await page.getByRole('tab',{name:new RegExp('^'+category)}).click();
        found.push(...await page.locator('.ingredient-picker [data-ingredient-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-ingredient-id'))));
      }
      expect(new Set(found)).toEqual(expectedIngredients);
      for (let index = 0; index < expected.results.length; index++) {
        const card = page.locator('.live-match').nth(index);
        await expect(card).toHaveAttribute('data-recipe-id', expected.results[index].recipeId);
        await expect(card.locator('[data-score]')).toHaveAttribute('data-score', String(expected.results[index].score));
      }
    }
  }
});

test('chapter holds reading space, scroll remains free, and checking does not jump', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('[data-deck-ready=true]').waitFor();
  const cover = page.locator('#sampul');
  const positions = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-deck-ready=true]')!;
    const panel = document.getElementById('sampul')!;
    const origin = scrollY + root.getBoundingClientRect().top;
    return { read: Number(panel.dataset.overflow), hold: Number(root.dataset.readDistance), travel: Number(root.dataset.travelDistance), origin };
  });
  expect(positions.hold).toBeCloseTo(900 * .6); expect(positions.travel).toBeCloseTo(900 * 1.25);
  await page.evaluate(p => scrollTo({ top: p.origin + p.read + p.hold * .5, behavior: 'instant' }), positions);
  await expect(cover).toHaveAttribute('data-exit', '0');
  await page.evaluate(p => scrollTo({ top: p.origin + p.read + p.hold + p.travel * .5, behavior: 'instant' }), positions);
  await expect.poll(() => cover.getAttribute('data-exit')).not.toBe('0');
  const landed = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-deck-ready=true]')!;
    const panel = document.getElementById('cerita')!;
    const target = scrollY + root.getBoundingClientRect().top + Number(panel.dataset.start) + 1;
    scrollTo({ top: target, behavior: 'instant' }); return target;
  });
  await page.waitForTimeout(250);
  expect(Math.abs(await page.evaluate(() => scrollY) - landed)).toBeLessThan(2);
  await page.mouse.wheel(0, 2500);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(landed + 1000);
  await page.getByRole('link', { name: 'Buka bab: Dapur', exact: true }).click();
  await expect(page.getByRole('link',{name:'Buka bab: Dapur',exact:true})).toHaveAttribute('aria-current','step');
  const fish = page.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true });
  await fish.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await fish.check(); await expect(fish).toBeChecked(); await page.waitForTimeout(150);
  expect(Math.abs(await page.evaluate(() => scrollY) - before)).toBeLessThan(2);
  expect(await page.locator('[data-paper-stage]').evaluate(node => node.scrollTop)).toBe(0);
});

test('old cooking progress restarts for revised recipes and render errors stay empty', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('rn:cook:tekwan-contoh', JSON.stringify({ version: 1, recipeId: 'tekwan-contoh', recipeVersion: 1, step: 1, done: false })));
  await page.goto('/masak/tekwan-contoh');
  await expect(page.getByRole('status')).toContainText('Progres lama direset');
  await expect(page.getByRole('heading', { name: 'Siapkan kaldu', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('ingredient choices, selected states, helper text and result actions meet text contrast', async ({ page }) => {
  await page.goto('/cari');
  await page.getByRole('button', { name: 'Palembang', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true }).check();
  // Measure the settled selected state, after the 160 ms native button color transition.
  await expect.poll(() => page.getByRole('button', { name: 'Palembang', exact: true }).evaluate(node => getComputedStyle(node).backgroundColor)).toBe('rgb(23, 47, 58)');
  const values = await page.locator('.matcher').evaluate(root => {
    const rgb = (value: string) => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = (color: number[]) => color.slice(0, 3).map(value => { const s = value / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    return [...root.querySelectorAll<HTMLElement>('.region-chip,.home-dish-types b,.home-dish-types small,.home-ingredients label,.matcher-help,.match-footnote,.match-recipe-link,.pantry-form-actions a.button')].map(node => {
      const foreground = rgb(getComputedStyle(node).color);
      let parent: HTMLElement | null = node; let background = [242, 234, 216];
      while (parent) { const candidate = rgb(getComputedStyle(parent).backgroundColor); if (candidate.length === 3 || candidate[3] === 1) { background = candidate; break; } parent = parent.parentElement; }
      const f = luminance(foreground), b = luminance(background);
      return { text: node.textContent?.trim(), ratio: (Math.max(f, b) + .05) / (Math.min(f, b) + .05) };
    });
  });
  for (const value of values) expect(value.ratio, value.text).toBeGreaterThanOrEqual(4.5);
});

test('category checklist scrolls within a stable panel and preserves search, selection and storage', async ({page}) => {
 await page.goto('/cari');
 const picker=page.getByRole('region',{name:'Daftar bahan',exact:true});
 const height=(await picker.boundingBox())!.height;
 await page.getByRole('tab',{name:/^Bumbu/}).click();
 expect(await picker.evaluate(node=>node.scrollHeight>node.clientHeight)).toBe(true);
 await page.getByRole('tab',{name:/^Utama/}).click();
 await page.getByRole('checkbox',{name:'Ikan tenggiri',exact:true}).check();
 await pantryItem(page,'Air',true);
 await page.getByRole('tab',{name:/^Dipilih/}).click();
 await expect(picker.getByRole('checkbox')).toHaveCount(2);
 expect(Math.abs((await picker.boundingBox())!.height-height)).toBeLessThan(2);
 await page.getByRole('tab',{name:/^Bumbu/}).click();
 await picker.scrollIntoViewIfNeeded();
 const box=(await picker.boundingBox())!; await page.mouse.move(box.x+box.width/2,box.y+100);
 const outer=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,180);await page.waitForTimeout(200);
 expect(await picker.evaluate(node=>node.scrollTop)).toBeGreaterThan(0);
 expect(Math.abs(await page.evaluate(()=>scrollY)-outer)).toBeLessThan(2);
 await page.getByRole('searchbox',{name:'Cari bahan',exact:true}).fill('garam');
 await expect(picker.getByRole('checkbox')).toHaveCount(1);
 expect(Math.abs((await picker.boundingBox())!.height-height)).toBeLessThan(2);
 await page.getByRole('tab',{name:/^Utama/}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:/^Bumbu/})).toBeFocused();await expect(page.getByRole('tab',{name:/^Bumbu/})).toHaveAttribute('aria-selected','true');
 await page.reload();await page.getByRole('tab',{name:/^Dipilih/}).click();
 await expect(picker.getByRole('checkbox',{name:'Air',exact:true})).toBeChecked();
 await expect(picker.getByRole('checkbox',{name:'Ikan tenggiri',exact:true})).toBeChecked();
});

test('home list supports native wheel and keyboard without changing chapters',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.locator('[data-deck-ready=true]').waitFor();
 await page.getByRole('link',{name:'Buka bab: Dapur',exact:true}).click();
 const list=page.getByRole('region',{name:'Daftar bahan',exact:true});
 await page.getByRole('tab',{name:/^Bumbu/}).click();
 await page.evaluate(()=>{const list=document.querySelector<HTMLElement>('[data-ingredient-scroll]')!,panel=list.closest<HTMLElement>('[data-journal-chapter]')!,root=document.querySelector<HTMLElement>('[data-deck-ready=true]')!;const inset=list.getBoundingClientRect().top-panel.getBoundingClientRect().top-140;scrollTo({top:scrollY+root.getBoundingClientRect().top+Number(panel.dataset.start)+inset+1,behavior:'instant'});});
 await page.waitForTimeout(150);const box=(await list.boundingBox())!;await page.mouse.move(box.x+100,box.y+100);const before=await page.evaluate(()=>scrollY);
 await page.mouse.wheel(0,220);await page.waitForTimeout(180);expect(await list.evaluate(n=>n.scrollTop)).toBeGreaterThan(100);expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(2);
 await list.focus();await page.keyboard.press('PageDown');await page.waitForTimeout(180);expect(await list.evaluate(n=>n.scrollTop)).toBeGreaterThan(220);
 await list.getByRole('checkbox').last().focus();await page.keyboard.press('Space');await expect(list.getByRole('checkbox').last()).toBeChecked();
 await expect(page.locator('#dapur')).toHaveAttribute('aria-hidden','false');
 await list.evaluate(n=>n.scrollTop=n.scrollHeight);await page.mouse.move(box.x+100,box.y+100);const boundary=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,180);await page.waitForTimeout(180);expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(boundary);
});
