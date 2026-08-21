-- confirm_reservation: cast p_analysis_id before assigning it to a UUID
-- column, and write analysis_id into the credit_history INSERT.
-- (21 Aug 2026. GATED: run only after Roberto's approval.)
--
-- Production tail, 21 Aug: every confirm — panels AND regular analyses,
-- two different users — failed inside the RPC with
--   column "analysis_id" is of type uuid but expression is of type text
-- The UPDATE on credit_reservations assigns the TEXT parameter to a UUID
-- column with no cast; PostgreSQL refuses at statement level, the
-- EXCEPTION handler returns success=false, the reservation stays pending,
-- and the no-refund global reaper (cleanup_stale_reservations) then eats
-- the credit. The worker always passes either NULL or a valid UUID string
-- (confirm.js regex-guards it), so ::uuid is safe.
--
-- Body identical to db/functions/confirm_reservation.sql except:
--   * p_analysis_id::uuid in the credit_reservations UPDATE;
--   * analysis_id added to the credit_history INSERT (the 4.2 column),
--     which makes the worker-side PATCH redundant going forward — it
--     stays as a harmless no-op-diff belt.
-- Parameter stays TEXT: changing it to UUID would CREATE a second
-- overload instead of replacing, and PostgREST RPC calls would become
-- ambiguous.

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
      analysis_id = p_analysis_id::uuid,
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
    status, metadata, analysis_id
  ) VALUES (
    v_user_id, 'analysis', -1,
    v_purchased + (CASE WHEN v_credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
    v_free + (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
    v_total + 1, v_total,
    'completed',
    jsonb_build_object('reservation_id', p_reservation_id, 'analysis_id', p_analysis_id, 'credit_type', v_credit_type),
    p_analysis_id::uuid
  );

  RETURN QUERY SELECT TRUE, 'Reservation confirmed'::TEXT, v_total, v_purchased, v_free;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, SQLERRM::TEXT, 0, 0, 0;
END;
$function$
