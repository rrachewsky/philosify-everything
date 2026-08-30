# Pacote Pré-Privacy — ITEM 5, DIFF 2: backend

**Data:** 2026-08-29
**Status:** **APLICADO** com os 2 ajustes do OK condicionado (abaixo). Dry-run do worker OK. Sem commit.

**Ajustes do OK (29/08):**
1. **UUID_REGEX:** já existia em `underground.js:23-24` (declaração original do arquivo, preservada no bloco de constantes) — nenhuma declaração nova necessária; `distribute-keys` e `report` a usam sem risco de runtime.
2. **Auto-cura do vencedor órfão** no caminho 409 do `room-init`: se `meta.key_fingerprint === fingerprint` enviado E a `encrypted_room_key` do chamador é NULL, grava a `encryptedKey` na própria linha (`key_distributed_by` = ele mesmo, filtro `...&encrypted_room_key=is.null`) antes de responder `winner:false`. Cobre a falha entre o INSERT da meta e a gravação da cópia (sala inicializada com zero chaveados = morta). Um perdedor legítimo tem fingerprint DIFERENTE (o hash amarra a chave que ele mesmo gerou), então a cura nunca dispara para ele; pior caso é auto-DoS com fingerprint copiado do GET — curado por `rekey`.

**Verificações pós-aplicação:** `npx wrangler deploy --dry-run` OK; grep confirma zero referências órfãs a `MAX_POST_LENGTH`/`URL_PATTERN`/`sanitizeMessage`/`isEncrypted`-variável (só os campos de resposta derivados de `is_encrypted` do banco).
**Base:** desenho aprovado (§2/§3 + §2.8) + reforços 1-2 do OK final + DIFF 1 aplicado em produção (verificação 1/1/2/t/t/0/2/0; 3 membros da era de teste como pendentes).

---

## 0. Decisões de implementação (para o OK cobrir)

1. **Dois clients no handler:** a autenticação e as operações "no próprio nome" continuam no client de usuário (`getSupabaseForUser`, RLS + refresh de cookie), mas `underground_room` e `underground_reports` são **RLS-sem-policies** e a distribuição escreve em linhas de OUTROS usuários — essas operações usam o client service (`getServiceSupabase`), sempre com filtros explícitos. Precedente: `handleSetCollectiveKeys` (`crypto.js:252-329`).
2. **Árbitro da corrida sem `ON CONFLICT`:** o client service custom não expõe `Prefer: resolution=ignore-duplicates`; o INSERT na meta com PK fixa devolve **409 do PostgREST** em conflito — o handler trata `error.status === 409` como "perdeu a corrida" (efeito idêntico ao `ON CONFLICT DO NOTHING` + leitura da meta para devolver o fingerprint vencedor).
3. **Erros: string plana + `code` de máquina** (`KEYPAIR_REQUIRED`, `E2E_REQUIRED`, `REPORT_STALE`, `NOT_KEYED_MEMBER`…), sem tocar `i18n-errors.js` (arquivo com 2 testes pré-existentes falhando — não conflar). A UI do DIFF 4 traduz pelos codes, nas 18 línguas.
4. **`sanitizeMessage` sai do import** de underground.js — sem uso após a remoção do plaintext (sem código de legado, como ordenado).
5. **distribute-keys não expõe contagem exata de afetadas** (mesma limitação do client vista no item 2); responde as tentativas; o preenchimento é idempotente (só onde NULL).
6. **Tetos**: reason ≤ 500, plaintext ≤ 10000 (espelham os CHECKs do banco); `encryptedKey` ≤ 512; fingerprint = 64 hex.

---

## 1. `api/src/handlers/spaces.js` — unlock exige keypair (escopado ao underground)

Inserido **após** o check "already unlocked" (`:95`) e **antes** da reserva de créditos (falha antes de cobrar):

```js
    // UNDERGROUND E2E (item 5, desenho §2.1): unlock requires a registered
    // public key so the room key can be wrapped for this member. Scoped to
    // this space only — the forum flow is untouched.
    if (space === "underground") {
      const { data: pubkey } = await supabase
        .from("user_public_keys")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!pubkey) {
        return jsonResponse(
          {
            error: "A public key must be registered before unlocking",
            code: "KEYPAIR_REQUIRED",
          },
          409,
          origin,
          env,
        );
      }
    }
```

