// ============================================================
// CREDITS - CONFIRM RESERVATION
// ============================================================
// Confirms reservation, writes to credit_history, and grants analysis access.
// For non-analysis usage (colloquium, spaces), pass any descriptive string
// as analysisId — it will be converted to NULL for the RPC (DB column is UUID type).

import { callRpc } from "../utils/supabase.js";
import { getSupabaseCredentials } from "../utils/supabase.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function confirmReservation(env, reservationId, analysisId, userId) {
  // If analysisId is not a valid UUID, pass null to avoid PostgreSQL 22P02 error
  // (the analysis_id column in credit_reservations is typed as UUID)
  const safeAnalysisId =
    analysisId && UUID_RE.test(analysisId) ? analysisId : null;

  // For non-UUID analysisId strings (panels, colloquiums), extract a description
  // Format: "philosopher-panel:news:headline..." or "colloquium:access:threadId"
  const description = !safeAnalysisId && analysisId ? analysisId : null;

  console.log(
    `[Credits] Confirming reservation: ${reservationId} -> analysis: ${analysisId} (safe: ${safeAnalysisId})`,
  );

  try {
    const result = await callRpc(env, "confirm_reservation", {
      p_reservation_id: reservationId,
      p_analysis_id: safeAnalysisId,
    });

    if (!result || !result.success) {
      const errorMsg = result?.message || "Unknown error";
      console.error(`[Credits] Confirmation failed: ${errorMsg}`);
      return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
    }

    // Patch the credit_history entry created by this confirmation:
    // - analysis_id for real analyses (the RPC's INSERT never wrote it — D3),
    //   so the statement row links to the analysis going forward;
    // - metadata.description for non-UUID ids (panels, colloquiums).
    // Best-effort and non-blocking, like the rest of this path.
    const patch = {};
    if (safeAnalysisId) patch.analysis_id = safeAnalysisId;
    if (description) patch.metadata = { description };
    if (Object.keys(patch).length > 0) {
      try {
        const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
        // SECURITY: Always scope to user_id to prevent cross-user data modification
        const userFilter = userId ? `&user_id=eq.${userId}` : '';
        const filter = result.history_id
          ? `id=eq.${result.history_id}${userFilter}`
          : userId
            ? `user_id=eq.${userId}&type=eq.consume&order=created_at.desc&limit=1`
            : null;
        if (!filter) {
          console.warn('[Credits] No history_id and no userId — skipping credit_history patch');
        } else {
          const patchRes = await fetch(`${sbUrl}/rest/v1/credit_history?${filter}`, {
            method: "PATCH",
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify(patch),
          });
          if (patchRes.ok) {
            console.log(
              `[Credits] credit_history patched (${Object.keys(patch).join(", ")}) for reservation ${reservationId}`,
            );
          } else {
            const patchBody = await patchRes.text().catch(() => "");
            console.warn(
              `[Credits] credit_history patch FAILED: ${patchRes.status} ${patchBody.slice(0, 200)}`,
            );
          }
        }
      } catch (e) {
        console.warn(`[Credits] Failed to patch credit_history: ${e.message}`);
      }
    }

    console.log(
      `[Credits] Reservation ${reservationId} confirmed. Balance: ${result.new_total}`,
    );
    return {
      success: true,
      newTotal: result.new_total,
      credits: result.credits,
      freeRemaining: result.free_remaining,
    };
  } catch (error) {
    console.error(`[Credits] Failed to confirm reservation: ${error.message}`);
    return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
  }
}
