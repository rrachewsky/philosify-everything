// ============================================================
// HANDLER - CONTACTS (Phone matching for "Find Friends")
// ============================================================
// POST /api/contacts/match - Match imported phone numbers against profiles
//   Accepts E.164 phone numbers, matches against profiles.phone_* columns
//   Returns only user IDs and display names (never exposes phone numbers)
//
// Privacy: all matching is server-side; phone numbers are never returned.

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { getBlockedUserIds } from "./block.js";
import { getSecret } from "../utils/secrets.js";
import { checkRateLimit } from "../rate-limit/index.js";

// Strip all non-digit characters except leading +
function normalizeE164(phone) {
  if (!phone || typeof phone !== "string") return null;
  const trimmed = phone.trim();
  // Keep leading + then only digits
  const match = trimmed.match(/^\+?(\d+)$/);
  if (!match) return null;
  const digits = match[1];
  // E.164: 7-15 digits
  if (digits.length < 7 || digits.length > 15) return null;
  return "+" + digits;
}

// ============================================================
// POST /api/contacts/match
// ============================================================
export async function handleMatchContacts(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  // Rate limit: 5 requests per 60 seconds
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `contacts:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429,
      origin,
      env,
    );
  }

  try {
    const body = await request.json();
    const { phoneNumbers } = body;

    if (
      !Array.isArray(phoneNumbers) ||
      phoneNumbers.length === 0 ||
      phoneNumbers.length > 500
    ) {
      return jsonResponse(
        { error: "phoneNumbers must be an array of 1-500 E.164 numbers" },
        400,
        origin,
        env,
      );
    }

    // Normalize and deduplicate input phone numbers
    const normalizedSet = new Set();
    for (const num of phoneNumbers) {
      const n = normalizeE164(num);
      if (n) normalizedSet.add(n);
    }
    const normalized = [...normalizedSet];

    if (normalized.length === 0) {
      return jsonResponse({ matches: [], invited: 0 }, 200, origin, env);
    }

    // Query profiles with phone numbers set
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Fetch all profiles that have phone numbers
    const profilesRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?phone_number=not.is.null&select=user_id,display_name,phone_country_code,phone_area_code,phone_number`,
      { headers },
    );

    if (!profilesRes.ok) {
      console.error("[Contacts] Failed to fetch profiles");
      return jsonResponse(
        { error: "Failed to match contacts" },
        500,
        origin,
        env,
      );
    }

    const profiles = await profilesRes.json();

    // Fetch user languages from auth.users metadata (for auto-greeting)
    let userLanguages = {};
    try {
      const usersRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?per_page=1000`,
        { headers },
      );
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.users || usersData || [];
        for (const u of users) {
          if (u.id && u.raw_user_meta_data?.language) {
            userLanguages[u.id] = u.raw_user_meta_data.language;
          }
        }
      }
    } catch (err) {
      console.warn("[Contacts] Could not fetch user languages:", err.message);
    }

    // Get blocked user IDs
    const blockedIds = await getBlockedUserIds(env, userId);

    // Build E.164 for each profile and match against input
    const matches = [];
    for (const p of profiles) {
      // Skip self
      if (p.user_id === userId) continue;
      // Skip blocked
      if (blockedIds.has(p.user_id)) continue;
      // Skip incomplete phone
      if (!p.phone_country_code || !p.phone_number) continue;

      // Reconstruct E.164: country_code + area_code + number
      const e164 =
        p.phone_country_code + (p.phone_area_code || "") + p.phone_number;

      if (normalized.includes(e164)) {
        matches.push({
          id: p.user_id,
          displayName: p.display_name || null,
          language: userLanguages[p.user_id] || null,
          // Never expose phone number in response
        });
      }
    }

    let response = jsonResponse(
      {
        matches,
        totalMatched: matches.length,
        totalSearched: normalized.length,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Contacts] Match error:", err.message);
    return jsonResponse(
      { error: "Failed to match contacts" },
      500,
      origin,
      env,
    );
  }
}
