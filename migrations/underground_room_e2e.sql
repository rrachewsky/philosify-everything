-- ============================================================
-- UNDERGROUND E2E — sala cifrada de ponta a ponta
-- Pacote pré-privacy, Item 5 — DIFF 1 (2026-08-29)
--
-- Pré-condição verificada pelo Bob no SQL Editor de produção
-- (29/08): underground_posts com 0 posts e 0 autores.
-- A sala nasce cifrada do zero; sem migração de conteúdo.
--
-- O que esta migração cria:
--   §1  underground_room     — meta da sala (linha única): árbitro
--       atômico da corrida de room-init + fingerprint da chave.
--   §2  space_access         — colunas do fluxo de chave (auto-cura).
--   §3  underground_reports  — report com plaintext voluntário (§2.8
--       do desenho): cópia legível enviada pelo denunciante, gravada
--       só após o worker conferir o ciphertext referenciado.
--   §4  verificação estrutural.
-- ============================================================

-- ============================================================
-- §0 PRÉ-FLIGHT (SOMENTE LEITURA — rodar antes e conferir)
-- Estado atual esperado: as duas tabelas novas NÃO existem;
-- encrypted_room_key pode ou não existir (o código a lê; o
-- levantamento não pôde confirmar o banco); posts = 0.
-- ============================================================
SELECT
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'underground_room')    AS ja_tem_room,     -- esperado: 0
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'underground_reports') AS ja_tem_reports,  -- esperado: 0
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'space_access'
       AND column_name = 'encrypted_room_key')                             AS tem_col_key,     -- 0 ou 1 (auto-cura cobre ambos)
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'space_access'
       AND column_name = 'key_distributed_by')                             AS tem_col_dist,    -- esperado: 0
  (SELECT count(*) FROM underground_posts)                                 AS posts,           -- esperado: 0
  (SELECT count(*) FROM space_access WHERE space = 'underground')          AS membros_teste;   -- informativo (viram pendentes)

-- Se ja_tem_room ou ja_tem_reports vier 1: PARAR e reportar antes
-- de prosseguir (estado inesperado — regra dos babysteps).

-- ============================================================
-- APLICAÇÃO (uma transação)
-- ============================================================
BEGIN;

-- ------------------------------------------------------------
-- §1 META DA SALA — linha única (CHECK id = 1).
-- O handler room-init faz INSERT ... ON CONFLICT DO NOTHING:
-- o conflito de PK é o árbitro da corrida de dois primeiros
-- unlocks — só um vence; o perdedor descarta a chave gerada.
-- key_fingerprint = SHA-256 (hex) da chave crua da sala: permite
-- ao client validar cópias recebidas sem o servidor conhecer a
-- chave (hash de 32 bytes aleatórios é irreversível e inútil
-- para decifrar).
-- created_by NULL-ável com ON DELETE SET NULL (padrão do schema,
-- cf. credit_history): a sala sobrevive à exclusão da conta do
-- fundador; só a autoria anula.
-- ------------------------------------------------------------
CREATE TABLE underground_room (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  key_fingerprint TEXT NOT NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS habilitado SEM policies = acesso exclusivo do service_role
-- (mesmo padrão de credit_reservations). O worker é o único caminho.
ALTER TABLE underground_room ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- §2 SPACE_ACCESS — colunas do fluxo de chave.
-- encrypted_room_key: cópia da chave da sala cifrada para a
--   pública do membro (X25519, padrão dos DMs). NULL = pendente.
--   IF NOT EXISTS por auto-cura: o código já lê a coluna
--   (underground.js:54) e o estado real do banco não pôde ser
--   confirmado no levantamento.
-- key_distributed_by: auditoria de quem cifrou a cópia (mitiga
--   DoS por distribuição de chave errada — desenho §2.3/risco 2).
-- ------------------------------------------------------------
ALTER TABLE space_access ADD COLUMN IF NOT EXISTS encrypted_room_key TEXT;
ALTER TABLE space_access ADD COLUMN IF NOT EXISTS key_distributed_by UUID;

-- ------------------------------------------------------------
-- §3 REPORTS COM PLAINTEXT VOLUNTÁRIO (desenho §2.8).
-- A cópia legível sai do navegador do DENUNCIANTE; o worker só
-- grava após conferir que ciphertext_ref/nonce_ref batem com o
-- encrypted_content/nonce armazenados do post (mismatch → 409,
-- nada é gravado). reporter_id fica registrado: denúncia falsa
-- é rastreável e punível.
-- reporter_id NULL-ável com ON DELETE SET NULL (padrão do schema,
-- cf. credit_history): a EVIDÊNCIA sobrevive à exclusão da conta
-- do denunciante; só a autoria anula.
-- post_id SEM foreign key deliberadamente: a evidência sobrevive
-- ao apagão do post pela moderação.
-- Teto do plaintext PROVADO no código: MAX_POST_LENGTH = 1000
-- (api/src/handlers/underground.js:19; cifrado MAX_ENCRYPTED_LENGTH
-- = 4000, linha 20). CHECK em 10000 = folga de 10x sobre o maior
-- plaintext possível de um post.
-- ------------------------------------------------------------
CREATE TABLE underground_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL,
  reporter_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id UUID,
  reason           TEXT NOT NULL CHECK (char_length(reason) <= 500),
  plaintext        TEXT NOT NULL CHECK (char_length(plaintext) <= 10000),
  ciphertext_ref   TEXT NOT NULL,
  nonce_ref        TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS habilitado SEM policies = service_role/admin apenas.
ALTER TABLE underground_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_underground_reports_post
  ON underground_reports(post_id);
CREATE INDEX idx_underground_reports_created
  ON underground_reports(created_at DESC);

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- §4 VERIFICAÇÃO ESTRUTURAL (rodar após o COMMIT)
-- ============================================================
SELECT
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'underground_room')    AS tem_room,      -- esperado: 1
  (SELECT count(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'underground_reports') AS tem_reports,   -- esperado: 1
  (SELECT count(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'space_access'
       AND column_name IN ('encrypted_room_key','key_distributed_by'))     AS cols_access,   -- esperado: 2
  (SELECT relrowsecurity FROM pg_class
     WHERE relname = 'underground_room'
       AND relnamespace = 'public'::regnamespace)                          AS rls_room,      -- esperado: t
  (SELECT relrowsecurity FROM pg_class
     WHERE relname = 'underground_reports'
       AND relnamespace = 'public'::regnamespace)                          AS rls_reports,   -- esperado: t
  (SELECT count(*) FROM pg_policies
     WHERE tablename IN ('underground_room','underground_reports'))        AS policies,      -- esperado: 0 (service_role only)
  (SELECT count(*) FROM information_schema.referential_constraints rc
     JOIN information_schema.table_constraints tc
       ON tc.constraint_name = rc.constraint_name
     WHERE tc.table_name IN ('underground_room','underground_reports')
       AND rc.delete_rule = 'SET NULL')                                    AS fks_set_null,  -- esperado: 2
  (SELECT count(*) FROM underground_room)                                  AS room_rows;     -- esperado: 0 (sala nasce no 1º room-init)
