# Documentation Updates Summary

## Changes Made

### 1. Environment-Based Configuration
- **Local Development**: Now uses `api/.dev.vars` for secrets (git-ignored, never uploaded)
- **Production**: Uses Cloudflare Secrets Store (configured in `wrangler.toml` under `[env.production]`)
- **Helper Function**: Created `api/src/utils/secrets.js` with `getSecret()` to handle both environments

### 2. Updated Files
- `api/wrangler.toml` - Moved all `secrets_store_secrets` bindings into `[env.production]` section
- `api/.dev.vars` - Created with placeholder values (git-ignored by Wrangler)
- `.claudeignore` - Created to prevent Claude from seeing secrets
- `api/src/utils/secrets.js` - New helper for unified secret access
- `api/src/spotify/search.js` - Updated to use `getSecret()`
- `api/src/spotify/metadata.js` - Updated to use `getSecret()`
- `deploy.sh` - Updated to use `wrangler deploy --env production`
- `deploy-api.ps1` - Updated to use `wrangler deploy --env production`
- `api/package.json` - Already had `deploy:prod` script

---

## Documentation Files That Need Updates

### CLAUDE.md

#### Section: "Secrets Management" (lines ~125-155)

**Add** comprehensive documentation about environment-based configuration:

```markdown
### Secrets Management

**IMPORTANT:** Philosify uses **environment-based configuration**:
- **Local Development**: Uses `api/.dev.vars` (git-ignored)
- **Production**: Uses Cloudflare Secrets Store

#### Local Development Setup

1. Create `api/.dev.vars` file (automatically git-ignored by Wrangler):
```bash
# api/.dev.vars (add your actual values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GROK_API_KEY=your-grok-key
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID_10=price_your-10-credits-id
STRIPE_PRICE_ID_20=price_your-20-credits-id
STRIPE_PRICE_ID_50=price_your-50-credits-id
GENIUS_ACCESS_TOKEN=your-genius-token
ADMIN_SECRET=your-admin-secret
```

2. Run local dev server:
```bash
cd api
npm run dev
# or: wrangler dev
```

**IMPORTANT:** The `.dev.vars` file is:
- Automatically excluded from git (Wrangler built-in)
- Never uploaded to Cloudflare (local only)
- Excluded from Claude Code via `.claudeignore`

#### Production Configuration

All secrets managed via Cloudflare Dashboard:
1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages > Account Settings > Secrets Store
3. Add/edit secrets in Store (ID: `aa556a30980842c785cb0e1cbb0bb933`)

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
ALLOWED_ORIGINS = "https://philosify.org ... http://localhost:3000"

# Production environment (uses Secrets Store)
[env.production]
[env.production.vars]
ALLOWED_ORIGINS = "https://philosify.org https://www.philosify.org"

[[env.production.secrets_store_secrets]]
binding = "OPENAI_API_KEY"
store_id = "aa556a30980842c785cb0e1cbb0bb933"
secret_name = "OPENAI_API_KEY"
# ... all other secrets
```
```

#### Section: "Development Commands" (lines ~65-100)

**Update deployment commands:**

```bash
# Development (local server on http://localhost:8787)
# Uses .dev.vars for secrets
npm run dev
# or
wrangler dev

# Deploy to production (uses Secrets Store)
npm run deploy:prod
# or
wrangler deploy --env production

# View live logs
npm run tail
# or
wrangler tail --env production
```

#### Section: "Deploying Full Stack" (lines ~358-370)

**Update to:**

```markdown
### Deploying Full Stack

**Deployment:**
- Worker: `philosify-api` (URL shown after deployment)
- Frontend: `https://philosify.org` (Cloudflare Pages: `philosify-frontend`)

**Manual Deployment Steps:**
1. Deploy backend: `cd api && npm run deploy:prod` (or `wrangler deploy --env production`)
2. Deploy frontend: `cd site && wrangler pages deploy . --project-name=philosify-frontend`
3. Upload guides (if updated): `cd api/guides && ./deploy_all_guides.sh` (Linux/Mac) or `deploy_all_guides.ps1` (Windows)
4. Execute SQL (first time): Run `supabase_schema.sql` in Supabase dashboard
5. Configure secrets (first time): Add all 16 secrets to Secrets Store via Cloudflare dashboard
6. Set up .dev.vars (local dev): Copy placeholders from `api/.dev.vars` and add your actual values
```

#### Section: "Security" (lines ~392-398)

**Update to:**

```markdown
### Security

