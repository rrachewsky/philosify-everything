-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.acquire_analysis_lock(p_lock_key text, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-expire stale locks (3 minute TTL)
  DELETE FROM analysis_locks WHERE created_at < NOW() - INTERVAL '3 minutes';
  -- Attempt atomic insert
  INSERT INTO analysis_locks (lock_key, user_id)
  VALUES (p_lock_key, p_user_id);
  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$function$
