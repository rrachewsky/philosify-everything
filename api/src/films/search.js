// TMDB film search — search movies by title
// Uses TMDB API v3 (requires TMDB_API_KEY)

import { getSecret } from "../utils/secrets.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

/**
 * Search TMDB for movies matching the query.
 * Returns normalized results with poster URLs.
 */
export async function searchFilms(query, env, lang = "en") {
  console.log(`[Films] TMDB_API_KEY type: ${typeof env.TMDB_API_KEY}, exists: ${!!env.TMDB_API_KEY}`);
  const apiKey = await getSecret(env.TMDB_API_KEY);
  console.log(`[Films] Key resolved: ${apiKey ? apiKey.substring(0, 8) + '...' : 'EMPTY'}`);
  if (!apiKey) throw new Error("TMDB_API_KEY not configured");

  // TMDB v3 supports both api_key param and Bearer token auth
  // Try Bearer token first (works with API Read Access Token)
  const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=${lang}&include_adult=false&page=1`;

  const res = await fetch(apiKey.length > 40
    ? `${url}` // Bearer token (long key)
    : `${url}&api_key=${apiKey}`, // API key (short key)
  {
    headers: apiKey.length > 40
      ? { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
      : { accept: 'application/json' },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[Films] TMDB search failed: ${res.status} ${errText.slice(0, 200)}`);
    return [];
  }

  const data = await res.json();
  const results = (data.results || []).slice(0, 15);

  return results.map((m) => ({
    tmdb_id: m.id,
    title: m.title,
    original_title: m.original_title,
    year: m.release_date ? m.release_date.split("-")[0] : null,
    overview: m.overview || "",
    poster_url: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
    genre_ids: m.genre_ids || [],
    popularity: m.popularity,
    vote_average: m.vote_average,
  }));
}

/**
 * Get full movie details from TMDB (credits, genres, runtime, etc.)
 */
export async function getFilmDetails(tmdbId, env, lang = "en") {
  const apiKey = await getSecret(env.TMDB_API_KEY);
  if (!apiKey) throw new Error("TMDB_API_KEY not configured");

  const url = `${TMDB_BASE}/movie/${tmdbId}?language=${lang}&append_to_response=credits`;

  const res = await fetch(apiKey.length > 40
    ? `${url}`
    : `${url}&api_key=${apiKey}`,
  {
    headers: apiKey.length > 40
      ? { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
      : { accept: 'application/json' },
  });
  if (!res.ok) {
    console.error(`[Films] TMDB details failed for ${tmdbId}: ${res.status}`);
    return null;
  }

  const m = await res.json();

  // Extract director from credits
  const director = m.credits?.crew?.find((c) => c.job === "Director")?.name || null;

  // Extract top cast (first 5)
  const cast = (m.credits?.cast || []).slice(0, 5).map((c) => c.name);

  return {
    tmdb_id: m.id,
    title: m.title,
    original_title: m.original_title,
    director,
    cast,
    year: m.release_date ? m.release_date.split("-")[0] : null,
    overview: m.overview || "",
    poster_url: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
    genres: (m.genres || []).map((g) => g.name),
    runtime: m.runtime,
    production_countries: (m.production_countries || []).map((c) => c.name),
    tagline: m.tagline || "",
    vote_average: m.vote_average,
  };
}
