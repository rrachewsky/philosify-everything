-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.underground_posts · rls_enabled = true · 4 policy(ies).
-- depende de: space_access  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- Cruzamento com o repo (28/09): 0 de 4 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.underground_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access underground_posts" ON public.underground_posts
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own posts" ON public.underground_posts
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

-- depende de: space_access
CREATE POLICY "Users with access can create posts" ON public.underground_posts
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM space_access
  WHERE ((space_access.user_id = auth.uid()) AND ((space_access.space)::text = 'underground'::text))))));

-- depende de: space_access
CREATE POLICY "Users with access can read posts" ON public.underground_posts
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM space_access
  WHERE ((space_access.user_id = auth.uid()) AND ((space_access.space)::text = 'underground'::text)))));
