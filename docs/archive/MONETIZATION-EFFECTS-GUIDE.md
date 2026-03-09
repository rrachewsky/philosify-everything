# Monetization Module - Cause & Effect Guide

## Overview
This document explains exactly what happens (effects) when you perform each action (cause) in the monetization system, including database changes, API calls, UI updates, and console logs.

---

## 1. USER SIGNUP

### ACTION: User creates new account

**What Happens:**

#### **Step 1: Frontend (site/src/components/auth/SignupModal.jsx)**
```javascript
signUp(email, password)
```
- Sends request to Supabase Auth API
- Creates user in `auth.users` table

#### **Step 2: Database (Supabase)**
**Table: `auth.users`**
```sql
INSERT INTO auth.users (id, email, encrypted_password, ...)
VALUES (uuid_generate_v4(), 'user@example.com', ..., NOW());
```

**Effects:**
- ✅ New user record created
- ✅ User ID (UUID) generated
- ✅ Email confirmation sent (if enabled)

#### **Step 3: Database Trigger (Should Happen Automatically)**
**Table: `user_credits`**
```sql
-- This should be triggered automatically on user creation
INSERT INTO user_credits (user_id, purchased_credits, free_credits_remaining)
VALUES (new_user_id, 0, 2);
```

**Effects:**
- ✅ `purchased_credits` = 0
- ✅ `free_credits_remaining` = 2
- ✅ `total_credits` = 2 (auto-calculated)
- ✅ `created_at` = NOW()

#### **Step 4: Frontend State Update**
```javascript
// useAuth hook
setUser(newUser)
setIsAuthenticated(true)
```

**Effects:**
- ✅ User object stored in state
- ✅ Login modal closes
- ✅ Header shows user info

#### **Step 5: Balance Fetch**
```javascript
// useCredits hook - useEffect triggers
fetchBalance()
```

**API Call:**
```
GET http://localhost:8787/api/balance
Authorization: Bearer <JWT_TOKEN>
```

**API Response:**
```json
{
  "userId": "uuid-here",
  "credits": 0,
  "freeRemaining": 2,
  "total": 2
}
```

**Effects:**
- ✅ Balance state updated
- ✅ Header displays: **"2 CREDITS • 2 FREE"**
- ✅ Username displayed (email prefix in UPPERCASE)

#### **Console Logs:**
```
[Supabase] User signed up: uuid-here
[Balance] Fetching for user: uuid-here
[Balance] Response status: 200
[Balance] Response data: {"userId":"...","credits":0,"freeRemaining":2,"total":2}
[Balance] Fetched: {credits: 0, free: 2, total: 2}
```

---

## 2. USER LOGIN

### ACTION: User enters email/password and clicks Login

**What Happens:**

#### **Step 1: Frontend Authentication**
```javascript
signIn(email, password)
```

**API Call to Supabase:**
```
POST https://zunugudeytbdzlidosgr.supabase.co/auth/v1/token
Body: { email, password }
```

**API Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": { "id": "uuid", "email": "..." },
  "session": { ... }
}
```

**Effects:**
- ✅ JWT token stored in localStorage
- ✅ User session created
- ✅ `isAuthenticated` = true

#### **Step 2: Balance Fetch (Automatic)**
Same as signup Step 5

#### **Step 3: UI Updates**
**Effects:**
- ✅ Login modal closes
- ✅ Header shows: `[BALANCE] [LOGOUT] USERNAME`
- ✅ Analyze button becomes active

---

## 3. SEARCH FOR SONG

### ACTION: User types in search field

**What Happens:**

#### **Step 1: Spotify Search API Call**
```javascript
// site/src/services/spotify/search.js
searchTracks(query)
```

**API Call:**
```
GET http://localhost:8787/api/spotify/search?q=Imagine
Authorization: Bearer <JWT_TOKEN>
```

**Backend (api/src/spotify/search.js):**
```javascript
// Gets Spotify token
const spotifyToken = await getSpotifyToken(env)

