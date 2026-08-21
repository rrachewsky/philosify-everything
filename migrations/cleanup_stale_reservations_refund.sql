-- cleanup_stale_reservations: refund the credit when reaping, like every
-- other release path. (21 Aug 2026. GATED: run only after Roberto's approval.)
--
-- Finding 6 of the cleanup order, promoted from theory to observed harm:
-- on 21 Aug the confirm RPC bug left 4 reservations pending and this
-- reaper (cron, every 5 min, >10 min old) marked them released/timeout
-- WITHOUT refunding — the credits vanished with an audit trail that looks
-- like a refund. release_reservation and cleanup_user_stale_reservations
-- both refund; this brings the global reaper in line.
-- FOR UPDATE SKIP LOCKED so the reaper never blocks behind an in-flight
-- confirm holding the row lock — the next sweep gets it.

CREATE OR REPLACE FUNCTION public.cleanup_stale_reservations(p_max_age_minutes integer DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_r RECORD;
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

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$
