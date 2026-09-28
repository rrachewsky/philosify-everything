-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.notify_dm_conversation_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  member RECORD;
BEGIN
  FOR member IN
    SELECT user_id FROM dm_conversation_members
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
  LOOP
    PERFORM realtime.send(
      jsonb_build_object(
        'id', NEW.id,
        'sender_id', NEW.sender_id,
        'recipient_id', NEW.recipient_id,
        'conversation_id', NEW.conversation_id,
        'message', NEW.message,
        'encrypted_content', NEW.encrypted_content,
        'nonce', NEW.nonce,
        'is_encrypted', NEW.is_encrypted,
        'created_at', NEW.created_at
      ),
      'new-message',
      'dm:' || member.user_id::text,
      TRUE
    );
  END LOOP;
  RETURN NEW;
END;
$function$
