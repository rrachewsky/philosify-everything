// ============================================================
// CREDITS - CONFIRM RESERVATION
// ============================================================
// Confirms a reservation. The RPC (confirm_reservation v2, 07 Oct 2026) writes
// the credit_history row itself, including the origin of the charge:
//   metadata.source      — one of CREDIT_SOURCES (closed vocabulary, lives here)
//   metadata.description — free text for the statement (title, thread, session…)
//   metadata.batch_id    — same uuid for the N confirms of one multi-credit action
//   analysis_id          — only when analysisId is a uuid that exists in `analyses`
//   metadata.analysis_id — the raw analysisId as given (book/film/news ids live here)
// No client-side PATCH anymore: the origin can no longer be lost.

import { callRpc } from "../utils/supabase.js";

export const CREDIT_SOURCES = Object.freeze({
  MUSIC: "music",
  BOOK: "book",
  CINEMA: "cinema",
  NEWS: "news",
  NEWS_SOURCES: "news_sources",
  PANEL: "panel",
  COLLOQUIUM_ACCESS: "colloquium_access",
  COLLOQUIUM_PARTICIPATE: "colloquium_participate",
  COLLOQUIUM_PHILOSOPHER: "colloquium_philosopher",
  COLLOQUIUM_PROPOSE: "colloquium_propose",
  OPEN_DEBATE: "open_debate",
  QUIZ: "quiz",
  SPACE: "space",
  UNSAFE_ZONE: "unsafe_zone",
});

/**
 * @param {string}      reservationId
 * @param {string|null} analysisId   uuid of the analysis when there is one; any descriptive id otherwise
 * @param {string|null} userId       kept for logging only
 * @param {object}      origin       { source, description, batchId } — source from CREDIT_SOURCES
 */
export async function confirmReservation(
  env,
  reservationId,
  analysisId,
  userId = null,
  { source = null, description = null, batchId = null } = {},
) {
  if (!source) {
    console.warn(`[Credits] confirmReservation without source: ${reservationId}`);
  }
  console.log(
    `[Credits] Confirming reservation: ${reservationId} -> ${source ?? "?"} / ${analysisId ?? "-"} (user ${userId ?? "-"})`,
  );

  try {
    const result = await callRpc(env, "confirm_reservation", {
      p_reservation_id: reservationId,
      p_analysis_id: analysisId ?? null,
      p_source: source,
      p_description: description,
      p_batch_id: batchId,
    });

    if (!result || !result.success) {
      const errorMsg = result?.message || "Unknown error";
      console.error(`[Credits] Confirmation failed: ${errorMsg}`);
      return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
    }

    // The RPC returns (total, purchased, free) — see db/functions/confirm_reservation.sql.
    const newTotal = result.total ?? result.new_total;
    console.log(
      `[Credits] Reservation ${reservationId} confirmed. Balance: ${newTotal}`,
    );
    return {
      success: true,
      newTotal,
      credits: result.purchased ?? result.credits,
      freeRemaining: result.free ?? result.free_remaining,
    };
  } catch (error) {
    // v2 has no outer catch: a real SQL error arrives here with the full SQLERRM.
    console.error(`[Credits] Failed to confirm reservation: ${error.message}`);
    return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
  }
}
