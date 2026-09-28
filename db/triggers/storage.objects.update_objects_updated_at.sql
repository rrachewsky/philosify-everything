-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: storage.objects · tgenabled = 'O' (O = habilitada) · funcao: (funcao de plataforma Supabase, schema storage; fora do escopo do I-1)
-- Trigger gerida pela plataforma Supabase (schema storage); espelhada so para o repo nao ficar cego.

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();
