-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: realtime.messages · rls_enabled = true · 4 policy(ies).
-- depende de: collective_members (via is_collective_member), space_access (via is_underground_member)  (licao do 2BP01: DROP dessas tabelas esbarra nestas policies)
-- Cruzamento com o repo (28/09): 0 de 4 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).
-- Schema de plataforma Supabase; policies criadas pelo projeto sobre tabela gerida pela plataforma.

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can receive agora broadcasts" ON realtime.messages
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((realtime.topic() = 'agora'::text));

-- depende de: collective_members (via is_collective_member)
CREATE POLICY "collective members can receive collective broadcasts" ON realtime.messages
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((starts_with(realtime.topic(), 'collective:'::text) AND is_collective_member(auth.uid(), (split_part(realtime.topic(), ':'::text, 2))::uuid)));

-- depende de: space_access (via is_underground_member)
CREATE POLICY "underground users can receive underground broadcasts" ON realtime.messages
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((realtime.topic() = 'underground'::text) AND is_underground_member(auth.uid())));

CREATE POLICY "users can receive their own DM broadcasts" ON realtime.messages
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((realtime.topic() = ('dm:'::text || (auth.uid())::text)));
