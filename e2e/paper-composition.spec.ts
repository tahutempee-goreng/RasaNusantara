import { test, expect } from '@playwright/test';

test('recipe stack changes the image, caption, metadata and destination together', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Buka bab: Resep', exact: true }).click();
  const chapter = page.locator('#resep-pilihan');
  await expect(chapter.getByRole('heading', { name: 'Tekwan', exact: true })).toBeVisible();
  await expect(chapter.getByText('01 / 04', { exact: true })).toBeVisible();
  await chapter.getByRole('button', { name: 'Resep berikutnya', exact: true }).click();
  await expect(chapter.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','false');
  await expect(chapter.getByRole('heading', { name: 'Rendang', exact: true })).toBeVisible();
  await expect(chapter.getByRole('img', { name: 'Foto rendang Padang oleh Midori', exact: true })).toHaveAttribute('src', '/images/recipes/rendang.webp');
  await expect(chapter.getByText('Rendang · Minangkabau, Sumatra Barat', { exact: true })).toBeVisible();
  await expect(chapter.getByRole('link', { name: 'BUKA RESEP' })).toHaveAttribute('href', '/resep/rendang');
  await expect(chapter.getByText('02 / 04', { exact: true })).toBeVisible();
  await chapter.getByRole('button', { name: 'Resep sebelumnya', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(chapter.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','false');
  await expect(chapter.getByRole('heading', { name: 'Tekwan', exact: true })).toBeVisible();
  await chapter.getByRole('button', { name: 'Tampilkan resep Coto Makassar', exact: true }).click();
  await expect(chapter.locator('[data-carousel-busy]')).toHaveAttribute('data-carousel-busy','false');
  await expect(chapter.getByRole('heading', { name: 'Coto Makassar', exact: true })).toBeVisible();
  await chapter.getByRole('link', { name: 'BUKA RESEP' }).click();
  await expect(page).toHaveURL(/\/resep\/coto-makassar$/);
});

test('paper header follows the chapter tone and keeps reduced-motion reading navigable', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('.journal-header');
  await expect(header).toHaveAttribute('data-tone', 'dark');
  await page.getByRole('link', { name: 'Buka bab: Cerita', exact: true }).click();
  await expect(header).toHaveAttribute('data-tone', 'light');
  await page.getByRole('link', { name: 'Buka bab: Resep', exact: true }).click();
  await expect(header).toHaveAttribute('data-tone', 'dark');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#cerita').scrollIntoViewIfNeeded();
  await expect(header).toHaveAttribute('data-tone', 'light');
});

test('Nusantara scenery loads and layers move independently with scroll', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-deck-ready=true]').waitFor();
  const art = page.locator('#sampul img[src*="village-v2"]');
  await expect.poll(() => art.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const before = await art.evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollTo({ top: 240, behavior: 'instant' }));
  await expect.poll(() => art.evaluate(el => getComputedStyle(el).transform)).not.toBe(before);
  const back = await page.locator('#sampul img[src*="paper-mountains"]').evaluate(el => getComputedStyle(el).transform);
  expect(await art.evaluate(el => getComputedStyle(el).transform)).not.toBe(back);
  await page.getByRole('link', { name: 'Buka bab: Panduan', exact: true }).click();
  await expect(page.locator('#sampul')).toHaveAttribute('data-moving', 'false');
  for (const image of await page.locator('#panduan img').all()) {
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => art.evaluate(el => getComputedStyle(el).transform)).toBe('none');
});
