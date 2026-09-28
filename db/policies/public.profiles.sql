-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.profiles · rls_enabled = true · 5 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 5 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access" ON public.profiles
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth trigger can insert profiles" ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

CREATE POLICY "Postgres can insert profiles" ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO postgres
  WITH CHECK (true);

CREATE POLICY "Owner Access Profile" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update own profile" ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
