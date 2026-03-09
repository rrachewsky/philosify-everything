# State Management & Data Flow Documentation

**Document Purpose:** Document all state management patterns and data flows in the current monolithic frontend

---

## Current State Management Approach

**Pattern:** Mixed approach
- **React State** - Component-level state using `useState`
- **Global Variables** - Window-scoped variables for auth and config
- **Event System** - Custom events for cross-component communication

**Issues:**
- ❌ State scattered across global variables and React state
- ❌ No centralized state management
- ❌ Hard to track data flow
- ❌ Difficult to test

---

## Global State Variables

### 1. Authentication State

```javascript
// Global variables (outside React)
let supabase = null;           // Supabase client instance
let currentUser = null;        // Currently logged-in user
let SUPABASE_URL = '';         // Supabase project URL
let SUPABASE_ANON_KEY = '';    // Supabase anon key
```

**Initialization Flow:**
1. App starts
2. Calls `initializeSupabase()` → Fetches config from `/api/config`
3. Creates Supabase client → `supabase = createClient(url, key)`
4. Calls `checkAuthAndRedirect()` → Checks if user is logged in
5. If logged in: Sets `currentUser`, calls `updateUserUI()`

**Update Triggers:**
- User logs in → `handleLogin()` → Sets `currentUser`
- User signs up → `handleSignup()` → Sets `currentUser`
- User logs out → `handleLogout()` → Clears `currentUser`
- Page load → `checkAuthAndRedirect()` → Restores session

---

### 2. Credit Balance State

```javascript
// Global variable
let userBalance = null;  // { userId, credits, freeRemaining, total }
```

**Update Flow:**
1. User logs in → `updateUserUI()` is called
2. Fetches balance → `GET /api/balance` with JWT token
3. Updates `userBalance` global variable
4. Updates DOM directly → `document.getElementById('creditsDisplay').textContent = ...`

**Update Triggers:**
- User logs in
- User completes credit purchase (returns from Stripe)
- User analyzes a song (balance decrements)
- Manual refresh via `updateUserUI()`

**Data Structure:**
```typescript
interface Balance {
  userId: string       // UUID from Supabase
  credits: number      // Purchased credits
  freeRemaining: number // Free analyses remaining
  total: number        // credits + freeRemaining
}
```

---

### 3. Language State

```javascript
// Global variable
window.PREFERRED_LANG = 'en';  // Set in header

// React state (in App component)
const [lang, setLang] = useState(window.PREFERRED_LANG || "en");
```

**Update Flow:**
1. User clicks language in header
2. Header sets `window.PREFERRED_LANG = newLang`
3. Dispatches custom event: `window.dispatchEvent(new CustomEvent("ph-set-lang", { detail: newLang }))`
4. App component listens → Updates `lang` state
5. Re-renders UI with new translations

**Persistence:** None (resets on page reload)

---

## React Component State

### App Component State

**Location:** `site/index.html:4460-4470`

```javascript
const [lang, setLang] = useState(window.PREFERRED_LANG || "en");
const [q, setQ] = useState("");  // Search query
const [isLoading, setLoading] = useState(false);  // Analysis loading
const [result, setResult] = useState(null);  // Analysis result
const [searchOptions, setSearchOptions] = useState([]);  // Spotify results
const [selectedTrack, setSelectedTrack] = useState(null);  // Selected song
const [showDropdown, setShowDropdown] = useState(false);  // Dropdown visibility
const [isSearching, setIsSearching] = useState(false);  // Search loading
```

**State Flow:**
- **Search Flow:** `q` → `handleInputChange()` → debounce → `searchSongs()` → updates `searchOptions` → shows `showDropdown`
- **Analysis Flow:** Click "Analyze" → `analyze()` → sets `isLoading` → API call → sets `result` → clears `isLoading`
- **Language Flow:** Header event → `setLang()` → UI re-renders with new translations

---

## Data Flow Diagrams

### 1. Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                     App Start                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │ initializeSupabase()│
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ GET /api/config     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Create Supabase     │
         │ Client              │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ checkAuthAndRedirect│
         └──────────┬──────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ User Logged   │       │ User Not      │
│ In            │       │ Logged In     │
└───────┬───────┘       └───────────────┘
        │
        ▼
┌───────────────┐
│ updateUserUI()│
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ GET /api/     │
│ balance       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Update DOM    │
│ (credits,     │
│ profile)      │
└───────────────┘
```

---

### 2. Song Analysis Flow

```
User clicks "Analyze"
         │
         ▼
┌─────────────────────┐
│ analyze() called    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐       NO
│ Check currentUser?  ├──────────► Show login modal
└──────────┬──────────┘
           │ YES
           ▼
┌─────────────────────┐
│ updateUserUI()      │
│ (fetch balance)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐       NO
│ balance.total > 0?  ├──────────► Show payment modal
└──────────┬──────────┘
           │ YES
           ▼
┌─────────────────────┐
│ setLoading(true)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ POST /api/analyze   │
│ with JWT token      │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌───────┐    ┌───────┐
│ 200   │    │ Error │
└───┬───┘    └───┬───┘
    │            │
    │            ▼
    │    ┌──────────────┐
    │    │ 401: Show    │
    │    │ login modal  │
    │    ├──────────────┤
    │    │ 402: Show    │
    │    │ payment modal│
    │    ├──────────────┤
    │    │ Other: Alert │
    │    └──────────────┘
    │
    ▼
┌───────────────┐
│ setResult()   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ setLoading    │
│ (false)       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ updateUserUI()│
│ (refresh      │
│ balance)      │
└───────────────┘
```

---

### 3. Credit Purchase Flow

```
User clicks "Buy Credits"
         │
         ▼