// Calls Spotify API
fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`)
```

**API Response:**
```json
{
  "tracks": [
    {
      "id": "spotify_track_id",
      "name": "Imagine",
      "artists": [{"name": "John Lennon"}],
      "album": {...},
      "preview_url": "https://..."
    }
  ]
}
```

#### **Step 2: Frontend State Update**
```javascript
// SearchInput component
setSearchResults(tracks)
```

**Effects:**
- ✅ Dropdown appears below search field
- ✅ Shows up to 5 song results
- ✅ Each result shows: Song - Artist

#### **Step 3: User Selects Track**
```javascript
// SearchInput component
setSelectedTrack({
  id: track.id,
  song: track.name,
  artist: track.artists[0].name
})
```

**Effects:**
- ✅ Search field shows: "Imagine - John Lennon"
- ✅ Dropdown closes
- ✅ `selectedTrack` state populated

**Console Logs:**
```
[Spotify] Searching for: Imagine
[Spotify] Found 5 tracks
[SearchInput] Track selected: Imagine - John Lennon
```

---

## 4. CLICK ANALYZE BUTTON

### ACTION: User clicks "Analyze" with 2 free credits

**What Happens:**

#### **Step 1: Frontend Validation (App.jsx)**
```javascript
handleAnalyze()
```

**Check 1: Authentication**
```javascript
if (!isAuthenticated) {
  loginModal.open()
  return
}
```
**Effect if not logged in:**
- ❌ Analysis blocked
- ✅ Login modal opens

**Check 2: Credits**
```javascript
if (balance !== null && balance.total <= 0) {
  paymentModal.open()
  return
}
```
**Effect if balance = 0:**
- ❌ Analysis blocked
- ✅ Payment modal opens

**Check 3: Track Selected**
```javascript
if (!selectedTrack) {
  console.log('[App] No track selected')
  return
}
```
**Effect if no track:**
- ❌ Analysis blocked (silent)

#### **Step 2: Analysis API Call**
```javascript
// useAnalysis hook
analyze({ song, artist, model, spotify_id })
```

**API Call:**
```
POST http://localhost:8787/api/analyze
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Body:
{
  "song": "Imagine",
  "artist": "John Lennon",
  "model": "gpt4",
  "lang": "en",
  "spotify_id": "..."
}
```

#### **Step 3: Backend Credit Consumption (api/src/credits/consume.js)**

**Database Call - RPC Function:**
```sql
SELECT consume_credit(
  p_user_id := 'user-uuid',
  p_song := 'Imagine - John Lennon',
  p_model := 'gpt4'
);
```

**Inside RPC Function (supabase_credits_schema_fixed.sql):**

**A. Lock User Record (Prevents Race Condition)**
```sql
SELECT purchased_credits, free_credits_remaining, total_credits
FROM user_credits
WHERE user_id = 'user-uuid'
FOR UPDATE;  -- 🔒 LOCKS this row until transaction completes
```

**B. Check Balance**
```sql
IF v_total = 0 THEN
  RETURN (FALSE, 0, FALSE, 'Insufficient credits');
END IF;
```

**C. Consume Credit (Free First)**
```sql
-- User has 2 free credits
IF v_free > 0 THEN
  UPDATE user_credits
  SET free_credits_remaining = free_credits_remaining - 1,
      updated_at = NOW()
  WHERE user_id = 'user-uuid';
  -- Result: free_credits_remaining = 1
END IF;
```

**Database Changes:**
```
BEFORE:
purchased_credits: 0
free_credits_remaining: 2
total_credits: 2

AFTER:
purchased_credits: 0
free_credits_remaining: 1  ← DECREASED BY 1
total_credits: 1            ← AUTO-CALCULATED
updated_at: 2025-01-14 10:30:00
```

