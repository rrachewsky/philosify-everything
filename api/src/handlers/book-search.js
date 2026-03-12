// ============================================================
// HANDLER - BOOK SEARCH
// ============================================================

import { handleGoogleBooksSearch } from '../books/index.js';
import { jsonResponse } from '../utils/index.js';

export async function handleBookSearch(request, env) {
  const origin = request.headers.get('Origin') || '';

  const body = await request.json();
  const { query } = body;

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return jsonResponse(
      { error: 'Query must be at least 2 characters' },
      400,
      origin,
      env,
    );
  }

  if (query.length > 200) {
    return jsonResponse(
      { error: 'Query too long (max 200 characters)' },
      400,
      origin,
      env,
    );
  }

  const result = await handleGoogleBooksSearch(query.trim(), env);
  return jsonResponse(result, 200, origin, env);
}
