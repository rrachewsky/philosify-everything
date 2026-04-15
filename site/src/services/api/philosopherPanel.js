// API service for Philosopher Panel feature
import { config } from '@/config';
import { authService } from '@/services/auth';

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
  let response = await fetch(`${config.apiUrl}/api/philosopher-panel`, {
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

  // Handle 401 - token expired, trigger refresh and retry once
  if (response.status === 401) {
    console.log('[PhilosopherPanel] Token expired, refreshing session...');
    try {
      await authService.getSession(); // Triggers backend auto-refresh
      console.log('[PhilosopherPanel] Session refreshed, retrying request...');
      await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay
      
      // Retry the request
      response = await fetch(`${config.apiUrl}/api/philosopher-panel`, {
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

      if (response.status === 401) {
        throw new Error('Session expired — please sign out and sign back in.');
      }
    } catch (refreshError) {
      console.error('[PhilosopherPanel] Session refresh failed:', refreshError);
      throw new Error('Session expired — please sign out and sign back in.');
    }
  }

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
