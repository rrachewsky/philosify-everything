-- ============================================================================
-- 009_cleanup_stale_reservations.sql
-- ============================================================================
-- Purpose: Guarantee the stale-reservation reaper has a working DB function.
--
-- Background: /api/analyze reserves a credit (reserve_credit), then confirms or
-- releases it. On a hard isolate teardown (wall-time exhaustion, etc.) the in-request
-- release/finally may not run, leaving a 'pending' reservation that has already
-- decremented the user's balance. A cron job (every 5 min) calls this function to
-- release reservations older than N minutes and refund the credit.
--
-- This function was applied directly in Supabase historically and is NOT tracked in
-- the repo, so its existence/signature cannot be verified from code. Pentest
-- remediation (Finding 2) depends on it. This migration makes it deterministic.
--
-- HOW TO APPLY (Supabase dashboard > SQL Editor):
--   1. Run PART 1 (diagnostic, read-only) first. It tells you whether the function
--      already exists and under which argument name.
--   2. Run PART 2 to (re)create the canonical function + grant. Safe to run even if
--      a version already exists — CREATE OR REPLACE installs this known-correct body.
--   3. Run PART 3 (read-only) to preview what the reaper WOULD release right now.
--
-- Semantics (mirrors release_reservation, minus credit_history — releases are internal
-- audit only): flip stale 'pending' rows to 'released' and refund the credit to the
-- correct bucket (free_remaining for 'free', purchased for 'paid'). Idempotent and
-- concurrency-safe: the UPDATE ... WHERE status='pending' locks each row, so a second
-- overlapping run cannot double-refund an already-released reservation.
-- ============================================================================


-- ============================================================================
-- PART 1 — DIAGNOSTIC (read-only). Run this FIRST.
-- Shows the reservation-related functions that currently exist and their argument
-- signatures. Expect to see cleanup_stale_reservations(p_age_minutes integer) after
-- PART 2. Before PART 2 it may be absent, or present with a different arg name.
-- ============================================================================
SELECT p.proname                              AS function_name,
       pg_get_function_arguments(p.oid)       AS arguments,
       pg_get_function_result(p.oid)          AS returns
FROM   pg_proc p
JOIN   pg_namespace n ON n.oid = p.pronamespace
WHERE  n.nspname = 'public'
  AND  p.proname IN (
         'cleanup_stale_reservations',
         'cleanup_user_stale_reservations',
         'reserve_credit',
         'confirm_reservation',
         'release_reservation'
       )
ORDER BY p.proname;


-- ============================================================================
-- PART 2 — CREATE / REPLACE the canonical reaper. Run this SECOND.
-- Canonical argument name is p_age_minutes (matches TECHNICAL_AUDIT.md and the
-- reaper's preferred call). The reaper also falls back to p_max_age_minutes, so
-- either name works, but this is the one it tries first after this migration.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_reservations(p_age_minutes INTEGER DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_released_ids UUID[];
  v_count        INTEGER;
BEGIN
  WITH released AS (
    -- Atomically claim + release stale pending reservations. The row lock taken by
    -- this UPDATE prevents a concurrent run from processing the same reservation.
    UPDATE credit_reservations r
    SET    status         = 'released',
           released_at    = NOW(),
           release_reason = 'timeout'
    WHERE  r.status = 'pending'
      AND  r.created_at < NOW() - make_interval(mins => GREATEST(p_age_minutes, 0))
    RETURNING r.id, r.user_id, r.credit_type
  ),
  refund_free AS (
    -- Refund free credits, capped at the free_remaining <= 2 CHECK so one anomalous
    -- row can never abort the whole batch.
    UPDATE credits c
    SET    free_remaining = LEAST(c.free_remaining + agg.n, 2),
           updated_at     = NOW()
    FROM  (SELECT user_id, COUNT(*)::INT AS n
           FROM   released
           WHERE  credit_type = 'free'
           GROUP  BY user_id) agg
    WHERE  c.user_id = agg.user_id
    RETURNING c.user_id
  ),
  refund_paid AS (
    UPDATE credits c
    SET    purchased  = c.purchased + agg.n,
           updated_at = NOW()
    FROM  (SELECT user_id, COUNT(*)::INT AS n
           FROM   released
           WHERE  credit_type = 'paid'
           GROUP  BY user_id) agg
    WHERE  c.user_id = agg.user_id
    RETURNING c.user_id
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::UUID[]),
         COUNT(*)::INT
  INTO   v_released_ids, v_count
  FROM   released;

  RETURN jsonb_build_object(
    'success',        true,
    'released_count', COALESCE(v_count, 0),
    'released_ids',   COALESCE(v_released_ids, ARRAY[]::UUID[])
  );
END;
$$;

-- Grants are dropped by CREATE OR REPLACE, so re-apply. The Worker calls this via the
-- service_role key; service_role must be able to execute it.
GRANT EXECUTE ON FUNCTION public.cleanup_stale_reservations(INTEGER) TO service_role;


-- ============================================================================
-- PART 3 — DRY RUN (read-only). Run this THIRD to preview impact.
-- Lists reservations the reaper would release right now (older than 10 minutes).
-- If this returns rows, those users are currently down a credit until the next
-- cron pass. Zero rows = nothing stale = healthy.
-- ============================================================================
SELECT id,
       user_id,
       credit_type,
       created_at,
       ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60.0, 1) AS age_minutes
FROM   credit_reservations
WHERE  status = 'pending'
  AND  created_at < NOW() - INTERVAL '10 minutes'
ORDER  BY created_at;
