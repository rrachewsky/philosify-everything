-- Extracted from live Supabase via pg_get_functiondef (db/extract_credit_functions.sql), 21 Aug 2026.
-- The database is the executing copy; this file exists so the repo is no longer blind to it.
-- Unlike cleanup_stale_reservations (the global reaper), this one DOES refund.

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
