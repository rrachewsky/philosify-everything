# Component Inventory - Frontend Monolith Analysis

**Document Purpose:** Complete inventory of all components, state, and UI elements in `site/index.html`

**Current Structure:** Single-page React application (5,074 lines, all in one file)

---

## Main App Component

**Location:** `site/index.html:4459`

**Type:** Function component (`function App()`)

### State Variables

| State Variable | Type | Initial Value | Purpose |
|---------------|------|---------------|---------|
| `lang` | string | `window.PREFERRED_LANG \|\| "en"` | Current UI language (12 supported) |
| `q` | string | `""` | Search query input value |
| `isLoading` | boolean | `false` | Analysis in progress indicator |
| `result` | object\|null | `null` | Analysis result data |
| `searchOptions` | array | `[]` | Spotify search results |
| `selectedTrack` | object\|null | `null` | Selected Spotify track |
| `showDropdown` | boolean | `false` | Show/hide search dropdown |
| `isSearching` | boolean | `false` | Search in progress indicator |

### Refs

| Ref | Purpose |
|-----|---------|
| `lastQueryRef` | Stores last analyzed query (persistence) |
| `searchTimeoutRef` | Debounce timeout for search |

### Key Functions

| Function | Parameters | Purpose | API Calls |
|----------|-----------|---------|-----------|
| `searchSongs` | `query: string` | Search Spotify for songs | `POST /api/search` |
| `handleInputChange` | `value: string` | Handle search input (debounced) | Indirect (triggers `searchSongs`) |
| `selectTrack` | `track: object` | Select song from dropdown | None |
| `analyze` | `withQuery?: string` | Analyze song philosophically | `POST /api/analyze` |
| `translateClassification` | `classification: string` | Translate classification to current language | None |

### Event Listeners

| Event | Handler | Purpose |
|-------|---------|---------|
| `ph-set-lang` | `onSetLang` | Change language (from header) |
| `ph-analyze` | `onAnalyze` | Trigger analysis (from header) |

### Effects

1. **Language Event Listeners** - Listen for language change and analyze events
2. **Document Language** - Update `<html lang>` and `dir` attributes
3. **Button Text Update** - Update analyze button text based on loading state

---

## UI Components (Implicit - Not Separated)

These are logical UI sections that should become separate components:

### 1. Header Section

**HTML Location:** Lines 1259-1350 (approx)

**Components to Extract:**
- **VideoBackground** - Background video player
- **LanguageSelector** - Dropdown for 12 languages
- **TopStrip** - Top navigation bar with login/signup/balance
- **Header** - Main header with title and subtitle

**State Dependencies:**
- `lang` - Current language
- `currentUser` - Auth state (global)
- `userBalance` - Credit balance (global)

**Props Needed:**
- `onLanguageChange: (lang: string) => void`
- `currentUser: User | null`
- `balance: Balance | null`
- `onLogin: () => void`
- `onSignup: () => void`
- `onLogout: () => void`

---

### 2. Search Section

**Components to Extract:**
- **SearchInput** - Text input with icon
- **SearchCarousel** - Dropdown with search results
- **ModelSelector** - AI model dropdown (GPT-4, Gemini, Grok, Claude)
- **AnalyzeButton** - Main CTA button

**State Dependencies:**
- `q` - Search query
- `searchOptions` - Search results
- `showDropdown` - Dropdown visibility
- `isSearching` - Loading state
- `isLoading` - Analysis loading
- `lang` - Current language

**Props Needed:**
```typescript
// SearchInput
{
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  placeholder: string
  isSearching: boolean
}

// SearchCarousel
{
  options: SpotifyTrack[]
  onSelect: (track: SpotifyTrack) => void
  visible: boolean
  isLoading: boolean
}

// ModelSelector
{
  models: Model[]
  selected: string
  onChange: (model: string) => void
}

// AnalyzeButton
{
  onClick: () => void
  isLoading: boolean
  text: string
}
```

---

### 3. Results Section

**Components to Extract:**
- **ResultsContainer** - Main results wrapper
- **PhilosophicalScores** - Scorecard display
- **ScoreCard** - Individual dimension score (Ethics, Metaphysics, etc.)
- **Classification** - Philosophical classification badge
- **IntegratedAnalysis** - Full text analysis
- **HistoricalContext** - Historical context section
- **CreativeProcess** - Creative process section
- **TechnicalSpecs** - Song metadata (year, genre, country)
- **AmbivalenceIndicator** - Ambivalence warning (if applicable)
- **SpotifyPlayer** - Embedded Spotify player

**State Dependencies:**
- `result` - Analysis result object
- `lang` - Current language

