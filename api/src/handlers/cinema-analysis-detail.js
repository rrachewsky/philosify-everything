// ============================================================
// HANDLER - CINEMA ANALYSIS DETAIL
// ============================================================
// GET /api/cinema-analysis/:id
// Returns full film analysis details for authenticated user.
// Mirrors book-analysis-detail.js for cinema.

import { jsonResponse, errorResponse } from "../utils/response.js";
import { getLocalizedError } from "../utils/i18n-errors.js";
import { getSupabaseForUser, addRefreshedCookieToResponse } from "../utils/supabase-user.js";
import { normalizeClassification, splitTrailingSchoolsParagraph } from "../ai/parser.js";
import { localizeClassification } from "../ai/classification-i18n.js";
import { calculateWeightedScore } from "../config/scoring.js";
import { calculatePhilosophicalNote } from "../ai/prompts/calculator.js";

function normalizeSchoolsHtml(value) {
  if (!value) return "";
  const s = String(value);
  if (!s.includes("<") && s.includes("\n")) {
    return s.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join("<br/>");
  }
  return s;
}

export async function handleCinemaAnalysisDetail(request, env, origin, analysisId) {
  const lang = 'en';
  
  if (request.method !== "GET") {
    return errorResponse(env, origin, 'METHOD_NOT_ALLOWED', lang);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!analysisId || !uuidRegex.test(analysisId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  try {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
      return errorResponse(env, origin, 'UNAUTHORIZED', lang);
    }

    const { client: supabase, userId, setCookieHeader } = auth;
    console.log(`[CinemaDetail] User ${userId} requesting film analysis ${analysisId}`);

    // Security check: User must have requested this analysis
    const { data: accessCheck, error: accessErr } = await supabase
      .from("user_film_analysis_requests")
      .select("id")
      .eq("film_analysis_id", analysisId)
      .limit(1)
      .maybeSingle();

    if (accessErr) {
      console.error("[CinemaDetail] Access check failed:", accessErr.message);
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    if (!accessCheck) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
    }

    // Fetch full film analysis with film details
    const { data: analysis, error: analysisErr } = await supabase
      .from("film_analyses")
      .select(`
        *,
        films:film_id (
          id,
          title,
          director,
          tmdb_id,
          poster_url,
          overview,
          release_year,
          genres,
          runtime_minutes,
          production_countries,
          original_language,
          tagline,
          vote_average
        )
      `)
      .eq("id", analysisId)
      .single();

    if (analysisErr || !analysis) {
      console.error("[CinemaDetail] Analysis fetch failed:", analysisErr?.message);
      return errorResponse(env, origin, 'NOT_FOUND', lang);
    }

    const film = analysis.films;
    if (!film) {
      console.error("[CinemaDetail] Analysis has no linked film");
      return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
    }

    // Recompute weighted score
    const scorecardForCalc = {
      ethics: { score: Number(analysis.ethics_score ?? 0) },
      metaphysics: { score: Number(analysis.metaphysics_score ?? 0) },
      epistemology: { score: Number(analysis.epistemology_score ?? 0) },
      politics: { score: Number(analysis.politics_score ?? 0) },
      aesthetics: { score: Number(analysis.aesthetics_score ?? 0) },
    };
    const officialFinalScore = calculateWeightedScore(scorecardForCalc);
    const officialNote = calculatePhilosophicalNote(officialFinalScore);
    const canonicalClassification = normalizeClassification("", officialFinalScore);
    const lang = analysis.language || "en";
    const localizedClassification = localizeClassification(canonicalClassification, lang);

    // Guide proof
    let guideProof = null;
    if (analysis.metadata?.guide_sha256) {
      guideProof = {
        sha256: analysis.metadata.guide_sha256,
        signature: analysis.metadata.guide_signature || null,
        version: analysis.metadata.guide_version || null,
        modelo: analysis.metadata.guide_modelo || null,
      };
    }

    // Schools of thought
    const storedSchools = analysis.metadata?.schools_of_thought || "";
    const splitSchools = storedSchools
      ? { philosophical_analysis: analysis.philosophical_analysis, extracted: "" }
      : splitTrailingSchoolsParagraph(analysis.philosophical_analysis);
    const schoolsOfThought = normalizeSchoolsHtml(storedSchools || splitSchools.extracted);
    const philosophicalAnalysisClean = splitSchools.philosophical_analysis;

    console.log(`[CinemaDetail] Returning film analysis ${analysisId}`);

    let response = jsonResponse(
      {
        success: true,
        id: analysis.id,
        film_id: analysis.film_id,
        title: film.title,
        director: film.director,
        artist: film.director,
        tmdb_id: film.tmdb_id,
        language: analysis.language,
        version: analysis.version,
        media_type: "cinema",
        guide_proof: guideProof,

        // Film metadata
        release_year: analysis.metadata?.release_year || film.release_year || null,
        genre: analysis.metadata?.genre || (film.genres || [])[0] || null,
        country: analysis.metadata?.country || (film.production_countries || [])[0] || null,
        cover_url: film.poster_url || analysis.metadata?.poster_url || null,
        poster_url: film.poster_url || analysis.metadata?.poster_url || null,
        runtime: film.runtime_minutes || analysis.metadata?.runtime || null,
        tagline: film.tagline || analysis.metadata?.tagline || null,
        cast: analysis.metadata?.cast || null,

        // Analysis content
        historical_context: analysis.historical_context,
        creative_process: analysis.creative_process,
        philosophical_analysis: philosophicalAnalysisClean,
        schools_of_thought: schoolsOfThought,
        summary: analysis.summary,
        classification: canonicalClassification,
        classification_localized: localizedClassification,
        philosophical_note: officialNote,

        // Branch analyses
        ethics_analysis: analysis.ethics_analysis,
        metaphysics_analysis: analysis.metaphysics_analysis,
        epistemology_analysis: analysis.epistemology_analysis,
        politics_analysis: analysis.politics_analysis,
        aesthetics_analysis: analysis.aesthetics_analysis,

        // Scorecard
        scorecard: {
          ethics: { score: analysis.ethics_score, justification: analysis.ethics_analysis || "" },
          metaphysics: { score: analysis.metaphysics_score, justification: analysis.metaphysics_analysis || "" },
          epistemology: { score: analysis.epistemology_score, justification: analysis.epistemology_analysis || "" },
          politics: { score: analysis.politics_score, justification: analysis.politics_analysis || "" },
          aesthetics: { score: analysis.aesthetics_score, justification: analysis.aesthetics_analysis || "" },
          final_score: officialFinalScore,
        },

        overall_grade: officialFinalScore,
        ethics_score: analysis.ethics_score,
        metaphysics_score: analysis.metaphysics_score,
        epistemology_score: analysis.epistemology_score,
        politics_score: analysis.politics_score,
        aesthetics_score: analysis.aesthetics_score,
        final_score: officialFinalScore,
        metadata: analysis.metadata || {},

        cached: true,
        created_at: analysis.created_at,
      },
      200, origin, env,
    );

    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (error) {
    console.error("[CinemaDetail] Error:", error);
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
  }
}
