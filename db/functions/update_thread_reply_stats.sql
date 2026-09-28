-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: NAO RECONHECIDA no repo (so existia no banco). Usada por 2 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.update_thread_reply_stats()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads
    SET reply_count = reply_count + 1,
        last_reply_at = NEW.created_at
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads
    SET reply_count = GREATEST(reply_count - 1, 0),
        last_reply_at = COALESCE(
          (SELECT MAX(created_at) FROM forum_replies WHERE thread_id = OLD.thread_id),
          (SELECT created_at FROM forum_threads WHERE id = OLD.thread_id)
        )
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
END;
$function$
