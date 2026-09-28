-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.underground_posts · tgenabled = 'O' (O = habilitada) · funcao: db/functions/audit.archive_underground_post.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.

CREATE TRIGGER archive_underground_post_trigger BEFORE DELETE ON public.underground_posts FOR EACH ROW EXECUTE FUNCTION audit.archive_underground_post();
