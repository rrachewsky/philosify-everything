-- Tarefa 2, item 1 — release_reservation: corpo canônico único.
-- (28 Aug 2026. Aprovado pelo Bob após pré-flight 0a–0g em produção.)
--
-- Substitui o corpo vivo quebrado (toda chamada morria em
-- `column reference "free_remaining" is ambiguous`, capturado pelo
-- EXCEPTION WHEN OTHERS e devolvido como success=false — nenhum
-- reembolso do worker funcionava; reservas ficavam presas até o reaper).
--
-- Resultados do pré-flight que este script assume (27-28/08, SQL Editor
-- de produção, fingerprint 0a conferido):
--   0b: enum reservation_reason = success|cached|failed|timeout
--   0c: credit_history.analysis_id (uuid) existe; status é varchar
--   0d: credit_history.type é enum transaction_type com label 'refund'
--       já presente → nenhum ALTER TYPE necessário
--   0e: sem CHECKs em credit_history; FK analysis_id → analyses(id)
--       ON DELETE SET NULL (INSERT de histórico é best-effort: um
--       analysis_id de outra tabela vira WARNING, nunca bloqueia o refund)
--   0f: credits.total é GENERATED ALWAYS AS (purchased + free_remaining)
--       → Variante A: o UPDATE de reembolso NÃO toca total
--   0g: ACL prévia = postgres + service_role → o REVOKE abaixo só formaliza
--
-- Mudanças vs. corpo-alvo antigo (db/functions/release_reservation.sql):
--   1. Referências qualificadas por alias (c./r.) + #variable_conflict
--      use_column como segundo cinto — elimina a ambiguidade.
--   2. Preenche a coluna reason (enum) além de release_reason (varchar):
--      cached|cached_review|already_owned → cached; %timeout% → timeout
--      (cobre user_timeout_cleanup); resto → failed.
--   3. Snapshot do extrato consistente com o IF do reembolso
--      (qualquer credit_type não-'free' conta como purchased).
--   4. SEM EXCEPTION WHEN OTHERS externo: erro real de SQL aborta o RPC,
--      PostgREST devolve 400 com o SQLERRM, callRpc lança e
--      api/src/credits/release.js:45 loga a mensagem completa. Erro
--      silencioso foi o que escondeu este bug por meses.
--
-- Único chamador do RPC: api/src/credits/release.js:22 via callRpc com
-- SUPABASE_SERVICE_KEY (utils/supabase.js:62,204) → service_role.
--
-- Tudo em UMA transação: o worker nunca observa janela sem a função.
-- Idempotente: re-rodar dropa e recria.

BEGIN;

-- ============================================================
-- 1. Drop de TODOS os overloads, qualquer assinatura.
-- CREATE OR REPLACE não conserta duplicata — lição de 25/08: drift de
-- assinatura fez o "Success" criar um segundo overload em vez de
-- substituir, e o PostgREST passou a falhar por ambiguidade.
-- ============================================================
DO $do$
DECLARE
  v_fn RECORD;
BEGIN
  FOR v_fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'release_reservation'
  LOOP
    EXECUTE format('DROP FUNCTION public.%I(%s)', v_fn.proname, v_fn.args);
    RAISE NOTICE 'dropped: %(%)', v_fn.proname, v_fn.args;
  END LOOP;
END $do$;

-- ============================================================
-- 2. release_reservation — corpo canônico (Variante A: total é gerada)
-- ============================================================
CREATE FUNCTION public.release_reservation(
  p_reservation_id uuid,
  p_reason character varying DEFAULT 'analysis_failed'::character varying,
  p_analysis_id uuid DEFAULT NULL::uuid
)
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
  v_reason reservation_reason;
