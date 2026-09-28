-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.collective_comments · tgenabled = 'O' (O = habilitada) · funcao: db/functions/audit.archive_collective_comment.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.

CREATE TRIGGER archive_collective_comment_trigger BEFORE DELETE ON public.collective_comments FOR EACH ROW EXECUTE FUNCTION audit.archive_collective_comment();
