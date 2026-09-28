-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.increment_analysis_comment_count(p_analysis_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE collective_analyses
  SET comment_count = COALESCE(comment_count, 0) + 1
  WHERE id = p_analysis_id;
END;
$function$
