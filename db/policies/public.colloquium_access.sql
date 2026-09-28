-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.colloquium_access · rls_enabled = true · 2 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 2 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.colloquium_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.colloquium_access
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

CREATE POLICY "Users can view own access" ON public.colloquium_access
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));
