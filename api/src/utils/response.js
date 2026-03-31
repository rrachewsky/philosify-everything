// ============================================================
// JSON RESPONSE HELPER
// ============================================================

import { getCorsHeaders } from './cors.js';

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
      // HSTS (served over HTTPS only)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      ...cors
    }
  });
}
