-- Mirror of the live Supabase function. Applied 25 Aug 2026 via
-- migrations/credit_refund_history.sql (Roberto, SQL Editor: "Success").
-- Two changes over the 21 Aug extraction:
-- * #variable_conflict use_column — the gated 23 Aug fix (migrations/
--   release_reservation_variable_conflict.sql) rode along in the same
--   migration; direct releases (cached re-view, failed analysis) no longer
--   die at runtime on `column reference "free_remaining" is ambiguous`.
-- * Best-effort type='refund' INSERT into credit_history after the refund,
--   in its own exception sub-block — the statement now shows returned
--   credits; a history failure raises a WARNING and never blocks or
--   undoes the refund.
-- Note: p_analysis_id is UUID here but TEXT in confirm_reservation.

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
  -- Statement line for the refund. Best-effort: never blocks the refund.
  BEGIN
    INSERT INTO credit_history (
      user_id, type, amount,
      purchased_before, purchased_after,
      free_before, free_after,
      total_before, total_after,
      status, metadata, analysis_id
    ) VALUES (
      v_user_id, 'refund', 1,
      v_purchased - (CASE WHEN v_credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
      v_free - (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
      v_total - 1, v_total,
      'completed',
      jsonb_build_object('reservation_id', p_reservation_id, 'reason', p_reason, 'credit_type', v_credit_type),
      p_analysis_id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'refund history insert failed for reservation %: %', p_reservation_id, SQLERRM;
  END;
  RETURN QUERY SELECT TRUE, 'Credit refunded'::TEXT, v_total, v_purchased, v_free;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT, 0, 0, 0;
END;
$function$
