// ============================================================
// HANDLER - ANALYSIS DETAIL
// ============================================================
// GET /api/analysis/:id
// Returns full analysis details for authenticated user
// Security: User must have entry in user_analysis_requests for this analysis
//
// Response shape matches analyze.js cache hit response exactly

import { jsonResponse } from "../utils/response.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import {
  normalizeClassification,
  splitTrailingSchoolsParagraph,
} from "../ai/parser.js";
import { localizeClassification } from "../ai/classification-i18n.js";
import { calculateWeightedScore } from "../config/scoring.js";
import { calculatePhilosophicalNote } from "../ai/prompts/calculator.js";

// Helper: Normalize schools HTML (copied from analyze.js for consistency)
function normalizeSchoolsHtml(value) {
  if (!value) return "";
  const s = String(value);
  if (!s.includes("<") && s.includes("\n")) {
    return s
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("<br/>");
  }
  return s;
}

/**
 * Handle GET /api/analysis/:id
 * Returns full analysis details with same shape as analyze.js cache hit
 * RLS enforced - user must have requested this analysis before
 */
export async function handleAnalysisDetail(request, env, origin, analysisId) {
  if (request.method !== "GET") {
    return jsonResponse(
      { success: false, error: "Method not allowed" },
      405,
      origin,
      env,
    );
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!analysisId || !uuidRegex.test(analysisId)) {
    return jsonResponse(
      { success: false, error: "Invalid analysis ID" },
      400,
      origin,
      env,
    );
  }

  try {
    // Get Supabase client authenticated as user (RLS enforced)
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
      return jsonResponse(
        { success: false, error: "Unauthorized" },
        401,
        origin,
        env,
      );
    }

    const { client: supabase, userId, setCookieHeader } = auth;
    console.log(
      `[Analysis Detail] User ${userId} requesting analysis ${analysisId}`,
    );

    // Security check: User must have requested this analysis (entry in user_analysis_requests)
    // RLS on user_analysis_requests already filters by user_id
    const { data: accessCheck, error: accessErr } = await supabase
      .from("user_analysis_requests")
      .select("id")
      .eq("analysis_id", analysisId)
      .limit(1)
      .maybeSingle();

    if (accessErr) {
      console.error(
        "[Analysis Detail] Access check failed:",
        accessErr.message,
      );
      return jsonResponse(
        { success: false, error: "Access check failed" },
        500,
        origin,
        env,
      );
    }

    if (!accessCheck) {
      console.log(
        `[Analysis Detail] User ${userId} has no access to analysis ${analysisId}`,
      );
      return jsonResponse(
        { success: false, error: "Analysis not found" },
        404,
        origin,
        env,
      );
    }

    // Fetch full analysis with song details
    // Note: analyses table may not have RLS, so we use service role via the check above
    const { data: analysis, error: analysisErr } = await supabase
      .from("analyses")
      .select(
        `
        *,
        songs:song_id (
          id,
          title,
          artist,
          spotify_id
        )
      `,
      )
      .eq("id", analysisId)
      .single();

    if (analysisErr || !analysis) {
      console.error(
        "[Analysis Detail] Analysis fetch failed:",
        analysisErr?.message,
      );
      return jsonResponse(
        { success: false, error: "Analysis not found" },
        404,
        origin,
        env,
      );
    }

    // Extract song info
    const song = analysis.songs;
    if (!song) {
      console.error("[Analysis Detail] Analysis has no linked song");
      return jsonResponse(
        { success: false, error: "Analysis data incomplete" },
        500,
        origin,
        env,
      );
    }

    // Compute derived fields (same logic as analyze.js cache hit)
    const scorecardForCalc = {
      ethics: { score: Number(analysis.ethics_score ?? 0) },
      metaphysics: { score: Number(analysis.metaphysics_score ?? 0) },
      epistemology: { score: Number(analysis.epistemology_score ?? 0) },
      politics: { score: Number(analysis.politics_score ?? 0) },
      aesthetics: { score: Number(analysis.aesthetics_score ?? 0) },
    };
    const officialFinalScore = calculateWeightedScore(scorecardForCalc);
    const officialNote = calculatePhilosophicalNote(officialFinalScore);

    // Classification normalization
    const canonicalClassification = normalizeClassification(
      "",
      officialFinalScore,
    );
    const localizedClassification = localizeClassification(
      canonicalClassification,
      analysis.language || "en",
    );

    // Schools of thought extraction
    const storedSchools = analysis.metadata?.schools_of_thought || "";
    const splitSchools = storedSchools
      ? {
          philosophical_analysis: analysis.philosophical_analysis,
          extracted: "",
        }
      : splitTrailingSchoolsParagraph(analysis.philosophical_analysis);
    const schoolsOfThought = normalizeSchoolsHtml(
      storedSchools || splitSchools.extracted,
    );
    const philosophicalAnalysisClean = splitSchools.philosophical_analysis;

    // Guide proof from metadata (if available)
    let guideProof = null;
    if (
      analysis.metadata &&
      typeof analysis.metadata === "object" &&
      analysis.metadata.guide_sha256
    ) {
      guideProof = {
        sha256: analysis.metadata.guide_sha256,
        signature: analysis.metadata.guide_signature || null,
        version: analysis.metadata.guide_version || null,
        modelo: analysis.metadata.guide_modelo || null,
      };
    }

    // Build response - EXACTLY matching analyze.js cache hit shape
    const responseData = {
      id: analysis.id,
      song_id: analysis.song_id,
      song: song.title,
      song_name: song.title,
      artist: song.artist,
      spotify_id: song.spotify_id,
      language: analysis.language,
      version: analysis.version,
      generated_by: analysis.generated_by,
      guide_proof: guideProof,

      // Technical specifications
      release_year: analysis.release_year,
      genre: analysis.genre,
      duration_ms: analysis.duration_ms,
      tempo: analysis.tempo,
      key: analysis.key,
      time_signature: analysis.time_signature,
      country: analysis.country,

      // Historical context
      historical_context: analysis.historical_context,
      creative_process: analysis.creative_process,
      cultural_impact: analysis.cultural_impact,
      artist_background: analysis.artist_background,

      // Lyrics & content
      main_themes: analysis.main_themes,
      symbolic_elements: analysis.symbolic_elements,

      // Philosophical analysis
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

      // Grades & evaluations
      overall_grade: officialFinalScore,
      objectivist_alignment: analysis.objectivist_alignment,
      recommended: analysis.recommended,
      content_warnings: analysis.content_warnings,

      // Ambivalence
      has_ambivalence: analysis.has_ambivalence,
      ambivalence_explanation: analysis.ambivalence_explanation,
      philosophical_contradictions: analysis.philosophical_contradictions,

      // Detailed metrics
      hero_vs_martyr_score: analysis.hero_vs_martyr_score,
      reason_vs_faith_score: analysis.reason_vs_faith_score,
      individualism_vs_collectivism_score:
        analysis.individualism_vs_collectivism_score,
      virtue_indicators: analysis.virtue_indicators,

      // Quotes & evidence
      key_quotes: analysis.key_quotes,
      supporting_evidence: analysis.supporting_evidence,

      // Comparative analysis
      similar_songs: analysis.similar_songs,
      contrast_songs: analysis.contrast_songs,
      artist_philosophical_trajectory: analysis.artist_philosophical_trajectory,

      // Scorecard weights
      scorecard_weights: analysis.scorecard_weights,

      // Scores (backward compatibility)
      scorecard: {
        ethics: {
          score: analysis.ethics_score,
          justification: analysis.ethics_analysis || "",
        },
        metaphysics: {
          score: analysis.metaphysics_score,
          justification: analysis.metaphysics_analysis || "",
        },
        epistemology: {
          score: analysis.epistemology_score,
          justification: analysis.epistemology_analysis || "",
        },
        politics: {
          score: analysis.politics_score,
          justification: analysis.politics_analysis || "",
        },
        aesthetics: {
          score: analysis.aesthetics_score,
          justification: analysis.aesthetics_analysis || "",
        },
        final_score: officialFinalScore,
      },

      // Metadata
      metadata: analysis.metadata || {},
      ethics_score: analysis.ethics_score,
      metaphysics_score: analysis.metaphysics_score,
      epistemology_score: analysis.epistemology_score,
      politics_score: analysis.politics_score,
      aesthetics_score: analysis.aesthetics_score,
      final_score: officialFinalScore,

      // Timing
      analysis_duration_ms: analysis.analysis_duration_ms,
      prompt_version: analysis.prompt_version,

      // TTS audio URL
      audio_url: analysis.audio_url || null,

      // Flags
      cached: true, // Always true since we're fetching from DB
      created_at: analysis.created_at,
    };

    console.log(
      `[Analysis Detail] Returning analysis ${analysisId} for user ${userId}`,
    );

    let response = jsonResponse(responseData, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (error) {
    console.error("[Analysis Detail] Error:", error);
    return jsonResponse(
      { success: false, error: "Internal server error" },
      500,
      origin,
      env,
    );
  }
}