**D. Log Transaction**
```sql
INSERT INTO credit_transactions (
  user_id, type, amount,
  purchased_before, purchased_after,
  free_before, free_after,
  total_before, total_after,
  song_analyzed, model_used
) VALUES (
  'user-uuid', 'usage', -1,
  0, 0,        -- purchased unchanged
  2, 1,        -- free: 2 → 1
  2, 1,        -- total: 2 → 1
  'Imagine - John Lennon', 'gpt4'
);
```

**E. Return Success**
```json
{
  "success": true,
  "new_total": 1,
  "used_free": true,
  "error_message": null
}
```

#### **Step 4: Backend AI Analysis**

**Check Cache First:**
```sql
SELECT * FROM song_analyses
WHERE song_name = 'Imagine'
  AND artist = 'John Lennon'
  AND generated_by = 'gpt4';
```

**If Cache Miss → Call OpenAI:**
```javascript
// api/src/ai/openai.js
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: PHILOSOPHICAL_GUIDE },
      { role: 'user', content: 'Analyze: Imagine by John Lennon' }
    ]
  })
})
```

**OpenAI Response (simplified):**
```json
{
  "choices": [{
    "message": {
      "content": "## Philosophical Analysis\n\nETHICS: -8\nMETAPHYSICS: -6\n..."
    }
  }]
}
```

**Parse Scores:**
```javascript
const scores = {
  ethics: -8,
  metaphysics: -6,
  epistemology: -5,
  politics: -9,
  aesthetics: 3
}
```

**Save to Database:**
```sql
INSERT INTO song_analyses (
  song_name, artist, generated_by,
  ethics_score, metaphysics_score, epistemology_score,
  politics_score, aesthetics_score,
  full_analysis_text, spotify_id
) VALUES (
  'Imagine', 'John Lennon', 'gpt4',
  -8, -6, -5, -9, 3,
  'Full analysis text...', 'spotify_id'
);
```

#### **Step 5: Backend Response**
```json
{
  "song": "Imagine",
  "artist": "John Lennon",
  "model": "gpt4",
  "scores": {
    "ethics": -8,
    "metaphysics": -6,
    "epistemology": -5,
    "politics": -9,
    "aesthetics": 3
  },
  "analysis": "Full philosophical analysis text...",
  "cached": false,
  "spotify_id": "..."
}
```

#### **Step 6: Frontend Updates**

**A. Results Display**
```javascript
setResult(data)
```
**Effects:**
- ✅ Loading spinner disappears
- ✅ Results container appears
- ✅ Scorecard displays with animated scores
- ✅ Full analysis text shown below

**B. Clear Search**
```javascript
setSelectedTrack(null)
```
**Effects:**
- ✅ Search field cleared
- ✅ No track selected

**C. Refresh Balance**
```javascript
await fetchBalance()
```

**API Call:**
```
GET http://localhost:8787/api/balance
```

**API Response:**
```json
{
  "userId": "uuid",
  "credits": 0,
  "freeRemaining": 1,  ← UPDATED
  "total": 1            ← UPDATED
}
```

**Effects:**
- ✅ Header updates: **"1 CREDIT • 1 FREE"**
- ✅ Balance state synchronized with database

#### **Console Logs (Complete Flow):**
```
[App] handleAnalyze called { isAuthenticated: true, balance: {total: 2}, selectedTrack: {...} }
[App] Proceeding with analysis
[useAnalysis] Analyzing: { songTitle: 'Imagine', artistName: 'John Lennon', model: 'gpt4', lang: 'en' }

[API] POST /api/analyze
[Credits] Processing gpt4 analysis for user-uuid
[Credits] User user-uuid has 2 total credits (0 purchased + 2 free)
[Credits] Consumed free credit for user-uuid. New total: 1

[AI] Analyzing with OpenAI GPT-4o
[AI] Response received (2.3s)
[AI] Scores parsed: { ethics: -8, metaphysics: -6, ... }
[DB] Saved analysis to database

[App] Analysis successful, refreshing balance and clearing search
[Balance] Fetching for user: user-uuid
[Balance] Fetched: {credits: 0, free: 1, total: 1}
[App] Balance refreshed
```

