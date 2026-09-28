-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_get_triggerdef (Bloco 3(c), I-2).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- Tabela: public.quiz_questions · tgenabled = 'O' (O = habilitada) · funcao: db/functions/update_quiz_updated_at.sql
-- Cruzamento com o repo (28/09): migrations/quiz_tables.sql:239 — igual

CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();
