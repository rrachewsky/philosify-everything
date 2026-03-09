# WhatsApp Sharing System - Integration Guide

Complete implementation of the WhatsApp sharing system with authentication wall and referral tracking for Philosify.

## Overview

The sharing system allows users to:
- Share philosophical analyses via WhatsApp
- Earn 2 bonus credits when someone signs up from their share link
- New users get 2 free credits + 2 bonus credits (4 total) when signing up via referral
- Track views and shares (extensible to limits and expiration)

## Architecture

### Backend Components

#### 1. Database Schema (`supabase_share_schema.sql`)

**Tables:**

- `share_tokens` - Stores share links with unique slugs
  - `slug` (VARCHAR(10)) - Unique 8-character alphanumeric identifier
  - `analysis_id` (UUID) - References `song_analyses.id`
  - `created_by_user_id` (UUID) - User who created the share
  - `views_count` (INTEGER) - Number of times accessed
  - `max_views` (INTEGER) - Optional view limit (NULL = unlimited)
  - `expires_at` (TIMESTAMP) - Optional expiration (NULL = never expires)

- `referrals` - Tracks successful referrals
  - `referrer_user_id` (UUID) - User who shared
  - `referred_user_id` (UUID) - New user who signed up
  - `share_token_slug` (VARCHAR(10)) - Which share link was used
  - `bonus_credits_granted` (INTEGER) - Credits granted (default: 2)

**Functions:**

- `create_share_token(p_analysis_id, p_user_id, p_slug)` - Creates new share token
- `get_shared_analysis(p_slug, p_viewer_user_id)` - Retrieves analysis and increments view count
- `track_referral(p_slug, p_new_user_id, p_bonus_credits)` - Grants credits to both users

**To Deploy:**
```bash
# In Supabase SQL Editor, run:
cat supabase_share_schema.sql
```

#### 2. Share Handler (`api/src/sharing/index.js`)

**Functions:**

- `generateSlug(length)` - Generates random alphanumeric slug
  - 8 characters from [a-z, A-Z, 0-9] = 218 trillion combinations
  - Collision probability is negligible
  - Retries up to 5 times if collision occurs

- `createShareToken(env, analysisId, userId)` - Creates share token
  - Returns: `{ success, slug, url, error }`
  - Full URL format: `https://philosify.org/a/{slug}`

- `getSharedAnalysis(env, slug, viewerUserId)` - Fetches shared analysis
  - Increments view count automatically
  - Returns: `{ success, analysis, expired, maxViewsReached, error }`

- `trackReferral(env, slug, newUserId, bonusCredits)` - Tracks referral
  - Grants 2 credits to referrer (existing user)
  - Grants 2 credits to referee (new user) in addition to 2 free signup credits
  - Returns: `{ success, referrerUserId, alreadyReferred, error }`

#### 3. API Routes (added to `api/index.js`)

**POST `/api/share`** (authenticated)
- Request: `{ analysisId: "uuid" }`
- Response: `{ success: true, slug: "x4H7Qk2P", url: "https://philosify.org/a/x4H7Qk2P" }`

**GET `/api/shared/:slug`** (public)
- Response: `{ success: true, analysis: {...} }`
- Error states: `{ error: "...", expired: true/false, maxViewsReached: true/false }`

**POST `/api/track-referral`** (authenticated)
- Request: `{ slug: "x4H7Qk2P" }`
- Response: `{ success: true, alreadyReferred: false, referrerUserId: "uuid" }`
- Called automatically after new user signs up from share link

### Frontend Components

#### 1. ShareButton Component (`site/src/components/sharing/ShareButton.jsx`)

**Props:**
- `analysisId` (string, required) - UUID of the analysis to share
- `songName` (string, required) - Song name for share text
- `artist` (string, required) - Artist name for share text

**Features:**
- Creates share token via API
- Opens WhatsApp with pre-filled message
- WhatsApp message format: "Check out this philosophical analysis of {song} by {artist} on Philosify! https://philosify.org/a/{slug}"
- Displays success/error toasts
- Disabled state while loading

