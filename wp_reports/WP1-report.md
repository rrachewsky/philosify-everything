# WP1 — Foundation · Report to Roberto

**Branch:** `redesign/v2` · **Date:** 29 Jul 2026 · **Status: complete, awaiting approval**

## WP0 approval rulings — executed
1. **Favicon set regenerated** from the final lockup master (`philosify-logo-lockup.png`),
   same sizes and filenames, same approved framing (content ≈88% width, centered,
   `#070708` ground). Committed as `41b0967`.
2. **sw.js notification icon** switched `/logo.png` → `/icon-192.png`. One line;
   notification logic untouched.
3. **Social card BLOCKED:** `new_design/philosify-og-card.png` does not exist (also not
   in `files.zip`). og/twitter tags still point at the old art; the wiring is a 2-line
   edit the moment the file lands.

## Delivered
1. **Audit** → `wp_reports/WP1-audit.md`: every Migration-Map row + §3c surface mapped
   current code → new home → mockup ref. Nothing dropped; `App.jsx`'s half-page wing is
   the surface the shells replace in WP3.
2. **Tokens landed** → `site/src/styles/tokens.css` (verbatim copy of
   `philosify-tokens.css` v2), imported first in `global.css`. Verified zero collisions:
   no token variable name and none of `.cell/.grid-veil/.hud-*/.hl/body.t-white` are
   used by the old styles — imported, the file is inert on the current UI.
3. **Fonts loaded** → `index.html` now loads Michroma / Inter 400,500 / Newsreader
   (exact mockup URL). Old Orbitron link kept — the live UI still uses it until WP3+cutover.
4. **Per-locale Noto fallbacks** → lazy loader `src/utils/localeFonts.js` (injects the
   script-specific Noto families on locale change, hooked into the existing
   `LanguageContext` effect) + `src/styles/v2-foundation.css` re-declaring the three
   font-stack tokens per script via `:root:lang()` — the frozen tokens file is not
   edited. Covered: ar, fa, he, hi, ja, ko, zh (+ ru prose serif). Latin locales are
   covered by the base three. CJK line-height 1.8 stays in WP4 as ordered.
5. **Grid-veil + atmosphere layer** → `components/common/GridVeil.jsx` (the fixed
   64px-grid veil with radial fade; styles from tokens). The ratified mockups implement
   "atmosphere" as the veil's radial vignette itself — no separate light-pool element
   survived the monochrome ruling. Mounted by PageShell in WP2; renders nowhere yet.
6. **Two themes wired** → `src/utils/theme.js` (dark default, `body.t-white` variant,
   persisted in localStorage, applied at boot from `main.jsx`). Inert on pre-v2 surfaces.

## No-user-visible-ship check
- Old styles consume none of the token vars/classes → no visual change.
- One flagged delta: tokens.css carries the Law's global `prefers-reduced-motion`
  collapse. For users with reduced-motion enabled, the CURRENT UI's animations now
  collapse too. Accessibility-positive and Law-mandated, but it is technically
  observable before cutover — say the word if you want it gated until WP3.

## Open questions
1. Ruling #3 blocked on the missing `philosify-og-card.png` (above).
2. None else. WP2 (component library) is ready to start on your approval.
