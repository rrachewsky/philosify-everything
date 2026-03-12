// Book Search API service (Google Books search)
import { config } from '@/config';
import { logger } from '@/utils';

/**
 * Search for books via Google Books API
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of book options
 */
export async function searchBooks(query) {
  if (!query || query.length < 2) {
    return [];
  }

  logger.log('[BookSearch] Searching for:', query);

  const response = await fetch(`${config.apiUrl}/api/book-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    logger.error('[BookSearch] Failed:', response.status);
    throw new Error('SEARCH_FAILED');
  }

  const data = await response.json();

  if (!data.options || !Array.isArray(data.options)) {
    logger.warn('[BookSearch] Invalid response format');
    return [];
  }

  logger.log('[BookSearch] Found', data.options.length, 'results');

  return data.options;
}

export default {
  searchBooks,
};
