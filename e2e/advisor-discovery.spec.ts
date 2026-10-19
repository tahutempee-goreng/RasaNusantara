import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route('**/api/advisor',route=>route.fulfill({json:route.request().method()==='GET'?{enabled:true}:{status:'ok',answer:'**Periksa kondisi masakan:**\n\n1. Gunakan petunjuk pada langkah aktif.\n2. Ceritakan kondisi yang kamu lihat.\n\n<img src=x onerror=alert(1)>',sources:[]}}));});
test('recipe advertises AI and opens Cooking Mode with the selected portions',async({page})=>{
 await page.goto('/resep/rendang?porsi=2');const entry=page.getByRole('link',{name:/Masak ditemani AI Teman Dapur/});await expect(entry).toBeVisible();await expect(entry).toHaveAttribute('href','/masak/rendang?porsi=2#ai-teman-dapur');await entry.click();await expect(page.getByRole('heading',{name:'AI Teman Dapur',exact:true})).toBeVisible();await expect(page.locator('.advisor-context')).toContainText('Rendang · 2 porsi');
});
test('AI entry is visible at the start of cooking and examples fill without sending',async({page})=>{
 await page.setViewportSize({width:390,height:844});let posts=0;page.on('request',request=>{if(request.url().endsWith('/api/advisor')&&request.method()==='POST')posts++});await page.goto('/masak/rendang');const entry=page.getByRole('link',{name:'Tanya AI',exact:true});await expect(entry).toBeVisible();expect((await entry.boundingBox())!.y).toBeLessThan(844);await expect(page.getByRole('button',{name:'Besar api'})).toBeEnabled();await entry.click();const question=page.getByRole('textbox',{name:'Pertanyaan tentang resep'});await expect(question).toBeFocused();await page.getByRole('button',{name:'Besar api'}).click();await expect(question).toHaveValue(/Siapkan bumbu/);await expect(question).toBeFocused();expect(posts).toBe(0);
 await page.getByRole('button',{name:'Langkah berikutnya'}).click();await page.getByRole('button',{name:'Tanda sudah tepat'}).click();await expect(question).toHaveValue(/Mulai memasak/);expect(posts).toBe(0);
});
test('AI answers format lists and emphasis safely and identify the submitted question',async({page})=>{
 await page.goto('/masak/rendang');await page.getByRole('button',{name:'Besar api'}).click();await page.getByRole('button',{name:'Tanyakan ke AI'}).click();const answer=page.locator('.advisor-answer');await expect(answer.locator('.advice-body strong')).toHaveText('Periksa kondisi masakan:');await expect(answer.locator('.advice-body ol li')).toHaveCount(2);expect(await answer.locator('.advice-body ol').evaluate(node=>getComputedStyle(node).listStyleType)).toBe('decimal');await expect(answer.locator('.advice-body img')).toHaveCount(0);await expect(answer.locator('.advice-body')).toContainText('<img src=x onerror=alert(1)>');await expect(answer.locator('.advisor-asked')).toContainText('Siapkan bumbu');await expect(answer).toBeFocused();await page.getByRole('button',{name:'Bahan pengganti'}).click();await expect(answer).toHaveCount(1);
});

test('direct AI link lands on the panel after async catalog loading',async({page})=>{
 await page.goto('/masak/rendang?porsi=2#ai-teman-dapur');await expect(page.getByRole('button',{name:'Besar api'})).toBeEnabled();await expect(page.getByRole('heading',{name:'AI Teman Dapur',exact:true})).toBeInViewport();
});
test('AI banner, context, examples and helper text meet text contrast',async({page})=>{
 await page.goto('/masak/rendang');await page.getByRole('button',{name:'Besar api'}).click();await page.mouse.move(0,0);
 const values=await page.locator('.ai-advisor').evaluate(root=>{
  const rgb=(value:string)=>(value.match(/[\d.]+/g)||[]).map(Number);const lum=(color:number[])=>color.slice(0,3).map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  return [...root.querySelectorAll<HTMLElement>('.advisor-banner h2,.advisor-banner p,.advisor-context,.advisor-prompts button,.advisor-clear,.advisor-history-heading h3')].map(node=>{const foreground=rgb(getComputedStyle(node).color);let parent:HTMLElement|null=node,background=[252,249,240];while(parent){const candidate=rgb(getComputedStyle(parent).backgroundColor);if(candidate.length===3||candidate[3]===1){background=candidate;break}parent=parent.parentElement;}const a=lum(foreground),b=lum(background);return {text:node.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
 });for(const value of values)expect(value.ratio,value.text||'AI text').toBeGreaterThanOrEqual(4.5);
});
