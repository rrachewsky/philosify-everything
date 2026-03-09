# Frontend Refactoring Plan

## Executive Summary

Transform the monolithic `site/index.html` (5,074 lines, 240KB) into a modern, modular React application following the same principles applied to the backend refactoring.

**Status:** In Progress - Phase 0 (Pre-Flight Analysis)
**Target:** Modular React + Vite architecture
**Impact:** Improved maintainability, testing, and developer experience
**Timeline:** 7 weeks (optimized from 10 weeks through parallel development)

---

## Current State Analysis

### File Structure (Before)
```
site/
├── index.html          # 5,074 lines, 240KB - EVERYTHING
├── philosify.css       # 7.4KB - Additional styles
└── favicon.ico         # 32KB - Site icon
```

### Content Breakdown of `index.html`

| Section | Lines | Description |
|---------|-------|-------------|
| **CSS Styles** | 1-1,258 | Embedded `<style>` tags with all styling |
| **HTML Structure** | 1,259-4,293 | DOM structure, modals, forms |
| **JavaScript/React** | 4,294-5,074 | All logic, components, API calls |

### Current Components (All Embedded)

**React Components Identified:**
1. **Authentication System**
   - Login Modal
   - Signup Modal
   - Password Reset
   - User Profile

2. **Search & Analysis**
   - Spotify Search Input
   - Search Carousel
   - Model Selector (dropdown)
   - Analyze Button

3. **Results Display**
   - Philosophical Scores
   - Score Cards (5 dimensions)
   - Classification Display
   - Analysis Text
   - Ambivalence Indicators

4. **UI Components**
   - Header with Video Background
   - Language Selector (12 languages)
   - Credit Balance Display
   - Payment Modal (Stripe)
   - Legal Modals (Terms, Privacy)
   - Toast Notifications

5. **Business Logic**
   - Supabase Authentication
   - Stripe Payment Integration
   - API Communication
   - Credit Management
   - State Management
   - i18n (12 languages inline)

---

## Proposed Architecture

