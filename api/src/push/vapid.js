// ============================================================
// VAPID JWT SIGNING - Web Crypto API (Cloudflare Workers native)
// ============================================================
// Generates VAPID Authorization headers for Web Push.
// No npm packages needed - uses crypto.subtle directly.
//
// VAPID spec: RFC 8292
// JWT signed with ES256 (P-256 / ECDSA with SHA-256)

import { getSecret } from "../utils/secrets.js";

// Cache the imported CryptoKey to avoid re-importing on every request.
// Safe for module-level caching in CF Workers (isolate lifetime = request batch).
let cachedSigningKey = null;
let cachedKeyFingerprint = null;

/**
 * Base64url encode a buffer
 * @param {ArrayBuffer|Uint8Array} buffer
 * @returns {string}
 */
function base64urlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Base64url decode to Uint8Array
 * @param {string} str
 * @returns {Uint8Array}
 */
function base64urlDecode(str) {
  // Add padding back
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Build the full JWK and import as CryptoKey, with caching.
 * The key is cached for the lifetime of the Worker isolate to avoid
 * redundant crypto.subtle.importKey calls during mass notifications
 * (e.g., daily colloquium broadcast to hundreds of users).
 *
 * @param {string} privateKeyB64url - 32-byte private key, base64url
 * @param {string} publicKeyB64url - 65-byte uncompressed public key, base64url
 * @returns {Promise<CryptoKey>}
 */
async function getSigningKey(privateKeyB64url, publicKeyB64url) {
  // Cache hit: same key pair as last time
  const fingerprint = `${privateKeyB64url}:${publicKeyB64url}`;
  if (cachedSigningKey && cachedKeyFingerprint === fingerprint) {
    return cachedSigningKey;
  }

  // Decode the uncompressed public key (65 bytes: 0x04 + 32-byte x + 32-byte y)
  const pubBytes = base64urlDecode(publicKeyB64url);

  if (pubBytes.length !== 65 || pubBytes[0] !== 0x04) {
    throw new Error(
      "Invalid VAPID public key: expected 65-byte uncompressed point",
    );
  }

  const x = base64urlEncode(pubBytes.slice(1, 33));
  const y = base64urlEncode(pubBytes.slice(33, 65));
  const d = privateKeyB64url;

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
    ext: true,
  };

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  // Cache for subsequent calls
  cachedSigningKey = key;
  cachedKeyFingerprint = fingerprint;

  return key;
}

/**
 * Create VAPID JWT token
 * @param {string} audience - Push service origin (e.g. "https://fcm.googleapis.com")
 * @param {string} subject - Contact URI (e.g. "mailto:bob@philosify.org")
 * @param {CryptoKey} signingKey - ECDSA P-256 private key
 * @param {number} expiration - Token expiration in seconds from now (max 24h)
 * @returns {Promise<string>} JWT token
 */
async function createVapidJwt(
  audience,
  subject,
  signingKey,
  expiration = 12 * 60 * 60,
) {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    aud: audience,
    exp: now + expiration,
    sub: subject,
  };

  const encodedHeader = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(header)),
  );
  const encodedPayload = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signatureBytes = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    new TextEncoder().encode(unsignedToken),
  );

  // ECDSA signature from Web Crypto is in IEEE P1363 format (r||s, 64 bytes)
  // JWT ES256 also uses this format, so no conversion needed
  const encodedSignature = base64urlEncode(signatureBytes);

  return `${unsignedToken}.${encodedSignature}`;
}

/**
 * Generate VAPID Authorization headers for a push request
 * @param {Object} env - Cloudflare Worker env
 * @param {string} endpoint - Push subscription endpoint URL
 * @returns {Promise<Object>} { authorization } headers
 */
export async function getVapidHeaders(env, endpoint) {
  const privateKeyB64url = await getSecret(env.VAPID_PRIVATE_KEY);
  const publicKeyB64url = env.VAPID_PUBLIC_KEY;

  if (!privateKeyB64url || !publicKeyB64url) {
    throw new Error("VAPID keys not configured");
  }

  // Audience is the origin of the push service endpoint
  const endpointUrl = new URL(endpoint);
  const audience = endpointUrl.origin;

  const signingKey = await getSigningKey(privateKeyB64url, publicKeyB64url);
  const jwt = await createVapidJwt(
    audience,
    "mailto:bob@philosify.org",
    signingKey,
  );

  return {
    authorization: `vapid t=${jwt}, k=${publicKeyB64url}`,
  };
}

// Export helpers for use in sender.js
export { base64urlDecode, base64urlEncode };
