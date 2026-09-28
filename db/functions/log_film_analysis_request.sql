-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.log_film_analysis_request(p_user_id uuid, p_film_analysis_id uuid, p_title text DEFAULT NULL::text, p_director text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_film_analysis_requests (user_id, film_analysis_id, title, director, metadata)
  VALUES (p_user_id, p_film_analysis_id, p_title, p_director, p_metadata)
  ON CONFLICT DO NOTHING;
END;
$function$