┌─────────────────────┐
│ buyCredits(amount)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ POST /api/create-   │
│ checkout            │
│ (tier: "10"/"20"/   │
│ "50")               │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Response:           │
│ { checkout_url }    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Redirect to Stripe  │
│ Checkout page       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ User completes      │
│ payment on Stripe   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stripe sends        │
│ webhook to backend  │
│ /api/stripe-webhook │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Backend updates     │
│ USER_LEDGER in KV   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stripe redirects    │
│ user back to app    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Frontend detects    │
│ return (URL param)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ updateUserUI()      │
│ (fetch new balance) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Show success        │
│ message             │
└─────────────────────┘
```

---

### 4. Search Flow (Debounced)

```
User types in search box
         │
         ▼
┌─────────────────────┐
│ handleInputChange() │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ setQ(value)         │
│ Clear selection     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Clear previous      │
│ timeout             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ setTimeout(500ms)   │
└──────────┬──────────┘
           │
           ▼ (after 500ms)
┌─────────────────────┐
│ searchSongs(query)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ setIsSearching(true)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ POST /api/search    │
│ { query }           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Response:           │
│ { options: [...] }  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ setSearchOptions()  │
│ setShowDropdown     │
│ (true)              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ setIsSearching      │
│ (false)             │
└─────────────────────┘
```

---

## Event System (Cross-Component Communication)

**Current Implementation:** Custom window events

### Events Used

| Event Name | Dispatched By | Listened By | Payload | Purpose |
|------------|---------------|-------------|---------|---------|
| `ph-set-lang` | Header | App | `{ detail: lang }` | Change language |
| `ph-analyze` | Header | App | `{ detail: query }` | Trigger analysis |

**Example:**
```javascript
// Dispatch (in header):
window.dispatchEvent(new CustomEvent("ph-set-lang", { detail: "pt" }));

// Listen (in App):
useEffect(() => {
  const onSetLang = (ev) => setLang(ev.detail || "en");
  window.addEventListener("ph-set-lang", onSetLang);
  return () => window.removeEventListener("ph-set-lang", onSetLang);
}, []);
```

---

## DOM Manipulation (Outside React)

**Problem:** Some UI updates bypass React and modify DOM directly

**Examples:**

1. **Balance Display:**
```javascript
// Direct DOM manipulation (line ~1625)
document.getElementById('creditsDisplay').textContent =
  `${paidCredits} + ${freeCredits} free`;
```

2. **Button Text:**
```javascript
// Direct DOM manipulation (line ~4495)
const analyzeText = document.getElementById("analyzeText");
analyzeText.textContent = isLoading ? t.analyzing : t.analyze;
```

**Migration Plan:** Move these to React state in respective components

---

## Proposed State Management Architecture

### Context API Structure

```
App
├── ConfigProvider (Supabase config, API URL)
│   └── AuthProvider (user, login, logout, signup)
│       └── LanguageProvider (lang, changeLanguage, t)
│           └── CreditsProvider (balance, fetchBalance, purchase)
│               └── (Rest of app)
```

### Context Providers

#### 1. ConfigContext
```typescript
interface ConfigContext {
  apiUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
  isInitialized: boolean
  error: Error | null
}
```

#### 2. AuthContext
```typescript
interface AuthContext {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}
```

#### 3. LanguageContext
```typescript
interface LanguageContext {
  currentLanguage: string
  changeLanguage: (lang: string) => void
  t: (key: string) => string  // Translation function
  availableLanguages: Language[]
}
```

#### 4. CreditsContext
```typescript
interface CreditsContext {
  balance: Balance | null
  isLoading: boolean
  fetchBalance: () => Promise<void>
  purchaseCredits: (tier: string) => Promise<void>
  hasCredits: boolean
}
```

---

## Custom Hooks

### 1. useAuth
```typescript
function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### 2. useLanguage
```typescript
function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
```

### 3. useCredits
```typescript
function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) throw new Error('useCredits must be used within CreditsProvider');
  return context;
}
```

### 4. useAnalysis (Business Logic)
```typescript
function useAnalysis() {
  const { user } = useAuth();
  const { balance, fetchBalance } = useCredits();
  const { currentLanguage } = useLanguage();

  const analyze = async (song: string, artist: string, model: string) => {
    // Check auth
    if (!user) throw new Error('Not authenticated');

    // Check balance
    if (!balance || balance.total <= 0) throw new Error('Insufficient credits');

    // Call API
    const result = await analyzeAPI(song, artist, model, currentLanguage);

    // Refresh balance
    await fetchBalance();

    return result;
  };

  return { analyze };
}
```

### 5. useSpotifySearch
```typescript
function useSpotifySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useDebouncedCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchAPI(q);
      setResults(data.options);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    search(query);
  }, [query]);

  return { query, setQuery, results, isLoading };
}
```

---

## Migration Checklist

### Phase 1: Create Contexts
- [ ] Create ConfigContext + Provider
- [ ] Create AuthContext + Provider
- [ ] Create LanguageContext + Provider
- [ ] Create CreditsContext + Provider

### Phase 2: Create Hooks
- [ ] Create useAuth hook
- [ ] Create useLanguage hook
- [ ] Create useCredits hook
- [ ] Create useAnalysis hook
- [ ] Create useSpotifySearch hook

### Phase 3: Migrate State
- [ ] Move Supabase config to ConfigContext
- [ ] Move auth state to AuthContext
- [ ] Move language state to LanguageContext
- [ ] Move balance state to CreditsContext
- [ ] Remove global variables
- [ ] Remove custom events (replace with Context)
- [ ] Remove direct DOM manipulation

### Phase 4: Update Components
- [ ] Update all components to use hooks
- [ ] Remove prop drilling (use Context instead)
- [ ] Test all flows

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Status:** Complete - Ready for implementation
