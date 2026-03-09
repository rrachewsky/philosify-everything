// ============================================================
// PUSH NOTIFICATION SENDER (Empty Push + Fetch Pattern)
// ============================================================
// Sends Web Push wake-up signals to user devices.
// The actual notification content is stored in the database and
// fetched by the service worker after it wakes up.
//
// This pattern is more reliable than encrypted payloads because:
// 1. No encryption complexity (aes128gcm issues in Workers)
// 2. Service worker fetches fresh data on wake
// 3. Works consistently across all browsers/platforms

import { getVapidHeaders } from "./vapid.js";
import { getSecret } from "../utils/secrets.js";

/**
 * Clean up old push notification queue entries.
 * Removes delivered entries older than 24h and undelivered entries older than 48h.
 * Should be called periodically via cron to prevent table bloat.
 *
 * @param {Object} env - Cloudflare Worker env
 * @returns {Promise<{deletedDelivered: number, deletedExpired: number}>}
 */
export async function cleanupPushQueue(env) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Push] Supabase not configured for queue cleanup");
    return { deletedDelivered: 0, deletedExpired: 0 };
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: "return=representation",
  };

  let deletedDelivered = 0;
  let deletedExpired = 0;

  try {
    // 1. Delete delivered notifications older than 24h (already shown, just cleanup)
    const deliveredCutoff = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const deliveredRes = await fetch(
      `${supabaseUrl}/rest/v1/push_notification_queue?delivered_at=not.is.null&delivered_at=lt.${deliveredCutoff}`,
      { method: "DELETE", headers },
    );
    if (deliveredRes.ok) {
      const deleted = await deliveredRes.json().catch(() => []);
      deletedDelivered = Array.isArray(deleted) ? deleted.length : 0;
    }

    // 2. Delete undelivered notifications older than 48h (device was offline too long)
    const expiredCutoff = new Date(
      Date.now() - 48 * 60 * 60 * 1000,
    ).toISOString();
    const expiredRes = await fetch(
      `${supabaseUrl}/rest/v1/push_notification_queue?delivered_at=is.null&created_at=lt.${expiredCutoff}`,
      { method: "DELETE", headers },
    );
    if (expiredRes.ok) {
      const deleted = await expiredRes.json().catch(() => []);
      deletedExpired = Array.isArray(deleted) ? deleted.length : 0;
    }

    if (deletedDelivered > 0 || deletedExpired > 0) {
      console.log(
        `[Push] Queue cleanup: ${deletedDelivered} delivered + ${deletedExpired} expired removed`,
      );
    }
  } catch (err) {
    console.error("[Push] Queue cleanup error:", err.message);
  }

  return { deletedDelivered, deletedExpired };
}

/**
 * Send an empty push to a single subscription (wake-up signal only)
 *
 * @param {Object} env - Cloudflare Worker env
 * @param {string} endpoint - Push subscription endpoint
 * @returns {Promise<{success: boolean, status?: number, gone?: boolean}>}
 */
