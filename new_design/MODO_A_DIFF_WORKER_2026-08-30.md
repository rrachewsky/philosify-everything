# MODO A — Diff do worker (para revisão, sem bloquear)

**Data:** 2026-08-30 · Worker implementado, **dry-run verde**, não publicado. Ajustes (se houver) entram antes do deploy.

---

## 1. Novo: `api/src/utils/roomKey.js` (completo)

```js
// ============================================================
// UNDERGROUND MODO A — room key held by the worker.
// ------------------------------------------------------------
// The room key (32 bytes, secretbox) is generated once and stored in
// underground_room.encrypted_room_key, wrapped with the KEK
// (UNDERGROUND_ROOM_KEK secret) via WebCrypto AES-256-GCM — never in
// cleartext at rest. It is delivered RAW (base64 url-safe) to any
// authenticated access-holder on GET /api/underground. Posts stay
// libsodium secretbox (client-side); moderation decrypts server-side
// with tweetnacl, which is wire-compatible with crypto_secretbox_easy.
// ============================================================

import nacl from "tweetnacl";
import { getSecret } from "./secrets.js";
import { getServiceSupabase } from "./supabase.js";

const IV_BYTES = 12;
const ROOM_KEY_BYTES = 32;

function bytesToBinary(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return bin;
}
function b64Std(bytes) { return btoa(bytesToBinary(bytes)); }
// libsodium from_base64 default = URLSAFE_NO_PADDING; match it on delivery.
function b64UrlNoPad(bytes) {
  return b64Std(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64Std(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// Post ciphertext/nonce arrive as libsodium URLSAFE_NO_PADDING base64.
function fromB64Url(str) {
  let s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return fromB64Std(s);
}

async function importKek(env) {
  const raw = await getSecret(env.UNDERGROUND_ROOM_KEK);
  if (!raw) throw new Error("UNDERGROUND_ROOM_KEK not configured");
  const keyBytes = fromB64Std(String(raw).trim());
  if (keyBytes.length !== 32) throw new Error("UNDERGROUND_ROOM_KEK must decode to 32 bytes");
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function kekWrap(env, roomKey) {
  const kek = await importKek(env);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, roomKey));
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return b64Std(combined);
}

async function kekUnwrap(env, wrappedB64) {
  const kek = await importKek(env);
  const combined = fromB64Std(wrappedB64);
  const iv = combined.slice(0, IV_BYTES);
  const ct = combined.slice(IV_BYTES);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, kek, ct);
  return new Uint8Array(pt);
}

// Returns the raw 32-byte room key (Uint8Array). Bootstraps on first call:
// generate → KEK-wrap → fixed-PK INSERT (PostgREST 409 = race arbiter).
export async function getRoomKey(env) {
  const service = await getServiceSupabase(env);
  const { data: rows } = await service
    .from("underground_room")
    .select("encrypted_room_key", { limit: 1 });
  const row = Array.isArray(rows) ? rows[0] : rows;

  if (row && row.encrypted_room_key) return kekUnwrap(env, row.encrypted_room_key);

  const roomKey = crypto.getRandomValues(new Uint8Array(ROOM_KEY_BYTES));
  const wrapped = await kekWrap(env, roomKey);
  const { error } = await service
    .from("underground_room")
    .insert({ id: 1, encrypted_room_key: wrapped });

  if (!error) return roomKey; // we created the room

  if (error.status === 409) {
    const { data: again } = await service
      .from("underground_room")
      .select("encrypted_room_key", { limit: 1 });
    const winner = Array.isArray(again) ? again[0] : again;
    if (winner && winner.encrypted_room_key) return kekUnwrap(env, winner.encrypted_room_key);
    throw new Error("underground_room row exists without a key (unexpected)");
  }
  throw new Error(`room bootstrap insert failed: ${error.message}`);
}

// Room key encoded for delivery to the client (base64 url-safe, no padding).
export async function getRoomKeyForDelivery(env) {
  const key = await getRoomKey(env);
  return b64UrlNoPad(key);
}

// Moderation: decrypt a stored post's ciphertext with the room key (tweetnacl
// secretbox, wire-compatible with libsodium crypto_secretbox_easy).
export async function decryptUndergroundCiphertext(env, ciphertextB64, nonceB64) {
  const roomKey = await getRoomKey(env);
  const ct = fromB64Url(ciphertextB64);
  const nonce = fromB64Url(nonceB64);
  const opened = nacl.secretbox.open(ct, nonce, roomKey);
  if (!opened) throw new Error("secretbox open failed");
  return new TextDecoder().decode(opened);
}
```

---

## 2. `GET /api/underground` — entrega da roomKey (substitui a meta/fingerprint)

```js
// MODO A: deliver the worker-held room key (KEK-wrapped at rest) to any
// authenticated access-holder over TLS. Bootstraps the room on first
// access. Best-effort: a delivery failure must NOT take down the feed —
// degrade to roomKey:null (client surfaces a transient error, retries).
let roomKey = null;
try {
  roomKey = await getRoomKeyForDelivery(env);
} catch (keyErr) {
  console.error("[Underground] room key delivery failed (non-fatal):", keyErr.message, keyErr.stack);
}

let response = jsonResponse(
  { posts: postsWithReactions, myNickname: access.nickname, roomKey },
  200, origin, env,
);
```

