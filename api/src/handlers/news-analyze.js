// ============================================================
// NEWS ANALYSIS HANDLER
// Full philosophical analysis for news articles (1 credit)
// Uses KV for caching (deterministic key: news:{sha256(title+source)}:{model}:{lang})
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getGuide } from "../guides/index.js";
import { analyzeNewsPhilosophy } from "../ai/news-orchestrator.js";
import { calculateWeightedScore } from "../config/scoring.js";
import { calculatePhilosophicalNote } from "../ai/prompts/calculator.js";
import { normalizeClassification } from "../ai/parser.js";
import { localizeClassification } from "../ai/classification-i18n.js";

async function hashKey(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 24);
}

export async function handleNewsAnalyze(request, env, origin, ctx) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const body = await request.json();
    const { title, source, description, topic, publishedAt, model = "grok", lang = "en" } = body;

    if (!title || title.length < 1 || title.length > 500) {
      return jsonResponse({ error: "Title required (1-500 chars)" }, 400, origin, env);
    }

    // Check KV cache
    const titleHash = await hashKey(`${title}|${source || ""}`);
    const cacheKey = `analysis:news:${titleHash}:${model}:${lang}`;
    const cached = await env.PHILOSIFY_KV.get(cacheKey);

    if (cached) {
      console.log(`[NewsAnalyze] Cache HIT: ${cacheKey}`);
      const result = JSON.parse(cached);
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
      return jsonResponse(result, 200, origin, env);
    }

    console.log(`[NewsAnalyze] Cache MISS — analyzing: "${title}" (${model}/${lang})`);

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
      const newsMetadata = {
        source: source || "",
        publishedAt: publishedAt || null,
        topic: topic || "",
        description: description || "",
      };

      // Load philosophical guide (main guide for news — deals with real-world ethics/politics)
      const guide = await getGuide(env);

      // Build article text from available content
      const articleText = [
        description || "",
        body.aiSummary || "",
      ].filter(Boolean).join("\n\n") || `News headline: ${title}. Source: ${source || "Unknown"}. Use your own knowledge of this event.`;

      // Run AI analysis
      const analysis = await analyzeNewsPhilosophy(
        title,
        source || "",
        articleText,
        newsMetadata,
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
        console.warn(`[NewsAnalyze] Guide proof failed: ${e.message}`);
      }

      // Build response
      const result = {
        id: crypto.randomUUID(),
        title,
        artist: source || "",
        source: source || "",
        language: lang,
        version: "3.0",
        media_type: "news",
        guide_proof: guideProof,
        country: analysis.country || "",
        genre: analysis.genre || topic || "",
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
          publishedAt,
          topic,
        },
        cached: false,
        created_at: new Date().toISOString(),
      };

      // Store in KV (permanent)
      await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(result));
      console.log(`[NewsAnalyze] Cached: ${cacheKey}`);

      // Confirm credit
      await confirmReservation(env, reservation.reservationId, `news-analysis:${title.substring(0, 50)}`);

      return jsonResponse(result, 200, origin, env);
    } catch (err) {
      await releaseReservation(env, reservation.reservationId, "news-analysis-failed");
      throw err;
    }
  } catch (err) {
    console.error(`[NewsAnalyze] Error:`, err.message);

    if (err.message?.includes("Insufficient credits")) {
      return jsonResponse({ error: err.message, needed: 1 }, 402, origin, env);
    }

    return jsonResponse({ error: err.message || "Analysis failed" }, 500, origin, env);
  }
}
