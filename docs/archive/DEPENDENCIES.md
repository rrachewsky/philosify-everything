# Dependencies & Environment Variables

**Document Purpose:** Complete list of all external dependencies, libraries, and environment variables needed for the frontend

---

## Current Dependencies (CDN)

**Problem:** All dependencies loaded via CDN scripts (no package.json, no npm)

### 1. React 18

**Current:**
```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
```

**Migration:**
```bash
npm install react@^18.2.0 react-dom@^18.2.0
```

**Usage:** Core UI framework

---

### 2. Babel Standalone

**Current:**
```html
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
```

**Purpose:** Transforms JSX in browser (development only)

**Migration:** ❌ **Remove** - Vite handles JSX transformation at build time

---

### 3. Supabase JS Client

**Current:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

**Migration:**
```bash
npm install @supabase/supabase-js@^2.38.0
```

**Usage:** Authentication and session management

**Configuration Required:**
- Supabase URL (fetched from backend `/api/config`)
- Supabase Anon Key (fetched from backend `/api/config`)

---

### 4. Stripe.js

**Current:**
```html
<script src="https://js.stripe.com/v3/"></script>
```

**Migration:**
```bash
npm install @stripe/stripe-js@^2.2.0
```

**Usage:** Credit card payment processing

**Note:** Stripe recommends loading from their CDN for PCI compliance, but npm package is acceptable

---

### 5. Google Fonts

**Current:**
```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet"/>
```

**Migration:** Keep as CDN link (recommended for fonts) or use `@fontsource/eb-garamond`

**Options:**
```bash
# Option 1: Keep CDN (recommended)
# No change needed

# Option 2: Self-host via npm
npm install @fontsource/eb-garamond
```

---

## Additional Dependencies Needed (Not Currently Used)

### 1. React Router (Future)

**Purpose:** Client-side routing for multi-page app

```bash
npm install react-router-dom@^6.20.0
```

**When:** Phase 2+ (not MVP)

---

### 2. react-i18next

**Purpose:** Internationalization library (replaces inline UI object)

```bash
npm install react-i18next@^13.5.0 i18next@^23.7.0
```

**When:** Phase 3 (i18n extraction)

---

### 3. Vite & Vitest

**Purpose:** Build tool and testing framework

```bash
npm install --save-dev vite@^5.0.0
npm install --save-dev vitest@^1.0.0
npm install --save-dev @vitejs/plugin-react@^4.2.0
```

**When:** Phase 1 (setup)

---

### 4. Testing Libraries

**Purpose:** Component testing

```bash
npm install --save-dev @testing-library/react@^14.0.0
npm install --save-dev @testing-library/jest-dom@^6.1.0
npm install --save-dev @testing-library/user-event@^14.5.0
npm install --save-dev jsdom@^23.0.0
```

**When:** Phase 1 (setup)

---

### 5. ESLint & Prettier (Optional but Recommended)

**Purpose:** Code quality and formatting

```bash
npm install --save-dev eslint@^8.55.0
npm install --save-dev prettier@^3.1.0
npm install --save-dev eslint-config-prettier@^9.1.0
npm install --save-dev eslint-plugin-react@^7.33.0
npm install --save-dev eslint-plugin-react-hooks@^4.6.0
```

**When:** Phase 1 (setup)

---

## Complete package.json (Proposed)

```json
{
  "name": "philosify-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext js,jsx",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css}\""
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@stripe/stripe-js": "^2.2.0",
    "react-i18next": "^13.5.0",
    "i18next": "^23.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^23.0.0",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.0"
  }
}
```

**Total Dependencies:** 18
- **Production:** 6
- **Development:** 12

---

## Environment Variables

### Current Setup

**Problem:** No environment variables - everything hardcoded or fetched from backend

**Hardcoded Values:**
```javascript
const API_URL = 'https://api.philosify.org';  // Line 1521
```

### Proposed Setup

**`.env.example` (template):**
```env
# Backend API
VITE_API_URL=https://api.philosify.org

# Feature Flags
VITE_ENABLE_GROK_MODEL=true
VITE_ENABLE_CLAUDE_MODEL=true

# Analytics (future)
VITE_GA_TRACKING_ID=

# Environment
VITE_ENV=production
```

**`.env.local` (development):**
```env
VITE_API_URL=http://localhost:8787
VITE_ENV=development
```

**`.env.production` (production):**
```env
VITE_API_URL=https://api.philosify.org
VITE_ENV=production
```

**Usage in Code:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.philosify.org';
const isDevelopment = import.meta.env.VITE_ENV === 'development';
```

**Note:** Vite requires `VITE_` prefix for environment variables to be exposed to client-side code

---

## Configuration Files Needed

### 1. vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils'
    }
  }
})
```

