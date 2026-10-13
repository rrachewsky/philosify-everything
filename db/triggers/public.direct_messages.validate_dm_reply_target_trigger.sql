-- Espelho do banco (Supabase) — aplicado pelo Bob em 12/10/2026 (SQL Editor), VASSOURA V2.
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.direct_messages · BEFORE INSERT OR UPDATE OF reply_to_id, conversation_id · funcao: db/functions/validate_dm_reply_target_same_conversation.sql
-- Origem: database/DM_REPLY_CONVERSATION_GUARD_MIGRATION.sql:45. Verificacao pos-aplicacao: 1 linha, secdef = true.
-- Convive com archive_direct_message_trigger (BEFORE DELETE) e os 3 broadcast_dm_* (AFTER): eventos distintos ou posteriores.

CREATE TRIGGER validate_dm_reply_target_trigger BEFORE INSERT OR UPDATE OF reply_to_id, conversation_id ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.validate_dm_reply_target_same_conversation();