**Result Object Structure:**
```typescript
interface AnalysisResult {
  song: string
  artist: string
  author: string
  release_year: number
  country: string
  genre: string
  spotify_id: string
  lyrics_snippet: string
  scorecard: {
    ethics: Score
    metaphysics: Score
    epistemology: Score
    politics: Score
    aesthetics: Score
    final_score: number
  }
  philosophical_note: number  // 1-7 scale
  classification: string
  philosophical_analysis: string
  historical_context: string
  creative_process: string
  has_ambivalence: boolean
  model_used: string
  analyzed_at: string
}

interface Score {
  score: number  // -10 to +10
  justification: string
  weight: number  // 0.0 to 1.0
}
```

**Props Needed:**
```typescript
// ResultsContainer
{
  result: AnalysisResult | null
  language: string
  translations: TranslationKeys
}
```

---

### 4. Authentication Modals

**Global Functions:** Lines 1700-1900 (approx)

**Components to Extract:**
- **LoginModal** - Email/password login
- **SignupModal** - Email/password signup
- **PasswordReset** - Password reset flow
- **UserProfile** - User account dropdown menu

**Global State Used:**
- `currentUser` - Supabase auth user
- `userBalance` - Credit balance
- `supabase` - Supabase client instance

**Functions Used:**
- `openLogin()` - Show login modal
- `openSignup()` - Show signup modal
- `closeAuthModals()` - Close all modals
- `handleLogin(email, password)` - Login handler
- `handleSignup(email, password)` - Signup handler
- `handleLogout()` - Logout handler
- `resetPassword(email)` - Password reset

**Props Needed:**
```typescript
// LoginModal
{
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<void>
  onSwitchToSignup: () => void
  onPasswordReset: () => void
}

// SignupModal
{
  isOpen: boolean
  onClose: () => void
  onSignup: (email: string, password: string) => Promise<void>
  onSwitchToLogin: () => void
}

// UserProfile
{
  user: User
  balance: Balance
  onLogout: () => void
}
```

---

### 5. Payment Modal

**Components to Extract:**
- **CreditBalance** - Balance display in header
- **PaymentModal** - Credit purchase modal
- **PackageSelector** - Credit tier buttons (10, 20, 50)

**Functions Used:**
- `buyCredits(amount)` - Initiate Stripe checkout

**Props Needed:**
```typescript
// PaymentModal
{
  isOpen: boolean
  onClose: () => void
  onPurchase: (tier: string) => Promise<void>
  packages: {
    tier: string
    credits: number
    price: string
  }[]
}

// CreditBalance
{
  credits: number
  freeCredits: number
  total: number
  onClick: () => void  // Open payment modal
}
```

---

### 6. Legal Modals

**Components to Extract:**
- **TermsModal** - Terms of service
- **PrivacyModal** - Privacy policy

**Props Needed:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  content: string | React.ReactNode
}
```

---

### 7. Common UI Components

**To Be Created:**
- **Modal** - Base modal component
- **Button** - Reusable button
- **Input** - Form input
- **Dropdown** - Select dropdown
- **Toast** - Toast notification
- **Spinner** - Loading spinner
- **Badge** - Status badge (for classification)
- **Card** - Content card

---

## Global State (Not in React)

These are global variables managed outside React that need to be migrated to Context API:

| Variable | Type | Purpose | Location |
|----------|------|---------|----------|
| `API_URL` | string | Backend API base URL | Line 1521 |
| `supabase` | SupabaseClient | Supabase client instance | Line 1548 |
| `currentUser` | User\|null | Currently logged-in user | Set by auth |
| `userBalance` | Balance\|null | User's credit balance | Updated after API call |
| `SUPABASE_URL` | string | Supabase project URL | Fetched from backend |
| `SUPABASE_ANON_KEY` | string | Supabase anon key | Fetched from backend |
| `UI` | object | Translation object (12 languages) | Line 4298 |

---

## i18n Translation Structure

**Current Implementation:** Inline object with 12 languages

**Languages Supported:**
1. English (`en`)
2. Portuguese (`pt`)
3. Spanish (`es`)
4. German (`de`)
5. French (`fr`)
6. Italian (`it`)
7. Hungarian (`hu`)
8. Russian (`ru`)
9. Japanese (`ja`)
10. Chinese (`zh`)
11. Korean (`ko`)
12. Hebrew (`he`)

**Translation Keys (Sample):**
```javascript
{
  analyze: "Analyze",
  analyzing: "Analyzing...",
  placeholder: "Enter song name...",
  listenOn: "Listen on Spotify",
  scorecard: "Weighted Philosophical Scorecard",
  // ... ~30 more keys
}
```

**Migration Plan:**
- Extract to JSON files: `i18n/translations/{lang}.json`
- Use `react-i18next` for translation management
- Create `useLanguage` hook for language switching

---

## CSS Structure

**Current Implementation:** Embedded `<style>` tags (lines 1-1,258)

**Sections:**
1. **Reset & Base** - CSS reset, body styles
2. **Header** - Header, video background, navigation
3. **Search Section** - Search input, dropdown, buttons
4. **Results Section** - Scorecard, analysis cards
5. **Modals** - Auth modals, payment modal, legal modals
6. **Responsive** - Media queries for mobile/tablet
7. **Animations** - Fade-in, slide-in, loading spinners
8. **Utilities** - Helper classes

**Migration Plan:**
- Extract to CSS Modules: `src/styles/components/{component}.module.css`
- Create global styles: `src/styles/global.css`
- Create CSS variables: `src/styles/variables.css`

---

## Component Dependency Graph

```
App (Root)
├── Header
│   ├── VideoBackground
│   ├── TopStrip
│   │   ├── LanguageSelector
│   │   ├── CreditBalance
│   │   └── UserProfile
│   └── HeaderTitle
│
├── SearchSection
│   ├── SearchInput
│   ├── SearchCarousel
│   ├── ModelSelector
│   └── AnalyzeButton
│
├── ResultsSection (conditional on result)
│   ├── TechnicalSpecs
│   ├── SpotifyPlayer
│   ├── PhilosophicalScores
│   │   ├── ScoreCard (x5: Ethics, Metaphysics, etc.)
│   │   └── Classification
│   ├── AmbivalenceIndicator (conditional)
│   ├── IntegratedAnalysis
│   ├── HistoricalContext
│   └── CreativeProcess
│
├── Modals (conditional)
│   ├── LoginModal
│   ├── SignupModal
│   ├── PaymentModal
│   ├── TermsModal
│   └── PrivacyModal
│
└── Footer
    ├── FooterLinks
    └── Copyright
