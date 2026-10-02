-- Espelho do banco (Supabase) — dump de 22/09/2026 via pg_policies (Bloco 3(c), I-3).
-- O banco e a copia executante; este arquivo e documentacao. NAO reaplicar sem decisao.
-- AVISO: os CREATE POLICY abaixo sao RECONSTRUIDOS de pg_policies (permissive/roles/cmd/qual/with_check).
-- Sao equivalentes ao que esta no banco, nao byte-a-byte com o DDL original.
-- Tabela: storage.objects · rls_enabled = true · 1 policy(ies).
-- HARDENING H2 (29/09/2026, aplicado pelo Bob no SQL Editor, verificado policies_escrita_nao_service = 0):
--   DROP POLICY "Service role full access for tts-audio" (FOR ALL TO public; anon/authenticated tinham GRANT de INSERT/UPDATE/DELETE).
--   Sem consumidor client-side (site nao usa a Storage API); o upload do TTS e do worker com service_role.
--   Leitura publica segue pela flag public=true do bucket (/object/public/), independente de policy.
--   Rollback exato em new_design/HARDENING_2026-09-28.md § H2(c).
-- Cruzamento com o repo (28/09): 0 de 1 nomes de policy aparecem em algum CREATE POLICY versionado (por nome, nao por corpo).
-- Schema de plataforma Supabase; policies criadas pelo projeto sobre tabela gerida pela plataforma.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for tts-audio" ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((bucket_id = 'tts-audio'::text));
