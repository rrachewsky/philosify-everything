-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.share_tokens · rls_enabled = true · 2 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 2 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner Access Tokens" ON public.share_tokens
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.uid() = created_by_user_id))
  WITH CHECK ((auth.uid() = created_by_user_id));

CREATE POLICY "Service Role Full Access" ON public.share_tokens
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
