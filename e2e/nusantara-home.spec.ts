import { test, expect } from '@playwright/test';

test('home pantry computes real matches and continues into the recipe flow', async ({ page, request }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Buka bab: Dapur', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Buka bab: Dapur', exact: true })).toHaveAttribute('aria-current', 'step');
  const pantry = page.locator('.pantry-preview');
  await pantry.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true }).check();
  await pantry.getByRole('checkbox', { name: 'Tepung tapioka', exact: true }).check();
  expect(await page.locator('[data-paper-stage]').evaluate(node => node.scrollTop)).toBe(0);
  const response = await request.post('/api/match', { data: { dishType: 'berkuah', mainIngredientId: null, ingredientIds: ['tenggiri', 'tapioka'] } });
  const data = await response.json();
  const preview = page.getByRole('complementary', { name: 'Pratinjau kecocokan resep' });
  await expect(preview.getByRole('heading', { name: 'Tekwan' })).toBeVisible();
  await expect(preview.getByRole('img')).toHaveAttribute('aria-label', 'Kecocokan bahan ' + data.results[0].score + ' persen');
  await pantry.getByRole('button', { name: 'Lihat semua hasil' }).click();
  await expect(page).toHaveURL(/\/hasil$/);
  await expect(page.getByRole('heading', { name: 'Tekwan', exact: true })).toBeVisible();
});

test('region selection changes ingredients and never leaks another region result', async ({ page }) => {
  await page.goto('/cari');
  await page.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true }).check();
  await page.getByRole('button', { name: 'Padang / Minang', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: 'Ayam', exact: true })).toBeVisible();
  await expect(page.locator('.matcher-results')).not.toContainText('Tekwan');
  await page.getByRole('checkbox', { name: 'Ayam', exact: true }).check();
  await expect(page.locator('.live-match')).toContainText('Gulai Ayam');
  await page.getByRole('button', { name: 'Palembang', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Ikan tenggiri', exact: true })).toBeChecked();
  await expect(page.locator('.matcher-results')).toContainText('Tekwan');
});

test('navigation disclosures work with keyboard and mobile closes after navigation', async ({ page }) => {
  await page.goto('/');
  const region = page.getByRole('button', { name: 'Daerah', exact: true });
  await region.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: 'Jelajahi daerah Nusantara' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(region).toBeFocused();
  await expect(region).toHaveAttribute('aria-expanded', 'false');
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole('button', { name: 'Menu', exact: true });
  await menu.click();
  await page.getByRole('button', { name: 'Dapur', exact: true }).click();
  await page.getByRole('link', { name: 'Panduan Memasak', exact: true }).click();
  await expect(page.getByRole('link',{name:'Buka bab: Panduan',exact:true})).toHaveAttribute('aria-current','step');
  await expect(page.locator('#cooking-guide')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#cooking-guide')).toContainText('Temukan hidangan');
  expect(await page.locator('[data-paper-stage]').evaluate(node => node.scrollTop)).toBe(0);
  const chapterNavigation = page.getByRole('link', { name: 'Buka bab: Panduan', exact: true });
  const navigationBounds = await chapterNavigation.boundingBox();
  expect(navigationBounds!.x).toBeGreaterThanOrEqual(390 - 50);
  expect(navigationBounds!.x + navigationBounds!.width).toBeLessThanOrEqual(390);
  expect(navigationBounds!.y + navigationBounds!.height).toBeLessThanOrEqual(844);
  const startCooking = page.getByRole('link', { name: 'Mulai pilih bahan', exact: true });
  await startCooking.scrollIntoViewIfNeeded();
  expect(await startCooking.evaluate(node => {
    const bounds = node.getBoundingClientRect();
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    return hit !== null && node.contains(hit);
  })).toBe(true);
  await page.screenshot({ path: '../previews/reference-nusantara-390-guide-action.png' });
  await startCooking.click();
  await expect(page).toHaveURL(/\/cari$/);
});




