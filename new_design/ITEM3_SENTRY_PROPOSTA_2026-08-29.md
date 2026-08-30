# Pacote Pré-Privacy — ITEM 3: Sentry, restabelecer de propósito (proposta)

**Data:** 2026-08-29
**Status:** mapeamento completo + diffs de código **para aprovação — nada aplicado**. A ativação em si (colar DSNs) é do Bob.

---

## 1. Estado atual (por que o Sentry está morto hoje)

| Lado | Código | O que falta |
|---|---|---|
| **Site** | SDK completo em `site/src/utils/sentry.js` (`@sentry/react`, tracing + **Session Replay** 10%/100%-erro, `maskAllText:true`), `initSentry()` em `main.jsx:14`, gate `import.meta.env.PROD` | `VITE_SENTRY_DSN` não existe em `site/.env.production:1-4` → `Sentry.init({dsn: undefined})` = SDK desativado no build atual |
| **Worker** | Implementação custom em `api/src/utils/sentry.js` com **2 call sites vivos**: `api/index.js:473` (captureMessage — requisição suspeita bloqueada) e `api/index.js:2102` (captureException — erro no checkout Stripe) | (a) secret `SENTRY_DSN` não existe (nem binding no `wrangler.toml:117-248`); (b) **bug latente**: o código usa `env.SENTRY_DSN` como string (`sentry.js:12,19-20`), mas um binding do Secrets Store é objeto com `.get()` — ativado sem correção, todo report falharia silenciosamente ("Error reporting failed") |

Fatos de contorno verificados:
- `site/.env.production` e `site/.env` são **git-ignorados** (`site/.gitignore:9-10`) — o DSN do site vive só na máquina de build. (De todo modo o DSN do front é público por natureza: vai inlined no bundle JS.)
- O build do site é **local** (`npm run build` + `wrangler pages deploy dist` — direct upload). Variáveis no dashboard do Pages **não** afetam o build; o lugar certo é o `.env.production` local.
- `sanitizeHeaders` do worker já redige `authorization`/`cookie`/`x-api-key` (`api/src/utils/sentry.js:113-127`).
- `setUser(userId, email)` existe (`site/src/utils/sentry.js:93-99`) mas **não tem nenhum chamador** (único import do módulo: `initSentry` em `main.jsx:8`) — a remoção do e-mail é à prova de futuro, sem chamadores a ajustar.
- CSP: `site/public/_headers:49` já permite `connect-src … https://o22381.ingest.us.sentry.io`.

---

## 2. LISTA PASSO A PASSO — o que o Bob cria/copia no dashboard do Sentry

(nenhum DSN inventado; tudo abaixo sai do dashboard)

1. **sentry.io → sua organização.** O CSP atual referencia a org `o22381` (host `o22381.ingest.us.sentry.io`) — confirmar se essa org ainda é sua e está ativa.
2. **Projeto do site:** Settings → Projects → abrir o projeto React existente (ou *Create Project* → plataforma **React**). Em **Settings → Client Keys (DSN)**, copiar o DSN.
3. **Projeto do worker:** recomendo um projeto separado (*Create Project* → plataforma **JavaScript** — a implementação custom usa o endpoint `/api/{projectId}/store/`, que aceita qualquer DSN). Copiar o DSN dele.
4. **Site — colar o DSN:** na máquina de build, editar `site/.env.production` e acrescentar a linha `VITE_SENTRY_DSN=<DSN do passo 2>`. (Arquivo git-ignorado; nada a commitar.)
5. **Worker — criar o secret:** Cloudflare Dashboard → Workers & Pages → Account Settings → **Secrets Store** (store `aa556a30980842c785cb0e1cbb0bb933`) → *Add secret* → nome exato `SENTRY_DSN`, valor = DSN do passo 3. (O binding no wrangler.toml entra no diff abaixo.)
6. **Conferir o host de ingest:** no DSN, o host é a parte depois do `@` (ex.: `o22381.ingest.us.sentry.io`). **Se os DSNs dos passos 2/3 tiverem host diferente do que está no CSP** (`_headers:49`) — org nova, ou região EU (`*.de.sentry.io`) — me avise com o host correto que eu ajusto o `_headers` em 1 linha. Se for o mesmo `o22381.ingest.us.sentry.io`, nada a fazer.
7. **Recomendado (privacidade):** no Sentry, Settings → Security & Privacy → manter **Server-Side Data Scrubbing** ligado.
8. **Deploys** (seus, fora deste item): rebuild+deploy do site (para o DSN entrar no bundle) e deploy do worker (para o binding valer).

