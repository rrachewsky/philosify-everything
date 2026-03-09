# 🎯 PHILOSIFY - QUICK START GUIDE

## ✅ CURRENT DEPLOYMENT

**Production:**
- Frontend: https://philosify.org
- Backend API: Deployed to `philosify-api` worker (URL shown after `wrangler deploy`)
- Repository: https://github.com/philosify/philosify-web

**Services:**
- Cloudflare Workers (backend)
- Cloudflare Pages (frontend: philosify-frontend)
- Cloudflare KV (guides, user ledger, rate limiting)
- Cloudflare Secrets Store (16 secrets)
- Supabase (PostgreSQL database + auth)
- Stripe (payment processing)

---

## 🚀 DEPLOYMENT STEPS

### ⚡ STEP 1: Install Wrangler (if not already)

```bash
npm install -g wrangler@4
wrangler login
```

Ensure you have access to your Cloudflare account.

---

### ⚡ STEP 2: Configure Secrets (First Time Only)

All secrets are managed via **Cloudflare Secrets Store** (not Worker secrets).

1. Go to https://dash.cloudflare.com
2. Navigate to: Workers & Pages > Account Settings > Secrets Store
3. Add all 16 secrets to Store ID: `aa556a30980842c785cb0e1cbb0bb933`

**Required Secrets:**
- `OPENAI_API_KEY` - OpenAI GPT-4o API key
- `GEMINI_API_KEY` - Google Gemini API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `GROK_API_KEY` - xAI Grok API key (optional)
- `SPOTIFY_CLIENT_ID` - Spotify Web API client ID
- `SPOTIFY_CLIENT_SECRET` - Spotify Web API client secret
- `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signature secret
- `STRIPE_PRICE_ID_10` - Stripe price ID for 10 credits
- `STRIPE_PRICE_ID_20` - Stripe price ID for 20 credits
- `STRIPE_PRICE_ID_50` - Stripe price ID for 50 credits
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `GENIUS_ACCESS_TOKEN` - Genius API token (optional)
- `ADMIN_SECRET` - Admin authentication secret

**Note:** `wrangler.toml` already contains the Secrets Store bindings configuration.

---

### ⚡ STEP 3: Setup Supabase Database (First Time Only)

```bash
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to: SQL Editor > New Query
4. Copy and paste the entire contents of supabase_schema.sql
5. Click "Run"
6. Verify: Table Editor should show:
   - song_analyses
   - song_translations
   - auth.users (managed by Supabase Auth)
```

---

### ⚡ STEP 4: Verify KV Namespaces

The project uses 3 KV namespaces (already configured in `wrangler.toml`):

```bash
# List all KV namespaces
wrangler kv:namespace list

# Expected:
# PHILOSIFY_KV: 6ececc5beba846a9a33d47ada0890fa6
# USER_LEDGER: dbf2e14f47a5428388ea129d4ee5a790
# RATE_LIMIT: 1622fbae39b9442e8be38d77e303813b
```

---

### ⚡ STEP 5: Upload Philosophical Guides (First Time Only)

Guides are stored in KV and used by AI models for analysis.

**Windows (PowerShell):**
```powershell
.\api\scripts\upload-guide-to-kv.ps1
```

**Manual upload (if scripts fail):**
```bash
cd api
wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path=guides/Guide_v2.9_LITE.txt
wrangler kv:key put --binding=PHILOSIFY_KV "guide_text_pt" --path=guides/guide_text_pt_v2.6_FINAL.txt
# ... repeat for all 12 languages (en, pt, es, fr, de, it, ru, hu, he, zh, ja, ko)
```

**Verify upload:**
```bash
wrangler kv:key list --binding=PHILOSIFY_KV | grep guide
```

---

### ⚡ STEP 6: Deploy Backend (Worker)

```bash
cd api
wrangler deploy --env production
```

Expected output:
```
✨ Total Upload: ... KiB / gzip: ... KiB
✨ Uploaded philosify-api (... sec)
✨ Published philosify-api (... sec)
  https://philosify-api.YOUR-SUBDOMAIN.workers.dev
