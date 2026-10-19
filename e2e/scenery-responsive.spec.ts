import { test, expect } from '@playwright/test';
import path from 'node:path';

for (const [width, height] of [[360,800],[390,844],[768,900],[1440,900],[1916,900],[844,390]]) {
  test(`scenery keeps its proportions and covers both edges at ${width}x${height}`, async ({page}) => {
    await page.setViewportSize({width,height});
    await page.goto('/');
    await page.locator('[data-deck-ready=true]').waitFor();
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [id, suffix] of [['sampul','village-v2'],['resep-pilihan','night-v2'],['panduan','night-v2']]) {
      const panel=page.locator('#'+id);
      await page.evaluate(id => {
        const panel=document.getElementById(id)!;
        const root=document.querySelector<HTMLElement>('[data-deck-ready]')!;
        window.scrollTo({top:scrollY+root.getBoundingClientRect().top+Number(panel.dataset.start)+Number(panel.dataset.overflow)+1,behavior:'instant'});
      }, id);
      const art=panel.locator(`img[src*="${suffix}"]`);
      await expect.poll(()=>art.evaluate((el:HTMLImageElement)=>el.complete && el.naturalWidth>0)).toBe(true);
      await page.waitForTimeout(80);
      for (const part of [0,.55,0]) {
        await page.evaluate(({id,part})=>{
          const panel=document.getElementById(id)!;
          const root=document.querySelector<HTMLElement>('[data-deck-ready]')!;
          window.scrollTo({top:scrollY+root.getBoundingClientRect().top+Number(panel.dataset.start)+Number(panel.dataset.overflow)+(id==='panduan'?0:innerHeight*(.6+1.25*part))+1,behavior:'instant'});
        },{id,part});
        await page.waitForTimeout(80);
        const geometry=await art.evaluate((el:HTMLImageElement)=>{
          const r=el.getBoundingClientRect(), p=el.closest('[data-journal-chapter]')!.getBoundingClientRect();
          return {ratio:r.width/r.height,native:el.naturalWidth/el.naturalHeight,left:r.left,right:r.right,bottom:r.bottom-p.bottom,overflow:document.documentElement.scrollWidth>innerWidth};
        });
        expect(geometry.ratio).toBeCloseTo(geometry.native,2);
        expect(geometry.left).toBeLessThanOrEqual(0);
        expect(geometry.right).toBeGreaterThanOrEqual(width);
        expect(geometry.bottom).toBeGreaterThanOrEqual(-1);
        expect(geometry.overflow).toBe(false);
        if(part===.55 || id==='panduan') await page.screenshot({path:path.resolve('../previews',`usability-v3-${width}x${height}-${id}-${part===.55?'transition':'bottom'}.png`)});
      }
      if(id==='sampul') {
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        await page.waitForTimeout(80);
        await page.screenshot({path:path.resolve('../previews',`usability-v3-${width}x${height}-cover.png`)});
        const button=panel.getByRole('link',{name:'Cari dari bahan saya',exact:true});
        await button.scrollIntoViewIfNeeded();
        await expect.poll(()=>button.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
      }
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    const art=page.locator('#sampul img[src*="village-v2"]');
    expect(await art.evaluate(el=>getComputedStyle(el).transform)).toBe('none');
    expect(errors).toEqual([]);
  });
}

