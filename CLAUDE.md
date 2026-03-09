# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Important: Git Commit Policy

**NEVER include Claude Code attribution in commit messages.**

Do NOT add these lines to any commit:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Keep commit messages clean and professional without AI attribution.

---

## Project Overview

**Philosify** is a philosophical music analysis platform that evaluates songs through the lens of Objectivist philosophy (Ayn Rand). The system provides rigorous philosophical scoring across five dimensions: Ethics, Metaphysics, Epistemology, Politics, and Aesthetics.

**Architecture:** Full-stack serverless application
- **Backend:** Cloudflare Workers (modular ES modules in `api/src/`)
- **Frontend:** Vite/React SPA hosted on Cloudflare Pages
- **Database:** Supabase (PostgreSQL) - analyses, credits, user data
- **Storage:** Cloudflare KV (philosophical guidelines only)
- **AI Models:** OpenAI GPT-4o, Google Gemini, Anthropic Claude, Grok (via APIs)
- **Payment:** Stripe (credit system with reserve/confirm/release pattern)
- **Auth:** Supabase Auth (JWT verification)

---

## Repository Structure

```
C:\Philosify-web\
├── api/                          # Backend (Cloudflare Worker)
│   ├── index.js                  # Main entry point (routes to src/)
│   ├── wrangler.toml             # Cloudflare configuration (Secrets Store)
│   ├── package.json              # Dependencies and scripts
│   ├── src/                      # Modular source code
│   │   ├── ai/                   # AI analysis logic
│   │   │   ├── models/           # Model-specific clients (openai, gemini, claude, grok)
│   │   │   ├── prompts/          # Prompt templates
│   │   │   ├── parser.js         # Response parsing & normalization
│   │   │   └── storage.js        # Analysis persistence
│   │   ├── credits/              # Credit system (reserve/confirm/release)
│   │   ├── config/               # Configuration files
│   │   │   ├── scoring.js        # Philosophical scoring weights
│   │   │   └── pricing.js        # Model pricing
│   │   └── utils/                # Helpers (secrets, validation)
│   ├── guides/                   # Philosophical guidelines (12 languages)
│   └── docs/                     # Documentation
├── site/                         # Frontend (Vite/React SPA)
│   ├── index.html                # Entry HTML
│   ├── wrangler.toml             # Cloudflare Pages config (env vars)
│   ├── vite.config.js            # Vite configuration
│   ├── package.json              # Dependencies
│   └── src/                      # React source code
│       ├── components/           # UI components (auth, search, results, etc.)
│       ├── hooks/                # Custom React hooks
│       ├── contexts/             # React contexts (CreditsContext)
│       ├── pages/                # Page components
│       ├── i18n/                 # Translations (12 languages)
│       └── utils/                # Frontend utilities
├── CLAUDE.md                     # Instructions for Claude Code
├── CODEBASE_REVIEW.md            # Task tracking and technical debt
└── supabase_schema.sql           # Database schema (reference)
```

---

## Development Commands

### Backend (Cloudflare Worker)

All commands should be run from the `api/` directory:

```bash
cd api

# Development (local server on http://localhost:8787)
npm run dev
# or
wrangler dev

# Deploy to production
npm run deploy
# or
wrangler deploy

# View live logs
npm run tail
# or
wrangler tail

# Test local endpoint
npm test
# or
curl -X POST http://localhost:8787/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"song": "My Way - Frank Sinatra", "lang": "en"}'

# Rollback to previous version
npm run rollback
# or
wrangler rollback
```

### KV Namespace Management

```bash
# List all KV namespaces
wrangler kv:namespace list

# Create new namespace
wrangler kv:namespace create "NAMESPACE_NAME"

# Upload philosophical guide (critical for analysis)
wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path=guides/Guide_v2.9_LITE.txt
wrangler kv:key put --binding=PHILOSIFY_KV "guide_text_pt" --path=guides/guide_text_pt.txt

# List keys in namespace
wrangler kv:key list --binding=PHILOSIFY_KV

# Get key value
wrangler kv:key get --binding=PHILOSIFY_KV "guide_text"

# Delete key
wrangler kv:key delete --binding=PHILOSIFY_KV "key_name"
```

