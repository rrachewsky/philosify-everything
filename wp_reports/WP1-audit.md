# WP1 — Frontend audit vs Migration Map (spec §3b/§3c)

**Branch:** `redesign/v2` · **Date:** 29 Jul 2026
Read through Design Law v2: monochrome/silver supersedes the spec's v1 voices (magenta/cyan),
module tints, glows, and the asymmetric bento. The Law's landing is a uniform 3×3 grid.

## §3b — Current wing features → new homes

| Current feature | Current code | New home (Law/mockup) | Mockup ref |
|---|---|---|---|
| Song search + results list | `components/search/` (SearchInput, AnalyzeButton, ModelSelector) in `App.jsx` (/app) | Top of the 720px well on the Music page | `philosify-music.html` |
| Top 50 ticker | `components/TopTenTicker.jsx` | One-line ticker under module header (bright text + silver stat) | `philosify-music.html` |
| Scan (1cr) vs Philosopher Panel (3cr) | `components/common/PhilosopherPicker.jsx` | Two-card Analysis Mode chooser, credit cost as pill on each | `philosify-music.html` |
| Progress bar + timer + Cancel | `hooks/useAnalysis.js` + inline UI | Telemetry block (`ANALYZING // 00:04.81`), cancel = secondary button | `philosify-music.html` |
| Technical specs + Spotify embed | `components/results/` (ResultsContainer) | Track header card at top of well | `philosify-music.html` |
| Philosophical Note + Classification | `components/results/ScoreCard.jsx`, `ScorecardTable.jsx` | Verdict card: classification as H2, Note as silver display numeral | `philosify-music.html` |
| Listen to Analysis + speed | `components/results/ListenButton.jsx` | Audio bar docked under Verdict card | `philosify-music.html` |
| Historical context + analysis prose | `components/results/` expandables | Expandable section cards, Newsreader prose | `philosify-music.html`, `philosify-news.html` |
| Share icons + DM + Join artist | `components/sharing/ShareButton.jsx`, `components/messages/` | Post-analysis actions row (monochrome icons until hover) | `philosify-music.html` |
| Sponsored slot in wing | `components/ads/InlineAdSlot.jsx` | S1 Post-Analysis Slot + S2 In-Flow Sponsored Cell (ads annex) | `philosify-ads-atelier.md` |
| Account block (credits, History, Buy, Logout) | `components/account/AccountModal.jsx`, `components/auth/UserProfile.jsx` | Nav identity top-right (username ▾), balance in account rail; History/Buy = modals | `philosify-landing.html`, `philosify-modals.html` |
| 18-language code grid | `components/GlobalLanguageSelector.jsx` | Language pill beside identity, dropdown of 18 | `philosify-landing.html` |
| "Philosify Ads Ateliê" link | `pages/HomePage.jsx` | Footer, alongside the lockup | `philosify-landing.html` |
| Central logo panel + word-link grid | `components/LandingScreen.jsx`, `pages/HomePage.jsx` | Retired → masthead lockup + "Select a module" + 3×3 grid | `philosify-landing.html` |

## §3c + module surfaces

| Surface | Current code | New home | Mockup ref |
|---|---|---|---|
| Sign up / Sign in | `components/auth/` (LoginModal, SignupModal, ForgotPasswordModal) | Auth page (centered card, lockup at top) | `philosify-auth.html` |
| Buy Credits | `components/payment/PaymentModal.jsx` | Transaction modal (packs as cells, display numerals) | `philosify-modals.html` |
| History (analyses + transactions) | `components/account/AccountModal.jsx` tabs | Quick History modal (rows: ID, title, tag, date, status pill) | `philosify-modals.html` |
| Report permalink | `pages/SharedAnalysis.jsx` (/a/:slug, /shared/:id) | Public report page, full card stack + Post-Analysis Slot | `philosify-music.html` |
| Legal | `pages/TermsOfService.jsx` (/tos), `pages/PrivacyPolicy.jsx` (/pp) | Legal page, Newsreader reading well, real ToS/PP text | `philosify-legal.html` |
| Music | `components/music/MusicSidebar.jsx` + `App.jsx` | Module page (News-standard template) | `philosify-music.html` |
| Cinema | `components/cinema/CinemaSidebar.jsx` | Template instance | `philosify-cinema.html` |
| Literature | `components/literature/LiteratureSidebar.jsx` | Template instance | `philosify-literature.html` |
| News | `components/news/NewsSidebar.jsx` | Template standard (ticker/search/newest-first/Scan→3-philosopher panel) | `philosify-news.html` |
| Ideas | `components/ideas/` (IdeasHub, /debate/:id route) | Template instance (daily Colloquium + user Debates) | `philosify-ideas.html` |
| History module | `components/history/` (incl. Constellation*) | Template instance; Constellation survives inside as the map (school colors = data) | `philosify-history.html` |
| Quiz | `components/quiz/QuizSidebar.jsx` | Template instance | `philosify-quiz.html` |
| Community | `components/community/CommunityHub.jsx`, `components/chat`, `components/messages` | Template instance | `philosify-community.html` |
| Unsafe Zone | `components/unsafe-zone/UnsafeZoneSidebar.jsx` | Dedicated page (inverted cell on landing) | `philosify-unsafezone.html` |
| PWA / notifications | `public/sw.js`, `utils/pwa.js` | Unchanged (notification icon → icon-192.png, done) | — |

## Notes
- Nothing in the current wing is dropped; every row above has a destination.
- `components/collective/`, `components/underground/`, `components/chat/` map into Community
  (the film's named spaces: Agora/Collective/Underground — WP3 decision point noted in spec §5c).
- Old landing video assets (`logovideo.mp4`, `LandingScreen`) retire with the new landing.
- `App.jsx` (/app) currently hosts the half-page wing layout; it is the surface the three
  shells replace in WP3.
