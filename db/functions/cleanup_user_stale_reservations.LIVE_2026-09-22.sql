-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: espelho pre-existente em db/functions/. Usada por 0 trigger(s) (I-1a).
-- DIVERGENTE do espelho cleanup_user_stale_reservations.sql: SUBSTANTIVA: corpo vivo NAO tem o INSERT best-effort em credit_history (type=refund) que o espelho de 25/08 documenta.
-- Gravado ao lado, sem sobrescrever. Decisao do Bob pendente (qual e a verdade: repo ou banco).

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
