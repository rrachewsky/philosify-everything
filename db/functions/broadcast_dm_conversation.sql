-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_dm_conversation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  member RECORD;
  v_sender_name TEXT;
BEGIN
  -- Get sender display name (best effort, NULL if not found)
  SELECT display_name INTO v_sender_name
  FROM public.user_profiles
  WHERE id = NEW.sender_id;
  -- Send to each conversation member except the sender
  FOR member IN
    SELECT user_id FROM public.dm_conversation_members
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    PERFORM realtime.send(
      jsonb_build_object(
        'id', NEW.id,
        'sender_id', NEW.sender_id,
        'sender_name', v_sender_name,
        'conversation_id', NEW.conversation_id,
        'recipient_id', NEW.recipient_id,
        'message', CASE WHEN NEW.is_encrypted THEN NULL ELSE NEW.message END,
        'encrypted_content', NEW.encrypted_content,
        'nonce', NEW.nonce,
        'is_encrypted', COALESCE(NEW.is_encrypted, false),
        'created_at', NEW.created_at
      ),
      'new-message',
      'dm:' || member.user_id::text,
      TRUE  -- private: only the member's authenticated client receives
    );
  END LOOP;
  RETURN NEW;
END;
$function$
