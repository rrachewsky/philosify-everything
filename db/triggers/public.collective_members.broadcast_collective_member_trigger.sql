-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.collective_members · tgenabled = 'O' (O = habilitada) · funcao: db/functions/broadcast_collective_member_change.sql
-- Cruzamento com o repo (28/09): migrations/collective_comments_realtime_broadcast.sql:182 — so em comentario; espelho da funcao em db/functions/broadcast_collective_member_change.sql (16/09)

CREATE TRIGGER broadcast_collective_member_trigger AFTER INSERT OR DELETE ON public.collective_members FOR EACH ROW EXECUTE FUNCTION broadcast_collective_member_change();
