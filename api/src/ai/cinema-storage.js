// ============================================================
// AI - SUPABASE STORAGE (CINEMA)
// ============================================================
// Mirrors book-storage.js but saves to films + film_analyses tables.
// ============================================================

import { getSecret } from "../utils/secrets.js";

// Get or create film in films table
async function getOrCreateFilm(env, title, director, tmdbId, filmMetadata = {}) {
  const url = await getSecret(env.SUPABASE_URL);
  const key = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!url || !key) {
    console.warn("[Cinema] Supabase not configured");
    return null;
  }

  // Check if film exists by tmdb_id first
  if (tmdbId) {
    const searchUrl = `${url}/rest/v1/films?tmdb_id=eq.${encodeURIComponent(tmdbId)}&select=id`;
    const searchRes = await fetch(searchUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    if (searchRes.ok) {
      const films = await searchRes.json();
      if (films && films.length > 0) {
        console.log(`[Cinema] Found existing film by TMDB ID: ${tmdbId}`);
        return films[0].id;
      }
    }
  }

  // Check by title + director
  const titleSearchUrl = `${url}/rest/v1/films?title=ilike.${encodeURIComponent(title)}&director=ilike.${encodeURIComponent(director || "")}&select=id&limit=1`;
  const titleSearchRes = await fetch(titleSearchUrl, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (titleSearchRes.ok) {
    const films = await titleSearchRes.json();
    if (films && films.length > 0) {
      console.log(`[Cinema] Found existing film by title/director: ${title}`);
      return films[0].id;
    }
  }

  // Create new film
  const filmData = {
    title,
    director: director || "",
    tmdb_id: tmdbId || null,
    overview: filmMetadata.overview || null,
    poster_url: filmMetadata.poster_url || null,
    release_year: filmMetadata.year || null,
    genres: filmMetadata.genres || [],
    runtime_minutes: filmMetadata.runtime || null,
    production_countries: filmMetadata.countries || [],
    original_language: filmMetadata.language || null,
    tagline: filmMetadata.tagline || null,
    vote_average: filmMetadata.vote_average || null,
  };

  const createRes = await fetch(`${url}/rest/v1/films`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(filmData),
  });

  if (createRes.ok) {
    const created = await createRes.json();
    const filmId = created[0]?.id;
    console.log(`[Cinema] Created new film: ${title} (ID: ${filmId})`);
    return filmId;
  }

  // Handle duplicate conflict
  if (createRes.status === 409) {
    const retryUrl = `${url}/rest/v1/films?title=ilike.${encodeURIComponent(title)}&director=ilike.${encodeURIComponent(director || "")}&select=id&limit=1`;
    const retryRes = await fetch(retryUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (retryRes.ok) {
      const films = await retryRes.json();
      if (films && films.length > 0) return films[0].id;
    }
  }

  console.error(`[Cinema] Failed to create film: ${createRes.status}`);
  return null;
}

// Save film analysis to Supabase (and log user request for RLS audit trail)
export async function saveFilmToSupabase(
  analysis,
  env,
  title,
  director,
  lang,
  model,
  tmdbId,
  userId = null,
  guideProof = null,
  filmMetadata = {},
) {
  try {
    const url = await getSecret(env.SUPABASE_URL);
    const key = await getSecret(env.SUPABASE_SERVICE_KEY);

    if (!url || !key) {
      console.warn("[Supabase] Not configured, skipping save");
      return null;
    }

    // Step 1: Get or create film in films table
    const filmId = await getOrCreateFilm(env, title, director, tmdbId, filmMetadata);
    if (!filmId) {
      console.error("[Cinema] Failed to get/create film record");
      return null;
    }

    // Step 2: Extract scores from analysis scorecard
    const scorecard = analysis.scorecard || {};

    // Step 3: Map fields to database schema
    const metadata = {
      ...(guideProof
        ? {
            guide_sha256: guideProof.sha256,
            guide_signature: guideProof.signature,
            guide_version: guideProof.version,
            guide_modelo: guideProof.modelo,
          }
        : {}),
      ...(analysis?.schools_of_thought
        ? { schools_of_thought: analysis.schools_of_thought }
        : {}),
      poster_url: filmMetadata.poster_url || null,
      genre: filmMetadata.genre || (filmMetadata.genres || []).join(", "),
      release_year: filmMetadata.year || null,
      runtime: filmMetadata.runtime || null,
      tagline: filmMetadata.tagline || null,
      cast: filmMetadata.cast || null,
    };

    const analysisData = {
      film_id: filmId,
      language: lang || "en",
      model: model,
      version: "3.0",

      // Scores (-10 to +10 from AI response)
      ethics_score: scorecard.ethics?.score || 0,
      metaphysics_score: scorecard.metaphysics?.score || 0,
      epistemology_score: scorecard.epistemology?.score || 0,
      politics_score: scorecard.politics?.score || 0,
      aesthetics_score: scorecard.aesthetics?.score || 0,
      final_score: scorecard.final_score || analysis.final_score || 0,

      // Analysis content
      philosophical_analysis: analysis.philosophical_analysis || "",
      summary: analysis.summary || analysis.philosophical_analysis || "",
      ethics_analysis: scorecard.ethics?.justification || "",
      metaphysics_analysis: scorecard.metaphysics?.justification || "",
      epistemology_analysis: scorecard.epistemology?.justification || "",
      politics_analysis: scorecard.politics?.justification || "",
      aesthetics_analysis: scorecard.aesthetics?.justification || "",

      // Additional fields
      classification: analysis.classification || "",
      philosophical_note: analysis.philosophical_note || "",
      historical_context: analysis.historical_context || null,
      creative_process: analysis.creative_process || null,

      // Metadata JSONB
      metadata,
      status: "active",
    };

    // Step 4: Save to film_analyses table
    const response = await fetch(`${url}/rest/v1/film_analyses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(analysisData),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle duplicate (409 conflict)
      if (response.status === 409) {
        const selectUrl = `${url}/rest/v1/film_analyses?film_id=eq.${filmId}&language=eq.${lang}&model=eq.${encodeURIComponent(model)}&status=eq.active&limit=1&select=id,film_id`;
        const selectResponse = await fetch(selectUrl, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });

        if (selectResponse.ok) {
          const existing = await selectResponse.json();
          if (existing && existing.length > 0) {
            console.log(`[Cinema] Using existing analysis: ${existing[0].id}`);

            // Log user request for existing analysis
            if (userId && existing[0].id) {
              await logFilmAnalysisRequest(url, key, userId, existing[0].id, title, director, { lang, model });
            }

            return {
              id: existing[0].id,
              film_id: existing[0].film_id,
            };
          }
        }
      }

      console.error("[Supabase] Film analysis save failed:", response.status, errorText);
      return null;
    }

    const saved = await response.json();
    const analysisId = saved[0]?.id;
    console.log(`[Supabase] Film analysis saved (ID: ${analysisId}, Film ID: ${filmId}, Lang: ${lang})`);

    // Step 5: Log user request (RLS audit trail)
    if (userId && analysisId) {
      await logFilmAnalysisRequest(url, key, userId, analysisId, title, director, { lang, model });
    }

    return { ...saved[0], film_id: filmId };
  } catch (error) {
    console.error("[Supabase] Error saving film analysis:", error.message);
    return null;
  }
}

// Log user film analysis request (for RLS audit trail and history)
export async function logFilmAnalysisRequest(
  supabaseUrl,
  supabaseKey,
  userId,
  filmAnalysisId,
  title = null,
  director = null,
  metadata = {},
) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/log_film_analysis_request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          p_user_id: userId,
          p_film_analysis_id: filmAnalysisId,
          p_title: title,
          p_director: director,
          p_metadata: metadata,
        }),
      },
    );

    if (!response.ok) {
      console.warn(`[RLS] Failed to log film analysis request: ${response.status}`);
    } else {
      console.log(`[RLS] Logged film analysis request for user ${userId}`);
    }
  } catch (error) {
    console.warn("[RLS] Error:", error.message);
  }
}

// Check if cached analysis exists in database
export async function getCachedFilmAnalysis(env, tmdbId, title, director, lang, model) {
  try {
    const url = await getSecret(env.SUPABASE_URL);
    const key = await getSecret(env.SUPABASE_SERVICE_KEY);

    if (!url || !key) return null;

    // Find film first
    let filmSearchUrl;
    if (tmdbId) {
      filmSearchUrl = `${url}/rest/v1/films?tmdb_id=eq.${encodeURIComponent(tmdbId)}&select=id,title,director,tmdb_id,poster_url`;
    } else {
      filmSearchUrl = `${url}/rest/v1/films?title=ilike.${encodeURIComponent(title)}&director=ilike.${encodeURIComponent(director || "")}&select=id,title,director,tmdb_id,poster_url&limit=1`;
    }

    const filmRes = await fetch(filmSearchUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    if (!filmRes.ok) return null;

    const films = await filmRes.json();
    if (!films || films.length === 0) return null;

    const filmRecord = films[0];

    // Find analysis for this film
    const analysisUrl = `${url}/rest/v1/film_analyses?film_id=eq.${filmRecord.id}&language=eq.${lang}&model=eq.${encodeURIComponent(model)}&status=eq.active&limit=1&select=*`;
    const analysisRes = await fetch(analysisUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    if (!analysisRes.ok) return null;

    const analyses = await analysisRes.json();
    if (!analyses || analyses.length === 0) return null;

    console.log(`[Cinema] Cache HIT from database: ${filmRecord.title}`);
    return {
      film: filmRecord,
      analysis: analyses[0],
    };
  } catch (error) {
    console.warn("[Cinema] Cache check error:", error.message);
    return null;
  }
}

// Check if user has already accessed this analysis (re-view vs first view)
export async function checkUserFilmAccess(env, userId, filmAnalysisId) {
  try {
    const url = await getSecret(env.SUPABASE_URL);
    const key = await getSecret(env.SUPABASE_SERVICE_KEY);

    if (!url || !key || !userId || !filmAnalysisId) return false;

    const checkUrl = `${url}/rest/v1/user_film_analysis_requests?user_id=eq.${userId}&film_analysis_id=eq.${filmAnalysisId}&select=id&limit=1`;
    const res = await fetch(checkUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    if (!res.ok) return false;

    const data = await res.json();
    return data && data.length > 0;
  } catch (error) {
    console.warn("[Cinema] User access check error:", error.message);
    return false;
  }
}
