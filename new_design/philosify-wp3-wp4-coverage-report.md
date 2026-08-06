# WP3 + WP4 — Coverage Report

**Date:** 2026-07-29
**Branch:** `redesign/v2`
**Preview:** https://redesign-v2.philosify-frontend.pages.dev (stable branch alias)
**This deploy:** https://c0c80ffb.philosify-frontend.pages.dev
**Production:** philosify.org **untouched** — deploy ran without `--branch=production`, per directive. WP5/cutover NOT executed; awaiting explicit approval.

**Build:** clean, 11.5s, no errors. All work committed; working tree clean (only the untracked `new_design/` mockup assets remain, pre-existing).

---

## 1. Migration Map §3b — all 14 rows covered

| # | Wing feature | New home in v2 | Status |
|---|---|---|---|
| 1 | Song search + results list | Top of the 720px well on `/music` | ✅ |
| 2 | Top 50 ticker | Slim dismissible ticker under each module header | ✅ |
| 3 | Scan (1cr) vs Philosopher Panel (3cr) | Two-card Analysis Mode chooser with credit `.pill`s — Music, Cinema, Literature, News | ✅ |
| 4 | Progress bar + timer + Cancel | `ANALYZING // 00:04.81` telemetry block, cancel as secondary button, in the verdict slot | ✅ |
| 5 | Technical specs + Spotify embed | Track/film/book header card at the top of the well | ✅ |
| 6 | Philosophical Note + Classification | Verdict card — classification as magenta H2, score as display-face numeral | ✅ |
| 7 | "Listen to the Analysis" + speed | Audio bar docked under the verdict (`V2AudioBar` per module); speed steps unchanged | ✅ |
| 8 | Historical Context + analysis prose | Expandable section cards in the well, prose tier | ✅ |
| 9 | Share icons + "Share via DM" + "Join [artist]" | Post-analysis actions row; third-party icons monochrome until hover | ✅ |
| 10 | Sponsored slot in the wing | Rail Sponsored Card + Post-Analysis Slot; every legacy `InlineAdSlot` mount preserved (billing-relevant, audited: Music 4, Cinema 4, Literature 4, News 4, Quiz 3, Ideas 3+2) | ✅ |
| 11 | Account block (name, credits, History, Buy Credits, Logout) | `NavAccount`: live balance, account menu (History / Buy Credits / **Account settings** / Logout). Full legacy `AccountModal` (profile editing, transactions with Stripe receipts, notification prefs, password change) remounted behind "Account settings" — dropped by the Router rewrite, restored in `66e2e24` | ✅ |
| 12 | 18-language code grid | Nav pill → dropdown grid; count bound to `LOCALES.length`, not hardcoded | ✅ |
| 13 | "Philosify Ads Ateliê" link | Footer, beside the lockup | ✅ |
| 14 | Central logo panel + word-link grid | Retired — replaced by hero + 9-module bento | ✅ |

## 2. §3c surfaces

- **Auth:** centered card pages at `/signin` and `/signup`.
- **Buy Credits:** modal bound to live `GET /api/pricing` packs ($6→20, $10→40, $20→100). Stripe checkout unchanged underneath.
- **History:** Analyses + Transactions tabs; transactions carry Stripe receipt links.
- **Reports:** shared-analysis permalink pages retained.
- **Sharing:** new OG image in the brand system (`e042367`).
- **Ads Ateliê:** advertiser surface reachable from the footer.
- **Session chrome:** live balance always visible in the nav; logged-out visitors see Sign in / Sign up.

## 3. Addendum 1 — payment-resume thread (verified)

Every `pendingAction` type survives the sidebar→page conversion via URL targets:
analysis/panel (music, book, cinema, news), unsafe-zone, quiz start/continue, colloquium, space-unlock.

Verified statically end-to-end: page pre-check stores the pending action → Stripe → `/payment/success` → `PaymentReturnRedirect` maps the flag to a module URL → module page restores the selection and clears the pending action.

Two gaps found and fixed during verification:

- Cinema resume now handles both stored film shapes.
- Quiz returns had **no branch at all** in `PaymentSuccess` (Stripe returns landed on `/`) — fixed with an `openQuiz` flag + `/quiz` redirect (`713e333`).

## 4. WP4 — telemetry honesty