```

---

## Proposed React Component Structure

```
src/
├── components/
│   ├── header/
│   │   ├── Header.jsx
│   │   ├── VideoBackground.jsx
│   │   ├── TopStrip.jsx
│   │   ├── LanguageSelector.jsx
│   │   └── index.js
│   │
│   ├── search/
│   │   ├── SearchInput.jsx
│   │   ├── SearchCarousel.jsx
│   │   ├── ModelSelector.jsx
│   │   ├── AnalyzeButton.jsx
│   │   └── index.js
│   │
│   ├── results/
│   │   ├── ResultsContainer.jsx
│   │   ├── PhilosophicalScores.jsx
│   │   ├── ScoreCard.jsx
│   │   ├── Classification.jsx
│   │   ├── IntegratedAnalysis.jsx
│   │   ├── HistoricalContext.jsx
│   │   ├── CreativeProcess.jsx
│   │   ├── TechnicalSpecs.jsx
│   │   ├── AmbivalenceIndicator.jsx
│   │   ├── SpotifyPlayer.jsx
│   │   └── index.js
│   │
│   ├── auth/
│   │   ├── LoginModal.jsx
│   │   ├── SignupModal.jsx
│   │   ├── PasswordReset.jsx
│   │   ├── UserProfile.jsx
│   │   └── index.js
│   │
│   ├── payment/
│   │   ├── PaymentModal.jsx
│   │   ├── PackageSelector.jsx
│   │   ├── CreditBalance.jsx
│   │   └── index.js
│   │
│   ├── legal/
│   │   ├── TermsModal.jsx
│   │   ├── PrivacyModal.jsx
│   │   └── index.js
│   │
│   └── common/
│       ├── Modal.jsx
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Dropdown.jsx
│       ├── Toast.jsx
│       ├── Spinner.jsx
│       ├── Badge.jsx
│       ├── Card.jsx
│       └── index.js
```

---

## State Management Migration

### Context Providers Needed

1. **AuthContext**
   - `currentUser`
   - `isAuthenticated`
   - `login()`
   - `signup()`
   - `logout()`
   - `resetPassword()`

2. **LanguageContext**
   - `currentLanguage`
   - `changeLanguage()`
   - `t()` (translation function)

3. **CreditsContext** (or part of AuthContext)
   - `balance`
   - `fetchBalance()`
   - `purchaseCredits()`

---

## Custom Hooks Needed

1. **useAuth** - Wraps AuthContext
2. **useLanguage** - Wraps LanguageContext
3. **useCredits** - Credit management
4. **useAnalysis** - Analysis logic
5. **useSpotifySearch** - Search functionality
6. **useModal** - Modal state management

---

## Migration Priority

### Phase 1: Foundation (Week 1)
- [ ] Common components (Modal, Button, Input, Spinner)
- [ ] Contexts (Auth, Language)
- [ ] Hooks (useAuth, useLanguage)

### Phase 2: Core Features (Week 2-3)
- [ ] Header components
- [ ] Search components
- [ ] Auth modals

### Phase 3: Results & Payment (Week 3-4)
- [ ] Results components
- [ ] Payment components
- [ ] Legal modals

### Phase 4: Integration (Week 4-5)
- [ ] Wire all components in App.jsx
- [ ] Test end-to-end flows

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Total Components Identified:** 35+
**Status:** Complete - Ready for implementation
