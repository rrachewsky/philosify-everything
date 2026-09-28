-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.credits · tgenabled = 'O' (O = habilitada) · funcao: db/functions/update_updated_at.sql
-- Cruzamento com o repo (28/09): migrations/schema_reference.sql:522 — igual

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON public.credits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
