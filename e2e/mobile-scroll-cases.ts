import {test,expect} from '@playwright/test';
export function registerMobileScrollTests(){
  test('touch pages use real document flow, preserve chapter links and avoid scroll-driven style writes',async({page})=>{
   test.setTimeout(90000);
   for(const [width,height] of [[390,844],[844,390]]){
    await page.setViewportSize({width,height});await page.goto('/');await page.locator('[data-scroll-mode=native]').waitFor();
    const rail=page.getByRole('navigation',{name:'Bab perjalanan'});const railBox=(await rail.boundingBox())!;expect(railBox.x).toBeGreaterThan(width-60);expect(railBox.width).toBeLessThanOrEqual(48);expect(await rail.evaluate(n=>getComputedStyle(n).flexDirection)).toBe('column');
    expect(await page.locator('[data-paper-stage]').evaluate(e=>getComputedStyle(e).position)).not.toBe('sticky');
    for(const chapter of ['Sampul','Cerita','Resep','Dapur','Panduan']){const link=page.getByRole('link',{name:'Buka bab: '+chapter,exact:true});const box=(await link.boundingBox())!;expect(box.y).toBeGreaterThanOrEqual((await page.locator('.site-header').boundingBox())!.height);expect(box.y+box.height).toBeLessThanOrEqual(height-4);await expect.poll(()=>link.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);await link.tap();await expect(link).toHaveAttribute('aria-current','step');}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   }
   await page.setViewportSize({width:390,height:844});await page.getByRole('link',{name:'Buka bab: Dapur',exact:true}).tap();await expect(page.getByRole('link',{name:'Buka bab: Dapur',exact:true})).toHaveAttribute('aria-current','step');
   await page.evaluate(()=>scrollTo({top:scrollY+100,behavior:'instant'}));await page.waitForTimeout(200);const before=await page.evaluate(()=>scrollY);await page.setViewportSize({width:390,height:744});await page.waitForTimeout(250);expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(2);
   const writes=await page.evaluate(async()=>{let count=0;const root=document.querySelector('[data-scroll-mode=native]')!;const observer=new MutationObserver(records=>count+=records.filter(r=>r.attributeName==='style'&&(r.target as Element).matches('[data-journal-chapter]')).length);observer.observe(root,{attributes:true,subtree:true,attributeFilter:['style']});for(let i=0;i<8;i++){window.scrollBy({top:i%2?8:-8,behavior:'instant'});await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));}observer.disconnect();return count;});expect(writes).toBe(0);
   expect(await page.locator('[data-journal-chapter]').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).transform==='none'&&getComputedStyle(n).willChange==='auto'))).toBe(true);
  });
  test('touch ingredient controls and saved choices remain usable in native flow',async({page})=>{
   await page.goto('/#dapur');await page.locator('[data-scroll-mode=native]').waitFor();const region=page.getByRole('button',{name:'Jawa',exact:true});await region.tap();await expect(region).toHaveAttribute('aria-pressed','true');await page.getByRole('tab',{name:/^Bumbu/}).tap();const garlic=page.getByRole('checkbox',{name:'Bawang putih',exact:true});await garlic.tap();await expect(garlic).toBeChecked();await page.reload();await page.locator('[data-scroll-mode=native]').waitFor();await page.getByRole('tab',{name:/^Bumbu/}).tap();await expect(garlic).toBeChecked();
  });
  test('phone reduced motion and offscreen media remain safe',async({page})=>{
   await page.emulateMedia({reducedMotion:'reduce'});const videoRequests:string[]=[];page.on('request',r=>{if(/\.mp4(?:\?|$)/.test(r.url()))videoRequests.push(r.url());});await page.goto('/');await page.locator('[data-scroll-mode=reduced]').waitFor();await page.locator('#panduan').scrollIntoViewIfNeeded();await expect(page.locator('[data-night-sky] picture img')).toBeVisible();expect(await page.locator('[data-journal-chapter]').evaluateAll(nodes=>nodes.every(n=>!n.hasAttribute('inert')))).toBe(true);await page.waitForTimeout(300);expect(videoRequests).toEqual([]);
  });
}
