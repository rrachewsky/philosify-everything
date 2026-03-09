# Critical Database Fixes
# Run these FIRST before deploying code

---

## CRITICAL FIX #1: Add stripe_event_id Column

```sql
-- Add column for Stripe webhook idempotency
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

-- Create unique index to prevent duplicate webhook processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_event_unique
ON transactions (stripe_event_id)
WHERE stripe_event_id IS NOT NULL;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'stripe_event_id';
```

**Why Critical:** Without this, the same Stripe webhook can be processed multiple times, giving users free credits.

---

## CRITICAL FIX #2: Add created_by to songs/analyses (RLS Fix)

**Current Problem:** RLS policies require `created_by` field, but our code doesn't set it.

**Option A: Set created_by to service role UUID** (RECOMMENDED)

```sql
-- Check if created_by columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('songs', 'analyses')
  AND column_name = 'created_by';

-- If they exist, make them nullable (allow service role to skip)
ALTER TABLE songs
ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE analyses
ALTER COLUMN created_by DROP NOT NULL;

-- Update RLS policy for service role bypass
-- Service role should bypass RLS entirely (already does via SECURITY DEFINER)
```

**Option B: Remove created_by constraint from RLS** (ALTERNATIVE)

```sql
-- Drop and recreate INSERT policies without created_by check
DROP POLICY IF EXISTS "Authenticated can create songs" ON songs;
CREATE POLICY "Authenticated can create songs"
ON songs FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow all authenticated inserts

DROP POLICY IF EXISTS "Authenticated can create analyses" ON analyses;
CREATE POLICY "Authenticated can create analyses"
ON analyses FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow all authenticated inserts
```

**Why Critical:** Without this fix, `getOrCreateSong()` and `saveToSupabase()` will fail with permission errors.

---

## CRITICAL FIX #3: Update add_credits() to Use Event ID

**Current `add_credits()` function uses `stripe_payment_intent_id`:**
```sql
-- Check current signature
SELECT proname, pg_get_function_arguments(oid)
FROM pg_proc
WHERE proname = 'add_credits';
```

**Problem:** Payment intent ID is not the same as event ID. Multiple events can have the same payment intent.

**Solution: Create new idempotent function:**

```sql
-- Idempotent credit function using Stripe event ID
CREATE OR REPLACE FUNCTION credit_from_stripe(
  p_user_id UUID,
  p_amount NUMERIC,
  p_stripe_event_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance NUMERIC;
  v_existing_transaction_id UUID;
BEGIN
  -- Check if event already processed (IDEMPOTENCY CHECK)
  SELECT id INTO v_existing_transaction_id
  FROM transactions
  WHERE stripe_event_id = p_stripe_event_id;

  IF FOUND THEN
    -- Event already processed, return without adding credits
    SELECT balance INTO v_new_balance
    FROM user_profiles
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
      'success', true,
      'duplicate', true,
      'transaction_id', v_existing_transaction_id,
      'balance', v_new_balance,
      'message', 'Event already processed'
    );
  END IF;

  -- Add credits atomically
  UPDATE user_profiles
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- If user doesn't exist, create profile
  IF NOT FOUND THEN
    INSERT INTO user_profiles (id, name, balance, free_analyses_used)
    VALUES (p_user_id, 'User', p_amount, 0)
    RETURNING balance INTO v_new_balance;
  END IF;

  -- Record transaction with event ID
  INSERT INTO transactions (
    user_id,
    amount,
    type,
    description,
    status,
    stripe_event_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_amount,
    'purchase',
    'Added ' || p_amount || ' credits',
    'completed',
    p_stripe_event_id,
    p_metadata
  )
  RETURNING id INTO v_existing_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'duplicate', false,
    'transaction_id', v_existing_transaction_id,
    'balance', v_new_balance,
    'amount_added', p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION credit_from_stripe(UUID, NUMERIC, TEXT, JSONB) TO service_role;

-- Test (should succeed)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  6.00,
  'evt_test_unique_123',
  '{"tier": "10"}'::jsonb
);

-- Test again (should return duplicate: true)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  6.00,
  'evt_test_unique_123',
  '{"tier": "10"}'::jsonb
);
```

---

## VERIFICATION: Check if Functions Work

### Test process_analysis_payment()

```sql
-- Check if it exists and works
SELECT process_analysis_payment(
  (SELECT id FROM user_profiles LIMIT 1),
  'Test Song',
  'Test Artist',
  'gpt4',
  'en'
);

-- Should return:
-- {"success": true, "was_free": true, "cost": 0.00, "new_balance": X.XX}
```

### Test credit_from_stripe()

```sql
-- First call (should add credits)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  6.00,
  'evt_unique_test_456',
  '{"tier": "10"}'::jsonb
);

-- Second call (should return duplicate: true)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  6.00,
  'evt_unique_test_456',
  '{"tier": "10"}'::jsonb
);
```

---

## EXECUTION ORDER

**Run in this exact order:**

1. ✅ STEP 1: Add `stripe_event_id` column
2. ✅ STEP 2: Fix RLS policies (Option A or B)
3. ✅ STEP 3: Create `credit_from_stripe()` function
4. ✅ STEP 4: Test both functions
5. ⏳ Then update application code to use these functions

---

## What These Fixes Solve

### Before Fixes:
- ❌ Stripe webhooks can be replayed → free credits
- ❌ INSERT failures due to RLS `created_by` constraint
- ❌ Race conditions in credit consumption
- ❌ Race conditions in balance updates

### After Fixes:
- ✅ Stripe webhooks idempotent (event ID deduplication)
- ✅ INSERTs work (RLS fixed)
- ✅ Credit consumption atomic (`process_analysis_payment()` with FOR UPDATE)
- ✅ Balance updates atomic (`credit_from_stripe()` single SQL)

---

**Status:** Ready to run. Execute steps 1-4 now.