### Target File Structure
```
philosify-web/
│
├── site/                              # Frontend root (NEW STRUCTURE)
│   ├── public/                        # Static assets
│   │   ├── index.html                 # Minimal HTML shell
│   │   ├── favicon.ico                # Site icon
│   │   └── videos/                    # Background videos
│   │
│   ├── src/                           # Source code
│   │   ├── main.jsx                   # Entry point
│   │   ├── App.jsx                    # Root component
│   │   │
│   │   ├── components/                # React components
│   │   │   ├── auth/                  # Authentication
│   │   │   │   ├── LoginModal.jsx
│   │   │   │   ├── SignupModal.jsx
│   │   │   │   ├── PasswordReset.jsx
│   │   │   │   ├── UserProfile.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── header/                # Header section
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── VideoBackground.jsx
│   │   │   │   ├── LanguageSelector.jsx
│   │   │   │   ├── TopStrip.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── search/                # Search functionality
│   │   │   │   ├── SearchInput.jsx
│   │   │   │   ├── SearchCarousel.jsx
│   │   │   │   ├── ModelSelector.jsx
│   │   │   │   ├── AnalyzeButton.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── results/               # Analysis results
│   │   │   │   ├── ResultsContainer.jsx
│   │   │   │   ├── PhilosophicalScores.jsx
│   │   │   │   ├── ScoreCard.jsx
│   │   │   │   ├── Classification.jsx
│   │   │   │   ├── IntegratedAnalysis.jsx
│   │   │   │   ├── AmbivalenceIndicator.jsx
│   │   │   │   ├── SpotifyPlayer.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── payments/              # Payment system
│   │   │   │   ├── CreditBalance.jsx
│   │   │   │   ├── PaymentModal.jsx
│   │   │   │   ├── PackageSelector.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── legal/                 # Legal modals
│   │   │   │   ├── TermsModal.jsx
│   │   │   │   ├── PrivacyModal.jsx
│   │   │   │   └── index.js
│   │   │   │
│   │   │   └── common/                # Shared components
│   │   │       ├── Modal.jsx
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Toast.jsx
│   │   │       ├── Spinner.jsx
│   │   │       └── index.js
│   │   │
│   │   ├── services/                  # API & External Services
│   │   │   ├── api/                   # Backend API
│   │   │   │   ├── analyze.js         # Analysis endpoints
│   │   │   │   ├── search.js          # Spotify search
│   │   │   │   ├── balance.js         # Credit balance
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── supabase/              # Supabase client
│   │   │   │   ├── client.js          # Supabase setup
│   │   │   │   ├── auth.js            # Auth methods
│   │   │   │   └── index.js
│   │   │   │
│   │   │   └── stripe/                # Stripe integration
│   │   │       ├── client.js          # Stripe.js setup
│   │   │       ├── checkout.js        # Checkout flow
│   │   │       └── index.js
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useAuth.js             # Authentication state
│   │   │   ├── useCredits.js          # Credit management
│   │   │   ├── useLanguage.js         # i18n state
│   │   │   ├── useAnalysis.js         # Analysis logic
│   │   │   ├── useSpotifySearch.js    # Spotify search
│   │   │   └── index.js
│   │   │
│   │   ├── contexts/                  # React Context
│   │   │   ├── AuthContext.jsx        # Auth state provider
│   │   │   ├── LanguageContext.jsx    # Language state
│   │   │   ├── ThemeContext.jsx       # Theme (future)
│   │   │   └── index.js
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── validation.js          # Form validation
│   │   │   ├── formatters.js          # Data formatting
│   │   │   ├── constants.js           # App constants
│   │   │   ├── storage.js             # localStorage helpers
│   │   │   └── index.js
│   │   │
│   │   ├── i18n/                      # Internationalization
│   │   │   ├── translations/          # Translation files
│   │   │   │   ├── en.json            # English
│   │   │   │   ├── pt.json            # Portuguese
│   │   │   │   ├── es.json            # Spanish
│   │   │   │   ├── de.json            # German
│   │   │   │   ├── fr.json            # French
│   │   │   │   ├── it.json            # Italian
│   │   │   │   ├── hu.json            # Hungarian
│   │   │   │   ├── he.json            # Hebrew
│   │   │   │   ├── ru.json            # Russian
│   │   │   │   ├── zh.json            # Chinese
│   │   │   │   ├── ja.json            # Japanese
│   │   │   │   └── ko.json            # Korean
│   │   │   ├── config.js              # i18n setup
│   │   │   └── index.js
│   │   │
│   │   ├── styles/                    # CSS/Style files
│   │   │   ├── global.css             # Global styles
│   │   │   ├── variables.css          # CSS variables
│   │   │   ├── animations.css         # Animations
│   │   │   ├── components/            # Component styles
│   │   │   │   ├── header.css
│   │   │   │   ├── auth.css
│   │   │   │   ├── search.css
│   │   │   │   ├── results.css
│   │   │   │   └── modals.css
│   │   │   └── index.js
│   │   │
│   │   └── config/                    # Configuration
│   │       ├── environment.js         # Env variables
│   │       ├── routes.js              # Route definitions (future)
│   │       └── index.js
│   │
│   ├── .env.example                   # Environment template
│   ├── .env.local                     # Local environment (git-ignored)
│   ├── vite.config.js                 # Vite configuration
│   ├── package.json                   # Dependencies
│   └── README.md                      # Frontend documentation
│
└── (rest of project remains the same)
```

---

## Technology Stack

### Core Framework
- **React 18** - UI framework (already in use)
- **Vite** - Build tool (fast, modern replacement for CRA)
  - **Why Vite?** 10-20x faster dev server (1-3s vs 20-30s), instant HMR (<200ms), zero config, modern ESM-based, 98% developer satisfaction
  - **Alternatives considered:** CRA (deprecated), Webpack (too complex), Next.js (overkill for SPA)
- **React Router** - Client-side routing (future multi-page support)

