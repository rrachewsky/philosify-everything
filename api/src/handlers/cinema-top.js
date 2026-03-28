// ============================================================
// HANDLER - TOP CINEMA FEED
// ============================================================
// Fetches trending movies, trending TV, and top rated movies
// from TMDb. Normalizes, deduplicates, scores, and caches
// in KV. Returns top 50 philosophically relevant films.

import { getSecret } from "../utils/secrets.js";
import { getCorsHeaders } from "../utils/cors.js";
import { safeEq } from "../payments/crypto.js";

// ============================================================
// CONSTANTS
// ============================================================

const KV_KEY = "cinema:v1:top";
const KV_TTL_SECONDS = 3 * 60 * 60; // 3 hours

const TMDB_BASE = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

const FILM_BLOCKED_GENRES = [
  "Reality",
  "Game Show",
  "Talk",
  "Soap",
  "Kids",
  "News",
];

// TMDb genre ID -> name mappings (combined movie + TV)
const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  // TV-specific
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

// ============================================================
// DATA SOURCES
// ============================================================

async function fetchTMDb(endpoint, apiKey) {
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${TMDB_BASE}${endpoint}${separator}api_key=${apiKey}`;

  try {
    console.log(`[Cinema] Fetching: ${endpoint}`);
    const response = await fetch(url);
    console.log(`[Cinema] Response for ${endpoint}: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Cinema] TMDb error for ${endpoint}: ${response.status} - ${errorText.substring(0, 200)}`);
      return [];
    }
    const data = await response.json();
    console.log(`[Cinema] Got ${data.results?.length || 0} results for ${endpoint}`);
    return data.results || [];
  } catch (error) {
    console.error(`[Cinema] TMDb fetch failed for ${endpoint}: ${error.message}`);
    return [];
  }
}

function normalizeMovie(item, source) {
  const isTV = source === "trending_tv" || !!item.first_air_date;
  const title = item.title || item.name || "";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const genreIds = item.genre_ids || [];
  const genres = genreIds.map((id) => GENRE_MAP[id] || "Unknown").filter(Boolean);

  return {
    id: String(item.id),
    title,
    type: isTV ? "tv" : "movie",
    poster: item.poster_path ? `${POSTER_BASE}${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `${BACKDROP_BASE}${item.backdrop_path}` : null,
    year,
    overview: (item.overview || "").slice(0, 200),
    rating: item.vote_average || 0,
    voteCount: item.vote_count || 0,
    popularity: item.popularity || 0,
    genres,
    source,
    star: "", // lead actor — populated after credits fetch
  };
}

