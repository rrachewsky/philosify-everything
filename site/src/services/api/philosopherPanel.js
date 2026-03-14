// API service for Philosopher Panel feature
import { config } from '@/config';

/**
 * Fetch the full philosopher roster (name, era, school, price)
 */
export async function fetchPhilosopherRoster() {
  const response = await fetch(`${config.apiUrl}/api/colloquium/roster`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch roster: ${response.status}`);
  }
  const data = await response.json();
  return data.roster || [];
}

/**
 * Request a philosopher panel analysis
 *
 * @param {Object} params
 * @param {'music'|'literature'} params.mediaType
 * @param {string} params.title
 * @param {string} params.artist - artist (music) or author (books)
 * @param {string} [params.lyrics]
 * @param {string} [params.description]
 * @param {string} [params.categories]
 * @param {string[]} params.philosophers - 2 user-chosen philosopher names
 * @param {string} [params.lang]
 * @returns {Promise<Object>} { success, panel: { analysis, philosophers, ... }, credits, remaining }
 */
export async function requestPhilosopherPanel({
  mediaType,
  title,
  artist,
  lyrics,
  description,
  categories,
  philosophers,
  lang = 'en',
}) {
  const response = await fetch(`${config.apiUrl}/api/philosopher-panel`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mediaType,
      title,
      artist,
      lyrics,
      description,
      categories,
      philosophers,
      lang,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 402) {
      throw Object.assign(new Error(data.error || 'Insufficient credits'), {
        code: 'INSUFFICIENT_CREDITS',
        needed: data.needed,
      });
    }
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}
