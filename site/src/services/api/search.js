// Search API service (Spotify search)
import { config } from '@/config';
import { logger } from '@/utils';

/**
 * Search for songs on Spotify
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of song options
 */
export async function searchSongs(query) {
  if (!query || query.length < 2) {
    return [];
  }

  logger.log('[Search] Searching for:', query);

  const response = await fetch(`${config.apiUrl}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    logger.error('[Search] Failed:', response.status);
    throw new Error('SEARCH_FAILED');
  }

  const data = await response.json();

  if (!data.options || !Array.isArray(data.options)) {
    logger.warn('[Search] Invalid response format');
    return [];
  }

  logger.log('[Search] Found', data.options.length, 'results');

  return data.options;
}

export default {
  searchSongs,
};
