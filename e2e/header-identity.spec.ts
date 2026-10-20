import {test,expect} from '@playwright/test';

test('culinary identity opens real application information and remains clear beside desktop navigation',async({page})=>{
 for(const width of [1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/');await page.locator('[data-deck-ready=true]').waitFor();
  const badge=page.getByRole('link',{name:'Tentang RasaNusantara',exact:true});
  await expect(badge).toHaveAttribute('href','/tentang');await expect(badge).toContainText('Nusantara');await expect(badge).toContainText('Tentang');await expect(badge).toBeInViewport();
  const menu=(await page.locator('.site-menu').boundingBox())!,box=(await badge.boundingBox())!;expect(menu.x+menu.width).toBeLessThanOrEqual(box.x);
  const last=page.getByRole('link',{name:'Buka bab: Panduan',exact:true});await last.click();await expect(last).toHaveAttribute('aria-current','step');
  await badge.focus();await expect(badge).toBeFocused();await badge.press('Enter');
  await expect(page.getByRole('heading',{name:'Dari dapur, ke cerita.',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Resep & sumber',exact:true})).toBeVisible();await expect.poll(async()=>{const back=await page.locator('.about-page .back').boundingBox(),header=await page.locator('.site-header').boundingBox();return Boolean(back&&header&&back.y>=header.y+header.height);}).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.journal-emblem')).toBeHidden();
 await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('button',{name:'Dapur',exact:true}).click();await page.getByRole('link',{name:'Tentang resep & sumber',exact:true}).click();await expect(page.getByRole('heading',{name:'Dari dapur, ke cerita.',exact:true})).toBeVisible();
});
