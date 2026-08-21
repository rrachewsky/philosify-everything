-- Extracted from live Supabase via pg_get_functiondef (db/extract_credit_functions.sql), 21 Aug 2026.
-- The database is the executing copy; this file exists so the repo is no longer blind to it.

CREATE OR REPLACE FUNCTION public.reserve_credit(p_user_id uuid)
 RETURNS TABLE(success boolean, reservation_id uuid, used_free boolean, remaining integer, credits integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
  v_used_free BOOLEAN := FALSE;
  v_reservation_id UUID;
  v_lock_key BIGINT;
BEGIN
  -- Advisory lock: prevents concurrent reservations for same user
  v_lock_key := ('x' || substr(p_user_id::text, 1, 8))::bit(32)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);
  -- Lock row for update (belt + suspenders with advisory lock)
  SELECT purchased, free_remaining, total
  INTO v_purchased, v_free, v_total
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  -- Check if user has any credits
  IF v_total IS NULL OR v_total = 0 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, FALSE, 0, 0, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;
  -- Determine which credit type to use (free first, then paid)
  IF v_free > 0 THEN
    v_used_free := TRUE;
  ELSE
    v_used_free := FALSE;
  END IF;
  -- Create reservation record
  INSERT INTO credit_reservations (
    user_id,
    credit_type,
    status
  ) VALUES (
    p_user_id,
    CASE WHEN v_used_free THEN 'free' ELSE 'paid' END,
    'pending'
  ) RETURNING id INTO v_reservation_id;
  -- Deduct credit
  IF v_used_free THEN
    UPDATE credits
    SET free_remaining = free_remaining - 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    v_free := v_free - 1;
  ELSE
    UPDATE credits
    SET purchased = purchased - 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    v_purchased := v_purchased - 1;
  END IF;
  -- Return success with reservation details
  RETURN QUERY SELECT
    TRUE,
    v_reservation_id,
    v_used_free,
    v_free + v_purchased,
    v_purchased,
    'Credit reserved'::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, FALSE, 0, 0, SQLERRM::TEXT;
END;
$function$
