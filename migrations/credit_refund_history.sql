-- Refunds visible in the statement: release_reservation and both reapers
-- write a type='refund' row to credit_history when returning a credit.
-- (25 Aug 2026. GATED: run only after Roberto's approval — SQL Editor.)
--
-- Until now every release path moved the balance back silently (release.js:
-- "Does NOT write to credit_history — internal audit only") — observed on
-- 25 Aug when the reaper returned 3 credits and the balance jumped 26→29
-- with no statement line. Each INSERT is best-effort inside its own
-- exception block: a history failure can never undo or block the refund.
-- Snapshot pattern mirrors confirm_reservation: read the post-refund
-- balance, derive "before" by subtracting the refunded credit. type
-- 'refund' is valid under both the original CHECK and the live one.
--
-- NOTE: the release_reservation body here INCLUDES the still-gated 23 Aug
-- fix (#variable_conflict use_column, migrations/
-- release_reservation_variable_conflict.sql). If that migration has not
-- been run yet, this one supersedes it — running this alone applies both
-- changes. If it HAS been run, this keeps the directive intact.

-- ============================================================
-- 1. release_reservation — direct releases (failed / cached)
-- ============================================================
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
$function$;

-- ============================================================
-- 2. cleanup_stale_reservations — global reaper (cron, every 5 min)
-- ============================================================
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
$function$;

-- ============================================================
-- 3. cleanup_user_stale_reservations — user-scoped reaper
-- ============================================================
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
$function$;
