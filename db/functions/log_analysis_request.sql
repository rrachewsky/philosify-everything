-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.log_analysis_request(p_user_id uuid, p_analysis_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO user_analysis_requests (user_id, analysis_id, metadata)
  VALUES (p_user_id, p_analysis_id, p_metadata)
  ON CONFLICT (user_id, analysis_id) DO UPDATE
  SET requested_at = NOW(),
      metadata = EXCLUDED.metadata
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$function$
