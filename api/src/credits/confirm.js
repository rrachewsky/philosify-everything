// ============================================================
// CREDITS - CONFIRM RESERVATION
// ============================================================
// Confirms reservation, writes to credit_history, and grants analysis access.
// For non-analysis usage (colloquium, spaces), pass any descriptive string
// as analysisId — it will be converted to NULL for the RPC (DB column is UUID type).

import { callRpc } from "../utils/supabase.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function confirmReservation(env, reservationId, analysisId) {
  // If analysisId is not a valid UUID, pass null to avoid PostgreSQL 22P02 error
  // (the analysis_id column in credit_reservations is typed as UUID)
  const safeAnalysisId =
    analysisId && UUID_RE.test(analysisId) ? analysisId : null;

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
    // Return fallback instead of throwing — matches 98baaf4 behavior where
    // handlers did NOT check success and confirmation failure was non-fatal
    return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
  }
}
