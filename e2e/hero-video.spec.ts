import { test, expect, type Page } from '@playwright/test';

async function chapter(page: Page, title: string) {
  const link = page.getByRole('link', { name: 'Buka bab: ' + title, exact: true });
  await link.click();
  await expect(link).toHaveAttribute('aria-current', 'step');
}

async function openVideo(page: Page) {
  await page.goto('/');
  if (await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)) await page.locator('figure').scrollIntoViewIfNeeded();
  else await chapter(page, 'Cerita');
}


test('hero autoplay is muted, looping, and has no visible video controls', async ({ page }) => {
  await openVideo(page);
  const video = page.locator('video');
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => !node.paused && node.videoWidth > 0)).toBe(true);
  expect(await video.evaluate((node: HTMLVideoElement) => node.muted && node.loop && node.playsInline && !node.controls)).toBe(true);
  await expect(page.getByRole('button', { name: /Jeda video|Putar video/ })).toHaveCount(0);
});
test('video pauses off screen and resumes only in the active chapter', async ({ page }) => {
  await openVideo(page);
  const video = page.locator('video');
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => !node.paused)).toBe(true);
  await chapter(page, 'Sampul');
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  await chapter(page, 'Cerita');
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(false);
});

test('reduced motion displays poster and does not request video', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests: string[] = []; page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
  await openVideo(page);
  await expect(page.getByRole('img', { name: 'Ilustrasi sup, sate, rendang, dan pempek' })).toBeVisible();
  await expect(page.locator('figure figcaption')).toHaveCount(0);
  await expect(page.locator('video')).toHaveCount(0); expect(requests).toHaveLength(0);
});

test('background visibility event pauses and resumes video', async ({ page }) => {
  await openVideo(page); await expect.poll(() => page.locator('video').evaluate((node: HTMLVideoElement) => !node.paused && node.videoWidth > 0)).toBe(true);
  const video = page.locator('video');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused)).toBe(false);
});

test('failed video retains illustration and recipe navigation', async ({ page }) => {
  await page.route('**/videos/hero-nusantara.mp4', route => route.abort());
  await openVideo(page);
  await expect.poll(() => page.locator('video').count()).toBe(0);
  await expect(page.getByRole('img', { name: 'Ilustrasi sup, sate, rendang, dan pempek' })).toBeVisible();
  await chapter(page, 'Sampul');
  await page.getByRole('link', { name: 'Cari dari bahan saya' }).click();
  await expect(page.getByRole('heading', { name: 'Hari ini mau masak apa?' })).toBeVisible();
});

test('phone loads portrait video without downloading desktop video', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
  await openVideo(page);
  await expect.poll(() => page.locator('video').evaluate((node: HTMLVideoElement) => !node.paused && node.videoWidth > 0)).toBe(true);
  const video = page.locator('video');
  await expect(video).toHaveAttribute('src', '/videos/hero-nusantara-mobile.mp4');
  expect(await video.evaluate((node: HTMLVideoElement) => node.videoHeight > node.videoWidth)).toBe(true);
  expect(requests.some(url => url.endsWith('/hero-nusantara.mp4'))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 900 });
  await chapter(page, 'Cerita');
  await expect(video).toHaveAttribute('src', '/videos/hero-nusantara.mp4');
  await expect.poll(() => video.evaluate((node: HTMLVideoElement) => !node.paused && node.videoWidth > node.videoHeight)).toBe(true);
});

test('phone reduced motion uses portrait poster without downloading videos', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requests: string[] = [];
  page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
  await openVideo(page);
  const image = page.getByRole('img', { name: 'Ilustrasi sup, sate, rendang, dan pempek' });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.currentSrc.endsWith('/hero-nusantara-mobile.webp') && node.naturalHeight > node.naturalWidth)).toBe(true);
  await expect(page.locator('video')).toHaveCount(0);
  expect(requests).toHaveLength(0);
});

