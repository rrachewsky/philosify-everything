-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.chat_messages · tgenabled = 'O' (O = habilitada) · funcao: db/functions/broadcast_chat_message.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.

CREATE TRIGGER broadcast_chat_message_trigger AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION broadcast_chat_message();
