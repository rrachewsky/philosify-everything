// ============================================================
// PUSH NOTIFICATION HANDLERS
// ============================================================
// Endpoints:
//   GET  /api/push/vapid-key      - Return VAPID public key
//   POST /api/push/subscribe      - Save push subscription
//   POST /api/push/unsubscribe    - Remove push subscription
//   GET  /api/push/preferences    - Get notification preferences
//   PATCH /api/push/preferences   - Update notification preferences

import { getUserFromAuth } from "../auth/index.js";
import { jsonResponse } from "../utils/response.js";
import { getSecret } from "../utils/secrets.js";
import { safeEq } from "../payments/crypto.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { sendPushNotification } from "../push/sender.js";

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key for the client to use with pushManager.subscribe()
 * Public endpoint (no auth required) - the public key is not secret
 */
export async function handleGetVapidKey(request, env, origin) {
  const publicKey = env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    console.error("[Push] VAPID_PUBLIC_KEY not configured");
    return jsonResponse({ error: "Push not configured" }, 500, origin, env);
  }

  return jsonResponse({ publicKey }, 200, origin, env);
}

/**
 * POST /api/push/subscribe
 * Saves a push subscription for the authenticated user.
 * Body: { endpoint, keys: { p256dh, auth }, userAgent? }
 */
export async function handleSubscribe(request, env, origin) {
  const user = await getUserFromAuth(request, env);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, origin, env);
  }

  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return jsonResponse(
      { error: "Missing required fields: endpoint, keys.p256dh, keys.auth" },
      400,
      origin,
      env,
    );
  }

  // Validate endpoint is a valid URL
  try {
    new URL(endpoint);
  } catch {
    return jsonResponse({ error: "Invalid endpoint URL" }, 400, origin, env);
  }

  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse(
      { error: "Server configuration error" },
      500,
      origin,
      env,
    );
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  };

  // Upsert subscription (merge on unique(user_id, endpoint))
  const subscriptionData = {
    user_id: user.userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: body.userAgent || request.headers.get("user-agent") || null,
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
    method: "POST",
    headers,
    body: JSON.stringify(subscriptionData),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`[Push] Subscribe failed: ${res.status} - ${error}`);
    return jsonResponse(
      { error: "Failed to save subscription" },
      500,
      origin,
      env,
    );
  }

  console.log(`[Push] Subscription saved for user ${user.userId}`);
  return jsonResponse({ success: true }, 200, origin, env);
}

/**
 * POST /api/push/unsubscribe
 * Removes a push subscription for the authenticated user.
 * Body: { endpoint }
 */