**Usage in ResultsContainer:**
```jsx
import { ShareButton } from '../sharing/ShareButton';

<ShareButton
  analysisId={result.id}
  songName={result.song || result.title}
  artist={result.artist}
/>
```

#### 2. SharedAnalysis Page (`site/src/pages/SharedAnalysis.jsx`)

**Route:** `/a/:slug`

**Flow:**
1. Fetches analysis from `/api/shared/:slug`
2. If not authenticated:
   - Shows signup/login prompt
   - Stores slug in `localStorage.pendingReferralSlug`
   - Stores redirect URL in `localStorage.redirectAfterLogin`
3. If authenticated:
   - Displays full analysis
   - Tracks referral if user just signed up from this link
   - Shows ShareButton to create own shares

**Referral Tracking:**
- On mount, checks for `pendingReferralSlug` in localStorage
- If found and user is authenticated, calls `/api/track-referral`
- Grants credits automatically (2 to referrer, 2 to new user)
- Clears pending referral from localStorage

#### 3. Routing (`site/src/Router.jsx`)

Updated to include:
```jsx
<Route path="/a/:slug" element={<SharedAnalysis />} />
```

### Internationalization

**Languages Supported:** 12 languages (en, pt, es, fr, de, it, ru, hu, he, zh, ja, ko)

**Translation Keys (all under `share.*`):**
- `shareWhatsApp` - "Share on WhatsApp"
- `shareLoading` - "Creating share link..."
- `shareSuccess` - "Share link created! Opening WhatsApp..."
- `shareWhatsAppText` - Message template with `{{song}}` and `{{artist}}` placeholders
- `shareErrorNoAnalysis` - "No analysis to share"
- `shareErrorNotAuthenticated` - "Please sign in to share"
- `shareErrorGeneric` - "Failed to create share link"
- `shareErrorInvalidLink` - "Invalid share link"
- `shareErrorNotFound` - "Share link not found"
- `shareErrorExpired` - "This share link has expired"
- `shareErrorMaxViews` - "This share link has reached maximum views"
- `shareAuthRequired` - "Sign up to view this analysis"
- `shareAuthMessage` - Explanation of benefits (4 credits for signup via referral)
- `shareAuthBenefit` - "Sign up now and get 4 total credits: 2 free + 2 referral bonus"
- `shareViewingShared` - "You're viewing a shared analysis"
- `backToHome` - "Back to Home"

**Updated Files:**
- All translation files in `site/src/i18n/translations/*.json`

## Deployment Instructions

### 1. Deploy Database Schema

```bash
# In Supabase SQL Editor (https://supabase.com/dashboard)
# 1. Open your project
# 2. Go to SQL Editor > New Query
# 3. Copy contents of supabase_share_schema.sql
# 4. Click Run
```

**Verify:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('share_tokens', 'referrals');
```

### 2. Deploy Backend

```bash
cd api

# Test locally (optional)
npm run dev
# Test share creation: POST http://localhost:8787/api/share
# Test share retrieval: GET http://localhost:8787/api/shared/x4H7Qk2P

# Deploy to production
npm run deploy
# or: wrangler deploy --env production
```

**Verify API:**
```bash
# Health check
curl https://YOUR-WORKER-URL/api/health

# Test share endpoint (requires auth token)
curl -X POST https://YOUR-WORKER-URL/api/share \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"analysisId":"YOUR_ANALYSIS_UUID"}'

# Test public share retrieval
curl https://YOUR-WORKER-URL/api/shared/x4H7Qk2P
```

### 3. Deploy Frontend

```bash
cd site

# Build
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=philosify-frontend

# Or deploy current directory if not using Vite build
wrangler pages deploy . --project-name=philosify-frontend
```

**Verify Routes:**
- Visit `https://philosify.org/` - Main app should load
- Visit `https://philosify.org/a/test` - SharedAnalysis page should load (will show "not found" for invalid slug)

