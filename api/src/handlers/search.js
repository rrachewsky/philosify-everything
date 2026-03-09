// ============================================================
// HANDLER - SEARCH
// ============================================================

import { jsonResponse } from '../utils/index.js';
import { handleSpotifySearch } from '../spotify/search.js';

export async function handleSearch(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return jsonResponse({ error: 'Missing query' }, 400, origin, env);
    }

    // Validate query length to prevent oversized requests to Spotify API
    if (typeof query !== 'string' || query.length > 200) {
      return jsonResponse({ error: 'Search query too long' }, 400, origin, env);
    }

    const result = await handleSpotifySearch(query, env);
    return jsonResponse(result, 200, origin, env);

  } catch (error) {
    console.error('[Search] Error:', error);
    return jsonResponse({ error: "Search failed" }, 500, origin, env);
  }
}
