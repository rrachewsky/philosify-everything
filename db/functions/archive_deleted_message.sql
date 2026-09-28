-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.archive_deleted_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_content TEXT;
BEGIN
  -- Extract message content from the most common column names
  v_content := COALESCE(
    OLD.message,
    OLD.content,
    OLD.encrypted_content,
    NULL
  );
  INSERT INTO public.deleted_messages (original_id, source_table, deleted_by, message_content, original_data)
  VALUES (
    OLD.id,
    TG_TABLE_NAME,
    COALESCE(OLD.user_id, OLD.sender_id, NULL),
    v_content,
    to_jsonb(OLD)
  );
  RETURN OLD;
END;
$function$
