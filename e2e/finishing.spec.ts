import {test,expect,type Page} from '@playwright/test';
async function chapter(page:Page,name:string){await page.getByRole('link',{name:'Buka bab: '+name,exact:true}).click();await expect(page.getByRole('link',{name:'Buka bab: '+name,exact:true})).toHaveAttribute('aria-current','step');}

test('footer has useful destinations and centralizes recipe and image credits',async({page})=>{
 await page.goto('/cari');const footer=page.getByRole('contentinfo');await footer.scrollIntoViewIfNeeded();
 await expect(footer.getByRole('navigation',{name:'Jelajahi RasaNusantara'})).toBeVisible();await expect(footer).not.toContainText('Versi awal');
 await footer.getByRole('link',{name:'Tentang & kredit'}).click();await expect(page.getByRole('heading',{name:'Dari dapur, ke cerita.'})).toBeVisible();
 await expect(page.getByRole('link',{name:'CC BY 3.0',exact:true})).toHaveAttribute('href','https://creativecommons.org/licenses/by/3.0/');
 await expect(page.locator('#kredit-visual')).toContainText('Midori');await expect(page.locator('#kredit-visual')).toContainText('AI');
 await page.getByText('Daftar gambar hidangan',{exact:true}).click();await expect(page.locator('#kredit-visual li')).toHaveCount(13);
 await page.getByRole('link',{name:'Kembali ke atas'}).click();await expect(page.getByRole('heading',{level:1})).toBeInViewport();
});

test('carousel visibly lifts sheets, coalesces fast clicks and preserves recipe synchronization',async({page})=>{
 await page.goto('/');await chapter(page,'Resep');const scene=page.locator('#resep-pilihan');
 await scene.getByRole('button',{name:'Resep berikutnya',exact:true}).click();await expect(scene.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','true');
 await expect(scene.locator('[data-outgoing=true]')).toHaveAttribute('aria-hidden','true');
 expect(await scene.locator('[data-outgoing=true] [data-polaroid]').evaluate(el=>getComputedStyle(el.parentElement!,'::before').content)).toBe('none');
 await expect.poll(()=>scene.locator('[data-outgoing=true] [data-polaroid]').evaluate(el=>el.getAnimations().length)).toBeGreaterThan(0);
 await scene.getByRole('button',{name:'Resep berikutnya',exact:true}).click();await scene.getByRole('button',{name:'Tampilkan resep Coto Makassar'}).click();
 await expect(scene.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','false');await expect(scene.getByText('04 / 04',{exact:true})).toBeVisible();
 await expect(scene.locator('[data-outgoing]')).toHaveCount(0);await expect(scene.getByRole('link',{name:'BUKA RESEP'})).toHaveAttribute('href','/resep/coto-makassar');
 await scene.getByRole('button',{name:'Resep sebelumnya'}).focus();await page.keyboard.press('Enter');await expect(scene.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','false');await expect(scene.getByRole('heading',{name:'Rawon',exact:true})).toBeVisible();
 await scene.getByRole('button',{name:'Resep berikutnya'}).click();await chapter(page,'Dapur');await expect(scene.locator('[data-outgoing]')).toHaveCount(0);
});

test('night sky loads only when visible, plays silently and pauses outside its chapter',async({page})=>{
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/videos/night-sky'))requests.push(r.url());});
 await page.goto('/');await expect(page.locator('[data-night-sky] video')).toHaveCount(0);expect(requests).toHaveLength(0);
 await chapter(page,'Panduan');const video=page.locator('[data-night-sky] video');await expect.poll(async()=>{const state=await video.evaluate((v:HTMLVideoElement)=>({time:v.currentTime,paused:v.paused,width:v.videoWidth,ready:v.readyState,error:v.error?.message,rect:v.getBoundingClientRect().toJSON(),visibility:getComputedStyle(v).visibility}));return state.time>0&&!state.paused&&state.width>0;},{message:'Night video should start',timeout:10000}).toBe(true);
 expect(await video.evaluate((v:HTMLVideoElement)=>v.muted&&v.loop&&v.playsInline&&!v.controls)).toBe(true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused),{message:'Night video should pause'}).toBe(true);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused),{message:'Night video should resume'}).toBe(true);
 await chapter(page,'Sampul');await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused),{message:'Night video should pause'}).toBe(true);
});

test('portrait night sky uses only the mobile clip and remains behind clickable content',async({page})=>{
 await page.setViewportSize({width:390,height:844});const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/videos/night-sky'))requests.push(r.url());});await page.goto('/');await chapter(page,'Panduan');
 const video=page.locator('[data-night-sky] video');await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.videoHeight>v.videoWidth&&!v.paused)).toBe(true);await expect(video).toHaveAttribute('src','/videos/night-sky-mobile.mp4');expect(requests.some(url=>url.endsWith('/night-sky.mp4'))).toBe(false);
 await page.locator('#panduan').getByRole('link',{name:'Mulai pilih bahan'}).click();await expect(page).toHaveURL(/\/cari$/);
});

test('reduced motion keeps the night poster without a video download and swaps recipes immediately',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/videos/night-sky'))requests.push(r.url());});await page.goto('/');await page.locator('#panduan').scrollIntoViewIfNeeded();await expect(page.locator('[data-night-sky] img')).toBeVisible();await expect(page.locator('[data-night-sky] video')).toHaveCount(0);expect(requests).toHaveLength(0);
 const scene=page.locator('#resep-pilihan');await scene.scrollIntoViewIfNeeded();await scene.getByRole('button',{name:'Resep berikutnya'}).click();await expect(scene.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','false');await expect(scene.getByRole('heading',{name:'Rendang',exact:true})).toBeVisible();await expect(scene.locator('[data-outgoing]')).toHaveCount(0);
});

test('failed night clip retains the poster and data saving never requests the clip',async({page})=>{
 await page.route('**/videos/night-sky.mp4',route=>route.abort());await page.goto('/');await chapter(page,'Panduan');await expect(page.locator('[data-night-sky] video')).toHaveCount(0);await expect(page.locator('[data-night-sky] img')).toBeVisible();await expect(page.locator('#panduan').getByRole('link',{name:'Mulai pilih bahan'})).toBeVisible();
 await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true}}));await page.goto('/');await chapter(page,'Panduan');await expect(page.locator('[data-night-sky] video')).toHaveCount(0);
});


test('carousel image failure keeps the correct recipe and an honest image placeholder',async({page})=>{
 await page.route('**/images/recipes/rendang.webp',route=>route.abort());await page.goto('/');await chapter(page,'Resep');await page.getByRole('button',{name:'Resep berikutnya',exact:true}).click();await expect(page.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','false');await expect(page.locator('#resep-pilihan').getByText('Gambar belum tersedia',{exact:true})).toBeVisible();await expect(page.locator('#resep-pilihan').getByRole('link',{name:'BUKA RESEP'})).toHaveAttribute('href','/resep/rendang');
});
