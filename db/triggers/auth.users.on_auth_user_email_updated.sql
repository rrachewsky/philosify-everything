-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: auth.users · tgenabled = 'O' (O = habilitada) · funcao: db/functions/sync_profile_email.sql
-- Cruzamento com o repo (28/09): migrations/schema_reference.sql:466 — igual (o banco normaliza o WHEN com casts ::text)

CREATE TRIGGER on_auth_user_email_updated AFTER UPDATE OF email ON auth.users FOR EACH ROW WHEN (((old.email)::text IS DISTINCT FROM (new.email)::text)) EXECUTE FUNCTION sync_profile_email();
