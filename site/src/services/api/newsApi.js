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
 * Fetch breaking news for ticker
 * @param {string} [lang='en'] - Language code
 * @returns {Promise<{articles: Array, count: number, fetchedAt: string}>}
 */
export async function fetchBreakingNews(lang = 'en') {
  const response = await fetch(`${config.apiUrl}/api/news/breaking?lang=${lang}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch breaking news: ${response.status}`);
  }

  return response.json();
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
