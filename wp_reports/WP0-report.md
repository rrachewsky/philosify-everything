# WP0 — Brand assets · Report to Roberto

**Branch:** `redesign/v2` · **Date:** 29 Jul 2026 · **Status: complete, awaiting approval**

## Ruling applied
No SVG vectorization. The approved PNG cuts are the production assets. The lockup is
always placed as the single official image asset (`philosify-logo-lockup.png` vertical,
`philosify-logo-horizontal.png` footers) — never reconstructed from parts. Verified: the
official PNGs are byte-identical to the images embedded in the approved mockups.

## Delivered
1. **Production assets** → `site/public/brand/`
   - `philosify-logo-lockup.png` (807×646, vertical, faithful cut)
   - `philosify-logo-horizontal.png` (814×254, footer, reinforced cut)
2. **Lockup component** → `site/src/components/common/Lockup.jsx` (+ `.css`, exported
   from the common barrel). One `<img>` of the official asset, wrapped in a link home
   (Law §1.3). Variants and image heights lifted from the mockups:
   | Variant | Image height | Owl height |
   |---|---|---|
   | `landing` | 162px | 132px |
   | `module` | 117px | 96px |
   | `interior` (modals, legal) | 78px | 64px |
   | `footer` (horizontal) | 32px | ≈30px |
   White-theme plate rule included (`body.t-white` → black plate, mockup padding);
   theme wiring itself is WP1. Not yet mounted on any page (pages are WP3).
3. **Favicon set** (full lockup, per amended Law §1.3) → `site/public/`:
   `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`,
   `icon-192.png`, `icon-512.png`. Wired in `index.html`, `manifest.json`,
   `browserconfig.xml`; icon backdrop colors set to `#070708` (were `#D90B91`/`#0a0020`).
4. **Rendering sheet** → `wp_reports/wp0-rendering-sheet.html` (open locally): vertical
   lockup at owl 132/96/64, horizontal at ≈33/30, favicons at 16/32/180/192/512 incl.
   pixel-zoom, and the white-theme plate demo.

## Conformance notes
- Work order §WP0 said favicons "from the mark alone"; amended Law §1.3 says the full
  lockup in ANY circumstance. Law wins — the delivered set (full lockup) conforms.
- Dropped the `maskable` PWA icon entry: Android crops maskable icons to a circular
  safe zone, which would cut the wordmark off the lockup. Omitting it keeps the full
  lockup intact (Android letterboxes instead).

## Open questions (non-blocking)
1. The favicon files were generated 28 Jul 23:26, before the 23:44 lockup masters. They
   are visibly the full lockup and consistent; if you want them regenerated from the
   final master for exactness, say so.
2. `sw.js` push notifications still use old `/logo.png` as icon — propose switching to
   `icon-192.png` in WP1 (not touched now; it sits close to notification logic).
3. Social cards (`og:image`, `twitter:image`) still point at the old `/philosify-og.svg`
   — new-brand card art is not in any WP; needs a ruling on where it lands.
