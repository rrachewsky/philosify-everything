// ============================================================
// AI - SUPABASE STORAGE
// ============================================================

import { getOrCreateSong } from "../db/songs.js";
import { getSecret } from "../utils/secrets.js";

// Save analysis to Supabase (and log user request for RLS audit trail)
export async function saveToSupabase(
  analysis,
  env,
  song,
  artist,
  lyrics,
  lang,
  model,
  spotifyId,
  userId = null,
  guideProof = null,
) {
  try {
    const url = await getSecret(env.SUPABASE_URL);
    const key = await getSecret(env.SUPABASE_SERVICE_KEY);

    if (!url || !key) {
      console.warn("[Supabase] Not configured, skipping save");
      return;
    }

    // Step 1: Get or create song in songs table
    const songId = await getOrCreateSong(
      env,
      song,
      artist || "",
      spotifyId,
      lyrics,
    );

    // Step 2: Extract scores from analysis scorecard (already -10 to +10, no conversion needed!)
    const scorecard = analysis.scorecard || {};

    // Step 3: Map fields to database schema (database uses *_score, not score_*)
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
      song_id: songId,
      language: lang || "en",
      model: model, // Direct column (not in metadata!)
      version: 1, // Hardcoded - versioning not used (scores are immutable per song+model)

      // Scores (already -10 to +10 from AI response)
      ethics_score: scorecard.ethics?.score || 0,
      metaphysics_score: scorecard.metaphysics?.score || 0,
      epistemology_score: scorecard.epistemology?.score || 0,
      politics_score: scorecard.politics?.score || 0,
      aesthetics_score: scorecard.aesthetics?.score || 0,
      final_score: scorecard.final_score || 0,

      // Integrated analysis & summary
      // NOTE: Some legacy code stored the integrated essay into `summary`.
      // We now persist it into BOTH `philosophical_analysis` and `summary` for compatibility.
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

      // Technical specs (top-level columns, not metadata JSON)
      release_year: analysis.release_year || null,
      genre: analysis.genre || null,
      country: analysis.country || null,
      historical_context: analysis.historical_context || null,
      creative_process: analysis.creative_process || null,

      // Metadata JSONB (guide proof + extra derived containers)
      metadata,

      status: "published",
    };

    // Step 4: Save to analyses table
    const response = await fetch(`${url}/rest/v1/analyses`, {
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

      // Check if error is due to duplicate (409 = conflict)
      if (response.status === 409) {
        // Fetch existing analysis to check if it has missing scorecard data
        const selectUrl = `${url}/rest/v1/analyses?song_id=eq.${songId}&language=eq.${lang}&model=eq.${encodeURIComponent(model)}&status=eq.published&limit=1&select=id,song_id,model,ethics_analysis,metaphysics_analysis,epistemology_analysis,politics_analysis,aesthetics_analysis`;
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

            // Check if existing analysis has missing scorecard data
            const hasMissingData =
              !existingAnalysis.ethics_analysis ||
              existingAnalysis.ethics_analysis.includes("[Missing analysis") ||
              !existingAnalysis.metaphysics_analysis ||
              existingAnalysis.metaphysics_analysis.includes(
                "[Missing analysis",
              ) ||
              !existingAnalysis.epistemology_analysis ||
              existingAnalysis.epistemology_analysis.includes(
                "[Missing analysis",
              ) ||
              !existingAnalysis.politics_analysis ||
              existingAnalysis.politics_analysis.includes(
                "[Missing analysis",
              ) ||
              !existingAnalysis.aesthetics_analysis ||
              existingAnalysis.aesthetics_analysis.includes(
                "[Missing analysis",
              );

            if (hasMissingData) {
              console.warn(
                `[Supabase] Existing analysis ${existingAnalysis.id} has missing scorecard data - marking as superseded`,
              );

              // SECURITY: Mark as superseded instead of deleting (preserves immutability audit trail)
              const supersededUrl = `${url}/rest/v1/analyses?id=eq.${existingAnalysis.id}`;
              const supersededResponse = await fetch(supersededUrl, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  apikey: key,
                  Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({ status: "superseded" }),
              });

              if (supersededResponse.ok) {
                console.log(
                  `[Supabase] ✓ Marked incomplete analysis ${existingAnalysis.id} as superseded - saving new version`,
                );

                // Save the new complete analysis (unique constraint only covers status=published)
                const retryResponse = await fetch(`${url}/rest/v1/analyses`, {
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
                    `[Supabase] ✓ New analysis saved after superseding incomplete one (ID: ${analysisId})`,
                  );

                  // Log user request if authenticated
                  if (userId && analysisId) {
                    await logUserAnalysisRequest(url, key, userId, analysisId, {
                      lang,
                      model,
                    });
                  }

                  return saved[0];
                } else {
                  console.error(
                    `[Supabase] Failed to save after superseding: ${retryResponse.status}`,
                  );
                  return null;
                }
              } else {
                console.error(
                  `[Supabase] Failed to mark analysis as superseded: ${supersededResponse.status}`,
                );
              }
            }

            // Return existing analysis if it's complete
            return {
              id: existingAnalysis.id,
              song_id: existingAnalysis.song_id,
            };
          }
        }
      }

      console.error("[Supabase] Save failed:", response.status);
      return null;
    } else {
      const saved = await response.json();
      const analysisId = saved[0]?.id;
      console.log(
        `[Supabase] ✓ Analysis saved (ID: ${analysisId}, Song ID: ${songId}, Lang: ${lang})`,
      );

      // Step 5: Log user request in user_analysis_requests (RLS audit trail)
      // Only log if user is authenticated (userId is not null)
      if (userId && analysisId) {
        await logUserAnalysisRequest(url, key, userId, analysisId, {
          lang,
          model,
        });
      }

      return saved[0]; // Return the saved record with ID
    }
  } catch (error) {
    console.error("[Supabase] Error saving analysis:", error.message);
    return null;
  }
}

// Log user analysis request (for RLS audit trail)
// Exported for use in analyze.js (cache hits)
export async function logUserAnalysisRequest(
  supabaseUrl,
  supabaseKey,
  userId,
  analysisId,
  metadata = {},
) {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/log_analysis_request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          p_user_id: userId,
          p_analysis_id: analysisId,
          p_metadata: metadata,
        }),
      },
    );

    if (!response.ok) {
      console.warn(`[RLS] Failed to log user request: ${response.status}`);
    }
  } catch (error) {
    console.warn("[RLS] Error:", error.message);
  }
}
