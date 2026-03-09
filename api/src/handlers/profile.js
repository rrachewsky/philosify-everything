// ============================================================
// HANDLER - USER PROFILE
// ============================================================
// GET  /api/profile - Fetch current user's profile
// PATCH /api/profile - Update profile fields (display_name, phone)

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";

// Allowed country codes (comprehensive list of ITU-T E.164 codes)
const COUNTRY_CODE_REGEX = /^\+\d{1,4}$/;
const AREA_CODE_REGEX = /^\d{1,5}$/;
const PHONE_NUMBER_REGEX = /^\d{4,15}$/;
const DISPLAY_NAME_MAX = 50;

/**
 * GET /api/profile - Fetch the authenticated user's profile
 */
export async function handleGetProfile(request, env, origin) {
  console.log("[Profile] GET request received");
  console.log(
    "[Profile] Cookie header:",
    request.headers.get("Cookie")?.substring(0, 50) + "...",
  );

  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    console.log("[Profile] Auth failed - no valid session");
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  console.log("[Profile] Auth success, userId:", auth.userId);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "user_id, email, display_name, preferred_language, phone_country_code, phone_area_code, phone_number, created_at, updated_at",
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116 = no rows found (profile trigger may have failed)
      if (error.code === "PGRST116") {
        console.error(`[Profile] No profile found for user ${userId}`);
        return jsonResponse({ error: "Profile not found" }, 404, origin, env);
      }
      console.error("[Profile] Fetch failed:", error.message);
      return jsonResponse(
        { error: "Failed to load profile" },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse({ profile }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Profile] GET exception:", err.message);
    return jsonResponse({ error: "Failed to load profile" }, 500, origin, env);
  }
}

/**
 * PATCH /api/profile - Update profile fields
 * Body: { displayName?, phoneCountryCode?, phoneAreaCode?, phoneNumber? }
 */
export async function handleUpdateProfile(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    const body = await request.json();
    const updates = {};

    // Display name
    if ("displayName" in body) {
      const name = (body.displayName || "").trim();
      if (name && name.length > DISPLAY_NAME_MAX) {
        return jsonResponse(
          { error: `Display name too long (max ${DISPLAY_NAME_MAX} chars)` },
          400,
          origin,
          env,
        );
      }
      updates.display_name = name || null;
    }

    // Phone country code
    if ("phoneCountryCode" in body) {
      const code = (body.phoneCountryCode || "").trim();
      if (code && !COUNTRY_CODE_REGEX.test(code)) {
        return jsonResponse(
          { error: "Invalid country code. Use format +N (e.g. +1, +55, +44)" },
          400,
          origin,
          env,
        );
      }
      updates.phone_country_code = code || null;
    }

    // Phone area code
    if ("phoneAreaCode" in body) {
      const area = (body.phoneAreaCode || "").trim();
      if (area && !AREA_CODE_REGEX.test(area)) {
        return jsonResponse(
          { error: "Invalid area code. Use 1-5 digits only." },
          400,
          origin,
          env,
        );
      }
      updates.phone_area_code = area || null;
    }

    // Phone number
    if ("phoneNumber" in body) {
      const phone = (body.phoneNumber || "").trim();
      if (phone && !PHONE_NUMBER_REGEX.test(phone)) {
        return jsonResponse(
          {
            error:
              "Invalid phone number. Use 4-15 digits only (no spaces or dashes).",
          },
          400,
          origin,
          env,
        );
      }
      updates.phone_number = phone || null;
    }

    // If phone number is provided, country code is required
    if (updates.phone_number && !updates.phone_country_code) {
      // Check if country code is already in the profile
      const { data: existing } = await supabase
        .from("profiles")
        .select("phone_country_code")
        .eq("user_id", userId)
        .single();

      if (!existing?.phone_country_code && !("phoneCountryCode" in body)) {
        return jsonResponse(
          { error: "Country code is required when setting a phone number" },
          400,
          origin,
          env,
        );
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "No fields to update" }, 400, origin, env);
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId)
      .select(
        "user_id, email, display_name, preferred_language, phone_country_code, phone_area_code, phone_number, created_at, updated_at",
      )
      .single();

    if (error) {
      console.error("[Profile] Update failed:", error.message);
      return jsonResponse(
        { error: "Failed to update profile. Please try again." },
        500,
        origin,
        env,
      );
    }

    console.log(
      `[Profile] Updated for user ${userId}:`,
      Object.keys(updates).join(", "),
    );

    let response = jsonResponse({ success: true, profile }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Profile] PATCH exception:", err.message);
    return jsonResponse(
      { error: "Failed to update profile" },
      500,
      origin,
      env,
    );
  }
}
