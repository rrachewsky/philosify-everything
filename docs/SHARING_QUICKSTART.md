# WhatsApp Sharing System - Quick Start Guide

## TL;DR - 3 Steps to Deploy

### 1. Deploy Database (2 minutes)

```bash
# In Supabase Dashboard (https://supabase.com/dashboard)
# SQL Editor > New Query > Copy/paste contents of supabase_share_schema.sql > Run
```

### 2. Deploy Backend (1 minute)

```bash
cd api
wrangler deploy --env production
```

### 3. Deploy Frontend (1 minute)

```bash
cd site
npm run build
wrangler pages deploy dist --project-name=philosify-frontend
```

**Done!** Share buttons now appear on all analysis results.

---

## How It Works

### User Flow

1. **User A** analyzes a song → clicks "Share on WhatsApp" button
2. WhatsApp opens with pre-filled message and link: `https://philosify.org/a/x4H7Qk2P`
3. **User B** clicks link → sees signup prompt
4. User B signs up → gets **4 credits** (2 free + 2 referral bonus)
5. **User A** gets **2 credits** (referral reward)
6. Both can now share and earn more credits!

### Technical Flow

```
[ShareButton] → POST /api/share → [DB: share_tokens]
    ↓
[WhatsApp] → sends link → User clicks
    ↓
[/a/:slug] → GET /api/shared/:slug → [Shows SharedAnalysis page]
    ↓
[User signs up] → POST /api/track-referral → [Grants credits to both users]
```

---

## Files Created (7 new)

**Backend:**
- `supabase_share_schema.sql` - Database schema
- `api/src/sharing/index.js` - Share handler

**Frontend:**
- `site/src/components/sharing/ShareButton.jsx` - Share button
- `site/src/components/sharing/index.js` - Export
- `site/src/pages/SharedAnalysis.jsx` - Share page

**Docs:**
- `SHARING_INTEGRATION.md` - Full documentation
- `SHARING_FILES_CHECKLIST.md` - File list

## Files Modified (20 files)

**Backend:**
- `api/index.js` - Added 3 API routes

**Frontend:**
- `site/src/Router.jsx` - Added `/a/:slug` route
- `site/src/components/index.js` - Export sharing components
- `site/src/components/results/ResultsContainer.jsx` - Added ShareButton
- `site/src/i18n/translations/*.json` (12 files) - Added share translations

---

## API Endpoints

### POST /api/share (authenticated)
```bash
curl -X POST https://YOUR-WORKER-URL/api/share \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"analysisId":"YOUR_ANALYSIS_UUID"}'

# Response: {"success":true,"slug":"x4H7Qk2P","url":"https://philosify.org/a/x4H7Qk2P"}
```

### GET /api/shared/:slug (public)
```bash
curl https://YOUR-WORKER-URL/api/shared/x4H7Qk2P

# Response: {"success":true,"analysis":{...full analysis object...}}
```

### POST /api/track-referral (authenticated)
```bash
curl -X POST https://YOUR-WORKER-URL/api/track-referral \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"slug":"x4H7Qk2P"}'

# Response: {"success":true,"alreadyReferred":false,"referrerUserId":"uuid"}
```

---

## Database Tables

### share_tokens
```sql
slug VARCHAR(10) UNIQUE NOT NULL  -- Random 8-char ID (e.g., "x4H7Qk2P")
analysis_id UUID NOT NULL         -- Links to song_analyses.id
created_by_user_id UUID NOT NULL  -- User who created share
views_count INTEGER DEFAULT 0     -- Number of views
max_views INTEGER DEFAULT NULL    -- Optional limit (NULL = unlimited)
expires_at TIMESTAMP DEFAULT NULL -- Optional expiration (NULL = never)
created_at TIMESTAMP DEFAULT NOW()
```

### referrals
```sql
referrer_user_id UUID NOT NULL     -- User who shared (gets 2 credits)
referred_user_id UUID NOT NULL     -- New user (gets 2 credits + 2 free)
share_token_slug VARCHAR(10) NOT NULL
bonus_credits_granted INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
UNIQUE(referred_user_id, share_token_slug)  -- Can't refer same user twice via same link
```

---

## Testing Checklist

### Local Testing

```bash
# Terminal 1: Start backend
cd api
npm run dev  # Runs on http://localhost:8787

# Terminal 2: Start frontend
cd site
npm run dev  # Runs on http://localhost:3000

# Test flow:
# 1. Analyze a song
# 2. Click share button
# 3. Copy share URL
# 4. Open in incognito
# 5. Sign up
# 6. Check credits (should be 4)
```

### Production Testing

```bash
# 1. Create share
curl -X POST https://philosify-api.YOUR-SUBDOMAIN.workers.dev/api/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"analysisId":"YOUR_ANALYSIS_ID"}'

# 2. Get shared analysis
curl https://philosify-api.YOUR-SUBDOMAIN.workers.dev/api/shared/x4H7Qk2P

# 3. Check database
# In Supabase SQL Editor:
SELECT * FROM share_tokens ORDER BY created_at DESC LIMIT 5;
SELECT * FROM referrals ORDER BY created_at DESC LIMIT 5;
```

