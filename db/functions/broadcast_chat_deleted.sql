-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_chat_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  BEGIN
    PERFORM realtime.send(
      jsonb_build_object(
        'id', OLD.id,
        'action', 'deleted'
      ),
      'message-deleted',
      'agora',
      TRUE
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[broadcast_chat_deleted] Failed: %', SQLERRM;
  END;

  RETURN OLD;
END;
$function$
