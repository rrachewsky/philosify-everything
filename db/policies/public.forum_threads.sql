-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.forum_threads · rls_enabled = true · 7 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 7 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access forum_threads" ON public.forum_threads
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "forum_threads_delete" ON public.forum_threads
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can delete own threads" ON public.forum_threads
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

CREATE POLICY "forum_threads_insert" ON public.forum_threads
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((auth.uid() = user_id) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));

CREATE POLICY "Authenticated users can read threads" ON public.forum_threads
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forum_threads_select" ON public.forum_threads
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forum_threads_update" ON public.forum_threads
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((auth.uid() = user_id) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)))
  WITH CHECK (((auth.uid() = user_id) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text)));