(Leitura de `user_public_keys` pelo client de usuário é o padrão existente — `crypto.js:34-38`.)

---

## 2. `api/src/handlers/underground.js`

### 2.1 Cabeçalho — imports e comentário

```diff
 // ============================================================
 // HANDLER - THE UNDERGROUND (Anonymous Confessions)
 // ============================================================
-// Anonymous posts with reactions. Requires unlocked access (3 credits).
-//
-// E2E ENCRYPTION:
-// - Posts can be encrypted with a shared room key
-// - All unlocked users share the same room key
-// - Server cannot read encrypted posts (zero-knowledge)
+// Anonymous posts with reactions. Requires unlocked access (3 credits).
+//
+// E2E ENCRYPTION (mandatory — pacote pré-privacy item 5):
+// - Every post is encrypted with the shared room key; plaintext is
+//   rejected (E2E_REQUIRED). The server stores ciphertext only.
+// - The room key lives exclusively in members' browsers; the server
+//   holds per-member wrapped copies (space_access.encrypted_room_key)
+//   and the key fingerprint (underground_room) — never the key.
+// - Reports carry voluntary plaintext decrypted by the REPORTER's
+//   browser, verified against the stored ciphertext (design §2.8).
 
-import { jsonResponse, sanitizeMessage } from "../utils/index.js";
+import { jsonResponse } from "../utils/index.js";
 import {
   getSupabaseForUser,
   addRefreshedCookieToResponse,
 } from "../utils/supabase-user.js";
+import { getServiceSupabase } from "../utils/supabase.js";
 import { checkRateLimit } from "../rate-limit/index.js";
 import { getLocalizedError } from "../utils/i18n-errors.js";
 
 const MAX_POST_LENGTH = 1000;
 const MAX_ENCRYPTED_LENGTH = 4000;
+const MAX_NONCE_LENGTH = 200;
+const MAX_REASON_LENGTH = 500;       // mirrors underground_reports CHECK
+const MAX_REPORT_PLAINTEXT = 10000;  // mirrors underground_reports CHECK
+const MAX_WRAPPED_KEY_LENGTH = 512;
+const FINGERPRINT_REGEX = /^[0-9a-f]{64}$/i;
+const PENDING_BATCH = 50;
 const PAGE_SIZE = 30;
```

(`MAX_POST_LENGTH` e `URL_PATTERN` **saem** junto com os branches plaintext — sem uso restante; ver 2.4/2.5.)

### 2.2 GET `/api/underground` — resposta ganha a meta da sala

Após montar `postsWithReactions`, antes da resposta (`:171-181`):

```diff
+    // Room meta (service client: underground_room is service_role-only).
+    // roomInitialized=false → this client may run room-init (design §2.2).
+    const service = await getServiceSupabase(env);
+    const { data: roomRows } = await service
+      .from("underground_room")
+      .select("key_fingerprint", { limit: 1 });
+    const room = Array.isArray(roomRows) ? roomRows[0] : roomRows;
+
     // Include encrypted room key if available
     let response = jsonResponse(
       {
         posts: postsWithReactions,
         myNickname: access.nickname,
         encryptedRoomKey: access.encrypted_room_key || null,
+        roomInitialized: !!room,
+        roomFingerprint: room?.key_fingerprint || null,
       },
```

### 2.3 Helper interno — reforço 1 (usado por pending-keys e distribute-keys)

```js
// ============================================================
// Reforço 1 (OK final): only an access-holder that ALREADY holds a
// wrapped room key may list pending members or distribute copies.
// Returns the caller's access row via the service client, or null.
// ============================================================
async function getKeyedAccess(service, userId) {
  const { data: rows } = await service
    .from("space_access")
    .select("id, encrypted_room_key", {
      filter: `user_id=eq.${userId}&space=eq.underground`,
      limit: 1,
    });
  const access = Array.isArray(rows) ? rows[0] : rows;
  if (!access || !access.encrypted_room_key) return null;
  return access;
}
```

### 2.4 POST `/api/underground` (create) — só cifrado

Substitui o bloco `:256-290` (parse + validação) e ajusta o insert `:317-325`:

