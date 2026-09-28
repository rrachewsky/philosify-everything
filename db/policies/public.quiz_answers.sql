-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.quiz_answers · rls_enabled = true · 2 policy(ies).
-- depende de: quiz_sessions  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- Cruzamento com o repo (28/09): 0 de 2 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- depende de: quiz_sessions
CREATE POLICY "quiz_answers_insert" ON public.quiz_answers
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM quiz_sessions
  WHERE ((quiz_sessions.id = quiz_answers.session_id) AND (quiz_sessions.user_id = auth.uid())))));

-- depende de: quiz_sessions
CREATE POLICY "quiz_answers_select" ON public.quiz_answers
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM quiz_sessions
  WHERE ((quiz_sessions.id = quiz_answers.session_id) AND (quiz_sessions.user_id = auth.uid())))));
