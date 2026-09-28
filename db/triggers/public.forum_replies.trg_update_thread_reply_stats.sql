-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.forum_replies · tgenabled = 'O' (O = habilitada) · funcao: db/functions/update_thread_reply_stats.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.
-- ATENCAO: forum_replies tem DUAS triggers (trg_update_thread_reply_stats e trigger_update_thread_stats) com a mesma definicao e a mesma funcao. Cada INSERT/DELETE ajusta reply_count duas vezes. Fila de decisao.

CREATE TRIGGER trg_update_thread_reply_stats AFTER INSERT OR DELETE ON public.forum_replies FOR EACH ROW EXECUTE FUNCTION update_thread_reply_stats();
