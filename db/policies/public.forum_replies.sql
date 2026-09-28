-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.forum_replies · rls_enabled = true · 8 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 8 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access forum_replies" ON public.forum_replies
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "forum_replies_delete" ON public.forum_replies
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can delete own replies" ON public.forum_replies
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "forum_replies_insert" ON public.forum_replies
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((auth.uid() = user_id) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));

CREATE POLICY "Authenticated users can read replies" ON public.forum_replies
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forum_replies_select" ON public.forum_replies
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forum_replies_update" ON public.forum_replies
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update own replies" ON public.forum_replies
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));
