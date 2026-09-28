-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: realtime.subscription · tgenabled = 'O' (O = habilitada) · funcao: (funcao de plataforma Supabase, schema realtime; fora do escopo do I-1)
-- Trigger gerida pela plataforma Supabase (schema realtime); espelhada so para o repo nao ficar cego.

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();
