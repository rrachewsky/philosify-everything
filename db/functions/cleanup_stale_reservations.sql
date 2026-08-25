-- Mirror of the live Supabase function. Applied 25 Aug 2026 via
-- migrations/credit_refund_history.sql (Roberto, SQL Editor: "Success");
-- previous body (refunding, SKIP LOCKED) applied 21 Aug via
-- migrations/cleanup_stale_reservations_refund.sql. Change on 25 Aug:
-- best-effort type='refund' INSERT into credit_history per reaped
-- reservation, in its own exception sub-block — a history failure raises
-- a WARNING and never blocks the sweep or undoes the refund. Refund and
-- SKIP LOCKED behavior unchanged from 21 Aug.

CREATE OR REPLACE FUNCTION public.cleanup_stale_reservations(p_max_age_minutes integer DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_r RECORD;
  v_purchased INTEGER;
  v_free INTEGER;
  v_total INTEGER;
BEGIN
  FOR v_r IN
    SELECT id, user_id, credit_type
    FROM credit_reservations
    WHERE status = 'pending'
      AND created_at < NOW() - (p_max_age_minutes || ' minutes')::INTERVAL
    FOR UPDATE SKIP LOCKED
  LOOP
    IF v_r.credit_type = 'free' THEN
      UPDATE credits
      SET free_remaining = free_remaining + 1,
          updated_at = NOW()
      WHERE user_id = v_r.user_id;
    ELSE
      UPDATE credits
      SET purchased = purchased + 1,
          updated_at = NOW()
      WHERE user_id = v_r.user_id;
    END IF;

    UPDATE credit_reservations
    SET status = 'released',
        released_at = NOW(),
        release_reason = 'timeout'
    WHERE id = v_r.id;

    -- Statement line for the refund. Best-effort: never blocks the sweep.
    BEGIN
      SELECT total, purchased, free_remaining
      INTO v_total, v_purchased, v_free
      FROM credits
      WHERE user_id = v_r.user_id;
      INSERT INTO credit_history (
        user_id, type, amount,
        purchased_before, purchased_after,
        free_before, free_after,
        total_before, total_after,
        status, metadata
      ) VALUES (
        v_r.user_id, 'refund', 1,
        v_purchased - (CASE WHEN v_r.credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
        v_free - (CASE WHEN v_r.credit_type = 'free' THEN 1 ELSE 0 END), v_free,
        v_total - 1, v_total,
        'completed',
        jsonb_build_object('reservation_id', v_r.id, 'reason', 'timeout', 'credit_type', v_r.credit_type)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'refund history insert failed for reservation %: %', v_r.id, SQLERRM;
    END;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$
