-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.direct_messages · rls_enabled = true · 5 policy(ies).
-- depende de: dm_conversation_members  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- HARDENING H1 (29/09/2026, aplicado pelo Bob no SQL Editor, verificado insert_policies_nao_service = 0):
--   DROP POLICY "Users can send messages" e DROP POLICY "Conversation members can send messages".
--   Sem consumidor client-side (site nao usa PostgREST); todo INSERT passa pelo worker com service_role.
--   Rollback exato em new_design/HARDENING_2026-09-28.md § H1(c).
-- Cruzamento com o repo (28/09): 0 de 7 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access direct_messages" ON public.direct_messages
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own messages" ON public.direct_messages
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = sender_id));

-- depende de: dm_conversation_members
CREATE POLICY "Conversation members can view messages" ON public.direct_messages
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((conversation_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM dm_conversation_members
  WHERE ((dm_conversation_members.conversation_id = direct_messages.conversation_id) AND (dm_conversation_members.user_id = auth.uid()))))));

CREATE POLICY "Users can read own messages" ON public.direct_messages
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));

CREATE POLICY "Recipients can mark as read" ON public.direct_messages
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = recipient_id))
  WITH CHECK ((auth.uid() = recipient_id));
