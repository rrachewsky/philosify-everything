// API service for News headlines and analysis
import { config } from '@/config';

/**
 * Fetch cached news headlines
 */
export async function fetchNewsHeadlines() {
  const response = await fetch(`${config.apiUrl}/api/news/headlines`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch headlines: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