export async function handleUnsubscribe(request, env, origin) {
  const user = await getUserFromAuth(request, env);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, origin, env);
  }

  const { endpoint } = body;

  if (!endpoint) {
    return jsonResponse(
      { error: "Missing required field: endpoint" },
      400,
      origin,
      env,
    );
  }

  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse(
      { error: "Server configuration error" },
      500,
      origin,
      env,
    );
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // Delete subscription matching user_id + endpoint
  const encodedEndpoint = encodeURIComponent(endpoint);
  const res = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${user.userId}&endpoint=eq.${encodedEndpoint}`,
    {
      method: "DELETE",
      headers,
    },
  );

  if (!res.ok) {
    const error = await res.text();
    console.error(`[Push] Unsubscribe failed: ${res.status} - ${error}`);
    return jsonResponse(
      { error: "Failed to remove subscription" },
      500,
      origin,
      env,
    );
  }

  console.log(`[Push] Subscription removed for user ${user.userId}`);
  return jsonResponse({ success: true }, 200, origin, env);
}

/**
 * GET /api/push/preferences
 * Returns the user's notification preference toggles.
 * Uses getSupabaseForUser (same pattern as profile.js).
 */
export async function handleGetPreferences(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("dm_enabled, replies_enabled, collective_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[Push] Get preferences failed:", error.message);
      return jsonResponse(
        { error: "Failed to load preferences" },
        500,
        origin,
        env,
      );
    }

    // Return defaults if no preferences exist yet
    const preferences = data || {
      dm_enabled: true,
      replies_enabled: true,
      collective_enabled: true,
    };

    const response = jsonResponse({ preferences }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Push] Get preferences exception:", err.message);
    return jsonResponse(
      { error: "Failed to load preferences" },
      500,
      origin,
      env,
    );
  }
}

/**
 * PATCH /api/push/preferences
 * Updates the user's notification preference toggles.
 * Body: { dm_enabled?, replies_enabled?, collective_enabled? }
 * Uses getSupabaseForUser (same pattern as profile.js).
 */
export async function handleUpdatePreferences(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, origin, env);
  }

  // Only allow boolean fields
  const updates = {};
  if (typeof body.dm_enabled === "boolean")
    updates.dm_enabled = body.dm_enabled;
  if (typeof body.replies_enabled === "boolean")
    updates.replies_enabled = body.replies_enabled;
  if (typeof body.collective_enabled === "boolean")
    updates.collective_enabled = body.collective_enabled;

  if (Object.keys(updates).length === 0) {
    return jsonResponse(
      { error: "No valid preferences to update" },
      400,
      origin,
      env,
    );
  }

  try {
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: userId, ...updates, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );

    if (error) {
      console.error("[Push] Update preferences failed:", error.message);
      return jsonResponse(
        { error: "Failed to update preferences" },
        500,
        origin,
        env,
      );
    }

    console.log(`[Push] Preferences updated for user ${userId}:`, updates);
    const response = jsonResponse(
      { success: true, preferences: updates },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Push] Update preferences exception:", err.message);
    return jsonResponse(
      { error: "Failed to update preferences" },
      500,
      origin,
      env,
    );
  }
}

/**
 * POST /api/push/test
 * Diagnostic endpoint — sends a test push notification to the authenticated user.
 * Returns the full result so we can see exactly what fails.
 * TEMPORARY — remove after debugging.
 */
export async function handleTestPush(request, env, origin) {
  const user = await getUserFromAuth(request, env);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  return _runPushDiagnostic(env, origin, user.userId);
}

/**
 * GET /api/push/diagnose/:userId
 * Admin-only diagnostic endpoint — callable from curl with X-Admin-Secret header.
 * Returns full push pipeline diagnostics for any user.
 */
export async function handlePushDiagnose(request, env, origin, targetUserId) {
  const adminSecret = request.headers.get("X-Admin-Secret");
  const expectedSecret = await getSecret(env.ADMIN_SECRET);

  if (!adminSecret || !expectedSecret || !safeEq(adminSecret, expectedSecret)) {
    return jsonResponse({ error: "Forbidden" }, 403, origin, env);
  }

  if (!targetUserId || !/^[0-9a-f-]{36}$/i.test(targetUserId)) {
    return jsonResponse({ error: "Invalid user ID" }, 400, origin, env);
  }

  return _runPushDiagnostic(env, origin, targetUserId, {
    sendTest: request.method === "POST",
  });
}

/**
 * Shared diagnostic logic for both /test and /diagnose endpoints
 */
async function _runPushDiagnostic(env, origin, userId, options = {}) {
  const { sendTest = true } = options;
  const diagnostics = { userId, steps: [] };

  try {
    // Step 1: Check if secrets resolve
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
    diagnostics.steps.push({
      step: "secrets",
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
    });

    if (!supabaseUrl || !supabaseKey) {
      diagnostics.error = "SUPABASE_URL or SUPABASE_SERVICE_KEY not resolved";
      return jsonResponse({ diagnostics }, 200, origin, env);
    }

    // Step 2: Check subscriptions exist (with full details)
    const subRes = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=id,endpoint,p256dh,auth,updated_at`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    const subs = subRes.ok ? await subRes.json() : [];
    diagnostics.steps.push({
      step: "subscriptions",
      count: subs.length,
      subscriptions: subs.map((s) => ({
        id: s.id,
        endpoint: s.endpoint.substring(0, 80) + "...",
        p256dhLength: s.p256dh ? s.p256dh.length : 0,
        authLength: s.auth ? s.auth.length : 0,
        updatedAt: s.updated_at,
      })),
    });

    if (subs.length === 0) {
      diagnostics.error = "No push subscriptions found for this user";
      return jsonResponse({ diagnostics }, 200, origin, env);
    }

    // Step 3: Check VAPID keys
    const vapidPrivate = await getSecret(env.VAPID_PRIVATE_KEY);
    const vapidPublic = env.VAPID_PUBLIC_KEY;
    diagnostics.steps.push({
      step: "vapid",
      privateKeyLength: vapidPrivate ? vapidPrivate.length : 0,
      publicKeyLength: vapidPublic ? vapidPublic.length : 0,
      privateKeyPrefix: vapidPrivate
        ? vapidPrivate.substring(0, 6) + "..."
        : null,
      publicKeyPrefix: vapidPublic
        ? vapidPublic.substring(0, 12) + "..."
        : null,
    });

    // Step 4: Check notification preferences
    const prefRes = await fetch(
      `${supabaseUrl}/rest/v1/notification_preferences?user_id=eq.${userId}&select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    const prefs = prefRes.ok ? await prefRes.json() : [];
    diagnostics.steps.push({
      step: "preferences",
      found: prefs.length > 0,
      preferences: prefs[0] || {
        dm_enabled: true,
        replies_enabled: true,
        collective_enabled: true,
        note: "defaults (no row)",
      },
    });

    // Step 5: Send test notification (if requested)
    if (sendTest) {
      const result = await sendPushNotification(
        env,
        userId,
        {
          title: "Philosify Test",
          body: "If you see this, push notifications are working!",
          url: "/community",
          tag: "push-test",
          type: "dm",
          senderName: "Philosify",
        },
        { skipPreferenceCheck: true },
      );

      diagnostics.steps.push({ step: "send", result });
      diagnostics.success = result.sent > 0;
    } else {
      diagnostics.steps.push({
        step: "send",
        skipped: true,
        note: "Use POST to send a test push",
      });
    }

    return jsonResponse({ diagnostics }, 200, origin, env);
  } catch (err) {
    diagnostics.error = err.message;
    // SECURITY: Do not expose stack traces to client
    console.error("[Push] Diagnostics error stack:", err.stack);
    return jsonResponse({ diagnostics }, 200, origin, env);
  }
}

/**
 * POST /api/push/pending
 * Fetches pending notifications for a subscription.
 * Called by the service worker after receiving an empty push.
 * Body: { endpoint } - the push subscription endpoint URL (secret, proves device identity)
 * Returns: { notifications: [{ id, title, body, url, tag, type }] }
 *
 * No auth cookie required: the endpoint is a secret known only to the device that
 * subscribed. This makes push work reliably when the SW runs in background (e.g.
 * cross-origin fetch may not send cookies, or user closed the tab).
 */
export async function handleGetPending(request, env, origin) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, origin, env);
  }

  const { endpoint } = body;

  if (!endpoint || typeof endpoint !== "string") {
    return jsonResponse({ error: "Missing endpoint" }, 400, origin, env);
  }

  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse(
      { error: "Server configuration error" },
      500,
      origin,
      env,
    );
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  // Find subscription by endpoint (endpoint is the secret - no auth cookie needed)
  const encodedEndpoint = encodeURIComponent(endpoint);
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodedEndpoint}&select=id`,
    { headers },
  );

  if (!subRes.ok) {
    console.error("[Push] Failed to find subscription:", await subRes.text());
    return jsonResponse({ error: "Subscription not found" }, 404, origin, env);
  }

  const subs = await subRes.json();
  if (subs.length === 0) {
    return jsonResponse({ notifications: [] }, 200, origin, env);
  }
  // Subscription found - endpoint proves device identity

  const subscriptionId = subs[0].id;

  // Get pending notifications (not yet delivered, max 48h old to avoid stale ghost notifications)
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const queueRes = await fetch(
    `${supabaseUrl}/rest/v1/push_notification_queue?subscription_id=eq.${subscriptionId}&delivered_at=is.null&created_at=gte.${cutoff}&select=id,title,body,url,tag,type,sender_name&order=created_at.asc`,
    { headers },
  );

  if (!queueRes.ok) {
    console.error("[Push] Failed to fetch queue:", await queueRes.text());
    return jsonResponse(
      { error: "Failed to fetch notifications" },
      500,
      origin,
      env,
    );
  }

  const notifications = await queueRes.json();

  console.log(
    `[Push] Returning ${notifications.length} pending notification(s) for endpoint`,
  );
  return jsonResponse({ notifications }, 200, origin, env);
}