```diff
     const body = await request.json();
     lang = body.lang || 'en';
-    const content = sanitizeMessage((body.content || "").trim());
     const encryptedContent = body.encrypted_content || null;
     const nonce = body.nonce || null;
-    const isEncrypted = !!(encryptedContent && nonce);
     const replyToId = body.reply_to_id || null;
 
-    // Validate: either plaintext or encrypted
-    if (isEncrypted) {
-      if (encryptedContent.length > MAX_ENCRYPTED_LENGTH) {
-        ... (UNDERGROUND_ENCRYPTED_CONTENT_TOO_LARGE)
-      }
-    } else {
-      if (!content || content.length > MAX_POST_LENGTH) {
-        ... (UNDERGROUND_CONTENT_REQUIRED)
-      }
-      // Block URLs in plaintext
-      if (URL_PATTERN.test(content)) {
-        ... (UNDERGROUND_LINKS_NOT_ALLOWED)
-      }
-    }
+    // E2E only (design §2.7): the Underground stores ciphertext exclusively.
+    if (
+      !encryptedContent ||
+      !nonce ||
+      typeof encryptedContent !== "string" ||
+      typeof nonce !== "string"
+    ) {
+      return jsonResponse(
+        { error: "Encrypted content required", code: "E2E_REQUIRED" },
+        400,
+        origin,
+        env,
+      );
+    }
+    if (
+      encryptedContent.length > MAX_ENCRYPTED_LENGTH ||
+      nonce.length > MAX_NONCE_LENGTH
+    ) {
+      return jsonResponse(
+        { error: getLocalizedError('UNDERGROUND_ENCRYPTED_CONTENT_TOO_LARGE', lang) },
+        400,
+        origin,
+        env,
+      );
+    }
@@ insert @@
     const insertData = {
       user_id: userId,
       nickname: access.nickname,
-      content: isEncrypted ? "[Encrypted]" : content,
+      content: null,
       encrypted_content: encryptedContent,
       nonce: nonce,
-      is_encrypted: isEncrypted,
+      is_encrypted: true,
       reply_to_id: replyToId,
     };
```

### 2.5 PATCH `/api/underground/:id` (edit) — mesma regra

Bloco `:675-706` substituído pela mesma validação só-cifrado de 2.4; `updateData` (`:708-714`) vira `content: null` / `is_encrypted: true`.

### 2.6 Handlers novos (adicionados ao final do arquivo)

