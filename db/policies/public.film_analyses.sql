-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.film_analyses · rls_enabled = true · 2 policy(ies).
-- depende de: user_film_analysis_requests  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- Cruzamento com o repo (28/09): 2 de 2 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.film_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on film_analyses" ON public.film_analyses
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- depende de: user_film_analysis_requests
CREATE POLICY "Users can view paid film analyses" ON public.film_analyses
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM user_film_analysis_requests
  WHERE ((user_film_analysis_requests.film_analysis_id = film_analyses.id) AND (user_film_analysis_requests.user_id = auth.uid())))));
