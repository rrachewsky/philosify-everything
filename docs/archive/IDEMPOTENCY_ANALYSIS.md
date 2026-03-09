# Credit System Idempotency Analysis

**Status:** ⚠️ NOT IDEMPOTENT - Has race conditions and replay vulnerabilities

---

## Critical Issues

### Issue #1: Stripe Webhook Replay (Double Credit)

**Current Code (api/index.js:704-706):**
```javascript
// Creditar conta
await creditByTier(env, userId, tier);
console.log(`[Stripe] Credited ${tier} credits to user ${userId}`);
```

**Problem:**
- Stripe sends webhook events multiple times if delivery fails
- No check if `checkout_session_id` was already processed
- Same payment could credit user 2x, 3x, or more times

**Scenario:**
1. User pays $6.00 → webhook arrives → balance += $6.00 ✓
2. Network hiccup → Stripe retries webhook → balance += $6.00 ❌ (DOUBLE CREDIT)
3. Total: User paid $6, got $12 worth of credits

**Fix Required:**
Store Stripe event ID or checkout session ID in transactions table and check before processing.

---

### Issue #2: consumeOne() Race Condition

**Current Code (api/index.js:313-329):**
```javascript
// Step 1: Read profile
const profile = await getUserProfile(env, userId);

// Step 2: Check free analyses
if (profile.free_analyses_used < 2) {
  // Step 3: Update (NOT ATOMIC)
  await fetch(updateUrl, {
    method: 'PATCH',
    body: JSON.stringify({
      free_analyses_used: profile.free_analyses_used + 1
    })
  });
}
```

**Problem:**
Classic read-modify-write race condition. Two concurrent requests:

**Timeline:**
```
Request A: Read free_analyses_used = 0
Request B: Read free_analyses_used = 0  (before A writes)
Request A: Write free_analyses_used = 1
Request B: Write free_analyses_used = 1  (overwrites A!)
```

**Result:** User did 2 analyses, but `free_analyses_used = 1` (only charged once)

**Same issue with balance deduction:**
```
Request A: Read balance = 1.20
Request B: Read balance = 1.20
Request A: Write balance = 0.60 (1.20 - 0.60)
Request B: Write balance = 0.60 (1.20 - 0.60, overwrites A!)
```

**Result:** User did 2 analyses, but only paid for 1

---

### Issue #3: creditByTier() Race Condition

**Current Code (api/index.js:466-480):**
```javascript
// Read current balance
const profile = await getUserProfile(env, userId);
const newBalance = profile.balance + amountInDollars;

// Update balance (NOT ATOMIC)
await fetch(updateUrl, {
  method: 'PATCH',
  body: JSON.stringify({
    balance: newBalance
  })
});
```

**Problem:**
If two purchases happen simultaneously (unlikely but possible with webhook retries):

```
Webhook 1: Read balance = 0.00
Webhook 2: Read balance = 0.00
Webhook 1: Write balance = 6.00 (0 + 6)
Webhook 2: Write balance = 12.00 (0 + 12, overwrites to 12)
```

**Result:** User paid $18 total ($6 + $12), but balance = $12 (lost $6!)

---

## Solutions

### Solution 1: Use PostgreSQL Atomic Operations (BEST)

**Instead of read-modify-write, use database expressions:**

```javascript
// BEFORE (NOT SAFE):
const profile = await getUserProfile(env, userId);
const newBalance = profile.balance + 0.60;
await updateBalance(userId, newBalance);

// AFTER (SAFE):
await fetch(updateUrl, {
  method: 'PATCH',
  headers: { 'Prefer': 'return=representation' },
  body: JSON.stringify({
    balance: `balance + 0.60`  // PostgreSQL expression!
  })
});
```

**However**, Supabase PostgREST doesn't support expressions in PATCH body directly.

**Alternative: Use PostgreSQL function (RPC):**

```sql
-- Create function for atomic balance update
CREATE OR REPLACE FUNCTION add_to_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE user_profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```