### State Management
- **React Context API** - Global state (auth, language, credits)
  - **Decision:** Start with Context API, evaluate Zustand later if needed (current app has simple state)
  - **Alternatives considered:** Redux (overkill), Zustand (premature optimization)
- **Custom Hooks** - Business logic encapsulation

### Styling
- **CSS Modules** - Scoped component styles
  - **Decision:** CSS Modules for familiar syntax and scoped styles
  - **Alternatives considered:** Tailwind (requires design changes), Styled-Components (runtime cost)
- **CSS Variables** - Theme tokens
- Keep existing design system

### Language & Type Safety
- **JavaScript (ES2020+)** - Start with JavaScript for faster migration
  - **Future:** Add TypeScript in Phase 2 after structure stabilizes
  - **Decision:** JS first = lower risk, faster initial development

### Internationalization
- **react-i18next** - i18n library (replaces inline UI object)
- JSON files for translations (12 languages)

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vite Dev Server** - Hot module replacement
- **Vitest** - Testing framework (Vite-native, fast)
- **@testing-library/react** - Component testing

---

## Migration Strategy

### Phase 0: Pre-Flight Analysis (3-5 days) **NEW**
**Goal:** Extract and document everything before coding

**Tasks:**
1. Extract all API contracts from current code
   - Document all backend endpoints used
   - Map request/response formats
   - Identify authentication headers needed
2. Map all React components in current monolith
   - Create component inventory
   - Document props and state for each
   - Identify component dependencies
3. Document state management and data flow
   - Map authentication flow
   - Map credit system flow
   - Map analysis flow (search → analyze → results)
4. List all dependencies and environment variables
   - Extract Supabase config
   - Extract Stripe config
   - Document all API keys needed
5. Create migration checklist
   - Pre-migration tests
   - Phase-by-phase validation
   - Rollback procedures

**Deliverables:**
- ✅ `API_CONTRACTS.md` - All backend endpoints documented
- ✅ `COMPONENT_INVENTORY.md` - All components mapped
- ✅ `STATE_FLOW.md` - Data flow diagrams
- ✅ `DEPENDENCIES.md` - All external dependencies listed
- ✅ `MIGRATION_CHECKLIST.md` - Step-by-step validation checklist

---

### Phase 1: Setup & Foundation (Week 1)
**Goal:** Initialize build system and project structure

**Tasks:**
1. Initialize Vite project in `site/` directory
2. Install dependencies (React, React Router, i18n, Vitest)
3. Create folder structure (`src/`, `components/`, etc.)
4. Set up build configuration
5. Configure environment variables
6. Extract and organize existing CSS into modules
7. **NEW:** Set up Vitest testing framework
8. **NEW:** Configure git rollback tags

**Deliverables:**
- ✅ `vite.config.js` configured
- ✅ `vitest.config.js` configured
- ✅ `package.json` with all dependencies
- ✅ `.env.example` with required variables
- ✅ CSS organized into style modules
- ✅ Build successfully compiles
- ✅ Tests run successfully
- ✅ Git tag: `frontend-refactor-phase1-complete`

---

### Phase 2: Extract Services & Custom Hooks (Week 1-2) **UPDATED**
**Goal:** Create service layer, utilities, and business logic hooks

**Tasks:**
1. Extract Supabase configuration → `services/supabase/`
2. Extract API calls → `services/api/`
3. Extract Stripe setup → `services/stripe/`
4. Create utility functions → `utils/`
5. Extract constants and config → `config/`
6. **NEW:** Create custom hooks → `hooks/`
   - `useAuth` - Authentication state and methods
   - `useCredits` - Credit balance and consumption
   - `useAnalysis` - Song analysis logic
   - `useSpotifySearch` - Spotify search
   - `useModal` - Modal state management

**Deliverables:**
- ✅ `services/supabase/client.js` - Supabase setup
- ✅ `services/api/analyze.js` - Analysis API
- ✅ `services/stripe/client.js` - Stripe setup
- ✅ `utils/validation.js` - Form validation
- ✅ `config/environment.js` - Env variables
- ✅ `hooks/useAuth.js` - Auth hook
- ✅ `hooks/useCredits.js` - Credits hook
- ✅ `hooks/useAnalysis.js` - Analysis hook
- ✅ `hooks/useSpotifySearch.js` - Search hook
- ✅ `hooks/useModal.js` - Modal hook
- ✅ Git tag: `frontend-refactor-phase2-complete`

