-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.quiz_profiles · rls_enabled = true · 4 policy(ies).
-- Cruzamento com o repo (28/09): 4 de 4 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.quiz_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to quiz_profiles" ON public.quiz_profiles
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text));

CREATE POLICY "Users can insert own quiz profile" ON public.quiz_profiles
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can read own quiz profile" ON public.quiz_profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update own quiz profile" ON public.quiz_profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
