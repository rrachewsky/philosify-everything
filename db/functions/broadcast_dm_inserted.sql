-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_dm_inserted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  member_record RECORD;
  reply_preview JSONB := NULL;
BEGIN
  IF NEW.reply_to_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', dm.id,
      'message', CASE WHEN dm.is_encrypted THEN NULL ELSE LEFT(dm.message, 100) END,
      'sender_id', dm.sender_id
    ) INTO reply_preview
    FROM public.direct_messages dm
    WHERE dm.id = NEW.reply_to_id;
  END IF;
  FOR member_record IN
    SELECT user_id FROM public.dm_conversation_members
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    BEGIN
      PERFORM realtime.send(
        jsonb_build_object(
          'id', NEW.id,
          'conversation_id', NEW.conversation_id,
          'sender_id', NEW.sender_id,
          'recipient_id', NEW.recipient_id,
          'message', CASE WHEN NEW.is_encrypted THEN NULL ELSE NEW.message END,
          'encrypted_content', NEW.encrypted_content,
          'nonce', NEW.nonce,
          'is_encrypted', COALESCE(NEW.is_encrypted, false),
          'created_at', NEW.created_at,
          'reply_to_id', NEW.reply_to_id,
          'reply_preview', reply_preview,
          'is_forwarded', COALESCE(NEW.is_forwarded, false)
        ),
        'new-message',
        'dm:' || member_record.user_id::text,
        TRUE
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[broadcast_dm_inserted] Failed to broadcast to %: %', member_record.user_id, SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$function$
