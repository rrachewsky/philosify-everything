-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.profiles · tgenabled = 'O' (O = habilitada) · funcao: db/functions/validate_phone_fields.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.

CREATE TRIGGER validate_phone_before_update BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION validate_phone_fields();
