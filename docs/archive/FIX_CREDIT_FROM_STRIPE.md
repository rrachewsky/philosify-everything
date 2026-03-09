# Fix credit_from_stripe() Function - Use Correct Transaction Type

The issue is that we used `type = 'purchase'` but the allowed types are likely:
- `'deposit'` - for adding credits
- `'analysis'` - for consuming credits
- `'refund'` - for refunding credits
- `'auto_recharge'` - for automatic recharges

## Fixed Function

```sql
-- Drop old version
DROP FUNCTION IF EXISTS credit_from_stripe(UUID, NUMERIC, TEXT, JSONB);

-- Create corrected version with 'deposit' instead of 'purchase'
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

  -- Record transaction with event ID (use 'deposit' not 'purchase')
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
    'deposit',  -- FIXED: was 'purchase', now 'deposit'
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

-- Test (should succeed now)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  6.00,
  'evt_test_fixed_123',
  '{"tier": "10"}'::jsonb
);

-- Test again (should return duplicate: true)
SELECT credit_from_stripe(
  (SELECT id FROM user_profiles LIMIT 1),
  6.00,
  'evt_test_fixed_123',
  '{"tier": "10"}'::jsonb
);

-- Verify transaction was created
SELECT id, user_id, amount, type, description, stripe_event_id
FROM transactions
WHERE stripe_event_id = 'evt_test_fixed_123';
```

## What Changed

| Before | After |
|--------|-------|
| `type = 'purchase'` ❌ | `type = 'deposit'` ✅ |

This matches the existing `add_credits()` function which uses `'deposit'` for adding credits.
