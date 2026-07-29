# PHILOSIFY — SYSTEM MAP (current state)

**Purpose:** factual map of the CURRENT system for the design reviewer. No proposals. Verified against the live code on branch `redesign/v2`, 29 Jul 2026.
**Correction notice:** root `CLAUDE.md` is stale in three places; the facts below supersede it — (a) there is **no `translations` table**: analyses are stored one row per `(song_id, language, model)`; (b) analyses are keyed by `song_id`, not `(song_name, artist, generated_by)`; (c) there is **one English guide in KV** (`guide_text`), not 12 language guides — models are prompted as polyglot and answer in the user's language (`api/src/guides/loader.js:229`).

---

## 1. Routes and pages

SPA with `react-router` (`site/src/Router.jsx`), mounted from `site/src/main.jsx` inside `ErrorBoundary → LanguageProvider → CreditsProvider`. One `BrowserRouter`, one `Suspense` (fallback: green spinner).

| Path | Page file | What it does |
|---|---|---|
| `/` | `pages/HomePage.jsx` via inline `HomePageWrapper` (lazy) | The landing: full-screen logo image (`/logo-everything.png`; swapped for `/philosifyvideo.mp4` after sign-in) with 6 clickable hotspots + a 9-item mobile label grid (music, ideas, films, books, community, news, history, quiz, unsafe-zone) that open the corresponding **sidebars**. Auth bar (sign-up/sign-in or name + balance + History/Buy Credits/Logout), footer links `/pp`, `/tos`, external link to `ads.philosify.org`. |
| `/app` | `App.jsx` (static import) | Results-only view: renders an analysis passed via `location.state`; redirects `/` if none. Sets dynamic title/OG meta. |
| `/debate/:debateId` | inline `DebateDeepLink` | Not a page: opens the Ideas sidebar on that debate, then replaces URL with `/`. |
| `/payment/success` | `pages/PaymentSuccess.jsx` (lazy) | Post-Stripe return: `POST /api/verify-payment` with `session_id`, shows credits bought + new balance, resumes the pre-payment action (reopens the right sidebar via router state). |
| `/payment/cancel` | `pages/PaymentCancel.jsx` (lazy) | Static cancel notice; "Try again" reopens the payment modal. No API calls. |
| `/a/:slug`, `/shared/:id` | `pages/SharedAnalysis.jsx` (lazy) | Public share-link viewer: `GET /api/shared/:identifier`, renders the analysis; handles expired/max-views/requires-auth/teaser; `POST /api/track-referral` when a referral is pending. |
| `/tos`, `/pp` | `pages/TermsOfService.jsx`, `pages/PrivacyPolicy.jsx` (lazy) | Legal pages: i18n HTML (`legal.terms.content` / `legal.privacy.content`) sanitized with DOMPurify; logo from `${VITE_CDN_URL}/logo.png`. |
| `/reset-password` | `App` + `pages/ResetPasswordPage.jsx` (lazy) | Full-screen overlay to set a new password (`POST /auth/update-password`), then redirects home. |
| `/dev/v2` | `pages/V2Gallery.jsx` | Dev-only WP2 component gallery; stripped from production builds (`import.meta.env.DEV` gate). |
| `*` | — | Redirect to `/`. |

**The modules are NOT routes.** Music, Literature, Cinema, News, Ideas, Community, History, Quiz, Unsafe Zone are full-screen **sidebar overlays** mounted at router level on every route, opened by state (no URL, no back-button integration; `/debate/:id` is the only deep link). A `ComingSoonSidebar` covers unimplemented categories. Modals mounted inside the home wrapper: `LoginModal`, `SignupModal`, `ForgotPasswordModal`, `PaymentModal`, `AccountModal`. The Unsafe Zone sidebar remounts on user change (`key=uz-{userId}`).

**Dead/unrouted files that still exist:** `pages/MusicAnalysis.jsx`, `pages/ComingSoon.jsx`, `components/LandingScreen.jsx`, `components/AccountModal.jsx` (stale duplicate of `components/account/AccountModal.jsx`).

