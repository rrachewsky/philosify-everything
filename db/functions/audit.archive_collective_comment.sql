-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia audit).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION audit.archive_collective_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_collective_id UUID;
BEGIN
  SELECT ca.group_id INTO v_collective_id
  FROM public.collective_analyses ca
  WHERE ca.id = OLD.collective_analysis_id;
  INSERT INTO audit.deleted_logs (
    source_table,
    source_id,
    sender_id,
    collective_id,
    deleted_by,
    original_created_at
  ) VALUES (
    'collective_comments',
    OLD.id,
    OLD.user_id,
    v_collective_id,
    auth.uid(),
    OLD.created_at
  )
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN OLD;
END;
$function$
