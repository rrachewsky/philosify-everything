-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_dm_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  member_record RECORD;
BEGIN
  FOR member_record IN
    SELECT user_id FROM public.dm_conversation_members
    WHERE conversation_id = OLD.conversation_id
  LOOP
    BEGIN
      PERFORM realtime.send(
        jsonb_build_object(
          'id', OLD.id,
          'action', 'deleted'
        ),
        'message-deleted',
        'dm:' || member_record.user_id::text,
        TRUE
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[broadcast_dm_deleted] Failed to broadcast to %: %', member_record.user_id, SQLERRM;
    END;
  END LOOP;

  RETURN OLD;
END;
$function$
