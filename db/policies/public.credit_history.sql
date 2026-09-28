-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.credit_history · rls_enabled = true · 4 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 4 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access" ON public.credit_history
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth trigger can insert credit_history" ON public.credit_history
  AS PERMISSIVE
  FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

CREATE POLICY "Postgres can insert credit_history" ON public.credit_history
  AS PERMISSIVE
  FOR INSERT
  TO postgres
  WITH CHECK (true);

CREATE POLICY "Owner Access History" ON public.credit_history
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));
