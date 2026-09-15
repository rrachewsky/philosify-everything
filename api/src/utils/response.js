// ============================================================
// JSON RESPONSE HELPER
// ============================================================

import { getCorsHeaders } from './cors.js';

export function errorResponse(message, status = 400, originOrCors = 'https://philosify.org', env = {}) {
  return jsonResponse({ error: message }, status, originOrCors, env);
}

export function jsonResponse(data, status = 200, originOrCors = 'https://philosify.org', env = {}) {
  const cors =
    originOrCors &&
    typeof originOrCors === 'object' &&
    'Access-Control-Allow-Origin' in originOrCors
      ? originOrCors
      : getCorsHeaders(originOrCors, env);

  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      // Private API JSON: never cached by browser/intermediaries. Also keeps
      // Chrome from creating per-URL cache entries whose lock queues identical
      // GETs behind a stalled writer (Underground "loading forever", 14 Sep).
      'Cache-Control': 'no-store',
      // HSTS is included via getCorsHeaders() spread below — no duplicate needed
      ...cors
    }
  });
}
