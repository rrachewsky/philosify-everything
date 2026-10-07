-- Espelho do corpo VIVO em producao. confirm_reservation v2, aplicada pelo Bob em 07/10/2026 (SQL Editor),
-- verificada: overloads = 1, 5 parametros, secdef = t, tem_diretiva = t, sem_catch = t, grava_source = t,
-- guarda_fk = t, src = 2543, ACL = postgres + service_role. Prova funcional 6/6 (TESTE 1/2 e 2/2 OK).
-- Migracao, pre-flight, verificacao, prova e rollback exato (v1 de 22/09) em new_design/CREDITOS_ETAPA2C_CONFIRM_V2_2026-10-06.md (§ 3-7).
--
-- O que mudou vs v1 (21/08, src 2114, sem definer, EXECUTE aberto a PUBLIC/anon/authenticated):
--   * p_source / p_description / p_batch_id (DEFAULT NULL) gravados em metadata; chamada de 2 args segue valida.
--   * analysis_id so vai para a FK (credit_reservations e credit_history -> analyses) quando EXISTE em analyses;
--     o id bruto fica em metadata.analysis_id. Na v1, livro/cinema/news com uuid estrangeiro estouravam a FK,
--     o catch engolia e o reaper devolvia o credito (cobranca zero nessas rotas; P4/P5 de 07/10).
--   * reason = 'success' na reserva confirmada; SECURITY DEFINER + search_path + #variable_conflict use_column.
--   * SEM EXCEPTION WHEN OTHERS externo (decisao do Bob, 06/10): erro real de SQL chega ao log do worker.
-- Unico chamador: api/src/credits/confirm.js via callRpc com service key.
-- Historico: corpo anterior aplicado em 21 Aug 2026 via migrations/confirm_reservation_cast_fix.sql.

CREATE FUNCTION public.confirm_reservation(
  p_reservation_id uuid,
  p_analysis_id    text,
  p_source         text DEFAULT NULL,
  p_description    text DEFAULT NULL,
  p_batch_id       uuid DEFAULT NULL
)
 RETURNS TABLE(success boolean, message text, total integer, purchased integer, free integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  v_user_id            UUID;
  v_credit_type        VARCHAR(10);
  v_reservation_status VARCHAR(20);
  v_purchased          INTEGER;
  v_free               INTEGER;
  v_total              INTEGER;
  v_analysis_uuid      UUID;   -- p_analysis_id quando é uuid sintaticamente
  v_analysis_fk        UUID;   -- v_analysis_uuid quando existe em analyses (FK)
BEGIN
  -- Id de análise: uuid só se tiver forma de uuid; FK só se existir em analyses.
  -- O texto bruto vai sempre para metadata.analysis_id (livro/cinema/news ligam por lá + source).
  IF p_analysis_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_analysis_uuid := p_analysis_id::uuid;
    SELECT a.id INTO v_analysis_fk FROM analyses a WHERE a.id = v_analysis_uuid;
  END IF;

  SELECT r.user_id, r.credit_type, r.status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations r
  WHERE r.id = p_reservation_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  -- Idempotente: já confirmada devolve sucesso com o saldo atual, sem nova linha
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

  UPDATE credit_reservations r
  SET status       = 'confirmed',
      reason       = 'success'::reservation_reason,
      analysis_id  = v_analysis_fk,
      confirmed_at = NOW()
  WHERE r.id = p_reservation_id;

  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;

  -- Linha de extrato do consumo. Snapshots como na v1 (decisão B de 06/10: o extrato recalcula).
  INSERT INTO credit_history (
    user_id, type, amount,
    purchased_before, purchased_after,
    free_before, free_after,
    total_before, total_after,
    status, metadata, analysis_id
  ) VALUES (
    v_user_id, 'analysis', -1,
    v_purchased + (CASE WHEN v_credit_type = 'paid' THEN 1 ELSE 0 END), v_purchased,
    v_free      + (CASE WHEN v_credit_type = 'free' THEN 1 ELSE 0 END), v_free,
    v_total + 1, v_total,
    'completed',
    jsonb_build_object(
      'reservation_id', p_reservation_id,
      'analysis_id',    p_analysis_id,
      'credit_type',    v_credit_type
    ) || jsonb_strip_nulls(jsonb_build_object(
      'source',      p_source,
      'description', p_description,
      'batch_id',    p_batch_id
    )),
    v_analysis_fk
  );

  RETURN QUERY SELECT TRUE, 'Reservation confirmed'::TEXT, v_total, v_purchased, v_free;
END;
$function$;
-- SEM "EXCEPTION WHEN OTHERS" externo (decisão C de 06/10): erro real de SQL aborta o RPC
-- e chega com SQLERRM ao log do worker (api/src/credits/confirm.js:118).
