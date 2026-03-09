# PHILOSIFY REFACTORING PLAN

**Date Created**: 2025-11-11
**Status**: In Progress
**Goal**: Transform monolithic codebase into professional, maintainable architecture with proper separation of concerns

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Identified Issues](#identified-issues)
4. [Proposed Architecture](#proposed-architecture)
5. [Refactoring Tasks](#refactoring-tasks)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)
8. [Progress Tracking](#progress-tracking)

---

## EXECUTIVE SUMMARY

Philosify is currently functional but suffers from extreme technical debt:
- **Backend**: 2,330-line monolithic file (`api/index.js`) with 44 functions
- **Frontend**: 5,062-line monolithic HTML file with embedded CSS, JS, React, and translations
- **Total Lines**: 7,392 lines in 2 files (vs. proposed ~8,000 lines across ~50+ files)

**Key Metrics**:
- 0% test coverage
- 0% code modularity
- 237KB frontend bundle (unoptimized)
- ~1,500 lines of hardcoded translation data

**Expected Outcomes**:
- ✅ 80%+ reduction in file sizes
- ✅ Proper separation of concerns
- ✅ Testable components
- ✅ Improved performance (lazy loading, code splitting)
- ✅ Better developer experience
- ✅ Maintained functionality (zero breaking changes)

---

## CURRENT STATE ANALYSIS

### Backend Architecture (`api/index.js` - 2,330 lines)

**Current Structure**:
```
api/index.js (2,330 lines)
  ├── CORS Utilities (lines 16-24)
  ├── Input Validation (lines 49-72)
  ├── Utilities (lines 78-95)
  ├── Database Functions (lines 103-228)
  ├── Authentication (lines 238-270)
  ├── Credit System (lines 277-387)
  ├── Rate Limiting (lines 396-405)
  ├── Stripe Integration (lines 411-490)
  ├── Request Handlers (lines 815-1094)
  ├── Lyrics Fetching (lines 1101-1365)
  ├── Spotify Integration (lines 1370-1511)
  ├── Guide Management (lines 1516-1595)
  ├── AI Integration (lines 1600-2316)
  └── Main Worker (lines 2334-2398)
```

**Functions by Category**:
- Authentication: 2 functions
- Database: 4 functions
- Credit System: 2 functions
- Rate Limiting: 1 function
- Payments: 4 functions
- Lyrics: 6 functions
- Spotify: 3 functions
- Guides: 3 functions
- AI Models: 5 functions
- Parsing: 3 functions
- Request Handlers: 2 functions
- Utilities: 9 functions

**Dependencies**:
```json
{
  "jose": "^5.2.0"  // JWT verification only
}
```

### Frontend Architecture (`site/index.html` - 5,062 lines)

**Current Structure**:
```
site/index.html (5,062 lines)
  ├── HTML <head> (lines 1-34)
  ├── Inline CSS (lines 35-1245) - 1,210 lines!
  ├── HTML Structure (lines 1246-1500)
  │   ├── Header (logo, auth buttons, language selector)
  │   ├── Main Container (search, video background)
  │   ├── Login Modal
  │   ├── Signup Modal
  │   ├── Credits Modal
  │   ├── Privacy Modal
  │   └── Terms Modal
  ├── JavaScript Configuration (lines 1500-1600)
  ├── Authentication Functions (lines 1600-2120)
  ├── Translation Objects (lines 2123-3500+) - ~1,500 lines!
  │   ├── 12 languages × 50+ keys
  │   ├── Privacy Policy (4 languages × ~50 lines)
  │   └── Terms of Service (4 languages × ~50 lines)
  └── React Application (lines 3500-5062)
      ├── Search Component
      ├── Analysis Component
      ├── Results Display
      └── Event Handlers
```

**External Dependencies** (CDN):
- React 18 (development - should be production)
- ReactDOM 18
- Babel Standalone (runtime transpilation - should be eliminated)
- Supabase JS SDK
- Stripe.js

### Database Schema

**Tables**:
1. `songs` (8 columns)
2. `analyses` (22 columns)
3. `user_profiles` (5 columns)
4. `transactions` (9 columns)

**RPC Functions**:
1. `process_analysis_payment` - Atomic credit deduction
2. `credit_from_stripe` - Idempotent credit addition

---

## IDENTIFIED ISSUES

### Critical (Must Fix)

#### 1. Monolithic Backend (2,330 lines)
- **Impact**: Impossible to test, hard to maintain, difficult to onboard
- **Root Cause**: All logic in single file
- **Solution**: Split into modules by concern

#### 2. Monolithic Frontend (5,062 lines)
- **Impact**: 237KB bundle, slow parsing, no caching
- **Root Cause**: Everything in one HTML file
- **Solution**: Separate HTML, CSS, JS, translations

#### 3. Hardcoded Translations (~1,500 lines)
- **Impact**: Users download all 12 languages (only need 1)
- **Root Cause**: JavaScript objects in main file
- **Solution**: External JSON files, lazy loading

#### 4. Inline CSS (1,210 lines)
- **Impact**: Can't cache, duplicated on every page load
- **Root Cause**: `<style>` tag in HTML
- **Solution**: External CSS files

#### 5. No Build Process
- **Impact**: Development React build, Babel runtime overhead
- **Root Cause**: Direct HTML file serving
- **Solution**: Vite/Webpack build system

### High (Should Fix)

#### 6. Massive Prompt Function (220 lines)
- **Location**: `api/index.js:1689-1945`
- **Impact**: Hard to version, can't A/B test
- **Solution**: External template files

#### 7. Zero Test Coverage
- **Impact**: Fear of refactoring, regression bugs
- **Solution**: Add Vitest/Jest, write integration tests

#### 8. No TypeScript
- **Impact**: Runtime errors, poor IDE support
- **Solution**: Gradual TypeScript migration

### Medium (Nice to Have)

#### 9. No Response Caching
- **Impact**: Every request hits database
- **Solution**: Cloudflare Cache API

#### 10. No Monitoring
- **Impact**: Can't detect issues proactively
- **Solution**: Add Sentry or similar

---

## PROPOSED ARCHITECTURE

### Backend Structure

```
api/
├── src/
│   ├── index.js                    # Main worker entry (50 lines)
│   ├── router.js                   # Route handlers (80 lines)
│   │
│   ├── auth/
│   │   ├── jwt.js                  # JWT verification (50 lines)
│   │   └── index.js                # Exports
│   │
│   ├── db/
│   │   ├── songs.js                # Song CRUD (100 lines)
│   │   ├── users.js                # User profiles (80 lines)
│   │   ├── transactions.js         # Transaction logging (60 lines)
│   │   ├── normalize.js            # String normalization (30 lines)
│   │   └── index.js                # Exports
│   │
│   ├── credits/
│   │   ├── consume.js              # Atomic consumption (80 lines)
│   │   ├── refund.js               # Refund logic (60 lines)
│   │   └── index.js                # Exports
│   │
│   ├── payments/
│   │   ├── stripe.js               # Checkout creation (60 lines)
│   │   ├── webhooks.js             # Webhook handling (100 lines)
│   │   ├── crypto.js               # HMAC verification (40 lines)
│   │   └── index.js                # Exports
│   │
│   ├── lyrics/
│   │   ├── genius.js               # Genius API (150 lines)
│   │   ├── letras.js               # Letras.mus.br fallback (80 lines)
│   │   ├── parser.js               # HTML parsing (60 lines)
│   │   ├── normalizer.js           # Song name cleaning (50 lines)
│   │   └── index.js                # Orchestrator (60 lines)
│   │
│   ├── spotify/
│   │   ├── search.js               # Song search (100 lines)
│   │   ├── metadata.js             # Metadata fetching (80 lines)
│   │   ├── token.js                # Token management (50 lines)
│   │   └── index.js                # Exports
│   │
│   ├── guides/
│   │   ├── loader.js               # KV guide loading (80 lines)
│   │   ├── cache.js                # In-memory caching (40 lines)
│   │   └── index.js                # Exports
│   │
│   ├── ai/
│   │   ├── models/
│   │   │   ├── claude.js           # Claude Sonnet 4 (60 lines)
│   │   │   ├── openai.js           # GPT-4o (60 lines)
│   │   │   ├── gemini.js           # Gemini 2.5 Flash (60 lines)
│   │   │   ├── grok.js             # Grok 3 (60 lines)
│   │   │   └── index.js            # Model registry
│   │   ├── prompts/
│   │   │   ├── template.js         # Prompt builder (150 lines)
│   │   │   └── calculator.js       # Score calculation (30 lines)
│   │   ├── parser.js               # JSON extraction (80 lines)
│   │   ├── orchestrator.js         # Analysis coordinator (100 lines)
│   │   ├── storage.js              # Supabase persistence (100 lines)
│   │   └── index.js                # Exports
│   │
│   ├── rate-limit/
│   │   ├── check.js                # Rate limiting logic (40 lines)
│   │   └── index.js                # Exports
│   │
│   └── utils/
│       ├── cors.js                 # CORS headers (30 lines)
│       ├── validation.js           # Input validation (50 lines)
│       ├── timeout.js              # Fetch with timeout (30 lines)
│       ├── response.js             # JSON response helper (20 lines)
│       └── index.js                # Exports
│
├── tests/
│   ├── auth.test.js
│   ├── credits.test.js
│   ├── lyrics.test.js
│   └── ...
│
├── package.json
├── wrangler.toml
└── vitest.config.js
```

**Estimated Line Count**: ~2,500 lines (vs. 2,330 current)
- Slight increase due to module overhead
- Massive improvement in maintainability

### Frontend Structure

```
site/
├── public/
│   ├── index.html                  # Minimal shell (50 lines)
│   ├── favicon.ico
│   └── images/
│
├── src/
│   ├── main.jsx                    # App entry (30 lines)
│   ├── App.jsx                     # Root component (100 lines)
│   │
│   ├── components/
│   │   ├── Header.jsx              # Logo, auth, language (120 lines)
│   │   ├── SearchBar.jsx           # Song search (150 lines)
│   │   ├── SearchDropdown.jsx      # Results carousel (100 lines)
│   │   ├── AnalysisForm.jsx        # Model selection (80 lines)
│   │   ├── ResultsDisplay.jsx      # Scores, analysis (200 lines)
│   │   ├── VideoBackground.jsx     # Background video (40 lines)
│   │   ├── Footer.jsx              # Links (50 lines)
│   │   │
│   │   ├── modals/
│   │   │   ├── LoginModal.jsx      # Login form (100 lines)
│   │   │   ├── SignupModal.jsx     # Signup form (120 lines)
│   │   │   ├── CreditsModal.jsx    # Credit packages (80 lines)
│   │   │   ├── PrivacyModal.jsx    # Privacy policy (60 lines)
│   │   │   └── TermsModal.jsx      # Terms of service (60 lines)
│   │   │
│   │   └── ui/
│   │       ├── Button.jsx          # Reusable button (40 lines)
│   │       ├── Modal.jsx           # Base modal (60 lines)
│   │       └── LoadingSpinner.jsx  # Loading states (30 lines)
│   │
│   ├── hooks/
│   │   ├── useAuth.js              # Auth state management (100 lines)
│   │   ├── useBalance.js           # Credit balance (50 lines)
│   │   ├── useSearch.js            # Search logic (80 lines)
│   │   ├── useAnalysis.js          # Analysis orchestration (120 lines)
│   │   └── useTranslation.js       # i18n hook (60 lines)
│   │
│   ├── lib/
│   │   ├── supabase.js             # Supabase client (40 lines)
│   │   ├── api.js                  # API client (100 lines)
│   │   └── constants.js            # App constants (30 lines)
│   │
│   ├── i18n/
│   │   ├── index.js                # i18n setup (50 lines)
│   │   ├── en.json                 # English (200 lines)
│   │   ├── pt.json                 # Portuguese (200 lines)
│   │   ├── es.json                 # Spanish (200 lines)
│   │   ├── fr.json                 # French (200 lines)
│   │   ├── de.json                 # German (200 lines)
│   │   ├── it.json                 # Italian (200 lines)
│   │   ├── ru.json                 # Russian (200 lines)
│   │   ├── hu.json                 # Hungarian (200 lines)
│   │   ├── he.json                 # Hebrew (200 lines)
│   │   ├── zh.json                 # Chinese (200 lines)
│   │   ├── ja.json                 # Japanese (200 lines)
│   │   └── ko.json                 # Korean (200 lines)
│   │
│   ├── styles/
│   │   ├── index.css               # Global styles (100 lines)
│   │   ├── variables.css           # CSS variables (50 lines)
│   │   ├── base.css                # Reset, typography (100 lines)
│   │   ├── header.css              # Header styles (150 lines)
│   │   ├── search.css              # Search UI (200 lines)
│   │   ├── results.css             # Results display (300 lines)
│   │   ├── modals.css              # Modal styles (200 lines)
│   │   └── responsive.css          # Media queries (150 lines)
│   │
│   └── legal/
│       ├── privacy-en.html         # Privacy (English)
│       ├── privacy-pt.html         # Privacy (Portuguese)
│       ├── terms-en.html           # Terms (English)
│       └── terms-pt.html           # Terms (Portuguese)
│
├── package.json
├── vite.config.js
└── jsconfig.json
```

**Estimated Line Count**: ~5,500 lines (vs. 5,062 current)
- Includes proper component structure
- Separation of concerns
- Lazy-loadable modules

---

## REFACTORING TASKS

### Phase 1: Backend Modularization (Estimated: 8-12 hours)

#### Task 1.1: Setup Module Structure
- [ ] Create `api/src/` directory structure
- [ ] Create empty module files with exports
- [ ] Update `package.json` with type: "module"

#### Task 1.2: Extract Utilities (Low Risk)
- [ ] Move `getCorsHeaders()` → `src/utils/cors.js`
- [ ] Move `validateSongInput()` → `src/utils/validation.js`
- [ ] Move `fetchWithTimeout()` → `src/utils/timeout.js`
- [ ] Move `jsonResponse()` → `src/utils/response.js`
- [ ] Test: Health endpoint still works

#### Task 1.3: Extract Authentication (Low Risk)
- [ ] Move `getUserFromAuth()` → `src/auth/jwt.js`
- [ ] Test: Protected endpoints still require auth

#### Task 1.4: Extract Database Functions (Medium Risk)
- [ ] Move `normalizeString()` → `src/db/normalize.js`
- [ ] Move `getOrCreateSong()` → `src/db/songs.js`
- [ ] Move `getUserProfile()` → `src/db/users.js`
- [ ] Move `createTransaction()` → `src/db/transactions.js`
- [ ] Test: Analysis can create songs

#### Task 1.5: Extract Credit System (High Risk)
- [ ] Move `consumeOne()` → `src/credits/consume.js`
- [ ] Move `refundCredit()` → `src/credits/refund.js`
- [ ] Test: Analysis deducts credits correctly
- [ ] Test: Race conditions prevented

#### Task 1.6: Extract Payment System (High Risk)
- [ ] Move `pickPriceIdFromRequest()` → `src/payments/stripe.js`
- [ ] Move `createStripeCheckout()` → `src/payments/stripe.js`
- [ ] Move `hmacSHA256Hex()` → `src/payments/crypto.js`
- [ ] Move `safeEq()` → `src/payments/crypto.js`
- [ ] Move `verifyStripeWebhook()` → `src/payments/webhooks.js`
- [ ] Test: Checkout creation works
- [ ] Test: Webhook signature verification works

#### Task 1.7: Extract Lyrics System (Medium Risk)
- [ ] Move `cleanSongName()` → `src/lyrics/normalizer.js`
- [ ] Move `simplifyArtist()` → `src/lyrics/normalizer.js`
- [ ] Move `createSlug()` → `src/lyrics/normalizer.js`
- [ ] Move `extractLyricsFromHTML()` → `src/lyrics/parser.js`
- [ ] Move `getLyricsFromGenius()` → `src/lyrics/genius.js`
- [ ] Move `getFromLetrasMusicasBr()` → `src/lyrics/letras.js`
- [ ] Move `getLyrics()` → `src/lyrics/index.js`
- [ ] Test: Lyrics fetching works
- [ ] Test: Fallback sources work

#### Task 1.8: Extract Spotify Integration (Low Risk)
- [ ] Move `getSpotifyToken()` → `src/spotify/token.js`
- [ ] Move `getSpotifyMetadata()` → `src/spotify/metadata.js`
- [ ] Move `getSpotifyMetadataById()` → `src/spotify/metadata.js`
- [ ] Create search handler → `src/spotify/search.js`
- [ ] Test: Spotify search works

#### Task 1.9: Extract Guide Management (Low Risk)
- [ ] Move `getGuide()` → `src/guides/loader.js`
- [ ] Move `getGuideForLanguage()` → `src/guides/loader.js`
- [ ] Add caching logic → `src/guides/cache.js`
- [ ] Test: Guides load correctly

#### Task 1.10: Extract AI Integration (High Risk)
- [ ] Move `calculatePhilosophicalNote()` → `src/ai/prompts/calculator.js`
- [ ] Move `buildAnalysisPrompt()` → `src/ai/prompts/template.js`
- [ ] Move `extractJSON()` → `src/ai/parser.js`
- [ ] Move `normalizeResponse()` → `src/ai/parser.js`
- [ ] Move `callClaude()` → `src/ai/models/claude.js`
- [ ] Move `callOpenAI()` → `src/ai/models/openai.js`
- [ ] Move `callGemini()` → `src/ai/models/gemini.js`
- [ ] Move `callGrok()` → `src/ai/models/grok.js`
- [ ] Move `analyzePhilosophy()` → `src/ai/orchestrator.js`
- [ ] Move `saveToSupabase()` → `src/ai/storage.js`
- [ ] Test: Analysis with all 4 models works

#### Task 1.11: Extract Rate Limiting (Low Risk)
- [ ] Move `checkRateLimit()` → `src/rate-limit/check.js`
- [ ] Test: Rate limiting still enforced

#### Task 1.12: Create Router (Medium Risk)
- [ ] Create `src/router.js` with route handling
- [ ] Move endpoint logic from main file
- [ ] Test: All 8 endpoints work

#### Task 1.13: Update Main Worker (Low Risk)
- [ ] Update `index.js` to use new modules
- [ ] Remove old code
- [ ] Test: Full end-to-end flow

#### Task 1.14: Add Backend Tests
- [ ] Install Vitest
- [ ] Write tests for auth
- [ ] Write tests for credits
- [ ] Write tests for payments
- [ ] Write tests for lyrics
- [ ] Write tests for AI parsing

### Phase 2: Frontend Modularization (Estimated: 12-16 hours)

#### Task 2.1: Setup Vite Project
- [ ] Install Vite + React + dependencies
- [ ] Create `vite.config.js`
- [ ] Create `src/` directory structure
- [ ] Setup build scripts in `package.json`

#### Task 2.2: Extract CSS (Low Risk)
- [ ] Create `src/styles/` directory
- [ ] Move inline CSS to separate files:
  - [ ] `variables.css` (colors, fonts)
  - [ ] `base.css` (reset, typography)
  - [ ] `header.css` (header styles)
  - [ ] `search.css` (search UI)
  - [ ] `results.css` (results display)
  - [ ] `modals.css` (modal styles)
  - [ ] `responsive.css` (media queries)
- [ ] Import in `main.jsx`
- [ ] Test: Visual appearance unchanged

#### Task 2.3: Extract Translations (High Impact)
- [ ] Create `src/i18n/` directory
- [ ] Create JSON files for each language (12 files)
- [ ] Move translation data from HTML
- [ ] Create i18n loader with lazy loading
- [ ] Create `useTranslation` hook
- [ ] Test: Language switching works
- [ ] Test: Only current language loads

#### Task 2.4: Extract Configuration (Low Risk)
- [ ] Create `src/lib/supabase.js`
- [ ] Create `src/lib/api.js`
- [ ] Create `src/lib/constants.js`
- [ ] Test: API calls work

#### Task 2.5: Create Base Components (Low Risk)
- [ ] Create `src/components/ui/Button.jsx`
- [ ] Create `src/components/ui/Modal.jsx`
- [ ] Create `src/components/ui/LoadingSpinner.jsx`

#### Task 2.6: Extract Authentication (Medium Risk)
- [ ] Create `src/hooks/useAuth.js`
- [ ] Create `src/components/modals/LoginModal.jsx`
- [ ] Create `src/components/modals/SignupModal.jsx`
- [ ] Test: Login works
- [ ] Test: Signup works
- [ ] Test: Logout works

#### Task 2.7: Extract Balance/Credits (Medium Risk)
- [ ] Create `src/hooks/useBalance.js`
- [ ] Create `src/components/modals/CreditsModal.jsx`
- [ ] Test: Balance displays correctly
- [ ] Test: Stripe checkout works

#### Task 2.8: Extract Search (Medium Risk)
- [ ] Create `src/hooks/useSearch.js`
- [ ] Create `src/components/SearchBar.jsx`
- [ ] Create `src/components/SearchDropdown.jsx`
- [ ] Test: Search works
- [ ] Test: Results display correctly

#### Task 2.9: Extract Analysis (High Risk)
- [ ] Create `src/hooks/useAnalysis.js`
- [ ] Create `src/components/AnalysisForm.jsx`
- [ ] Create `src/components/ResultsDisplay.jsx`
- [ ] Test: Analysis works
- [ ] Test: Results render correctly
- [ ] Test: Error states handled

#### Task 2.10: Extract Header & Footer (Low Risk)
- [ ] Create `src/components/Header.jsx`
- [ ] Create `src/components/Footer.jsx`
- [ ] Create `src/components/VideoBackground.jsx`

#### Task 2.11: Extract Legal Content (Low Risk)
- [ ] Create `src/legal/` directory
- [ ] Move privacy policy to HTML files
- [ ] Move terms to HTML files
- [ ] Create modal components
- [ ] Test: Modals load content

#### Task 2.12: Create Main App (Medium Risk)
- [ ] Create `src/App.jsx` (root component)
- [ ] Create `src/main.jsx` (entry point)
- [ ] Update `public/index.html` (minimal shell)
- [ ] Test: Full app renders

#### Task 2.13: Setup Build Process (Medium Risk)
- [ ] Configure Vite for production build
- [ ] Configure code splitting
- [ ] Configure lazy loading for translations
- [ ] Test: Production build works
- [ ] Test: Assets cached correctly

#### Task 2.14: Deploy & Verify (High Risk)
- [ ] Build production bundle
- [ ] Deploy to Cloudflare Pages
- [ ] Test: All features work in production
- [ ] Test: Performance improved

#### Task 2.15: Add Frontend Tests
- [ ] Install Vitest + React Testing Library
- [ ] Write tests for components
- [ ] Write tests for hooks
- [ ] Write integration tests

### Phase 3: Optimization & Documentation (Estimated: 4-6 hours)

#### Task 3.1: Performance Optimization
- [ ] Add response caching (Cloudflare Cache API)
- [ ] Add image optimization
- [ ] Add lazy loading for modals
- [ ] Add service worker for offline support

#### Task 3.2: Code Quality
- [ ] Add ESLint configuration
- [ ] Add Prettier configuration
- [ ] Fix linting errors
- [ ] Add pre-commit hooks

#### Task 3.3: Documentation
- [ ] Update README.md
- [ ] Document new architecture
- [ ] Add JSDoc comments to key functions
- [ ] Create architecture diagrams

#### Task 3.4: Monitoring
- [ ] Add error tracking (Sentry or similar)
- [ ] Add performance monitoring
- [ ] Add analytics

---

## TESTING STRATEGY

### Critical Test Cases

#### Backend
1. **Health Check**: `GET /health` returns `{ok: true}`
2. **Config Endpoint**: `GET /api/config` returns Supabase credentials
3. **Auth Flow**: JWT verification works, returns correct user
4. **Search**: Spotify search returns results
5. **Balance**: User balance displays correctly
6. **Credit Consumption**:
   - Free analysis uses `free_analyses_remaining`
   - Paid analysis deducts from `balance`
   - Insufficient credits returns 402
7. **Analysis Flow**:
   - Cached song returns instantly
   - New song fetches lyrics, calls AI, saves to DB
   - All 4 models work (Claude, GPT-4, Gemini, Grok)
8. **Stripe Checkout**: Creates valid session
9. **Stripe Webhook**:
   - Signature verification works
   - Credits added to user balance
   - Idempotency prevents duplicates
10. **Rate Limiting**: 60 requests/minute enforced

#### Frontend
1. **Rendering**: Page loads without errors
2. **Language Switching**: All 12 languages work
3. **Auth Modals**: Login and signup modals open/close
4. **Search**: Spotify search populates dropdown
5. **Analysis**:
   - Clicking "Analyze" sends request
   - Loading state shows
   - Results display correctly
6. **Balance**: Balance updates after purchase/analysis
7. **Credits Modal**: Stripe checkout redirect works
8. **Responsive**: Mobile view works correctly

### Regression Prevention
- **Before each task**: Note current behavior
- **After each task**: Verify behavior unchanged
- **Use git**: Commit after each working task
- **Rollback plan**: Keep backup of monolithic files

---

## ROLLBACK PLAN

### Quick Rollback (If Refactor Breaks)

```bash
# Revert to previous commit
git log --oneline  # Find last working commit
git reset --hard <commit-hash>
git push --force  # Only if already deployed

# Or revert specific changes
git revert <commit-hash>
```

### Backup Strategy
1. **Tag current state**: `git tag pre-refactor-backup`
2. **Create branch**: `git checkout -b refactor-wip`
3. **Work on branch**: Make all changes here
4. **Test thoroughly**: Before merging to main
5. **Merge only when confident**: `git checkout main && git merge refactor-wip`

---

## PROGRESS TRACKING

### Status Legend
- ⏳ **Pending**: Not started
- 🔄 **In Progress**: Currently working
- ✅ **Completed**: Done and tested
- ❌ **Blocked**: Needs resolution

### Phase 1: Backend Modularization

| Task | Status | Completion Date | Notes |
|------|--------|----------------|-------|
| 1.1: Setup Module Structure | ⏳ | - | - |
| 1.2: Extract Utilities | ⏳ | - | - |
| 1.3: Extract Authentication | ⏳ | - | - |
| 1.4: Extract Database Functions | ⏳ | - | - |
| 1.5: Extract Credit System | ⏳ | - | - |
| 1.6: Extract Payment System | ⏳ | - | - |
| 1.7: Extract Lyrics System | ⏳ | - | - |
| 1.8: Extract Spotify Integration | ⏳ | - | - |
| 1.9: Extract Guide Management | ⏳ | - | - |
| 1.10: Extract AI Integration | ⏳ | - | - |
| 1.11: Extract Rate Limiting | ⏳ | - | - |
| 1.12: Create Router | ⏳ | - | - |
| 1.13: Update Main Worker | ⏳ | - | - |
| 1.14: Add Backend Tests | ⏳ | - | - |

### Phase 2: Frontend Modularization

| Task | Status | Completion Date | Notes |
|------|--------|----------------|-------|
| 2.1: Setup Vite Project | ⏳ | - | - |
| 2.2: Extract CSS | ⏳ | - | - |
| 2.3: Extract Translations | ⏳ | - | - |
| 2.4: Extract Configuration | ⏳ | - | - |
| 2.5: Create Base Components | ⏳ | - | - |
| 2.6: Extract Authentication | ⏳ | - | - |
| 2.7: Extract Balance/Credits | ⏳ | - | - |
| 2.8: Extract Search | ⏳ | - | - |
| 2.9: Extract Analysis | ⏳ | - | - |
| 2.10: Extract Header & Footer | ⏳ | - | - |
| 2.11: Extract Legal Content | ⏳ | - | - |
| 2.12: Create Main App | ⏳ | - | - |
| 2.13: Setup Build Process | ⏳ | - | - |
| 2.14: Deploy & Verify | ⏳ | - | - |
| 2.15: Add Frontend Tests | ⏳ | - | - |

### Phase 3: Optimization & Documentation

| Task | Status | Completion Date | Notes |
|------|--------|----------------|-------|
| 3.1: Performance Optimization | ⏳ | - | - |
| 3.2: Code Quality | ⏳ | - | - |
| 3.3: Documentation | ⏳ | - | - |
| 3.4: Monitoring | ⏳ | - | - |

---

## IDENTIFIED BUGS & FIXES

### Bugs Found During Review

1. **None identified yet** - Will update as refactoring progresses

### Code Smells to Address

1. **Magic Numbers**: Constants like `0.60` hardcoded in code
2. **Deprecated Comments**: References to removed functions
3. **Inconsistent Error Handling**: Some functions throw, others return null
4. **Long Functions**: `buildAnalysisPrompt()` is 220 lines

---

## NOTES & OBSERVATIONS

### Positive Aspects (Don't Break These!)
- ✅ Atomic credit system with PostgreSQL locks
- ✅ Idempotent Stripe webhook handling
- ✅ Secure JWT verification with JWKS
- ✅ Multiple AI model support
- ✅ Multilingual support (12 languages)
- ✅ Artist validation in lyrics fetching
- ✅ Fallback lyrics sources

### Key Constraints
- Must maintain zero downtime during refactor
- Must not break existing analyses in database
- Must preserve all functionality
- Must maintain API contract for frontend

---

**Last Updated**: 2025-11-11
**Next Review**: After Phase 1 completion
