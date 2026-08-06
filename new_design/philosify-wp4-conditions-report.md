# WP3/WP4 Pass Conditions 1–4 — Completion Report

**Date:** 2026-07-30
**Branch:** `redesign/v2`
**Preview (redeployed, same alias):** https://redesign-v2.philosify-frontend.pages.dev
**Production frontend:** untouched. **Production Worker:** the authorized fix IS deployed (disclosure in §3).
**Status:** all four conditions done — awaiting Roberto's review before any WP5 discussion.

---

## 1. Verdict color + token lint

**Finding first:** the shipped verdict card was **already conformant** — `.classif` carried no color declaration (inherits ink) and `.note9` was silver. The "magenta H2" wording in the WP3/WP4 coverage report quoted the Migration Map's spec text, not what renders. The Law is now stated in code anyway: `.classif { color: var(--ink) }` is explicit.

**The lint is a repeatable gate:**

- Script: `site/scripts/lint-v2-palette.cjs` — run with `npm run lint:tokens`.
- Named "palette" because `.gitignore` blocks `*token*` filenames (secret-hygiene pattern); that pattern was not weakened.
- Allowlist = every color literal defined in `tokens.css`. Scans all 57 v2 surface files, including JSX inline styles; comments are ignored.

**First run found 5 violations, all fixed:**

| Violation | Fix |
|---|---|
| 4× modal/picker scrim `rgba(0,0,0,.6)` (v2-components + music/cinema/literature CSS) | Changed to `rgba(0,0,0,.55)` — the one translucent black tokens.css already defines. The `.6` was a WP3 invention: the modals mockup is a static gallery and has **no scrim at all**. Visually imperceptible change. **Decision for Roberto:** ratify a dedicated `--scrim` token, or keep the `.55` reuse. |
| 1× `--warn: #FF5A5A` | Still unapproved, and the ordered lint fails it. Now aliases to `var(--ink-hi)` — **error states render in bright ink until Roberto rules**. One-line revert if the red is approved. |

**Lint result: green — 57 files, zero color values outside tokens.css.**

## 2. Full verdict anatomy (music mockup) — live on Music, Cinema, Literature

The shared `Verdict` component (`site/src/components/v2/AnalysisStack.jsx`) now renders, top to bottom:

1. **Big Philosophical Note** (1–10) — silver display numeral (the region's one silvered element).
2. **Classification** beside it — Michroma ink.
3. **Score line** — `Final score −X.X · Note N of 10` — true minus sign, tabular figures, uppercase meta register. Falls back to the plain weighted-score line if a note is ever absent.
4. **Rationale** — 1–2 sentences at reading tier (`--ink-text`, prose face), surfaced from the integrated analysis opening (`philosophical_analysis` / `summary`), falling back to the top-weighted scorecard justification (ethics, 40%). HTML-stripped; sentence segmentation handles CJK/Arabic punctuation; ~340-char cap. CJK 1.8 line-height and RTL rules extended to it.

**Zero engine changes** — this purely surfaces data every scan already returns.

**i18n:** new key `v2.verdict.scoreLine` in all 18 locales (535 v2 leaves each, parity-verified), vocabulary mirrored from the existing `weightedScore` / `philosophicalNote` terms. Deliberate choice: pt uses "Pontuação final" for the score so it doesn't collide with "Nota {{n}} de 10" beside it.

**Scoping note — News excluded by design:** the news engine emits no note and no scorecard (`philosophical_note: null`, `classification: "news"`), so there is nothing to render in this anatomy without engine changes, which are forbidden. News keeps its Philosify-opinion verdict structure. The engine could be extended later on request.

## 3. Worker fix — `/api/user-history` news label (deployed)

**Shape disclosure:** the fix is ~5 lines, not 1, and here is why. `user_analysis_requests` has no media-type column verifiable from the repo (its DDL isn't in `migrations/`), and the frontend's Supabase env vars point at a dead project — `fgaavfxspnymfcpywqkz.supabase.co` is NXDOMAIN (stale config worth cleaning up). News rows are only distinguishable by `analyses.classification === "news"`, which `news-analyze.js` provably writes on every news insert.

**The fix** (`api/src/handlers/user-history.js`): one batched lookup of the ≤50 scan ids against `analyses (id, classification)`; rows whose classification is `"news"` are labeled `mediaType: "news"`. If the lookup ever fails, every row stays `"music"` — exactly the pre-fix behavior. Nothing else in the handler changed.

The account UI already had the news icon and module routing mapped (`useAccountHistory` icons, `NavAccount.moduleForMedia`), so the corrected label lights up with no frontend change.

**Deploy disclosure:** production Worker (`--env production`) was last deployed 2026-07-21. This deploy shipped exactly two commits:

- `a0d4b12` — this authorized label fix.
- `e042367` — the OG share-preview wiring, already reported as done in the WP3/WP4 coverage report.

Health check green after deploy (`/api/health` OK).

## 4. Philosopher count — reconciled at 266; API seed is authoritative

The diff between the seeds:

- Client lacked **`martin_luther_king_jr`** entirely — the real one-node gap.
- One cosmetic id divergence: `steve_pinker` (API) vs `steven_pinker` (client) — same person, counted once on both sides. Left as-is: renaming would touch constellation internals for zero user-visible gain. Flagged as data hygiene.

**Done:**

- MLK node copied verbatim from the API seed into the client seed (isolated node, no edges to carry).
- Portrait entry added — `martin_luther_king_jr.jpg` already existed in `site/public/portraits/`.
- `constellation.descriptions.martin_luther_king_jr` added in all 18 locales, following each locale's separator conventions (zh/ja `；`, ar/fa `؛`). Names map skipped by existing convention (97/266 coverage; proper noun).
- `catalog.js` → 266, with sync provenance documented in the header comment.
- HistoryPage live-binds `SEED_NODES.length` → both surfaces read 266. Landing chunk grew ~0.75 KB.

## Commits

| Commit | Content |
|---|---|
| `cb78418` | WP4.1 i18n: verdict score-line key + MLK constellation description (18 locales) |
| `5bbdb22` | WP4.1: reconcile philosopher seed with API source of truth — 266 nodes |
| `4898f4c` | WP4.1: full verdict anatomy on scan modules; v2 token lint conformance (+ the linter) |
| `a0d4b12` | api: label news scans as news in user-history |

Build clean · `npm run lint:tokens` green · preview redeployed to the same alias.

---

## Open rulings for Roberto

1. **#FF5A5A error red** — currently error states render in `--ink-hi`. Approve the red (one-line revert) or keep monochrome errors.
2. **`--scrim` token** — ratify a dedicated token for the modal/picker scrim, or keep the `rgba(0,0,0,.55)` reuse from tokens.css.

Stopping here per instruction — no WP5 until the review rules.
