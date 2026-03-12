// ============================================================
// HANDLER - BOOK ANALYSIS
// ============================================================
// Mirrors analyze.js but for literary works.
// Uses Google Books metadata + AI knowledge (no lyrics).
// ============================================================

import { validateModel, validateLanguage, jsonResponse } from "../utils/index.js";
import { getBookMetadataById, getBookMetadata } from "../books/index.js";
import { getDebateAestheticGuide } from "../guides/index.js";
import { generateGuideProofWithSignature } from "../guides/loader.js";
import { analyzeBookPhilosophy } from "../ai/book-orchestrator.js";
import { saveBookToSupabase, logBookAnalysisRequest } from "../ai/book-storage.js";
import { normalizeClassification, splitTrailingSchoolsParagraph } from "../ai/parser.js";
import { localizeClassification } from "../ai/classification-i18n.js";
import { calculateWeightedScore } from "../config/scoring.js";
import { calculatePhilosophicalNote } from "../ai/prompts/calculator.js";
import { getSecret } from "../utils/secrets.js";
import { getUserFromAuth } from "../auth/index.js";

function normalizeSchoolsHtml(value) {
  if (!value) return "";
  const s = String(value);
  if (!s.includes("<") && s.includes("\n")) {
    return s.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join("<br/>");
  }
  return s;
}

