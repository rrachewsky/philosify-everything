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
function b64Std(bytes) {
  return btoa(bytesToBinary(bytes));
}
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
  if (keyBytes.length !== 32) {
    throw new Error("UNDERGROUND_ROOM_KEK must decode to 32 bytes");
  }
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function kekWrap(env, roomKey) {
  const kek = await importKek(env);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, kek, roomKey),
  );
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

// Returns the raw 32-byte room key (Uint8Array). Bootstraps on first call.
// WRITE-CONFIRMED: the custom service client can swallow HTTP errors, so we
// NEVER trust the insert/update return — we re-read underground_room and
// trust ONLY the persisted value. Without this, a silently-failed write
// would hand the client an unpersisted key and make its posts permanently
// unreadable.
export async function getRoomKey(env) {
  const service = await getServiceSupabase(env);

  const readRoom = async () => {
    const { data } = await service
      .from("underground_room")
      .select("encrypted_room_key", { limit: 1 });
    const row = Array.isArray(data) ? data[0] : data;
    return row || null;
  };

  // Fast path: the room already holds a key.
  const existing = await readRoom();
  if (existing && existing.encrypted_room_key) {
    return kekUnwrap(env, existing.encrypted_room_key);
  }

  const roomKey = crypto.getRandomValues(new Uint8Array(ROOM_KEY_BYTES));
  const wrapped = await kekWrap(env, roomKey);

  if (!existing) {
    // No row yet — fixed-PK INSERT is the race arbiter (409 = someone won).
    await service
      .from("underground_room")
      .insert({ id: 1, encrypted_room_key: wrapped });
  } else {
    // Row exists with a NULL key — claim it atomically, only where still NULL.
    await service
      .from("underground_room")
      .update(
        { encrypted_room_key: wrapped },
        "id=eq.1&encrypted_room_key=is.null",
      );
  }

  // Confirm what actually persisted and trust ONLY that. A key is immutable
  // once set (INSERT conflicts; UPDATE is guarded by IS NULL), so the re-read
  // is authoritative. Return our local key iff OUR write landed; otherwise
  // unwrap whatever won.
  const confirmed = await readRoom();
  if (!confirmed || !confirmed.encrypted_room_key) {
    throw new Error("room bootstrap did not persist a key");
  }
  if (confirmed.encrypted_room_key === wrapped) {
    return roomKey;
  }
  return kekUnwrap(env, confirmed.encrypted_room_key);
}

// Room key encoded for delivery to the client (base64 url-safe, no padding
// — matches the client's libsodium from_base64 default).
export async function getRoomKeyForDelivery(env) {
  const key = await getRoomKey(env);
  return b64UrlNoPad(key);
}

// Moderation: decrypt a stored post's ciphertext with the room key
// (tweetnacl secretbox, wire-compatible with libsodium crypto_secretbox_easy).
// Throws on any failure (caller degrades to a bland 404).
export async function decryptUndergroundCiphertext(env, ciphertextB64, nonceB64) {
  const roomKey = await getRoomKey(env);
  const ct = fromB64Url(ciphertextB64);
  const nonce = fromB64Url(nonceB64);
  const opened = nacl.secretbox.open(ct, nonce, roomKey);
  if (!opened) throw new Error("secretbox open failed");
  return new TextDecoder().decode(opened);
}
