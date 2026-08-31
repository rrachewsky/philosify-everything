# Commit consolidado — Underground MODO A + incidentes · lista para OK

**Data:** 2026-08-31 · **Status:** proposto. **NADA commitado, NADA staged, `.gitignore` ainda NÃO alterado.**
**Provas verdes:** create (posts persistem), moderação sessão (positivo ✅ + negativo ✅ + auditoria ✅).
**No ar:** worker `9fb0f1d6` · site `7a2d6bbf`.

---

## 0. ⚠️ Release-blocker achado antes do commit

`git check-ignore -v api/src/utils/roomKey.js` → **`.gitignore:175:*key*`**. O arquivo-núcleo do MODO A
está **ignorado** (`!!`, não rastreado). Sem correção, o commit consolidado **omitiria** `roomKey.js`
e **um clone limpo não buildaria o worker**. O deploy atual só funciona porque o arquivo existe na
árvore local.

**Correção proposta (`.gitignore`, no bloco "Keep example files", após a linha 184):**
```gitignore
# Underground MODO A source (o padrão amplo *key* na linha 175 o pegava por engano)
!api/src/utils/roomKey.js
```
Cirúrgica: reinclui só esse arquivo, **sem** enfraquecer `*key*`/`*secret*`/`*token*` (que protegem
segredos acidentais). Entra **no** commit consolidado.

> **Hazard para follow-up:** `*key* *token* *secret* *credential* *migration*.md` são amplos e engolem
> fontes/relatórios legítimos em silêncio (já morderam o SMOKE2 e agora o roomKey.js). Vale revisar
> depois. (Candidato a memória.)

---

## 1. Arquivos DENTRO do commit

