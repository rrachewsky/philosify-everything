// Film search API service — TMDB search via backend proxy

import { getApiUrl } from '../../config';

export async function searchFilms(query, lang = 'en') {
  const response = await fetch(`${getApiUrl()}/api/film-search`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, lang }),
  });

  if (!response.ok) {
    throw new Error(`Film search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.options || [];
}