---

## 5. ANALYZE WITH PURCHASED CREDITS

### ACTION: User clicks "Analyze" with 0 free, 10 purchased credits

**What Happens (Differences from Free Credits):**

#### **Credit Consumption:**
```sql
-- Inside consume_credit RPC
IF v_free > 0 THEN
  -- Skip: v_free = 0
ELSE
  -- USE PURCHASED CREDITS
  UPDATE user_credits
  SET purchased_credits = purchased_credits - 1,
      updated_at = NOW()
  WHERE user_id = 'user-uuid';

  v_used_free := FALSE;  ← MARKS AS PAID
  v_purchased := v_purchased - 1;
END IF;
```

**Database Changes:**
```
BEFORE:
purchased_credits: 10
free_credits_remaining: 0
total_credits: 10

AFTER:
purchased_credits: 9   ← DECREASED BY 1
free_credits_remaining: 0
total_credits: 9       ← AUTO-CALCULATED
```

**Transaction Log:**
```sql
INSERT INTO credit_transactions (
  type, amount,
  purchased_before, purchased_after,
  free_before, free_after
) VALUES (
  'usage', -1,
  10, 9,       ← Purchased: 10 → 9
  0, 0         ← Free: unchanged
);
```

**Effects:**
- ✅ Purchased credit consumed
- ✅ Header updates: **"9 CREDITS"** (no free indicator)
- ✅ Console: `[Credits] Consumed paid credit`

---

## 6. ANALYZE WITH ZERO CREDITS

### ACTION: User clicks "Analyze" with 0 total credits

**What Happens:**

#### **Step 1: Frontend Check**
```javascript
if (balance !== null && balance.total <= 0) {
  console.log('[App] Insufficient credits, opening payment modal')
  paymentModal.open()
  return  // ← STOPS HERE
}
```

**Effects:**
- ❌ **NO API call made**
- ❌ **NO credit consumption attempted**
- ✅ Payment modal opens immediately
- ✅ Shows 3 purchase options (10, 20, 50 credits)

#### **Console Logs:**
```
[App] handleAnalyze called { isAuthenticated: true, balance: {total: 0}, ... }
[App] Insufficient credits, opening payment modal
```

**No Database Changes**
**No Backend Logs**

---

## 7. PURCHASE CREDITS (STRIPE)

### ACTION: User clicks "10 Credits - $X.XX" in payment modal

**What Happens:**

#### **Step 1: Frontend Creates Checkout Session**
```javascript
// site/src/services/stripe/checkout.js
createCheckoutSession(amount) // amount = 10
```

**API Call:**
```
POST http://localhost:8787/api/create-checkout
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Body:
{
  "priceId": "price_1SSRJhAMWfyZKQTDdAyX0leM",  // 10 credits
  "userId": "user-uuid"
}
```

#### **Step 2: Backend Creates Stripe Session**
```javascript
// api/index.js
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price: priceId,  // price_1SSRJh... (10 credits)
    quantity: 1
  }],
  mode: 'payment',
  success_url: 'http://localhost:3001/payment/success',
  cancel_url: 'http://localhost:3001/payment/cancel',
  client_reference_id: userId,
  metadata: {
    user_id: userId,
    tier: '10'
  }
})
```

**Stripe API Response:**
```json
{
  "id": "cs_test_abc123...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_abc123#..."
}
```

#### **Step 3: Frontend Redirects to Stripe**
```javascript
window.location.href = session.url
```

**Effects:**
- ✅ User leaves your site
- ✅ Stripe checkout page opens
- ✅ Shows payment form

#### **Step 4: User Enters Payment Info**
**Test Card:**
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

**User Clicks "Pay"**

#### **Step 5: Stripe Processes Payment**
**Effects (Stripe Side):**
- ✅ Card charged
- ✅ Payment succeeded
- ✅ Sends webhook event to your API

