-- Extracted from live Supabase via pg_get_functiondef (db/extract_credit_functions.sql), 21 Aug 2026.
-- The database is the executing copy; this file exists so the repo is no longer blind to it.
--
-- Divergences from its siblings, recorded as found (NOT fixed here):
-- * no SECURITY DEFINER and no pinned search_path — the only credit function
--   without both;
-- * p_analysis_id is TEXT here, UUID in release_reservation;
-- * the credit_history INSERT writes analysis_id only into metadata jsonb,
--   never into the analysis_id column (added 21 Aug) — the worker PATCHes the
--   row after the RPC (api/src/credits/confirm.js). Moving the write into
--   this INSERT is the clean follow-up, gated like any live-SQL change.

CREATE OR REPLACE FUNCTION public.confirm_reservation(p_reservation_id uuid, p_analysis_id text)
 RETURNS TABLE(success boolean, message text, total integer, purchased integer, free integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_user_id UUID;
  v_credit_type VARCHAR(10);
  v_reservation_status VARCHAR(20);
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
BEGIN
  SELECT user_id, credit_type, status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  IF v_reservation_status = 'confirmed' THEN
    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
    FROM credits c WHERE c.user_id = v_user_id;
    RETURN QUERY SELECT TRUE, 'Already confirmed'::TEXT, v_total, v_purchased, v_free;
    RETURN;
  END IF;

  IF v_reservation_status = 'released' THEN
    RETURN QUERY SELECT FALSE, 'Reservation was already released'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  UPDATE credit_reservations
  SET status = 'confirmed',
      analysis_id = p_analysis_id,
      confirmed_at = NOW()
  WHERE id = p_reservation_id;

  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;

  INSERT INTO credit_history (
    user_id, type, amount,
    purchased_before, purchased_after,
    free_before, free_after,
    total_before, total_after,
    status, metadata
  ) VALUES (
    v_user_id, 'analysis', -1,
    v_purchased + (CASE WHEN v_credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
    v_free + (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
    v_total + 1, v_total,
    'completed',
    jsonb_build_object('reservation_id', p_reservation_id, 'analysis_id', p_analysis_id, 'credit_type', v_credit_type)
  );

  RETURN QUERY SELECT TRUE, 'Reservation confirmed'::TEXT, v_total, v_purchased, v_free;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT, 0, 0, 0;
END;
$function$