test('journal cover and pantry fit every breakpoint', async ({ page }) => {
  for (const width of [360, 390, 600, 601, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('RASA DARI NUSANTARA');
    const bounds = await page.locator('section[aria-labelledby=journal-title]').boundingBox();
    const title = await heading.boundingBox();
    expect(Math.abs(bounds!.width - width)).toBeLessThanOrEqual(1);
    expect(title!.x).toBeGreaterThanOrEqual(0);
    expect(title!.x + title!.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await chapter(page, 'Panduan');
  await page.getByRole('link', { name: 'Mulai pilih bahan' }).click();
  await expect(page.getByRole('heading', { name: 'Hari ini mau masak apa?' })).toBeVisible();
});


test('pinned paper sheets lift over a stationary next chapter and reverse correctly', async ({ page }) => {
  await page.goto('/');
  const stage = page.locator('[data-paper-stage]');
  const root = stage.locator('..');
  const panels = stage.locator('[data-journal-chapter]');
  await expect(root).toHaveAttribute('data-deck-ready', 'true');
  expect(await stage.evaluate(node => getComputedStyle(node).position)).toBe('sticky');
  const initial = await stage.boundingBox();
  expect(initial!.height).toBeGreaterThan(300);
  expect(initial!.y).toBeGreaterThanOrEqual(0);
  await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('[data-paper-stage]')!;
    const root = stage.parentElement!;
    const cover = stage.querySelector<HTMLElement>('[data-journal-chapter]')!;
    const top = parseFloat(getComputedStyle(root).getPropertyValue('--deck-top'));
    const viewport = stage.getBoundingClientRect().height;
    const origin = scrollY + root.getBoundingClientRect().top - top;
    window.scrollTo({ top: origin + Math.max(0, cover.scrollHeight - viewport) + viewport * 1.225, behavior: 'instant' });
  });
  await expect.poll(() => panels.nth(0).getAttribute('data-exit')).not.toBe('0');
  const partial = await stage.boundingBox();
  const outgoing = await panels.nth(0).boundingBox();
  const incoming = await panels.nth(1).boundingBox();
  const stickyTop = await stage.evaluate(node => parseFloat(getComputedStyle(node).top));
  expect(Math.abs(partial!.y - stickyTop)).toBeLessThan(2);
  expect(outgoing!.y).toBeLessThan(partial!.y - partial!.height * .35);
  expect(Math.abs(incoming!.y - partial!.y)).toBeLessThan(2);
  expect(await panels.nth(0).evaluate(node => getComputedStyle(node).clipPath)).toMatch(/^polygon\(/);
  expect(await panels.nth(1).evaluate(node => getComputedStyle(node).position)).toBe('absolute');
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-paper-stage]')!.parentElement!;
    const top = parseFloat(getComputedStyle(root).getPropertyValue('--deck-top'));
    window.scrollTo({ top: scrollY + root.getBoundingClientRect().top - top, behavior: 'instant' });
  });
  await expect(panels.nth(0)).toHaveAttribute('data-exit', '0');
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await expect(page.getByRole('link', { name: 'Buka bab: Sampul', exact: true })).toHaveAttribute('aria-current', 'step');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root).not.toHaveAttribute('data-deck-ready', 'true');
  await expect(panels).toHaveCount(5);
  expect(await panels.evaluateAll(nodes => nodes.every(node => !node.hasAttribute('aria-hidden') && !(node as HTMLElement).inert && getComputedStyle(node).position !== 'absolute'))).toBe(true);
  const first = await panels.nth(0).boundingBox();
  const second = await panels.nth(1).boundingBox();
  expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height - 1);
  await expect(page.getByRole('link', { name: 'Buka bab: Sampul', exact: true })).toBeHidden();
  const parts = panels.nth(0).locator('div[aria-hidden=true] > div > span');
  await expect(parts).toHaveCount(3);
  expect(await parts.evaluateAll(nodes => nodes.every(node => getComputedStyle(node).animationName === 'none'))).toBe(true);
});


