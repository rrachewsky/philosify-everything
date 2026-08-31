# MODO A — moderação por sessão autenticada (admin decrypt) · DIFF para OK

**Data:** 2026-08-31 · **Status:** ✅ **aplicado e deployado** (worker `9fb0f1d6`). Site inalterado. **Sem commit.**
**Deploy vigente:** worker `9fb0f1d6-1d47-4d8c-bbde-9d8f29892168` · site `7a2d6bbf` (inalterado).

## Execução (2026-08-31)

- Diffs §2 (`underground.js`: helper `isAdminUser` + auth de duas vias + cookie renovado) e §3 (`wrangler.toml`: binding `ADMIN_USER_IDS`) **aplicados**.
- `ADMIN_USER_IDS` criado no Secrets Store por Bob (valor = `c7ab2dcd-2803-4895-8336-33497171879f`, bob@bobrach.com, escopo Workers).
- Migração `migrations/broadcast_underground_post.sql` **gravada** (espelho vivo da função corrigida em produção; não re-aplicada — já está no banco).
- `wrangler deploy --dry-run` **verde**; `env.ADMIN_USER_IDS` resolve como Secrets Store Secret.
- `wrangler deploy --env production` **ok** → Version ID **`9fb0f1d6-1d47-4d8c-bbde-9d8f29892168`**.
- **Próximo:** Bob faz a prova no navegador logado (§5). Sem commit.

---

## 0. Objetivo (decisão do Bob)

`POST /api/underground/admin/decrypt` passa a aceitar **também** sessão autenticada de admin —
para a prova ser feita no navegador logado, **sem segredo no terminal**. `x-admin-secret`
continua válido para automação. Mesmo rate limit, mesmo **404 bland**, mesma auditoria
(`actor` = e-mail/id do admin no caminho de sessão).

## 1. Mecanismo escolhido — `ADMIN_USER_IDS` (Secrets Store)

Allowlist de UUIDs separada por vírgula/espaço, lida com `getSecret`. Vazio/ausente → nenhum
admin de sessão (o caminho `x-admin-secret` segue funcionando). Escolhido sobre `profiles.is_admin`
por: **zero mudança de schema**, sem query extra, **sem risco de auto-promoção** (não há caminho
de escrita — só o dashboard edita), e UUIDs **não** vão para o repo público (é secret). Espelha o
padrão de `ADMIN_SECRET`/`UNDERGROUND_ROOM_KEK`.

## 2. DIFF — `api/src/handlers/underground.js`

### 2a. Novo helper (logo após `constantTimeEqual`, ~linha 52)

```js
// Admin allowlist for the authenticated-session moderation path. ADMIN_USER_IDS
// is a comma/whitespace-separated list of user UUIDs (Secrets Store). Empty/unset
// → no session admins (the x-admin-secret automation path still works).
async function isAdminUser(env, userId) {
  if (!userId) return false;
  const raw = await getSecret(env.ADMIN_USER_IDS);
  if (!raw) return false;
  const ids = String(raw)
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return ids.includes(String(userId).toLowerCase());
}
```

### 2b. Auth do handler — substituir o bloco atual (989–1009)

**DE:**
```js
    // Rate limit by IP (no user context on the admin path).
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitOk = await checkRateLimit(env, `underground-admin-decrypt:${ip}`, true);
    if (!rateLimitOk) return bland();

    // Admin auth: shared secret in header. Any mismatch → 404 bland.
    const provided = request.headers.get("x-admin-secret") || "";
    const adminSecret = await getSecret(env.ADMIN_SECRET);
    if (!adminSecret || !(await constantTimeEqual(provided, adminSecret))) {
      return bland();
    }

    const body = await request.json().catch(() => ({}));
    const postId = body.post_id;
    const reportId = body.report_id || null;
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
    const actor =
      typeof body.actor === "string" && body.actor ? body.actor.slice(0, 200) : "admin";
    if (!postId || !UUID_REGEX.test(postId)) return bland();
    if (reportId && !UUID_REGEX.test(reportId)) return bland();
```

**PARA:**
```js
    // Rate limit by IP (applies to both auth paths).
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitOk = await checkRateLimit(env, `underground-admin-decrypt:${ip}`, true);
    if (!rateLimitOk) return bland();

    // Two accepted admin identities → an `actor` string for the audit row:
    //  (1) authenticated session whose user_id is in ADMIN_USER_IDS (browser path,
    //      no secret in the client), or (2) x-admin-secret === ADMIN_SECRET
    //      (automation). Neither → 404 bland.
    let actor = null;
    let viaSecret = false;
    let setCookieHeader = null;

    const auth = await getSupabaseForUser(request, env).catch(() => null);
    if (auth?.userId && (await isAdminUser(env, auth.userId))) {
      actor = auth.email || auth.userId; // verified identity — never from body
      setCookieHeader = auth.setCookieHeader || null;
    } else {
      const provided = request.headers.get("x-admin-secret") || "";
      const adminSecret = await getSecret(env.ADMIN_SECRET);
      if (adminSecret && (await constantTimeEqual(provided, adminSecret))) {
        viaSecret = true;
      }
    }
    if (!actor && !viaSecret) return bland();

    const body = await request.json().catch(() => ({}));
    const postId = body.post_id;
    const reportId = body.report_id || null;
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
    // Automation may name its actor; the session path is already the verified admin.
    if (viaSecret) {
      actor =
        typeof body.actor === "string" && body.actor
          ? body.actor.slice(0, 200)
          : "admin";
    }
    if (!postId || !UUID_REGEX.test(postId)) return bland();
    if (reportId && !UUID_REGEX.test(reportId)) return bland();
```