(O `access` select do GET largou `encrypted_room_key`; create/edit seguem inalterados — já gravam só ciphertext.)

---

## 3. Report simplificado — `{post_id, reason}`

```js
const body = await request.json();
const postId = body.post_id;
const reason = (body.reason || "").trim();
if (!postId || !UUID_REGEX.test(postId)) return jsonResponse({ error: "Invalid post id" }, 400, origin, env);
if (!reason || reason.length > MAX_REASON_LENGTH) return jsonResponse({ error: "Reason required (max 500 chars)" }, 400, origin, env);

const { data: postRows } = await service
  .from("underground_posts")
  .select("id, user_id", { filter: `id=eq.${postId}`, limit: 1 });
const post = Array.isArray(postRows) ? postRows[0] : postRows;
if (!post) return jsonResponse({ error: "Post not found" }, 404, origin, env);

const { error: insertError } = await service.from("underground_reports").insert({
  post_id: postId, reporter_id: userId, reported_user_id: post.user_id || null, reason,
});
```
(Sai o plaintext voluntário, os refs de ciphertext/nonce e a prova de consistência / 409 REPORT_STALE.)

---

## 4. Novo handler admin decrypt (moderação)

```js
// POST /api/underground/admin/decrypt — admin-only (ADMIN_SECRET via header),
// rate-limited, ANY failure → 404 bland. Audita em underground_moderation_log.
export async function handleUndergroundAdminDecrypt(request, env, origin) {
  const bland = () => jsonResponse({ error: "Not found" }, 404, origin, env);
  try {
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitOk = await checkRateLimit(env, `underground-admin-decrypt:${ip}`, true);
    if (!rateLimitOk) return bland();

    const provided = request.headers.get("x-admin-secret") || "";
    const adminSecret = await getSecret(env.ADMIN_SECRET);
    if (!adminSecret || provided !== adminSecret) return bland();

    const body = await request.json().catch(() => ({}));
    const postId = body.post_id;
    const reportId = body.report_id || null;
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
    const actor = typeof body.actor === "string" && body.actor ? body.actor.slice(0, 200) : "admin";
    if (!postId || !UUID_REGEX.test(postId)) return bland();
    if (reportId && !UUID_REGEX.test(reportId)) return bland();

    const service = await getServiceSupabase(env);
    const { data: postRows } = await service
      .from("underground_posts")
      .select("id, user_id, nickname, encrypted_content, nonce, created_at", { filter: `id=eq.${postId}`, limit: 1 });
    const post = Array.isArray(postRows) ? postRows[0] : postRows;
    if (!post || !post.encrypted_content || !post.nonce) return bland();

    let plaintext;
    try {
      plaintext = await decryptUndergroundCiphertext(env, post.encrypted_content, post.nonce);
    } catch { return bland(); }

    await service.from("underground_moderation_log").insert({ post_id: postId, report_id: reportId, reason, actor });
    console.log(`[Underground] MODERATION decrypt post ${postId} by ${actor} (report ${reportId || "-"})`);

    return jsonResponse(
      { post_id: post.id, user_id: post.user_id, nickname: post.nickname, created_at: post.created_at, plaintext },
      200, origin, env,
    );
  } catch (err) {
    console.error("[Underground] admin decrypt exception:", err.message, err.stack);
    return bland();
  }
}
```

---

## 5. Rota + limpeza

```js
// index.js — removidos imports/rotas de room-init/pending-keys/distribute-keys/rekey.
// Report mantido; nova rota admin (antes dos matchers regex):
if (url.pathname === "/api/underground/report" && request.method === "POST")
  return handleUndergroundReport(request, env, origin);
if (url.pathname === "/api/underground/admin/decrypt" && request.method === "POST")
  return handleUndergroundAdminDecrypt(request, env, origin);
```

- **`spaces.js`:** removido o gate `409 KEYPAIR_REQUIRED` do unlock (escopo underground).
- **`underground.js`:** removidos `getKeyedAccess`, `handleUndergroundRoomInit`, `handleUndergroundPendingKeys`, `handleUndergroundDistributeKeys`, `handleUndergroundRekey`; constantes de chave (`FINGERPRINT_REGEX`, `MAX_WRAPPED_KEY_LENGTH`, `PENDING_BATCH`, `MAX_REPORT_PLAINTEXT`) removidas.
- **`wrangler.toml`:** binding `UNDERGROUND_ROOM_KEK` (Secrets Store). **`package.json`:** `tweetnacl`.
- **Rate limit** do admin: `underground-admin-decrypt:<ip>` (chave própria, por IP).

**Pontos de atenção para revisão:** (a) KEK AES-256-GCM, `iv12‖ct+tag` base64 padrão; (b) tweetnacl como única cifra secretbox no worker; (c) admin auth por header `x-admin-secret` + 404 bland; (d) bootstrap com árbitro de corrida (INSERT id=1 → 409 → re-lê vencedor); (e) entrega em base64 url-safe (casa com o `from_base64` do cliente).