#### **Step 6: User Redirected Back**
```
http://localhost:3001/payment/success
```

**Effects:**
- ✅ User back on your site
- ✅ Frontend loads normally
- ✅ Balance fetch triggered automatically

**⚠️ LOCAL DEV ISSUE:**
- ❌ Webhook **CANNOT** reach localhost:8787
- ❌ Credits **NOT** added automatically
- ⚠️ **Manual intervention required**

---

## 8. WEBHOOK PROCESSES PAYMENT (Production Only)

### ACTION: Stripe sends webhook event (Production)

**What Happens:**

#### **Step 1: Stripe Sends Event**
```
POST https://your-domain.com/api/stripe-webhook
Stripe-Signature: t=timestamp,v1=signature...

Body:
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "client_reference_id": "user-uuid",
      "payment_status": "paid",
      "line_items": {
        "data": [{
          "price": { "id": "price_1SSRJh..." }
        }]
      }
    }
  }
}
```

#### **Step 2: Backend Verifies Signature**
```javascript
const signature = request.headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  WEBHOOK_SECRET
)
```

**If signature invalid:**
- ❌ Returns 400 error
- ❌ No credits added
- ✅ Prevents replay attacks

**If signature valid:**
- ✅ Proceeds to process event

#### **Step 3: Extract Payment Info**
```javascript
const session = event.data.object
const userId = session.client_reference_id  // "user-uuid"
const priceId = session.line_items.data[0].price.id  // "price_1SSRJh..."

// Map price ID to credits
const creditMap = {
  "price_1SSRJhAMWfyZKQTDdAyX0leM": 10,
  "price_1SSmfjAMWfyZKQTD0JxMUXY5": 20,
  "price_1SSmiUAMWfyZKQTDEmetPoTd": 50
}
const credits = creditMap[priceId]  // 10
```

#### **Step 4: Call Idempotent RPC**
```sql
SELECT process_stripe_payment(
  p_stripe_session_id := 'cs_test_abc123',
  p_stripe_price_id := 'price_1SSRJh...',
  p_user_id := 'user-uuid',
  p_credits := 10,
  p_event_type := 'checkout.session.completed',
  p_metadata := '{"tier": "10"}'::jsonb
);
```

**Inside RPC Function:**

**A. Check Idempotency**
```sql
SELECT EXISTS(
  SELECT 1 FROM stripe_webhooks
  WHERE stripe_session_id = 'cs_test_abc123'
);
```

**If already processed:**
```sql
RETURN (TRUE, TRUE, NULL, current_total, NULL);
-- Already processed, skip
```

**If new:**
```sql
-- Insert webhook record with status='processing'
INSERT INTO stripe_webhooks (
  stripe_session_id, stripe_price_id, event_type,
  user_id, status
) VALUES (
  'cs_test_abc123', 'price_1SSRJh...', 'checkout.session.completed',
  'user-uuid', 'processing'
);
```

**B. Ensure User Record Exists**
```sql
INSERT INTO user_credits (user_id, purchased_credits, free_credits_remaining)
VALUES ('user-uuid', 0, 0)
ON CONFLICT (user_id) DO NOTHING;
```

**C. Lock User Record**
```sql
SELECT purchased_credits, free_credits_remaining, total_credits
FROM user_credits
WHERE user_id = 'user-uuid'
FOR UPDATE;  -- 🔒 LOCKS
```

**D. Add Credits**
```sql
UPDATE user_credits
SET purchased_credits = purchased_credits + 10,  -- ADD 10
    updated_at = NOW()
WHERE user_id = 'user-uuid';
```

**Database Changes:**
```
BEFORE:
purchased_credits: 0
free_credits_remaining: 1
total_credits: 1

AFTER:
purchased_credits: 10  ← INCREASED BY 10
free_credits_remaining: 1
total_credits: 11      ← AUTO-CALCULATED
```

