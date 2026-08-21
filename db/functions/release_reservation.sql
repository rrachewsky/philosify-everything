-- Extracted from live Supabase via pg_get_functiondef (db/extract_credit_functions.sql), 21 Aug 2026.
-- The database is the executing copy; this file exists so the repo is no longer blind to it.
-- Note: p_analysis_id is UUID here but TEXT in confirm_reservation.

CREATE OR REPLACE FUNCTION public.release_reservation(p_reservation_id uuid, p_reason character varying DEFAULT 'analysis_failed'::character varying, p_analysis_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(success boolean, message text, new_total integer, credits integer, free_remaining integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
