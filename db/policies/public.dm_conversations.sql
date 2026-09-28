-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.dm_conversations · rls_enabled = true · 1 policy(ies).
-- depende de: dm_conversation_members  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- Cruzamento com o repo (28/09): 0 de 1 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;

-- depende de: dm_conversation_members
CREATE POLICY "Members can view conversations" ON public.dm_conversations
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM dm_conversation_members
  WHERE ((dm_conversation_members.conversation_id = dm_conversations.id) AND (dm_conversation_members.user_id = auth.uid())))));
