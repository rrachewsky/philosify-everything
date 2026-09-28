-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.dm_read_receipts · rls_enabled = true · 1 policy(ies).
-- Cruzamento com o repo (28/09): 0 de 1 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.dm_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own read receipts" ON public.dm_read_receipts
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((user_id = auth.uid()));