**E. Log Transaction**
```sql
INSERT INTO credit_transactions (
  user_id, type, amount,
  purchased_before, purchased_after,
  free_before, free_after,
  total_before, total_after,
  stripe_session_id, stripe_price_id,
  status
) VALUES (
  'user-uuid', 'purchase', 10,
  0, 10,       ← Purchased: 0 → 10
  1, 1,        ← Free: unchanged
  1, 11,       ← Total: 1 → 11
  'cs_test_abc123', 'price_1SSRJh...',
  'completed'
);
```

**F. Mark Webhook Complete**
```sql
UPDATE stripe_webhooks
SET status = 'completed',
    credits_granted = 10,
    transaction_id = <new_transaction_id>,
    processed_at = NOW()
WHERE stripe_session_id = 'cs_test_abc123';
```

**G. Queue Email (Optional)**
```sql
INSERT INTO email_outbox (
  user_id, email_type, recipient, subject, payload
) SELECT
  'user-uuid', 'payment_receipt', user.email,
  'Payment Received - Credits Added',
  '{"credits": 10, "newBalance": 11}'::jsonb
FROM auth.users WHERE id = 'user-uuid';
```

#### **Step 5: Webhook Response**
```
HTTP 200 OK
Body: {"received": true}
```

**Stripe marks webhook as delivered**

#### **Step 6: User Refreshes Page**
**Balance Fetch:**
```
GET /api/balance
```

**Response:**
```json
{
  "credits": 10,
  "freeRemaining": 1,
  "total": 11  ← UPDATED!
}
```

**Effects:**
- ✅ Header updates: **"11 CREDITS • 1 FREE"**
- ✅ User sees new credits

---

## 9. MANUAL CREDIT ADDITION (Local Dev)

### ACTION: Run `node test-init-and-add-credits.js`

**What Happens:**

#### **Script Code:**
```javascript
const response = await fetch(`${SUPABASE_URL}/rest/v1/user_credits`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
  },
  body: JSON.stringify({
    user_id: userId,
    purchased_credits: 10,
    free_credits_remaining: 0
  })
})
```

**Prefer Header Explanation:**
- `resolution=merge-duplicates`: If `user_id` exists, **UPDATE** instead of error
- `return=representation`: Return the updated row

**Database Operation:**
```sql
-- If user_id exists:
UPDATE user_credits
SET purchased_credits = 10,
    free_credits_remaining = 0,
    updated_at = NOW()
WHERE user_id = 'user-uuid';

-- If user_id does NOT exist:
INSERT INTO user_credits (user_id, purchased_credits, free_credits_remaining)
VALUES ('user-uuid', 10, 0);
```

**Effects:**
- ✅ Credits set to 10 (overwrites existing!)
- ✅ Free credits reset to 0
- ⚠️ **Dangerous:** Can overwrite legitimate balance

**Console Output:**
```
✅ Success! {
  user_id: 'user-uuid',
  purchased_credits: 10,
  free_credits_remaining: 0,
  total_credits: 10,
  created_at: '...',
  updated_at: '...'
}
```

---

## 10. ANALYSIS FAILS (REFUND SCENARIO)

### ACTION: OpenAI API returns error during analysis

**What Happens:**

#### **Step 1: Credit Already Consumed**
(Steps 1-3 from "CLICK ANALYZE" above)

**Database State:**
```
Credits: 2 → 1 (already deducted)
```

#### **Step 2: OpenAI API Error**
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', ...)

