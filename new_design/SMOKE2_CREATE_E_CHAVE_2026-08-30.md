# Smoke Underground — 2º round: create 500 + conta A no 409 KEYPAIR_REQUIRED

**Data:** 2026-08-30
**Contexto:** deploy dos fixes das frentes 1/2 no ar (worker `a52504e2`, site `941d8644`). Bob rodou o smoke; conta B (`r_rachewsky@hotmail.com`) liberou o composer mas o POST de post deu 500; conta A segue barrada no unlock com 409 KEYPAIR_REQUIRED.
**Método:** tail de produção (`wrangler tail --env production --format json`) + leitura estática. **Nenhuma edição/deploy** — diagnóstico + diffs propostos, aguardando OK.

---

## Achado 1 — Create 500: `content` NOT NULL vs insert `content: null`

### Evidência (tail, ao vivo, ~horário do teste)
Linha real capturada — é o caminho de erro **tratado** do insert (`underground.js:359-366`), não o catch externo (`Create exception: 0` no tail):
```
[Underground] Create failed: null value in column "content" of relation "underground_posts" violates not-null constraint
[i18n] Unknown error key: FAILED_TO_CREATE_POST
```

### Causa raiz (confirmada nas duas pontas)
- Backend E2E-only insere **`content: null`** (`api/src/handlers/underground.js:344`), texto cifrado em `encrypted_content` — design correto (servidor cego).
- A coluna `underground_posts.content` **continua `NOT NULL`**. A migração `migrations/underground_room_e2e.sql` cria `underground_room`/`underground_reports` e colunas de `space_access`, mas **não** altera `underground_posts.content` (só o referencia no count de pré-flight, linha 36). → **gap da migração (DIFF 1).**

### Candidatos descartados para ESTE 500
- **(b) broadcast pós-insert falhando:** não — o insert falhou **antes** do broadcast (log é o do ramo `if (error)`, não do catch externo).
- **(c) caminho novo §2.4:** não — `Create exception: 0`, nenhum throw no caminho novo. O único ponto que quebrou é a constraint do banco.
- Observação: o broadcast é uma **segunda falha latente** — só será exercitado quando o insert passar; vigiar no próximo teste.

### Fix 1a — migração (aplicação do Bob no SQL Editor)
Antes, confirmar o schema real (autoritativo, encerra a dúvida sobre `content`/`is_encrypted` e revela qualquer segundo NOT NULL escondido):
```sql
select column_name, is_nullable, column_default, data_type
from information_schema.columns
where table_name = 'underground_posts'
  and column_name in ('content','encrypted_content','nonce','is_encrypted','reply_to_id');
```
Correção:
```sql
ALTER TABLE underground_posts ALTER COLUMN content DROP NOT NULL;
```
Seguro: posts E2E têm `content` legitimamente nulo (texto vive em `encrypted_content`). *(Opcional, integridade: `ALTER TABLE underground_posts ADD CONSTRAINT underground_posts_body_present CHECK (content IS NOT NULL OR encrypted_content IS NOT NULL);` — não é necessário pro smoke.)*

### Fix 1b — stack nos catches de create/edit (pedido do Bob)
Os catches externos logam só `err.message` (como o do GET antes do fix). Diffs:
```diff
# api/src/handlers/underground.js:396 (Create exception)
-    console.error("[Underground] Create exception:", err.message);
+    console.error("[Underground] Create exception:", err.message, err.stack);
```
```diff
# api/src/handlers/underground.js:779 (Edit exception)
-    console.error("[Underground] Edit exception:", err.message);
+    console.error("[Underground] Edit exception:", err.message, err.stack);
```

### Fix 1c — chave i18n ausente (secundário, não bloqueia)
`FAILED_TO_CREATE_POST` (usada em `underground.js:362` e `:398`) **não está no mapa de erros** → `[i18n] Unknown error key` e usuário recebe fallback. Adicionar a chave ao mapa de `getLocalizedError`. Follow-up, não trava o fluxo.

---

## Achado 2 — Conta A no 409 KEYPAIR_REQUIRED: `ensureUserKeys` pula o registro server-side