### 4. Test Complete Flow

**A. Create Share (as authenticated user):**
1. Analyze a song (must be authenticated)
2. Click "Share on WhatsApp" button in results
3. WhatsApp should open with pre-filled message
4. Copy the share URL (e.g., `https://philosify.org/a/x4H7Qk2P`)

**B. View Share (as new user):**
1. Open share URL in incognito window
2. Should see signup prompt
3. Click "Sign Up"
4. Complete signup
5. Should redirect back to shared analysis
6. Should see full analysis
7. Check balance - should have 4 credits (2 free + 2 referral bonus)

**C. Verify Referral Tracking:**
1. Log in as original user (who created the share)
2. Check balance - should have gained 2 credits
3. In Supabase dashboard, check `referrals` table:
   ```sql
   SELECT * FROM referrals ORDER BY created_at DESC LIMIT 1;
   ```
4. Check `credit_transactions` table:
   ```sql
   SELECT * FROM credit_transactions
   WHERE type IN ('referral_bonus', 'signup_bonus_referral')
   ORDER BY created_at DESC;
   ```

## Error Handling

### Backend Errors

**Share Creation:**
- Missing `analysisId` → 400 Bad Request
- Analysis not found → Handled by DB function
- Slug collision → Automatic retry (up to 5 attempts)
- Unauthenticated → 401 Unauthorized

**Share Retrieval:**
- Invalid slug → 404 Not Found
- Expired link → 404 with `expired: true`
- Max views reached → 404 with `maxViewsReached: true`

**Referral Tracking:**
- Share link not found → Error message
- User trying to refer themselves → Error message
- Already referred → Success with `alreadyReferred: true` (idempotent)

### Frontend Errors

**ShareButton:**
- No analysis ID → Toast error
- Not authenticated → Toast error, prompt login
- Network error → Toast error with retry option

**SharedAnalysis:**
- Invalid slug → Error page with "Back to Home" button
- Expired link → Error page with expiration message
- Not authenticated → Signup/login prompt (not an error, by design)

## Security Considerations

### Backend