```js
// ============================================================
// POST /api/underground/room-init — nascimento da sala (design §2.2)
// O INSERT na meta (PK fixa id=1) é o árbitro atômico da corrida:
// conflito (409 do PostgREST) = perdeu; o perdedor NÃO grava nada e
// recebe o fingerprint vencedor para cair no estado pendente.
// ============================================================
export async function handleUndergroundRoomInit(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  // Reforço 2: rate limit padrão do worker
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `underground-roominit:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  try {
    const body = await request.json();
    const fingerprint = (body.fingerprint || "").toLowerCase();
    const encryptedKey = body.encryptedKey || null;

    if (!FINGERPRINT_REGEX.test(fingerprint)) {
      return jsonResponse({ error: "Invalid fingerprint" }, 400, origin, env);
    }
    if (
      !encryptedKey ||
      typeof encryptedKey !== "string" ||
      encryptedKey.length > MAX_WRAPPED_KEY_LENGTH
    ) {
      return jsonResponse({ error: "Invalid encrypted key" }, 400, origin, env);
    }

    const service = await getServiceSupabase(env);

    // Must be an access-holder (any; keyed or pending)
    const { data: accessRows } = await service
      .from("space_access")
      .select("id, encrypted_room_key", {
        filter: `user_id=eq.${userId}&space=eq.underground`,
        limit: 1,
      });
    const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
    if (!access) {
      return jsonResponse(
        { error: "Underground access required", code: "ACCESS_REQUIRED" },
        403,
        origin,
        env,
      );
    }

    // The arbiter: fixed-PK insert; PostgREST 409 = lost the race
    const { error: insertError } = await service.from("underground_room").insert({
      id: 1,
      key_fingerprint: fingerprint,
      created_by: userId,
    });

    if (insertError) {
      if (insertError.status === 409) {
        const { data: metaRows } = await service
          .from("underground_room")
          .select("key_fingerprint", { limit: 1 });
        const meta = Array.isArray(metaRows) ? metaRows[0] : metaRows;

        // Auto-cura do vencedor órfão (ajuste do OK, 29/08): se a meta
        // carrega EXATAMENTE o fingerprint enviado e o chamador segue sem
        // cópia, a falha anterior ficou entre o INSERT da meta e a gravação
        // da cópia — sem isto a sala nasceria com zero membros chaveados
        // (morta para sempre). Escrita restrita à PRÓPRIA linha e só onde
        // NULL: pior caso é auto-DoS, curado por rekey.
        if (
          meta?.key_fingerprint === fingerprint &&
          !access.encrypted_room_key
        ) {
          await service
            .from("space_access")
            .update(
              { encrypted_room_key: encryptedKey, key_distributed_by: userId },
              `user_id=eq.${userId}&space=eq.underground&encrypted_room_key=is.null`,
            );
          console.log(`[Underground] room-init orphan-winner self-heal for ${userId}`);
        }

        let response = jsonResponse(
          { winner: false, fingerprint: meta?.key_fingerprint || null },
          200,
          origin,
          env,
        );
        return addRefreshedCookieToResponse(response, setCookieHeader);
      }
      console.error("[Underground] room-init failed:", insertError.message);
      return jsonResponse({ error: "Failed to initialize room" }, 500, origin, env);
    }

    // Winner: store own wrapped copy
    const { error: keyError } = await service
      .from("space_access")
      .update(
        { encrypted_room_key: encryptedKey, key_distributed_by: userId },
        `user_id=eq.${userId}&space=eq.underground`,
      );
    if (keyError) {
      console.error("[Underground] room-init key write failed:", keyError.message);
      return jsonResponse({ error: "Failed to store room key" }, 500, origin, env);
    }

    console.log(`[Underground] Room initialized by ${userId}`);
    let response = jsonResponse({ winner: true, fingerprint }, 201, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] room-init exception:", err.message);
    return jsonResponse({ error: "Failed to initialize room" }, 500, origin, env);
  }
}

