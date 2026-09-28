-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.collective_comments · rls_enabled = true · 4 policy(ies).
-- depende de: collective_analyses, collective_members  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- Cruzamento com o repo (28/09): 0 de 4 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.collective_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access collective_comments" ON public.collective_comments
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own comments" ON public.collective_comments
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = user_id));

-- depende de: collective_analyses, collective_members
CREATE POLICY "Members can add comments" ON public.collective_comments
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM (collective_analyses ca
     JOIN collective_members cm ON ((cm.group_id = ca.group_id)))
  WHERE ((ca.id = collective_comments.collective_analysis_id) AND (cm.user_id = auth.uid()))))));

-- depende de: collective_analyses, collective_members
CREATE POLICY "Members can read comments" ON public.collective_comments
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM (collective_analyses ca
     JOIN collective_members cm ON ((cm.group_id = ca.group_id)))
  WHERE ((ca.id = collective_comments.collective_analysis_id) AND (cm.user_id = auth.uid())))));
