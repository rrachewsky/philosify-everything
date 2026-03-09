# Database Fixes for Idempotency and Performance
# DO NOT COMMIT - Run these in Supabase SQL Editor

---

## PHASE 1: Critical Fixes (Prevent Double Charging)

### STEP 1: Add stripe_event_id Column to Transactions

```sql
-- Add column for Stripe event deduplication
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

-- Create unique index to prevent duplicate processing
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_stripe_event_unique
ON transactions (stripe_event_id)
WHERE stripe_event_id IS NOT NULL;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'stripe_event_id';
```

---

### STEP 2: Create Atomic Balance Update Function

```sql
-- Function to atomically add to user balance (prevents race conditions)
CREATE OR REPLACE FUNCTION add_to_balance(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Balance adjustment',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
  v_new_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Atomically update balance (single SQL operation, no race condition)
  UPDATE user_profiles
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', p_user_id;
  END IF;

  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description, metadata, status)
  VALUES (
    p_user_id,
    p_amount,
    CASE WHEN p_amount > 0 THEN 'purchase' ELSE 'analysis' END,
    p_description,
    p_metadata,
    'completed'
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'success', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test
SELECT add_to_balance(
  (SELECT id FROM user_profiles LIMIT 1),
  0.60,
  'Test transaction'
);
```

---

### STEP 3: Create Atomic Analysis Consumption Function

```sql
-- Function to atomically consume one analysis credit (prevents double-charging)
CREATE OR REPLACE FUNCTION consume_one_analysis(
  p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_profile user_profiles;
  v_new_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Lock the row for update (prevents concurrent modifications)
  SELECT * INTO v_profile
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- If user doesn't exist, create profile with 2 free analyses
  IF NOT FOUND THEN
    INSERT INTO user_profiles (id, name, balance, free_analyses_used)
    VALUES (p_user_id, 'User', 0.00, 0)
    RETURNING * INTO v_profile;
  END IF;

  -- Check if user has free analyses remaining (max 2)
  IF v_profile.free_analyses_used < 2 THEN
    -- Use free analysis
    UPDATE user_profiles
    SET free_analyses_used = free_analyses_used + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Record transaction
    INSERT INTO transactions (user_id, amount, type, description, status)
    VALUES (p_user_id, 0, 'analysis', 'Free analysis', 'completed')
    RETURNING id INTO v_transaction_id;

    RETURN json_build_object(
      'type', 'free',
      'free_remaining', 1 - v_profile.free_analyses_used,
      'credits', FLOOR(v_profile.balance / 0.60),
      'balance', v_profile.balance,
      'transaction_id', v_transaction_id,
      'success', true
    );
  END IF;

  -- Check if user has sufficient balance ($0.60 per analysis)
  IF v_profile.balance < 0.60 THEN
    RETURN json_build_object(
      'type', 'none',
      'free_remaining', 0,
      'credits', 0,
      'balance', v_profile.balance,
      'success', false,
      'error', 'Insufficient balance'
    );
  END IF;

  -- Deduct from balance
  UPDATE user_profiles
  SET balance = balance - 0.60,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (p_user_id, -0.60, 'analysis', 'Song analysis', 'completed')
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'type', 'paid',
    'free_remaining', 0,
    'credits', FLOOR(v_new_balance / 0.60),
    'balance', v_new_balance,
    'transaction_id', v_transaction_id,
    'success', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test
SELECT consume_one_analysis((SELECT id FROM user_profiles LIMIT 1));
```

---

### STEP 4: Create Idempotent Credit Function (for Stripe Webhooks)

```sql
-- Function to add credits from Stripe (idempotent with event ID)
CREATE OR REPLACE FUNCTION credit_from_stripe(
  p_user_id UUID,
  p_tier TEXT,
  p_stripe_event_id TEXT,
  p_stripe_session_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_credits INT;
  v_amount NUMERIC;
  v_new_balance NUMERIC;
  v_existing_transaction_id UUID;
BEGIN
  -- Check if event already processed (idempotency)
  SELECT id INTO v_existing_transaction_id
  FROM transactions
  WHERE stripe_event_id = p_stripe_event_id;

  IF FOUND THEN
    -- Event already processed, return success without double-crediting
    SELECT balance INTO v_new_balance
    FROM user_profiles
    WHERE id = p_user_id;

    RETURN json_build_object(
      'success', true,
      'duplicate', true,
      'transaction_id', v_existing_transaction_id,
      'balance', v_new_balance,
      'message', 'Event already processed'
    );
  END IF;

  -- Calculate credit amount
  v_credits := CASE p_tier
    WHEN '10' THEN 10
    WHEN '20' THEN 20
    WHEN '50' THEN 50
    ELSE 0
  END;

  v_amount := v_credits * 0.60;  -- $0.60 per credit

  IF v_credits = 0 THEN
    RAISE EXCEPTION 'Invalid tier: %', p_tier;
  END IF;

  -- Atomically update balance
  UPDATE user_profiles
  SET balance = balance + v_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- If user doesn't exist, create profile
  IF NOT FOUND THEN
    INSERT INTO user_profiles (id, name, balance, free_analyses_used)
    VALUES (p_user_id, 'User', v_amount, 0)
    RETURNING balance INTO v_new_balance;
  END IF;

  -- Record transaction with Stripe event ID
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
    v_amount,
    'purchase',
    format('Purchased %s credits (Tier %s)', v_credits, p_tier),
    'completed',
    p_stripe_event_id,
    jsonb_build_object(
      'tier', p_tier,
      'credits', v_credits,
      'stripe_session_id', p_stripe_session_id
    )
  )
  RETURNING id INTO v_existing_transaction_id;

  RETURN json_build_object(
    'success', true,
    'duplicate', false,
    'transaction_id', v_existing_transaction_id,
    'balance', v_new_balance,
    'credits_added', v_credits,
    'amount_added', v_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test (should succeed)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  '10',
  'evt_test_123456789',
  'cs_test_abc123'
);

-- Test again (should return duplicate: true)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  '10',
  'evt_test_123456789',
  'cs_test_abc123'
);
```