BEGIN
  -- Mapear p_reason (texto livre dos handlers) para o enum da coluna reason
  v_reason := CASE
    WHEN p_reason IN ('cached', 'cached_review', 'already_owned') THEN 'cached'::reservation_reason
    WHEN p_reason LIKE '%timeout%'                                THEN 'timeout'::reservation_reason
    ELSE 'failed'::reservation_reason
  END;

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

  -- Idempotente: já liberada devolve sucesso com o saldo atual
  IF v_reservation_status = 'released' THEN
    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
    FROM credits c WHERE c.user_id = v_user_id;
    RETURN QUERY SELECT TRUE, 'Already released'::TEXT, v_total, v_purchased, v_free;
    RETURN;
  END IF;

  -- Confirmada não pode ser liberada
  IF v_reservation_status = 'confirmed' THEN
    RETURN QUERY SELECT FALSE, 'Cannot release confirmed reservation'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  -- Reembolso. credits.total é GENERATED (purchased + free_remaining) — não tocar.
  IF v_credit_type = 'free' THEN
    UPDATE credits c
    SET free_remaining = c.free_remaining + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  ELSE
    UPDATE credits c
    SET purchased = c.purchased + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  END IF;

  -- Marcar reserva como liberada, com o motivo em ambas as colunas
  UPDATE credit_reservations r
  SET status = 'released',
      reason = v_reason,
      release_reason = p_reason,
      released_at = NOW(),
      analysis_id = p_analysis_id
  WHERE r.id = p_reservation_id;

  -- Saldo atualizado para a resposta
  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;

  -- Linha de extrato do reembolso. Best-effort: nunca bloqueia o refund;
  -- falha vira WARNING nos Postgres Logs do Supabase.
  BEGIN
    INSERT INTO credit_history (
      user_id, type, amount,
      purchased_before, purchased_after,
      free_before, free_after,
      total_before, total_after,
      status, metadata, analysis_id
    ) VALUES (
      v_user_id, 'refund', 1,
      v_purchased - (CASE WHEN v_credit_type = 'free' THEN 0 ELSE 1 END), v_purchased,
      v_free      - (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
      v_total - 1, v_total,
      'completed',
      jsonb_build_object(
        'reservation_id', p_reservation_id,
        'reason', p_reason,
        'mapped_reason', v_reason::text,
        'credit_type', v_credit_type
      ),
      p_analysis_id
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'release_reservation: refund history insert failed for %: %', p_reservation_id, SQLERRM;
  END;

  RETURN QUERY SELECT TRUE, 'Credit refunded'::TEXT, v_total, v_purchased, v_free;
END;
$function$;
-- SEM "EXCEPTION WHEN OTHERS" externo — intencional (ver cabeçalho, item 4).

-- ============================================================
-- 3. ACL worker-only (0g: já era postgres + service_role; isto formaliza)
-- ============================================================
REVOKE ALL ON FUNCTION public.release_reservation(uuid, character varying, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_reservation(uuid, character varying, uuid) TO service_role;

COMMIT;

-- Supabase recarrega o schema do PostgREST em DDL automaticamente;
-- este é o empurrão manual caso o worker veja um 404 transitório no RPC.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 4. Verificação estrutural — ÚLTIMA query, para o SQL Editor exibir.
-- Esperado: exatamente 1 linha, overloads=1, tem_diretiva=t,
-- preenche_reason=t, tem_refund_insert=t, sem_catch_generico=t,
-- acl mostrando só owner + service_role (sem PUBLIC/anon/authenticated).
-- ============================================================
SELECT p.proname AS funcao,
       count(*) OVER () AS overloads,
       pg_get_function_identity_arguments(p.oid) AS assinatura,
       pg_get_functiondef(p.oid) ~  '#variable_conflict use_column' AS tem_diretiva,
       pg_get_functiondef(p.oid) ~  'reason = v_reason'             AS preenche_reason,
       pg_get_functiondef(p.oid) ~  'refund history insert failed'  AS tem_refund_insert,
       pg_get_functiondef(p.oid) !~ 'SELECT FALSE, SQLERRM'         AS sem_catch_generico,
       p.proacl AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'release_reservation';
