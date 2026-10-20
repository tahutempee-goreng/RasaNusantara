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


test('first-tab typing reserves space, waits for readiness, exits once and refresh skips the intro',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();let release=()=>{};let gate=new Promise<void>(r=>release=r);
 await page.clock.install({time:new Date('2026-10-20T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-20T00:00:00.001Z'));
 await page.route('**/api/catalog',async route=>{await gate;await route.fulfill({json:catalog});});await page.goto('/cari');
 const screen=page.locator('.startup-screen'),typed=page.locator('.startup-typed');await expect(screen).toHaveAttribute('data-intro','first');await expect(typed).toHaveText('');
 const before=(await page.locator('.startup-message').boundingBox())!;
 await page.clock.runFor(200);await expect(typed).toHaveText('M');await page.clock.runFor(400);await expect(typed).toHaveText('Menyiapkan ');
 const during=(await page.locator('.startup-message').boundingBox())!;expect(during).toEqual(before);
 await expect(page.locator('.startup-announcement')).toHaveText('Menyiapkan cerita dan rasa…');await expect(typed).toHaveAttribute('aria-hidden','true');
 await page.clock.runFor(800);await expect(typed).toHaveText('Menyiapkan cerita dan rasa…');await expect(typed).toHaveAttribute('data-typing','false');await expect(screen).toHaveAttribute('data-state','loading');
 release();await expect(screen).toHaveAttribute('data-ready','true');await page.clock.runFor(100);await expect(screen).toHaveAttribute('data-state','loading');await page.clock.runFor(60);await expect(screen).toHaveAttribute('data-state','leaving');await expect(page.locator('.application-shell')).toHaveAttribute('inert','');await page.clock.runFor(250);await expect(screen).toHaveCount(0);expect(await page.evaluate(()=>sessionStorage.getItem('rn:intro:v1:seen'))).toBe('1');expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 gate=new Promise<void>(r=>release=r);await page.reload();await expect(screen).toHaveAttribute('data-intro','seen');await expect(typed).toHaveText('Menyiapkan cerita dan rasa…');release();await expect(screen).toHaveCount(0);
});

test('fast readiness still gives the first entrance its minimum duration and storage is marked only after entry',async({page})=>{
 await page.clock.install({time:new Date('2026-10-20T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-20T00:00:00.001Z'));await page.goto('/cari');const screen=page.locator('.startup-screen');await expect(screen).toHaveAttribute('data-ready','true');expect(await page.evaluate(()=>sessionStorage.getItem('rn:intro:v1:seen'))).toBeNull();await page.clock.runFor(1500);await expect(screen).toHaveAttribute('data-state','loading');await page.clock.runFor(60);await expect(screen).toHaveAttribute('data-state','leaving');await page.clock.runFor(250);await expect(screen).toHaveCount(0);
});

test('catalogue failure interrupts typing immediately without marking successful entry',async({page})=>{
 await page.clock.install({time:new Date('2026-10-20T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-20T00:00:00.001Z'));await page.route('**/api/catalog',r=>r.fulfill({status:503,json:{error:'unavailable'}}));await page.goto('/');await expect(page.locator('.startup-screen[role=alert]')).toContainText('Dapur belum bisa dibuka');await expect(page.getByRole('button',{name:'Coba lagi',exact:true})).toBeEnabled();await expect(page.locator('.startup-typed')).toHaveCount(0);expect(await page.evaluate(()=>sessionStorage.getItem('rn:intro:v1:seen'))).toBeNull();await page.clock.runFor(2000);await expect(page.locator('.startup-screen[role=alert]')).toBeVisible();
});

test('reduced motion completes without a typing or exit delay and can be enabled during entry',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();let release=()=>{};const gate=new Promise<void>(r=>release=r);await page.route('**/api/catalog',async route=>{await gate;await route.fulfill({json:catalog});});await page.clock.install({time:new Date('2026-10-20T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-20T00:00:00.001Z'));await page.goto('/cari');await expect(page.locator('.startup-screen')).toHaveAttribute('data-intro','first');await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.startup-screen')).toHaveAttribute('data-intro','reduced');await expect(page.locator('.startup-typed')).toHaveText('Menyiapkan cerita dan rasa…');expect(await page.locator('.startup-bowl').evaluate(n=>n.getAnimations({subtree:true}).length)).toBe(0);release();await expect(page.locator('.startup-screen')).toHaveCount(0);
});

test('denied session storage safely uses document memory without breaking entry or internal navigation',async({page})=>{
 await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(this===sessionStorage)throw new DOMException('Blocked','SecurityError');return original.call(this,key,value);};const get=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(this===sessionStorage)throw new DOMException('Blocked','SecurityError');return get.call(this,key);};});await page.goto('/cari');await expect(page.locator('.startup-screen')).toHaveCount(0);await page.getByRole('link',{name:'RasaNusantara — Beranda',exact:true}).click();await expect(page.getByRole('heading',{name:/RASA DARI NUSANTARA/})).toBeVisible();await expect(page.locator('.startup-screen')).toHaveCount(0);expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
});