export async function handleBookAnalyze(
  request,
  env,
  origin = "https://philosify.org",
  ctx = null,
) {
  try {
    const body = await request.json();
    let {
      title,
      author,
      google_books_id,
      model = "claude",
      lang = "en",
    } = body;

    // Extract user ID from JWT token
    const user = await getUserFromAuth(request, env);
    const userId = user?.userId || null;

    // Validate inputs
    try {
      if (!title || typeof title !== "string" || title.trim().length < 1) {
        throw new Error("Book title is required");
      }
      if (title.length > 300) {
        throw new Error("Book title too long (maximum 300 characters)");
      }
      if (author && typeof author !== "string") {
        throw new Error("Author name must be a string");
      }
      if (author && author.length > 300) {
        throw new Error("Author name too long (maximum 300 characters)");
      }

      title = title.replace(/[<>{}]/g, "").trim();
      author = author ? author.replace(/[<>{}]/g, "").trim() : "";

      model = validateModel(model);
      lang = validateLanguage(lang);
    } catch (error) {
      return jsonResponse(
        { error: "Invalid input", message: error.message },
        400, origin, env,
      );
    }

    console.log(`[BookAnalysis] ========== NEW BOOK ANALYSIS ==========`);
    console.log(`[BookAnalysis] Input: "${title}" by "${author}"`);
    console.log(`[BookAnalysis] Google Books ID: ${google_books_id || "N/A"}`);
    console.log(`[BookAnalysis] Model: ${model}, Language: ${lang}`);

    // === CACHE CHECK (SUPABASE) ===
    if (
      (await getSecret(env.SUPABASE_URL)) &&
      (await getSecret(env.SUPABASE_SERVICE_KEY))
    ) {
      try {
        const supabaseUrl = await getSecret(env.SUPABASE_URL);
        const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

        // Look up book record
        const bookSearchUrl = google_books_id
          ? `${supabaseUrl}/rest/v1/books?google_books_id=eq.${encodeURIComponent(google_books_id)}&select=id,title,author,google_books_id`
          : `${supabaseUrl}/rest/v1/books?title=ilike.${encodeURIComponent(title)}&author=ilike.${encodeURIComponent(author)}&select=id,title,author,google_books_id&limit=1`;
        const bookSearchRes = await fetch(bookSearchUrl, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (bookSearchRes.ok) {
          const books = await bookSearchRes.json();
          if (books && books.length > 0) {
            const bookRecord = books[0];
            if (!google_books_id && bookRecord.google_books_id) {
              google_books_id = bookRecord.google_books_id;
            }
            console.log(
              `[BookCache] Found book: ${bookRecord.title} by ${bookRecord.author} (ID: ${bookRecord.id})`,
            );

            const analysisUrl = `${supabaseUrl}/rest/v1/book_analyses?book_id=eq.${bookRecord.id}&language=eq.${lang}&model=eq.${encodeURIComponent(model)}&status=eq.active&limit=1&select=*,metadata`;
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
                  `[BookCache] HIT! Found cached book analysis (ID: ${analysis.id})`,
                );

                // Check re-view vs first view
                let isReview = false;
                if (userId && analysis.id) {
                  try {
                    const historyCheckUrl = `${supabaseUrl}/rest/v1/user_book_analysis_requests?user_id=eq.${userId}&book_analysis_id=eq.${analysis.id}&select=id&limit=1`;
                    const historyRes = await fetch(historyCheckUrl, {
                      headers: {
                        apikey: supabaseKey,
                        Authorization: `Bearer ${supabaseKey}`,
                      },
                    });
                    if (historyRes.ok) {
                      const historyData = await historyRes.json();
                      isReview = historyData && historyData.length > 0;
                    }
                  } catch (err) {
                    console.warn("[BookCache] Failed to check user history:", err.message);
                  }
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

                // Log user request for cached analysis
                if (userId && analysis.id) {
                  try {
                    await logBookAnalysisRequest(supabaseUrl, supabaseKey, userId, analysis.id, {
                      lang, model, cached: true,
                    });
                  } catch (err) {
                    console.warn("[BookCache] Failed to log user request:", err.message);
                  }
                }

                return jsonResponse(
                  {
                    id: analysis.id,
                    book_id: analysis.book_id,
                    title: bookRecord.title,
                    author: bookRecord.author,
                    google_books_id: google_books_id,
                    language: analysis.language,
                    version: analysis.version,
                    media_type: "literature",
                    guide_proof: guideProof,

                    // Book metadata from metadata JSONB
                    release_year: analysis.metadata?.release_year || null,
                    genre: analysis.metadata?.genre || null,
                    country: analysis.metadata?.country || null,
                    cover_url: analysis.metadata?.cover_url || null,
                    page_count: analysis.metadata?.page_count || null,
                    publisher: analysis.metadata?.publisher || null,

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

                    // Scores
                    overall_grade: officialFinalScore,
                    ethics_score: analysis.ethics_score,
                    metaphysics_score: analysis.metaphysics_score,
                    epistemology_score: analysis.epistemology_score,
                    politics_score: analysis.politics_score,
                    aesthetics_score: analysis.aesthetics_score,
                    final_score: officialFinalScore,
                    metadata: analysis.metadata || {},

                    cached: true,
                    isReview: isReview,
                    created_at: analysis.created_at,
                  },
                  200, origin, env,
                );
              }
            }
          }
        }

        console.log(`[BookCache] Miss - will generate new analysis for: "${title}" by "${author}"`);
      } catch (cacheError) {
        console.warn(`[BookCache] Error checking cache:`, cacheError.message);
      }
    }

    // === NO CACHE - GENERATE NEW ANALYSIS ===

    // 1. Get book metadata
    let bookMetadata = null;
    if (google_books_id) {
      console.log(`[BookAnalysis] Fetching metadata by ID: ${google_books_id}`);
      bookMetadata = await getBookMetadataById(google_books_id, env);
      if (!bookMetadata) {
        console.warn(`[BookAnalysis] ID lookup failed, trying search...`);
        bookMetadata = await getBookMetadata(title, author, env);
      }
    } else {
      console.log(`[BookAnalysis] Searching Google Books: "${title}" by "${author}"`);
      bookMetadata = await getBookMetadata(title, author, env);
    }

    if (bookMetadata) {
      console.log(`[BookAnalysis] Metadata found: ${bookMetadata.google_books_id}`);
      if (!google_books_id && bookMetadata.google_books_id) {
        google_books_id = bookMetadata.google_books_id;
      }
    } else {
      console.warn(`[BookAnalysis] No metadata found, proceeding with AI knowledge only`);
      bookMetadata = {};
    }

    // Synopsis = Google Books description (supplementary, AI uses own knowledge)
    const synopsis = bookMetadata.description || "";

    // 2. Load literature guide
    console.log(`[BookAnalysis] Loading literature guide from KV`);
    const guide = await getDebateAestheticGuide(env);
    if (!guide) {
      return jsonResponse(
        { error: "Guide not loaded", message: "Literature guide not available" },
        500, origin, env,
      );
    }
    console.log(`[BookAnalysis] Guide loaded: ${guide.length} characters`);

    // 3. AI analysis
    console.log(`[BookAnalysis] Analyzing with model: ${model}, language: ${lang}`);
    const analysis = await analyzeBookPhilosophy(
      title,
      author,
      synopsis,
      bookMetadata,
      guide,
      model,
      lang,
      env,
    );

    // 4. Generate guide proof
    let guideProof = null;
    try {
      const guideProofSecret = await getSecret(env.GUIDE_PROOF_SECRET);
      if (guideProofSecret) {
        const tempId = "temp-" + Date.now();
        guideProof = await generateGuideProofWithSignature(guide, tempId, guideProofSecret, model, env);
        console.log(`[BookAnalysis] Guide proof generated`);
      }
    } catch (error) {
      console.error(`[BookAnalysis] Error generating guide proof:`, error.message);
    }

    // 5. Save to database
    let savedRecord = null;
    if (
      (await getSecret(env.SUPABASE_URL)) &&
      (await getSecret(env.SUPABASE_SERVICE_KEY))
    ) {
      savedRecord = await saveBookToSupabase(
        analysis, env, title, author, lang, model,
        google_books_id, userId, guideProof, bookMetadata,
      );
    }

    // 6. Regenerate guide proof with actual analysis ID
    if (savedRecord?.id && guideProof) {
      try {
        const guideProofSecret = await getSecret(env.GUIDE_PROOF_SECRET);
        if (guideProofSecret) {
          guideProof = await generateGuideProofWithSignature(guide, savedRecord.id, guideProofSecret, model, env);

          // Update database with regenerated guide proof
          const supabaseUrl = await getSecret(env.SUPABASE_URL);
          const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
          if (supabaseUrl && supabaseKey) {
            await fetch(
              `${supabaseUrl}/rest/v1/book_analyses?id=eq.${savedRecord.id}`,
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
                    ...(analysis?.schools_of_thought ? { schools_of_thought: analysis.schools_of_thought } : {}),
                    country: analysis.country || null,
                    genre: analysis.genre || null,
                    release_year: bookMetadata.release_year || null,
                    cover_url: bookMetadata.cover_url || null,
                    page_count: bookMetadata.page_count || null,
                    publisher: bookMetadata.publisher || null,
                  },
                }),
              },
            );
          }
        }
      } catch (error) {
        console.error(`[BookAnalysis] Error regenerating guide proof:`, error.message);
      }
    }

    const saveFailed = !savedRecord || !savedRecord.id;
    if (saveFailed) {
      console.error(`[BookAnalysis] CRITICAL: Analysis generated but save failed!`);
    }

    const responseData = {
      ...analysis,
      media_type: "literature",
      classification_localized: localizeClassification(analysis?.classification, lang),
      id: savedRecord?.id || null,
      book_id: savedRecord?.book_id || null,
      google_books_id: google_books_id || null,
      cover_url: bookMetadata.cover_url || null,
      page_count: bookMetadata.page_count || null,
      publisher: bookMetadata.publisher || null,
      cached: false,
      saveFailed: saveFailed,
      guide_proof: guideProof,
      metadata: guideProof
        ? {
            guide_sha256: guideProof.sha256,
            guide_signature: guideProof.signature,
            guide_version: guideProof.version,
            guide_modelo: guideProof.modelo,
            ...(analysis?.schools_of_thought ? { schools_of_thought: analysis.schools_of_thought } : {}),
          }
        : {},
    };

    return jsonResponse(responseData, 200, origin, env);
  } catch (error) {
    console.error("[BookAnalysis] Error:", error);

    if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
      error.isTimeout = true;
    }

    return jsonResponse(
      {
        error: error.isTimeout ? "Analysis timeout" : "Analysis failed. Please try again.",
        timeout: error.isTimeout || false,
      },
      error.isTimeout ? 504 : 500,
      origin,
      env,
    );
  }
}
