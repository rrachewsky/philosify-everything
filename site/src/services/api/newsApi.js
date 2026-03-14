// API service for News headlines and analysis
import { config } from '@/config';

/**
 * Fetch cached news headlines in the user's language
 * @param {string} [lang='en'] - Language code
 */
export async function fetchNewsHeadlines(lang = 'en') {
  const response = await fetch(`${config.apiUrl}/api/news/headlines?lang=${lang}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch headlines: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
