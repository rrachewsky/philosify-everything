-- Espelho do banco (Supabase) — aplicado pelo Bob em 12/10/2026 (SQL Editor), VASSOURA V2.
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Origem: database/DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql (no repo desde 08/03/2026, nunca aplicada ate 12/10/2026).
-- Pre-flight 12/10: funcao e trigger ausentes (0/0); conversation_id uuid NOT NULL, reply_to_id uuid nullable;
-- 0 replies orfas, 0 cruzadas, 1 reply total (valida). Verificacao pos-aplicacao: secdef = true.
-- Prova funcional (ROLLBACK): reply da mesma conversa inserida; de outra conversa rejeitada ('%same conversation%');
-- inexistente rejeitada ('%non-existent%'). ACL: REVOKE EXECUTE FROM PUBLIC aplicado (alinhamento a decisao de 06/10).
-- Usada por 1 trigger: db/triggers/public.direct_messages.validate_dm_reply_target_trigger.sql.
-- Relatorio: new_design/VASSOURA_2026-10-12_V2_DM_REPLY_GUARD.md.

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

REVOKE EXECUTE ON FUNCTION public.validate_dm_reply_target_same_conversation() FROM PUBLIC;
