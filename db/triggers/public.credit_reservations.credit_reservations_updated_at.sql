-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.credit_reservations · tgenabled = 'O' (O = habilitada) · funcao: db/functions/update_credit_reservations_updated_at.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.

CREATE TRIGGER credit_reservations_updated_at BEFORE UPDATE ON public.credit_reservations FOR EACH ROW EXECUTE FUNCTION update_credit_reservations_updated_at();
