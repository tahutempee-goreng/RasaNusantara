import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route('**/api/advisor',async route=>{if(route.request().method()==='GET')await route.fulfill({json:{enabled:true}});else await route.fulfill({json:{status:'ok',answer:'Saran AI: gunakan api kecil dan periksa tekstur daging secara berkala.',sources:[]}});});});
test('advisor sends actual recipe, portions, selected pantry and current step and treats answer as text',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('rn:wizard',JSON.stringify({version:1,input:{regionId:'padang',dishType:'kering',mainIngredientId:null,ingredientIds:['sapi','garam']}})));
 await page.goto('/masak/rendang?porsi=2');await page.getByRole('button',{name:'Langkah berikutnya'}).click();await expect(page.locator('.advisor-context')).toContainText('Rendang · 2 porsi · Langkah 2');
 await page.getByRole('textbox',{name:'Pertanyaan tentang resep'}).fill('Daging masih keras');const sent=page.waitForRequest(r=>r.url().endsWith('/api/advisor')&&r.method()==='POST');await page.getByRole('button',{name:'Tanyakan ke AI'}).click();const body=(await sent).postDataJSON();expect(body).toMatchObject({recipeId:'rendang',stepIndex:1,portions:2,ingredientIds:['sapi','garam'],question:'Daging masih keras'});
await expect(page.locator('.advisor-answer')).toContainText('gunakan api kecil');await expect(page.locator('.advisor-answer')).toBeFocused();
 await page.getByRole('button',{name:'Langkah berikutnya'}).click();await expect(page.locator('.advisor-answer')).toHaveCount(1);await expect(page.locator('.advisor-context')).toContainText('Langkah 3');
});
test('quota error preserves question and cooking controls remain usable',async({page})=>{
 await page.route('**/api/advisor',async route=>{await route.fulfill(route.request().method()==='GET'?{json:{enabled:true}}:{status:503,json:{status:'degraded',message:'Kuota Gemini sedang habis atau dibatasi.'}})});
 await page.goto('/masak/rendang');const question=page.getByRole('textbox',{name:'Pertanyaan tentang resep'});await question.fill('Bagaimana mengecek teksturnya?');await page.getByRole('button',{name:'Tanyakan ke AI'}).click();await expect(page.locator('.advisor').getByRole('alert')).toContainText('Kuota');await expect(question).toHaveValue('Bagaimana mengecek teksturnya?');await page.getByRole('button',{name:'Langkah berikutnya'}).click();await expect(page.getByRole('heading',{name:'Mulai memasak',exact:true})).toBeVisible();
});
test('answer from previous step is discarded and cancellation restores submit',async({page})=>{
 await page.route('**/api/advisor',async route=>{if(route.request().method()==='GET')return route.fulfill({json:{enabled:true}});await new Promise(r=>setTimeout(r,600));await route.fulfill({json:{status:'ok',answer:'Jawaban untuk langkah lama',sources:[]}}).catch(()=>{});});
 await page.goto('/masak/rendang');await page.getByRole('textbox',{name:'Pertanyaan tentang resep'}).fill('Bantu saya');await page.getByRole('button',{name:'Tanyakan ke AI'}).click();await page.getByRole('button',{name:'Langkah berikutnya'}).click();await page.waitForTimeout(800);await expect(page.locator('.advisor-answer')).toHaveCount(0);await expect(page.getByRole('button',{name:'Tanyakan ke AI'})).toBeEnabled();await page.getByRole('button',{name:'Tanyakan ke AI'}).click();await page.getByRole('button',{name:'Batalkan',exact:true}).click();await expect(page.getByRole('button',{name:'Tanyakan ke AI'})).toBeEnabled();
});
test('disabled advisor gives honest fallback and API validates without contacting Gemini',async({page,request})=>{
 await page.route('**/api/advisor',route=>route.fulfill({json:{enabled:false}}));await page.goto('/masak/rendang');await expect(page.locator('.advisor')).toContainText('belum tersambung');await expect(page.getByRole('textbox',{name:'Pertanyaan tentang resep'})).toHaveCount(0);
 const status=await(await request.get('/api/advisor')).json();expect(Object.keys(status)).toEqual(['enabled']);
 for(const [body,code] of [[{recipeId:'rendang',ingredientIds:[],question:'Bantu',stepIndex:999},400],[{recipeId:'unknown',ingredientIds:[],question:'Bantu'},404],[{recipeId:'rendang',ingredientIds:['unknown'],question:'Bantu'},422],[{recipeId:'rendang',ingredientIds:[],question:''},400]] as const){expect((await request.post('/api/advisor',{data:body})).status()).toBe(code);}
 expect((await request.post('/api/advisor',{headers:{origin:'https://foreign.example'},data:{recipeId:'rendang',ingredientIds:[],question:'Bantu'}})).status()).toBe(403);
});