### 1a. Worker — fonte (modificados)
- `api/index.js` — rotas: removidas room-init/pending-keys/distribute-keys/rekey; add `POST /api/underground/admin/decrypt`
- `api/src/handlers/underground.js` — reescrita MODO A + admin decrypt (sessão allowlist + x-admin-secret)
- `api/src/handlers/spaces.js` — removido gate `409 KEYPAIR_REQUIRED`
- `api/src/handlers/crypto.js` — regex de chave pública URL-safe (#6) + registro idempotente
- `api/src/utils/i18n-errors.js` — chave `FAILED_TO_CREATE_POST` (diff 1c)
- `api/wrangler.toml` — bindings `UNDERGROUND_ROOM_KEK` + `ADMIN_USER_IDS`
- `api/package.json`, `api/package-lock.json` — dependência `tweetnacl`

### 1b. Worker — fonte (NOVO, hoje ignorado → destravado no item 0)
- `api/src/utils/roomKey.js` — bootstrap write-confirmed, KEK wrap/unwrap (AES-256-GCM), decrypt de moderação (tweetnacl)

### 1c. Frontend — fonte (modificados)
- `site/public/_headers` — CSP `worker-src 'self' blob:` (frente-1)
- `site/src/components/community/SpaceLock.jsx` — removido pré-unlock de keypair + 409
- `site/src/components/underground/UndergroundFeed.jsx` — removido banner de pendência / estado stale
- `site/src/hooks/useUnderground.js` — `roomStatus` `'ready'|'error'`
- `site/src/services/api/underground.js` — guarda `roomKey` do GET; report `{post_id,reason}`; removidas rotas mortas
- `site/src/services/crypto.js` — seção underground → MODO A (`setUndergroundRoomKeyFromServer`, etc.)
- `site/src/styles/v2-pages/underground.css` — removido `.underground-room-status`
- **i18n (18):** `site/src/i18n/translations/{ar,de,en,es,fa,fr,he,hi,hu,it,ja,ko,nl,pl,pt,ru,tr,zh}.json` — removidas `roomPending`/`reportStale`/`keypairError`; `reportWarning` novo texto

### 1d. Migrações (NOVO)
- `migrations/underground_modo_a.sql` — schema MODO A (encrypted_room_key, fingerprint nulável, reset, moderation_log)
- `migrations/broadcast_underground_post.sql` — **espelho vivo** da trigger corrigida em produção (NEW.message/reaction_clap → campos MODO A; EXCEPTION não-bloqueante)

### 1e. Config
- `.gitignore` — exceção `!api/src/utils/roomKey.js` (item 0)

### 1f. Relatórios `new_design/` (NOVO) — 13 arquivos
`UNDERGROUND_MODO_A_DESENHO_2026-08-30`, `MODO_A_DIFF_WORKER_2026-08-30`,
`MODO_A_FRONTEND_COMPLETO_2026-08-30`, `MODO_A_AJUSTES_PRE_DEPLOY_2026-08-31`,
`MODO_A_ADMIN_SESSION_DIFF_2026-08-31`, `RELATORIO_SUPERVISOR_MODO_A_2026-08-30`,
`RELATORIO_SUPERVISOR_UNDERGROUND_E2E_2026-08-30`, `POSTMORTEM_UNDERGROUND_SMOKE_2026-08-30`,
`SMOKE2_CREATE_E_CHAVE_2026-08-30`, `SMOKE3_REGISTRO_400_2026-08-30`,
`SMOKE_MODO_A_CREATE_500_2026-08-31`, `SMOKE_MODO_A_MODERACAO_2026-08-31`,
`PACOTE_DEPLOY_VERIFICACAO_2026-08-29` (+ este `COMMIT_CONSOLIDADO_MODO_A_2026-08-31`).

---

## 2. Arquivos FORA do commit (não tocar — ficam uncommitted)

- `docs/LAUNCH_READINESS_REPORT.md` — planejamento de lançamento (não-MODO-A)
- `docs/MARKET_LAUNCH_PLAN.md` — idem
- `new_design/philosify-modules-review.html` — revisão de módulos (não-underground)
- `new_design/printscreen 01/` — screenshots avulsos

Todos os **modificados (M)** são MODO A/incidentes → todos entram. **Nenhum** modificado fica de fora.
Os de fora são só untracked não relacionados (acima).

---

## 3. Mensagem de commit proposta (SEM atribuição de IA — regra global e do projeto)

```
Underground MODO A: chave em repouso + pseudonimato, moderacao e correcoes de incidente

- Substitui E2E-por-membro por uma unica chave de sala mantida pelo worker
  (KEK-wrapped em repouso), entregue via TLS a quem tem acesso autenticado;
  posts seguem secretbox em repouso.
- roomKey.js: bootstrap com confirmacao de escrita, KEK wrap/unwrap (AES-256-GCM),
  decrypt de moderacao (tweetnacl).
- Endpoint admin de moderacao (sessao via allowlist ADMIN_USER_IDS OU x-admin-secret),
  auditado em underground_moderation_log; 404 bland em qualquer falha.
- Remove gate de keypair do unlock; remove room-init/pending-keys/distribute-keys/rekey.
- Incidentes: content NOT NULL (migracao), regex base64 da chave publica (URL-safe),
  i18n FAILED_TO_CREATE_POST, CSP worker-src blob:, leitura de room-meta nao-fatal.
- Versiona a trigger broadcast_underground_post corrigida (referenciava fantasmas
  NEW.message/reaction_clap e derrubava todo INSERT).
- .gitignore: impede *key* de ignorar src/utils/roomKey.js.
- Relatorios em new_design/.
```

Autor: **Bob Rach** apenas.

---

## 4. Execução proposta (após o teu OK)

1. Aplicar a exceção no `.gitignore` (item 0).
2. `git add -u` (todos os modificados MODO A/incidente).
3. `git add` explícito dos novos **em escopo**: `api/src/utils/roomKey.js`, as 2 migrações,
   os 13 relatórios `new_design/*.md`, `.gitignore`. **Sem** `git add -A` (para não pegar os de fora).
4. `git status` de conferência → colar pra você.
5. `git commit` com a mensagem acima. **Só depois do teu OK.**

**Branch atual:** `redesign/v2`. Confirmar se o commit vai aqui mesmo.
