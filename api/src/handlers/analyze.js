// ============================================================
// HANDLER - ANALYSIS
// ============================================================

import {
  validateSongInput,
  validateModel,
  validateLanguage,
  jsonResponse,
} from "../utils/index.js";
import { getMessage } from "../utils/messages.js";
import { getLyrics } from "../lyrics/index.js";
import { sanitizeLyrics, validateLyricsFormat } from "../lyrics/sanitize.js";
import {
  getSpotifyMetadata,
  getSpotifyMetadataById,
} from "../spotify/index.js";
import { getGuideForLanguage } from "../guides/index.js";
import { generateGuideProofWithSignature } from "../guides/loader.js";
import {
  analyzePhilosophy,
  saveToSupabase,
  logUserAnalysisRequest,
} from "../ai/index.js";
import {
  normalizeClassification,
  splitTrailingSchoolsParagraph,
} from "../ai/parser.js";
import { localizeClassification } from "../ai/classification-i18n.js";
import { calculateWeightedScore } from "../config/scoring.js";
import { calculatePhilosophicalNote } from "../ai/prompts/calculator.js";
import { getSecret } from "../utils/secrets.js";
import { getUserFromAuth } from "../auth/index.js";
import { validateAndCleanCache } from "../ai/validator.js";
import { autoCreateCollective, addAnalysisToCollective } from "./collective.js";
// NOTE: TTS is now generated on-demand via /api/tts endpoint (gemini.js)
// The old generateAndStoreTTS (OpenAI-based) is deprecated and no longer called here

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

