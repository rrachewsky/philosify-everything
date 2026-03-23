// ============================================================
// CINEMA ANALYSIS HANDLER
// Full philosophical analysis for films (1 credit)
// Uses KV for fast caching + Supabase for history tracking
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getDebateAestheticGuide } from "../guides/index.js";
import { analyzeFilmPhilosophy } from "../ai/cinema-orchestrator.js";
import { getFilmDetails } from "../films/search.js";
import { calculateWeightedScore } from "../config/scoring.js";
import { calculatePhilosophicalNote } from "../ai/prompts/calculator.js";
import { normalizeClassification } from "../ai/parser.js";
import { localizeClassification } from "../ai/classification-i18n.js";
import {
  saveFilmToSupabase,
  logFilmAnalysisRequest,
  getCachedFilmAnalysis,
  checkUserFilmAccess,
} from "../ai/cinema-storage.js";
import { getSecret } from "../utils/secrets.js";

export async function handleCinemaAnalyze(request, env, origin, ctx) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const body = await request.json();
    const { title, director, tmdb_id, overview, genres, model = "claude", lang = "en" } = body;

    if (!title || title.length < 1 || title.length > 300) {
      return jsonResponse({ error: "Title required (1-300 chars)" }, 400, origin, env);
    }

    const userId = user.userId;

    // === CACHE CHECK (KV first, then Supabase) ===
    const cacheKey = `analysis:cinema:${tmdb_id || title.toLowerCase().replace(/\s+/g, '_')}:${model}:${lang}`;
    const kvCached = await env.PHILOSIFY_KV.get(cacheKey);

    if (kvCached) {
      console.log(`[CinemaAnalyze] KV Cache HIT: ${cacheKey}`);
      const result = JSON.parse(kvCached);

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
      result.classification = normalizeClassification("", finalScore);
      result.classification_localized = localizeClassification(result.classification, lang);
      result.philosophical_note = calculatePhilosophicalNote(finalScore);
      result.cached = true;

      // Log user request for history tracking (even for cache hits)
      if (userId) {
        try {
          const sbUrl = await getSecret(env.SUPABASE_URL);
          const sbKey = await getSecret(env.SUPABASE_SERVICE_KEY);
          if (sbUrl && sbKey) {
            let analysisIdToLog = result.db_analysis_id;

            // For old KV cache entries without db_analysis_id, check database
            if (!analysisIdToLog) {
              const dbCached = await getCachedFilmAnalysis(env, tmdb_id, title, director, lang, model);
              if (dbCached?.analysis?.id) {
                analysisIdToLog = dbCached.analysis.id;
                // Update KV cache with db_analysis_id for future hits
                result.db_analysis_id = analysisIdToLog;
                await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(result));
              }
            }

            if (analysisIdToLog) {
              await logFilmAnalysisRequest(sbUrl, sbKey, userId, analysisIdToLog, title, director, {
                lang,
                model,
                cached: true,
              });
            }
          }
        } catch (err) {
          console.warn("[CinemaAnalyze] Failed to log cache hit:", err.message);
        }
      }

      return jsonResponse(result, 200, origin, env);
    }

    // Check Supabase cache (database)
    const dbCached = await getCachedFilmAnalysis(env, tmdb_id, title, director, lang, model);
    if (dbCached) {
      console.log(`[CinemaAnalyze] Database Cache HIT: ${dbCached.film.title}`);
      const { film, analysis } = dbCached;

      // Check if this is a re-view
      const isReview = await checkUserFilmAccess(env, userId, analysis.id);

      // Recalculate scores
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
      const localizedClassification = localizeClassification(canonicalClassification, lang);

      // Log user request for history
      try {
        const sbUrl = await getSecret(env.SUPABASE_URL);
        const sbKey = await getSecret(env.SUPABASE_SERVICE_KEY);
        if (sbUrl && sbKey) {
          await logFilmAnalysisRequest(sbUrl, sbKey, userId, analysis.id, title, director, {
            lang,
            model,
            cached: true,
          });
        }
      } catch (err) {
        console.warn("[CinemaAnalyze] Failed to log db cache hit:", err.message);
      }

      const result = {
        id: analysis.id,
        db_analysis_id: analysis.id,
        film_id: analysis.film_id,
        title: film.title,
        director: film.director,
        tmdb_id: film.tmdb_id,
        language: analysis.language,
        version: analysis.version,
        media_type: "cinema",
        guide_proof: analysis.metadata?.guide_sha256
          ? {
              sha256: analysis.metadata.guide_sha256,
              signature: analysis.metadata.guide_signature,
              version: analysis.metadata.guide_version,
            }
          : null,
        release_year: analysis.metadata?.release_year || null,
        genre: analysis.metadata?.genre || null,
        country: null,
        cover_url: film.poster_url || analysis.metadata?.poster_url || null,
        runtime: analysis.metadata?.runtime || null,
        historical_context: analysis.historical_context,
        creative_process: analysis.creative_process,
        philosophical_analysis: analysis.philosophical_analysis,
        schools_of_thought: analysis.metadata?.schools_of_thought || "",
        summary: analysis.summary,
        classification: canonicalClassification,
        classification_localized: localizedClassification,
        philosophical_note: officialNote,
        ethics_analysis: analysis.ethics_analysis,
        metaphysics_analysis: analysis.metaphysics_analysis,
        epistemology_analysis: analysis.epistemology_analysis,
        politics_analysis: analysis.politics_analysis,
        aesthetics_analysis: analysis.aesthetics_analysis,
        scorecard: {
          ethics: { score: analysis.ethics_score, justification: analysis.ethics_analysis || "" },
          metaphysics: { score: analysis.metaphysics_score, justification: analysis.metaphysics_analysis || "" },
          epistemology: { score: analysis.epistemology_score, justification: analysis.epistemology_analysis || "" },
          politics: { score: analysis.politics_score, justification: analysis.politics_analysis || "" },
          aesthetics: { score: analysis.aesthetics_score, justification: analysis.aesthetics_analysis || "" },
          final_score: officialFinalScore,
        },
        overall_grade: officialFinalScore,
        final_score: officialFinalScore,
        ethics_score: analysis.ethics_score,
        metadata: analysis.metadata || {},
        cached: true,
        isReview,
        created_at: analysis.created_at,
      };

      // Also store in KV for faster future access
      await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(result));

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
      let filmMetadata = {
        year: body.year,
        genres: genres || [],
        countries: body.countries || [],
        overview: overview || "",
        poster_url: body.poster_url || null,
      };
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
              poster_url: details.poster_path
                ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                : filmMetadata.poster_url,
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
        const { generateGuideProof } = await import("../guides/loader.js");
        guideProof = await generateGuideProof(guide);
      } catch (e) {
        console.warn(`[CinemaAnalyze] Guide proof failed: ${e.message}`);
      }

      // Save to Supabase database
      let savedRecord = null;
      try {
        console.log(`[CinemaAnalyze] Saving to Supabase: "${title}" (${tmdb_id || 'no tmdb'}, ${model}, ${lang})`);
        savedRecord = await saveFilmToSupabase(
          analysis,
          env,
          title,
          director || "",
          lang,
          model,
          tmdb_id,
          userId,
          guideProof,
          filmMetadata,
        );
        if (savedRecord) {
          console.log(`[CinemaAnalyze] Supabase save OK: ID=${savedRecord.id}, FilmID=${savedRecord.film_id}`);
        } else {
          console.error(`[CinemaAnalyze] Supabase save returned NULL`);
        }
      } catch (err) {
        console.error("[CinemaAnalyze] Database save EXCEPTION:", err.message, err.stack);
      }

      // Build response
      const result = {
        id: savedRecord?.id || crypto.randomUUID(),
        db_analysis_id: savedRecord?.id || null,
        film_id: savedRecord?.film_id || null,
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
        cover_url: filmMetadata.poster_url || body.poster_url || null,
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
      try {
        const resultJson = JSON.stringify(result);
        console.log(`[CinemaAnalyze] Saving to KV (${resultJson.length} bytes): ${cacheKey}`);
        await env.PHILOSIFY_KV.put(cacheKey, resultJson);
        console.log(`[CinemaAnalyze] KV put completed for: ${cacheKey}`);
        
        // Verify save by reading back
        const verify = await env.PHILOSIFY_KV.get(cacheKey);
        if (verify) {
          console.log(`[CinemaAnalyze] KV VERIFIED: ${cacheKey} (${verify.length} bytes)`);
        } else {
          console.error(`[CinemaAnalyze] KV VERIFY FAILED - key not found after save!`);
        }
      } catch (kvErr) {
        console.error(`[CinemaAnalyze] KV SAVE EXCEPTION: ${kvErr.message}`, kvErr.stack);
      }
      
      // Also log save status for debugging
      console.log(`[CinemaAnalyze] Save status - Supabase: ${savedRecord ? 'OK (ID: ' + savedRecord.id + ')' : 'FAILED'}, KV key: ${cacheKey}`);

      // Constellation Graph Enrichment (Tier 1: rule-based extraction)
      if (savedRecord?.id) {
        try {
          const { extractRuleBased } = await import("../extractors/constellation-rule-extractor.js");
          const extractionResult = await extractRuleBased(
            { id: savedRecord.id, ...result },
            "cinema",
            env,
          );
          console.log(
            `[Constellation] Tier 1: ${extractionResult.conceptLinks} links, ${extractionResult.edgeCandidates} edges`,
          );
        } catch (err) {
          console.warn("[Constellation] Tier 1 extraction failed:", err.message);
        }
      }

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
