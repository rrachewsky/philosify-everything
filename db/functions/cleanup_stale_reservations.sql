-- Extracted from live Supabase via pg_get_functiondef (db/extract_credit_functions.sql), 21 Aug 2026.
-- The database is the executing copy; this file exists so the repo is no longer blind to it.
--
-- FINDING (21 Aug, recorded as found, NOT fixed): this reaper marks pending
-- reservations 'released' WITHOUT refunding the credit — no UPDATE on the
-- credits table, unlike release_reservation and
-- cleanup_user_stale_reservations, which both refund. A reservation that
-- times out through THIS path (worker died between reserve and
-- confirm/release) silently costs the user 1 credit with no analysis.
-- Any change is live-SQL and gated on Roberto.

CREATE OR REPLACE FUNCTION public.cleanup_stale_reservations(p_max_age_minutes integer DEFAULT 5)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cleaned_count INTEGER;
BEGIN
  WITH released AS (
    UPDATE credit_reservations
    SET status = 'released',
        released_at = NOW(),
        release_reason = 'timeout'
    WHERE status = 'pending'
      AND created_at < NOW() - (p_max_age_minutes || ' minutes')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) INTO cleaned_count FROM released;

  RETURN cleaned_count;
END;
$function$
