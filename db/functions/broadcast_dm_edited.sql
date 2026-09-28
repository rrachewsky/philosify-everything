-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_dm_edited()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  member_record RECORD;
BEGIN
  IF NEW.edited_at IS DISTINCT FROM OLD.edited_at THEN
    FOR member_record IN
      SELECT user_id FROM public.dm_conversation_members
      WHERE conversation_id = NEW.conversation_id
    LOOP
      BEGIN
        PERFORM realtime.send(
          jsonb_build_object(
            'id', NEW.id,
            'conversation_id', NEW.conversation_id,
            'message', CASE WHEN NEW.is_encrypted THEN NULL ELSE NEW.message END,
            'encrypted_content', NEW.encrypted_content,
            'nonce', NEW.nonce,
            'is_encrypted', COALESCE(NEW.is_encrypted, false),
            'edited_at', NEW.edited_at,
            'action', 'edited'
          ),
          'message-edited',
          'dm:' || member_record.user_id::text,
          TRUE
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '[broadcast_dm_edited] Failed to broadcast to %: %', member_record.user_id, SQLERRM;
      END;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$function$
