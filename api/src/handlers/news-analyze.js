// ============================================================
// NEWS ANALYSIS HANDLER
// Full analysis for news articles (1 credit)
// Uses KV for caching (deterministic key: news:{sha256(title+source)}:{model}:{lang})
// Returns: the_facts, source_analysis, hits_and_misses, philosify_opinion
// No scorecard, no classification, no philosophical note.
// ============================================================

import { jsonResponse, sanitizeErrorMessage } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { checkRateLimit } from "../rate-limit/index.js";
import { getGuide, getWrapupSource } from "../guides/index.js";
import { analyzeNewsPhilosophy } from "../ai/news-orchestrator.js";
import { getSecret } from "../utils/secrets.js";
import { logUserAnalysisRequest } from "../ai/storage.js";

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

    // Rate limit - FAIL CLOSED for expensive AI calls
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitOk = await checkRateLimit(env, `news-analyze:${user.userId}:${ip}`, true);
    if (!rateLimitOk) {
      return jsonResponse({ error: "Too many requests. Please wait." }, 429, origin, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON in request body" }, 400, origin, env);
    }
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
      result.cached = true;

      // SECURITY: Check if user has accessed this analysis before
      // If not, charge 1 credit (first-time view of cached content)
      if (result.id && user.userId) {
        try {
          const sbUrl = await getSecret(env.SUPABASE_URL);
          const sbKey = await getSecret(env.SUPABASE_SERVICE_KEY);
          if (sbUrl && sbKey) {
            // Check if this is a re-view (user has accessed before)
            const checkRes = await fetch(
              `${sbUrl}/rest/v1/user_analysis_requests?user_id=eq.${user.userId}&analysis_id=eq.${result.id}&select=id&limit=1`,
              {
                headers: {
                  apikey: sbKey,
                  Authorization: `Bearer ${sbKey}`,
                },
              }
            );
            const existingAccess = checkRes.ok ? await checkRes.json() : [];
            const isReview = existingAccess && existingAccess.length > 0;

            // First-time view - charge 1 credit
            if (!isReview) {
              const { reserveCredit, confirmReservation } = await import("../credits/index.js");
              const reservation = await reserveCredit(env, user.userId);
              if (!reservation.success) {
                return jsonResponse({
                  error: "Insufficient credits",
                  needed: 1,
                  balance: reservation.newTotal || 0,
                }, 402, origin, env);
              }
              await confirmReservation(env, reservation.reservationId, result.id);
              console.log(`[NewsAnalyze] Charged 1 credit for first-time cached view: ${user.userId}`);
            }

            result.isReview = isReview;

            // Log user request for history
            await logUserAnalysisRequest(sbUrl, sbKey, user.userId, result.id, {
              lang: body.lang || "en",
              model: body.model || "grok",
              media_type: "news",
              cached: true,
            });
          }
        } catch (logErr) {
          console.warn(`[NewsAnalyze] Cache hit processing failed (non-fatal): ${logErr.message}`);
        }
      }

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

      // Load philosophical guide + source of truth (owner's voice) in parallel
      const [guide, sourceOfTruth] = await Promise.all([
        getGuide(env),
        getWrapupSource(env).catch((err) => {
          console.warn(`[NewsAnalyze] Source of truth unavailable: ${err.message}`);
          return "";
        }),
      ]);

      // Build article text from available content
      const articleText = [
        description || "",
        body.aiSummary || "",
      ].filter(Boolean).join("\n\n") || `News headline: ${title}. Source: ${source || "Unknown"}. Use your own knowledge of this event.`;

      // Run AI analysis (with sourceOfTruth)
      const analysis = await analyzeNewsPhilosophy(
        title,
        source || "",
        articleText,
        newsMetadata,
        guide,
        sourceOfTruth,
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

      // Build response — new structure with 4 analysis fields
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
        // New analysis fields
        the_facts: analysis.the_facts || "",
        source_analysis: analysis.source_analysis || "",
        hits_and_misses: analysis.hits_and_misses || "",
        philosify_opinion: analysis.philosify_opinion || "",
        // Legacy fields set to null for frontend compatibility
        scorecard: null,
        classification: null,
        classification_localized: null,
        philosophical_note: null,
        philosophical_analysis: null,
        historical_context: null,
        creative_process: null,
        schools_of_thought: null,
        final_score: null,
        overall_grade: null,
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

      // Store in KV cache
      await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(result));
      console.log(`[NewsAnalyze] Cached: ${cacheKey}`);

      // Save to Supabase for user history (same pattern as music/books/films)
      try {
        const sbUrl = await getSecret(env.SUPABASE_URL);
        const sbKey = await getSecret(env.SUPABASE_SERVICE_KEY);
        if (sbUrl && sbKey) {
          // Step 1: Upsert into songs table (reuse for news — spotify_id = news:hash)
          const newsSpotifyId = `news:${titleHash}`;
          let songId = null;

          // Check if exists
          const existRes = await fetch(
            `${sbUrl}/rest/v1/songs?spotify_id=eq.${encodeURIComponent(newsSpotifyId)}&select=id`,
            { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } },
          );
          const existing = existRes.ok ? await existRes.json() : [];
          if (existing.length > 0) {
            songId = existing[0].id;
          } else {
            const createRes = await fetch(`${sbUrl}/rest/v1/songs`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: sbKey,
                Authorization: `Bearer ${sbKey}`,
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                title: title,
                artist: source || "News",
                spotify_id: newsSpotifyId,
                lyrics: "",
                status: "published",
              }),
            });
            if (createRes.ok) {
              const created = await createRes.json();
              songId = created[0]?.id;
            } else if (createRes.status === 409) {
              // Conflict — already exists, fetch it
              const retryRes = await fetch(
                `${sbUrl}/rest/v1/songs?spotify_id=eq.${encodeURIComponent(newsSpotifyId)}&select=id`,
                { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } },
              );
              const retryData = retryRes.ok ? await retryRes.json() : [];
              songId = retryData[0]?.id;
            }
          }

          if (songId) {
            // Step 2: Insert into analyses table (null scores — news has no scorecard)
            const analysisData = {
              song_id: songId,
              language: lang,
              model: analysis.model || "grok",
              version: 1,
              ethics_score: 0,
              metaphysics_score: 0,
              epistemology_score: 0,
              politics_score: 0,
              aesthetics_score: 0,
              final_score: 0,
              philosophical_analysis: [
                result.the_facts,
                result.source_analysis,
                result.hits_and_misses,
                result.philosify_opinion,
              ].filter(Boolean).join("\n\n"),
              summary: result.the_facts || "",
              classification: "news",
              philosophical_note: null,
              genre: result.genre || topic || "news",
              country: result.country || "",
              historical_context: null,
              creative_process: null,
              metadata: {
                media_type: "news",
                the_facts: result.the_facts,
                source_analysis: result.source_analysis,
                hits_and_misses: result.hits_and_misses,
                philosify_opinion: result.philosify_opinion,
                guide_sha256: guideProof.sha256,
                guide_signature: guideProof.signature,
                guide_version: guideProof.version,
                publishedAt,
                topic,
              },
              status: "published",
            };

            const insertRes = await fetch(`${sbUrl}/rest/v1/analyses`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: sbKey,
                Authorization: `Bearer ${sbKey}`,
                Prefer: "return=representation",
              },
              body: JSON.stringify(analysisData),
            });

            if (insertRes.ok) {
              const saved = await insertRes.json();
              const analysisId = saved[0]?.id;
              result.id = analysisId || result.id;
              console.log(`[NewsAnalyze] Saved to Supabase: ${analysisId}`);

              // Step 3: Log user request for history
              if (user.userId && analysisId) {
                await logUserAnalysisRequest(sbUrl, sbKey, user.userId, analysisId, {
                  lang,
                  model: analysis.model,
                  media_type: "news",
                });
              }
            } else if (insertRes.status === 409) {
              // Already exists — just log the user request
              console.log(`[NewsAnalyze] Analysis already in Supabase (409), logging user request`);
              const findRes = await fetch(
                `${sbUrl}/rest/v1/analyses?song_id=eq.${songId}&language=eq.${lang}&status=eq.published&select=id`,
                { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } },
              );
              const found = findRes.ok ? await findRes.json() : [];
              if (found[0]?.id && user.userId) {
                result.id = found[0].id;
                await logUserAnalysisRequest(sbUrl, sbKey, user.userId, found[0].id, {
                  lang,
                  model: analysis.model,
                  media_type: "news",
                  cached: true,
                });
              }
            } else {
              console.warn(`[NewsAnalyze] Supabase insert failed: ${insertRes.status}`);
            }
          }
        }
      } catch (dbErr) {
        // Don't fail the analysis if Supabase save fails — KV cache is still valid
        console.error(`[NewsAnalyze] Supabase save failed (non-fatal): ${dbErr.message}`);
      }

      // Update KV with the real Supabase ID
      await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(result));

      // Constellation Graph Enrichment (Tier 1: rule-based extraction)
      if (result.id) {
        try {
          const { extractRuleBased } = await import("../extractors/constellation-rule-extractor.js");
          const extractionResult = await extractRuleBased(
            { id: result.id, ...result },
            "news",
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
      await confirmReservation(env, reservation.reservationId, `news-analysis:${title.substring(0, 50)}`);

      return jsonResponse(result, 200, origin, env);
    } catch (err) {
      await releaseReservation(env, reservation.reservationId, "news-analysis-failed");
      throw err;
    }
  } catch (err) {
    console.error(`[NewsAnalyze] Error:`, err.message);

    if (err.message?.includes("Insufficient credits")) {
      return jsonResponse({ error: "Insufficient credits", needed: 1 }, 402, origin, env);
    }

    // Sanitize error message to prevent leaking internal details
    return jsonResponse(
      { error: sanitizeErrorMessage(err.message, "Analysis failed") },
      500,
      origin,
      env,
    );
  }
}
