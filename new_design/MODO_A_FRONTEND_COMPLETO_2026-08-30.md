# Underground MODO A — implementação completa (aguardando OK para deploy)

**Data:** 2026-08-30 · **Status:** worker + site implementados e validados (dry-run e build **verdes**). **Nada publicado, nada commitado.** Migração e KEK já feitos pelo Bob.

---

## 1. Validação

| Alvo | Resultado |
|---|---|
| Migração (schema + reset) | ✅ aplicada por você |
| KEK (`UNDERGROUND_ROOM_KEK`) | ✅ criado por você (binding resolve no dry-run) |
| Worker `wrangler deploy --dry-run` | ✅ **verde** (tweetnacl + `roomKey.js` bundlaram) |
| Site `npm run build` | ✅ **verde** (`✓ 52.27s`; só o aviso de chunk pré-existente) |
| Referências pendentes a código removido | ✅ **0** (grep no `site/src`) |
| Chaves i18n removidas (`roomPending`/`reportStale`/`keypairError`) | ✅ **0** ocorrências |

---

## 2. Worker (detalhe no `MODO_A_DIFF_WORKER_2026-08-30.md`)

- **`api/src/utils/roomKey.js`** (novo): bootstrap + KEK-wrap/unwrap (AES-256-GCM) + entrega url-safe + decrypt de moderação (tweetnacl).
- **`underground.js`:** GET entrega `roomKey`; removidos room-init/pending-keys/distribute-keys/rekey/getKeyedAccess; report `{post_id,reason}`; novo `handleUndergroundAdminDecrypt` (auditoria em `underground_moderation_log`).
- **`index.js`:** rotas antigas removidas; rota `POST /api/underground/admin/decrypt`.
- **`spaces.js`:** gate `409 KEYPAIR_REQUIRED` removido. **`wrangler.toml`:** binding do KEK. **`package.json`:** tweetnacl.

## 3. Site (frontend)

- **`services/crypto.js`:** seção underground → MODO A. Fora: fingerprint/generate/adopt/discard/`setUndergroundRoomKey`/wrap. Dentro: `setUndergroundRoomKeyFromServer` (decodifica a chave entregue) + `hasUndergroundRoomKey`/`encryptUndergroundPost`/`decryptUndergroundPost` (secretbox reaproveitado). Barrel e `clearAllCaches` ajustados.
- **`services/api/underground.js`:** `getPosts` guarda `data.roomKey` e decifra; **removidos** ensureRoomReady/runDistributorSweep/roomInit/getPendingKeys/distributeKeys/rekey; `reportPost` → `{post_id, reason}`; export sem `rekey`.
- **`components/community/SpaceLock.jsx`:** removido `ensureUserKeys` pré-unlock, o tratamento de `409 KEYPAIR_REQUIRED` e o import de crypto.
- **`hooks/useUnderground.js`:** `roomStatus` agora `'ready' | 'error'` (sem `'pending'`); realtime decifra normalmente.
- **`components/underground/UndergroundFeed.jsx`:** banner de pendência removido; ReportModal sem estado `stale`/`REPORT_STALE`; comentários MODO A.
- **i18n (18 línguas):** `roomPending`/`reportStale`/`keypairError` removidas; `reportWarning` → "a moderação poderá ler este post" (PT validado; método byte-estável EOL-aware, 18/18).
- **`underground.css`:** estilo `.underground-room-status` removido.

---

## 4. Ordem de deploy (aguardando seu OK)

Worker **antes** do site (o site novo espera `roomKey` no GET; o worker novo é quem a entrega e faz o bootstrap):

1. `cd api && npx wrangler deploy --env production` → anotar versão.
2. `cd site && npx wrangler pages deploy dist --project-name=philosify-frontend --branch=production` → anotar deployment id.
3. Verificações automatizáveis: `GET /api/underground` autenticado retorna `roomKey`; console sem erro; 1º acesso cria a sala (SQL: `select count(*), (encrypted_room_key is not null) from underground_room;` → 1 / true).

**Sem commit** — consolidação única após o smoke passar.

---

## 5. Smoke reduzido (seu — 2 contas, navegadores persistentes)

- [ ] **Conta A:** unlock (3 créditos, sem exigência de keypair) → nickname → **publicar** → post aparece decifrado. Console sem erro de chave.
- [ ] **Conta B:** unlock → nickname → o feed de A aparece **decifrado de imediato** (a chave é entregue no GET, sem pendência) → **B publica** → **A vê em tempo real, decifrado**.
- [ ] **Denúncia:** B denuncia um post de A → aviso "a moderação poderá ler este post" → enviar → sucesso. SQL: `select post_id, reason, plaintext is null as sem_plaintext from underground_reports order by created_at desc limit 1;` → **sem_plaintext = true**.
- [ ] **Servidor cego (repouso):** `select count(*) from underground_posts where content is not null;` → **0** (só ciphertext).
- [ ] **Moderação:** `POST /api/underground/admin/decrypt` com header `x-admin-secret` + `{post_id}` → devolve o plaintext + autoria; **sem** o header (ou errado) → **404 bland**. SQL: `select post_id, actor, created_at from underground_moderation_log order by created_at desc limit 1;` → **1 linha** (auditoria gravada).
- [ ] (Bônus) Recarregar A **sem** o keypair antigo → funciona igual (não há mais dependência de keypair no Underground).

Qualquer falha: parar no ponto e reportar. **Aguardo seu OK para o deploy.**
