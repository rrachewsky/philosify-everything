# REPORT — Addendum 1 Intake & Execution
**Date:** 29 Jul 2026 · **Branch:** `redesign/v2` · **From:** coding agent · **To:** Roberto Rachewsky

## 1. Addendum recorded

All six directives are written into `new_design/philosify-work-order.md` as **"Addendum 1 (Roberto, 29 Jul 2026) — binding for WP3/WP4"**:

1. **Sidebar → page migration (WP3):** the three sidebar-targeting threads — `pendingAction`/payment-resume, `push-navigate` (SW push), and history replay — MUST migrate to URL targets. The full Stripe round-trip resume must be tested on the new pages before WP3 is reported done.
2. **Billing-relevant, preserve exactly:** the `InlineAdSlot` mount and the time-gated analysis reveal (`waitForMinimumAnalysisWindow`).
3. **Buy Credits modal:** binds the live packs ($6→20, $10→40, $20→100) via `GET /api/pricing`.
4. **WP4:** self-host the five globe textures (copy from unpkg into our assets) — no runtime third-party dependency.
5. **Constellation:** preserve ruling stands; internals are NOT rethemed. Year-readout palette question flagged to Roberto — no action.
6. **OG card swap** in `site/index.html` AND the share-preview server pages. **Executed — see §2.**

## 2. Item 6 executed — commit `e042367`

Asset verified: `new_design/philosify-og-card.png` is a 1200×630 PNG — exactly the OG dimensions the meta tags declare.

| Change | File | Detail |
|---|---|---|
| Card added to site assets | `site/public/brand/philosify-og-card.png` | Copied from `new_design/` |
| Landing meta swapped | `site/index.html` | `og:image` and `twitter:image` → `https://philosify.org/brand/philosify-og-card.png`. The legacy value was a **relative** URL (`/philosify-og.svg`), which most OG scrapers reject — the new tags are absolute, so link previews should actually resolve now. |
| Share-preview pages swapped | `api/index.js` | All four `logoUrl` constants (music share page, book share page, debate preview, panel preview) now emit the card. Each constant was verified to feed **only** `og:image`/`twitter:image` meta tags — no visible page logo affected; no other backend code references the old URL. |

## 3. Go-live caveats

- The worker-side change reaches production only on the next `wrangler deploy --env production`; the `index.html` change on the next Pages deploy. **Neither was deployed** — production stays untouched per the work order.
- WhatsApp/Facebook/Telegram cache OG images aggressively; after deploy, the old card may linger until their caches expire or are refreshed via their sharing debuggers.

## 4. Standing state

- WP0–WP2 committed; WP2 report delivered (component library at `/dev/v2`, dev-only).
- Reading-tier token correction (`--ink-text`) re-landed; seamless grid header ground implemented.
- System map committed (`new_design/philosify-system-map.md`, commit `be8d5ad`).
- Open items awaiting Roberto: error-red `#FF5A5A` ruling; constellation year-readout palette; explicit go for WP3.
