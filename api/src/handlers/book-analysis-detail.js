// ============================================================
// HANDLER - BOOK ANALYSIS DETAIL
// ============================================================
// GET /api/book-analysis/:id
// Returns full book analysis details for authenticated user.
// Mirrors analysis-detail.js for literature.

import { jsonResponse } from "../utils/response.js";
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

export async function handleBookAnalysisDetail(request, env, origin, analysisId) {
  if (request.method !== "GET") {
    return jsonResponse({ success: false, error: "Method not allowed" }, 405, origin, env);
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!analysisId || !uuidRegex.test(analysisId)) {
    return jsonResponse({ success: false, error: "Invalid analysis ID" }, 400, origin, env);
  }

  try {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
      return jsonResponse({ success: false, error: "Unauthorized" }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;
    console.log(`[BookDetail] User ${userId} requesting book analysis ${analysisId}`);

    // Security check: User must have requested this analysis
    const { data: accessCheck, error: accessErr } = await supabase
      .from("user_book_analysis_requests")
      .select("id")
      .eq("book_analysis_id", analysisId)
      .limit(1)
      .maybeSingle();

    if (accessErr) {
      console.error("[BookDetail] Access check failed:", accessErr.message);
      return jsonResponse({ success: false, error: "Access check failed" }, 500, origin, env);
    }

    if (!accessCheck) {
      return jsonResponse({ success: false, error: "Analysis not found" }, 404, origin, env);
    }

    // Fetch full book analysis with book details
    const { data: analysis, error: analysisErr } = await supabase
      .from("book_analyses")
      .select(`
        *,
        books:book_id (
          id,
          title,
          author,
          google_books_id,
          cover_url,
          published_date,
          categories,
          page_count,
          publisher
        )
      `)
      .eq("id", analysisId)
      .single();

    if (analysisErr || !analysis) {
      console.error("[BookDetail] Analysis fetch failed:", analysisErr?.message);
      return jsonResponse({ success: false, error: "Analysis not found" }, 404, origin, env);
    }

    const book = analysis.books;
    if (!book) {
      console.error("[BookDetail] Analysis has no linked book");
      return jsonResponse({ success: false, error: "Book data missing" }, 500, origin, env);
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

    console.log(`[BookDetail] Returning book analysis ${analysisId}`);

    let response = jsonResponse(
      {
        success: true,
        id: analysis.id,
        book_id: analysis.book_id,
        title: book.title,
        author: book.author,
        google_books_id: book.google_books_id,
        language: analysis.language,
        version: analysis.version,
        media_type: "literature",
        guide_proof: guideProof,

        // Book metadata
        release_year: analysis.metadata?.release_year || book.published_date?.substring(0, 4) || null,
        genre: analysis.metadata?.genre || (book.categories || [])[0] || null,
        country: analysis.metadata?.country || null,
        cover_url: book.cover_url || analysis.metadata?.cover_url || null,
        page_count: book.page_count || analysis.metadata?.page_count || null,
        publisher: book.publisher || analysis.metadata?.publisher || null,

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
    console.error("[BookDetail] Error:", error);
    return jsonResponse({ success: false, error: "Internal server error" }, 500, origin, env);
  }
}
