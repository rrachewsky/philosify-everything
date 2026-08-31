-- ============================================================
-- MIGRAÇÃO — Underground MODO A
-- ------------------------------------------------------------
-- ESPELHO DO QUE FOI APLICADO EM PRODUÇÃO em 31/08/2026 (blocos
-- executados pelo Bob no SQL Editor). Reconciliado com o estado real:
--   • underground_moderation_log tem UM índice (post_id);
--   • created_at usa DEFAULT now() (sem NOT NULL).
--
-- Cifragem EM REPOUSO + pseudonimato (não-E2E). O worker detém a
-- chave da sala, protegida por um KEK (UNDERGROUND_ROOM_KEK no
-- Secrets Store). Remove o modelo E2E-por-membro (fingerprint,
-- distribuição, rekey).
-- Pré-requisito verificado na aplicação: underground_posts = 0.
-- ============================================================

-- ============================================================
-- §0 PRÉ-FLIGHT (rodar ANTES; se algo divergir, PARAR)
-- ============================================================
SELECT
  (SELECT count(*) FROM underground_posts)                          AS posts,          -- esperado: 0
  (SELECT count(*) FROM underground_room)                           AS salas,          -- esperado: 1 (órfã) — será apagada
  (SELECT count(*) FROM underground_reports)                        AS reports,        -- esperado: 0
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema='public' AND table_name='underground_moderation_log')
                                                                    AS modlog_existe;  -- esperado: 0

-- Registro da linha órfã que será apagada:
SELECT id, key_fingerprint, created_by, created_at FROM underground_room;

-- ============================================================
-- APLICAÇÃO (uma transação)
-- ============================================================
BEGIN;

-- §1 underground_room — o worker passa a deter a chave.
--   encrypted_room_key: chave da sala cifrada com o KEK (AES-256-GCM,
--     WebCrypto no worker). NULL até o bootstrap do 1º GET.
--   key_fingerprint deixa de ser obrigatório (sem validação de cópia
--     por fingerprint no cliente). created_by já é nulável.
ALTER TABLE underground_room ADD COLUMN IF NOT EXISTS encrypted_room_key TEXT;
ALTER TABLE underground_room ALTER COLUMN key_fingerprint DROP NOT NULL;

-- Reset de estado: apaga a linha órfã do modelo anterior. posts = 0,
-- nada referencia a chave antiga. O bootstrap do worker recria id=1
-- com a chave nova (INSERT de PK fixa; 409 = árbitro de corrida).
DELETE FROM underground_room;

-- §2 underground_reports — report simplifica para {post_id, reason}.
--   O plaintext voluntário sai (o worker decifra sob demanda via KEK).
--   plaintext/ciphertext_ref/nonce_ref deixam de ser gravados → nuláveis.
--   reason segue obrigatório.
ALTER TABLE underground_reports ALTER COLUMN plaintext      DROP NOT NULL;
ALTER TABLE underground_reports ALTER COLUMN ciphertext_ref DROP NOT NULL;
ALTER TABLE underground_reports ALTER COLUMN nonce_ref      DROP NOT NULL;

-- §3 Auditoria de moderação — toda decifra admin grava aqui (além do
--   log do worker). RLS SEM policies = acesso exclusivo do service_role.
CREATE TABLE underground_moderation_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL,
  report_id   UUID,                        -- nulável: decifra por ordem legal sem report
  reason      TEXT,
  actor       TEXT NOT NULL,               -- quem decifrou (rótulo admin)
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE underground_moderation_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ug_modlog_post ON underground_moderation_log(post_id);

-- §4 space_access.encrypted_room_key / key_distributed_by: ficam SEM USO
--   (não dropar agora — decisão do desenho MODO A §7).

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- §5 VERIFICAÇÃO (rodar após o COMMIT)
-- ============================================================
SELECT
  (SELECT count(*) FROM information_schema.columns
     WHERE table_name='underground_room' AND column_name='encrypted_room_key')  AS tem_encrypted_room_key, -- 1
  (SELECT is_nullable FROM information_schema.columns
     WHERE table_name='underground_room' AND column_name='key_fingerprint')     AS fingerprint_nulavel,    -- YES
  (SELECT is_nullable FROM information_schema.columns
     WHERE table_name='underground_reports' AND column_name='plaintext')        AS plaintext_nulavel,      -- YES
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema='public' AND table_name='underground_moderation_log')   AS modlog_existe,          -- 1
  (SELECT count(*) FROM underground_room)                                       AS salas_apos,             -- 0 (bootstrap recria)
  (SELECT count(*) FROM underground_posts)                                      AS posts;                  -- 0
