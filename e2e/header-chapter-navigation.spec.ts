import { test, expect, type Page } from '@playwright/test';

async function openMenu(page: Page) {
  const toggle = page.getByRole('button', { name: 'Menu', exact: true });
  if (await toggle.isVisible()) await toggle.click();
}

for (const screen of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
]) {
  test(`header follows chapter order and returns to the cover from every chapter on ${screen.name}`, async ({ page }) => {
    await page.setViewportSize({ width: screen.width, height: screen.height });
    await page.goto('/');
    await expect(page.locator('.startup-screen')).toHaveCount(0);
    await page.locator('[data-deck-ready=true]').waitFor();
    const nav = page.getByRole('navigation', { name: 'Navigasi utama', exact: true });
    await openMenu(page);
    const labels = await nav.locator(':scope > a, :scope > .nav-disclosure > button').allTextContents();
    expect(labels.slice(0, 5).map(x => x.trim())).toEqual(['Beranda', 'Cerita Budaya', 'Resep', 'Daerah', 'Dapur']);
    await expect(nav.getByRole('link', { name: 'Daerah', exact: true })).toHaveAttribute('href', '/#peta');
    await expect(nav.getByRole('button', { name: 'Daerah', exact: true })).toHaveCount(0);
    const toggle = page.getByRole('button', { name: 'Tutup', exact: true });
    if (await toggle.isVisible()) await toggle.click();
    for (const [label, target, chapter] of [
      ['Cerita Budaya', 'cerita', 'cerita'],
      ['Resep', 'resep-pilihan', 'resep-pilihan'],
      ['Daerah', 'peta', 'dapur'],
      ['Panduan Memasak', 'cooking-guide', 'panduan'],
    ]) {
      await openMenu(page);
      if (label === 'Panduan Memasak') await nav.getByRole('button', { name: 'Dapur', exact: true }).click();
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp('/#' + target + '$'));
      await expect(page.locator('#' + chapter)).toHaveAttribute('aria-hidden', 'false');
      const chapterName = ({ cerita: 'Cerita', 'resep-pilihan': 'Resep', dapur: 'Dapur', panduan: 'Panduan' } as Record<string, string>)[chapter];
      await expect(page.getByRole('link', { name: 'Buka bab: ' + chapterName, exact: true })).toHaveAttribute('aria-current', 'step');
      await expect.poll(() => page.locator('#' + target).evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
      })).toBe(true);
      await openMenu(page);
      await nav.getByRole('link', { name: 'Beranda', exact: true }).click();
      await expect(page).toHaveURL(/\/#sampul$/);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
      await expect(page.locator('#sampul')).toHaveAttribute('aria-hidden', 'false');
    }
    await page.goto('/cari');
    await expect(page.locator('.startup-screen')).toHaveCount(0);
    await openMenu(page);
    await nav.getByRole('link', { name: 'Resep', exact: true }).click();
    await expect(page).toHaveURL(/\/#resep-pilihan$/);
    await expect(page.locator('#resep-pilihan')).toHaveAttribute('aria-hidden', 'false');
    await expect(page.locator('#resep-pilihan').getByRole('heading', { name: 'Tekwan', exact: true })).toBeInViewport();
  });
}
