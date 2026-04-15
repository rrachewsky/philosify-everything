// TMDB film search — search movies by title
// Uses TMDB API v3 (requires TMDB_API_KEY)

import { getSecret } from "../utils/secrets.js";

/**
 * Map ISO 639-1 codes to full language names for Gemini
 */
const LANG_NAMES = {
  pt: 'Portuguese', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  nl: 'Dutch', ru: 'Russian', zh: 'Chinese', ar: 'Arabic', he: 'Hebrew',
  ja: 'Japanese', ko: 'Korean', tr: 'Turkish', pl: 'Polish', hu: 'Hungarian',
  hi: 'Hindi', fa: 'Persian'
};

/**
 * Translate text using Gemini (for TMDB content that isn't available in target language)
 */
async function translateText(text, targetLang, env) {
  if (!text || targetLang === 'en') return text;
  
  const langName = LANG_NAMES[targetLang];
  if (!langName) return text; // Unknown language, return original
  
  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) return text; // Fallback to English if no translation API
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const prompt = `Translate the following film synopsis to ${langName}. Return ONLY the translation, no explanations or additional text:\n\n${text}`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    });
    
    if (!res.ok) {
      console.warn(`[Films] Translation API error: ${res.status}`);
      return text; // Fallback to original
    }
    
    const data = await res.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || text;
    console.log(`[Films] Translated to ${langName}: ${text.substring(0, 50)}... → ${translated.substring(0, 50)}...`);
    return translated.trim();
  } catch (err) {
    console.warn(`[Films] Translation failed: ${err.message}`);
    return text; // Fallback to original
  }
}

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w200";

function tmdbFetch(url, apiKey) {
  return fetch(
    apiKey.length > 40 ? url : `${url}${url.includes('?') ? '&' : '?'}api_key=${apiKey}`,
    {
      headers: apiKey.length > 40
        ? { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
        : { accept: 'application/json' },
    },
  );
}

/**
 * Search TMDB for movies matching the query.
 * Returns normalized results with poster URLs.
 */
export async function searchFilms(query, env, lang = "en") {
  const apiKey = await getSecret(env.TMDB_API_KEY);
  if (!apiKey) throw new Error("TMDB_API_KEY not configured");

  const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=${lang}&include_adult=false&page=1`;
  const res = await tmdbFetch(url, apiKey);
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[Films] TMDB search failed: ${res.status} ${errText.slice(0, 200)}`);
    return [];
  }

  const data = await res.json();
  const results = (data.results || []).slice(0, 15);

  // Fetch credits (director + cast) for each result in parallel
  const enriched = await Promise.all(
    results.map(async (m) => {
      let director = null;
      let cast = [];
      let countries = [];
      let genres = [];
      let overview = m.overview || "";
      
      try {
        const detailRes = await tmdbFetch(
          `${TMDB_BASE}/movie/${m.id}?language=${lang}&append_to_response=credits`, apiKey
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          director = detail.credits?.crew?.find((c) => c.job === "Director")?.name || null;
          cast = (detail.credits?.cast || []).slice(0, 2).map((c) => c.name);
          countries = (detail.production_countries || []).map((c) => c.iso_3166_1);
          genres = (detail.genres || []).map((g) => g.name);
          
          // Use detail overview if available (more complete than search result)
          if (detail.overview) overview = detail.overview;
        }
      } catch { /* non-fatal */ }
      
      // If non-English language requested and we have an overview, translate it
      // (TMDB doesn't always have translations, so we use AI as fallback)
      if (lang !== 'en' && overview && overview.length > 20) {
        overview = await translateText(overview, lang, env);
      }

      return {
        tmdb_id: m.id,
        title: m.title,
        original_title: m.original_title,
        year: m.release_date ? m.release_date.split("-")[0] : null,
        overview,
        poster_url: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
        genres,
        director,
        cast,
        countries,
        popularity: m.popularity,
        vote_average: m.vote_average,
      };
    })
  );

  return enriched;
}

/**
 * Get full movie details from TMDB (credits, genres, runtime, etc.)
 */
export async function getFilmDetails(tmdbId, env, lang = "en") {
  const apiKey = await getSecret(env.TMDB_API_KEY);
  if (!apiKey) throw new Error("TMDB_API_KEY not configured");

  const url = `${TMDB_BASE}/movie/${tmdbId}?language=${lang}&append_to_response=credits`;
  const res = await tmdbFetch(url, apiKey);
  if (!res.ok) {
    console.error(`[Films] TMDB details failed for ${tmdbId}: ${res.status}`);
    return null;
  }

  const m = await res.json();

  // Extract director from credits
  const director = m.credits?.crew?.find((c) => c.job === "Director")?.name || null;

  // Extract top cast (first 5)
  const cast = (m.credits?.cast || []).slice(0, 5).map((c) => c.name);
  
  // Translate overview if non-English language requested
  let overview = m.overview || "";
  if (lang !== 'en' && overview && overview.length > 20) {
    overview = await translateText(overview, lang, env);
  }
  
  // Translate tagline if non-English language requested
  let tagline = m.tagline || "";
  if (lang !== 'en' && tagline && tagline.length > 3) {
    tagline = await translateText(tagline, lang, env);
  }

  return {
    tmdb_id: m.id,
    title: m.title,
    original_title: m.original_title,
    director,
    cast,
    year: m.release_date ? m.release_date.split("-")[0] : null,
    overview,
    poster_url: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
    genres: (m.genres || []).map((g) => g.name),
    runtime: m.runtime,
    production_countries: (m.production_countries || []).map((c) => c.name),
    tagline,
    vote_average: m.vote_average,
  };
}
