-- ####################################################################
-- SUPERADO (2026-08-29) — NÃO EXECUTAR.
-- O release_reservation vivo em produção é o aplicado por
-- migrations/tarefa2_item1_release_reservation.sql (verificado em
-- 29/08/2026: 1 overload, diretiva/reason/refund-insert presentes, sem
-- catch genérico, ACL postgres+service_role; teste funcional
-- reserve→release neutro com linha 'refund' no extrato). Espelho do
-- corpo vivo: db/functions/release_reservation.sql.
-- Se este arquivo rodar, o §2 abaixo SOBRESCREVERIA a versão corrente
-- por um corpo anterior, regredindo três coisas: (a) não preenche a
-- coluna `reason` (enum); (b) snapshot do extrato com CASE só-'paid',
-- divergente do IF do reembolso; (c) reintroduz o EXCEPTION WHEN OTHERS
-- externo (SELECT FALSE, SQLERRM) — o erro silencioso que escondeu o
-- bug original por meses. Mantido apenas como registro histórico
-- (inclui os corpos dos reapers e o racional do drop-all da época).
-- ####################################################################
--
-- Credit release path: rebuild from zero — drop every overload of
-- release_reservation AND the two reapers, recreate ONE canonical body
-- each, lock permissions to the worker's role.
-- (25 Aug 2026, v2. GATED: run only after Roberto's approval — SQL Editor.)
--
-- Why: migrations/credit_refund_history.sql reported "Success" on 25 Aug,
-- but the same-day verification (reserve → release 'failed' inside a DO
-- block) still got `column reference "free_remaining" is ambiguous` from
-- the live release_reservation — the executing body has no
-- #variable_conflict and never reaches the refund INSERT. CREATE OR
-- REPLACE only replaces a function whose identity-argument TYPES match
-- exactly; any drift silently creates a second overload and "Success"
-- means "created a duplicate". A duplicate also breaks the worker:
-- PostgREST resolves /rpc/<name> by named params, and two candidates
-- accepting the same names yield an ambiguity error on every call.
-- The reapers' REPLACE probably worked (their signatures matched the
-- 21 Aug extraction), but after one silent no-op nobody trusts "Success":
-- both get the same drop-all + recreate treatment — if they were fine,
-- recreation is a no-op; if they too gained duplicates, the every-5-min
-- cron is failing on PostgREST ambiguity and this fixes it.
--
-- credits.total: GENERATED ALWAYS AS (purchased + free_remaining) STORED
-- (schema_reference.sql). Confirmed present in the live DB behaviorally:
-- reserve_credit (SELECTs total) returned success=true in the 25 Aug DO
-- test, and confirm_reservation (reads c.total) works in production.
-- The bodies below keep using c.total.
--
-- Permissions: run the PRE-ACL query (see §5 of the gate report) BEFORE
-- this migration and keep the output. The lockdown below assumes the
-- worker-only reality of the code (all calls go through callRpc with the
-- service key → service_role): EXECUTE revoked from PUBLIC/anon/
-- authenticated, granted to service_role. Tightening is allowed, opening
-- is not — if the pre-ACL output shows anon/authenticated as grantees
-- somewhere, STOP and review before running.
--
-- Everything runs in ONE transaction: the worker never observes a window
-- without the functions. Idempotent: re-running drops and recreates.

BEGIN;

-- ============================================================
-- 1. Drop every overload of the three functions, any signature
-- ============================================================
DO $do$
DECLARE
  v_fn RECORD;
BEGIN
  FOR v_fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('release_reservation',
                        'cleanup_stale_reservations',
                        'cleanup_user_stale_reservations')
  LOOP
    EXECUTE format('DROP FUNCTION public.%I(%s)', v_fn.proname, v_fn.args);
    RAISE NOTICE 'dropped: %(%)', v_fn.proname, v_fn.args;
  END LOOP;
END $do$;

