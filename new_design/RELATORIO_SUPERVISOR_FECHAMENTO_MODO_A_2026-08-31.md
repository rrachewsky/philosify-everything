# Relatório ao supervisor — Underground MODO A · FECHAMENTO

**Data:** 2026-08-31 · **Status:** ✅ **FECHADO** (deployado, provado, versionado, pushed).
**Autoria do commit:** Bob Rach. **Sem atribuição de IA** (regra global e do projeto).

---

## 1. O que foi entregue

Pivô arquitetural do **Underground**: de **E2E-por-membro** (chave por usuário, fingerprint,
distribuição, rekey) para **cifragem em repouso + pseudonimato**. A sala existe porque o Philosify
a abriu, está sempre aberta e **não depende de usuário**:

- **Chave única da sala**, gerada e mantida pelo **worker**, protegida por um **KEK**
  (`UNDERGROUND_ROOM_KEK`, AES-256-GCM, WebCrypto). Entregue em claro sobre TLS a qualquer
  acesso autenticado no GET. Bootstrap **write-confirmed** (relê o banco; confia só no persistido).
- **Posts** seguem `secretbox` no cliente (libsodium); o servidor guarda **só ciphertext**.
- **Moderação:** rota admin decifra um post sob demanda via KEK (`tweetnacl`, wire-compatível),
  **auditada** em `underground_moderation_log`; **404 bland** em qualquer falha. Duas vias de auth:
  **sessão autenticada** de admin (allowlist `ADMIN_USER_IDS`) **ou** `x-admin-secret` (automação).
- **Removido:** gate de keypair no unlock; rotas `room-init`/`pending-keys`/`distribute-keys`/`rekey`.

## 2. Incidentes encontrados e corrigidos (a saga)

| # | Sintoma | Causa-raiz | Correção |
|---|---|---|---|
| 1 | CSP bloqueava worker do libsodium | `worker-src` ausente | `_headers`: `worker-src 'self' blob:` (frente-1) |
| 2 | GET 500 intermitente | meta-read frágil | leitura de room-meta **não-fatal** + `err.stack` (frente-2) |
| 3 | create-post 500 | `content NOT NULL` vs `content:null` | migração `DROP NOT NULL` (1a) |
| 4 | conta A 409 `KEYPAIR_REQUIRED` | `ensureUserKeys` early-return | registro sempre + idempotente |
| 5 | registro de chave 400 perene | regex base64 padrão vs cliente URL-safe | regex `^[A-Za-z0-9_-]{43}$` (#6) |
| 6 | **create-post 500 (0 linhas)** | **trigger `broadcast_underground_post` lia `NEW.message`/`reaction_clap`** (fantasmas da era `underground_messages`) → todo INSERT falhava | função corrigida em produção (campos MODO A + `EXCEPTION WHEN OTHERS` não-bloqueante); **versionada** |
| 7 | prova de moderação sem expor segredo | curl exigia `ADMIN_SECRET` no terminal | caminho de **sessão autenticada** (allowlist `ADMIN_USER_IDS`) |

> Achado colateral do #5: o registro de chave pública **nunca** funcionou em produção → DMs/Collective
> operavam em fallback plaintext. O #5 conserta os três módulos.

## 3. Provas (smoke) — todas verdes

- **Create:** posts persistem (`TEST`/`TEST2` da THEPRODUCER) após correção da trigger.
- **Moderação — positivo ✅:** sessão admin (bob@bobrach.com) → decrypt **200**, `plaintext "TEST2"`,
  `nickname theproducer`, `user_id`/`created_at` presentes.
- **Moderação — negativo ✅:** sessão **não-admin** (sofia) → **404 bland** (gate da allowlist).
- **Auditoria ✅:** `underground_moderation_log` = **1 linha**, `actor = bob@bobrach.com`,
  `reason = smoke moderação`. **Sem achado** (insert de auditoria não engolido).

## 4. Estado de produção

- **Worker:** `9fb0f1d6-1d47-4d8c-bbde-9d8f29892168` (moderação por sessão). Antes: `bd431173` (MODO A base).
- **Site:** `7a2d6bbf` (front MODO A). Inalterado no passo da moderação.
- **Secrets criados pelo Bob:** `UNDERGROUND_ROOM_KEK` (KEK, base64 32 bytes) e
  `ADMIN_USER_IDS` (allowlist; valor = `c7ab2dcd-2803-4895-8336-33497171879f`, bob@bobrach.com).
- **DB (aplicado em produção):** schema MODO A + `underground_moderation_log` (índice em `post_id`) +
  `underground_reports` nuláveis + trigger `broadcast_underground_post` corrigida.

## 5. Commit consolidado

- **Hash:** `17078578b876482b6ac94e06c959051ac44025f1`
- **Branch:** `redesign/v2` → pushed (`5b1c4b2..1707857`)
- **51 arquivos** (17 novos), 2384 inserções / 822 remoções.
- **Release-blocker resolvido:** `.gitignore:175 *key*` ignorava `api/src/utils/roomKey.js` (arquivo-núcleo).
  Exceção `!api/src/utils/roomKey.js` adicionada; sem ela, clone limpo não buildaria o worker.
- **Fora do commit (uncommitted, não relacionados):** `docs/LAUNCH_READINESS_REPORT.md`,
  `docs/MARKET_LAUNCH_PLAN.md`, `new_design/philosify-modules-review.html`, `new_design/printscreen 01/`.

## 6. Reconciliação da migração

`migrations/underground_modo_a.sql` ajustado para **espelhar o aplicado em 31/08**: um índice
(`post_id`), `created_at DEFAULT now()` (sem NOT NULL), comentário do bootstrap corrigido, cabeçalho
marcado como espelho. `migrations/broadcast_underground_post.sql` é o espelho vivo da função corrigida.

## 7. Fila de follow-ups (abertos, não iniciados)

- **realtime-token 401** (loop; diagnóstico já pedido)
- **`isOwn`** no botão de report (não deve aparecer no próprio post)
- **saldo do header** após unlock
- **validação de apelido**

## 8. Hazard registrado

`.gitignore` tem padrões amplos (`*key* *token* *secret* *credential* *migration*.md`) que **ignoram
em silêncio** fontes/relatórios legítimos (já morderam o relatório SMOKE2 e o `roomKey.js`). Mitigado
pontualmente com a negação; **revisão do conjunto** fica como dívida.

---

## Referências (new_design/)

Desenho: `UNDERGROUND_MODO_A_DESENHO_2026-08-30` · Worker: `MODO_A_DIFF_WORKER_2026-08-30` ·
Front: `MODO_A_FRONTEND_COMPLETO_2026-08-30` · Ajustes: `MODO_A_AJUSTES_PRE_DEPLOY_2026-08-31` ·
Moderação sessão: `MODO_A_ADMIN_SESSION_DIFF_2026-08-31` · Create-500: `SMOKE_MODO_A_CREATE_500_2026-08-31` ·
Moderação (superada): `SMOKE_MODO_A_MODERACAO_2026-08-31` · Commit: `COMMIT_CONSOLIDADO_MODO_A_2026-08-31` ·
Incidentes anteriores: `POSTMORTEM_UNDERGROUND_SMOKE_2026-08-30`, `SMOKE2_CREATE_E_CHAVE_2026-08-30`,
`SMOKE3_REGISTRO_400_2026-08-30`.