**Separate second SPA:** `ads/` at repo root is the "Philosify Ads Ateliê" advertiser portal (own Vite app, deployed at `ads.philosify.org`; public pages, advertiser dashboard `/app/*`, agency `/agency/*`, admin `/admin`). The main site links to it externally.

---

## 2. The History / Constellation engine

A 3D visualization of 2,600 years of philosophy: philosophers orbit a globe as "satellites" tethered to their birthplaces while a historical clock advances from 600 BC to 2026. It is a **fullscreen modal** (`components/history/HistorySidebar.jsx`), not a route. Free — no credits.

### 2.1 Files

| File | Role |
|---|---|
| `site/src/components/history/HistorySidebar.jsx` | Mount + WebGL error boundary (fallback message if WebGL unsupported), body-scroll lock |
| `site/src/components/history/ConstellationOfIdeas.jsx` | Container: wires hook → scene, timeline, ticker, panels, search; keyboard shortcuts (Space play/pause, Esc close, Ctrl/Cmd+F search); year readout |
| `site/src/components/history/ConstellationScene.jsx` (1451 lines) | **The engine.** Raw three.js: globe, satellites, tethers, starfield, atmosphere, raycasting, camera, animation loop, launch animation |
| `site/src/components/history/TimelineControls.jsx` | Bottom bar: play/pause, scrubber, speed cycle (0.5/1/2/4/8×), era pills, school pills |
| `site/src/components/history/HistoricalEventTicker.jsx` | "BREAKING" ticker |
| `site/src/components/history/ConstellationInfoPanel.jsx` | Philosopher detail panel (portrait, battles bars, influence links, inline ad slot) |
| `site/src/components/history/HistoricalEventInfoPanel.jsx` | Event panel with "Philosify's Analysis" section |
| `site/src/components/history/ConstellationSearch.jsx` | Expanding search with keyboard nav |
| `site/src/hooks/useConstellation.js` | Data fetch + the clock + filters + selection |
| `site/src/data/constellationSeedData.js` (379 KB) | Client copy of the dataset — only `SCHOOL_COLORS` + `PHILOSOPHER_PORTRAITS` are consumed; its node/edge arrays are dead weight in the bundle |
| `site/src/data/historicalEvents.js` | The ticker's event feed (fully client-side) |
| `api/src/handlers/constellation.js` + `api/src/data/constellationSeedData.js` (383 KB) | Backend: authoritative dataset + orbital assignment + Supabase enrichment + 5-min KV cache |

### 2.2 Technology

