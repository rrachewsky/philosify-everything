// ============================================================
// UTILS - CRYPTO HELPERS (Workers runtime)
// ============================================================

// SHA-256 hash of a string, returned as lowercase hex
export async function sha256Hex(text) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(String(text)));
  const bytes = new Uint8Array(digest);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}









