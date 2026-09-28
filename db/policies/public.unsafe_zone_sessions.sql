-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.unsafe_zone_sessions · rls_enabled = true · 4 policy(ies).
-- Cruzamento com o repo (28/09): 4 de 4 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.unsafe_zone_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can delete own sessions" ON public.unsafe_zone_sessions
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert own sessions" ON public.unsafe_zone_sessions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can read own sessions" ON public.unsafe_zone_sessions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update own sessions" ON public.unsafe_zone_sessions
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));
