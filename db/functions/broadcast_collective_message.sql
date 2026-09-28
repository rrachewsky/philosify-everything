-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 0 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_collective_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object(
      'id', NEW.id,
      'group_id', NEW.group_id,
      'user_id', NEW.user_id,
      'display_name', NEW.display_name,
      'message', NEW.message,
      'created_at', NEW.created_at
    ),
    'new-message',
    'collective:' || NEW.group_id::text,
    TRUE
  );
  RETURN NEW;
END;
$function$
