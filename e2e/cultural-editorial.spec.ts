import {test,expect} from '@playwright/test';

test('hornbill wings stay in clear sky at laptop, tablet and phone sizes throughout their cycle',async({page})=>{
 test.setTimeout(120000);
 for(const [width,height] of [[1920,1080],[1536,864],[1440,900],[1366,768],[1280,720],[1024,768],[980,357],[844,390],[768,1024],[700,800],[630,416],[390,844],[320,640]]){
  await page.setViewportSize({width,height});await page.goto('/');await page.locator('[data-deck-ready=true]').waitFor();
  for(const time of [0,700,1400,2100,2800]){
   const g=await page.evaluate(time=>{const bird=document.querySelector<HTMLElement>('[data-hornbill]')!;for(const a of bird.getAnimations({subtree:true})){a.pause();a.currentTime=time;}const rect=(e:Element)=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};};const parts=Array.from(bird.querySelectorAll('span')).map(rect);const bounds={x:Math.min(...parts.map(r=>r.x)),y:Math.min(...parts.map(r=>r.y)),right:Math.max(...parts.map(r=>r.right)),bottom:Math.max(...parts.map(r=>r.bottom))};const title=document.getElementById('journal-title')!;const titleRects=Array.from(title.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).flatMap(n=>{const range=document.createRange();range.selectNodeContents(n);return Array.from(range.getClientRects()).map(r=>({x:r.x,y:r.y,right:r.right,bottom:r.bottom}));});const titleHit=titleRects.some(r=>Math.min(r.right,bounds.right)>Math.max(r.x,bounds.x)&&Math.min(r.bottom,bounds.bottom)>Math.max(r.y,bounds.y));const obstacles=[document.querySelector('.site-header')!,document.querySelector('[aria-label="Catatan sampul"]')!].map(rect);return{bounds,overlap:[...obstacles.map(r=>Math.min(r.right,bounds.right)>Math.max(r.x,bounds.x)&&Math.min(r.bottom,bounds.bottom)>Math.max(r.y,bounds.y)),titleHit],overflow:document.documentElement.scrollWidth>innerWidth+1};},time);
   expect(g.overlap,`${width}x${height}, phase ${time}, ${JSON.stringify(g.bounds)}`).toEqual([false,false,false]);expect(g.bounds.x).toBeGreaterThanOrEqual(0);expect(g.bounds.right).toBeLessThanOrEqual(width);expect(g.bounds.y).toBeGreaterThanOrEqual(0);expect(g.overflow).toBe(false);
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();expect(await page.locator('[data-hornbill]').evaluate(e=>e.getAnimations({subtree:true}).length)).toBe(0);
});

test('all stories are readable, sourced and reachable without resetting portions',async({page,request})=>{
 const catalog=await(await request.get('/api/catalog')).json();
 for(const recipe of catalog.recipes){await page.goto('/resep/'+recipe.slug+'?porsi=2');await page.getByRole('tab',{name:'Cerita & sumber',exact:true}).click();const story=page.locator('#cerita-resep');await expect(story.locator('.culture-chapters>section')).toHaveCount(3);await expect(story).toContainText(recipe.culture.sections[2].title);expect((await story.innerText()).split(/\s+/).length).toBeGreaterThan(180);await expect(story.locator('.culture-reference a').first()).toHaveAttribute('href',/^https:/);await page.getByRole('tab',{name:'Bahan & takaran',exact:true}).click();await expect(page.getByLabel('Takaran untuk')).toHaveValue('2');}
});

test('single-page cultural introduction has working anchors, sources, credits and compact privacy sections',async({page})=>{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){await page.setViewportSize({width,height});await page.goto('/tentang');await expect(page.getByRole('heading',{name:'Dari dapur, ke cerita.',exact:true})).toBeVisible();await expect(page.locator('.about-montage img')).toHaveCount(2);for(const id of ['jejak-rasa','resep-sumber','kredit-visual','data-dapur']){await page.locator('.about-contents a[href="#'+id+'"]').click();await expect.poll(()=>page.locator('#'+id).evaluate(e=>e.getBoundingClientRect().top>=70&&e.getBoundingClientRect().top<innerHeight)).toBe(true);}expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.locator('.about-regions>details>summary').first().click();await expect(page.locator('.about-region-recipes .source-recipe').first()).toBeVisible();await expect(page.locator('#data-dapur')).toContainText('Google Gemini');await expect(page.locator('#data-dapur dl>div')).toHaveCount(4);}
 await page.goto('/tentang#kredit-visual');await expect.poll(()=>page.locator('#kredit-visual').evaluate(e=>e.getBoundingClientRect().top>=70&&e.getBoundingClientRect().top<innerHeight)).toBe(true);
});