### Secrets Management

**IMPORTANT:** Philosify uses **environment-based configuration**:
- **Local Development**: Uses `api/.dev.vars` (git-ignored, never uploaded)
- **Production**: Uses Cloudflare Secrets Store

#### Local Development Setup

**SECURITY FIRST:** Always use the template to avoid exposing real secrets.

1. **Copy the template** to create your local `.dev.vars`:
```bash
cd api
cp .dev.vars.example .dev.vars
```

2. **Fill in your actual API keys** in `api/.dev.vars`:
   - See the template for links to get each API key
   - Use **test keys** for Stripe (`sk_test_`, not `sk_live_`)
   - Generate a secure `ADMIN_SECRET`: `openssl rand -hex 32`

3. **Configure frontend** to use local API in `site/.env`:
```bash
VITE_API_URL=http://localhost:8787
VITE_CDN_URL=https://pub-2485a0b8727445bbb7148e85a0db3edf.r2.dev
```

4. **Run local dev server**:
```bash
cd api
npm run dev  # or: wrangler dev
```

**SECURITY WARNINGS:**
- ⚠️ `.dev.vars` contains sensitive credentials - keep it secure
- ✅ File is automatically git-ignored (Wrangler built-in)
- ✅ Never uploaded to Cloudflare (local only)
- 🔒 Rotate keys immediately if accidentally exposed
- 📝 Never commit real secrets to the repository

#### Production Configuration

All secrets are managed via the Cloudflare Dashboard UI:
1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages > Account Settings > Secrets Store
3. Add/edit secrets in the Store (ID: `aa556a30980842c785cb0e1cbb0bb933`)

**Required Secrets (16 total):**
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `GROK_API_KEY`
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_10`, `STRIPE_PRICE_ID_20`, `STRIPE_PRICE_ID_50`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`
- `GENIUS_ACCESS_TOKEN`, `ADMIN_SECRET`

#### Code Access Pattern

Use the `getSecret()` helper for both environments:

```javascript
import { getSecret } from './src/utils/secrets.js';

// Works in both dev (.dev.vars) and production (Secrets Store)
const apiKey = await getSecret(env.OPENAI_API_KEY);
const spotifyId = await getSecret(env.SPOTIFY_CLIENT_ID);
```

**Helper Implementation:**
```javascript
// api/src/utils/secrets.js
export async function getSecret(secret) {
  // Secrets Store has .get() method, .dev.vars returns plain string
  if (typeof secret?.get === 'function') {
    return await secret.get();
  }
  return secret;
}
```

**wrangler.toml Structure:**
```toml
# Base config (used for local dev with .dev.vars)
name = "philosify-api"
main = "index.js"

[vars]
ALLOWED_ORIGINS = "... http://localhost:3000 http://localhost:8787 ..."

# Production environment (uses Secrets Store)
[env.production]
[env.production.vars]
ALLOWED_ORIGINS = "https://philosify.org https://www.philosify.org"

[[env.production.secrets_store_secrets]]
binding = "OPENAI_API_KEY"
store_id = "aa556a30980842c785cb0e1cbb0bb933"
secret_name = "OPENAI_API_KEY"
# ... all other secrets in production environment only
```

### Database (Supabase)

```bash
# Execute schema
# 1. Go to https://supabase.com/dashboard
# 2. Select project > SQL Editor > New Query
# 3. Paste contents of supabase_schema.sql
# 4. Run

# Check tables
# Table Editor in Supabase dashboard shows:
# - analyses (main analysis data with scores)
# - translations (multilingual text translations)
# - credits, credit_history, credit_reservations (credit system)
# - user_analysis_requests (RLS bridge)
# - auth.users (managed by Supabase Auth)
```

### Frontend