---

### Phase 3: Extract i18n (Week 2)
**Goal:** Internationalization system

**Tasks:**
1. Extract UI translations to JSON files (12 languages)
2. Set up `react-i18next`
3. Create `useLanguage` hook
4. Create `LanguageContext` provider
5. Replace inline `UI[lang]` with `t('key')`

**Deliverables:**
- ✅ 12 JSON translation files (`i18n/translations/`)
- ✅ `i18n/config.js` - i18next setup
- ✅ `hooks/useLanguage.js`
- ✅ `contexts/LanguageContext.jsx`
- ✅ Git tag: `frontend-refactor-phase3-complete`

**Note:** Can be parallelized with Phase 2 services/hooks work

---

### Phase 4: Build Component Library (Week 2-4) **RENUMBERED + PARALLEL**
**Goal:** Reusable UI components

**Tasks:**
1. **Common Components**
   - `Modal.jsx` - Base modal component
   - `Button.jsx` - Reusable button
   - `Input.jsx` - Form input
   - `Toast.jsx` - Notifications
   - `Spinner.jsx` - Loading state

2. **Header Components**
   - `Header.jsx` - Main header
   - `VideoBackground.jsx` - Video banner
   - `LanguageSelector.jsx` - Language dropdown
   - `TopStrip.jsx` - Top navigation bar

3. **Auth Components**
   - `LoginModal.jsx`
   - `SignupModal.jsx`
   - `PasswordReset.jsx`
   - `UserProfile.jsx`

4. **Search Components**
   - `SearchInput.jsx`
   - `SearchCarousel.jsx`
   - `ModelSelector.jsx`
   - `AnalyzeButton.jsx`

5. **Results Components**
   - `ResultsContainer.jsx`
   - `PhilosophicalScores.jsx`
   - `ScoreCard.jsx`
   - `Classification.jsx`
   - `IntegratedAnalysis.jsx`

6. **Payment Components**
   - `CreditBalance.jsx`
   - `PaymentModal.jsx`
   - `PackageSelector.jsx`

7. **Legal Components**
   - `TermsModal.jsx`
   - `PrivacyModal.jsx`

**Deliverables:**
- ✅ 25+ modular React components
- ✅ Component styles (CSS modules)
- ✅ Component documentation
- ✅ Git tag: `frontend-refactor-phase4-complete`

**Note:** Auth & Payment components can be built in parallel with Search & Results components

---

### Phase 5: Create Context Providers (Week 4) **RENUMBERED**
**Goal:** Global state management

**Tasks:**
1. Create `AuthContext` - User authentication state
2. Create `LanguageContext` - Selected language
3. Wire up contexts in `App.jsx`
4. Connect components to contexts

**Deliverables:**
- ✅ `contexts/AuthContext.jsx`
- ✅ `contexts/LanguageContext.jsx`
- ✅ Context providers in `App.jsx`
- ✅ Git tag: `frontend-refactor-phase5-complete`

---

### Phase 6: Build Main App Structure (Week 4-5) **RENUMBERED**
**Goal:** Assemble all components

**Tasks:**
1. Create `App.jsx` - Root component
2. Create `main.jsx` - Entry point
3. Wire up all components
4. Connect services and hooks
5. Test component integration

**Deliverables:**
- ✅ `App.jsx` - Main app component
- ✅ `main.jsx` - React entry point
- ✅ All components integrated
- ✅ App successfully renders
- ✅ Git tag: `frontend-refactor-phase6-complete`

---

### Phase 7: Testing & Validation (Week 5-6) **RENUMBERED**
**Goal:** Ensure functionality matches original

