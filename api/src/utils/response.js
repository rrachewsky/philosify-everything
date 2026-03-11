// ============================================================
// JSON RESPONSE HELPER
// ============================================================

import { getCorsHeaders } from './cors.js';

export function jsonResponse(data, status = 200, origin = 'https://philosify.org', env = {}) {
  const cors = getCorsHeaders(origin, env);
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