```bash
cd site

# Install dependencies
npm install

# Development (local server on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=philosify-frontend

# Production URL: https://philosify.org
# Pages project: philosify-frontend
```

**Environment Variables:**
- Local dev: `site/.env` (VITE_API_URL, VITE_CDN_URL)
- Production: `site/wrangler.toml` [vars] section

---

## Architecture & Key Concepts

### 1. Philosophical Analysis System

The core of Philosify is the **objective philosophical scoring system** based on Objectivist philosophy:

**Five Scoring Dimensions** (each scored -10 to +10):
1. **Ethics** - Evaluates egoism vs. altruism, virtue vs. sacrifice
2. **Metaphysics** - Benevolent vs. malevolent universe view
3. **Epistemology** - Reason vs. faith/mysticism
4. **Politics** - Individual rights vs. collectivism/coercion
5. **Aesthetics** - Romantic realism vs. naturalism/modernism

**Key Principle:** Content determines aesthetic value. Beautiful melody with destructive philosophy = morally condemnable.

**Critical Terminology:**
- Use "autointeresse virtuoso" (virtuous self-interest) NOT "egoísmo racional" in Portuguese
- Use "virtuous self-interest" NOT "rational egoism" in English
- Sacrifice = trading GREATER value for LESSER value (not all trade-offs)
- Hero vs. Martyr distinction is essential (reason vs. faith, egoism vs. altruism)

### 2. Data Flow Architecture

```
User Input (song name)
  → Frontend (React SPA)
    → POST /api/analyze with JWT auth
      → RESERVE credit (Supabase)
      → Backend checks cache (Supabase)
        → If cached: RELEASE credit, return instantly
        → If not cached:
          1. Fetch guide from KV (language-specific)
          2. Call AI model (OpenAI/Gemini/Claude/Grok)
          3. Parse scores and philosophical analysis
          4. Store in Supabase (scores are IMMUTABLE per song+model)
          5. CONFIRM credit consumption
          6. Return to frontend
```

### 3. Caching Strategy

**Critical Rule:** Scores are FIXED per (song_name + artist + model) combination.

- First analysis by model A: generates scores → saves to DB
- Subsequent requests: instant return from cache
- Different language: same scores, translate text only (via `translations` table)
- Different model: generates new independent analysis

**Why?** Philosophical evaluation of a song's content doesn't change. Only the language of explanation changes.

### 4. Credit System

Built on Supabase with **reserve/confirm/release pattern** for reliability:

**Database Tables:**
- `credits` - User balance (purchased + free_remaining)
- `credit_history` - User-visible transaction statement
- `credit_reservations` - Internal audit trail (service_role only)

**Flow (Reserve → Confirm/Release):**
```
1. User requests analysis
2. RESERVE: Deduct 1 credit, create reservation record
3. Analysis runs...
4a. SUCCESS (new analysis): CONFIRM reservation
4b. CACHED (already exists): RELEASE credit back to user
4c. FAILURE: RELEASE credit back to user
```

**Why this pattern?**
- Prevents double-charging on retries
- Handles failures gracefully (credits returned)
- Cached analyses don't consume credits
- Full audit trail in `credit_reservations`

**Tiers:** 10, 20, 50 credits (mapped to Stripe price IDs)

**Balance API Response (`/api/balance`):**
```javascript
{
  userId: "uuid",
  credits: 10,           // Purchased credits
  freeRemaining: 2,      // Free analyses remaining
  total: 12              // credits + freeRemaining
}
```
**IMPORTANT:** Frontend uses `CreditsContext` for centralized balance state. Never call `/api/balance` directly from multiple components.

### 5. Rate Limiting

Native Cloudflare rate limit binding (no KV operations):
- Config: `[[ratelimits]]` in wrangler.toml
- 100 requests per 60-second window per key per PoP
- Zero latency (local cached counters)
- Per Cloudflare location (not globally consistent)

### 6. Multilingual Support