```

**Copy the URL shown above**, then verify deployment:
```bash
curl https://YOUR-WORKER-URL/api/health
# Expected: {"ok":true,"service":"philosify-api"}
```

---

### ⚡ STEP 7: Deploy Frontend (Pages)

```bash
cd site
wrangler pages deploy . --project-name=philosify-frontend
```

Expected output:
```
✨ Deployment complete!
✨ https://philosify-frontend.pages.dev
```

**Custom domain (philosify.org) is configured in Cloudflare Pages dashboard.**

---

## 🧪 TESTING

### Test 1: Health Check (Public)
```bash
curl https://YOUR-WORKER-URL/api/health
```
Expected: `{"ok":true,"service":"philosify-api"}`

(Replace `YOUR-WORKER-URL` with the URL shown after `wrangler deploy`)

### Test 2: Frontend Loads
```
1. Visit https://philosify.org
2. Should see homepage with search bar
3. Check browser console for errors
```

### Test 3: Authentication
```
1. Click "Sign Up" or "Login"
2. Create account or sign in with existing
3. Should see balance display in top right
```

### Test 4: Spotify Search
```
1. Type "imagine john lennon" in search bar
2. Should see dropdown with song suggestions
3. Select a song from dropdown
```

### Test 5: Song Analysis
```
1. Search for a song (e.g., "My Way - Frank Sinatra")
2. Click "Analyze with GPT-4o" or "Analyze with Gemini"
3. Should see loading animation
4. Should see philosophical analysis with 5 dimension scores
5. Check balance decreased by 1
```

### Test 6: Caching
```
1. Analyze the same song again with same model
2. Should return instantly (cached)
3. Should NOT deduct credits
```

### Test 7: Credits System
```
1. Check balance (should show total = credits + freeRemaining)
2. New users get 2 free analyses
3. After consuming free, uses paid credits
4. When balance = 0, prompted to purchase
```

---

## 📊 MONITORING

### View Live Logs
```bash
cd api
wrangler tail
```

### View Recent Deployments
```bash
cd api
wrangler deployments list
```

### Rollback to Previous Version (if needed)
```bash
cd api
wrangler rollback
```

### Check KV Storage
```bash
# List guides
wrangler kv:key list --binding=PHILOSIFY_KV

# Check specific guide
wrangler kv:key get --binding=PHILOSIFY_KV "guide_text" | head -20

# List user ledgers
wrangler kv:key list --binding=USER_LEDGER

# Check specific user
wrangler kv:key get --binding=USER_LEDGER "user-uuid"
```

### Check Secrets Store
```
1. Go to https://dash.cloudflare.com
2. Workers & Pages > Account Settings > Secrets Store
3. Verify all 16 secrets exist
```

### Monitor Supabase
```
1. Go to https://supabase.com/dashboard
2. Select project
3. Table Editor: Check song_analyses count
4. Logs: View authentication and query logs
```

### Monitor Stripe
```
1. Go to https://dashboard.stripe.com
2. Webhooks: Check delivery status
3. Payments: View successful transactions
4. Customers: See credit purchases
```

---

## 🔧 COMMON OPERATIONS

### Update Backend Code
```bash
cd api
# Make changes to index.js
wrangler deploy --env production
```

### Update Frontend
```bash
cd site
# Make changes to index.html
wrangler pages deploy . --project-name=philosify-frontend
```

### Update Philosophical Guides
```bash
cd api/guides
# Edit guide_text_*.txt files
# Re-upload to KV
wrangler kv:key put --binding=PHILOSIFY_KV "guide_text" --path=guide_text_v2.6_FINAL.txt
```

### Add New Secret
```
1. Go to Cloudflare dashboard > Secrets Store
2. Add secret with name and value
3. Update wrangler.toml with new binding:
   [[secrets_store_secrets]]
   binding = "NEW_SECRET_NAME"
   store_id = "aa556a30980842c785cb0e1cbb0bb933"
   secret_name = "NEW_SECRET_NAME"
4. Update index.js to access: await env.NEW_SECRET_NAME.get()
5. Redeploy: wrangler deploy --env production
```

---

## ❌ TROUBLESHOOTING

### "Guide NOT FOUND" Error
**Cause:** Philosophical guide missing from KV
**Fix:** Upload guide to KV (see Step 5 above)

### Spotify Search Not Working
**Cause:** SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not in Secrets Store
**Fix:** Add secrets to Secrets Store via dashboard

### Balance Shows "NaN" or Error
**Cause:** Balance API field mismatch
**Fix:** Frontend expects `data.total` and `data.freeRemaining` (already fixed in current version)

### "Unauthorized" on Analysis
**Cause:** User not authenticated or JWT expired
**Fix:** Sign out and sign in again

### Credits Not Added After Payment
**Cause:** Stripe webhook not configured or failing
**Fix:**
1. Set Stripe webhook URL to: `https://YOUR-WORKER-URL/api/stripe-webhook`
2. Verify STRIPE_WEBHOOK_SECRET in Secrets Store
3. Check Stripe webhook logs for delivery status

### Analysis Returns Wrong Language
**Cause:** Language-specific guide missing from KV
**Fix:** Upload guide for that language (e.g., `guide_text_es` for Spanish)

---

## 📚 ADDITIONAL RESOURCES

- **CLAUDE.md** - Comprehensive project documentation for Claude Code
- **REFACTOR.md** - Refactoring progress tracker
- **api/docs/README.md** - Multilingual system overview
- **api/docs/COMO_ADICIONAR_GUIDES_NO_KV.md** - Guide upload tutorial (Portuguese)
- **Cloudflare Workers Docs:** https://developers.cloudflare.com/workers/
- **Cloudflare Secrets Store:** https://developers.cloudflare.com/workers/configuration/secrets/
- **Supabase Docs:** https://supabase.com/docs

---

**Last Updated:** 2025-11-10
**Worker:** philosify-api
**Pages:** philosify-frontend
**Domain:** philosify.org
