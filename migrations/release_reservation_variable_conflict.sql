-- release_reservation: resolve the column/OUT-parameter name collision.
-- (23 Aug 2026. GATED: run only after Roberto's approval.)
--
-- Production tail, 23 Aug: a cached re-view release failed with
--   column reference "free_remaining" is ambiguous
-- The function RETURNS TABLE(..., credits, free_remaining) and the body
-- references those same names as table columns — plpgsql's default
-- variable_conflict=error refuses at runtime. The refund UPDATE (free
-- branch) and the balance SELECTs all hit it, so direct releases
-- (cached re-view, failed analysis) have been failing silently — the
-- unconditional caller logs said "released", the reservation stayed
-- pending, and the pre-21-Aug reaper then ate the credit without refund.
-- confirm_reservation is immune only because its author aliased the
-- table (c.total, c.purchased...).
--
-- Fix: `#variable_conflict use_column` — inside SQL statements,
-- unqualified names resolve to table columns, which is the intent of
-- every such reference in this body. Signature and output names are
-- untouched (the worker reads new_total/credits/free_remaining).

CREATE OR REPLACE FUNCTION public.release_reservation(p_reservation_id uuid, p_reason character varying DEFAULT 'analysis_failed'::character varying, p_analysis_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(success boolean, message text, new_total integer, credits integer, free_remaining integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id UUID;
  v_credit_type VARCHAR(10);
  v_reservation_status VARCHAR(20);
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
BEGIN
  -- Get reservation details
  SELECT user_id, credit_type, status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;
  -- Check if reservation exists
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;
  -- Check if already released
  IF v_reservation_status = 'released' THEN
    SELECT total, purchased, free_remaining INTO v_total, v_purchased, v_free
    FROM credits WHERE user_id = v_user_id;
    RETURN QUERY SELECT TRUE, 'Already released'::TEXT, v_total, v_purchased, v_free;
    RETURN;
  END IF;
  -- Check if already confirmed
  IF v_reservation_status = 'confirmed' THEN
    RETURN QUERY SELECT FALSE, 'Cannot release confirmed reservation'::TEXT, 0, 0, 0;
    RETURN;
  END IF;
  -- Refund credit based on type
  IF v_credit_type = 'free' THEN
    UPDATE credits
    SET free_remaining = free_remaining + 1, updated_at = NOW()
    WHERE user_id = v_user_id;
  ELSE
    UPDATE credits
    SET purchased = purchased + 1, updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;
  -- Mark reservation as released
  UPDATE credit_reservations
  SET status = 'released',
      release_reason = p_reason,
      released_at = NOW(),
      analysis_id = p_analysis_id
  WHERE id = p_reservation_id;
  -- Get updated balance for response
  SELECT total, purchased, free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits
  WHERE user_id = v_user_id;
  RETURN QUERY SELECT TRUE, 'Credit refunded'::TEXT, v_total, v_purchased, v_free;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT, 0, 0, 0;
END;
$function$
