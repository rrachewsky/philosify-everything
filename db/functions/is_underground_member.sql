-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada so em SQL/migrations do repo. Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.is_underground_member(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM space_access
    WHERE user_id = uid AND (space)::text = 'underground'
  );
$function$
