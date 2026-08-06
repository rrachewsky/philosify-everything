# PHILOSIFY — MIGRATION WORK ORDER (v1)
**From:** Roberto Rachewsky. **To:** coding agents. **Mission:** migrate philosify.org's frontend to the ratified new design. **Authority:** `philosify-design-law.md` is FROZEN and non-negotiable; where any instruction, old code, or your own judgment conflicts with it, the Law wins. Do not editorialize, "improve," or approximate any frozen value. Backend logic is out of scope and must not change.

## Inputs (in `/new_design` at repo root)
- `philosify-design-law.md` — the constitution (arbiter of all ambiguity)
- `philosify-tokens.css` — v2 tokens, the single source of visual truth
- `philosify-visual-reshape-spec.md` — architecture, Feature Migration Map (§3b), account/commerce surfaces (§3c), ad units (§10)
- Mockups (reference implementations, lift don't interpret): `philosify-landing.html` (MASTER), `philosify-news.html` (MODULE-TEMPLATE STANDARD), `philosify-music.html`, `philosify-cinema.html`, `philosify-literature.html`, `philosify-ideas.html`, `philosify-history.html`, `philosify-quiz.html`, `philosify-community.html`, `philosify-unsafezone.html`, `philosify-modals.html`, `philosify-auth.html`, `philosify-legal.html`
- `owl-original.png` — Roberto's artwork (source of truth for the mark)

## Do-not-touch list
Workers business logic, Supabase schema and queries, Stripe products/checkout, KV guides (incl. `guide-unsafe-zone`), auth logic, AI pipeline, analytics, translations infrastructure. Frontend only.

## Work packages (sequential; each ends with a report to Roberto)

**WP0 — Brand assets.** Vectorize the owl to SVG as a faithful reproduction (no redesign): `owl-faithful.svg` (from original linework) and `owl-reinforced.svg` (heavier stroke cut for ≤48px). **Method constraint: automated bitmap tracing (potrace/autotrace) was attempted and REJECTED by Roberto — it alters the linework. The SVG must be a careful manual/programmatic redraw over the original at high zoom, path by path, preserving stroke character exactly; if faithful vectors cannot be achieved, ship the approved PNG cuts and flag for a human designer.** Build the lockup as one reusable component with variants: vertical (132/96/64px) and horizontal (footer), per Law §1.3. Favicon set from the mark alone (sole sanctioned solo use). Deliver a rendering comparison sheet (SVG vs PNG at 132/96/64/33/16px) for Roberto's approval before use.

**WP1 — Foundation.** Audit current frontend against the Migration Map (report: current → new home → mockup ref). Land `philosify-tokens.css`; load Michroma/Inter/Newsreader + per-locale Noto fallbacks; implement grid-veil + atmosphere as a global layer; wire the two themes (dark default, white variant). No user-visible ship.

**WP2 — Component library.** Extract from the mockups: PageShell (HUD corners, chrome, centered lockup band, footer), Cell (+inverted variant, arrow affordance, underline sweep), Button (primary=inversion, secondary=hairline), Pill, Ticker, Telemetry line, Marker line (mrail), Modal, Analysis card stack (verdict + silver Note + expandables + audio bar), Input. Acceptance per component: pixel-faithful to mockup; Law-conformant.

**WP3 — Pages on preview (beta deployment; production untouched).** Order: landing → Music (News-standard template) → remaining modules as template instances (News with ticker/search/newest-first/Scan→3-philosopher panel; Ideas with daily Colloquium + user Debates; History; Quiz; Community; Cinema; Literature) → modals wired to existing Stripe/History endpoints → auth on existing auth logic → Unsafe Zone → legal (real ToS/PP text) → ad units (§10). Modules are pages; modals are transactions only.

**WP4 — Live data + i18n.** Bind per the telemetry honesty rule: balance (Supabase), catalog counts (live/config: 1.7M songs, TMDb, Google Books, philosopher count), session IDs, guide-compliance code (Inter tabular telemetry line), Stripe prices. Push all new copy through the 18-locale pipeline; header-fallback test for Devanagari/CJK/Arabic/Hebrew; CJK prose line-height 1.8.

**WP5 — Gates + cutover.** Per page, three gates: (1) Migration-Map coverage report (every row present/absent — zero regressions); (2) Law-conformance lint (no hex outside tokens; no font outside the three; silver never on buttons/borders/ads; brand never grey); (3) Lighthouse ≥95, both themes, reduced-motion. Then production cutover via deployment switch; old build kept deployable 7 days; monitor bounce and time-on-analysis; instant rollback path.

## Roberto's decision points (block only their own items, not the phases)
Error-red `#FF5A5A` (functional-only) — approve or mono alternative; pack prices (bind Stripe); News source count; debate-creation cost; exact philosopher count; WP0 SVG approval before the vectors replace PNGs.

## Reporting
After each WP: preview URL + coverage/conformance report + open questions. Never proceed past a failed gate. Amendments to the Law only with Roberto's explicit written approval, dated.

## Addendum 1 (Roberto, 29 Jul 2026) — binding for WP3/WP4, from the system map
1. Converting sidebars to pages MUST migrate the three sidebar-targeting threads to URL targets: pendingAction/payment-resume, push-navigate, and history replay. Test the full Stripe round-trip resume on the new pages before reporting WP3 done.
2. Preserve the InlineAdSlot mount and the time-gated analysis reveal exactly — billing-relevant.
3. Buy Credits modal binds the live packs ($6→20, $10→40, $20→100) via GET /api/pricing.
4. WP4: self-host the five globe textures (copy from unpkg into our assets) — no runtime third-party dependency.
5. Constellation: preserve ruling stands; do NOT retheme its internals. The year-readout palette question is flagged to Roberto — no action.
6. Swap the legacy og:image in site/index.html AND in the share-preview server pages to the new card. [Executed 29 Jul 2026 — see commit history]
