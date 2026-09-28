-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_functiondef (Bloco 3(c), I-1b, fatia public).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Reconhecimento no repo em 27/09/2026: citada so em SQL/migrations do repo. Usada por 1 trigger(s) (I-1a).

CREATE OR REPLACE FUNCTION public.broadcast_underground_post()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  BEGIN
    PERFORM realtime.send(
      jsonb_build_object(
        'id', NEW.id,
        'nickname', NEW.nickname,
        'content', NEW.content,
        'encrypted_content', NEW.encrypted_content,
        'nonce', NEW.nonce,
        'is_encrypted', COALESCE(NEW.is_encrypted, false),
        'reply_to_id', NEW.reply_to_id,
        'created_at', NEW.created_at,
        'edited_at', NEW.edited_at,
        'reaction_fire', COALESCE(NEW.reaction_fire, 0),
        'reaction_think', COALESCE(NEW.reaction_think, 0),
        'reaction_heart', COALESCE(NEW.reaction_heart, 0),
        'reaction_skull', COALESCE(NEW.reaction_skull, 0)
      ),
      'new-post',
      'underground',
      TRUE
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[broadcast_underground_post] Failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$
