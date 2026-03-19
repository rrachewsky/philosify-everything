// API service for News headlines and analysis
import { config } from '@/config';

/**
 * Fetch cached news headlines in the user's language
 * @param {string} [lang='en'] - Language code
 */
export async function fetchNewsHeadlines(lang = 'en') {
  const response = await fetch(`${config.apiUrl}/api/news/headlines?lang=${lang}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch headlines: ${response.status}`);
  }

  const data = await response.json();
  return data;
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
 * @returns {Promise<{success: boolean, unlocked: boolean, credits?: number, remaining?: number}>}
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
 * @returns {Promise<{success: boolean, enabledSources: string[]}>}
 */
export async function updateNewsSources(sources) {
  const response = await fetch(`${config.apiUrl}/api/user/news-preferences`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
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
