-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: espelho pre-existente em db/functions/. Usada por 0 trigger(s) (I-1a).
-- DIVERGENTE do espelho release_reservation.sql: so comentarios e quebra de linha da assinatura; codigo executavel identico.
-- Gravado ao lado, sem sobrescrever. Decisao do Bob pendente (qual e a verdade: repo ou banco).

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
  v_reason reservation_reason;
BEGIN
  v_reason := CASE
    WHEN p_reason IN ('cached', 'cached_review', 'already_owned') THEN 'cached'::reservation_reason
    WHEN p_reason LIKE '%timeout%'                                THEN 'timeout'::reservation_reason
    ELSE 'failed'::reservation_reason
  END;

  SELECT r.user_id, r.credit_type, r.status
  INTO v_user_id, v_credit_type, v_reservation_status
  FROM credit_reservations r
  WHERE r.id = p_reservation_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Reservation not found'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  IF v_reservation_status = 'released' THEN
    SELECT c.total, c.purchased, c.free_remaining INTO v_total, v_purchased, v_free
    FROM credits c WHERE c.user_id = v_user_id;
    RETURN QUERY SELECT TRUE, 'Already released'::TEXT, v_total, v_purchased, v_free;
    RETURN;
  END IF;

  IF v_reservation_status = 'confirmed' THEN
    RETURN QUERY SELECT FALSE, 'Cannot release confirmed reservation'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  IF v_credit_type = 'free' THEN
    UPDATE credits c
    SET free_remaining = c.free_remaining + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  ELSE
    UPDATE credits c
    SET purchased = c.purchased + 1, updated_at = NOW()
    WHERE c.user_id = v_user_id;
  END IF;

  UPDATE credit_reservations r
  SET status = 'released',
      reason = v_reason,
      release_reason = p_reason,
      released_at = NOW(),
      analysis_id = p_analysis_id
  WHERE r.id = p_reservation_id;

  SELECT c.total, c.purchased, c.free_remaining
  INTO v_total, v_purchased, v_free
  FROM credits c
  WHERE c.user_id = v_user_id;

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
$function$