---

## Monitoring

### View Recent Shares

```sql
SELECT
  st.slug,
  st.views_count,
  sa.song || ' - ' || sa.artist AS analysis,
  u.email AS shared_by,
  st.created_at
FROM share_tokens st
JOIN song_analyses sa ON st.analysis_id = sa.id
JOIN auth.users u ON st.created_by_user_id = u.id
ORDER BY st.created_at DESC
LIMIT 10;
```

### View Recent Referrals

```sql
SELECT
  referrals.id,
  ref_user.email AS referrer,
  new_user.email AS new_user,
  referrals.bonus_credits_granted,
  referrals.created_at
FROM referrals
JOIN auth.users ref_user ON referrals.referrer_user_id = ref_user.id
JOIN auth.users new_user ON referrals.referred_user_id = new_user.id
ORDER BY referrals.created_at DESC
LIMIT 10;
```

### View Cloudflare Logs

```bash
# Live tail
wrangler tail

# Filter sharing events only
wrangler tail | grep -E '\[Share\]|\[Sharing\]'

# Check specific slug
wrangler tail | grep "x4H7Qk2P"
```

---

## Troubleshooting

### Share button doesn't appear
**Fix:** Check that `result.id` exists in ResultsContainer

### WhatsApp doesn't open
**Fix:**
1. Check browser console for errors
2. Test manually: `https://wa.me/?text=Test%20https://philosify.org/a/test`
3. Disable popup blocker

### Share link shows "not found"
**Fix:**
```sql
-- Check if share exists
SELECT * FROM share_tokens WHERE slug = 'x4H7Qk2P';

-- Check if analysis exists
SELECT * FROM song_analyses WHERE id = (SELECT analysis_id FROM share_tokens WHERE slug = 'x4H7Qk2P');
```

### Credits not granted after signup
**Fix:**
```sql
-- Check referral was tracked
SELECT * FROM referrals WHERE referred_user_id = 'YOUR_USER_ID';

-- Check credit transactions
SELECT * FROM credit_transactions
WHERE user_id = 'YOUR_USER_ID'
AND type IN ('referral_bonus', 'signup_bonus_referral');
```

### Translation missing
**Fix:** Check that `site/src/i18n/translations/{lang}.json` has `share` section with all keys

---

## Credit Mechanics

| Event | User A (Referrer) | User B (New User) |
|-------|-------------------|-------------------|
| **Before** | 10 credits | No account |
| **User A shares** | 10 credits | - |
| **User B signs up from share** | +2 credits = **12 credits** | 2 free + 2 bonus = **4 credits** |
| **User B shares** | 12 credits | 4 credits |
| **User C signs up from B's share** | 12 credits | +2 credits = **6 credits** |

**Key Points:**
- Referrer gets 2 credits (added to `purchased_credits`)
- New user gets 4 credits total (2 `free_credits_remaining` + 2 `purchased_credits`)
- Both can immediately share and earn more
- Referrals are idempotent (can't grant credits twice for same user+slug)

---

## Key Features

✅ **Viral Growth** - Share → Earn → Repeat
✅ **Unique Short URLs** - 8-char slugs (218T combinations)
✅ **Authentication Wall** - Must sign up to view
✅ **Automatic Tracking** - Credits granted on signup
✅ **Multilingual** - 12 languages supported
✅ **View Tracking** - Count views (extensible to limits)
✅ **Security** - Rate limited, authenticated, validated
✅ **Analytics** - Full referral tracking in database

---

## What's Next?

Current implementation is production-ready. Future enhancements could include:

- **View limits** - Enforce `max_views` (schema ready)
- **Expiration** - Enforce `expires_at` with auto-cleanup
- **More platforms** - Twitter, Facebook, LinkedIn sharing
- **Custom messages** - User-customizable share text
- **Analytics dashboard** - User-facing share stats
- **Email sharing** - Generate shareable emails
- **QR codes** - Offline sharing via QR codes
- **Tiered rewards** - Higher bonuses for power referrers

---

## Support

**Documentation:**
- `SHARING_INTEGRATION.md` - Complete integration guide
- `SHARING_FILES_CHECKLIST.md` - File list and rollback instructions

**Logs:**
```bash
wrangler tail  # Live backend logs
```

**Database:**
```sql
-- Check tables exist
SELECT tablename FROM pg_tables WHERE tablename IN ('share_tokens', 'referrals');

-- View recent activity
SELECT COUNT(*) FROM share_tokens;  -- Total shares created
SELECT COUNT(*) FROM referrals;     -- Total successful referrals
```

**Contact:**
bob@philosify.org

---

## Summary

**Time to deploy:** ~5 minutes
**Files added:** 7 new, 20 modified
**API endpoints:** 3 new routes
**Database tables:** 2 new tables, 3 new functions
**Languages supported:** 12
**Credits per referral:** 2 (both users)

**Share URL format:** `https://philosify.org/a/{8-char-slug}`

**That's it!** The system is fully functional and ready to drive viral growth through WhatsApp sharing. 🚀