### Onde o 409 nasce (backend)
`api/src/handlers/spaces.js:101-117` — unlock do `underground` exige linha em `user_public_keys`; sem ela → **409 `KEYPAIR_REQUIRED`**, antes de qualquer reserva de crédito (correto: keyless não é cobrado). Esse retorno é limpo e **não loga** (por isso `KEYPAIR: 0` no tail).

### Causa raiz (client) — `site/src/services/crypto.js:53-85`
```js
const hasKeys = await hasKeyPair();          // IndexedDB, local
if (hasKeys) {
  const publicKey = await getPublicKeyBase64();
  logger.log('[E2E] Using existing keypair');
  return publicKey;                          // ← early-return SEM registrar no servidor
}
// só o ramo "gerar nova" tenta registrar — e engole falha ("Don't throw", linha 79-82)
```
**Ter keypair local NÃO implica registro em `user_public_keys`.** Duas rotas deixam o servidor sem a chave enquanto o client acha que está tudo certo:
1. `hasKeys === true` (chave da era E2E-opcional, ou de tentativa anterior) → early-return, **nunca registra**.
2. `hasKeys === false` → gera, POST de registro **falha e é engolida** (linha 79-82: "Don't throw").

E `SpaceLock.jsx:35-41` ainda **engole** qualquer throw de `ensureUserKeys` (só `logger.warn`) e segue para o unlock → 409. **Três camadas de swallow** escondem a falha.

### Por que B passou e A não
- B (era de teste) já tinha (ou registrou com sucesso) linha em `user_public_keys` → passou o gate.
- A tem keypair **local** mas **sem** linha no servidor → early-return → 409, determinístico e **sem auto-cura** (todo retry cai no mesmo early-return).
- Tail corrobora: `/api/crypto/keys` = **1** request, `[Crypto] Public key registered` = **0** — ninguém registrou com sucesso na janela.

### Evidência que fecha (console do BROWSER — lado do Bob)
`ensureUserKeys` e `SpaceLock` logam no browser, não no worker. Na conta A, esperar um destes:
- `[E2E] Using existing keypair` **sem** `[E2E] Public key registered with server` depois → rota 1 (early-return).
- `[E2E] Generating new keypair...` + `[E2E] Failed to register public key: <err>` → rota 2 (POST falhou).
Mais `[SpaceLock] ensureUserKeys failed:` se houve throw.

### Fix 2a — client: SEMPRE registrar (idempotente), `site/src/services/crypto.js`
```diff
-  const hasKeys = await hasKeyPair();
-
-  if (hasKeys) {
-    const publicKey = await getPublicKeyBase64();
-    logger.log('[E2E] Using existing keypair');
-    return publicKey;
-  }
-
-  // Generate new keypair
-  logger.log('[E2E] Generating new keypair...');
-  const keyPair = generateKeyPair();
-  await storeKeyPair(keyPair);
-
-  // Register public key with server
-  const { to_base64 } = await import('libsodium-wrappers').then((m) => m.default);
-  const publicKeyBase64 = to_base64(keyPair.publicKey);
-
-  try {
-    await cryptoApi.registerPublicKey(publicKeyBase64);
-    logger.log('[E2E] Public key registered with server');
-  } catch (error) {
-    logger.error('[E2E] Failed to register public key:', error);
-    // Don't throw - key is stored locally, can retry later
-  }
-
-  return publicKeyBase64;
+  const hasKeys = await hasKeyPair();
+
+  let publicKeyBase64;
+  if (hasKeys) {
+    publicKeyBase64 = await getPublicKeyBase64();
+    logger.log('[E2E] Using existing keypair');
+  } else {
+    logger.log('[E2E] Generating new keypair...');
+    const keyPair = generateKeyPair();
+    await storeKeyPair(keyPair);
+    const { to_base64 } = await import('libsodium-wrappers').then((m) => m.default);
+    publicKeyBase64 = to_base64(keyPair.publicKey);
+  }
+
+  // ALWAYS register: a local keypair does NOT imply the server has it
+  // (E2E-optional-era keys were never pushed; a prior POST may have failed
+  // silently). This is the exact gate for unlock (409 KEYPAIR_REQUIRED).
+  // Idempotent server-side, so re-calling is cheap and self-heals on retry.
+  try {
+    await cryptoApi.registerPublicKey(publicKeyBase64);
+    logger.log('[E2E] Public key registered with server');
+  } catch (error) {
+    logger.error('[E2E] Failed to register public key:', error);
+    // Not fatal here: unlock will surface 409 and the next attempt retries.
+  }
+
+  return publicKeyBase64;
```

