-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: espelho pre-existente em db/functions/. Usada por 0 trigger(s) (I-1a).
-- DIVERGENTE do espelho cleanup_stale_reservations.sql: SUBSTANTIVA: corpo vivo NAO tem o INSERT best-effort em credit_history (type=refund) que o espelho de 25/08 documenta.
-- Gravado ao lado, sem sobrescrever. Decisao do Bob pendente (qual e a verdade: repo ou banco).

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