12 languages supported via KV guides:
- `guide_text` (English, fallback)
- `guide_text_pt` (Portuguese)
- `guide_text_es`, `_fr`, `_de`, `_it`, `_ru`, `_hu`, `_he`, `_zh`, `_ja`, `_ko`

**Deployment:** Use `deploy_all_guides.sh` (Linux/Mac) or `deploy_all_guides.ps1` (Windows)

### 7. AI Model Integration

Four models supported:
- **OpenAI GPT-4o** - Technical, rigorous analysis
- **Google Gemini 3 Flash** - Fast and efficient analysis
- **Anthropic Claude** - Balanced, nuanced analysis
- **xAI Grok 3** - Bold, unconventional analysis

Each model generates independent analysis. User can request same song from multiple models.
Model clients are in `api/src/ai/models/` - each follows the same interface pattern.

### 8. Supabase Schema

**analyses** (main table):
- Unique constraint: `(song_name, artist, generated_by)` - one analysis per model
- Scores are integers with CHECK constraints (-10 to +10)
- `philosophical_note` is integer (1-10)
- `has_ambivalence` flag for philosophical contradictions
- `spotify_id` for Spotify integration
- Soft-delete via `deleted_at` column

**translations** (i18n):
- Foreign key to `analyses.id`
- Stores translated text per language
- Same analysis, multiple languages

**credits** (user balance):
- `purchased` - Credits bought via Stripe
- `free_remaining` - Free credits (signup bonus)
- RLS enabled, users see only their own

**credit_history** (transaction log):
- User-visible statement of all transactions
- Types: 'purchase', 'analysis', 'signup_bonus', 'refund'
- Includes `receipt_url` for purchase transactions

**credit_reservations** (audit trail):
- Internal tracking for reserve/confirm/release
- service_role access only (not visible to users)

**stripe_customers** (Stripe mapping):
- Links user_id to stripe_customer_id
- service_role access only (RLS blocks anon/authenticated)
- Enables customer reuse across purchases

**user_analysis_requests** (RLS bridge):
- Links users to analyses they've requested
- Enables RLS without exposing all analyses

---

## Common Development Workflows

### Adding a New AI Model

1. Add API key to Secrets Store via Cloudflare dashboard
2. Create model client in `api/src/ai/models/newmodel.js` (follow existing patterns)
3. Export from `api/src/ai/models/index.js`
4. Add model option in frontend `ModelSelector.jsx`
5. Add translations for model name in `site/src/i18n/translations/`
6. Test with: `curl -X POST .../analyze -d '{"song":"test","model":"newmodel"}'`

### Updating Philosophical Guidelines

Guidelines are stored in KV and are CRITICAL for correct analysis:

1. Edit the canonical guide file in `api/guides/` (currently: `Guide_v2.9_LITE.txt`)
2. Upload to KV:
   ```bash
   wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path=api/guides/Guide_v2.9_LITE.txt
   ```
3. Verify upload: `wrangler kv:key get --binding=PHILOSIFY_KV "guide_text" | head -20`
4. No code changes needed - worker fetches guide on each analysis

### Adding a New Language

1. Translate guide: Create `guide_text_XX.txt` (XX = language code)
2. Ensure UTF-8 encoding and correct terminology
3. Upload: `wrangler kv:key put --binding=PHILOSIFY_KV "guide_text_XX" --path=guide_text_XX.txt`
4. Frontend already supports lang parameter: `{"song":"test","lang":"XX"}`
5. Test: Verify guide is fetched and used in analysis

### Debugging Analysis Issues

1. Check logs: `wrangler tail` (live) or Cloudflare dashboard
2. Verify guide exists in KV: `wrangler kv:key get --binding=PHILOSIFY_KV "guide_text"`
3. Check Supabase cache: Query `analyses` table directly
4. Check credit flow: Query `credit_reservations` for stuck reservations
5. Test AI model directly with curl (bypass frontend)
6. Verify secrets: Check Secrets Store in Cloudflare dashboard

### Handling Stripe Webhooks

Critical for credit system:

