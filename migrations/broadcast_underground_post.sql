-- ============================================================
-- broadcast_underground_post() — trigger de broadcast de realtime do Underground
-- ------------------------------------------------------------
-- Corrigida por SQL em produção em 31/08/2026 — NEW.message e reaction_clap eram
-- campos fantasmas da era underground_messages e faziam todo INSERT falhar;
-- EXCEPTION não-bloqueante para o broadcast nunca derrubar um post. Aplicada e
-- verificada; este arquivo é o espelho.
--
-- Triggers em underground_posts (contexto; as duas de DELETE NÃO foram alteradas):
--   - archive_underground_post_trigger:    BEFORE DELETE → audit.archive_underground_post()
--   - broadcast_underground_delete_trigger: AFTER  DELETE → broadcast_underground_deleted()
--   - broadcast_underground_post_trigger:   AFTER  INSERT → broadcast_underground_post()
-- ============================================================

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
$function$;
