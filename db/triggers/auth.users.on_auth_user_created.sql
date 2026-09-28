-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: auth.users · tgenabled = 'O' (O = habilitada) · funcao: db/functions/handle_new_user.sql
-- Cruzamento com o repo (28/09): migrations/schema_reference.sql:439 — igual

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