// Fetch lead actor (top-billed cast) for a batch of films
async function enrichWithStars(films, apiKey) {
  console.log(`[Cinema] Fetching lead actors for ${films.length} films...`);

  const results = await Promise.all(
    films.map(async (film) => {
      try {
        const type = film.type === "tv" ? "tv" : "movie";
        const endpoint = `/${type}/${film.id}/credits`;
        const separator = "?";
        const url = `${TMDB_BASE}${endpoint}${separator}api_key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return film;

        const data = await response.json();
        const cast = data.cast || [];
        const lead = cast[0];
        return { ...film, star: lead ? lead.name : "" };
      } catch {
        return film;
      }
    }),
  );

  const enriched = results.filter((f) => f.star).length;
  console.log(`[Cinema] Enriched ${enriched}/${films.length} with lead actors`);
  return results;
}

// ============================================================
// DEDUPLICATION & SCORING
// ============================================================

function deduplicateFilms(films) {
  const seen = new Map();
  const result = [];

  for (const film of films) {
    if (seen.has(film.id)) {
      // Keep the one with higher source priority
      const existing = seen.get(film.id);
      if (filmSourceWeight(film.source) > filmSourceWeight(existing.source)) {
        seen.set(film.id, film);
        const idx = result.indexOf(existing);
        if (idx !== -1) result[idx] = film;
      }
      continue;
    }
    seen.set(film.id, film);
    result.push(film);
  }

  return result;
}

function filmSourceWeight(source) {
  if (source === "trending_movie") return 3;
  if (source === "trending_tv") return 2;
  if (source === "top_rated") return 1;
  return 0;
}

function scoreFilm(film) {
  let score = 0;
  score += film.popularity * 0.1;
  score += film.rating * 5;
  if (film.source === "trending_movie") score += 20;
  if (film.source === "trending_tv") score += 15;
  if (film.source === "top_rated") score += 10;
  if (film.voteCount > 1000) score += 5;
  if (film.voteCount > 5000) score += 5;
  return score;
}

function isPhilosophicallyRelevant(film) {
  return !film.genres.some((g) => FILM_BLOCKED_GENRES.includes(g));
}

// ============================================================
// CORE FETCH + PROCESS
// ============================================================

export async function fetchTopFilms(env) {
  const debug = { step: "start" };
  
  try {
    debug.step = "getSecret";
    const apiKey = await getSecret(env.TMDB_API_KEY);
    debug.keyLength = apiKey?.length || 0;
    
    if (!apiKey) {
      return { films: [], count: 0, fetchedAt: new Date().toISOString(), sources: [], _debug: "NO_API_KEY" };
    }

    debug.step = "fetchTMDb";
    // Fetch all three sources in parallel
    const results = await Promise.allSettled([
      fetchTMDb("/trending/movie/week", apiKey),
      fetchTMDb("/trending/tv/week", apiKey),
      fetchTMDb("/movie/top_rated?page=1", apiKey),
    ]);

    const trendingMovies = results[0].status === "fulfilled" ? results[0].value : [];
    const trendingTV = results[1].status === "fulfilled" ? results[1].value : [];
    const topRated = results[2].status === "fulfilled" ? results[2].value : [];
    
    debug.counts = {
      movies: trendingMovies.length,
      tv: trendingTV.length,
      topRated: topRated.length,
    };
    
    debug.errors = results
      .map((r, i) => r.status === "rejected" ? `${["movies","tv","topRated"][i]}: ${r.reason}` : null)
      .filter(Boolean);

    debug.step = "normalize";
    // Normalize
    const allFilms = [
      ...trendingMovies.map((m) => normalizeMovie(m, "trending_movie")),
      ...trendingTV.map((m) => normalizeMovie(m, "trending_tv")),
      ...topRated.map((m) => normalizeMovie(m, "top_rated")),
    ];

    if (allFilms.length === 0) {
      return { 
        films: [], 
        count: 0, 
        fetchedAt: new Date().toISOString(), 
        sources: [],
        _debug: debug,
      };
    }

    debug.step = "deduplicate";
    // Deduplicate
    const unique = deduplicateFilms(allFilms);

    // Filter philosophical relevance
    const relevant = unique.filter(isPhilosophicallyRelevant);

    // Score and sort
    const scored = relevant
      .map((film) => ({ ...film, _score: scoreFilm(film) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 50);

    // Remove internal score
    const ranked = scored.map((film) => {
      const { _score, ...rest } = film;
      return rest;
    });

    debug.step = "enrichWithStars";
    // Fetch lead actors for the final top 50
    const withStars = await enrichWithStars(ranked, apiKey);

    const sources = [...new Set(withStars.map((f) => f.source))];
    const payload = {
      films: withStars,
      count: withStars.length,
      fetchedAt: new Date().toISOString(),
      sources,
    };

    // Write to KV
    if (env.PHILOSIFY_KV) {
      await env.PHILOSIFY_KV.put(KV_KEY, JSON.stringify(payload), {
        expirationTtl: KV_TTL_SECONDS,
      });
    }

    return payload;
  } catch (error) {
    return { 
      films: [], 
      count: 0, 
      fetchedAt: new Date().toISOString(), 
      sources: [],
      _debug: { ...debug, error: error.message },
    };
  }
}

// ============================================================
// HANDLER — GET /api/cinema/diagnose (admin only)
// ============================================================

export async function handleCinemaDiagnose(request, env, origin) {
  const corsHeaders = getCorsHeaders(origin, env);
  
  // Require admin secret
  const adminSecret = request.headers.get("X-Admin-Secret");
  const expectedSecret = await getSecret(env.ADMIN_SECRET);
  if (!adminSecret || !safeEq(adminSecret, expectedSecret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const results = {
    timestamp: new Date().toISOString(),
    tmdbKeyExists: false,
    tmdbKeyLength: 0,
    trendingMovies: { status: null, count: 0, error: null },
    trendingTV: { status: null, count: 0, error: null },
    topRated: { status: null, count: 0, error: null },
  };

  try {
    const apiKey = await getSecret(env.TMDB_API_KEY);
    results.tmdbKeyExists = !!apiKey;
    results.tmdbKeyLength = apiKey?.length || 0;

    if (!apiKey) {
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Test each endpoint
    const endpoints = [
      { name: "trendingMovies", path: "/trending/movie/week" },
      { name: "trendingTV", path: "/trending/tv/week" },
      { name: "topRated", path: "/movie/top_rated?page=1" },
    ];

    for (const ep of endpoints) {
      try {
        const separator = ep.path.includes("?") ? "&" : "?";
        const url = `${TMDB_BASE}${ep.path}${separator}api_key=${apiKey}`;
        const res = await fetch(url);
        results[ep.name].status = res.status;
        if (res.ok) {
          const data = await res.json();
          results[ep.name].count = data.results?.length || 0;
        } else {
          const errText = await res.text();
          results[ep.name].error = errText.substring(0, 200);
        }
      } catch (err) {
        results[ep.name].error = err.message;
      }
    }
  } catch (err) {
    results.error = err.message;
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// ============================================================
// HANDLER — GET /api/cinema/top
// ============================================================

export async function handleCinemaTop(request, env, origin, ctx) {
  const corsHeaders = getCorsHeaders(origin, env);

  try {
    // Try KV cache first
    if (env.PHILOSIFY_KV) {
      const cached = await env.PHILOSIFY_KV.get(KV_KEY);
      if (cached) {
        return new Response(cached, {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=1800",
            ...corsHeaders,
          },
        });
      }
    }

    // No cache — fetch fresh
    const payload = await fetchTopFilms(env);

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800",
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        films: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
        sources: [],
        _error: error.message,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  }
}
