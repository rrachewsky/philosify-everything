// ============================================================
// HANDLER - SPACE ACCESS (Premium space unlocking)
// ============================================================
// GET  /api/spaces/:space/status - Check if user has access
// POST /api/spaces/:space/unlock - Unlock space (costs vary by space)

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import {
  reserveCredit,
  confirmReservation,
  releaseReservation,
} from "../credits/index.js";

const VALID_SPACES = ["underground", "forum"];
const SPACE_COSTS = {
  underground: 3,
  forum: 0, // Forum posts cost credits, not access
};

// ============================================================
// GET /api/spaces/:space/status - Check access status
// ============================================================
export async function handleGetSpaceStatus(request, env, origin, space) {
  if (!VALID_SPACES.includes(space)) {
    return jsonResponse({ error: "Invalid space" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    const { data: access } = await supabase
      .from("space_access")
      .select("id, unlocked_at")
      .eq("user_id", userId)
      .eq("space", space)
      .maybeSingle();

    let response = jsonResponse(
      {
        space,
        hasAccess: !!access,
        unlockedAt: access?.unlocked_at || null,
        cost: SPACE_COSTS[space] || 0,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Spaces] Status exception:", err.message);
    return jsonResponse({ error: "Failed to check access" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/spaces/:space/unlock - Unlock space (costs credits)
// ============================================================
export async function handleUnlockSpace(request, env, origin, space) {
  if (!VALID_SPACES.includes(space)) {
    return jsonResponse({ error: "Invalid space" }, 400, origin, env);
  }

  const cost = SPACE_COSTS[space] || 0;

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Check if already unlocked
    const { data: existing } = await supabase
      .from("space_access")
      .select("id")
      .eq("user_id", userId)
      .eq("space", space)
      .maybeSingle();

    if (existing) {
      let response = jsonResponse(
        { success: true, alreadyUnlocked: true },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // Reserve ALL credits atomically before attempting insert
    const reservations = [];
    if (cost > 0) {
      for (let i = 0; i < cost; i++) {
        const reservation = await reserveCredit(env, userId);
        if (!reservation || !reservation.reservationId) {
          // Release any already reserved credits
          for (const r of reservations) {
            try {
              await releaseReservation(env, r.reservationId);
            } catch (e) {
              console.error(
                `[Spaces] Failed to release reservation ${r.reservationId}:`,
                e.message,
              );
            }
          }
          return jsonResponse(
            {
              error: `Not enough credits to unlock this space (requires ${cost})`,
              code: "INSUFFICIENT_CREDITS",
              needed: cost,
            },
            402,
            origin,
            env,
          );
        }
        reservations.push(reservation);
      }
    }

    try {
      // SECURITY: Use upsert with ignoreDuplicates to prevent TOCTOU race condition.
      // If two concurrent requests pass the "already unlocked?" check above,
      // only one insert will succeed; the other becomes a no-op.
      const { data: insertData, error: insertError } = await supabase
        .from("space_access")
        .upsert(
          { user_id: userId, space },
          { onConflict: "user_id,space", ignoreDuplicates: true },
        )
        .select("id, unlocked_at")
        .maybeSingle();

      if (insertError) {
        // Release all reserved credits
        for (const r of reservations) {
          try {
            await releaseReservation(env, r.reservationId);
          } catch (e) {
            console.error(
              `[Spaces] Failed to release reservation ${r.reservationId}:`,
              e.message,
            );
          }
        }
        console.error("[Spaces] Unlock failed:", insertError.message);
        return jsonResponse(
          { error: "Failed to unlock space" },
          500,
          origin,
          env,
        );
      }

      // If upsert returned no data, the row already existed (race condition caught)
      if (!insertData) {
        // Release all reserved credits -- another request won the race
        for (const r of reservations) {
          try {
            await releaseReservation(env, r.reservationId);
          } catch (e) {
            console.error(
              `[Spaces] Failed to release reservation ${r.reservationId}:`,
              e.message,
            );
          }
        }
        console.log(
          `[Spaces] Race condition caught: ${space} already unlocked for user ${userId}`,
        );
        let response = jsonResponse(
          { success: true, alreadyUnlocked: true },
          200,
          origin,
          env,
        );
        return addRefreshedCookieToResponse(response, setCookieHeader);
      }

      // Confirm all credits
      for (const r of reservations) {
        await confirmReservation(env, r.reservationId, `space:${space}`);
      }

      console.log(
        `[Spaces] User ${userId} unlocked ${space} (${cost} credits)`,
      );

      let response = jsonResponse(
        { success: true, alreadyUnlocked: false },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
      // Release all reserved credits on error
      for (const r of reservations) {
        try {
          await releaseReservation(env, r.reservationId);
        } catch (e) {
          console.error(
            `[Spaces] Failed to release reservation ${r.reservationId}:`,
            e.message,
          );
        }
      }
      throw err;
    }
  } catch (err) {
    console.error("[Spaces] Unlock exception:", err.message);
    return jsonResponse({ error: "Failed to unlock space" }, 500, origin, env);
  }
}