export async function handleAnalyze(
  request,
  env,
  origin = "https://everything.philosify.org",
  ctx = null,
) {
  try {
    const body = await request.json();
    let { song, artist, spotify_id, model = "claude", lang = "en" } = body;

    // Extract user ID from JWT token (for audit trail)
    // RLS Note: We don't enforce auth here - anonymous analyses allowed
    // But if user is authenticated, we log their request in user_analysis_requests
    const user = await getUserFromAuth(request, env);
    const userId = user?.userId || null;

    // Validate and sanitize all inputs
    try {
      // Validate song and artist
      const validated = validateSongInput(song, artist);
      song = validated.song;
      artist = validated.artist;

      // Validate spotify_id format (22 base62 characters)
      if (spotify_id && !/^[a-zA-Z0-9]{22}$/.test(spotify_id)) {
        spotify_id = null; // Discard invalid spotify_id silently
      }

      // Validate model (with default fallback)
      model = validateModel(model);

      // Validate language (with default fallback)
      lang = validateLanguage(lang);
    } catch (error) {
      return jsonResponse(
        { error: "Invalid input", message: error.message },
        400,
        origin,
        env,
      );
    }

    console.log(`[Philosify] ========== NEW ANALYSIS ==========`);
    console.log(`[Philosify] Input: "${song}" - "${artist}"`);
    console.log(`[Philosify] Spotify ID: ${spotify_id || "N/A"}`);
    console.log(`[Philosify] Model: ${model}`);
    console.log(`[Philosify] Language: ${lang}`);

    // === CACHE CHECK (SUPABASE) ===
    // Prefer spotify_id, but fall back to (song, artist) if spotify_id is missing.
    if (
      (await getSecret(env.SUPABASE_URL)) &&
      (await getSecret(env.SUPABASE_SERVICE_KEY))
    ) {
      try {
        const supabaseUrl = await getSecret(env.SUPABASE_URL);
        const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

        // Look up song record
        const songSearchUrl = spotify_id
          ? `${supabaseUrl}/rest/v1/songs?spotify_id=eq.${encodeURIComponent(spotify_id)}&select=id,title,artist,spotify_id`
          : `${supabaseUrl}/rest/v1/songs?title=ilike.${encodeURIComponent(song)}&artist=ilike.${encodeURIComponent(artist)}&select=id,title,artist,spotify_id&limit=1`;
        const songSearchRes = await fetch(songSearchUrl, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (songSearchRes.ok) {
          const songs = await songSearchRes.json();
          if (songs && songs.length > 0) {
            const songRecord = songs[0];
            // Backfill spotify_id if we found it in DB and request didn't include it
            if (!spotify_id && songRecord.spotify_id) {
              spotify_id = songRecord.spotify_id;
            }
            console.log(
              `[Cache] Found song by spotify_id: ${songRecord.title} by ${songRecord.artist} (ID: ${songRecord.id})`,
            );

            const analysisUrl = `${supabaseUrl}/rest/v1/analyses?song_id=eq.${songRecord.id}&language=eq.${lang}&model=eq.${encodeURIComponent(model)}&status=eq.published&limit=1&select=*,metadata`;
            const analysisRes = await fetch(analysisUrl, {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            });

            if (analysisRes.ok) {
              const analyses = await analysisRes.json();
              if (analyses && analyses.length > 0) {
                const analysis = analyses[0];
                console.log(
                  `[Cache] ✓✓✓ HIT! Found cached analysis (ID: ${analysis.id}, Model: ${model}, Lang: ${lang})`,
                );

                // QUALITY VALIDATION: Check if cached analysis is complete and valid
                const validation = await validateAndCleanCache(
                  analysis,
                  supabaseUrl,
                  supabaseKey,
                );

                if (!validation.valid) {
                  console.warn(
                    `[Cache] ❌ Cached analysis FAILED quality check - regenerating`,
                  );
                  console.warn(`[Cache] Reason: ${validation.reason}`);
                  if (validation.deleted) {
                    console.log(
                      `[Cache] ✓ Invalid cache deleted, proceeding with fresh analysis`,
                    );
                  }
                  // Continue to fresh analysis generation below (don't return cached)
                } else {
                  console.log(
                    `[Cache] ✓ Quality validation passed, returning cached analysis`,
                  );

                  // Check if this user has already requested this analysis (re-view vs first view)
                  // First view = charge credit, Re-view = no charge
                  let isReview = false;
                  if (userId && analysis.id) {
                    try {
                      const historyCheckUrl = `${supabaseUrl}/rest/v1/user_analysis_requests?user_id=eq.${userId}&analysis_id=eq.${analysis.id}&select=id&limit=1`;
                      const historyRes = await fetch(historyCheckUrl, {
                        headers: {
                          apikey: supabaseKey,
                          Authorization: `Bearer ${supabaseKey}`,
                        },
                      });
                      if (historyRes.ok) {
                        const historyData = await historyRes.json();
                        isReview = historyData && historyData.length > 0;
                        console.log(
                          `[Cache] User history check: ${isReview ? "re-view (no charge)" : "first view (will charge)"}`,
                        );
                      }
                    } catch (err) {
                      console.warn(
                        "[Cache] Failed to check user history:",
                        err.message,
                      );
                      // Default to first view (charge) if check fails
                    }
                  }

                  // Cached rows may have inconsistent derived fields (final_score / note / classification).
                  // Recompute official weighted final_score from stored axis scores, then derive note + classification from it.
                  const scorecardForCalc = {
                    ethics: { score: Number(analysis.ethics_score ?? 0) },
                    metaphysics: {
                      score: Number(analysis.metaphysics_score ?? 0),
                    },
                    epistemology: {
                      score: Number(analysis.epistemology_score ?? 0),
                    },
                    politics: { score: Number(analysis.politics_score ?? 0) },
                    aesthetics: {
                      score: Number(analysis.aesthetics_score ?? 0),
                    },
                  };
                  const officialFinalScore =
                    calculateWeightedScore(scorecardForCalc);
                  const officialNote =
                    calculatePhilosophicalNote(officialFinalScore);

                  // Always return canonical classification enum (English) for UI/i18n mapping,
                  // even if older cached rows stored localized/legacy classification strings.
                  const canonicalClassification = normalizeClassification(
                    "",
                    officialFinalScore,
                  );
                  const localizedClassification = localizeClassification(
                    canonicalClassification,
                    lang,
                  );

                  // Get guide proof from metadata or generate if missing
                  let guideProof = null;
                  if (
                    analysis.metadata &&
                    typeof analysis.metadata === "object" &&
                    analysis.metadata.guide_sha256
                  ) {
                    // Use stored guide proof from metadata
                    guideProof = {
                      sha256: analysis.metadata.guide_sha256,
                      signature: analysis.metadata.guide_signature || null,
                      version: analysis.metadata.guide_version || null,
                      modelo: analysis.metadata.guide_modelo || null,
                    };
                    console.log(`[Cache] ✓ Guide proof loaded from metadata`);
                  } else if (analysis.id) {
                    // If no stored proof, generate it (for backward compatibility with old analyses)
                    try {
                      const guideProofSecret = await getSecret(
                        env.GUIDE_PROOF_SECRET,
                      );
                      if (guideProofSecret) {
                        // Load guide to generate proof (same guide used for analysis)
                        const guide = await getGuideForLanguage(env, lang);
                        if (guide) {
                          guideProof = await generateGuideProofWithSignature(
                            guide,
                            analysis.id,
                            guideProofSecret,
                            model,
                            env,
                          );
                          console.log(
                            `[Cache] ✓ Guide proof generated for cached analysis (backward compatibility)`,
                          );
                        }
                      }
                    } catch (error) {
                      console.warn(
                        `[Cache] Error generating guide proof:`,
                        error.message,
                      );
                      // Don't fail the request if guide proof generation fails
                    }
                  }

                  // School(s) of Thought: prefer stored metadata, else extract from legacy integrated analysis
                  const storedSchools =
                    analysis.metadata?.schools_of_thought || "";
                  const splitSchools = storedSchools
                    ? {
                        philosophical_analysis: analysis.philosophical_analysis,
                        extracted: "",
                      }
                    : splitTrailingSchoolsParagraph(
                        analysis.philosophical_analysis,
                      );
                  const schoolsOfThought = normalizeSchoolsHtml(
                    storedSchools || splitSchools.extracted,
                  );
                  const philosophicalAnalysisClean =
                    splitSchools.philosophical_analysis;

                  // NOTE: TTS is now generated on-demand via /api/tts endpoint (Gemini)
                  // The audio_url will be populated after first TTS request and cached in R2

                  // Log user request for cached analysis (audit trail for RLS)
                  // This enables the /api/analysis/:id endpoint to verify user access
                  // SECURITY: Await to ensure audit trail is written before responding
                  // (fire-and-forget could silently fail, causing double-charging on re-view)
                  if (userId && analysis.id) {
                    try {
                      await logUserAnalysisRequest(
                        supabaseUrl,
                        supabaseKey,
                        userId,
                        analysis.id,
                        {
                          lang,
                          model,
                          cached: true,
                        },
                      );
                    } catch (err) {
                      console.warn(
                        "[Cache] Failed to log user request:",
                        err.message,
                      );
                    }
                  }

                  // Auto-create collective for cached analyses - MUST complete before response
                  // This ensures the collective exists when the frontend loads
                  if (spotify_id) {
                    try {
                      // Fetch Spotify metadata to get artist info
                      const cachedMetadata = await getSpotifyMetadataById(
                        spotify_id,
                        env,
                      );
                      if (
                        cachedMetadata?.spotify_artist_id &&
                        cachedMetadata?.artist
                      ) {
                        const { groupId, created } = await autoCreateCollective(
                          env,
                          cachedMetadata.spotify_artist_id,
                          cachedMetadata.artist,
                          cachedMetadata.artist_image_url || null,
                        );

                        if (groupId && analysis.id) {
                          // Extract verdict snippet
                          const verdictSnippet = (
                            analysis.summary ||
                            analysis.philosophical_analysis ||
                            ""
                          )
                            .replace(/<[^>]*>/g, "")
                            .substring(0, 200);

                          // Extract schools array
                          const schoolsArray = (storedSchools || "")
                            .split(/<br\s*\/?>/i)
                            .map((s) => s.replace(/<[^>]*>/g, "").trim())
                            .filter(Boolean);

                          await addAnalysisToCollective(env, groupId, {
                            analysisId: analysis.id,
                            songName: songRecord.title,
                            score: officialFinalScore,
                            schools: schoolsArray,
                            verdictSnippet,
                            userId,
                            language: analysis.language || lang || "en",
                          });

                          console.log(
                            `[Collective] ✓ Cached analysis added to ${created ? "new" : "existing"} collective for "${cachedMetadata.artist}"`,
                          );
                        }
                      } else {
                        console.log(
                          `[Collective] No artist metadata for spotify_id: ${spotify_id}`,
                        );
                      }
                    } catch (err) {
                      // Don't fail the analysis, just log the error
                      console.error(
                        `[Collective] Error adding cached analysis:`,
                        err.message,
                      );
                    }
                  }

                  return jsonResponse(
                    {
                      id: analysis.id,
                      song_id: analysis.song_id,
                      song: songRecord.title,
                      song_name: songRecord.title,
                      artist: songRecord.artist,
                      spotify_id: spotify_id, // Use request param (songs table, not analyses)
                      language: analysis.language,
                      version: analysis.version,
                      generated_by: analysis.generated_by,
                      guide_proof: guideProof, // Guide SHA-256 hash and HMAC signature for internal auditing

                      // Technical specifications (columns only - old cached data refreshes on re-analysis)
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

                      // Lyrics & content (lyrics kept private for copyright)
                      // lyrics: analysis.lyrics, // REMOVED - copyright protection
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
                      // Align weighted score display with official computed score
                      overall_grade: officialFinalScore,
                      objectivist_alignment: analysis.objectivist_alignment,
                      recommended: analysis.recommended,
                      content_warnings: analysis.content_warnings,

                      // Ambivalence
                      has_ambivalence: analysis.has_ambivalence,
                      ambivalence_explanation: analysis.ambivalence_explanation,
                      philosophical_contradictions:
                        analysis.philosophical_contradictions,

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
                      artist_philosophical_trajectory:
                        analysis.artist_philosophical_trajectory,

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

                      // Metadata (includes guide proof stored in database)
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

                      // TTS audio URL (if already generated)
                      audio_url: analysis.audio_url || null,

                      cached: true,
                      isReview: isReview, // true = re-view (no charge), false = first view (charge)
                      created_at: analysis.created_at,
                    },
                    200,
                    origin,
                    env,
                  );
                } // End else (validation passed)
              }
            }
          }
        }

        console.log(
          `[Cache] Miss - will generate new analysis for: ${song} by ${artist} (model: ${model}, lang: ${lang})`,
        );
      } catch (cacheError) {
        console.warn(`[Cache] Error checking cache:`, cacheError.message);
      }
    }

    // === NO CACHE - GENERATE NEW ANALYSIS ===

    // 1. Fetch lyrics
    console.log(`[Philosify] Fetching lyrics: ${song} - ${artist}`);
    const rawLyrics = await getLyrics(song, artist, env);

    // Validate lyrics format before sanitization
    if (!validateLyricsFormat(rawLyrics)) {
      console.error(`[Philosify] ✗✗✗ FATAL ERROR ✗✗✗`);
      console.error(`[Philosify] Lyrics invalid or not found`);
      return jsonResponse(
        {
          error: "Lyrics not found or invalid",
          message: getMessage(lang, "lyricsNotFound", song, artist),
          song,
          artist,
        },
        404,
        origin,
        env,
      );
    }

    // Sanitize lyrics (remove HTML, injection patterns, enforce limits)
    const lyrics = sanitizeLyrics(rawLyrics, 10000);
    if (!lyrics || lyrics.length < 50) {
      console.error(`[Philosify] ✗✗✗ FATAL ERROR ✗✗✗`);
      console.error(`[Philosify] Lyrics too short after sanitization`);
      return jsonResponse(
        {
          error: "Lyrics too short after sanitization",
          message: getMessage(lang, "lyricsTooShort", song, artist),
          song,
          artist,
        },
        404,
        origin,
        env,
      );
    }
    console.log(
      `[Philosify] ✓ Lyrics found and sanitized (${lyrics.length} chars)`,
    );

    // 2. Spotify metadata
    let metadata = null;
    if (spotify_id) {
      console.log(`[Philosify] Using direct spotify_id: ${spotify_id}`);
      metadata = await getSpotifyMetadataById(spotify_id, env);

      if (!metadata) {
        console.warn(
          `[Philosify] ID lookup failed for ${spotify_id}, falling back to name search...`,
        );
        // Fallback: Try searching by name if ID lookup failed (e.g. region lock or glitch)
        metadata = await getSpotifyMetadata(song, artist || "", env);
      }
    } else {
      console.log(`[Philosify] Searching Spotify: "${song}" - "${artist}"`);
      metadata = await getSpotifyMetadata(song, artist || "", env);
    }

    if (metadata) {
      console.log(
        `[Philosify] ✓ Spotify found: ${metadata.spotify_id} (Year: ${metadata.release_year})`,
      );
      // Only update spotify_id if we didn't have one from the request
      // (preserve user's selection, don't let search override it)
      if (!spotify_id && metadata.spotify_id) {
        spotify_id = metadata.spotify_id;
      }
    } else {
      console.warn(
        `[Philosify] ⚠ Spotify metadata NOT found for: "${song}" - "${artist}"`,
      );
    }

    // 3. Load guide
    console.log(`[Philosify] Loading guide from KV for language: ${lang}`);
    const guide = await getGuideForLanguage(env, lang);
    if (!guide) {
      return jsonResponse(
        {
          error: "Guide not loaded",
          message: getMessage(lang, "guideNotLoaded"),
        },
        500,
        origin,
        env,
      );
    }
    console.log(`[Philosify] ✓ Guide loaded: ${guide.length} characters`);

    // 4. Philosophical analysis
    // 4. Philosophical analysis
    console.log(
      `[Philosify] Analyzing with model: ${model}, language: ${lang}`,
    );
    const analysis = await analyzePhilosophy(
      song,
      artist || "",
      lyrics,
      metadata,
      guide,
      model,
      lang,
      env,
    );

    // Cleanup logic REMOVED - Schools of Thought is no longer injected or requested

    // 5. Generate guide proof (SHA-256 hash + HMAC signature) for internal auditing

    // 5. Generate guide proof (SHA-256 hash + HMAC signature) for internal auditing
    // We generate a temporary ID first, then regenerate after saving
    let guideProof = null;
    try {
      const guideProofSecret = await getSecret(env.GUIDE_PROOF_SECRET);
      if (guideProofSecret) {
        // Generate proof with temporary ID (will be regenerated after save with real ID)
        const tempId = "temp-" + Date.now();
        guideProof = await generateGuideProofWithSignature(
          guide,
          tempId,
          guideProofSecret,
          model,
          env,
        );
        console.log(
          `[Philosify] ✓ Guide proof generated (SHA-256: ${guideProof.sha256.substring(0, 16)}...)`,
        );
      } else {
        console.warn(
          `[Philosify] ⚠️ GUIDE_PROOF_SECRET not configured, skipping guide proof generation`,
        );
      }
    } catch (error) {
      console.error(`[Philosify] Error generating guide proof:`, error.message);
      // Don't fail the request if guide proof generation fails
    }

    // 6. Save to database (and log user request if authenticated)
    let savedRecord = null;
    if (
      (await getSecret(env.SUPABASE_URL)) &&
      (await getSecret(env.SUPABASE_SERVICE_KEY))
    ) {
      savedRecord = await saveToSupabase(
        analysis,
        env,
        song,
        artist,
        lyrics,
        lang,
        model,
        spotify_id,
        userId,
        guideProof,
      );
    }

    // 7. Regenerate guide proof with actual analysis ID for final signature
    if (savedRecord?.id && guideProof) {
      try {
        const guideProofSecret = await getSecret(env.GUIDE_PROOF_SECRET);
        if (guideProofSecret) {
          guideProof = await generateGuideProofWithSignature(
            guide,
            savedRecord.id,
            guideProofSecret,
            model,
            env,
          );
          console.log(
            `[Philosify] ✓ Guide proof regenerated with analysis ID (Signature: ${guideProof.signature.substring(0, 16)}...)`,
          );

          // Update database with regenerated guide proof including modelo
          const supabaseUrl = await getSecret(env.SUPABASE_URL);
          const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

          if (supabaseUrl && supabaseKey) {
            const updateResponse = await fetch(
              `${supabaseUrl}/rest/v1/analyses?id=eq.${savedRecord.id}`,
              {
                method: "PATCH",
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  "Content-Type": "application/json",
                  Prefer: "return=minimal",
                },
                body: JSON.stringify({
                  metadata: {
                    guide_sha256: guideProof.sha256,
                    guide_signature: guideProof.signature,
                    guide_version: guideProof.version,
                    guide_modelo: guideProof.modelo,
                    ...(analysis?.schools_of_thought
                      ? { schools_of_thought: analysis.schools_of_thought }
                      : {}),
                  },
                }),
              },
            );

            if (updateResponse.ok) {
              console.log(
                `[Philosify] ✓ Guide proof updated in database with modelo: ${guideProof.modelo}`,
              );
            } else {
              console.error(
                `[Philosify] Failed to update guide proof in database: ${updateResponse.status}`,
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `[Philosify] Error regenerating guide proof:`,
          error.message,
        );
        // Don't fail the request if guide proof regeneration fails
      }
    }

    // 7. Include analysis ID in response (needed for WhatsApp share button)
    // Also flag if save failed so credit handling knows not to charge
    const saveFailed = !savedRecord || !savedRecord.id;
    if (saveFailed) {
      console.error(
        `[Philosify] CRITICAL: Analysis generated but save failed! User will not be charged.`,
      );
    } else {
      console.log(
        `[Philosify] ✓ Analysis saved: ${savedRecord.id} (song_id: ${savedRecord.song_id})`,
      );

      // 8. Auto-create collective and add analysis (fire and forget)
      // This enables artist fan clubs with analysis feeds
      if (metadata?.spotify_artist_id && metadata?.artist) {
        try {
          const { groupId, created } = await autoCreateCollective(
            env,
            metadata.spotify_artist_id,
            metadata.artist,
            metadata.artist_image_url || null,
          );

          if (groupId && savedRecord.id) {
            // Extract verdict snippet (first 200 chars of summary or philosophical analysis)
            const verdictSnippet = (
              analysis.summary ||
              analysis.philosophical_analysis ||
              ""
            )
              .replace(/<[^>]*>/g, "") // Strip HTML
              .substring(0, 200);

            // Extract schools array from schools_of_thought string
            const schoolsArray = (analysis.schools_of_thought || "")
              .split(/<br\s*\/?>/i)
              .map((s) => s.replace(/<[^>]*>/g, "").trim())
              .filter(Boolean);

            await addAnalysisToCollective(env, groupId, {
              analysisId: savedRecord.id,
              songName: song,
              score: analysis.final_score || analysis.scorecard?.final_score,
              schools: schoolsArray,
              verdictSnippet,
              userId,
              language: lang || "en",
            });

            console.log(
              `[Collective] ✓ Analysis added to ${created ? "new" : "existing"} collective for "${metadata.artist}"`,
            );
          }
        } catch (err) {
          // Don't fail the analysis if collective creation fails
          console.error(
            `[Collective] Error adding to collective:`,
            err.message,
          );
        }
      }
    }

    // NOTE: TTS is now generated on-demand via /api/tts endpoint (Gemini)
    // The audio_url will be populated after first TTS request and cached in R2

    const responseData = {
      ...analysis,
      // Provide a localized display label for UI/email usage (canonical enum remains in `classification`)
      classification_localized: localizeClassification(
        analysis?.classification,
        lang,
      ),
      id: savedRecord?.id || null,
      song_id: savedRecord?.song_id || null,
      spotify_id: spotify_id || null, // Include spotify_id for Spotify embed
      cached: false, // New analysis, not from cache
      saveFailed: saveFailed, // Flag for credit handling
      guide_proof: guideProof, // Guide SHA-256 hash and HMAC signature for internal auditing
      audio_url: null, // Will be populated later by TTS generation (check on frontend)
      metadata: guideProof
        ? {
            guide_sha256: guideProof.sha256,
            guide_signature: guideProof.signature,
            guide_version: guideProof.version,
            guide_modelo: guideProof.modelo,
            ...(analysis?.schools_of_thought
              ? { schools_of_thought: analysis.schools_of_thought }
              : {}),
          }
        : {}, // Include metadata with guide proof in response
    };

    return jsonResponse(responseData, 200, origin, env);
  } catch (error) {
    console.error("[Philosify] Error:", error);

    // Check if it's a timeout error - this will be handled by the caller (index.js) to release credit
    if (
      error.message?.includes("timeout") ||
      error.message?.includes("Timeout")
    ) {
      console.error(
        "[Philosify] ⚠️ Analysis timeout detected - credit should be refunded",
      );
      // Re-throw with timeout flag so caller can release credit
      error.isTimeout = true;
    }

    return jsonResponse(
      {
        error: "Analysis failed. Please try again.",
        timeout: error.isTimeout || false,
      },
      500,
      origin,
      env,
    );
  }
}
