-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.dm_reactions · rls_enabled = true · 3 policy(ies).
-- depende de: direct_messages, dm_conversation_members  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- Cruzamento com o repo (28/09): 0 de 3 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.dm_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can remove their own reactions" ON public.dm_reactions
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((user_id = auth.uid()));

CREATE POLICY "Users can add their own reactions" ON public.dm_reactions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((user_id = auth.uid()));

-- depende de: direct_messages, dm_conversation_members
CREATE POLICY "Users can read reactions in their conversations" ON public.dm_reactions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM (direct_messages dm
     JOIN dm_conversation_members dcm ON ((dcm.conversation_id = dm.conversation_id)))
  WHERE ((dm.id = dm_reactions.message_id) AND (dcm.user_id = auth.uid())))));
