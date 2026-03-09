# PHILOSIFY.ORG - COMPREHENSIVE TECHNICAL AUDIT
## Date: December 26, 2025 (Updated)

---

# 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Architecture Analysis](#architecture-analysis)
3. [File Structure](#file-structure)
4. [API Connections & External Services](#api-connections--external-services)
5. [Cloudflare Infrastructure](#cloudflare-infrastructure)
6. [Database Design (Supabase)](#database-design-supabase)
7. [Guide v2.7 LITE - Philosophical Analysis System](#guide-v27-lite---philosophical-analysis-system)
8. [BetaGate Access System](#betagate-access-system)
9. [Email System](#email-system)
10. [Security Analysis](#security-analysis)
11. [PROS - Strengths](#pros---strengths)
12. [CONS - Issues & Risks](#cons---issues--risks)
13. [TO-DO CHECKLIST](#to-do-checklist)

---

# 🎯 PROJECT OVERVIEW

**Philosify** is a sophisticated web application for philosophical analysis of music based on Objectivist principles. It analyzes songs across five weighted philosophical dimensions and produces a classification score.

## Core Functionality
- **Multilingual interface**: 15 languages supported
  - English, Portuguese, Spanish, French, German, Italian
  - Japanese, Korean, Chinese (Mandarin), Russian
  - Arabic, Hebrew, Hindi, Persian (Farsi), Hungarian
- Philosophical analysis of song lyrics using multiple LLMs
- Integration with Spotify for metadata and embedded players
- Integration with Genius for lyrics
- Credit-based monetization model with Stripe integration
- User authentication via Supabase
- BetaGate access control system
- Email-based beta code distribution via Resend
- Analysis sharing via direct links

## Business Model
| Package | Price | Credits | Per Analysis |
|---------|-------|---------|--------------|
| Free    | $0.00 | 2       | $0.00        |
| Basic   | $6.00 | 10      | $0.60        |
| Plus    | $12.00| 20      | $0.60        |
| Pro     | $30.00| 50      | $0.60        |

**Cost per analysis:** ~$0.15-0.25 (LLM API costs vary by model)
**Margin:** ~60-75%

## Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite | React 19.2, Vite 7.2 |
| Backend | Cloudflare Workers | ES Modules |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | JWT-based |
| Payments | Stripe | Checkout Sessions |
| Email | Resend | API-based |
| CDN/Hosting | Cloudflare Pages + Workers | Edge |
| AI Models | Claude, GPT, Gemini, Grok, DeepSeek | Multiple |

---

# 🏗️ ARCHITECTURE ANALYSIS

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                    (philosify.org - React SPA)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                             │
│                    (Frontend - Vite Build)                      │
│         React 19 + React Router + i18next + Stripe.js           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls (HTTPS)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE WORKERS                            │
│                (api.philosify.org - Backend)                    │
│                  Modular ES Modules Architecture                │
│                                                                 │
│  Endpoints:                                                     │
│  ├── POST /api/analyze         (philosophical analysis)        │
│  ├── POST /api/search          (song search via Spotify)       │
│  ├── GET  /api/balance         (user credit balance)           │
│  ├── GET  /api/config          (public Supabase config)        │
│  ├── GET  /health              (health check)                  │
│  ├── POST /api/create-checkout (Stripe checkout)               │
│  ├── POST /api/verify-payment  (manual payment verification)   │
│  ├── POST /api/stripe-webhook  (Stripe webhooks)               │
│  ├── POST /api/share           (create share link)             │
│  ├── GET  /shared/:id          (get shared analysis)           │
│  ├── POST /api/request-beta-access (BetaGate form)             │
│  ├── POST /api/validate-beta-code  (validate access code)      │
│  ├── POST /api/grant-beta-credits  (legacy endpoint)           │
│  ├── POST /api/cleanup-timeout (timeout recovery)              │
│  └── EMAIL handler             (bob@philosify.org)             │
└─────────────────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   SUPABASE   │ │   SPOTIFY    │ │    GENIUS    │ │  LLM APIs    │
│   (Auth +    │ │    API       │ │     API      │ │ Claude/GPT/  │
│   Database)  │ │  (metadata)  │ │   (lyrics)   │ │ Gemini/Grok/ │
│              │ │              │ │              │ │ DeepSeek     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
          │
          ▼
┌──────────────┐
│   RESEND     │
│   (Email)    │
│ bob@philo.. │
└──────────────┘
```

## Data Flow - Analysis Request

```
1. USER → Frontend: Click "Analyze"
2. Frontend: Check beta access (localStorage)
   └─ If no access → Redirect to /beta
3. Frontend: Verify auth (Supabase JWT)
   └─ If not logged in → Show auth modal
4. Frontend → Backend: POST /api/analyze
   └─ Headers: Authorization: Bearer <JWT>
   └─ Body: { song, artist, model, lang, spotify_id? }
5. Backend: Validate JWT with Supabase
6. Backend: Rate limit check (100 req/60s)
7. Backend: Cleanup stale reservations (5 min timeout)
8. Backend: Reserve credit (RPC: reserve_credit)
   └─ If insufficient → Return 402
9. Backend → Supabase: Check for cached analysis
   └─ If found → Release reservation (no charge), return cached
10. Backend → Genius: Get lyrics
11. Backend → Spotify: Get metadata (cover, link)
12. Backend → KV: Get Guide (v2.7 LITE) for language
13. Backend → LLM: Send lyrics + Guide for analysis
    └─ Fallback chain: Primary → Secondary → Tertiary model
14. Backend → Supabase: Save to songs + analyses tables
15. Backend: Confirm reservation (RPC: confirm_reservation)
16. Backend → Frontend: Return { analysis, balance }
17. Frontend: Update UI with results + new balance
```

## Data Flow - BetaGate Access

```
1. USER → Frontend: Visit philosify.org
2. Frontend: Check localStorage for beta_access
   └─ If no access → Redirect to /beta
3. USER: Fill out BetaGate form (name, email, song, artist, justification)
4. Frontend → Backend: POST /api/request-beta-access
5. Backend: Validate inputs + verify song exists (Spotify)
6. Backend: Run quick philosophical analysis (Claude)
7. Backend → Supabase: Create beta_request record with unique code
8. Backend → Resend: Send email with magic link + analysis preview
   └─ BCC to bob@philosify.org (shadow copy)
9. USER: Click magic link in email
10. Frontend: Validate code (POST /api/validate-beta-code)
11. Backend: Mark code as used (one-time use)
12. Frontend: Store access in localStorage, redirect to app
```

---

# 📁 FILE STRUCTURE

```
C:\Users\r_rac\OneDrive\Documents\GitHub\philosify-web\
├── _ARCHIVE/                     # Archived documentation
│   └── docs/                     # Old audit reports, migration plans
├── admin/                        # Admin scripts and SQL
│   ├── *.sql                     # Database admin queries
│   └── *.js                      # Node.js admin scripts
├── api/                          # BACKEND (Cloudflare Worker)
│   ├── docs/                     # Backend documentation
│   │   ├── legal/                # Privacy policy, Terms PDFs
│   │   └── *.md                  # Guide documentation
│   ├── examples/                 # Example analyses
│   ├── guides/                   # Philosophical guide files
│   │   ├── Philosify_Guide v2.7 LITE with Contract.txt
│   │   └── Philosify_Guide v2.7 with Contract.txt
│   ├── scripts/                  # Batch processing scripts
│   │   ├── batch-analyze.js      # Bulk song analysis
│   │   ├── enrich-spotify-ids.js # Add Spotify IDs to analyses
│   │   └── *.json                # Progress/report files
│   ├── src/                      # MODULAR SOURCE CODE
│   │   ├── ai/                   # AI/LLM integration
│   │   │   ├── models/           # Model-specific implementations
│   │   │   │   ├── claude.js     # Anthropic Claude
│   │   │   │   ├── openai.js     # OpenAI GPT
│   │   │   │   ├── gemini.js     # Google Gemini
│   │   │   │   ├── grok.js       # xAI Grok
│   │   │   │   └── deepseek.js   # DeepSeek
│   │   │   ├── orchestrator.js   # Model selection & fallback
│   │   │   ├── parser.js         # Response parsing
│   │   │   ├── validator.js      # Response validation
│   │   │   └── storage.js        # Analysis storage
│   │   ├── auth/                 # Authentication
│   │   │   ├── index.js          # Auth exports
│   │   │   └── jwt.js            # JWT validation
│   │   ├── config/               # Configuration
│   │   │   ├── pricing.js        # Model pricing
│   │   │   └── scoring.js        # Scoring configuration
│   │   ├── credits/              # Credit management
│   │   │   ├── reserve.js        # Reserve credits
│   │   │   ├── confirm.js        # Confirm reservation
│   │   │   ├── release.js        # Release reservation
│   │   │   └── index.js          # Credit exports
│   │   ├── db/                   # Database operations
│   │   │   ├── songs.js          # Song CRUD
│   │   │   └── transactions.js   # Transaction logging
│   │   ├── guides/               # Guide management
│   │   │   ├── loader.js         # Load guides from KV
│   │   │   └── cache.js          # Guide caching
│   │   ├── handlers/             # Request handlers
│   │   │   ├── analyze.js        # /api/analyze
│   │   │   ├── search.js         # /api/search
│   │   │   ├── email.js          # Email handler (bob@)
│   │   │   ├── beta-request.js   # BetaGate form handler
│   │   │   └── grant-beta-credits.js # Legacy credits
│   │   ├── lyrics/               # Lyrics fetching
│   │   │   ├── genius.js         # Genius API
│   │   │   ├── letras.js         # Letras.com fallback
│   │   │   ├── parser.js         # Lyrics parsing
│   │   │   └── sanitize.js       # Content sanitization
│   │   ├── payments/             # Stripe integration
│   │   │   ├── stripe.js         # Stripe API calls
│   │   │   ├── webhooks.js       # Webhook handling
│   │   │   └── config.js         # Payment config
│   │   ├── rate-limit/           # Rate limiting
│   │   │   └── check.js          # Rate limit checks
│   │   ├── sharing/              # Analysis sharing
│   │   │   └── index.js          # Share token management
│   │   ├── spotify/              # Spotify integration
│   │   │   ├── search.js         # Song search
│   │   │   ├── metadata.js       # Track metadata
│   │   │   └── token.js          # Token management
│   │   └── utils/                # Utilities
│   │       ├── cors.js           # CORS headers
│   │       ├── secrets.js        # Secret management
│   │       ├── supabase.js       # Supabase client
│   │       ├── timeout.js        # Timeout handling
│   │       └── validation.js     # Input validation
│   ├── index.js                  # Main worker entry (~982 lines)
│   ├── package.json              # Dependencies
│   └── wrangler.toml             # Cloudflare config
├── database/                     # DATABASE SCHEMAS
│   ├── supabase_credits_schema_fixed.sql    # Credits system
│   ├── supabase_songs_analyses_schema.sql   # Songs & analyses
│   ├── CREDIT_RESERVATION_FUNCTIONS.sql     # Reserve/confirm/release
│   ├── beta_requests_table.sql              # BetaGate codes
│   ├── supabase_share_schema.sql            # Sharing system
│   └── RLS_DEPLOY.sql                       # Row Level Security
├── docs/                         # PROJECT DOCUMENTATION
│   ├── PAYMENT_FLOW.md           # Payment system docs
│   ├── SHARING_INTEGRATION.md    # Sharing feature docs
│   └── archive/                  # Old documentation
├── site/                         # FRONTEND (React + Vite)
│   ├── public/                   # Static assets
│   │   ├── pp/                   # Privacy policy pages (15 languages)
│   │   ├── tos/                  # Terms of service pages (15 languages)
│   │   ├── manifest.json         # PWA manifest
│   │   └── sw.js                 # Service worker
│   ├── src/                      # REACT SOURCE CODE
│   │   ├── components/           # UI Components
│   │   │   ├── account/          # Account management
│   │   │   ├── auth/             # Authentication modals
│   │   │   ├── common/           # Shared components (Spinner, etc.)
│   │   │   ├── header/           # Header & navigation
│   │   │   ├── legal/            # Legal page components
│   │   │   ├── payment/          # Payment components
│   │   │   ├── pwa/              # PWA install prompt
│   │   │   ├── results/          # Analysis results display
│   │   │   ├── search/           # Song search
│   │   │   └── sharing/          # Share button & modal
│   │   ├── contexts/             # React Contexts
│   │   │   ├── CreditsContext.jsx    # Credit balance state
│   │   │   └── LanguageContext.jsx   # i18n state
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── i18n/                 # Internationalization
│   │   │   ├── config.js         # i18next setup
│   │   │   └── translations/     # 15 language JSON files
│   │   ├── pages/                # Route pages
│   │   │   ├── BetaGate.jsx      # Beta access gate
│   │   │   ├── PaymentSuccess.jsx
│   │   │   ├── PaymentCancel.jsx
│   │   │   ├── SharedAnalysis.jsx
│   │   │   ├── TermsOfService.jsx
│   │   │   ├── PrivacyPolicy.jsx
│   │   │   └── ResetPasswordPage.jsx
│   │   ├── services/             # API Services
│   │   │   ├── api/              # Backend API calls
│   │   │   ├── stripe/           # Stripe client
│   │   │   └── supabase/         # Supabase client
│   │   ├── styles/               # CSS files
│   │   ├── utils/                # Utility functions
│   │   ├── App.jsx               # Main app component
│   │   ├── Router.jsx            # React Router setup
│   │   └── main.jsx              # Entry point
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite configuration
│   └── wrangler.toml             # Pages deployment config
├── tests/                        # Integration tests
├── deploy-production.ps1         # Production deployment script
├── deploy-production.sh          # Unix deployment script
├── dev.ps1                       # Local dev script
├── CLAUDE.md                     # AI assistant context
└── QUICK_START.md                # Getting started guide
```

---

# 🔌 API CONNECTIONS & EXTERNAL SERVICES

## 1. Supabase (Authentication & Database)
- **Purpose:** User authentication (JWT), user profiles, credits, analysis storage
- **URL:** Stored in `SUPABASE_URL` secret
- **Keys Required:**
  - `SUPABASE_URL` - Project URL
  - `SUPABASE_SERVICE_KEY` - Service role key (backend only)
  - `SUPABASE_ANON_KEY` - Public anon key (frontend)

## 2. Spotify API
- **Purpose:** Song search, metadata, album covers, embedded player data
- **Endpoints Used:**
  - Search: `GET /v1/search`
  - Track: `GET /v1/tracks/{id}`
- **Keys Required:**
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
- **Auth Flow:** Client Credentials (no user auth needed)

## 3. Genius API
- **Purpose:** Song lyrics retrieval
- **Endpoints Used:**
  - Search: `GET /search`
  - Song page scraping for lyrics
- **Keys Required:**
  - `GENIUS_ACCESS_TOKEN`

## 4. LLM APIs (Analysis Engine)

| Provider | Model | Key | Use Case |
|----------|-------|-----|----------|
| Anthropic | Claude Opus 4.5 | `ANTHROPIC_API_KEY` | Primary analysis, email quick analysis |
| OpenAI | GPT-5.1 | `OPENAI_API_KEY` | Fallback analysis |
| Google | Gemini 3 Flash | `GEMINI_API_KEY` | Fallback analysis |
| xAI | Grok 4.1 Fast | `GROK_API_KEY` | Fallback analysis |
| DeepSeek | DeepSeek Reasoner | `DEEPSEEK_API_KEY` | Fallback analysis |

**Model Selection:** User chooses primary model; system falls back through chain on failure.

## 5. Stripe (Payments)
- **Purpose:** Credit purchases
- **Keys Required:**
  - `STRIPE_SECRET_KEY` - API operations
  - `STRIPE_WEBHOOK_SECRET` - Webhook validation
  - `STRIPE_PRICE_ID_10` - 10 credits price ID
  - `STRIPE_PRICE_ID_20` - 20 credits price ID
  - `STRIPE_PRICE_ID_50` - 50 credits price ID
- **Flow:** Checkout Sessions with client-side redirect

## 6. Resend (Email)
- **Purpose:** BetaGate code delivery, transactional emails
- **Keys Required:**
  - `RESEND_API_KEY`
- **From Address:** `bob@philosify.org`
- **Features:**
  - HTML email templates
  - BCC shadow copy to admin
  - Multi-language support

---

# ☁️ CLOUDFLARE INFRASTRUCTURE

## Cloudflare Workers (Backend)
- **Domain:** api.philosify.org
- **Worker Name:** philosify-api-production
- **Runtime:** V8 isolate (Edge)
- **Compatibility Date:** 2025-11-17

### wrangler.toml Configuration (Production)
```toml
name = "philosify-api"
main = "index.js"
compatibility_date = "2025-11-17"

[env.production]

# Custom domain
[[env.production.custom_domains]]
name = "api.philosify.org"
zone_name = "philosify.org"

# Environment variables
[env.production.vars]
CLAUDE_MODEL = "claude-opus-4-5-20251101"
OPENAI_MODEL = "gpt-5.1"
GEMINI_MODEL = "gemini-3-flash-preview"
GROK_MODEL = "grok-4-1-fast-reasoning"
DEEPSEEK_MODEL = "deepseek-reasoner"
ALLOWED_ORIGINS = "https://philosify.org https://www.philosify.org"
CHECKOUT_SUCCESS_URL = "https://philosify.org/payment/success"
CHECKOUT_CANCEL_URL = "https://philosify.org/payment/cancel"

# KV Namespace
[[env.production.kv_namespaces]]
binding = "PHILOSIFY_KV"
id = "6ececc5beba846a9a33d47ada0890fa6"

# Native Rate Limiting
[[env.production.ratelimits]]
name = "RATE_LIMITER"
namespace_id = "1001"
simple = { limit = 100, period = 60 }

# Secrets Store (19 secrets)
# - OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, GROK_API_KEY, DEEPSEEK_API_KEY
# - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_10/20/50
# - SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY
# - SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
# - GENIUS_ACCESS_TOKEN, RESEND_API_KEY, ADMIN_SECRET
```

## KV (Key-Value Storage)
- **Namespace:** PHILOSIFY_KV
- **Purpose:** Store Guide v2.7 LITE files by language
- **Keys Format:**
  - `guide:en` - English guide
  - `guide:pt` - Portuguese guide
  - `guide:es` - Spanish guide
  - etc. (15 languages)
- **Access Pattern:** Read-heavy (guides rarely change)

## Cloudflare Pages (Frontend)
- **Domain:** philosify.org
- **Build Command:** `npm run build`
- **Build Output:** `dist/`
- **Framework:** Vite + React

## Email Routing
- **Address:** bob@philosify.org
- **Handler:** Worker email export
- **Action:** Auto-respond with BetaGate codes

---

# 🗄️ DATABASE DESIGN (SUPABASE)

## Core Tables

### credits
```sql
CREATE TABLE credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  purchased INTEGER NOT NULL DEFAULT 0,
  free_remaining INTEGER NOT NULL DEFAULT 2,
  total INTEGER GENERATED ALWAYS AS (purchased + free_remaining) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### credit_history
```sql
CREATE TABLE credit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL, -- 'purchase', 'consume', 'refund', 'signup_bonus'
  amount INTEGER NOT NULL,
  purchased_before INTEGER,
  purchased_after INTEGER,
  free_before INTEGER,
  free_after INTEGER,
  total_before INTEGER,
  total_after INTEGER,
  stripe_session_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### credit_reservations
```sql
CREATE TABLE credit_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  credit_type VARCHAR(10) NOT NULL, -- 'free' or 'paid'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'released'
  analysis_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  release_reason VARCHAR(100)
);
```

### songs
```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  artist VARCHAR(500) NOT NULL,
  title_normalized VARCHAR(500) NOT NULL,
  artist_normalized VARCHAR(500) NOT NULL,
  spotify_id VARCHAR(100),
  lyrics TEXT,
  status VARCHAR(20) DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(title_normalized, artist_normalized)
);
```

### analyses
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  song_id UUID NOT NULL REFERENCES songs(id),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  generated_by VARCHAR(50), -- 'claude', 'gpt4', 'gemini', 'grok', 'deepseek'
  
  -- Scores (-10 to +10)
  ethics_score INTEGER NOT NULL,
  metaphysics_score INTEGER NOT NULL,
  epistemology_score INTEGER NOT NULL,
  politics_score INTEGER NOT NULL,
  aesthetics_score INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  
  -- Analysis content
  ethics_analysis TEXT,
  metaphysics_analysis TEXT,
  epistemology_analysis TEXT,
  politics_analysis TEXT,
  aesthetics_analysis TEXT,
  philosophical_analysis TEXT,
  classification VARCHAR(200),
  
  -- Metadata
  historical_context TEXT,
  creative_process TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### beta_requests
```sql
CREATE TABLE beta_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255),
  song VARCHAR(500),
  artist VARCHAR(500),
  justification TEXT,
  detected_language VARCHAR(10),
  code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'PHILOSIFY001'
  code_number INTEGER NOT NULL,
  analysis_score DECIMAL(4,2),
  analysis_classification VARCHAR(200),
  analysis_summary TEXT,
  raw_email_subject TEXT,
  raw_email_body TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'used', 'failed'
  reply_sent_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Key RPC Functions

### reserve_credit(p_user_id)
Reserves a credit before analysis (free first, then paid).

### confirm_reservation(p_reservation_id, p_analysis_id)
Confirms reservation after successful analysis.

### release_reservation(p_reservation_id, p_reason, p_analysis_id)
Releases reservation on failure/cache hit (refunds credit).

### cleanup_stale_reservations(p_age_minutes)
Cleans up old pending reservations (timeout recovery).

### process_stripe_payment(...)
Idempotent payment processing with webhook deduplication.

---

# 📖 GUIDE v2.7 LITE - PHILOSOPHICAL ANALYSIS SYSTEM

## Overview
The Guide v2.7 LITE is the core prompt engineering document that instructs the LLM how to analyze songs philosophically. It's based on Objectivist principles.

## Five Weighted Dimensions

| Dimension | Weight | Focus |
|-----------|--------|-------|
| **Ethics** | 40% | Individualism vs. Collectivism, Self-interest vs. Altruism |
| **Metaphysics** | 20% | Primacy of Existence vs. Primacy of Consciousness |
| **Epistemology** | 20% | Reason vs. Faith, Logic vs. Mysticism |
| **Politics** | 10% | Individual Rights, Capitalism vs. Socialism |
| **Aesthetics** | 10% | Form-Content Integration |

## Scoring System

| Score Range | Classification |
|-------------|----------------|
| +8.1 to +10.0 | Extremely Revolutionary |
| +6.1 to +8.0 | Revolutionary |
| +4.1 to +6.0 | Moderately Revolutionary |
| +2.1 to +4.0 | Constructive Critique |
| +0.1 to +2.0 | Ambiguous, Leaning Realist |
| -2.0 to 0.0 | Ambiguous, Leaning Evasion |
| -4.0 to -2.1 | Soft Conformist |
| -6.0 to -4.1 | Directly Conformist |
| -8.0 to -6.1 | Strongly Conformist |
| -10.0 to -8.1 | Doctrinally Conformist |

## KV Storage Keys
```
guide:en → English Guide v2.7 LITE
guide:pt → Portuguese Guide v2.7 LITE
guide:es → Spanish Guide v2.7 LITE
guide:fr → French Guide v2.7 LITE
guide:de → German Guide v2.7 LITE
guide:it → Italian Guide v2.7 LITE
guide:ja → Japanese Guide v2.7 LITE
guide:ko → Korean Guide v2.7 LITE
guide:zh → Chinese Guide v2.7 LITE
guide:ru → Russian Guide v2.7 LITE
guide:ar → Arabic Guide v2.7 LITE
guide:he → Hebrew Guide v2.7 LITE
guide:hi → Hindi Guide v2.7 LITE
guide:fa → Persian Guide v2.7 LITE
guide:hu → Hungarian Guide v2.7 LITE
```

---

# 🚪 BETAGATE ACCESS SYSTEM

## Overview
BetaGate is a controlled access system that requires users to request access before using the app.

## Access Flow

1. **User visits philosify.org** → Redirected to /beta if no access
2. **User fills form** → Name, email, song, artist, justification
3. **Backend validates** → Song verification via Spotify
4. **Quick analysis** → Claude generates preview analysis
5. **Email sent** → Magic link with access code
6. **User clicks link** → Code validated, access granted
7. **localStorage updated** → `beta_access` object stored

## Code Format
- Pattern: `PHILOSIFY###` (e.g., `PHILOSIFY001`, `PHILOSIFY042`)
- Sequential numbering
- One-time use (marked as 'used' after validation)

## Access Storage (Frontend)
```javascript
localStorage.setItem('beta_access', JSON.stringify({
  code: 'PHILOSIFY042',
  grantedAt: '2025-12-26T12:00:00Z',
  expiresAt: null // or ISO date string
}));
```

---

# 📧 EMAIL SYSTEM

## Overview
The email system handles two types of communications:

### 1. Incoming Emails (bob@philosify.org)
- Routed via Cloudflare Email Routing to Worker
- Auto-responds with BetaGate code
- Parses song/artist from email body
- Generates quick analysis preview

### 2. Outgoing Emails (BetaGate Form)
- Sent via Resend API
- Beautiful HTML templates
- Multi-language support (6 languages)
- BCC shadow copy to bob@philosify.org

## Email Handler Features
- Language detection from email content
- Song/artist extraction with multiple patterns
- Quick philosophical analysis via Claude
- Automatic code generation
- Status tracking in Supabase

## Shadow Copy
All outgoing emails are BCC'd to `bob@philosify.org` for admin visibility.

---

# 🔒 SECURITY ANALYSIS

## Current Security Measures ✅

1. **JWT Authentication**
   - All API requests require valid JWT
   - JWT validated against Supabase
   - User ID extracted from JWT (not from request body)

2. **Row Level Security (RLS)**
   - Users can only access their own data
   - Backend uses service_role for admin operations

3. **Secrets Management**
   - All API keys in Cloudflare Secrets Store
   - Not hardcoded in source code
   - Service keys never exposed to frontend

4. **CORS Configuration**
   - Only allow requests from philosify.org
   - Strict origin validation

5. **Rate Limiting**
   - Native Cloudflare rate limiting
   - 100 requests per 60 seconds per IP

6. **Input Validation**
   - Song/artist sanitization
   - Model validation (whitelist)
   - Language validation

7. **Credit Reservation System**
   - Prevents double-charging
   - Timeout recovery (5 min stale cleanup)
   - Race condition prevention with FOR UPDATE locks

8. **Idempotent Payment Processing**
   - Webhook deduplication via stripe_webhooks table
   - Prevents duplicate credit grants

## Security Best Practices Implemented

- ✅ No API keys in frontend code
- ✅ Service role key only on backend
- ✅ RLS enabled on all user tables
- ✅ HTTPS everywhere
- ✅ JWT expiration handling
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ Error message sanitization (no stack traces to users)

---

# ✅ PROS - STRENGTHS

## Architecture
1. **Edge Computing** - Cloudflare Workers provide low latency globally
2. **Serverless** - No server management, auto-scaling
3. **Modern Stack** - React 19, Vite 7, ES Modules
4. **Modular Backend** - Clean separation into src/ directories
5. **Type-safe Secrets** - Cloudflare Secrets Store

## Functionality
6. **Multi-LLM Support** - 5 AI models with fallback chain
7. **Multilingual** - 15 languages supported
8. **Rich Integrations** - Spotify, Genius, Stripe, Resend
9. **Comprehensive Analysis** - 5-dimension philosophical framework
10. **Analysis Caching** - Don't reanalyze same song/language/model
11. **Credit Reservation** - Prevents double-charging, handles timeouts

## Business Model
12. **Freemium Model** - 2 free analyses for acquisition
13. **Clear Pricing** - Simple credit system
14. **BetaGate Access** - Controlled rollout with email collection

## Security
15. **JWT Auth** - Industry standard authentication
16. **RLS Enabled** - Row-level security protects user data
17. **Rate Limiting** - Native Cloudflare protection
18. **Idempotent Payments** - No duplicate charges

## Code Quality
19. **Comprehensive Documentation** - SQL schemas, guides, audit docs
20. **Error Handling** - Proper error responses with status codes
21. **Logging** - Console logs for debugging
22. **Modular Structure** - Easy to maintain and extend

---

# ❌ CONS - Issues & Risks

## Medium Priority Issues 🟡

1. **Large Main Index** - index.js at ~982 lines (could be split further)
2. **No TypeScript** - No type safety
3. **No Unit Tests** - Only integration tests exist
4. **No Error Monitoring** - No Sentry or similar (configured but not fully integrated)
5. **Duplicate Parser Keys** - Warning in parser.js for duplicate classification keys

## Low Priority Issues 🟢

6. **No Admin Panel** - No way to manage users, view stats via UI
7. **No Analytics** - No tracking of user behavior
8. **No PWA Offline** - Service worker exists but limited functionality
9. **Large Bundle** - Main JS chunk ~600KB (could be optimized)

## Technical Debt

10. **Mixed Patterns** - Some inline handlers, some modular
11. **Duplicate Translation Keys** - Some overlap in i18n files
12. **Legacy Endpoints** - /api/grant-beta-credits kept for backwards compatibility

---

# 📋 TO-DO CHECKLIST

## Phase 1: Immediate (Completed ✅)

- [x] **Site Access** - philosify.org working
- [x] **Authentication** - Supabase auth working
- [x] **Credit System** - Reserve/confirm/release pattern
- [x] **Stripe Integration** - Checkout + webhooks working
- [x] **BetaGate System** - Email-based access codes
- [x] **Email System** - Resend integration with shadow copy
- [x] **Analysis Caching** - Don't recharge for cached results
- [x] **Timeout Recovery** - Stale reservation cleanup

## Phase 2: Optimization (In Progress)

### Backend
- [ ] Fix duplicate keys in parser.js
- [ ] Add Sentry error monitoring
- [ ] Add more comprehensive logging

### Frontend
- [ ] Code splitting for large chunks
- [ ] Lazy load heavy components
- [ ] Add loading skeletons

### Performance
- [ ] Add caching headers for static assets
- [ ] Optimize image loading

## Phase 3: Features (Future)

### Admin Panel
- [ ] Create /admin route
- [ ] User management (view, ban)
- [ ] Analytics dashboard
- [ ] Revenue tracking

### Email Notifications
- [ ] Purchase confirmation email
- [ ] Welcome email
- [ ] Low balance reminder

### Export Features
- [ ] Export analysis as PDF
- [ ] Share analysis link (partially done)
- [ ] Embed widget

## Phase 4: Polish (Ongoing)

### Quality
- [ ] Add TypeScript
- [ ] Add unit tests
- [ ] Add E2E tests (Playwright)

### Documentation
- [ ] API documentation (OpenAPI)
- [ ] User guide
- [ ] Developer README improvements

---

## Configuration Checklist

### Secrets (Cloudflare Secrets Store)
```bash
# All 19 secrets configured:
✅ OPENAI_API_KEY
✅ GEMINI_API_KEY
✅ ANTHROPIC_API_KEY
✅ GROK_API_KEY
✅ DEEPSEEK_API_KEY
✅ STRIPE_SECRET_KEY
✅ STRIPE_WEBHOOK_SECRET
✅ STRIPE_PRICE_ID_10
✅ STRIPE_PRICE_ID_20
✅ STRIPE_PRICE_ID_50
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_KEY
✅ SUPABASE_ANON_KEY
✅ SPOTIFY_CLIENT_ID
✅ SPOTIFY_CLIENT_SECRET
✅ GENIUS_ACCESS_TOKEN
✅ RESEND_API_KEY
✅ ADMIN_SECRET
```

### KV Storage
```bash
# All 15 language guides:
✅ guide:en, guide:pt, guide:es, guide:fr, guide:de
✅ guide:it, guide:ja, guide:ko, guide:zh, guide:ru
✅ guide:ar, guide:he, guide:hi, guide:fa, guide:hu
```

### Supabase Tables
```sql
✅ credits
✅ credit_history
✅ credit_reservations
✅ songs
✅ analyses
✅ beta_requests
✅ stripe_webhooks
✅ email_outbox
```

---

## Quick Commands

```bash
# Deploy backend
cd api && npx wrangler deploy --env production

# Deploy frontend
cd site && npm run build && npx wrangler pages deploy dist

# Deploy both (PowerShell)
.\deploy-production.ps1

# Check backend logs
cd api && npx wrangler tail --env production

# Test health endpoint
curl https://api.philosify.org/health

# Local development
.\dev.ps1  # Starts both frontend and backend
```

---

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Site Access | ✅ Working | philosify.org live |
| Authentication | ✅ Working | Supabase JWT |
| Credit System | ✅ Working | Reserve/confirm/release |
| Stripe Payments | ✅ Working | Checkout + webhooks |
| BetaGate | ✅ Working | Email-based access |
| Email System | ✅ Working | Resend + shadow copy |
| Analysis Engine | ✅ Working | 5 LLMs with fallback |
| Caching | ✅ Working | No recharge for cached |
| Security | ✅ Good | RLS, rate limiting, secrets |
| Performance | 🟡 Needs Work | Bundle optimization |
| Testing | 🟡 Minimal | Integration tests only |
| Admin Tools | 🔴 Missing | No admin panel |

---

*Document updated: December 26, 2025*
*Based on comprehensive codebase analysis*






