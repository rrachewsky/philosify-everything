# Philosify Visual Reshape — Implementation Spec v1.0

**Direction name: "Console for Thinking."** The entire platform adopts the dark cinematic register of the promo films (Unsafe Zone, Literature Analysis, Music Analysis Pilot), so that the ads and the site are one continuous experience. A person who clicks through from any film lands somewhere that looks and feels identical.

> **DESIGN LAW v2 — FROZEN 28 Jul 2026, ratified by Roberto. Non-negotiable without his explicit approval; definitive values in `philosify-design-law.md`. (Supersedes v1 where they conflict.)** Roberto's later decisions override the film-derived palette below: (1) the interface is **MONOCHROME** — black/white/grey; the violet canvas and the cyan/magenta Voice System are retired from the UI ("too noisy"); the films keep their own palette as embedded content only. (2) The sole emphasis register is **flat SILVER** (`--silver` #DDE1E8; graphite `#3A3E46` on the white theme) — never gradients, never on buttons/borders/backgrounds, max one silvered element per region; silvered content = declared quantities, key phrases, the tagline, balance numerals. (3) The brand mark is Roberto's **Owl of Athena** (V ear tufts, circuit eyes, Greek-column beak, faceted shield body) in the approved masthead composition: continuous line ≈150% of wordmark width, owl standing on it (talons overlap ~3px), lowercase Michroma "philosify" 1mm below; owl art transparent-background, inverts on light; the earlier ring-and-square lockup is retired. (4) Cells/cards are square-cornered; cell text (title + description) uses Michroma only; cells carry a corner → affordance and the grid is introduced by a "Select a module" line. (5) Landing = 3×3 module grid in order Music, Cinema, Literature, News, Ideas, History, Quiz, Community, Unsafe Zone (inverted cell, full-contrast text). Wherever older sections below reference violet surfaces, magenta/cyan accents, module tints, or glow finishes, read them through this law: monochrome surfaces, silver register, no glow. `philosify-tokens.css` v2 is the implementation of this law. Constellation school colors are DATA, not UI — they survive inside the map.

This spec is written for implementation by coding agents. The token file `philosify-tokens.css` is the single source of truth for every color, size, and timing value; this document explains how to use them.

---

## 1. Core identity decisions

**Canvas.** Deep violet-black everywhere (`--bg-void` page, `--bg-canvas` content), with the film's faint square grid rendered as a **vignetted veil**: a viewport-fixed hairline grid that is full strength around the center of attention and fades to nothing at the screen's extremes (radial mask; `.grid-veil` in the tokens file), reproducing the films' light falloff. The grid never tiles uniformly edge-to-edge — uniform grid reads as graph paper; the fade is what makes it cinematic. It stays at ~5% opacity at full strength and never interferes with reading. Because the veil is fixed to the viewport, content scrolls over a stable field of light — a subtle depth cue that costs nothing in performance.

**The Voice System (the most important rule).** The films consistently assign magenta to Philosify's voice and cyan to the human's voice and to system state. This becomes a platform-wide semantic law:

- Magenta (`--voice-philosify`, `--voice-philosify-bright`): analysis verdicts, section titles of Philosify's output, primary CTAs, the wordmark underline, active analysis indicators.
- Cyan (`--voice-user`, `--voice-user-deep`): user input fields, user chat bubbles, focus rings, status pills, HUD brackets, "system online"-type indicators.
- Never swap the roles. Never introduce a third accent. Module tints (Section 5) are washes, not voices.

