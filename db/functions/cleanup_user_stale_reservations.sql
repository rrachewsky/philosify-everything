-- Mirror of the live Supabase function. Applied 25 Aug 2026 via
-- migrations/credit_refund_history.sql (Roberto, SQL Editor: "Success");
-- previous body extracted 21 Aug (already refunded, unlike the pre-21-Aug
-- global reaper). Change on 25 Aug: best-effort type='refund' INSERT into
-- credit_history per reaped reservation, in its own exception sub-block —
-- a history failure raises a WARNING and never blocks the sweep or undoes
-- the refund.

CREATE OR REPLACE FUNCTION public.cleanup_user_stale_reservations(p_user_id uuid, p_age_minutes integer DEFAULT 5)
 RETURNS TABLE(released_count integer, new_total integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_released_count INTEGER := 0;
  v_reservation RECORD;
  v_new_total INTEGER;
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
BEGIN
  -- Find and release stale reservations for this user
  FOR v_reservation IN
    SELECT id, credit_type
    FROM credit_reservations
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND created_at < NOW() - (p_age_minutes || ' minutes')::INTERVAL
    FOR UPDATE
  LOOP
    -- Refund credit
    IF v_reservation.credit_type = 'free' THEN
      UPDATE credits
      SET free_remaining = free_remaining + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE credits
      SET purchased = purchased + 1,
          updated_at = NOW()
      WHERE user_id = p_user_id;
    END IF;

    -- Mark as released
    UPDATE credit_reservations
    SET status = 'released',
        release_reason = 'user_timeout_cleanup',
        released_at = NOW()
    WHERE id = v_reservation.id;

    -- Statement line for the refund. Best-effort: never blocks the sweep.
    BEGIN
      SELECT total, purchased, free_remaining
      INTO v_total, v_purchased, v_free
      FROM credits
      WHERE user_id = p_user_id;
      INSERT INTO credit_history (
        user_id, type, amount,
        purchased_before, purchased_after,
        free_before, free_after,
        total_before, total_after,
        status, metadata
      ) VALUES (
        p_user_id, 'refund', 1,
        v_purchased - (CASE WHEN v_reservation.credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
        v_free - (CASE WHEN v_reservation.credit_type = 'free' THEN 1 ELSE 0 END), v_free,
        v_total - 1, v_total,
        'completed',
        jsonb_build_object('reservation_id', v_reservation.id, 'reason', 'user_timeout_cleanup', 'credit_type', v_reservation.credit_type)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'refund history insert failed for reservation %: %', v_reservation.id, SQLERRM;
    END;

    v_released_count := v_released_count + 1;
  END LOOP;

  -- Get new total
  SELECT total INTO v_new_total
  FROM credits
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT
    v_released_count,
    COALESCE(v_new_total, 0),
    format('Released %s reservations for user', v_released_count)::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 0, 0, SQLERRM::TEXT;
END;
$function$
