-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: auth.users · tgenabled = 'O' (O = habilitada) · funcao: db/functions/notify_new_subscriber.sql
-- Cruzamento com o repo (28/09): nenhum CREATE TRIGGER versionado para esta trigger. So existia no banco.

CREATE TRIGGER on_new_subscriber_notify AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION notify_new_subscriber();