**Brand lockup (FROZEN — approved by Roberto 27 Jul 2026; no change without his explicit command).** The mark and wordmark are one unit, never separated. Reproduction law, exact:
- **Mark geometry** (in a 30-unit viewBox): solid upright square, side 13.6, corner radius 1.1, fill `--voice-philosify` (#D6158C), centered; ring: circle r 11.4, stroke `--voice-user` (#35E0FF) — the ring sits tight to the square's vertices (gap ≈ 1.8 units). Never rotated, never outlined, never resized relative to its ring.
- **Wordmark:** "philosify" — lowercase, Michroma, never "philosify.org" (the domain appears only as a URL line, as on the film end cards).
- **Spacing:** gap between mark and wordmark = ¼ of the mark's rendered width.
- **Vertical alignment:** the wordmark's x-height band (the i-o-s-i core) centers on the mark's horizontal centerline; the ascenders (h, l, f) rise above and the descenders (p, y) hang below freely. In CSS: line-height 1 plus an upward optical shift (≈ −3px at 32px type, scaled proportionally). Never center by bounding box.
- **Finishes:** glow (film end cards, social headers, site hero/footer) and flat (nav, documents, small sizes). Sole exception where the mark appears alone: favicon/app icons.
- Wordmark always lowercase; display headers always uppercase — nothing in between. The mark's colors are the literal token values, never near-misses.

**Signature element.** HUD corner brackets (`.hud-frame`) on the hero, module page headers, and one featured card per screen — taken directly from the films' framing device. Used sparingly: if more than three elements on a screen have brackets, remove some.

**Human/bright interludes.** The films alternate dark UI scenes with bright presenter scenes. On the site, the equivalent bright objects are cover art (albums, film posters, book covers) and philosopher portraits — let them be the only large bright areas, glowing against the dark. Never dim or overlay-tint cover art.

## 2. Typography

Three tiers, loaded via `--font-display`, `--font-ui`, `--font-prose`:

1. **Display — Michroma** (Google Fonts, single weight). The squared techno face matching the films' titles. Use ONLY for: wordmark, module titles, hero headline, section eyebrows in caps. Always with `--tracking-display`. Non-Latin locales (Devanagari, JP, KR, etc.): Michroma has no coverage — fall back to Inter 800 with +0.06em tracking; the agent must test all 18 locales' headers.
2. **UI/body — Inter** with per-locale Noto subsets. Weights 400/500/600/700 only. Body at `--text-body`, line-height 1.65.
3. **Analysis prose — Newsreader** (serif) at `--text-prose`, line-height 1.75, max 68ch. This distinguishes "the thinking" from "the interface." If a locale's serif fallback looks poor, that locale may use Inter for prose — readability beats consistency.

Rules: sentence case everywhere except `--text-meta` eyebrows and pills (uppercase, tracked). No italics in UI. Numbers in stats use tabular-nums.

## 3. Layout system

**Migration note — this section replaces the current half-page layout.** Today the content + ads area is confined to roughly half the viewport on desktop/laptop. That column is retired entirely; no page in the new system renders content in a half-width wing. Every page adopts one of three full-width shells:

- **Shell A — Marketing** (homepage, module landing sections): full `--container-max` (1240px) centered, 12-column grid, `--gutter` 24px, 8px spacing scale. Sections breathe at `--space-7`/`--space-8` vertical padding, alternating full-bleed and contained. Ads on Shell A: Interstice Strips between sections and Sponsored Cards inside the bento only (§10).
- **Shell B — Reading** (analysis results, News, articles, CommunityHub threads): two-region desktop layout inside the same 1240px container — the `--content-well` (720px) reading column plus a **right rail (~320px)** separated by a 40px gutter. The rail carries, in order: analysis contents/navigation, module telemetry, and at most one Sponsored Card. The reading column stays sacred (no ads inside it mid-analysis, §10); the rail is where content and ads coexist without the half-page squeeze — content gets the width it needs, ads get a permanent, well-behaved home. Below 1024px the rail folds away: its navigation collapses into a disclosure at the top, and its ad unit moves to the Post-Analysis Slot.
- **Shell C — Immersive** (Constellation, History's Living Globe, Unsafe Zone): true full-bleed edge-to-edge canvas, no container, no rail, no ads. These surfaces are the films made navigable; chrome is limited to telemetry readouts and an exit control.

Breakpoints: ≥1280px full shells as described; 1024–1279px Shell B keeps the rail at 280px; 768–1023px single column, bento at 2-up; <768px single column, bento at 1-up with the 2×2 feature cards first.

### 3b. Feature migration map (current wing → new shells)

Everything that lives in today's right-side wing is preserved — it moves to a proper home, nothing is dropped:

| Current wing feature | New home |
|---|---|
| Song search + results list | Top of Shell B well on the Music module page, full 720px width |
| Top 50 ticker | Slim telemetry-style ticker under the module header (Shell B), one line, dismissible |
| Scan Music (1 credit) vs Philosopher Panel (3 credits) | The two-card Analysis Mode chooser from the Literature film (§5c) — cards differentiated by badge and description, credit cost as a `.pill` on each; both CTAs follow button rules (one magenta primary max) |
| Progress bar + timer + Cancel | Telemetry block: `ANALYZING // 00:04.81` with cancel as secondary button; lives where the verdict card will appear |
| Technical specs + Spotify embed | Track header card at the top of the well (cover, title, country/year/genre, embedded player) |
| Philosophical Note (score) + Philosophical Classification | The Verdict card (§3): classification as the card's H2 in magenta register, note/score as a display-face numeral beside it |
| "Listen to the Analysis" + speed control | Audio bar docked under the Verdict card (Shell B ≥1024px: duplicated as a compact control in the rail); speed steps unchanged |
| Historical Context + analysis prose | Expandable section cards in the 720px well, prose tier (`--font-prose`) |
| Share icons + "Share via DM" + "Join [artist]" | Post-analysis actions row (native, before the Post-Analysis ad Slot); third-party share icons rendered monochrome in `--ink-mid` until hover to protect the palette |
| Sponsored slot in the wing | Rail Sponsored Card + Post-Analysis Slot (§10) |
| Account block (name, credits, History, Buy Credits, Logout) | Nav right side: credits as a `.pill` + avatar menu; Buy Credits is a legitimate second magenta CTA only on the pricing surface |
| 18-language code grid (top center) | Nav `.pill` (current locale) opening a dropdown grid of all 18; the always-visible code wall retires |
| "Philosify Ads Ateliê" link | Footer, alongside the lockup |
| Central logo panel + word-link grid | Retired — replaced by the hero + module-card bento (§3); the word-links' 3-column grid is superseded by cards with descriptions and stats |

Migration rule: no wing feature ships later than the layout that replaces it — P2/P3 packages must include this table as their checklist so nothing regresses at launch.

### 3c. Account, commerce, and report surfaces

The remaining product features get first-class homes — none of them stay modal-cramped in a wing:

- **Sign up / Sign in:** a centered auth card (max 420px) on `--bg-void` with the grid veil — the lockup at top, inputs on `--bg-inset` with cyan focus (user voice: the person is speaking), one magenta primary per screen ("Create account" / "Sign in"), OAuth buttons as secondary style. Errors in `--state-warn`, written per the interface-voice rules (what happened + what to do). Auth is Shell A's quietest page: no bento, no ads, nothing competing.
- **Credits & pricing (Buy Credits):** a Shell A page where credit packs are module-card-anatomy cards — pack size as the display-face numeral, price, per-analysis math in the description, `BEST VALUE` badge on one only. Stripe checkout unchanged underneath. Cost transparency rule: any action that spends credits shows its cost as a `.pill` on the button before the click (as Scan `1 CREDIT` / Panel `3 CREDITS` do today) — this pattern generalizes to every paid action platform-wide.
- **History (analyses + transactions):** modeled directly on the PAST SESSIONS screen from the Unsafe Zone film — a Shell B list where each row is: ID numeral, title (song/book/film/question), module tag, date, status `.pill` (`COMPLETE`, `ACTIVE`, `ARCHIVED`). Two tabs, one pattern: **Analyses** (re-open any past analysis) and **Transactions** (credit purchases and spends, amount column, Stripe receipt link). Rows are the compact card variant; the list is searchable and filterable by module.
- **Reports (the analysis as artifact):** every completed analysis is a permalink page (Shell B) that renders for visitors without login — the shareable report IS the acquisition surface. It carries: track/book header card, Verdict card with Note + Classification, expandable dimension sections, audio playback, the actions row (share, Join [artist], "Analyze your own" CTA for visitors), then the Post-Analysis Slot. Optional PDF export renders the same card stack in a print stylesheet (dark backgrounds don't print; the print CSS inverts to ink-on-paper with the flat lockup).
- **Sharing:** the actions row (§3b) plus OG cards — every report page emits an OG image in the brand system (lockup + verdict line on the dark canvas) so shares into WhatsApp/X/Telegram carry the identity even before the click.
- **Advertising ops ("Philosify Ads Ateliê"):** footer link opens the advertiser surface — a Shell A page selling the three units (§10) with their specs and fixed pixel budgets; media upload and billing reuse the same card + Stripe patterns as credits.
- **Session & state chrome:** credits balance always visible as a nav `.pill` (live number — telemetry rule); the account menu (History, Buy Credits, Logout) behind the avatar; logged-out visitors see "Sign in" as the nav's secondary button.

- **Homepage hero** (Shell A): headline (display face) + one-line subhead + single magenta CTA; to the right, a live framed analysis card (`.hud-frame`) actually rendering — the product is the hero, as in the films.
- **The 9-module bento** (homepage centerpiece): asymmetric grid on `--bg-canvas`. Music and Constellation get 2×2 cells; Unsafe Zone gets a full-width band at the bottom of the grid; remaining modules 1×1. Cells are **module cards**, not word-links — modeled on the Analysis Mode card scene in the Literature film. Card anatomy, top to bottom:
  1. **Badge** (top-right `.pill` in the module's tint): the module's character, e.g. `HIGH PRECISION`, `DIALECTICAL`.
  2. **Icon** (top-left, line style, module tint, ~28px).
  3. **Title** in the display face.
  4. **Description** — one sentence, max ~90 chars, `--ink-mid`: what the user will access, written from the user's side.
  5. **Stat line** — telemetry style (`--text-meta`, cyan), real numbers only, `//`-separated.
  Card surface `--bg-raised`, `--radius-card`, 1px `--line-hair`; hover raises to `--bg-overlay` with the module-tint glow and brightens the stat line. Entire card is the link (min touch target 44px; the badge is not separately clickable). Launch copy per card:
  - **Music** (2×2) — "Any song, analyzed by its premises — from lyric to worldview." — `1.7M SONGS // SPOTIFY + GENIUS`
  - **Constellation** (2×2) — "The map of Western and Eastern thought — trace any school's lineage." — `300+ PHILOSOPHERS // 42 SCHOOLS`
  - **Literature** — "Books read for what they argue, not just what they say." — `GOOGLE BOOKS CATALOG`
  - **Cinema** — "What a film believes, beneath what it shows." — `TMDB CATALOG`
  - **News** — "Today's coverage, stripped to its framing and premises." — `DAILY // SOURCE + FRAMING + VERDICT`
  - **Ideas** — "Colloquiums between the great minds — propose the question." — `IN-CHARACTER DEBATES`
  - **History** — "Philosophy where and when it happened." — `TIMELINE // SCHOOLS // EVENTS`
  - **Community** — "Debate with people who argue in good faith." — `18 LANGUAGES`
  - **Quiz** — "Find out what you actually hold true." — `PREMISE CHECK`
  - **Unsafe Zone** (full-width band) — "No dogmas. No fallacies. No fantasy." — `BRING YOUR REAL QUESTION` (`--state-warn` accent, warning mark).
  Stat lines obey the Telemetry honesty rule (§5b): counts update from live data, never hardcoded marketing numbers. All copy localized across the 18 languages; descriptions may run longer in translation — cards must tolerate 2-line descriptions without breaking the grid.
- The same card component (in a compact 1-line variant: icon + title + stat) is reused for the nav's module-switcher dropdown, so navigation and homepage teach the same vocabulary.
- **Module pages:** shared template — compact header band (module title in display face, `.hud-frame`), then centered `--content-well` (720px) for analysis. Sticky elements only where genuinely needed.
- **Analysis output:** card stack, not a wall of text — verdict/summary card first (magenta title), then expandable sections. Chat-style modules follow the film's dialogue layout: user right/cyan-edged, Philosify left/magenta-edged.

## 4. Components

- **Buttons:** `.btn-primary` (magenta fill, white text) — exactly one per screen; `.btn-secondary` (cyan hairline). No tertiary button style; use text links in `--ink-mid`.
- **Status pills:** `.pill` / `.pill--active` — uppercase meta type, used for session states, language indicator, model status.
- **Inputs:** `--bg-inset` field, 1px `--line-hair` border, cyan focus ring (`:focus-visible` token). The Unsafe Zone entry field carries its placeholder: "Bring your real question."
- **Nav:** slim 64px bar, `--bg-void` at 85% opacity with backdrop blur on scroll; module switcher is a clean 3×3 dropdown grid mirroring the bento; language switcher visible (18 languages is a selling point).
- **Hairline rules** (`--line-hair`) under section titles, echoing the films' title underlines.

## 5. Module tints (washes only)

Each module gets one tint used exclusively for: cell hover-glow, its icon, and an 8%-opacity wash behind its header. Suggested (agents may tune for contrast): Music `#B84DFF`, Ideas `#FFC94D`, Cinema `#FF7A4D`, Literature `#4DFFB8`, Community `#4D9AFF`, News `#E6E6E6`, History `#C9A96A`, Quiz `#7AFF4D`, Unsafe Zone `--state-warn`. Tints never color text and never compete with the two voices.

## 5b. The Telemetry Layer (microcopy system from the films)

All seven films share a consistent "instrument readout" microcopy pattern that becomes an ownable part of the identity. Codify it as a text style, not decoration:

- Format: uppercase `--text-meta`, `//`-separated segments, cyan or `--ink-low`. Examples from the films: `ANALYSIS ENGINE // ACTIVE`, `SYSTEM.ACTIVE // FEED_V2.4`, `SESSION 04 // METAPHYSICS`, `TEMPORAL SYNC`, `NEURAL_LINK // ACTIVE`.
- Placement: top-left of module surfaces (status), right side (counters like `Turn 7 / 10 remaining`), footer of event cards (record IDs like `ID: 1215-JUNE-15`).
- Rule: telemetry is real state only — actual session numbers, actual turn counters, actual language counts. Never fake metrics in the product UI (fictional scan rates belong to the ads only).
- Localization: telemetry stays terse in all 18 languages; if a locale can't do terse uppercase, use small-caps weight instead.

## 5c. Per-module design cues recovered from the films

These film UIs are ad fictions, but each contains a layout idea worth carrying into the real product:

- **Community:** roster rows with contribution/reputation metrics and role tags; named spaces (the film uses "The Agora / The Collective / The Underground" as section names — consider adopting for CommunityHub areas); DMs with inline translate action (natural fit for the 18-language platform).
- **History:** the "Living Globe" — philosophers and events rising over regions on a dark globe, an event ticker, era scrubbing, and a philosophical-school filter showing lineage. The school filter and timeline scrub are directly implementable over the existing Constellation data (42 schools) and align with the India go-to-market (Buddha/Mahavira rise over India in the film itself).
- **Ideas:** "Colloquiums" feed — session cards labeled `SESSION NN // FIELD` with matchups (e.g., Aquinas vs. Hume), in-character debate transcripts with timestamps, and a synthesis panel at the end. The user-proposed-question entry screen ("What philosophical question should we debate?") mirrors the Unsafe Zone entry pattern — keep the two consistent.
- **News:** framing-analysis view — source text with highlighted phrases mapped to named framings in a side column, plus a divergence chart (objective vs. subjective coverage with reliability scores). This is a strong visual for the module's mandated structure (source bias → errors/rights → Philosify opinion).
- **Literature:** analysis-mode chooser (two cards: precision scan vs. dialectical panel) and dimension-by-dimension reveal (e.g., an "EPISTEMOLOGY" rail with a progress node) — the rail pattern generalizes to Music and Cinema analyses.
- Closing lines from the films are strong module taglines; e.g., News: "Read the news, armed."

## 6. Dark-register specifics for Constellation & Unsafe Zone

- **Constellation:** already at home on dark. Keep the star-map on `--bg-void` (deeper than canvas) so entering it reads as zooming out into space. Objectivist school stays `#D6158C` — now visibly the same magenta as the platform voice, which is exactly the right symbolism. Slow ambient drift on idle.
- **Unsafe Zone:** the most film-faithful surface. Full `.canvas-grid`, `.hud-frame` on the session panel, turn counter as a `.pill`, warning triangle in `--state-warn`. This module may use the display face slightly more heavily than others.

## 7. Motion

Taken from the films' pacing — slow, deliberate, nothing bounces:

- Scroll reveal: fade-up `--reveal-shift` over `--dur-base` `--ease-out`.
- Bento entrance: `--stagger` per cell, left-to-right, top-to-bottom.
- Number tickers for stats (1.7M songs, 300+ philosophers, 42 schools, 18 languages), tabular-nums, ease-out over 1.2s, fire once.
- Analysis text may reveal progressively (streaming), cursor in magenta.
- Constellation idle drift ≤ 4px amplitude, ≥ 20s period.
- `prefers-reduced-motion` collapses all of the above (already in tokens file).

## 8. Accessibility & i18n floor

- Body text `--ink-hi` on `--bg-canvas` ≈ 15:1; `--ink-mid` ≈ 7:1 — both pass AAA.
- `--voice-philosify-bright` (#FF2E9E) on dark ≈ 5.5:1 — use at ≥18px bold or for non-text; never brand magenta `#D6158C` for small text on dark (≈3.2:1) — fills and large display only.
- Cyan `#35E0FF` on dark ≈ 11:1 — safe at all sizes.
- Visible focus everywhere (cyan ring token). Full keyboard traversal of the bento.
- RTL audit if any of the 18 locales requires it; CJK line-height bump to 1.8 for prose; Devanagari header fallback test (India go-to-market).
- Lighthouse accessibility ≥ 95 as acceptance criterion per page.

## 9. Rollout phases (agent work packages)

1. **Tokens (P1):** ship `philosify-tokens.css`, wire fonts (Michroma, Inter + Noto subsets, Newsreader), swap global surfaces to the dark register. Acceptance: every page renders on the new canvas with readable text, no component redesign yet.
2. **Homepage + layout migration (P2):** retire the half-page column; implement the three shells (§3); new hero with live analysis card + the 9-module bento with staggered reveal. Acceptance: no page renders content in a half-width wing at any breakpoint; visual parity with the films' register; CTR-ready for launch.
3. **Module template + ad units (P3):** unify the 9 module pages on Shell B (well + rail); analysis card-stack; chat layout with the Voice System; implement the three ad units and placement rules (§10).
4. **Flagship dark surfaces + polish (P4):** Constellation depth pass, Unsafe Zone film-faithful treatment, motion pass, reduced-motion QA, 18-locale typography audit, contrast audit.

Nothing in P3–P4 blocks launch; P1+P2 are the launch face.

## 10. Ad inventory design (Philosify's own ad products)

Philosify sells its own inventory; these are the only three units, each with a fixed pixel budget. No large-format video placements (no full-width 16:9 players, no 9:16 towers) are sold — an advertiser's 16:9 or 9:16 asset is contained inside a unit's frame, click-to-play, muted.

1. **Sponsored Card** (flagship): the module-card anatomy (§3) with badge `SPONSORED`, neutral gray tint. Placements: one 1×1 bento cell max on Shell A; one per Shell B rail. Media: static image or 3–5s muted loop; video plays inside the card on click, never expands, never autoplays sound.
2. **Interstice Strip:** full-container-width but short (max 120px tall) band between Shell A sections — logo + one line + CTA; a horizontal card, nothing more.
3. **Post-Analysis Slot:** one unit after the analysis card stack ends on Shell B — the highest-attention, zero-interruption position. Also receives the rail's ad below 1024px.

Protective rules (these are what make the inventory valuable):
- Total ad area ≤ ~25% of any viewport; never inside the 720px reading column mid-analysis.
- Ads never use magenta or cyan — no advertiser impersonates the platform's voices or mimics a system control. Every unit is labeled.
- The Unsafe Zone carries no ads, ever. Constellation and the Living Globe (Shell C) carry none either.
- Ad units obey the same radius, border, and type tokens as native cards — native in behavior, unmistakable in labeling.

---
*Source basis: frame analysis of seven HeyGen promo films (Unsafe Zone, Literature, Music Pilot, Community/DM, History "The Living Globe", Ideas "Debates & Colóquios", News). Measured canvas values per film: #070118, #060319, #070120, #07111F, #030113, #09061D, #060021 — all within the same violet-black register (Community drifts slightly navy; the token canvas #0B0722 normalizes all seven). Magenta and cyan accents and bright presenter interludes (brightness 64–78/255) consistent across every film.*
