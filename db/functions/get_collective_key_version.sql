-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada em codigo (api/site). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.get_collective_key_version(p_group_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(key_version) FROM collective_group_keys WHERE group_id = p_group_id),
    0
  );
END;
$function$
