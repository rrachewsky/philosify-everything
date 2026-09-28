-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: auth.users · tgenabled = 'O' (O = habilitada) · funcao: db/functions/sync_profile_display_name.sql
-- Cruzamento com o repo (28/09): migrations/schema_reference.sql:495 — igual

CREATE TRIGGER on_auth_user_metadata_updated AFTER UPDATE OF raw_user_meta_data ON auth.users FOR EACH ROW WHEN ((old.raw_user_meta_data IS DISTINCT FROM new.raw_user_meta_data)) EXECUTE FUNCTION sync_profile_display_name();