---

## 3. DIFFS DE CÓDIGO (aguardando OK)

### A — `site/src/utils/sentry.js`: setUser só com user_id (remove e-mail)

```diff
 /**
  * Set user context
  */
-export function setUser(userId, email) {
+export function setUser(userId) {
   if (import.meta.env.PROD) {
     Sentry.setUser({
       id: userId,
-      email: email,
     });
   }
 }
```

(Sem chamadores a ajustar — verificado. Session Replay fica exatamente como está: 10% sessões / 100% com erro / `maskAllText:true`.)

### B — `site/.env.example`: documentar a variável (sem valor)

```diff
 # Analytics (future)
 VITE_GA_TRACKING_ID=
+# Sentry error tracking (leave empty to disable; the DSN is inlined into the public bundle)
+VITE_SENTRY_DSN=
```

### C — `api/src/utils/sentry.js`: resolver o DSN via getSecret (correção obrigatória para o Secrets Store)

```diff
 // Sentry Error Monitoring for Cloudflare Workers
 // Lightweight error tracking without official SDK
+
+import { getSecret } from './secrets.js';
@@ captureException @@
 export async function captureException(error, context = {}, env = {}) {
-  // Skip if no Sentry DSN configured
-  if (!env.SENTRY_DSN) {
+  // Skip if no Sentry DSN configured (Secrets Store binding or .dev.vars string)
+  const dsn = env.SENTRY_DSN ? await getSecret(env.SENTRY_DSN) : null;
+  if (!dsn) {
     console.error('[Sentry] No DSN configured, skipping error report:', error);
     return;
   }
 
   try {
-    // Parse DSN
-    const dsn = env.SENTRY_DSN;
     const dsnMatch = dsn.match(/https:\/\/(.+)@(.+)\/(\d+)/);
@@ captureMessage @@
 export async function captureMessage(message, level = 'info', context = {}, env = {}) {
-  if (!env.SENTRY_DSN) return;
+  const dsn = env.SENTRY_DSN ? await getSecret(env.SENTRY_DSN) : null;
+  if (!dsn) return;
 
   try {
-    const dsn = env.SENTRY_DSN;
     const dsnMatch = dsn.match(/https:\/\/(.+)@(.+)\/(\d+)/);
```

(`getSecret` devolve string tal-qual em dev via `.dev.vars` e resolve `.get()` no Secrets Store — mesmo padrão do resto do worker.)

### D — `api/wrangler.toml`: binding do secret (ao final da lista de secrets de produção)

```diff
 # STRIPE_ADS_WEBHOOK_SECRET - Webhook verification for ads billing
 [[env.production.secrets_store_secrets]]
 binding = "STRIPE_ADS_WEBHOOK_SECRET"
 store_id = "aa556a30980842c785cb0e1cbb0bb933"
 secret_name = "STRIPE_ADS_WEBHOOK_SECRET"
+
+# SENTRY_DSN - Worker error reporting (Sentry)
+[[env.production.secrets_store_secrets]]
+binding = "SENTRY_DSN"
+store_id = "aa556a30980842c785cb0e1cbb0bb933"
+secret_name = "SENTRY_DSN"
```

### CSP — sem diff por ora

`_headers:49` já permite `https://o22381.ingest.us.sentry.io`. Só muda se o host do DSN real divergir (passo 6 acima).

---

## 4. Ponto de decisão para o Bob (fora dos diffs; sem mudança até você decidir)

O call site de segurança `api/index.js:473-478` envia **IP e user-agent crus** no `extra` do evento Sentry ("blocked suspicious request"). É telemetria de segurança legítima (o e-mail de alerta paralelo já carrega o mesmo), mas com o Sentry ativo isso passa a ser dado pessoal retido num terceiro. Opções: **(a) manter** e declarar na Privacy v2 (minha recomendação — sinal antifraude com propósito claro), ou **(b) minimizar** (remover ip/ua do evento Sentry, mantendo-os só no e-mail de alerta). Diga a/b.

---

## Estado do pacote

| Item | Status |
|---|---|
| 1 — Exclusão de sessões Zona Insegura | Aplicado e commitado (`392fa28`) |
| 2 — IP de impressões 48h | Aplicado e commitado (`392fa28`) |
| 3 — Sentry | **Proposta entregue — aguardando OK dos diffs A-D + resposta do passo 6 (host) + decisão a/b** |
| 4 — Log de cookie | Aplicado e commitado (`392fa28`) |
| 5 — Underground E2E | Não iniciado (passo prévio: contagem de posts + decisão do Bob) |
