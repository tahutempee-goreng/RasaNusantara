# Header follows the culinary journey

23 October 2026. Navigation revision following a user supplied walkthrough.

- The Beranda link and wordmark target the cover anchor so they return to the top even when the user is already on the home route.
- Main navigation now follows the chapter order: Beranda, Cerita Budaya, Resep, Daerah, Dapur.
- Resep targets the recipe chapter rather than the ingredient search route. Explicit ingredient search buttons retain their existing destination.
- Daerah is a single direct link to the regional section. The two previous dropdown choices led to different anchors inside the same chapter and are removed.

Validation: TypeScript and production build passed. Twenty one related Playwright tests passed in one completed run: three new header destination/back to cover regressions at desktop, portrait and landscape widths; header identity/layout; recipe carousel and chapter tone; scenery; seven touch/paper regressions each in WebKit iPhone and Chromium Android emulation. The test fixture waits for the startup overlay to finish before reading accessible navigation. An earlier sandbox run could not access localhost; it was not treated as a product failure or as a passing run.

The paper animation implementation, recipe catalogue, quantities and advisor API did not change. No new provider requests were needed. Device emulation is not a physical phone test. The AI Development Log PDF was not modified for this navigation patch.

Production confirmed: commit c08396fdeda11783cd8516c640af0aee91820afe; deployment dpl_G7cw8Wrrrh4etKXujqDeAMFniEq6 READY. Four unauthenticated production browser cases passed four chapter destinations and four returns to the cover each, without page errors. Screenshots inspected after scroll settled. Three stricter active-chapter regressions also passed (44.7s).
