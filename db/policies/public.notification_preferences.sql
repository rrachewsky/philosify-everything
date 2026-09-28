-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.notification_preferences · rls_enabled = true · 6 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 6 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.notification_preferences
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Auth trigger can insert notification_preferences" ON public.notification_preferences
  AS PERMISSIVE
  FOR INSERT
  TO supabase_auth_admin
  WITH CHECK (true);

CREATE POLICY "Users can insert own preferences" ON public.notification_preferences
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Service role can read all preferences" ON public.notification_preferences
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.role() = 'service_role'::text));

CREATE POLICY "Users can read own preferences" ON public.notification_preferences
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update own preferences" ON public.notification_preferences
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));
