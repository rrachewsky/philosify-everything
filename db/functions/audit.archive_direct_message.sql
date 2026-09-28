-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia audit).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION audit.archive_direct_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO audit.deleted_logs (
    source_table,
    source_id,
    sender_id,
    conversation_id,
    deleted_by,
    original_created_at
  ) VALUES (
    'direct_messages',
    OLD.id,
    OLD.sender_id,
    OLD.conversation_id,
    auth.uid(),
    OLD.created_at
  )
  ON CONFLICT (source_table, source_id) DO NOTHING;

  RETURN OLD;
END;
$function$
