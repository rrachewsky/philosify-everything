// API service for News search, breaking news, and preferences
import { config } from '@/config';

/**
 * Search news articles by topic/query
 * @param {string} query - Search query
 * @param {string} [lang='en'] - Language code
 * @returns {Promise<{articles: Array, count: number, query: string, lang: string, filtered: boolean}>}
 */
export async function searchNews(query, lang = 'en') {
  const params = new URLSearchParams({ q: query, lang });
  const response = await fetch(`${config.apiUrl}/api/news/search?${params}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Search failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch breaking news for ticker (with frontend caching)
 * @param {string} [lang='en'] - Language code
 * @returns {Promise<{articles: Array, count: number, fetchedAt: string, fromCache?: boolean}>}
 */
export async function fetchBreakingNews(lang = 'en') {
  const CACHE_KEY = `philosify:breaking-news:${lang}`;
  const CACHE_MAX_AGE = 15 * 60 * 1000; // 15 minutes (matches backend stale threshold)

  // Check cache first
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      const age = Date.now() - new Date(data.cachedAt).getTime();
      
      // Cache hit and fresh → return immediately
      if (age < CACHE_MAX_AGE) {
        console.log(`[News] Using cached breaking news (age: ${Math.floor(age / 1000)}s)`);
        return { ...data, fromCache: true };
      }
      
      console.log(`[News] Cache stale (age: ${Math.floor(age / 1000)}s), fetching fresh...`);
    }
  } catch (err) {
    console.warn('[News] Cache read failed:', err.message);
  }

  // Fetch from API
  const response = await fetch(`${config.apiUrl}/api/news/breaking?lang=${lang}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch breaking news: ${response.status}`);
  }

  const data = await response.json();

  // Cache the result
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      ...data,
      cachedAt: new Date().toISOString(),
    }));
    console.log(`[News] Cached ${data.articles?.length || 0} breaking news articles`);
  } catch (err) {
    console.warn('[News] Cache write failed:', err.message);
  }

  return data;
}

/**
 * Translate a single article title + description on demand
 * @param {string} text - Text to translate
 * @param {string} lang - Target language
 * @returns {Promise<{title: string, summary: string}>}
 */
export async function translateArticle(title, description, lang) {
  const response = await fetch(`${config.apiUrl}/api/news/translate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, lang }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get user's news source preferences
 * @returns {Promise<{unlocked: boolean, enabledSources: string[]|null, defaultSources: string[], availableSources: object}>}
 */
export async function getNewsPreferences() {
  const response = await fetch(`${config.apiUrl}/api/user/news-preferences`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch preferences: ${response.status}`);
  }

  return response.json();
}

/**
 * Unlock custom source selection (costs 1 credit)
 */
export async function unlockNewsSources() {
  const response = await fetch(`${config.apiUrl}/api/user/news-preferences/unlock`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json();
    const error = new Error(data.error || 'Failed to unlock');
    error.code = data.code;
    throw error;
  }

  return response.json();
}

/**
 * Update enabled news sources
 * @param {string[]} sources - Array of source IDs
 */
export async function updateNewsSources(sources) {
  const response = await fetch(`${config.apiUrl}/api/user/news-preferences`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources }),
  });

  if (!response.ok) {
    const data = await response.json();
    const error = new Error(data.error || 'Failed to update sources');
    error.code = data.code;
    throw error;
  }

  return response.json();
}
