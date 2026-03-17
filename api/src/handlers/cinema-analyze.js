// ============================================================
// CINEMA ANALYSIS HANDLER
// Full philosophical analysis for films (1 credit)
// Uses KV for caching (deterministic key: cinema:{tmdb_id}:{model}:{lang})
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getDebateAestheticGuide } from "../guides/index.js";
import { analyzeFilmPhilosophy } from "../ai/cinema-orchestrator.js";
import { getFilmDetails } from "../films/search.js";
import { calculateWeightedScore } from "../config/scoring.js";
import { getPhilosophicalNote } from "../ai/prompts/calculator.js";
import { normalizeClassification } from "../ai/parser.js";
import { localizeClassification } from "../ai/classification-i18n.js";

export async function handleCinemaAnalyze(request, env, origin, ctx) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const body = await request.json();
    const { title, director, tmdb_id, overview, genres, model = "grok", lang = "en" } = body;

    if (!title || title.length < 1 || title.length > 300) {
      return jsonResponse({ error: "Title required (1-300 chars)" }, 400, origin, env);
    }

    // Check KV cache
    const cacheKey = `analysis:cinema:${tmdb_id || title.toLowerCase().replace(/\s+/g, '_')}:${model}:${lang}`;
    const cached = await env.PHILOSIFY_KV.get(cacheKey);

    if (cached) {
      console.log(`[CinemaAnalyze] Cache HIT: ${cacheKey}`);
      const result = JSON.parse(cached);
      // Recalculate scores (never trust stored values)
      const finalScore = calculateWeightedScore({
        ethics: result.scorecard?.ethics?.score || 0,
        metaphysics: result.scorecard?.metaphysics?.score || 0,
        epistemology: result.scorecard?.epistemology?.score || 0,
        politics: result.scorecard?.politics?.score || 0,
        aesthetics: result.scorecard?.aesthetics?.score || 0,
      });
      result.final_score = finalScore;
      result.scorecard.final_score = finalScore;
      result.classification = normalizeClassification(finalScore);
      result.classification_localized = localizeClassification(result.classification, lang);
      result.philosophical_note = getPhilosophicalNote(finalScore);
      result.cached = true;
      return jsonResponse(result, 200, origin, env);
    }

    console.log(`[CinemaAnalyze] Cache MISS — analyzing: "${title}" (${model}/${lang})`);

    // Reserve 1 credit
    const { reserveCredit, confirmReservation, releaseReservation } = await import("../credits/index.js");
    const reservation = await reserveCredit(env, user.userId);

    if (!reservation.success) {
      return jsonResponse({
        error: "Insufficient credits",
        needed: 1,
        balance: reservation.newTotal || 0,
      }, 402, origin, env);
    }

    try {
      // Get film details from TMDB for richer metadata
      let filmMetadata = { year: body.year, genres: genres || [], countries: body.countries || [], overview: overview || "" };
      if (tmdb_id) {
        try {
          const details = await getFilmDetails(tmdb_id, env, lang);
          if (details) {
            filmMetadata = {
              ...filmMetadata,
              cast: details.cast || [],
              runtime: details.runtime,
              tagline: details.tagline,
              vote_average: details.vote_average,
              genres: details.genres || genres || [],
              countries: details.production_countries || body.countries || [],
              year: details.year || body.year,
            };
          }
        } catch (e) {
          console.warn(`[CinemaAnalyze] TMDB details failed: ${e.message}`);
        }
      }

      // Load philosophical guide
      const guide = await getDebateAestheticGuide(env);

      // Run AI analysis
      const analysis = await analyzeFilmPhilosophy(
        title,
        director || "",
        overview || filmMetadata.overview || "",
        filmMetadata,
        guide,
        model,
        lang,
        env,
      );

      // Generate guide proof
      let guideProof = {};
      try {
        const { generateGuideProof } = await import("../ai/guide-proof.js");
        guideProof = await generateGuideProof(guide, `cinema-${cacheKey}`, env);
      } catch (e) {
        console.warn(`[CinemaAnalyze] Guide proof failed: ${e.message}`);
      }

      // Build response
      const result = {
        id: crypto.randomUUID(),
        title,
        director: director || "",
        tmdb_id: tmdb_id || null,
        language: lang,
        version: "3.0",
        media_type: "cinema",
        guide_proof: guideProof,
        release_year: filmMetadata.year || null,
        genre: (filmMetadata.genres || []).join(", "),
        country: (filmMetadata.countries || []).join(", "),
        cover_url: body.poster_url || null,
        runtime: filmMetadata.runtime || null,
        historical_context: analysis.historical_context || "",
        creative_process: analysis.creative_process || "",
        philosophical_analysis: analysis.philosophical_analysis || "",
        schools_of_thought: analysis.schools_of_thought || "",
        summary: analysis.summary || "",
        classification: analysis.classification || "",
        classification_localized: localizeClassification(analysis.classification, lang),
        philosophical_note: analysis.philosophical_note || 5,
        ethics_analysis: analysis.scorecard?.ethics?.justification || "",
        metaphysics_analysis: analysis.scorecard?.metaphysics?.justification || "",
        epistemology_analysis: analysis.scorecard?.epistemology?.justification || "",
        politics_analysis: analysis.scorecard?.politics?.justification || "",
        aesthetics_analysis: analysis.scorecard?.aesthetics?.justification || "",
        scorecard: analysis.scorecard || {},
        overall_grade: analysis.final_score || 0,
        final_score: analysis.final_score || 0,
        ethics_score: analysis.scorecard?.ethics?.score || 0,
        metadata: {
          model: analysis.model,
          guide_sha256: guideProof.sha256,
          guide_signature: guideProof.signature,
          guide_version: guideProof.version,
          cast: filmMetadata.cast,
          tagline: filmMetadata.tagline,
        },
        cached: false,
        created_at: new Date().toISOString(),
      };

      // Store in KV (permanent)
      await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(result));
      console.log(`[CinemaAnalyze] Cached: ${cacheKey}`);

      // Confirm credit
      await confirmReservation(env, reservation.reservationId, `cinema-analysis:${title.substring(0, 50)}`);

      return jsonResponse(result, 200, origin, env);
    } catch (err) {
      // Release credit on failure
      await releaseReservation(env, reservation.reservationId, "cinema-analysis-failed");
      throw err;
    }
  } catch (err) {
    console.error(`[CinemaAnalyze] Error:`, err.message);

    if (err.message?.includes("Insufficient credits")) {
      return jsonResponse({ error: err.message, needed: 1 }, 402, origin, env);
    }

    return jsonResponse({ error: err.message || "Analysis failed" }, 500, origin, env);
  }
}
