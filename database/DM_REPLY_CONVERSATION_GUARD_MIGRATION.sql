-- ============================================================
-- DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql
-- ============================================================
-- Hardens reply integrity:
-- reply_to_id must reference a message in the SAME conversation.
--
-- Why:
-- - API already validates this, but DB-level enforcement prevents bypasses
--   via direct SQL/service-role paths or future handler regressions.
-- - Keeps reply metadata scoped to the correct conversation boundary.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_dm_reply_target_same_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reply_conversation_id UUID;
BEGIN
  IF NEW.reply_to_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT dm.conversation_id
  INTO v_reply_conversation_id
  FROM public.direct_messages dm
  WHERE dm.id = NEW.reply_to_id;

  IF v_reply_conversation_id IS NULL THEN
    RAISE EXCEPTION 'reply_to_id references a non-existent message';
  END IF;

  IF v_reply_conversation_id IS DISTINCT FROM NEW.conversation_id THEN
    RAISE EXCEPTION 'reply_to_id must reference a message in the same conversation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_dm_reply_target_trigger ON public.direct_messages;

CREATE TRIGGER validate_dm_reply_target_trigger
  BEFORE INSERT OR UPDATE OF reply_to_id, conversation_id
  ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dm_reply_target_same_conversation();