- **CRITICAL:** `api/.dev.vars` contains real API keys - git-ignored and Claude-ignored
- Secrets Store for production (not `wrangler.toml` vars)
- Never commit `.env`, `.dev.vars`, or any secret files
- Validate Stripe webhook signatures (HMAC verification in place)
- JWT tokens from Supabase Auth only - parse but don't verify (Supabase does this)
- Rate limit all endpoints by user ID + IP
```

#### New Section: Add after "Multilingual Support"

```markdown
### 9. Environment Management

**Local Development:**
- Run: `wrangler dev` (automatically loads `api/.dev.vars`)
- Secrets: Stored in `api/.dev.vars` (plain key=value pairs)
- Frontend: Configure `site/.env.local` to point to `http://localhost:8787`

**Production:**
- Deploy: `wrangler deploy --env production`
- Secrets: Managed in Cloudflare Secrets Store (async `.get()` API)
- Frontend: Points to production API URL

**Key Differences:**
| Aspect | Local Dev | Production |
|--------|-----------|------------|
| Secrets Source | `.dev.vars` | Secrets Store |
| Access Method | Direct string | `await secret.get()` |
| Command | `wrangler dev` | `wrangler deploy --env production` |
| CORS Origins | Includes localhost | Production domains only |
```

---

### QUICK_START.md

#### Lines 127-146: "STEP 6: Deploy Backend"

**Replace:**
```bash
cd api
wrangler deploy
```

**With:**
```bash
cd api
npm run deploy:prod
# or
wrangler deploy --env production
```

#### Lines 286-291: "Update Backend Code"

**Replace:**
```bash
cd api
# Make changes to index.js
wrangler deploy
```

**With:**
```bash
cd api
# Make changes to index.js
npm run deploy:prod
# or
wrangler deploy --env production
```

#### Lines 308-319: "Add New Secret"

**Update step 4:**
```bash
4. Update wrangler.toml with new binding in [env.production] section:
   [[env.production.secrets_store_secrets]]
   binding = "NEW_SECRET_NAME"
   store_id = "aa556a30980842c785cb0e1cbb0bb933"
   secret_name = "NEW_SECRET_NAME"
5. Update code to access: await getSecret(env.NEW_SECRET_NAME)
6. Redeploy: npm run deploy:prod
```

#### Add new section before "DEPLOYMENT STEPS"

```markdown
## 📋 ENVIRONMENTS

### Local Development
- Run: `wrangler dev` from `api/` directory
- Secrets: Create `api/.dev.vars` with your credentials
- Frontend: Set `VITE_API_URL=http://localhost:8787` in `site/.env.local`
- Access: http://localhost:8787

### Production
- Deploy: `npm run deploy:prod` or `wrangler deploy --env production`
- Secrets: Configured in Cloudflare Secrets Store
- Frontend: Deployed to Cloudflare Pages (philosify.org)
- Access: https://philosify.org

---
```

---

## Key Points for Documentation

1. **Always use `getSecret()` helper** when accessing secrets in code
2. **Local dev uses `.dev.vars`** - never commit this file
3. **Production uses Secrets Store** - configured via Cloudflare Dashboard
4. **Deploy to production with** `--env production` flag
5. **Frontend .env.local** should point to `http://localhost:8787` for local dev
6. **.claudeignore** prevents AI from seeing secrets during development

---

## Files Already Updated

✅ `api/wrangler.toml` - Environment-based configuration
✅ `api/.dev.vars` - Local development secrets (git-ignored)
✅ `.claudeignore` - Prevents Claude from seeing secrets
✅ `api/src/utils/secrets.js` - Universal secret accessor
✅ `api/src/spotify/search.js` - Uses getSecret()
✅ `api/src/spotify/metadata.js` - Uses getSecret()
✅ `api/src/utils/cors.js` - Uses env.ALLOWED_ORIGINS properly
✅ `api/src/utils/response.js` - Passes env to getCorsHeaders()
✅ `api/index.js` - Passes env throughout, uses getSecret() in /api/config
✅ `deploy.sh` - Uses `wrangler deploy --env production`
✅ `deploy-api.ps1` - Uses `wrangler deploy --env production`
✅ `api/package.json` - Has `deploy:prod` script

## Files Needing Updates

⏳ `CLAUDE.md` - Add comprehensive environment documentation
⏳ `QUICK_START.md` - Update deployment commands
⏳ `api/docs/README.md` - May need deployment command updates (check if it has any)

