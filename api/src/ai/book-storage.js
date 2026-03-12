// ============================================================
// AI - SUPABASE STORAGE (BOOKS)
// ============================================================
// Mirrors storage.js but saves to books + book_analyses tables.
// ============================================================

import { getOrCreateBook } from "../db/books.js";
import { getSecret } from "../utils/secrets.js";

// Save book analysis to Supabase (and log user request for RLS audit trail)
export async function saveBookToSupabase(
  analysis,
  env,
  title,
  author,
  lang,
  model,
  googleBooksId,
  userId = null,
  guideProof = null,
  bookMetadata = {},
) {
  try {
    const url = await getSecret(env.SUPABASE_URL);
    const key = await getSecret(env.SUPABASE_SERVICE_KEY);

    if (!url || !key) {
      console.warn("[Supabase] Not configured, skipping save");
      return;
    }

    // Step 1: Get or create book in books table
    const bookId = await getOrCreateBook(
      env,
      title,
      author || "",
      googleBooksId,
      bookMetadata.isbn || null,
      bookMetadata,
    );

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
    };

    const analysisData = {
      book_id: bookId,
      language: lang || "en",
      model: model,
      version: "3.0",

      // Scores (-10 to +10 from AI response)
      ethics_score: scorecard.ethics?.score || 0,
      metaphysics_score: scorecard.metaphysics?.score || 0,
      epistemology_score: scorecard.epistemology?.score || 0,
      politics_score: scorecard.politics?.score || 0,
      aesthetics_score: scorecard.aesthetics?.score || 0,
      final_score: scorecard.final_score || 0,

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

      // Metadata JSONB (guide proof + schools_of_thought + book metadata)
      metadata: {
        ...metadata,
        country: analysis.country || null,
        genre: analysis.genre || null,
        release_year: bookMetadata.release_year || null,
        cover_url: bookMetadata.cover_url || null,
        page_count: bookMetadata.page_count || null,
        publisher: bookMetadata.publisher || null,
      },

      status: "active",
    };

    // Step 4: Save to book_analyses table
    const response = await fetch(`${url}/rest/v1/book_analyses`, {
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
        const selectUrl = `${url}/rest/v1/book_analyses?book_id=eq.${bookId}&language=eq.${lang}&model=eq.${encodeURIComponent(model)}&status=eq.active&limit=1&select=id,book_id,model,ethics_analysis`;
        const selectResponse = await fetch(selectUrl, {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        });

        if (selectResponse.ok) {
          const existing = await selectResponse.json();
          if (existing && existing.length > 0) {
            const existingAnalysis = existing[0];

            // Check if existing analysis has missing data
            const hasMissingData =
              !existingAnalysis.ethics_analysis ||
              existingAnalysis.ethics_analysis.includes("[Missing analysis");

            if (hasMissingData) {
              console.warn(
                `[Supabase] Existing book analysis ${existingAnalysis.id} has missing data - marking as superseded`,
              );

              // Mark as superseded
              const supersededUrl = `${url}/rest/v1/book_analyses?id=eq.${existingAnalysis.id}`;
              await fetch(supersededUrl, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  apikey: key,
                  Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({ status: "superseded" }),
              });

              // Retry save
              const retryResponse = await fetch(`${url}/rest/v1/book_analyses`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: key,
                  Authorization: `Bearer ${key}`,
                  Prefer: "return=representation",
                },
                body: JSON.stringify(analysisData),
              });

              if (retryResponse.ok) {
                const saved = await retryResponse.json();
                const analysisId = saved[0]?.id;
                console.log(
                  `[Supabase] New book analysis saved after superseding (ID: ${analysisId})`,
                );

                if (userId && analysisId) {
                  await logBookAnalysisRequest(url, key, userId, analysisId, { lang, model });
                }

                return saved[0];
              }
              return null;
            }

            // Return existing if complete
            return {
              id: existingAnalysis.id,
              book_id: existingAnalysis.book_id,
            };
          }
        }
      }

      console.error("[Supabase] Book analysis save failed:", response.status, errorText);
      return null;
    } else {
      const saved = await response.json();
      const analysisId = saved[0]?.id;
      console.log(
        `[Supabase] Book analysis saved (ID: ${analysisId}, Book ID: ${bookId}, Lang: ${lang})`,
      );

      // Step 5: Log user request (RLS audit trail)
      if (userId && analysisId) {
        await logBookAnalysisRequest(url, key, userId, analysisId, { lang, model });
      }

      return saved[0];
    }
  } catch (error) {
    console.error("[Supabase] Error saving book analysis:", error.message);
    return null;
  }
}

// Log user book analysis request (for RLS audit trail)
export async function logBookAnalysisRequest(
  supabaseUrl,
  supabaseKey,
  userId,
  bookAnalysisId,
  metadata = {},
) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/log_book_analysis_request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          p_user_id: userId,
          p_book_analysis_id: bookAnalysisId,
          p_metadata: metadata,
        }),
      },
    );

    if (!response.ok) {
      console.warn(`[RLS] Failed to log book analysis request: ${response.status}`);
    }
  } catch (error) {
    console.warn("[RLS] Error:", error.message);
  }
}