-- ============================================================
-- 2. release_reservation — the one canonical function.
-- Column references qualified via alias (correct even WITHOUT the
-- directive); #variable_conflict kept as a second belt; best-effort
-- refund line in credit_history.
-- ============================================================
CREATE FUNCTION public.release_reservation(p_reservation_id uuid, p_reason character varying DEFAULT 'analysis_failed'::character varying, p_analysis_id uuid DEFAULT NULL::uuid)
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
  SELECT r.user_id, r.credit_type, r.status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations r
  WHERE r.id = p_reservation_id
  FOR UPDATE;
  -- Check if reservation exists
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;
  -- Check if already released
  IF v_reservation_status = 'released' THEN
    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
    FROM credits c WHERE c.user_id = v_user_id;
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
    UPDATE credits c
    SET free_remaining = c.free_remaining + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  ELSE
    UPDATE credits c
    SET purchased = c.purchased + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  END IF;
  -- Mark reservation as released
  UPDATE credit_reservations r
  SET status = 'released',
      release_reason = p_reason,
      released_at = NOW(),
      analysis_id = p_analysis_id
  WHERE r.id = p_reservation_id;
  -- Get updated balance for response
  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;
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
-- 3. cleanup_stale_reservations — global reaper (cron, every 5 min)
-- ============================================================
CREATE FUNCTION public.cleanup_stale_reservations(p_max_age_minutes integer DEFAULT 5)
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
    SELECT cr.id, cr.user_id, cr.credit_type
    FROM credit_reservations cr
    WHERE cr.status = 'pending'
      AND cr.created_at < NOW() - (p_max_age_minutes || ' minutes')::INTERVAL
    FOR UPDATE SKIP LOCKED
  LOOP
    IF v_r.credit_type = 'free' THEN
      UPDATE credits c
      SET free_remaining = c.free_remaining + 1,
          updated_at = NOW()
      WHERE c.user_id = v_r.user_id;
    ELSE
      UPDATE credits c
      SET purchased = c.purchased + 1,
          updated_at = NOW()
      WHERE c.user_id = v_r.user_id;
    END IF;

    UPDATE credit_reservations cr
    SET status = 'released',
        released_at = NOW(),
        release_reason = 'timeout'
    WHERE cr.id = v_r.id;

    -- Statement line for the refund. Best-effort: never blocks the sweep.
    BEGIN
      SELECT c.total, c.purchased, c.free_remaining
      INTO v_total, v_purchased, v_free
      FROM credits c
      WHERE c.user_id = v_r.user_id;
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
-- 4. cleanup_user_stale_reservations — user-scoped reaper
-- ============================================================
CREATE FUNCTION public.cleanup_user_stale_reservations(p_user_id uuid, p_age_minutes integer DEFAULT 5)
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
  FOR v_reservation IN
    SELECT cr.id, cr.credit_type
    FROM credit_reservations cr
    WHERE cr.user_id = p_user_id
      AND cr.status = 'pending'
      AND cr.created_at < NOW() - (p_age_minutes || ' minutes')::INTERVAL
    FOR UPDATE
  LOOP
    IF v_reservation.credit_type = 'free' THEN
      UPDATE credits c
      SET free_remaining = c.free_remaining + 1,
          updated_at = NOW()
      WHERE c.user_id = p_user_id;
    ELSE
      UPDATE credits c
      SET purchased = c.purchased + 1,
          updated_at = NOW()
      WHERE c.user_id = p_user_id;
    END IF;

    UPDATE credit_reservations cr
    SET status = 'released',
        release_reason = 'user_timeout_cleanup',
        released_at = NOW()
    WHERE cr.id = v_reservation.id;

    -- Statement line for the refund. Best-effort: never blocks the sweep.
    BEGIN
      SELECT c.total, c.purchased, c.free_remaining
      INTO v_total, v_purchased, v_free
      FROM credits c
      WHERE c.user_id = p_user_id;
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

  SELECT c.total INTO v_new_total
  FROM credits c
  WHERE c.user_id = p_user_id;

  RETURN QUERY SELECT
    v_released_count,
    COALESCE(v_new_total, 0),
    format('Released %s reservations for user', v_released_count)::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 0, 0, SQLERRM::TEXT;
END;
$function$;

-- ============================================================
-- 5. Permissions: worker-only (service_role). Tighten, never open.
-- A fresh CREATE grants EXECUTE to PUBLIC by default — remove that,
-- leave owner + service_role. If the PRE-ACL query showed other
-- grantees that something depends on, stop and review before running.
-- ============================================================
REVOKE ALL ON FUNCTION public.release_reservation(uuid, character varying, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_stale_reservations(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_user_stale_reservations(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid, character varying, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_reservations(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_user_stale_reservations(uuid, integer) TO service_role;

COMMIT;

-- PostgREST schema cache: Supabase reloads on DDL automatically; this is
-- the manual nudge in case the worker sees a transient 404 on the RPC.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 6. Verification — LAST statement so the SQL Editor displays it.
-- Expected: exactly 3 rows, overloads = 1 in each, tem_diretiva = true
-- on release_reservation, tem_refund_insert = true on all three, acl
-- showing owner + service_role only (no PUBLIC/anon/authenticated).
-- ============================================================
SELECT p.proname AS funcao,
       count(*) OVER (PARTITION BY p.proname) AS overloads,
       pg_get_function_identity_arguments(p.oid) AS assinatura,
       pg_get_functiondef(p.oid) ~ '#variable_conflict use_column' AS tem_diretiva,
       pg_get_functiondef(p.oid) ~ 'refund history insert failed'  AS tem_refund_insert,
       p.proacl AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('release_reservation',
                    'cleanup_stale_reservations',
                    'cleanup_user_stale_reservations')
ORDER BY p.proname;