**Tasks:**
1. Test authentication flow
2. Test song search and analysis
3. Test credit system
4. Test payment flow (Stripe)
5. Test all 12 languages
6. Test responsive design (mobile, tablet, desktop)
7. Cross-browser testing
8. Performance testing

**Validation Checklist:**
- [ ] User can sign up/login
- [ ] User can search for songs (Spotify)
- [ ] User can analyze songs (4 models)
- [ ] Analysis results display correctly
- [ ] Credit balance displays correctly
- [ ] User can purchase credits (Stripe)
- [ ] All 12 languages work
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance matches or exceeds original

**Deliverables:**
- ✅ All tests passing
- ✅ Manual QA complete
- ✅ Git tag: `frontend-refactor-phase7-complete`

---

### Phase 8: Deployment & Cutover (Week 6-7) **RENUMBERED**
**Goal:** Deploy refactored frontend to production

**Tasks:**
1. Build production bundle (`npm run build`)
2. Test production build locally
3. Update Cloudflare Pages configuration
4. Deploy to staging environment
5. Final QA testing
6. Deploy to production
7. Monitor for issues
8. Archive old `index.html` → `index.html.old`

**Deliverables:**
- ✅ Production build deployed
- ✅ Cloudflare Pages updated
- ✅ Old version archived (`index.html.old`)
- ✅ Monitoring in place
- ✅ Git tag: `frontend-refactor-complete`

**Deployment Strategy:**
- Deploy to beta URL first: `https://beta.philosify.org` (Cloudflare Pages preview)
- Run parallel for 1-2 weeks
- Monitor metrics and gather feedback
- Hard cutover to production when stable

---

## Benefits

