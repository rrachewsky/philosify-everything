# Pacote Pré-Privacy — ITEM 5, DIFF 1: migração `underground_room_e2e.sql`

**Data:** 2026-08-29
**Status:** **APROVADO e GRAVADO** em `migrations/underground_room_e2e.sql` com os 3 ajustes do OK condicionado do Bob (abaixo). A aplicação no Supabase é do Bob (pré-flight → transação → verificação). O SQL abaixo é a versão pré-ajustes; **o arquivo gravado é a fonte final.**

**Ajustes do OK (29/08), todos incorporados ao arquivo:**
1. **FKs compatíveis com exclusão de conta:** `underground_room.created_by` e `underground_reports.reporter_id` NULL-áveis com `REFERENCES auth.users(id) ON DELETE SET NULL` (padrão do schema, cf. credit_history) — evidência do report sobrevive à exclusão da conta do denunciante; só a autoria anula. Verificação §4 ganhou a coluna `fks_set_null` (esperado: 2).
2. **Teto do plaintext PROVADO:** `MAX_POST_LENGTH = 1000` em `api/src/handlers/underground.js:19` (cifrado: `MAX_ENCRYPTED_LENGTH = 4000`, linha 20). 1000 ≤ 10000 → CHECK mantido em 10000 (folga de 10×), prova registrada no comentário do §3 do SQL.
3. **Escolha pendente resolvida:** `CREATE TABLE` **sem** `IF NOT EXISTS` — falhar alto é o comportamento correto dado o pré-flight.
**Base:** desenho aprovado (`ITEM5_UNDERGROUND_E2E_DESENHO_2026-08-29.md`, com §2.8) + reforços do OK final: 403 em pending-keys/distribute-keys para não-chaveados, rate limit + teto de tamanho no report, chaves i18n reais do modal — os dois primeiros entram no DIFF 2 (backend), o terceiro no DIFF 4 (UI); os CHECKs de tamanho desta migração já espelham os tetos do report.

---

## Escolha pendente junto com o OK

`CREATE TABLE` **sem** `IF NOT EXISTS` nas duas tabelas novas — coerente com o pré-flight que exige 0 (falha alto se o estado divergir, em vez de mascarar). Se preferir idempotência total, troco pelas versões `IF NOT EXISTS` nas duas linhas.

---

## SQL completo

```sql
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
-- post_id SEM foreign key deliberadamente: a evidência sobrevive
-- ao apagão do post pela moderação.
-- Limites de tamanho refletem o teto do handler (posts têm
-- MAX_POST_LENGTH; reason é curto) — cinto e suspensório.
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
```

---

## Padrão das migrações anteriores, mantido

- Pré-flight somente-leitura no topo, com valores esperados e instrução de **parar se divergir** (babysteps).
- Transação única; `NOTIFY pgrst, 'reload schema'` após o COMMIT.
- RLS-sem-policies comentado com o precedente (`credit_reservations`).
- Verificação estrutural pós-commit com expectativa linha a linha (mesmo formato do `tarefa2_item1_release_reservation.sql` §4).

## Diferenças deliberadas (justificadas no desenho)

- `underground_reports.post_id` **sem FK** — evidência sobrevive ao apagão do post.
- CHECKs de tamanho no report (`reason ≤ 500`, `plaintext ≤ 10000`) — espelham os tetos que o handler do DIFF 2 imporá (reforço 2 do OK final).
- `CREATE TABLE` sem `IF NOT EXISTS` (ver "Escolha pendente" acima).

## Fechamento do DIFF 1 (29/08) — gravado

- **Arquivo gravado:** `migrations/underground_room_e2e.sql` (fonte final, com os 3 ajustes). Untracked, **sem commit** (regra do pacote).
- **git status --short no momento da gravação:** 5 modificados pendentes do ITEM 3 (`api/src/utils/sentry.js`, `api/wrangler.toml`, `site/.env.example`, `site/public/_headers`, `site/src/utils/sentry.js`) + untracked de sempre + relatórios do pacote + a migração nova.

### Roteiro de aplicação (Bob, SQL Editor de PRODUÇÃO)

1. **§0 pré-flight** — esperado: `ja_tem_room = 0`, `ja_tem_reports = 0`, `tem_col_key = 0 ou 1`, `tem_col_dist = 0`, `posts = 0`; `membros_teste` é informativo (esses viram pendentes automaticamente). **Se as tabelas já existirem (1): PARAR e reportar.**
2. **Transação** (`BEGIN` … `COMMIT`) + `NOTIFY pgrst`.
3. **§4 verificação** — esperado, na ordem: `tem_room = 1`, `tem_reports = 1`, `cols_access = 2`, `rls_room = t`, `rls_reports = t`, `policies = 0`, `fks_set_null = 2`, `room_rows = 0`.
4. Reportar os resultados (pré-flight + verificação).

### Na sequência

DIFF 2/4 — backend (`spaces.js` + `underground.js` + rotas em `api/index.js`), incorporando os reforços do OK final: **(1)** 403 em `pending-keys`/`distribute-keys` para quem não for access-holder com `encrypted_room_key` não-nula; **(2)** rate limit padrão do worker em `room-init`, `rekey` e `report`, com tetos de tamanho no body do report (reason ≤ 500, plaintext ≤ 10000 — os mesmos dos CHECKs). Apresentado para OK antes de aplicar, como sempre.