1. Set webhook URL in Stripe dashboard: `https://api.philosify.org/api/stripe-webhook`
2. Configure webhook secret: Add `STRIPE_WEBHOOK_SECRET` to Secrets Store via dashboard
3. Test with Stripe CLI: `stripe trigger checkout.session.completed`
4. Verify credits updated: Query `credits` and `credit_history` tables in Supabase
5. Monitor webhook logs: `wrangler tail | grep stripe-webhook`

### Deploying Full Stack

**Deployment:**
- Worker: `philosify-api` (URL shown after `wrangler deploy`)
- Frontend: `https://philosify.org` (Cloudflare Pages: `philosify-frontend`)
- Repository: Public on GitHub

**Manual Deployment Steps:**
1. Deploy backend: `cd api && wrangler deploy --env production`
2. Deploy frontend: `cd site && npm run build && wrangler pages deploy dist --project-name=philosify-frontend`
3. Upload guides (if updated): `cd api/guides && ./deploy_all_guides.sh` (Linux/Mac) or `deploy_all_guides.ps1` (Windows)
4. Execute SQL (first time): Run migrations via Supabase dashboard SQL Editor
5. Configure secrets (first time): Add all secrets to Secrets Store via Cloudflare dashboard

---

## Important Constraints & Rules

### Philosophical Rigor

- **Never compromise on Objectivist principles** - This is the core value proposition
- Scores must reflect actual philosophical content, not popularity or artistic skill
- Distinguish hero vs. martyr (reason vs. faith) - this is NON-NEGOTIABLE
- Sacrifice must be correctly defined (greater for lesser value)
- Use correct terminology: "virtuous self-interest" not "rational egoism"

### Code Quality

- Keep `index.js` worker code under 1MB (Cloudflare limit)
- Use environment variables for all secrets (never hardcode)
- Always validate user input before processing
- Return proper CORS headers on all responses
- Handle rate limiting before expensive operations

### Security

- All secrets stored in Cloudflare Secrets Store (never in code or wrangler.toml)
- Local dev uses `api/.dev.vars` (git-ignored) - see `.dev.vars.example` for template
- Validate Stripe webhook signatures (HMAC verification in place)
- JWT tokens from Supabase Auth - verified via JWKS
- Rate limit all endpoints by user ID + IP
- RLS enabled on all Supabase tables

### Performance

- Cache aggressively - scores never change for same (song, artist, model)
- Use KV for philosophical guides only (rate limiting uses native binding)
- Use Supabase for all persistent data (analyses, translations, credits)
- Keep guide texts under 25KB each (KV limits)
- Minimize AI API calls (most expensive operation)

### Data Integrity

- Scores are IMMUTABLE once saved - never update, only insert new
- Unique constraint prevents duplicate analyses per model
- Translations link to analyses via foreign key (cascade delete)
- Credit operations use Supabase RPC functions for atomicity
- Reserve/confirm/release pattern ensures no credit loss on failures

---

## Testing

### Local Development Testing

```bash
# Start local server
cd api && wrangler dev

# Test health endpoint
curl http://localhost:8787/api/health

# Test analysis (requires auth)
curl -X POST http://localhost:8787/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"song": "Imagine", "artist": "John Lennon", "lang": "en", "model": "gpt4"}'

# Test balance check
curl http://localhost:8787/api/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Production Testing

```bash
# Health check (public)
curl https://api.philosify.org/api/health

# Analysis (requires auth)
curl -X POST https://api.philosify.org/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"song": "test song", "lang": "pt", "model": "gemini"}'

