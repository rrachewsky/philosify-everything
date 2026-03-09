// ============================================================
// PAYMENTS - CRYPTOGRAPHIC UTILITIES
// ============================================================

// HMAC SHA-256 signature generation
export async function hmacSHA256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Timing-safe string comparison (constant-time regardless of length mismatch)
export function safeEq(a, b) {
  // Pad shorter string to prevent length leakage via timing
  const maxLen = Math.max(a.length, b.length);
  const paddedA = a.padEnd(maxLen, "\0");
  const paddedB = b.padEnd(maxLen, "\0");
  let r = a.length ^ b.length; // Incorporate length difference into result
  for (let i = 0; i < maxLen; i++)
    r |= paddedA.charCodeAt(i) ^ paddedB.charCodeAt(i);
  return r === 0;
}
