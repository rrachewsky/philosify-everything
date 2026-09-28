-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.user_news_preferences · rls_enabled = true · 3 policy(ies).
-- Cruzamento com o repo (28/09): 3 de 3 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.user_news_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own news preferences" ON public.user_news_preferences
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can read own news preferences" ON public.user_news_preferences
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can update own news preferences" ON public.user_news_preferences
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));