// ============================================================
// GET /api/underground/pending-keys — pendentes + públicas (design §2.3)
// Reforço 1: 403 se o chamador não for membro COM chave.
// ============================================================
export async function handleUndergroundPendingKeys(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  try {
    const service = await getServiceSupabase(env);

    const keyed = await getKeyedAccess(service, userId);
    if (!keyed) {
      return jsonResponse(
        { error: "Keyed membership required", code: "NOT_KEYED_MEMBER" },
        403,
        origin,
        env,
      );
    }

    const { data: pendingRows } = await service
      .from("space_access")
      .select("user_id", {
        filter: "space=eq.underground&encrypted_room_key=is.null",
        limit: PENDING_BATCH,
      });
    const pending = (pendingRows || []).map((r) => r.user_id).filter(Boolean);

    if (pending.length === 0) {
      let response = jsonResponse({ pending: [] }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // Only pendings with a registered public key can receive a wrap
    const { data: keyRows } = await service
      .from("user_public_keys")
      .select("user_id, public_key", {
        filter: `user_id=in.(${pending.join(",")})`,
      });

    let response = jsonResponse(
      {
        pending: (keyRows || []).map((k) => ({
          userId: k.user_id,
          publicKey: k.public_key,
        })),
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] pending-keys exception:", err.message);
    return jsonResponse({ error: "Failed to list pending members" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/distribute-keys — grava cópias (design §2.3)
// Reforço 1: 403 se o chamador não for membro COM chave.
// Só preenche onde encrypted_room_key IS NULL — nunca sobrescreve
// (sobrescrita seria vetor de DoS); audita key_distributed_by.
// ============================================================
export async function handleUndergroundDistributeKeys(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  try {
    const service = await getServiceSupabase(env);

    const keyed = await getKeyedAccess(service, userId);
    if (!keyed) {
      return jsonResponse(
        { error: "Keyed membership required", code: "NOT_KEYED_MEMBER" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const keys = body.keys;
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > PENDING_BATCH) {
      return jsonResponse({ error: "keys array required (1-50)" }, 400, origin, env);
    }

    let attempted = 0;
    for (const entry of keys) {
      const targetId = entry?.userId;
      const encryptedKey = entry?.encryptedKey;
      if (!targetId || !UUID_REGEX.test(targetId)) continue;
      if (
        !encryptedKey ||
        typeof encryptedKey !== "string" ||
        encryptedKey.length > MAX_WRAPPED_KEY_LENGTH
      ) continue;

      // Fill only where NULL — never overwrite an existing copy
      await service
        .from("space_access")
        .update(
          { encrypted_room_key: encryptedKey, key_distributed_by: userId },
          `user_id=eq.${targetId}&space=eq.underground&encrypted_room_key=is.null`,
        );
      attempted++;
    }

    console.log(`[Underground] ${userId} distributed keys to ${attempted} pending member(s)`);
    let response = jsonResponse({ success: true, distributed: attempted }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] distribute-keys exception:", err.message);
    return jsonResponse({ error: "Failed to distribute keys" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/rekey — recuperação (design §2.6)
// NULLa a PRÓPRIA cópia; o membro volta ao pool de pendentes.
// ============================================================
export async function handleUndergroundRekey(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  // Reforço 2: rate limit padrão do worker
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `underground-rekey:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  try {
    const service = await getServiceSupabase(env);

    const { data: accessRows } = await service
      .from("space_access")
      .select("id", { filter: `user_id=eq.${userId}&space=eq.underground`, limit: 1 });
    const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
    if (!access) {
      return jsonResponse(
        { error: "Underground access required", code: "ACCESS_REQUIRED" },
        403,
        origin,
        env,
      );
    }

    const { error } = await service
      .from("space_access")
      .update(
        { encrypted_room_key: null, key_distributed_by: null },
        `user_id=eq.${userId}&space=eq.underground`,
      );
    if (error) {
      console.error("[Underground] rekey failed:", error.message);
      return jsonResponse({ error: "Failed to reset key" }, 500, origin, env);
    }

    console.log(`[Underground] ${userId} requested rekey (back to pending pool)`);
    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] rekey exception:", err.message);
    return jsonResponse({ error: "Failed to reset key" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/report — plaintext voluntário (design §2.8)
// A cópia legível vem do navegador do denunciante; só é gravada se
// ciphertext_ref/nonce_ref baterem com o post armazenado (409
// REPORT_STALE em divergência — ex.: post editado no meio). O
// reporter_id fica registrado: denúncia falsa é rastreável.
// ============================================================
export async function handleUndergroundReport(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  // Reforço 2: rate limit padrão do worker (texto livre no body)
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `underground-report:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  try {
    const service = await getServiceSupabase(env);

    // Reporters must be members (they decrypted the post to read it)
    const { data: accessRows } = await service
      .from("space_access")
      .select("id", { filter: `user_id=eq.${userId}&space=eq.underground`, limit: 1 });
    const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
    if (!access) {
      return jsonResponse(
        { error: "Underground access required", code: "ACCESS_REQUIRED" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const postId = body.post_id;
    const reason = (body.reason || "").trim();
    const plaintext = body.plaintext;
    const ciphertextRef = body.ciphertext_ref;
    const nonceRef = body.nonce_ref;

    if (!postId || !UUID_REGEX.test(postId)) {
      return jsonResponse({ error: "Invalid post id" }, 400, origin, env);
    }
    // Reforço 2: tetos no body (espelham os CHECKs do banco)
    if (!reason || reason.length > MAX_REASON_LENGTH) {
      return jsonResponse({ error: "Reason required (max 500 chars)" }, 400, origin, env);
    }
    if (
      !plaintext ||
      typeof plaintext !== "string" ||
      plaintext.length > MAX_REPORT_PLAINTEXT
    ) {
      return jsonResponse({ error: "Plaintext required (max 10000 chars)" }, 400, origin, env);
    }
    if (
      !ciphertextRef || typeof ciphertextRef !== "string" ||
      ciphertextRef.length > MAX_ENCRYPTED_LENGTH ||
      !nonceRef || typeof nonceRef !== "string" ||
      nonceRef.length > MAX_NONCE_LENGTH
    ) {
      return jsonResponse({ error: "Ciphertext reference required" }, 400, origin, env);
    }

    // Prova de consistência: a ref precisa bater com o post armazenado
    const { data: postRows } = await service
      .from("underground_posts")
      .select("id, user_id, encrypted_content, nonce", {
        filter: `id=eq.${postId}`,
        limit: 1,
      });
    const post = Array.isArray(postRows) ? postRows[0] : postRows;
    if (!post) {
      return jsonResponse({ error: "Post not found" }, 404, origin, env);
    }
    if (post.encrypted_content !== ciphertextRef || post.nonce !== nonceRef) {
      return jsonResponse(
        { error: "Report reference is stale — refetch and retry", code: "REPORT_STALE" },
        409,
        origin,
        env,
      );
    }

    const { error: insertError } = await service.from("underground_reports").insert({
      post_id: postId,
      reporter_id: userId,
      reported_user_id: post.user_id || null,
      reason,
      plaintext,
      ciphertext_ref: ciphertextRef,
      nonce_ref: nonceRef,
    });
    if (insertError) {
      console.error("[Underground] report insert failed:", insertError.message);
      return jsonResponse({ error: "Failed to submit report" }, 500, origin, env);
    }

    console.log(`[Underground] Report filed on post ${postId} by ${userId}`);
    let response = jsonResponse({ success: true }, 201, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] report exception:", err.message);
    return jsonResponse({ error: "Failed to submit report" }, 500, origin, env);
  }
}
```

---

## 3. `api/index.js` — rotas

Import (bloco `:151-157`):

```diff
 import {
   handleGetUndergroundPosts,
   handleCreateUndergroundPost,
   handleUndergroundReaction,
   handleDeleteUndergroundPost,
   handleEditUndergroundPost,
   handleSetUndergroundNickname,
+  handleUndergroundRoomInit,
+  handleUndergroundPendingKeys,
+  handleUndergroundDistributeKeys,
+  handleUndergroundRekey,
+  handleUndergroundReport,
 } from "./src/handlers/underground.js";
```

Rotas — inseridas **após** a rota `/api/underground/nickname` (`:1302-1306`) e **antes** dos matchers por regex (paths exatos primeiro; nenhum colide com `[0-9a-f-]+`, mas a ordem explícita evita surpresa futura):

```js
      // Underground E2E key flow (item 5)
      if (url.pathname === "/api/underground/room-init" && request.method === "POST") {
        return handleUndergroundRoomInit(request, env, origin);
      }
      if (url.pathname === "/api/underground/pending-keys" && request.method === "GET") {
        return handleUndergroundPendingKeys(request, env, origin);
      }
      if (url.pathname === "/api/underground/distribute-keys" && request.method === "POST") {
        return handleUndergroundDistributeKeys(request, env, origin);
      }
      if (url.pathname === "/api/underground/rekey" && request.method === "POST") {
        return handleUndergroundRekey(request, env, origin);
      }
      if (url.pathname === "/api/underground/report" && request.method === "POST") {
        return handleUndergroundReport(request, env, origin);
      }
```

---

## 4. Mapa requisito → implementação

| Requisito do OK | Onde |
|---|---|
| 1. Unlock exige keypair (409 KEYPAIR_REQUIRED, escopado) | spaces.js §1 — antes da reserva de créditos |
| 2. room-init árbitro / pending-keys / distribute-keys só-NULL+auditoria / rekey / report com prova → 409 REPORT_STALE | underground.js §2.6 |
| 3. Reforço 1 — 403 sem chave | `getKeyedAccess` (§2.3) em pending-keys e distribute-keys |
| 4. Reforço 2 — rate limit + tetos do report | room-init, rekey, report (`checkRateLimit` fail-closed) + `MAX_REASON_LENGTH`/`MAX_REPORT_PLAINTEXT` |
| 5. Create/edit só cifrado (400 E2E_REQUIRED), sem branches plaintext; GET com roomInitialized+roomFingerprint | §2.4, §2.5, §2.2 |

## 5. Após o OK

Aplicar os diffs → `npx wrangler deploy --dry-run` → `git status --short`. Sem commit. Na sequência: DIFF 3 (crypto/serviços front) e DIFF 4 (UI + i18n, com as chaves reais do modal de report).
