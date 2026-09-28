-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.user_book_analysis_requests · rls_enabled = true · 2 policy(ies).
-- Cruzamento com o repo (28/09): 2 de 2 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.user_book_analysis_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on user_book_analysis_requests" ON public.user_book_analysis_requests
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own book requests" ON public.user_book_analysis_requests
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));