/**
 * POST /api/push/ack
 * Marks notifications as delivered (so they won't be shown again).
 * Called by the service worker after showing notifications.
 * Body: { ids: [uuid, ...], endpoint: string }
 *
 * No auth cookie required: endpoint proves device identity (same as /pending).
 */
export async function handleAckNotifications(request, env, origin) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, origin, env);
  }

  const { ids, endpoint } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return jsonResponse(
      { error: "Missing or invalid ids array" },
      400,
      origin,
      env,
    );
  }

  if (!endpoint || typeof endpoint !== "string") {
    return jsonResponse({ error: "Missing endpoint" }, 400, origin, env);
  }

  // Validate all IDs are proper UUIDs to prevent PostgREST filter injection
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!ids.every((id) => typeof id === "string" && UUID_RE.test(id))) {
    return jsonResponse(
      { error: "Invalid notification ID format" },
      400,
      origin,
      env,
    );
  }

  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    return jsonResponse(
      { error: "Server configuration error" },
      500,
      origin,
      env,
    );
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  // Find subscription by endpoint (endpoint is the secret)
  const encodedEndpoint = encodeURIComponent(endpoint);
  const subRes = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodedEndpoint}&select=id`,
    { headers },
  );
  const subs = subRes.ok ? await subRes.json() : [];
  if (subs.length === 0) {
    return jsonResponse({ error: "Subscription not found" }, 404, origin, env);
  }
  const subIds = subs.map((s) => `"${s.id}"`).join(",");

  // Mark notifications as delivered - scoped to user's subscriptions only
  const now = new Date().toISOString();
  const idsFilter = ids.map((id) => `"${id}"`).join(",");

  const updateRes = await fetch(
    `${supabaseUrl}/rest/v1/push_notification_queue?id=in.(${idsFilter})&subscription_id=in.(${subIds})`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ delivered_at: now }),
    },
  );

  if (!updateRes.ok) {
    console.error(
      "[Push] Failed to ack notifications:",
      await updateRes.text(),
    );
    return jsonResponse({ error: "Failed to acknowledge" }, 500, origin, env);
  }

  console.log(`[Push] Acknowledged ${ids.length} notification(s)`);
  return jsonResponse(
    { success: true, acknowledged: ids.length },
    200,
    origin,
    env,
  );
}