- `site/src/config/catalog.js` is the single source: 1.7M songs, 1.3M films, 40M books, 18 locales.
- The mockup's "over 300 philosophers" was **false** — the seed contains exactly **265**. Landing binds the config value; HistoryPage binds live `SEED_NODES.length`, so any drift surfaces automatically.
- The 380KB constellation seed never enters the landing chunk (bundle constraint respected).
- Globe textures self-hosted; constellation internals untouched (Addendum 1).

## 5. WP4 — i18n (18 locales)

- 534 `v2.*` keys extracted by script from the source (0 conflicts), translated into all 17 non-English locales.
- Merges enforced mechanically: structure parity, `{{placeholder}}` parity, `<hl>` tag parity. All 18 translation files verified at **534/534**.
- Locale CSS rules: CJK prose line-height 1.8; bold non-Latin header fallback for zh/ja/ko/hi/ar/he/fa/ru (Michroma is Latin-only, so those headers fall back per-glyph to Inter/Noto); RTL prose direction/alignment for ar/he/fa.
- Commits: `a544554` (ru/pl/hu), `3845557` (pt/es/it/fr/de/nl), `82c5651` (ar/he/fa), `86d4976` (hi/tr), `a586a9f` (zh/ja/ko).

## 6. Deviation flags — decisions for Roberto, nothing silently changed

1. **Backend bug (not patched — frontend-only mandate):** `/api/user-history` labels news scans `mediaType: "music"`, so history rows for news analyses open under `/music`. Needs a one-line Worker fix.
2. **#FF5A5A error-red** still pending approval — only `var(--warn)` is used.
3. **AccountModal ships legacy-skinned** behind "Account settings" — functionality preserved verbatim; needs a v2 mockup eventually.
4. Guest gating moved from select-time to spend-time; sign-in gates navigate to `/signin`.
5. Modal behaviors (escape / scroll-lock / backdrop) dropped where modules became pages.
6. Quiz ticker shows the live rule (10 questions), not the mockup's 12; quiz options render 2-column because they are sentences, not one-word answers.
7. Underground unlock with insufficient credits opens the legacy PaymentModal skin inside the reused SpaceLock.
8. Community panels and the constellation info-panel ad keep their legacy internals framed by v2 (Addendum 5).
9. Ideas' 3-second final-time flash not reproduced; admin verdict/delete still uses `window.prompt`.
10. News source categories arrive server-labeled in English (parity with the old system).
11. **Translation calls worth a native eye:**
    - hu: "Eszmék" chosen for IDEAS (vs mockup's "ÖTLETEK").
    - tr: legacy strings are ASCII-mangled ("Filozof Secin", "Philosify'in Gorusu") — new v2 copy uses proper orthography, including the correct suffix "Philosify'ın".
    - Verdict terms standardized per locale where legacy files mixed variants: zh 裁决, ja 判定, ko 판결.
    - hi: Unsafe Zone keeps the module's existing name "असुरक्षित क्षेत्र" (not home's "खतरनाक क्षेत्र").
    - es: guide-version gender fix; de: du-form + umlaut standardization applied.
12. Constellation year-readout palette flagged, no action (Addendum 1).

## 7. Commit log (this work package)

| Commit | Content |
|---|---|
| `fc2beb8` | WP3: News page (template standard) |
| `eaef1cf` | WP3: Cinema and Literature pages (Music-template instances) |
| `881fe1b` | WP3: Quiz and Community pages |
| `713e333` | WP3: route quiz payment-return to /quiz |
| `e2313cb` | WP3: Ideas page (colloquiums + debates) |
| `fb38be0` | WP4: bind catalog stats per the telemetry honesty rule |
| `2ab461a` | WP4: centralize all v2 copy in en.json |
| `7820dc0` | WP4: CJK line-height, non-Latin bold fallback, RTL prose |
| `66e2e24` | WP3: restore the full account surface in the v2 nav |
| `a544554`–`a586a9f` | WP4 i18n: 17 locale merges (534 keys each) |

## 8. Recommended review path (on the preview)

1. Landing → module bento → each module page.
2. `/music`: full paid flow — search, mode chooser, analysis, verdict, audio, actions row.
3. Stripe **test** purchase triggered mid-analysis → confirm resume lands back on the module with selection restored.
4. Language switch to `ar` (RTL) and `zh` (CJK line-height / header fallback).
5. Account menu → Account settings (profile, transactions with receipts) → History replay of a past analysis.
6. Unsafe Zone (ad-free, full-bleed), Quiz, Ideas, Community, History globe.

---

**Next step requires approval:** WP5 / production cutover. Nothing will be deployed to production until explicitly authorized.