### Maintainability
- **Modular Components** - Easier to find and fix bugs
- **Separation of Concerns** - Clear boundaries between UI, logic, and services
- **Code Reusability** - DRY (Don't Repeat Yourself)

### Developer Experience
- **Hot Module Replacement** - Instant feedback during development
- **Better IDE Support** - IntelliSense, autocomplete, refactoring
- **Easier Onboarding** - Clear structure for new developers

### Testing
- **Unit Tests** - Test components and hooks in isolation
- **Integration Tests** - Test component interactions
- **E2E Tests** - Test full user flows

### Performance
- **Code Splitting** - Load only what's needed
- **Tree Shaking** - Remove unused code
- **Optimized Builds** - Minified, bundled, cached

### Scalability
- **Easy to Add Features** - Clear patterns to follow
- **Easy to Refactor** - Components are isolated
- **Easy to Scale Team** - Multiple devs can work in parallel

---

## Risk Mitigation

### Risks & Solutions

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Breaking existing functionality** | High | Comprehensive testing before cutover |
| **SEO regression** | Medium | Maintain same HTML structure, meta tags |
| **Performance regression** | Medium | Performance benchmarks, optimization |
| **Learning curve** | Low | Documentation, code comments |
| **Deployment issues** | Medium | Test on staging first, rollback plan |

### Rollback Plan
1. Keep old `index.html` as `index.html.old`
2. If critical issues arise, revert Cloudflare Pages deployment
3. Investigate and fix issues in staging
4. Re-deploy when stable

---

## File Size Comparison

### Before
```
site/index.html:   5,074 lines, 240KB (monolith)
```

### After (Estimated)
```
src/components/:   ~2,500 lines (25 files, avg 100 lines each)
src/services/:     ~800 lines (12 files)
src/hooks/:        ~600 lines (6 files)
src/contexts/:     ~300 lines (3 files)
src/utils/:        ~400 lines (5 files)
src/i18n/:         ~200 lines (config + 12 JSON files)
src/styles/:       ~1,200 lines (CSS modules)
App.jsx + main.jsx: ~200 lines
─────────────────────────────────────────
Total:             ~6,200 lines (but MUCH more maintainable)
```

**Note:** While line count increases slightly, the code is now:
- ✅ Modular and organized
- ✅ Easier to test
- ✅ Easier to maintain
- ✅ Easier to scale

---

## Success Metrics

### Quantitative
- [ ] **Build Time** - Under 10 seconds for development builds
- [ ] **Bundle Size** - Under 300KB gzipped (initial load)
- [ ] **Load Time** - Under 2 seconds on 3G connection
- [ ] **Test Coverage** - Minimum 70% code coverage
- [ ] **Zero Regressions** - All existing features work identically

### Qualitative
- [ ] **Developer Satisfaction** - Easier to work with
- [ ] **Code Quality** - Clean, readable, maintainable
- [ ] **Documentation** - Clear component documentation
- [ ] **Type Safety** (Optional) - Consider TypeScript migration later

---

## Future Enhancements (Post-Refactor)

### Short Term
1. **TypeScript Migration** - Add type safety
2. **Unit Tests** - Test components and hooks
3. **Storybook** - Component documentation and testing
4. **Dark Mode** - Theme switching

### Long Term
1. **Multi-Page App** - React Router for dedicated pages
   - `/analyze` - Analysis page
   - `/profile` - User profile
   - `/pricing` - Pricing page
   - `/about` - About page
2. **PWA** - Progressive Web App (offline support)
3. **Mobile App** - React Native version
4. **Admin Dashboard** - Separate admin interface

---

## Timeline Summary (Optimized)

| Phase | Duration | Key Deliverables | Can Parallelize? |
|-------|----------|------------------|------------------|
| 0. Pre-Flight Analysis | 3-5 days | API contracts, component inventory, docs | No |
| 1. Setup & Foundation | 1 week | Vite + Vitest config, folder structure | No |
| 2. Services & Hooks | 1.5 weeks | API services, custom hooks | **Yes** (with Phase 3) |
| 3. i18n Extraction | 1 week | 12 language JSON files, i18next | **Yes** (with Phase 2) |
| 4. Component Library | 2 weeks | 25+ React components | **Yes** (Auth/Payment \|\| Search/Results) |
| 5. Context Providers | 0.5 week | Auth & Language contexts | No |
| 6. App Integration | 1 week | App.jsx, wire all components | No |
| 7. Testing & Validation | 1 week | QA, manual testing, bug fixes | No |
| 8. Deployment | 1 week | Beta deploy, prod cutover | No |
| **Total** | **~7 weeks** | **Fully refactored frontend** | **3 weeks saved!** |

**Key Optimizations:**
- Added Phase 0 for better planning (prevents surprises)
- Merged hooks into Phase 2 (hooks depend on services, not i18n)
- Parallelized Phase 2 & 3 (services + i18n can run simultaneously)
- Parallelized Phase 4 component work (different teams can work on different modules)
- Reduced Phase 5 to 0.5 weeks (contexts are simple)
- Total: **10 weeks → 7 weeks** (30% faster)

---

## Next Steps

1. ✅ **Review this plan** - Plan reviewed and optimized
2. **Begin Phase 0** - Pre-flight analysis (API contracts, component inventory)
3. **Begin Phase 1** - Initialize Vite project
4. **Track progress** - Use git tags at each phase completion

---

## Questions & Decisions

### To Decide:
- [ ] Use TypeScript from the start or migrate later?
- [ ] Use React Router now or later?
- [ ] Use CSS Modules or styled-components or Tailwind?
- [ ] Set up testing framework (Jest + React Testing Library)?
- [ ] Use Zustand/Redux or stick with Context API?

### Current Decisions:
- ✅ Use Vite (fast, modern, simple - 98% satisfaction)
- ✅ Use React 18 (already in use)
- ✅ Use react-i18next (industry standard)
- ✅ Use CSS Modules (familiar, scoped)
- ✅ Use Context API (simple state, no Redux needed)
- ✅ Start with JavaScript (TypeScript later)
- ✅ Add Vitest for testing (Vite-native)
- ✅ Keep existing design (no UI redesign)
- ✅ Deploy to Cloudflare Pages (current platform)
- ✅ Parallel deployment strategy (beta first, then cutover)

---

**Document Version:** 2.0 (Optimized)
**Last Updated:** 2025-11-11
**Author:** Claude Code
**Status:** In Progress - Phase 0
