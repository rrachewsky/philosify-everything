-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.direct_messages · tgenabled = 'O' (O = habilitada) · funcao: db/functions/broadcast_dm_edited.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.

CREATE TRIGGER broadcast_dm_edit_trigger AFTER UPDATE ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION broadcast_dm_edited();