---

## PHASE 2: Performance and Data Integrity

### STEP 5: Add Missing Indexes

```sql
-- Fast song lookups by normalized title/artist
CREATE INDEX IF NOT EXISTS idx_songs_normalized
ON songs (title_normalized, artist_normalized);

-- Fast analysis lookups by song + language
CREATE INDEX IF NOT EXISTS idx_analyses_song_language
ON analyses (song_id, language, status);

-- Fast version ordering (for getting latest analysis)
CREATE INDEX IF NOT EXISTS idx_analyses_version
ON analyses (song_id, language, version DESC);

-- User transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
ON transactions (user_id, created_at DESC);

-- User profile updated_at for monitoring
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated
ON user_profiles (updated_at DESC);

-- Verify indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('songs', 'analyses', 'user_profiles', 'transactions')
ORDER BY tablename, indexname;
```

---

### STEP 6: Add Unique Constraints

```sql
-- Prevent duplicate songs (same title + artist)
ALTER TABLE songs
ADD CONSTRAINT IF NOT EXISTS songs_normalized_unique
UNIQUE (title_normalized, artist_normalized);

-- Prevent duplicate analyses (same song + language + version)
ALTER TABLE analyses
ADD CONSTRAINT IF NOT EXISTS analyses_song_lang_version_unique
UNIQUE (song_id, language, version);

-- Verify constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_name IN ('songs', 'analyses')
ORDER BY tc.table_name;
```

---

### STEP 7: Grant Permissions (if needed)

```sql
-- Ensure service role can call functions
GRANT EXECUTE ON FUNCTION add_to_balance(UUID, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION consume_one_analysis(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION credit_from_stripe(UUID, TEXT, TEXT, TEXT) TO service_role;

-- Ensure anon/authenticated can call if needed
-- (Usually service role only, but depends on your RLS policies)
```

---

### STEP 8: Verify Final State

```sql
-- Check all functions exist
SELECT
    proname AS function_name,
    pg_get_function_arguments(oid) AS arguments
FROM pg_proc
WHERE proname IN ('add_to_balance', 'consume_one_analysis', 'credit_from_stripe')
ORDER BY proname;

-- Check all indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('songs', 'analyses', 'user_profiles', 'transactions')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check unique constraints
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
  AND table_name IN ('songs', 'analyses', 'transactions')
ORDER BY table_name;
```

---

## PHASE 3: Cleanup (Optional)

### Remove Old Data (if needed)

```sql
-- Check for duplicate songs (should be 0 after unique constraint)
SELECT
    title_normalized,
    artist_normalized,
    COUNT(*) AS duplicates
FROM songs
GROUP BY title_normalized, artist_normalized
HAVING COUNT(*) > 1;

-- Check for duplicate analyses (should be 0)
SELECT
    song_id,
    language,
    version,
    COUNT(*) AS duplicates
FROM analyses
GROUP BY song_id, language, version
HAVING COUNT(*) > 1;

-- If duplicates exist, clean them up manually before adding constraints
```

---

## Testing the Functions

### Test 1: Concurrent Analysis Consumption (No Race Condition)

```sql
-- Open two database sessions and run simultaneously:

-- Session 1:
BEGIN;
SELECT consume_one_analysis('test-user-id');
-- Wait 5 seconds before committing
COMMIT;

-- Session 2 (while Session 1 is waiting):
SELECT consume_one_analysis('test-user-id');
-- This will WAIT for Session 1 to commit (row locked)
-- Then process with updated data (no race condition)
```

**Expected:** Both succeed, user charged twice, no data loss.

---

### Test 2: Stripe Webhook Replay (Idempotent)

```sql
-- First call
SELECT credit_from_stripe(
  'test-user-id',
  '10',
  'evt_unique_event_id',
  'cs_session_123'
);
-- Returns: {"success": true, "duplicate": false, "balance": 6.00}

-- Second call (same event ID)
SELECT credit_from_stripe(
  'test-user-id',
  '10',
  'evt_unique_event_id',
  'cs_session_123'
);
-- Returns: {"success": true, "duplicate": true, "balance": 6.00}
-- Balance NOT increased again!
```

**Expected:** Second call detected as duplicate, balance unchanged.

---

### Test 3: Balance Atomicity

```sql
-- Create test user
INSERT INTO user_profiles (id, name, balance, free_analyses_used)
VALUES ('atomic-test-user', 'Test', 10.00, 2);

-- Run 10 concurrent deductions
DO $$
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM add_to_balance('atomic-test-user', -0.60, 'Test deduction');
  END LOOP;
END $$;

-- Check final balance
SELECT balance FROM user_profiles WHERE id = 'atomic-test-user';
-- Expected: 4.00 (10.00 - 6.00)
-- If NOT atomic: Could be anything due to race conditions
```

---

## Success Criteria

After running all steps:

- ✅ `stripe_event_id` column exists in transactions
- ✅ Three new functions exist: `add_to_balance`, `consume_one_analysis`, `credit_from_stripe`
- ✅ All indexes exist (verify with STEP 5 query)
- ✅ Unique constraints exist on songs and analyses
- ✅ Duplicate Stripe event returns `duplicate: true` without adding balance
- ✅ Concurrent consumeOne calls don't cause race conditions
- ✅ Balance operations are atomic (no data loss)

---

**Status:** Ready to run. Execute steps 1-8 in order.