```javascript
// Call from code
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/add_to_balance`, {
  method: 'POST',
  body: JSON.stringify({
    p_user_id: userId,
    p_amount: 0.60
  })
});
```

---

### Solution 2: Use PostgreSQL Row Locking (SELECT FOR UPDATE)

**Create atomic consume function:**

```sql
CREATE OR REPLACE FUNCTION consume_one_analysis(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_profile user_profiles;
  v_new_balance NUMERIC;
  v_free_remaining INT;
BEGIN
  -- Lock the row for update
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;  -- Locks row until transaction commits

  -- Check free analyses
  IF v_profile.free_analyses_used < 2 THEN
    UPDATE user_profiles
    SET free_analyses_used = free_analyses_used + 1
    WHERE id = p_user_id;

    RETURN json_build_object(
      'type', 'free',
      'remaining', 1 - v_profile.free_analyses_used,
      'credits', FLOOR(v_profile.balance / 0.60)
    );
  END IF;

  -- Check balance
  IF v_profile.balance < 0.60 THEN
    RETURN json_build_object(
      'type', 'none',
      'remaining', 0,
      'credits', 0
    );
  END IF;

  -- Deduct from balance
  UPDATE user_profiles
  SET balance = balance - 0.60
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  RETURN json_build_object(
    'type', 'paid',
    'remaining', 0,
    'credits', FLOOR(v_new_balance / 0.60)
  );
END;
$$ LANGUAGE plpgsql;
```

**Call from code:**
```javascript
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_one_analysis`, {
  method: 'POST',
  body: JSON.stringify({ p_user_id: userId })
});
const result = await response.json();
// Returns: {type: "free"|"paid"|"none", remaining: N, credits: N}
```

**Benefits:**
- Atomic operation (all-or-nothing)
- No race conditions (row locked during transaction)
- Simplified application code

---

### Solution 3: Store Stripe Event IDs (Prevent Replay)

**Update transactions table schema:**

```sql
-- Add column for Stripe event ID
ALTER TABLE transactions
ADD COLUMN stripe_event_id TEXT UNIQUE;

CREATE UNIQUE INDEX idx_transactions_stripe_event
ON transactions (stripe_event_id)
WHERE stripe_event_id IS NOT NULL;
```

**Update webhook handler:**

```javascript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const userId = session.client_reference_id;
  const stripeEventId = event.id;  // e.g., "evt_1234567890"

  // Check if event already processed
  const checkUrl = `${supabaseUrl}/rest/v1/transactions?stripe_event_id=eq.${stripeEventId}&select=id`;
  const checkRes = await fetch(checkUrl, { headers: {...} });
  const existing = await checkRes.json();

  if (existing && existing.length > 0) {
    console.log(`[Stripe] Event ${stripeEventId} already processed, skipping`);
    return jsonResponse({ received: true, duplicate: true });
  }

  // Process payment
  await creditByTier(env, userId, tier, stripeEventId);
}
```

**Update creditByTier signature:**

```javascript
async function creditByTier(env, userId, tier, stripeEventId = null) {
  // ... existing code ...

  // Record transaction with event ID
  await createTransaction(
    env,
    userId,
    amountInDollars,
    'purchase',
    `Purchased ${credits} credits (Tier ${tier})`,
    {
      tier: tier,
      stripe_event_id: stripeEventId  // Store for deduplication
    }
  );
}
```

**Update createTransaction:**

```javascript
async function createTransaction(env, userId, amount, type, description, metadata = {}) {
  const transactionData = {
    user_id: userId,
    amount: amount,
    type: type,
    status: 'completed',
    description: description,
    metadata: metadata
  };

  // Add stripe_event_id as top-level column if present
  if (metadata.stripe_event_id) {
    transactionData.stripe_event_id = metadata.stripe_event_id;
  }

  await fetch(transactionUrl, {
    method: 'POST',
    body: JSON.stringify(transactionData)
  });
}
```

---

## Recommended Implementation Order

### Phase 1: Prevent Double Charging (HIGH PRIORITY)
1. ✅ Add `stripe_event_id` column to transactions table
2. ✅ Update webhook to check for duplicate events
3. ✅ Store event ID in transactions

**Risk if not fixed:** Users get free credits, or lose money

---

### Phase 2: Fix Race Conditions (MEDIUM PRIORITY)
4. ✅ Create PostgreSQL `consume_one_analysis()` function
5. ✅ Create PostgreSQL `add_to_balance()` function
6. ✅ Update application code to use RPC calls

**Risk if not fixed:** Lost revenue (users not charged correctly)

---

### Phase 3: Add Monitoring (LOW PRIORITY)
7. ✅ Add unique constraint on `(song_id, language, version)` in analyses
8. ✅ Add unique constraint on `(title_normalized, artist_normalized)` in songs
9. ✅ Add indexes for performance

**Risk if not fixed:** Slower queries, duplicate data

---

## Testing Idempotency

### Test 1: Webhook Replay
```bash
# Send same webhook twice
curl -X POST https://your-worker.workers.dev/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"id": "evt_test_123", "type": "checkout.session.completed", ...}'

# Send again with same event ID
curl -X POST https://your-worker.workers.dev/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"id": "evt_test_123", "type": "checkout.session.completed", ...}'

# Check: User balance should only increase ONCE
```

### Test 2: Concurrent Analysis Requests
```javascript
// Send two analysis requests simultaneously
const userId = 'test-user-id';
Promise.all([
  fetch('/api/analyze', { body: { song: 'Test Song' }, headers: { 'Authorization': `Bearer ${token}` } }),
  fetch('/api/analyze', { body: { song: 'Test Song 2' }, headers: { 'Authorization': `Bearer ${token}` } })
]);

// Check: free_analyses_used should be 2, not 1
// Check: Two transactions should exist
```

### Test 3: Concurrent Balance Updates
```sql
-- Simulate concurrent webhook processing
BEGIN;
SELECT balance FROM user_profiles WHERE id = 'test-user' FOR UPDATE;
-- (pause here, run same in another session)
UPDATE user_profiles SET balance = balance + 6.00 WHERE id = 'test-user';
COMMIT;

-- Both should succeed without data loss
```

---

## Current Status

**Before Fixes:**
- ❌ Stripe webhooks NOT idempotent (can double-credit)
- ❌ consumeOne() has race conditions (can undercharge)
- ❌ creditByTier() has race conditions (can lose money)
- ❌ No deduplication on songs/analyses

**After Fixes (Phase 1 + 2):**
- ✅ Stripe webhooks idempotent (event ID deduplication)
- ✅ consumeOne() atomic (PostgreSQL function with row locking)
- ✅ creditByTier() atomic (PostgreSQL function)
- ✅ Unique constraints prevent duplicates

---

**Next Steps:**
1. Run `DATABASE_VERIFICATION_QUERIES.md` to check current state
2. Implement Phase 1 fixes (Stripe deduplication) - CRITICAL
3. Implement Phase 2 fixes (atomic operations) - IMPORTANT
4. Test with concurrent requests