if (!response.ok) {
  throw new Error(`OpenAI API error: ${response.status}`)
}
```

**Error Example:**
```
Error: OpenAI API error: 401 (Invalid API key)
```

#### **Step 3: Refund Function Called**
```javascript
// api/index.js - catch block
catch (error) {
  console.error('[Analysis] Error:', error)

  // Refund credit
  await refundCredit(env, userId, consumptionResult.type)

  throw error
}
```

#### **Step 4: Refund Implementation**
```javascript
// api/src/credits/refund.js
export async function refundCredit(env, userId, consumptionType) {
  // Get current balance
  const balanceRes = await fetch(
    `${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`
  )
  const currentBalance = await balanceRes.json()[0]

  if (consumptionType === 'free') {
    // Refund free credit
    await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        free_credits_remaining: currentBalance.free_credits_remaining + 1
      })
    })
  } else if (consumptionType === 'paid') {
    // Refund paid credit
    await fetch(`${SUPABASE_URL}/rest/v1/user_credits?user_id=eq.${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        purchased_credits: currentBalance.purchased_credits + 1
      })
    })
  }
}
```

**Database Changes:**
```
BEFORE REFUND:
purchased_credits: 0
free_credits_remaining: 1
total_credits: 1

AFTER REFUND:
purchased_credits: 0
free_credits_remaining: 2  ← RESTORED
total_credits: 2
```

#### **Step 5: Frontend Error Handling**
```javascript
// useAnalysis hook
catch (err) {
  setError(err.message)
  return { success: false, error: err.message }
}
```

**Effects:**
- ✅ Error message displayed in results area
- ✅ Loading spinner stops
- ✅ Balance refreshed (shows restored credits)
- ✅ User can try again

#### **Console Logs:**
```
[Credits] Consumed free credit for user-uuid. New total: 1
[AI] Calling OpenAI API...
[AI] ERROR: OpenAI API error: 401
[Credits] Refund credit to user-uuid (type: free)
[Credits] Refunded 1 free credit to user-uuid
[useAnalysis] Error: Analysis failed
[App] Analysis failed: Analysis failed
```

---

## 11. CACHED ANALYSIS (NO CREDIT DEDUCTION)

### ACTION: User analyzes same song twice

**What Happens:**

#### **First Analysis:**
(Complete flow from "CLICK ANALYZE")
- Credit consumed: 2 → 1
- OpenAI called
- Saved to database

#### **Second Analysis (Same Song):**

**Step 1: Frontend Sends Request**
(Same as before)

**Step 2: Backend Checks Cache**
```javascript
// api/index.js
const cacheUrl = `${SUPABASE_URL}/rest/v1/song_analyses?song_name=eq.Imagine&artist=eq.John Lennon&generated_by=eq.gpt4`
const cacheRes = await fetch(cacheUrl)
const cached = await cacheRes.json()

if (cached && cached.length > 0) {
  // CACHE HIT!
  console.log('[API] Cache hit for: Imagine - John Lennon (gpt4)')

  // Return cached result immediately
  return jsonResponse(cached[0], 200, origin, env)
}
```

**Effects:**
- ✅ **NO** credit consumption attempt
- ✅ **NO** OpenAI API call
- ✅ **NO** database write
- ✅ Response returns in <100ms (vs 2-3 seconds)

**API Response:**
```json
{
  "song": "Imagine",
  "artist": "John Lennon",
  "model": "gpt4",
  "scores": { ... },
  "analysis": "...",
  "cached": true,  ← INDICATES CACHE HIT
  "spotify_id": "..."
}
```

**Database State:**
```
UNCHANGED:
purchased_credits: 0
free_credits_remaining: 1
total_credits: 1
```

#### **Console Logs:**
```
[API] POST /api/analyze
[API] Cache hit for: Imagine - John Lennon (gpt4)
[API] Returning cached analysis
```

**Frontend:**
```
[useAnalysis] Analyzing: { songTitle: 'Imagine', ... }
[App] Analysis successful, refreshing balance and clearing search
[Balance] Fetched: {credits: 0, free: 1, total: 1}  ← UNCHANGED
```

---

## 12. RAPID CLICK TEST (RACE CONDITION)

### ACTION: User clicks Analyze 10 times rapidly

**What Happens:**

#### **Request 1:**
**Step 1:** Reaches backend
**Step 2:** Credit consumption RPC called
```sql
SELECT purchased_credits, free_credits_remaining
FROM user_credits
WHERE user_id = 'user-uuid'
FOR UPDATE;  -- 🔒 ROW LOCKED
```

**Step 3:** Credit deducted (2 → 1)
**Step 4:** Analysis proceeds
**Step 5:** 🔓 Row unlocked when transaction commits

**Effects:**
- ✅ Request 1 succeeds
- ✅ Credit consumed: 2 → 1

#### **Requests 2-10 (Simultaneous):**
**Step 1:** All reach backend at same time
**Step 2:** Each tries to acquire lock
```sql
FOR UPDATE;  -- ⏳ WAITS for Request 1 to finish
```

**Step 3:** After Request 1 completes, Request 2 gets lock
**Step 4:** Reads balance: `total_credits = 1`
**Step 5:** Checks: `IF v_total = 0`
```sql
-- v_total = 1, so proceeds
UPDATE user_credits SET free_credits_remaining = 0
```
**Step 6:** Credit consumed: 1 → 0
**Step 7:** Request 2 succeeds

**Step 8:** Requests 3-10 try to get lock
**Step 9:** Read balance: `total_credits = 0`
**Step 10:** Check fails:
```sql
IF v_total = 0 THEN
  RETURN (FALSE, 0, FALSE, 'Insufficient credits');
END IF;
```

**Effects:**
- ✅ Request 3-10 return error
- ✅ NO credit consumed for 3-10
- ✅ User ends with 0 credits (only 2 analyses, not 10!)

#### **Database Final State:**
```
BEFORE:
total_credits: 2

AFTER:
total_credits: 0

credit_transactions records: 2 (not 10!)
```

#### **Frontend Receives:**
**Requests 1-2:**
```json
{ "success": true, "data": {...} }
```

**Requests 3-10:**
```json
{ "error": "INSUFFICIENT_CREDITS" }
```

**Effects:**
- ✅ Only 2 results displayed
- ✅ Payment modal may open (for requests 3-10)
- ✅ Balance shows 0

#### **Console Logs:**
```
[Credits] Processing gpt4 analysis for user-uuid  (×10)
[Credits] Consumed free credit for user-uuid. New total: 1  (×1)
[Credits] Consumed free credit for user-uuid. New total: 0  (×1)
[Credits] Consumption failed for user-uuid: Insufficient credits  (×8)
```

**✅ RACE CONDITION PREVENTED**

---

## Summary Table: Action → Effects

| Action | Database Change | API Calls | UI Update | Credits Change |
|--------|----------------|-----------|-----------|----------------|
| **Sign Up** | `user_credits` INSERT | Supabase Auth | Show balance | 0 → 2 free |
| **Login** | None | Supabase Auth, `/balance` | Show header | None |
| **Search** | None | Spotify API | Show dropdown | None |
| **Analyze (free)** | `user_credits` UPDATE, `credit_transactions` INSERT, `song_analyses` INSERT | `/analyze`, OpenAI | Show results | 2 → 1 |
| **Analyze (paid)** | `user_credits` UPDATE, `credit_transactions` INSERT | `/analyze`, OpenAI | Show results | 10 → 9 |
| **Analyze (zero)** | None | None | Open modal | None |
| **Purchase** | None (yet) | Stripe API | Redirect | None (yet) |
| **Webhook** | `user_credits` UPDATE, `credit_transactions` INSERT, `stripe_webhooks` INSERT | None | None (until refresh) | 0 → 10 |
| **Failed Analysis** | `user_credits` UPDATE (refund) | `/analyze` (partial) | Show error | 1 → 2 (restored) |
| **Cached Analysis** | None | `/analyze` (cache hit) | Show results | None |
| **Rapid Clicks** | `user_credits` UPDATE (×2 only) | `/analyze` (×10) | Show 2 results | 2 → 0 |

---

**Document Version:** 1.0
**Purpose:** Understand exact cause-and-effect relationships in monetization system
