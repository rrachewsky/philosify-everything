-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: public.panel_analyses · rls_enabled = true · 1 policy(ies).
-- HARDENING H3 (29/09/2026, aplicado pelo Bob no SQL Editor, verificado insert_policies_nao_service = 0):
--   DROP POLICY "Service can insert panel analyses" (INSERT TO public WITH CHECK true).
--   Sem consumidor client-side (site nao usa PostgREST); o INSERT do painel e do worker com service_role
--   (api/src/handlers/philosopher-panel.js). Rollback exato em new_design/HARDENING_2026-09-28.md § H3(c).
-- Cruzamento com o repo (28/09): 1 de 1 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).

ALTER TABLE public.panel_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own panel analyses" ON public.panel_analyses
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));