1. **Authentication:** Share creation requires valid JWT token
2. **Authorization:** Users can only create shares for analyses they've performed
3. **Rate Limiting:** All endpoints use existing rate limiting (60 req/min per user/IP)
4. **Input Validation:** Slug format validated, analysis ID checked against DB
5. **Idempotency:** Referral tracking is idempotent (won't grant credits twice)

### Frontend

1. **Token Storage:** JWT token stored in localStorage (existing pattern)
2. **XSS Protection:** All user input sanitized via React
3. **CSRF Protection:** Not applicable (API uses JWT, not cookies)

### Database

1. **Row Level Security:** Enabled on all tables
2. **Foreign Keys:** Cascade delete prevents orphaned records
3. **Unique Constraints:** Prevent duplicate slugs and referrals
4. **Check Constraints:** Ensure non-negative credit balances

## Monitoring & Analytics

### Metrics to Track

**Share Tokens:**
```sql
-- Total shares created
SELECT COUNT(*) FROM share_tokens;

-- Shares by user
SELECT created_by_user_id, COUNT(*) as share_count
FROM share_tokens
GROUP BY created_by_user_id
ORDER BY share_count DESC
LIMIT 10;

-- Most viewed shares
SELECT slug, views_count, created_at
FROM share_tokens
ORDER BY views_count DESC
LIMIT 10;
```

**Referrals:**
```sql
-- Total successful referrals
SELECT COUNT(*) FROM referrals;

-- Top referrers
SELECT referrer_user_id, COUNT(*) as referral_count,
       SUM(bonus_credits_granted) as total_credits_earned
FROM referrals
GROUP BY referrer_user_id
ORDER BY referral_count DESC
LIMIT 10;

-- Referrals over time
SELECT DATE(created_at) as date, COUNT(*) as referrals
FROM referrals
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Credit Impact:**
```sql
-- Total credits distributed via referrals
SELECT SUM(amount) as total_referral_credits
FROM credit_transactions
WHERE type IN ('referral_bonus', 'signup_bonus_referral');
```

### Logs to Monitor

**Backend (Cloudflare Worker):**
```bash
# Live logs
wrangler tail

# Filter for sharing events
wrangler tail | grep -E '\[Share\]|\[Sharing\]'
```

**Key log messages:**
- `[Sharing] Created share token: {slug} for analysis {analysisId}`
- `[Sharing] Retrieved shared analysis for slug: {slug}`
- `[Sharing] Referral tracked: {referrerId} -> {newUserId} ({credits} credits each)`
- `[Sharing] Slug collision on attempt {n}, retrying...`

## Troubleshooting

### Share Link Not Working

**Symptom:** Clicking share link shows "not found"

**Debug:**
1. Check share token exists:
   ```sql
   SELECT * FROM share_tokens WHERE slug = 'x4H7Qk2P';
   ```
2. Check analysis still exists:
   ```sql
   SELECT * FROM song_analyses WHERE id = '{analysis_id}';
   ```
3. Check API logs for errors:
   ```bash
   wrangler tail | grep "x4H7Qk2P"
   ```

### Referral Credits Not Granted

**Symptom:** User signed up from share link but didn't receive bonus credits

**Debug:**
1. Check if referral was tracked:
   ```sql
   SELECT * FROM referrals WHERE referred_user_id = '{user_id}';
   ```
2. Check credit transactions:
   ```sql
   SELECT * FROM credit_transactions
   WHERE user_id = '{user_id}' AND type = 'signup_bonus_referral';
   ```
3. Check if `pendingReferralSlug` was cleared from localStorage:
   ```javascript
   localStorage.getItem('pendingReferralSlug'); // Should be null after signup
   ```
4. Check API logs:
   ```bash
   wrangler tail | grep "track-referral"
   ```

### WhatsApp Not Opening

**Symptom:** Share button doesn't open WhatsApp

**Debug:**
1. Check browser console for errors
2. Verify WhatsApp is installed on device/desktop
3. Test URL manually:
   ```
   https://wa.me/?text=Test%20message%20https://philosify.org/a/test
   ```
4. Check if popup blocker is preventing window.open

## Future Enhancements

### Implemented (Current Version)

✅ Unique short slug generation
✅ WhatsApp sharing integration
✅ Authentication wall for viewing
✅ Referral tracking
✅ Credit bonuses (2 credits each)
✅ View count tracking
✅ Multilingual support (12 languages)
✅ Share button in results
✅ Public share page

### Planned (Future Versions)

- [ ] **View Limits:** Implement `max_views` enforcement
- [ ] **Expiration:** Implement `expires_at` enforcement with auto-cleanup
- [ ] **Social Media:** Expand to Twitter, Facebook, LinkedIn
- [ ] **Custom Share Messages:** Allow users to customize share text
- [ ] **Share Analytics Dashboard:** User-facing stats for their shares
- [ ] **Email Sharing:** Generate shareable email with analysis summary
- [ ] **QR Codes:** Generate QR codes for offline sharing
- [ ] **Share Permissions:** Private vs public shares
- [ ] **Tiered Rewards:** Higher bonuses for power referrers
- [ ] **Share Leaderboard:** Gamification for top sharers

## API Reference

### Create Share Token

**Endpoint:** `POST /api/share`
**Auth:** Required (JWT token)

**Request:**
```json
{
  "analysisId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (Success):**
```json
{
  "success": true,
  "slug": "x4H7Qk2P",
  "url": "https://philosify.org/a/x4H7Qk2P"
}
```

**Response (Error):**
```json
{
  "error": "Missing analysisId"
}
```

### Get Shared Analysis

**Endpoint:** `GET /api/shared/:slug`
**Auth:** Optional (public endpoint)

**Response (Success):**
```json
{
  "success": true,
  "analysis": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "song": "Imagine",
    "artist": "John Lennon",
    "ethics_score": -8,
    "metaphysics_score": -7,
    "epistemology_score": -6,
    "politics_score": -9,
    "aesthetics_score": 4,
    "final_score": -6.5,
    "classification": "Doctrinaire Conformist",
    "integrated_analysis": "...",
    "spotify_id": "7pKfPomDEeI4TPT6EOYjn9"
  }
}
```

**Response (Expired):**
```json
{
  "error": "This share link has expired",
  "expired": true,
  "maxViewsReached": false
}
```

**Response (Max Views):**
```json
{
  "error": "This share link has reached maximum views",
  "expired": false,
  "maxViewsReached": true
}
```

### Track Referral

**Endpoint:** `POST /api/track-referral`
**Auth:** Required (JWT token)

**Request:**
```json
{
  "slug": "x4H7Qk2P"
}
```

**Response (Success - New Referral):**
```json
{
  "success": true,
  "alreadyReferred": false,
  "referrerUserId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (Success - Already Referred):**
```json
{
  "success": true,
  "alreadyReferred": true,
  "referrerUserId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (Error):**
```json
{
  "error": "Cannot refer yourself"
}
```

## Credits Flow

### Scenario 1: Existing User Shares Analysis

1. User A analyzes "Imagine" by John Lennon
2. User A clicks "Share on WhatsApp"
3. Share link created: `https://philosify.org/a/x4H7Qk2P`
4. User A sends link to User B via WhatsApp
5. **User A:** No change yet

### Scenario 2: New User Signs Up from Share

1. User B (not registered) clicks link from User A
2. User B sees SharedAnalysis page with signup prompt
3. User B clicks "Sign Up"
4. After signup, User B has:
   - 2 free credits (standard signup bonus)
   - 2 bonus credits (referral bonus)
   - **Total: 4 credits**
5. User A (referrer) gets:
   - 2 bonus credits (added to purchased credits)
6. Referral record created linking User A → User B → slug

### Scenario 3: Existing User Views Share

1. User C (already registered) clicks link from User A
2. User C sees full analysis immediately
3. No credits granted (already has account)
4. View count incremented

## Component Integration Examples

### Adding ShareButton to New Component

```jsx
import React from 'react';
import { ShareButton } from '../components/sharing/ShareButton';

function MyComponent({ analysis }) {
  return (
    <div>
      <h2>{analysis.song} - {analysis.artist}</h2>

      {/* Add share button */}
      <ShareButton
        analysisId={analysis.id}
        songName={analysis.song}
        artist={analysis.artist}
      />
    </div>
  );
}
```

### Custom Share Handling

```jsx
import { useState } from 'react';
import { getApiUrl } from '../config';

function CustomShareHandler({ analysisId, songName, artist }) {
  const [shareUrl, setShareUrl] = useState(null);

  const createShare = async () => {
    const token = localStorage.getItem('supabase.auth.token');

    const response = await fetch(`${getApiUrl()}/api/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ analysisId })
    });

    const data = await response.json();

    if (data.success) {
      setShareUrl(data.url);
      // Do something custom with the URL
    }
  };

  return (
    <button onClick={createShare}>
      Create Custom Share
    </button>
  );
}
```

## Conclusion

The WhatsApp sharing system is now fully integrated and ready for production use. It provides:

- ✅ **Viral Growth:** Users incentivized to share (earn credits)
- ✅ **User Acquisition:** New users incentivized to sign up (bonus credits)
- ✅ **Engagement:** Sharing increases platform usage
- ✅ **Tracking:** Full analytics on shares and referrals
- ✅ **Security:** Authenticated, rate-limited, validated
- ✅ **i18n:** Supports 12 languages out of the box
- ✅ **UX:** Seamless flow from share → view → signup → reward

For questions or issues, contact: bob@philosify.org
