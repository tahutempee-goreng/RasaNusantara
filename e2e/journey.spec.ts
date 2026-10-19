import { test, expect } from '@playwright/test';
test('pantry → recommendations → recipe → cooking reload and completion; Advisor keeps recipe context', async ({ page }) => {
  await page.goto('/'); await page.getByRole('link', { name: 'Cari dari bahan saya' }).click();
  await page.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true }).check(); await page.getByRole('checkbox', { name: 'Tepung tapioka', exact: true }).check();
   await expect(page.getByRole('heading', { name: 'Tekwan', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Lihat resep' }).first().click(); await page.getByRole('link', { name: 'Mulai Cooking Mode' }).click();
  await page.getByRole('button', { name: 'Langkah berikutnya' }).click(); await expect(page.getByRole('heading', { name: 'Campur adonan' })).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Lanjutkan progres' }).click(); await expect(page.getByRole('heading', { name: 'Campur adonan' })).toBeVisible();
  await expect(page.locator('.advisor-context')).toContainText('Tekwan'); await expect(page.getByRole('heading', { name: 'Campur adonan' })).toBeVisible();
  await page.getByRole('button', { name: 'Langkah berikutnya' }).click(); await page.getByRole('button', { name: 'Langkah berikutnya' }).click(); await page.getByRole('button', { name: 'Selesaikan memasak' }).click(); await expect(page.getByRole('heading', { name: 'Dapur hari ini, tuntas.' })).toBeVisible();
});
test('API validation and draft catalog gate', async ({ request }) => {
  const bad = await request.post('/api/match', { data: { dishType: 'berkuah', mainIngredientId: null, ingredientIds: [] } }); expect(bad.status()).toBe(400);
  const unknown = await request.post('/api/match', { data: { dishType: 'berkuah', mainIngredientId: null, ingredientIds: ['unlisted'] } }); expect(unknown.status()).toBe(422);
  const huge = await request.post('/api/match', { data: 'x'.repeat(9000) }); expect(huge.status()).toBe(413);
});
test('corrupt storage recovers and unchecking pantry survives reload', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => { localStorage.setItem('rn:wizard', '{bad'); localStorage.setItem('rn:cook:tekwan-contoh', '{bad'); }); await page.goto('/cari');
  const fish = page.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true }); await fish.check(); await fish.uncheck(); await page.reload(); await expect(fish).not.toBeChecked(); await expect(page.locator('.matcher-empty')).toBeVisible();
  await page.goto('/masak/tekwan-contoh'); await expect(page.getByRole('heading', { name: 'Siapkan kaldu' })).toBeVisible();
});
test('all core views fit mobile, tablet and desktop widths', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('rn:wizard', JSON.stringify({ version: 1, input: { dishType: 'berkuah', mainIngredientId: null, ingredientIds: ['tenggiri', 'tapioka'] } })));
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/cari', '/hasil', '/resep/tekwan-contoh', '/masak/tekwan-contoh']) {
      await page.goto(path); await expect(page.locator('h1')).toBeVisible(); await expect(page.getByText('Menyiapkan dapur…')).toHaveCount(0);
      if (path === '/hasil') await expect(page.getByRole('heading', { name: 'Tekwan', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (path === '/') await page.screenshot({ path: '../previews/app-' + width + '.png', fullPage: true });
    }
  }
});
test('network fallback preserves results and stale cooking version restarts safely', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('rn:wizard', JSON.stringify({ version: 1, input: { dishType: 'berkuah', mainIngredientId: null, ingredientIds: ['tenggiri', 'tapioka'] } }));
    localStorage.setItem('rn:cook:tekwan-contoh', JSON.stringify({ version: 1, recipeId: 'tekwan-contoh', recipeVersion: 99, step: 999, done: false }));
  });
  await page.route('**/api/match', route => route.abort()); await page.goto('/hasil'); await expect(page.getByRole('status')).toContainText('dihitung di perangkat'); await expect(page.getByRole('heading', { name: 'Tekwan', exact: true })).toBeVisible();
  await page.goto('/masak/tekwan-contoh'); await expect(page.getByRole('status')).toContainText('Progres lama direset'); await expect(page.getByRole('heading', { name: 'Siapkan kaldu' })).toBeVisible();
});