### 2c. Resposta — devolver cookie renovado no caminho de sessão (1043–1054)

**DE:**
```js
    return jsonResponse(
      {
        post_id: post.id,
        user_id: post.user_id,
        nickname: post.nickname,
        created_at: post.created_at,
        plaintext,
      },
      200,
      origin,
      env,
    );
```

**PARA:**
```js
    const response = jsonResponse(
      {
        post_id: post.id,
        user_id: post.user_id,
        nickname: post.nickname,
        created_at: post.created_at,
        plaintext,
      },
      200,
      origin,
      env,
    );
    return setCookieHeader
      ? addRefreshedCookieToResponse(response, setCookieHeader)
      : response;
```

**Imports:** `getSupabaseForUser` (17), `addRefreshedCookieToResponse` (18), `getSecret` (23) já existem no arquivo. Nenhum import novo.

## 3. DIFF — `api/wrangler.toml` (após o binding do `UNDERGROUND_ROOM_KEK`, ~linha 260)

```toml
# ADMIN_USER_IDS - allowlist (UUIDs separados por vírgula/espaço) para o caminho
# de moderação por sessão autenticada (Underground admin decrypt). x-admin-secret
# segue válido para automação.
[[env.production.secrets_store_secrets]]
binding = "ADMIN_USER_IDS"
store_id = "aa556a30980842c785cb0e1cbb0bb933"
secret_name = "ADMIN_USER_IDS"
```

## 4. Pré-requisito de deploy (Bob) — criar o secret ANTES do deploy

Como o `UNDERGROUND_ROOM_KEK`: o binding só resolve se o secret existir no Store.
1. Descobrir o UUID da conta admin: `select id, email from auth.users where email = '<seu e-mail admin>';`
2. Criar `ADMIN_USER_IDS` no Secrets Store (store `aa556a…933`) com valor = esse UUID
   (múltiplos admins depois: `uuid1,uuid2`).

Ordem: **secret criado → aplico diffs → dry-run → OK de deploy → deploy worker.** Site não muda.

## 5-RESULTADOS (2026-08-31, extensão Chrome no navegador do Bob)

- **Negativo ✅ PASSOU:** sessão logada era **não-admin** (sofia, `237148a2-a025-43d0-8c36-cc3ac54729ba`).
  Fetch autenticado ao admin decrypt → **404 `{"error":"Not found"}`** (bland). Confirma o gate da
  allowlist: usuário autenticado fora de `ADMIN_USER_IDS` não decifra. Nenhuma de-anonimização,
  nenhum write (o handler retorna antes de ler o post/gravar auditoria).
- **Positivo ✅ PASSOU** (Bob logou como bob@bobrach.com; nova aba, mesma sessão do Chrome):
  - Identidade: `/api/balance.userId` = `c7ab2dcd-2803-4895-8336-33497171879f` = admin. Gate OK.
  - Decrypt **200**: `post_id` `62d818c0…`, `nickname` **`theproducer`**, `plaintext` **`TEST2`**,
    `user_id` (autor) `c7ab2dcd…879f`, `created_at` `2026-08-31T05:00:31Z`.
  - Ou seja: sessão admin de-anonimiza e decifra; a mesma chamada como não-admin dá 404. Duas vias OK.
- **Auditoria (passo 5): ✅ CONFIRMADA** — `underground_moderation_log` com **1 linha**:
  `post_id` `62d818c0…`, `actor` **`bob@bobrach.com`**, `reason` `smoke moderação`,
  `created_at` `2026-08-31 15:45:51+00`. **Sem achado** — o insert de auditoria NÃO foi engolido.

**VEREDITO: moderação por sessão FECHADA E VERDE** (positivo ✅ + negativo ✅ + auditoria ✅).

## 5. Prova pós-deploy (Bob, navegador logado — sem segredo)

No console de `https://philosify.org` (conta admin logada):
```js
fetch('https://api.philosify.org/api/underground/admin/decrypt', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ post_id: '62d818c0-4ea1-4354-b4da-d74dfcd73f2d', reason: 'smoke moderação' }),
}).then(r => r.json()).then(console.log);
```
**Esperado:** `{ post_id, user_id, nickname, created_at, plaintext }` com `plaintext` = `TEST`/`TEST2`.
SQL: `select post_id, actor, created_at from underground_moderation_log;` → **1 linha**, `actor` = **e-mail do admin**.
Negativo: conta **não-admin** logada, mesmo fetch → **404 bland**.
Vigiar: 200 com plaintext **mas** 0 linhas no log = insert de auditoria engolido pelo client custom (achado).

## 6. Pendência separada — versionar a trigger corrigida

O create foi destravado **corrigindo** a função `broadcast_underground_post` (campos MODO A no lugar
de `NEW.message`/`reaction_clap`; `EXCEPTION WHEN OTHERS` não-bloqueante), **não** dropando. Para
versionar a fonte de produção em `migrations/`, preciso do dump atual:

```sql
SELECT pg_get_functiondef('public.broadcast_underground_post'::regproc) AS func_src;
SELECT tgname, pg_get_triggerdef(oid) AS trigger_def
FROM pg_trigger WHERE tgrelid = 'public.underground_posts'::regclass AND NOT tgisinternal;
```
Colar as duas saídas → salvo verbatim em `migrations/broadcast_underground_post.sql` (espelho vivo de produção).

## 7. Fila de follow-ups (mantida)

- realtime-token **401** (diagnóstico já pedido)
- `isOwn` no botão de **report** (não deve aparecer no próprio post)
- **saldo do header** após unlock
- **validação de apelido**

---

**Aguardo:** (a) OK no diff (seções 2–3); (b) as duas saídas SQL da seção 6. **Sem deploy até o OK.**
