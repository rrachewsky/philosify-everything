// ============================================================
// CREDITS - RELEASE RESERVATION
// ============================================================
// Releases reservation and returns credit to user.
// Does NOT write to credit_history (internal audit only).

import { callRpc } from "../utils/supabase.js";

// Valid reasons: 'failed', 'cached', 'timeout' (ENUM: reservation_reason)
// analysisId is optional - used for cached results to track which analysis was served
export async function releaseReservation(
  env,
  reservationId,
  reason = "failed",
  analysisId = null,
) {
  console.log(
    `[Credits] Releasing reservation: ${reservationId} (reason: ${reason})`,
  );

  try {
    const result = await callRpc(env, "release_reservation", {
      p_reservation_id: reservationId,
      p_reason: reason,
      p_analysis_id: analysisId,
    });

    if (!result || !result.success) {
      const errorMsg = result?.message || "Unknown error";
      console.error(`[Credits] Release failed: ${errorMsg}`);
      return { success: false, newTotal: 0, credits: 0, freeRemaining: 0 };
    }

    console.log(
      `[Credits] Reservation ${reservationId} released. Balance: ${result.new_total}`,
    );
    return {
      success: true,
      newTotal: result.new_total,
      credits: result.credits,
      freeRemaining: result.free_remaining,
    };
  } catch (error) {
    // SECURITY: Log detailed error server-side, return generic message to client
    console.error(`[Credits] Release error:`, error.message);
    throw new Error(`Credit release failed. Please contact support if credits are missing.`);
  }
}

// Cleanup stale reservations for a specific user (called on timeout detection)
export async function cleanupUserStaleReservations(
  env,
  userId,
  maxAgeMinutes = 2,
) {
  console.log(
    `[Credits] Cleaning up stale reservations for user ${userId} (older than ${maxAgeMinutes} min)`,
  );

  try {
    const result = await callRpc(env, "cleanup_user_stale_reservations", {
      p_user_id: userId,
      p_max_age_minutes: maxAgeMinutes,
    });

    if (result?.released_count > 0) {
      console.log(
        `[Credits] Released ${result.released_count} stale reservations for user ${userId}. New total: ${result.new_total}`,
      );
    }

    return {
      releasedCount: result?.released_count || 0,
      newTotal: result?.new_total || 0,
    };
  } catch (error) {
    console.error(`[Credits] User cleanup failed: ${error.message}`);
    return { releasedCount: 0, newTotal: 0 };
  }
}

// Cleanup stale reservations (for timeouts) - all users
export async function cleanupStaleReservations(env, maxAgeMinutes = 2) {
  console.log(
    `[Credits] Cleaning up stale reservations older than ${maxAgeMinutes} minutes`,
  );

  // The deployed cleanup_stale_reservations() function has been referenced with two
  // different parameter names (docs + migration 009: p_age_minutes; older code:
  // p_max_age_minutes). Try the canonical name (p_age_minutes) first, and fall back to
  // the alternate only if PostgREST reports an unknown-function/signature error, so the
  // reaper works against either signature without a wasted failing call on the hot path.
  const paramNames = ["p_age_minutes", "p_max_age_minutes"];
  let lastError = null;

  for (const paramName of paramNames) {
    try {
      const result = await callRpc(env, "cleanup_stale_reservations", {
        [paramName]: maxAgeMinutes,
      });

      if (result?.released_count > 0) {
        console.log(
          `[Credits] Cleaned up ${result.released_count} stale reservations`,
        );
      }

      return {
        releasedCount: result?.released_count || 0,
        releasedIds: result?.released_ids || [],
      };
    } catch (error) {
      lastError = error;
      const msg = error?.message || "";
      const isSignatureError =
        msg.includes("Could not find the function") ||
        msg.includes("PGRST202") ||
        msg.includes(" 404 ");
      if (!isSignatureError) break; // real failure — don't keep retrying
      console.warn(
        `[Credits] cleanup_stale_reservations(${paramName}) not found, trying alternate signature`,
      );
    }
  }

  console.error(`[Credits] Cleanup failed: ${lastError?.message}`);
  return { releasedCount: 0, releasedIds: [] };
}