---

### 2. vitest.config.js

```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

---

### 3. .eslintrc.json

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["react"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

---

### 4. .prettierrc.json

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

### 5. .gitignore

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Logs
*.log
npm-debug.log*
```

---

## Assets & Static Files

### Current Assets

1. **favicon.ico** - Site icon (32KB)
2. **philosify.css** - Additional styles (7.4KB)
3. **Videos** (referenced but not present in repo)
   - Background video for header

### Migration Plan

```
site/
├── public/                    # Static assets (served as-is)
│   ├── index.html            # Minimal HTML shell
│   ├── favicon.ico           # Copy from current
│   └── videos/               # Background videos
│       └── header-bg.mp4
│
└── src/
    ├── assets/               # Imported assets (bundled by Vite)
    │   └── images/
    │       └── logo.png
    │
    └── styles/               # CSS files
        ├── global.css        # Extract from index.html
        └── variables.css     # CSS custom properties
```

---

## External Services & APIs

### 1. Backend API

**URL:** `https://api.philosify.org`

**Endpoints Used:** (see API_CONTRACTS.md)
- GET `/api/config`
- GET `/api/balance`
- POST `/api/search`
- POST `/api/analyze`
- POST `/api/create-checkout`

**Authentication:** JWT token from Supabase

---

### 2. Supabase

**Service:** Authentication & user management

**SDK:** `@supabase/supabase-js`

**Configuration:**
- URL: Fetched from backend
- Anon Key: Fetched from backend

**Features Used:**
- `supabase.auth.signUp()`
- `supabase.auth.signInWithPassword()`
- `supabase.auth.signOut()`
- `supabase.auth.getSession()`
- `supabase.auth.resetPasswordForEmail()`

---

### 3. Stripe

**Service:** Payment processing

**SDK:** `@stripe/stripe-js`

**Configuration:**
- Checkout flow via backend `/api/create-checkout`
- Redirects to Stripe Checkout page
- Returns via success/cancel URLs

**Features Used:**
- Redirect to Checkout (not embedded)

---

### 4. Spotify API (Indirect)

**Service:** Song search

**Access:** Via backend proxy (`/api/search`)

**No direct frontend integration** (backend handles Spotify API)

---

### 5. Google Fonts

**Service:** Web fonts

**Font Family:** EB Garamond (400, 500, 600, 700 weights)

**Load Method:** CDN link (recommended)

---

## Browser Compatibility

**Target Browsers:**
- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile Safari (iOS): Last 2 versions
- Chrome Android: Last 2 versions

**Minimum Requirements:**
- ES2020 support
- Modern CSS (Grid, Flexbox, CSS Variables)
- Fetch API
- ES Modules

**No Support For:**
- IE11 (officially unsupported by React 18)

---

## Performance Budget

**Target Metrics:**
- **Initial Bundle:** < 250KB gzipped
- **Total Page Size:** < 500KB
- **FCP (First Contentful Paint):** < 1.5s
- **LCP (Largest Contentful Paint):** < 2.5s
- **TTI (Time to Interactive):** < 3.5s

**Optimization Strategies:**
- Code splitting (lazy load modals)
- Tree shaking (Vite automatic)
- CSS optimization (CSS modules)
- Image optimization (WebP, lazy loading)
- Font optimization (font-display: swap)

---

## Migration Checklist

### Phase 1: Initial Setup
- [ ] Create `package.json` with all dependencies
- [ ] Install dependencies: `npm install`
- [ ] Create `vite.config.js`
- [ ] Create `vitest.config.js`
- [ ] Create `.env.example`
- [ ] Create `.eslintrc.json`
- [ ] Create `.prettierrc.json`
- [ ] Update `.gitignore`
- [ ] Test dev server: `npm run dev`

### Phase 2: Replace CDN Scripts
- [ ] Remove React CDN → Import from npm
- [ ] Remove Babel Standalone → Rely on Vite
- [ ] Remove Supabase CDN → Import from npm
- [ ] Remove Stripe CDN → Import from npm
- [ ] Keep Google Fonts CDN (recommended)

### Phase 3: Environment Variables
- [ ] Replace hardcoded API_URL with `import.meta.env.VITE_API_URL`
- [ ] Add environment-specific configs
- [ ] Test in development and production

### Phase 4: Verification
- [ ] Dev build works: `npm run dev`
- [ ] Production build works: `npm run build`
- [ ] Tests run: `npm test`
- [ ] Linting works: `npm run lint`
- [ ] All features functional

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Total Dependencies:** 18 (6 prod + 12 dev)
**Status:** Complete - Ready for Phase 1