async function sendEmptyPush(env, endpoint) {
  try {
    // Get VAPID headers
    const vapidHeaders = await getVapidHeaders(env, endpoint);

    // Send empty push (no body) - this is valid per RFC 8030
    // The service worker will wake up and fetch notification content from our API
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidHeaders.authorization,
        TTL: "86400", // 24 hours
        Urgency: "high", // Bypass battery optimization for immediate delivery
        "Content-Length": "0", // Required by FCM/WNS for empty push (411 without it)
      },
      body: null, // Explicit empty body
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true, status: response.status };
    }

    // 404 or 410 = subscription expired/invalid, should be removed
    if (response.status === 404 || response.status === 410) {
      console.log(
        `[Push] Subscription gone (${response.status}): ${endpoint.substring(0, 50)}...`,
      );
      return { success: false, status: response.status, gone: true };
    }

    const errorText = await response.text().catch(() => "");
    console.error(
      `[Push] Failed to send: ${response.status} ${response.statusText} - ${errorText}`,
    );
    return { success: false, status: response.status, errorText };
  } catch (error) {
    console.error(`[Push] Send error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Send a push notification to a user (all their registered devices)
 *
 * Flow:
 * 1. Check notification preferences
 * 2. Get all subscriptions for the user
 * 3. For each subscription:
 *    a. Store notification content in push_notification_queue
 *    b. Send empty push to wake up service worker
 * 4. Service worker fetches content via POST /api/push/pending
 *
 * @param {Object} env - Cloudflare Worker env
 * @param {string} userId - Target user ID
 * @param {Object} payload - { title, body, url, tag, type }
 *   type: 'dm' | 'reply' | 'collective' - used for preference checking
 * @param {Object} [options] - { skipPreferenceCheck: false }
 * @returns {Promise<{sent: number, failed: number, removed: number}>}
 */
export async function sendPushNotification(env, userId, payload, options = {}) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Push] Supabase not configured");
    return { sent: 0, failed: 0, removed: 0 };
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  // 1. Check notification preferences (unless skipped)
  if (!options.skipPreferenceCheck && payload.type) {
    const prefUrl = `${supabaseUrl}/rest/v1/notification_preferences?user_id=eq.${userId}&select=dm_enabled,replies_enabled,collective_enabled`;
    const prefRes = await fetch(prefUrl, { headers });

    if (prefRes.ok) {
      const prefs = await prefRes.json();
      if (prefs.length > 0) {
        const pref = prefs[0];
        if (payload.type === "dm" && !pref.dm_enabled) {
          console.log(`[Push] DM notifications disabled for user ${userId}`);
          return { sent: 0, failed: 0, removed: 0 };
        }
        if (payload.type === "reply" && !pref.replies_enabled) {
          console.log(`[Push] Reply notifications disabled for user ${userId}`);
          return { sent: 0, failed: 0, removed: 0 };
        }
        if (payload.type === "collective" && !pref.collective_enabled) {
          console.log(
            `[Push] Collective notifications disabled for user ${userId}`,
          );
          return { sent: 0, failed: 0, removed: 0 };
        }
        // TODO: Add colloquium_enabled check once DB column is added
      }
    } else {
      console.error(
        `[Push] Failed to fetch preferences (${prefRes.status}), proceeding anyway`,
      );
    }
  }

  // 2. Get all subscriptions for this user (need the ID for queue)
  const subUrl = `${supabaseUrl}/rest/v1/push_subscriptions?user_id=eq.${userId}&select=id,endpoint`;
  const subRes = await fetch(subUrl, { headers });

  if (!subRes.ok) {
    console.error(`[Push] Failed to fetch subscriptions: ${subRes.status}`);
    return { sent: 0, failed: 0, removed: 0 };
  }

  const subscriptions = await subRes.json();

  if (subscriptions.length === 0) {
    console.log(`[Push] No subscriptions for user ${userId} — skipping`);
    return { sent: 0, failed: 0, removed: 0 };
  }

  console.log(
    `[Push] Sending to ${subscriptions.length} device(s) for user ${userId}`,
  );

  // 3. For each subscription: store notification + send empty push
  // IMPORTANT: Queue INSERT must complete BEFORE sending push to avoid race condition
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      // 3a. Store notification content in queue
      const queueRes = await fetch(
        `${supabaseUrl}/rest/v1/push_notification_queue`,
        {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify({
            subscription_id: sub.id,
            title: payload.title || "Philosify",
            body: payload.body || "You have a new message",
            url: payload.url || "/",
            tag: payload.tag || null,
            type: payload.type || null,
            sender_name: payload.senderName || null,
          }),
        },
      );

      if (!queueRes.ok) {
        const err = await queueRes.text();
        console.error(`[Push] Failed to queue notification: ${err}`);
        return { success: false, error: "queue failed" };
      }

      // Verify the queue entry was created (defense against silent failures)
      const queueData = await queueRes.json().catch(() => null);
      if (!queueData || !queueData[0]?.id) {
        console.error(`[Push] Queue INSERT returned no data`);
        return { success: false, error: "queue insert failed" };
      }

      console.log(
        `[Push] Queued notification ${queueData[0].id} for subscription ${sub.id}`,
      );

      // 3b. Delay to ensure DB commit propagates before SW wakes up and queries
      // 500ms gives Supabase reliable visibility before SW fetches /pending
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3c. Send empty push to wake up service worker
      return sendEmptyPush(env, sub.endpoint);
    }),
  );

  let sent = 0;
  let failed = 0;
  const goneIds = [];
  const details = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value.success) {
      sent++;
      details.push({
        endpoint: subscriptions[i].endpoint.substring(0, 50),
        status: result.value.status,
      });
    } else {
      failed++;
      const value =
        result.status === "fulfilled"
          ? result.value
          : { error: result.reason?.message };
      details.push({
        endpoint: subscriptions[i].endpoint.substring(0, 50),
        ...value,
      });
      // Collect gone subscriptions for cleanup
      if (result.status === "fulfilled" && result.value.gone) {
        goneIds.push(subscriptions[i].id);
      }
    }
  }

  // 4. Clean up gone subscriptions (cascade deletes queue entries too)
  if (goneIds.length > 0) {
    console.log(`[Push] Removing ${goneIds.length} stale subscription(s)`);
    for (const id of goneIds) {
      await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${id}`, {
        method: "DELETE",
        headers,
      }).catch(() => {}); // Best effort
    }
  }

  console.log(
    `[Push] Results: ${sent} sent, ${failed} failed, ${goneIds.length} removed`,
  );
  return { sent, failed, removed: goneIds.length, details };
}