Raw **three.js** (`three@0.183.2`) — no react-three-fiber, no d3, no three-globe rendering (though `three-globe` and `3d-force-graph` sit unused in `package.json`; three-globe's unpkg CDN is used only as the **texture host**). Labels are 2D-canvas-rasterized textures on billboarded meshes. Renderer: `PerspectiveCamera(45°)` at `(0,100,350)`, `WebGLRenderer({antialias, alpha})`, DPR capped at 2, clear color `#0a0a0f`. Extra dressing: shader atmosphere glow (back-side sphere r=102), 8000-point procedural starfield (r≈800–1000), nebula sphere (r=950). Two independent rAF loops: the render loop (scene) and the clock loop (year advance in the hook). Camera controls are hand-rolled (drag orbit, wheel/pinch zoom clamped 150–600; the +/− buttons use 150–800).

### 2.3 The globe

`SphereGeometry(100, 256, 256)` with blue-marble map, topology bump+displacement, water roughness/metalness maps — **all five textures load at runtime from `unpkg.com/three-globe@2.45.1/example/img/`** (globe renders untextured if unpkg is unreachable). Rotation is **era-driven**: an 11-entry table maps year → longitude of the era's intellectual center (Greece 24° at −600 → Islamic world 40° at 900 → USA/Europe −40° at 1950 → −20° at 2026), lerped while paused; while playing, the globe instead spins constantly at 0.002 rad/frame. Satellites and tethers are children of the earth mesh, so they rotate with it.

### 2.4 The clock

Historical time only (no wall clock). Range **−600 … 2026**, autoplays on open from −600. Base speed `1.875 years/sec` at 1× (~23 min full run), multiplied by the chosen speed and by a **constant-visual-speed factor** `clamp(localEventGap/avgGap × 1.95, 0.8, 7.0)` so sparse eras fast-forward and dense eras slow down; additionally capped at 4 s minimum per ticker event. Stops at 2026. Three scrub surfaces: the slider, dragging the ticker strip itself, and programmatic jumps (search/influence → `birth_year + 50`, era/school filter → mid-node `birth_year + 20`). Year readout renders in **Orbitron, magenta `#D6158C`** (legacy palette, hardcoded).

### 2.5 Launches

When the clock crosses a philosopher's `birth_year`, the node enters the visible set (`birth_year <= currentYear`) and the scene builds its satellite: it starts at the birthplace on the surface at 10% scale and flies to its orbital slot over **1500 ms, ease-out cubic**, growing to full size — each launch on its own rAF chain. A language change tears down and rebuilds all satellites instantly, skipping the animation. Removed nodes are detached without geometry/material disposal.

### 2.6 Orbit altitude (importance → height)

Two stages, server then client:

- **Server** (`api/src/handlers/constellation.js`): nodes are grouped by birth region (string-matched from `birth_country_modern`/`birth_city`/`tradition`), each region has a base altitude (`greece 100, rome 101, germany 102, france 101, britain 102, usa 105, russia 103, china 99, india 98, persia 100, default 100` km), and within each region nodes are **sorted by `historical_weight` descending** and assigned slots from a directional pattern (center, then rings at 5°-steps E/W/N/S/diagonals, max total inclination 20°; overflow adds +2 km per ring). `historical_weight` is pre-boosted by Supabase mention counts (`+0.01` per mention, cap 1.0). Emits `orbital_position: {x_inclination, y_inclination, z_altitude, total_inclination, region, region_rank}`.
- **Client** (`ConstellationScene.jsx`): rendered altitude = `(z_altitude − 100) × 0.15 + baseAltitude` (base 18 desktop / 14 mobile) **plus importance boosts**: `historical_weight ≥ 1.0` ("most foundational") +10 desktop/+8 mobile; `≥ 0.9` ("foundational") +6/+4. Since server z_altitude spans only ~98–105, the visible height differences come almost entirely from these two boosts. Label font size also scales by the same three tiers (60/70/82 px desktop).
- Tether direction: the radial vector is rotated by `x_inclination` (about north) and `y_inclination` (about east) via Rodrigues rotations, then scaled to `100 + altitude`.

Dead code that a reviewer will encounter: `calculateOrbitalPosition()` in `useConstellation.js` (a different altitude model, only a never-hit fallback), `calculateSpreadOffsets()` (unused de-overlap system), and three disabled philosopher-to-philosopher connection-line systems (`createConnection`, `createSchoolConnection`, `createInfluenceLine` — defined, never called; only tethers render).

### 2.7 Tethers

One line per philosopher from the bottom edge of the orbiting name card down to the birthplace point (`latLngToVector3(latitude, longitude, 100)`). Drawn as `TubeGeometry` (radius 0.3, 4 radial segments) because WebGL ignores line widths; colored by `SCHOOL_COLORS[school] || TRADITION_COLORS[tradition] || white`, opacity 0.6. Static — built once at final coordinates (already full-length during the launch); on selection it brightens to 1.0 and scales 2.5×.

### 2.8 Clicks / hover

Per-frame raycast for hover (unthrottled, fires React state every frame while hovering; cursor pointer/grab). Desktop click and mobile tap (50 px / 500 ms thresholds, 400 ms synthetic-click suppression) select the node → `ConstellationInfoPanel` opens (portrait, dates, key ideas, eight "battles" bars, influenced-by/influenced lists, inline ad). Clicking an influence link jumps the clock to that philosopher's `birth_year + 50`, enters solo mode and flies the camera (globe rotates to the target longitude first, then a 0.05-lerp camera flight to radius 280). Selection also scales the name card 1.8× and the sprite up.

### 2.9 The breaking-history ticker

`HistoricalEventTicker.jsx`. Content is **100% static client data** from `site/src/data/historicalEvents.js` — **94 events**, no API, no DB. Shape:

```js
{ id: '594bc', year: -594, category: 'political',
  title: "Solon's Reforms in Athens",
  description: '…', analysis: "Consequences: … Philosify's view: …" }
```

plus `EVENT_CATEGORIES` (9 categories, each `{icon, label, color}`: war ⚔️, revolution 🔥, science 💡, religion ✝️, philosophy 📜, political 🏛️, culture 🎨, economy 💰, technology ⚙️ — colored, legacy palette) and `EVENT_HEADLINES` (id → short headline). It does **not** loop: single pass −600→2026. Position is not a CSS animation — items' real pixel offsets are measured once, a piecewise-linear year↔offset map is built, and the strip is translated so the strip position always corresponds to `currentYear`; **dragging the strip scrubs the global clock**. Clicking an item opens `HistoricalEventInfoPanel`, which splits the `analysis` string on the "Philosify's view:" marker. Headlines/titles/analysis are translated via i18n keys `historicalEvents.<id>.*`.

### 2.10 Where the data lives

- **Philosophers (authoritative):** `api/src/data/constellationSeedData.js` — 266 nodes, 327 edges — served by `GET /api/history/constellation` (public, 5-min KV cache `constellation:v2:enriched`), enriched at request time from Supabase tables `constellation_analysis_links` (mention counts), `constellation_edge_candidates` (status=merged → auto-discovered edges), `constellation_extraction_log`. This is the **only network request the feature makes**.
- The client-side copy of the dataset (`site/src/data/constellationSeedData.js`, 265 nodes/314 edges) **has drifted from the API copy** and is used only for school colors and portrait paths (`/portraits/*.jpg` in `site/public/portraits/`).
- **Events:** `site/src/data/historicalEvents.js` only.
- Not used by this UI (exists server-side): `GET /api/history/graph` (legacy), `POST/GET /api/orbital/*` admin endpoints writing to Supabase `graph_nodes`.

---

## 3. Data schemas

Canonical SQL reference: `migrations/schema_reference.sql` (2025-11-29 architecture) plus feature migrations in `migrations/`. There is **no `supabase_schema.sql` at repo root**.

### 3.1 Philosophers ("the philosophers table")

The live philosopher records are **not in Postgres** — they are the seed array in `api/src/data/constellationSeedData.js`. Full field set (verbatim example, first record):

```js
{ id: 'mahavira', name: 'Mahavira',
  birth_year: -599, death_year: -527, dates: 'c.599–527 BC',
  birth_city: 'Vaishali', birth_country_modern: 'India',
  latitude: 25.9833, longitude: 85.1333,           // birthplace (tether anchor)
  school_of_thought: 'Jainism', school: 'Jain', tradition: 'indian',
  stance: 'anti', is_champion: true,
  key_ideas: ['Ahimsa (non-violence); …'],
  historical_weight: 1.0,                           // IMPORTANCE (0–1); ≥0.9/≥1.0 = altitude tiers
  battles: { reason_faith: -0.6, reality_mysticism: -0.7,
             individual_collective: 0.4, freedom_coercion: 0.5,
             value_nihilism: 0.5, market_planning: 0.0,
             beauty_chaos: 0.3, good_evil: 0.6 } }
```

API adds per response: boosted `historical_weight`, `mention_count`, `orbital_position {x_inclination, y_inclination, z_altitude, total_inclination, region, region_rank}`, `auto_enriched`, `source_type`. Client adds `portrait`. Edges: seed `{source_id, target_id, relationship_type, weight}`; auto-discovered `{source_id, target_id, type, primary_battle, weight, description, evidence_text, confidence}` (note `type` vs `relationship_type`).

A parallel Postgres table `graph_nodes` exists (`migrations/history_graph_tables.sql` + `add_orbital_coordinates.sql`): `id, label, type(philosopher|event|concept|era|content|battle), tradition, era, years, year_numeric, weight(maximum|high|standard|minor), description, is_seed, active`, plus orbital columns `x_inclination FLOAT (−15..15), y_inclination FLOAT (−10..10), z_altitude FLOAT (0..200, default 80), latitude, longitude` with a uniqueness index on the rounded 3D position; and `graph_edges` (`relation` enum of 10 kinds, `battle_dimension` enum of 8 battles). **The constellation UI does not read these tables** — they back the legacy `/api/history/graph` and the `/api/orbital/*` admin endpoints.

### 3.2 Historical-events feed

Client-only module `site/src/data/historicalEvents.js` (see §2.9 for shape). No table, no endpoint.

### 3.3 Analyses

Music: `analyses` table, one row per `(song_id, language, model)` — unique index `unique_analysis_by_model` covering `status='published'`; superseded rows keep `status='superseded'` (immutability preserved by supersede-not-delete). Columns actually written by `api/src/ai/storage.js`:

`song_id, language, model, version, ethics_score, metaphysics_score, epistemology_score, politics_score, aesthetics_score, final_score, philosophical_analysis, summary, ethics_analysis, metaphysics_analysis, epistemology_analysis, politics_analysis, aesthetics_analysis, classification, philosophical_note, release_year, genre, country, historical_context, creative_process, metadata (JSONB: guide_sha256/signature/version/modelo, schools_of_thought), status`.

Songs catalog: `songs` (Spotify metadata; public SELECT). Access control: RLS lets an authenticated user read an analysis only if a matching `user_analysis_requests` row exists (written via RPC `log_analysis_request`); service role bypasses. Sibling stores follow the same request pattern for literature (`migrations/literature_tables.sql`), cinema (`cinema_tables.sql`), panels (`panel_history.sql`), quiz (`quiz_tables.sql` + seeds/translations), unsafe zone (`unsafe_zone_conversations.sql`, `unsafe_zone_sessions.sql`). Share links: `share_tokens` (owner-scoped RLS).

### 3.4 Credits / transactions

- **`credits`** — `user_id PK → auth.users`, `purchased INT ≥0`, `free_remaining INT 0..2 default 2`, `total` **generated column** (purchased + free_remaining), timestamps. RLS: owner SELECT; service role all.
- **`credit_history`** — `id UUID`, `user_id`, `type ∈ (purchase, consume, refund, signup_bonus)`, `amount` (signed), before/after snapshots (`purchased_before/after, free_before/after, total_before/after`), `stripe_session_id`, `stripe_price_id`, `song_analyzed`, `model_used`, `status ∈ (pending, completed, failed, refunded)`, `metadata JSONB`, `created_at`. RLS: owner SELECT.
- **`credit_reservations`** — **no DDL in the repo**; the table and its four RPCs live only in Supabase and are driven exclusively through RPC calls from `api/src/credits/*`: `reserve_credit(p_user_id)` → `{reservation_id, used_free, remaining, credits}`; `confirm_reservation`; `release_reservation`; `cleanup_user_stale_reservations` / `cleanup_stale_reservations` (the latter also run by worker cron every 5 min with a 10-minute threshold). `analysis_id` on it is typed UUID.
- **Signup bonus:** trigger `handle_new_user()` on `auth.users` creates profile + credits row (2 free) + a `signup_bonus` history entry. Referral bonus: 2 credits via `POST /api/track-referral`.
- **Stripe:** `webhooks` table logs webhook processing (`stripe_session_id PK, event_type, stripe_price_id, user_id, status, credits_granted, transaction_id → credit_history`). Packs: $6→20, $10→40, $20→100 credits (legacy SKU names '10'/'20'/'50'). Also `profiles` (auto-synced email/display_name/preferred_language, exposed to the app through the `user_profiles` view), `email_queue`.
- **Spending model:** every paid action reserves → runs → confirms, or releases on failure/cache-hit/timeout. Prices in credits: music/book/film/news analysis 1; philosopher panel 1 per philosopher (3 philosophers); news source preferences unlock 1; Unsafe Zone 10 for 20 turns + 5 per 10 more; colloquium propose/participate/access and community space unlocks have their own charges; History module is free.

### 3.5 Ads platform

Separate table family managed by `api/src/handlers/ads/*` (advertisers, campaigns, orders, plans, creatives in R2, impressions/clicks, agency accounts, admin) with its own JWT cookie auth — schema driven by `migrations/ads_operational_fixes.sql` plus Supabase-side DDL; the main SPA touches only `GET /api/ads/serve`, `POST /api/ads/impression`, `POST /api/ads/click`.

---

## 4. Module flows and their API endpoints

**Plumbing shared by all modules:** `site/src/config/environment.js` exports `config.apiUrl` from `VITE_API_URL` (**throws at module load if unset**). All API calls use `credentials:'include'` — auth is an **HttpOnly cookie** managed by the worker's `/auth/*` proxy in front of Supabase (no Supabase JS auth in the browser). The only direct Supabase connection is the **Realtime WebSocket** (`services/realtime.js`), whose URL/anon-key come from `GET /api/config` and whose JWT comes from `GET /auth/realtime-token`. Balance state lives in `CreditsContext` (seeded by `GET /auth/session`, refreshed via `GET /api/balance`, debounced 2 s, poked by the `credits-changed` window event). Insufficient credits → `PaymentModal` + `setPendingAction(...)` (localStorage) → Stripe Checkout redirect (`POST /api/create-checkout` → `checkout.stripe.com`) → `/payment/success` → `POST /api/verify-payment` → the pending action resumes its sidebar. Analyses time-gate their reveal to the sponsored slot's contracted duration (`utils/analysisDelay.js` + `InlineAdSlot`'s `onAdLoaded`).

| Module | Frontend | Endpoints called |
|---|---|---|
| **Auth** | `useAuth`, `services/auth` | `POST /auth/signin·signup·signout·google·exchange·exchange-code·reset-password·update-password`, `GET /auth/session`, `GET /auth/realtime-token` |
| **Music** | `useMusicSidebar`, `useSpotifySearch`, `components/music/MusicSidebar.jsx` | `POST /api/search` (Spotify proxy), `POST /api/analyze` (409-retry ×3, 401 refresh-retry), `POST /api/cancel-analysis`, `POST /api/cleanup-timeout` (on 504/524), `POST /api/philosopher-panel`, `GET /api/colloquium/roster` (picker), `GET /api/top10` (ticker), `POST /api/tts`, `POST /api/share`; Spotify embed iframe in results |
| **Literature** | `useLiteratureSidebar`, `useBookSearch` | `POST /api/book-search`, `POST /api/book-analyze`, `POST /api/cancel-book-analysis`, `POST /api/philosopher-panel`, `GET /api/books/top`, `POST /api/tts` |
| **Cinema** | `useCinemaSidebar`, `useFilmSearch` | `POST /api/film-search` (TMDB proxy), `POST /api/cinema-analyze`, `POST /api/philosopher-panel`, `GET /api/cinema/top`, `POST /api/tts` |
| **News** | `useNews`, `useNewsPreferences`, `components/news/NewsSidebar.jsx` | `GET /api/news/search`, `GET /api/news/breaking`, `POST /api/news-analyze`, `POST /api/news/translate`, `POST /api/news/tts`, `GET/PUT /api/user/news-preferences`, `POST /api/user/news-preferences/unlock` (1 credit), `POST /api/philosopher-panel` |
| **Ideas** (Colloquium + Debates) | `useIdeas`, `useColloquium`, `useDebate`, `components/community/DebatePanel.jsx` | `GET /api/colloquium`, `GET /api/colloquium/:id`, `POST /api/colloquium/{propose, open-debate}`, `POST /api/colloquium/:id/{access, participate, add-philosopher, poll-vote, invite, verdict, retry}`, `GET /api/colloquium/:id/verdict-audio`, `GET /api/colloquium/roster`; forum: `GET/POST /api/forum/threads`, `GET/DELETE /api/forum/threads/:id`, `POST .../replies`, `PUT/DELETE /api/forum/replies/:id`, `POST .../vote`, `POST .../wrapup`, `GET .../wrapup-audio`, `POST .../invite`; share preview `GET /api/share-preview/debate/:id`. Realtime channels for live updates. |
| **History** | `useConstellation`, `components/history/*` | `GET /api/history/constellation` — nothing else (see §2) |
| **Quiz** | `useQuiz`, `components/quiz/QuizSidebar.jsx` (local 401-refresh wrapper) | `POST /api/quiz/{start, answer, continue, end}` (start/continue reserve+confirm 1 credit), `GET /api/quiz/{question, resume, leaderboard, profile}`, `POST /api/quiz/profile` |
| **Community** | `useCommunity`, `CommunityHub` (tabs: people/messages/agora/collective/underground), `useChat`, `useDM`, `useCollective`, `useUnderground`, `usePresence`, `useCrypto` | agora: `GET/POST /api/chat`, `PATCH/DELETE /api/chat/:id`; DMs: `/api/dm/conversations*` family (messages, reactions, members, keys, read, share-analysis), `GET /api/dm/user/:id`; people: `GET /api/people`, `POST /api/contacts/match`; blocking `/api/users/block*`; E2E keys `/api/crypto/*`; collective: `/api/collective*` family; underground: `/api/underground*`; gates: `GET /api/spaces/{space}/status`, `POST /api/spaces/{space}/unlock` (credits); push: `GET /api/push/vapid-key`, `POST /api/push/{subscribe, unsubscribe}`, `GET/PATCH /api/push/preferences`. Realtime presence + channels. |
| **Unsafe Zone** | `useUnsafeZone`, `components/unsafe-zone/UnsafeZoneSidebar.jsx` | `POST /api/unsafe-zone` (10 credits/20 turns, +5/10), `GET /api/unsafe-zone/{conversation, history, session/:id}`, `POST /api/unsafe-zone/end` |
| **Account / History-of-use** | `components/account/AccountModal.jsx`, `useAccountHistory` | `GET /api/user-history` (unified: analyses+panels+debates+unsafe-zone+quiz), `GET /api/history` (credit statement), `GET/PATCH /api/profile`, push prefs; replay routes through `GET /api/{analysis, book-analysis, cinema-analysis, panel}/:id` |
| **Sharing** | `ShareButton`, `ShareToDMButton`, `ShareToCommunityButton`, `pages/SharedAnalysis.jsx` | `POST /api/share`, `GET /api/shared/:identifier`, `POST /api/track-referral`, OG preview pages `GET /api/share-preview/{panel, debate}/:id` |
| **Ad slots (in-app)** | `components/ads/InlineAdSlot.jsx` (Music/Literature/Cinema/News sidebars + constellation panel) | `GET /api/ads/serve`, `POST /api/ads/impression` (after 1.2 s), `POST /api/ads/click` |
| **Payments** | `PaymentModal`, `useLocalizedPricing`, `services/stripe/checkout.js` | `GET /api/pricing` (geo-localized display), `POST /api/create-checkout`, `POST /api/verify-payment`, Stripe-hosted checkout |

Backend facts a reviewer should know: single Cloudflare Worker (`api/index.js`, ~4.8k lines, hand-rolled routing); rate limiters (10/min general, 3/min AI) + daily AI cap 100/user/day; body limit 1 MB (50 MB for creative upload); cron jobs refresh Top-10/Top-books/Top-films/breaking-news, reap stale credit reservations every 5 min, and run colloquium generation/verdicts on schedule. Public endpoints besides shares/config/feeds: `GET /api/history/constellation`, `GET /api/panel/:id` (KV-backed, unauthenticated).

---

## 5. i18n — and what a designer must not break

### 5.1 Mechanism

- **Library:** `i18next` + `react-i18next`, custom lazy loading (`site/src/i18n/config.js`). **18 locales**: en, pt, es, de, fr, it, hu, zh, ja, ko, ru, he, ar, hi, fa, nl, pl, tr. English is bundled; every other locale is a code-split JSON chunk loaded on demand (`site/src/i18n/translations/*.json`).
- **Selection:** `localStorage.preferredLanguage`, else browser language, else `en` (with an anti-"sticky-English" rule that prefers the browser language over a previously auto-saved `en`). On change: `document.documentElement.lang` is set, and `data-rtl="true|false"` is stamped on `<html>` for he/ar/fa. **The layout stays LTR by design** — RTL is applied via CSS to text content only, keyed off `[data-rtl]`.
- **Fonts per locale:** Google Fonts load Orbitron/Inter (legacy) + Michroma/Inter/Newsreader (v2) in `site/index.html`; `site/src/styles/v2-foundation.css` re-declares the three v2 font tokens per script via `:root:lang()` — Arabic/Farsi → Noto (Sans/Naskh) Arabic, Hebrew → Noto Hebrew, Hindi → Noto Devanagari, ja/ko/zh → Noto JP/KR/SC, ru → Noto Serif for prose (Newsreader lacks Cyrillic). Font files lazy-load via `utils/localeFonts.js` on locale change. CJK prose line-height 1.8 is scheduled for WP4 (not yet landed).
- **Backend text:** analyses are generated **directly in the requested language** and stored as separate `analyses` rows per language (no translation table). The philosophical guide is a **single English KV text** (`guide_text`, bundled fallback in `api/guides/`); prompts instruct the model to answer in the user's language. UI-side machine translation exists only for news articles (`POST /api/news/translate`) and community content (`POST /api/translate`). Auth emails are localized server-side (`api/src/auth/email.js`). The constellation ships its own key families (`constellation.*`, `historicalEvents.*` — including 182 translated philosopher names and 264 descriptions).

### 5.2 Do-not-break list

1. **`VITE_API_URL` is load-bearing:** `config/environment.js` throws at module load without it (five files also carry a hardcoded `https://api.philosify.org` fallback: Router, TopTenTicker, ttsCache, useConstellation, ads portal).
2. **Global CSS order** (`site/src/styles/global.css` imports, in order): `tokens.css` → `v2-foundation.css` → `base` → `layout` → `search` → `ui` → `results` → `modal-cyberpunk` → `modal-features` → `responsive` → `desktop` → `utilities` → `layout-locked.css`. v2 component styles (`v2-components.css`) are imported by `PageShell` and scoped under `.v2`; everything v2 depends on the token variables from `tokens.css`.
3. **Theme wiring:** dark is default; the white theme is exactly `body.t-white` (localStorage `philosify_theme`, `utils/theme.js`, applied pre-render in `main.jsx`). Pre-v2 surfaces ignore it by design.
4. **`<html lang>` and `data-rtl`** are set by i18n at runtime — CSS keyed on `:root:lang()` and `[data-rtl]` depends on them; do not hardcode either attribute.
5. **Auth is cookie-based:** every fetch needs `credentials:'include'`; 401s are recovered by calling `GET /auth/session` and retrying once — several modules implement this dance.
6. **`pendingAction` (localStorage) + router state** is the thread that survives the Stripe round-trip; the success page and `PaymentReturnHandler` reopen the right sidebar from it.
7. **Window events are API:** `credits-changed` (refreshes balance), `auth-changed` (re-checks session), `pwa-install-available` / `pwa-installed`, `push-navigate` (SW push → router). The `beforeinstallprompt` capture at module top of `main.jsx` must stay before any async init.
8. **PWA:** `manifest.json` + service worker via `utils/pwa.js`; standalone mode shows a splash (`.splash-screen`); `theme-color #070708`.
9. **Sidebars are the navigation.** Modules are overlay state, not URLs; the only deep links are `/debate/:id` and the share pages. Anything that assumes URL-per-module will break resume-after-payment, push navigation, and history replay, all of which target sidebars.
10. **The constellation hardcodes its world:** `#0a0a0f` canvas, `#D6158C` magenta, Orbitron, category colors, school colors, and **runtime textures from unpkg.com** — it consumes no design tokens and no theme.
11. **Analyses reveal is time-gated to the ad slot** (`waitForMinimumAnalysisWindow`); removing the `InlineAdSlot` mount changes billing-relevant behavior, not just visuals.
12. **Free-tier ceiling is schema-enforced:** `credits.free_remaining` has a CHECK ≤ 2; `credits.total` is a generated column — never write it.
13. **Legal pages render sanitized i18n HTML** (`DOMPurify`) and load the logo from `VITE_CDN_URL`.
14. **OG/share meta:** `site/index.html` still points `og:image`/`twitter:image` at legacy `/philosify-og.svg`; share previews are server-rendered HTML pages (`/api/share-preview/*`, `GET /shared/:id`) with their own OG tags pointing at `https://philosify.org/logo.png`.
15. **Dev-only `/dev/v2`** must keep its `import.meta.env.DEV` gate (verified absent from production bundles).
