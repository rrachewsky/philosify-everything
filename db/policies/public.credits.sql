-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.credits · rls_enabled = true · 4 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 4 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access" ON public.credits
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth trigger can insert credits" ON public.credits
  AS PERMISSIVE
  FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

CREATE POLICY "Postgres can insert credits" ON public.credits
  AS PERMISSIVE
  FOR INSERT
  TO postgres
  WITH CHECK (true);

CREATE POLICY "Owner Access Credits" ON public.credits
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));