### Fix 2b — server: upsert idempotente sem churn de versão, `api/src/handlers/crypto.js`
Com o client sempre registrando, evitar incrementar `key_version` quando a chave é a mesma:
```diff
     const { data: existing } = await supabase
       .from('user_public_keys')
-      .select('key_version')
+      .select('key_version, public_key')
       .eq('user_id', userId)
       .single();

     if (existing) {
+      // Idempotent: same key re-registered (ensureUserKeys now always calls
+      // this) must NOT churn key_version.
+      if (existing.public_key === publicKey) {
+        let response = jsonResponse({ success: true, keyVersion: existing.key_version, unchanged: true }, 200, origin, env);
+        return addRefreshedCookieToResponse(response, setCookieHeader);
+      }
       // Update existing key (key rotation)
       const { error } = await supabase
```

*(Opcional, robustez extra — fora do mínimo: `SpaceLock.jsx` poderia NÃO seguir para o unlock se `ensureUserKeys` lançar, mostrando o erro de chave direto em vez de deixar o 409 fazê-lo. Não é necessário: com 2a+2b o registro passa a acontecer e o retry auto-cura.)*

---

## Achado 3 (aberto) — como o composer de B liberou sem log de nascimento de sala?

Tail na janela: `Room initialized: 0`, `orphan-winner: 0`, `distributed keys: 0`. Ou a sala nasceu **antes** de eu abrir o tail, ou B liberou por outro caminho. **Não teorizar** — resolver por SQL (abaixo). Se a sala não nasceu e B mesmo assim cifrou um post, há risco de o `encrypted_content` de B estar cifrado com chave órfã (ilegível por outros) — a confirmar.

---

## SQL de apoio (Bob roda; confirmar o ref de PRODUÇÃO antes)
```sql
-- 1) A sala nasceu? De quem é o fingerprint?
select id, key_fingerprint, created_by, created_at from underground_room;

-- 2) Estado das duas contas em space_access (chave embrulhada + quem distribuiu)
select sa.user_id, u.email, sa.nickname,
       (sa.encrypted_room_key is not null) as has_wrapped_key,
       sa.key_distributed_by
from space_access sa
join auth.users u on u.id = sa.user_id
where sa.space = 'underground'
  and u.email in ('r_rachewsky@hotmail.com', '<email_da_conta_A>');

-- 3) Registro de chave pública das duas contas (o gate do 409)
select u.email, k.user_id is not null as has_public_key, k.key_version, k.updated_at
from auth.users u
left join user_public_keys k on k.user_id = u.id
where u.email in ('r_rachewsky@hotmail.com', '<email_da_conta_A>');
```
Esperado se o diagnóstico estiver certo: **query 3** mostra `has_public_key = false` para a conta A e `true` para B.

---

## Consolidação — os dois achados **NÃO** compartilham causa raiz
- **Create 500** = schema (`underground_posts.content` NOT NULL). Independe de chaves.
- **A no 409** = lógica de registro de chave (`ensureUserKeys` early-return + swallow).

**Tema comum (não causa comum):** *erros engolidos* escondendo falhas — SpaceLock engole `ensureUserKeys`; `ensureUserKeys` engole o registro; os catches de create/edit/GET logavam sem stack. O padrão de conserto é o mesmo: registrar de verdade e/ou logar com stack.

---

## Diffs propostos (aguardando OK; sem deploy)
| # | Alvo | Tipo | Aplicação |
|---|---|---|---|
| 1a | `underground_posts.content` DROP NOT NULL | migração | Bob no SQL Editor |
| 1b | stack em Create/Edit exception (`underground.js:396,779`) | worker | deploy worker |
| 1c | chave i18n `FAILED_TO_CREATE_POST` | worker | deploy worker (secundário) |
| 2a | `ensureUserKeys` sempre registra (`services/crypto.js`) | site | deploy site |
| 2b | registro idempotente sem churn (`crypto.js` handler) | worker | deploy worker |

**Ordem sugerida quando houver OK:** 1a (destrava B na hora) → 1b/1c/2b (worker) → 2a (site) → smoke recomeça. Nada aplicado até seu OK.