# Verify caching (run twice, second should be instant)
# Check for "cached": true in response
```

### Verifying Deployment

1. Health check returns `{"ok": true, "service": "philosify-api"}`
2. KV guides exist: `wrangler kv:key list --binding=PHILOSIFY_KV | grep guide`
3. Secrets configured: Check Secrets Store in Cloudflare dashboard
4. Supabase tables exist: Check dashboard Table Editor
5. Frontend loads: Visit https://philosify.org
6. Auth works: Sign up / sign in
7. Spotify search works: Search for songs
8. Analysis works: Analyze song, see results
9. Balance displays: Check user balance after login
10. Credits work: Make purchase, verify credits added

---

## Troubleshooting

### "Guide NOT FOUND" in Logs

**Cause:** Philosophical guide missing from KV
**Fix:** Upload guide: `wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path=path/to/guide.txt`

### Analysis Returns English Despite Lang Parameter

**Cause:** Language-specific guide missing from KV (falls back to English)
**Fix:** Upload language guide: `wrangler kv:key put --binding=PHILOSIFY_KV "guide_text_XX" --path=guide_text_XX.txt`

### "Unauthorized" on Analysis

**Cause:** Missing or invalid JWT token
**Fix:** Ensure user is signed in, check Supabase auth configuration

### "Too Many Requests" Error

**Cause:** Rate limit exceeded (100 req/60s per PoP)
**Fix:** Wait 60 seconds. Native rate limit binding auto-resets (no manual intervention needed).

### Credits Not Added After Payment

**Cause:** Webhook not configured or failing
**Fix:** Check Stripe webhook logs, verify webhook secret, ensure endpoint is `/api/stripe-webhook`

### AI Model Errors

**Cause:** Invalid API key or model name
**Fix:** Check Secrets Store in Cloudflare dashboard, verify model names in `wrangler.toml`, test API key directly

### Encoding Issues (é, ç, ã display as ?)

**Cause:** Guide not saved as UTF-8
**Fix:** Re-save guide file as UTF-8, re-upload to KV

---

## Resources

### Documentation
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Cloudflare Secrets Store:** https://developers.cloudflare.com/workers/configuration/secrets/
- **Wrangler CLI:** https://developers.cloudflare.com/workers/wrangler/
- **Cloudflare KV:** https://developers.cloudflare.com/workers/runtime-apis/kv/
- **Supabase:** https://supabase.com/docs
- **Stripe API:** https://stripe.com/docs/api

### Project Docs
- `CLAUDE.md` - Instructions for Claude Code (this file)
- `CODEBASE_REVIEW.md` - Task tracking, technical debt, architecture notes
- `api/docs/README.md` - Multilingual system overview
- `api/docs/COMO_ADICIONAR_GUIDES_NO_KV.md` - Guide upload tutorial
- `api/guides/` - Philosophical guidelines v2.6 (12 languages)

### Philosophy References
- Ayn Rand's works (Atlas Shrugged, The Fountainhead, The Virtue of Selfishness)
- Objectivism: The Philosophy of Ayn Rand (Leonard Peikoff)
- Guide texts in `api/guides/` contain full philosophical framework

---

## Key Files Reference

### Backend (api/)
- `api/index.js` - Main entry, route definitions
- `api/src/ai/models/` - AI model clients (openai.js, gemini.js, claude.js, grok.js)
- `api/src/ai/prompts/template.js` - Analysis prompt with guide v2.6 integration
- `api/src/ai/parser.js` - JSON extraction, score normalization, classification mapping
- `api/src/ai/storage.js` - Analysis persistence to Supabase
- `api/src/credits/` - Credit system (reserve.js, confirm.js, release.js)
- `api/src/config/scoring.js` - Philosophical scoring weights (Ethics 40%, etc.)
- `api/src/config/pricing.js` - Model pricing configuration
- `api/wrangler.toml` - Cloudflare Worker configuration, Secrets Store bindings

### Frontend (site/)
- `site/src/App.jsx` - Main app component, route setup
- `site/src/contexts/CreditsContext.jsx` - Centralized credit balance state
- `site/src/hooks/useAnalysis.js` - Analysis request logic
- `site/src/hooks/useCredits.js` - Credit balance hook
- `site/src/components/results/` - Analysis display components
- `site/src/i18n/translations/` - 12 language JSON files
- `site/wrangler.toml` - Cloudflare Pages env vars (VITE_API_URL, VITE_CDN_URL)
