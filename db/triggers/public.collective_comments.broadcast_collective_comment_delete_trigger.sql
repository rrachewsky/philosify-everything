-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.collective_comments · tgenabled = 'O' (O = habilitada) · funcao: db/functions/broadcast_collective_comment_deleted.sql
-- Cruzamento com o repo (28/09): migrations/collective_comments_realtime_broadcast.sql:110 — DIVERGENTE NO NOME: a migration cria broadcast_collective_comment_deleted_trigger; o banco tem broadcast_collective_comment_delete_trigger. Mesma definicao.

CREATE TRIGGER broadcast_collective_comment_delete_trigger AFTER DELETE ON public.collective_comments FOR EACH ROW EXECUTE FUNCTION broadcast_collective_comment_deleted();
