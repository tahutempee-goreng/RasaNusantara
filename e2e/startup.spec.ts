import {test,expect} from '@playwright/test';

test('startup owns initial entry until real catalogue readiness, with no exposed navigation or empty panel',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();let requests=0,release=()=>{};const gate=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/catalog',async route=>{requests++;await gate;await route.fulfill({json:catalog});});await page.goto('/');
 await expect(page.locator('.startup-screen')).toBeVisible();await expect(page.locator('.startup-screen')).toContainText('Menyiapkan cerita dan rasa');await expect(page.locator('.application-shell')).toHaveAttribute('inert','');await expect(page.getByRole('navigation',{name:'Navigasi utama'})).toHaveCount(0);await expect(page.locator('main .panel')).toHaveCount(0);
 release();await expect(page.locator('.startup-screen')).toHaveCount(0);await expect(page.getByRole('link',{name:'RasaNusantara — Beranda',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');await expect(page.locator('.brand svg')).toHaveCount(0);
 await page.getByRole('link',{name:'Cari dari bahan saya',exact:true}).click();await expect(page.getByLabel('Cari bahan',{exact:true})).toBeVisible();await expect(page.locator('.startup-screen')).toHaveCount(0);expect(requests).toBe(1);
});

test('failed catalogue has an accessible retry and successful retry opens the app',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();let requests=0;await page.route('**/api/catalog',route=>route.fulfill(++requests===1?{status:503,json:{error:'unavailable'}}:{json:catalog}));await page.goto('/resep/rendang?porsi=2');await expect(page.locator('.startup-screen[role=alert]')).toContainText('Dapur belum bisa dibuka');const retry=page.getByRole('button',{name:'Coba lagi',exact:true});await retry.focus();await retry.press('Enter');await expect(page.locator('.startup-screen')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Rendang',exact:true})).toBeVisible();await expect(page.getByLabel('Takaran untuk')).toHaveValue('2');expect(requests).toBe(2);
});

test('a stalled catalogue has a bounded wait rather than an endless splash',async({page})=>{
 await page.clock.install();await page.route('**/api/catalog',()=>new Promise(()=>{}));const fetching=page.waitForRequest('**/api/catalog');await page.goto('/',{waitUntil:'domcontentloaded'});await fetching;await expect(page.locator('.startup-screen')).toBeVisible();await page.clock.fastForward(12001);await expect(page.locator('.startup-screen[role=alert]')).toContainText('terlalu lama');await expect(page.getByRole('button',{name:'Coba lagi',exact:true})).toBeEnabled();
});

test('reduced motion keeps the startup identity readable without moving steam',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.route('**/api/catalog',()=>new Promise(()=>{}));await page.goto('/');await expect(page.locator('.startup-screen h1')).toHaveText('RasaNusantara');expect(await page.locator('.startup-steam').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
