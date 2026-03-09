// ============================================================
// HANDLER - GLOBAL CHAT
// ============================================================
// GET    /api/chat            - Fetch recent messages (paginated)
// POST   /api/chat            - Send a message
// PATCH  /api/chat/:messageId - Edit own message
// DELETE /api/chat/:messageId - Delete own message

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { checkRateLimit } from "../rate-limit/index.js";

const MAX_MESSAGE_LENGTH = 500;
const PAGE_SIZE = 50;
const URL_PATTERN =
  /https?:\/\/|www\.|[a-z0-9-]+\.(com|org|net|io|co|xyz|me|app|dev|gg|tv|info|biz|link)/i;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/chat - Fetch recent global chat messages
 * Supports cursor-based pagination via ?before=<ISO timestamp>
 */
export async function handleGetMessages(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const { client: supabase, setCookieHeader } = auth;
  const url = new URL(request.url);
  const before = url.searchParams.get("before");

  try {
    let query = supabase
      .from("chat_messages")
      .select(
        "id, user_id, display_name, message, created_at, message_type, metadata, edited_at, reply_to_id",
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Chat] Failed to fetch messages:", error.message);
      return jsonResponse(
        { error: "Failed to load messages" },
        500,
        origin,
        env,
      );
    }

    // Fetch reply previews for messages that are replies
    const messages = data || [];
    const replyIds = messages
      .filter((m) => m.reply_to_id)
      .map((m) => m.reply_to_id);
    let replyPreviews = {};

    if (replyIds.length > 0) {
      const uniqueReplyIds = [...new Set(replyIds)];
      const { data: replyMsgs } = await supabase
        .from("chat_messages")
        .select("id, display_name, message")
        .in("id", uniqueReplyIds);

      if (replyMsgs) {
        replyPreviews = Object.fromEntries(
          replyMsgs.map((r) => [
            r.id,
            {
              id: r.id,
              senderName: r.display_name,
              message: r.message?.slice(0, 100) || "",
            },
          ]),
        );
      }
    }

    // Enrich messages with reply previews
    const enriched = messages.map((m) => ({
      ...m,
      reply_preview: m.reply_to_id
        ? replyPreviews[m.reply_to_id] || null
        : null,
    }));

    let response = jsonResponse({ messages: enriched }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Chat] Exception:", err.message);
    return jsonResponse({ error: "Failed to load messages" }, 500, origin, env);
  }
}

/**
 * POST /api/chat - Send a global chat message
 * Body: { message: string }
 */
export async function handleSendMessage(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const {
    client: supabase,
    userId,
    email,
    userMetadata,
    setCookieHeader,
  } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `chat:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many messages. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    const body = await request.json();
    const message = (body.message || "").trim();
    const replyToId = body.reply_to_id || null;

    if (!message || message.length === 0) {
      return jsonResponse(
        { error: "Message cannot be empty" },
        400,
        origin,
        env,
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` },
        400,
        origin,
        env,
      );
    }

    // Block URLs - only Share Analysis feature is allowed
    if (URL_PATTERN.test(message)) {
      return jsonResponse(
        {
          error:
            "Links are not allowed. Use the Share Analysis button to share your analysis.",
        },
        400,
        origin,
        env,
      );
    }

    // Validate reply_to_id if provided
    if (replyToId) {
      if (!UUID_RE.test(replyToId)) {
        return jsonResponse({ error: "Invalid reply_to_id" }, 400, origin, env);
      }
      const { data: replyMsg } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("id", replyToId)
        .single();
      if (!replyMsg) {
        return jsonResponse(
          { error: "Reply target not found" },
          400,
          origin,
          env,
        );
      }
    }

    // Display name priority: full_name from metadata > email prefix > Anonymous
    const displayName =
      userMetadata?.full_name || (email ? email.split("@")[0] : "Anonymous");

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        display_name: displayName,
        message: message,
        reply_to_id: replyToId,
      })
      .select(
        "id, user_id, display_name, message, created_at, message_type, metadata, edited_at, reply_to_id",
      )
      .single();

    if (error) {
      console.error("[Chat] Failed to send message:", error.message);
      return jsonResponse(
        { error: "Failed to send message" },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse(
      { success: true, message: data },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Chat] Exception:", err.message);
    return jsonResponse({ error: "Failed to send message" }, 500, origin, env);
  }
}

/**
 * DELETE /api/chat/:messageId - Delete own global chat message
 * Hard delete — removes for everyone.
 */
export async function handleDeleteChatMessage(request, env, origin, messageId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Fetch message to verify ownership
    const { data: msg, error: fetchError } = await supabase
      .from("chat_messages")
      .select("id, user_id")
      .eq("id", messageId)
      .single();

    if (fetchError || !msg) {
      return jsonResponse({ error: "Message not found" }, 404, origin, env);
    }

    if (msg.user_id !== userId) {
      return jsonResponse(
        { error: "Can only delete your own messages" },
        403,
        origin,
        env,
      );
    }

    // Hard delete
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", messageId);

    if (deleteError) {
      console.error("[Chat] Delete failed:", deleteError.message);
      return jsonResponse(
        { error: "Failed to delete message" },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Chat] Delete exception:", err.message);
    return jsonResponse(
      { error: "Failed to delete message" },
      500,
      origin,
      env,
    );
  }
}

/**
 * PATCH /api/chat/:messageId - Edit own global chat message
 * Body: { message: string }
 */
export async function handleEditChatMessage(request, env, origin, messageId) {
  if (!messageId || !UUID_RE.test(messageId)) {
    return jsonResponse({ error: "Invalid message ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership
    const { data: msg, error: fetchError } = await supabase
      .from("chat_messages")
      .select("id, user_id")
      .eq("id", messageId)
      .single();

    if (fetchError || !msg) {
      return jsonResponse({ error: "Message not found" }, 404, origin, env);
    }

    if (msg.user_id !== userId) {
      return jsonResponse(
        { error: "Can only edit your own messages" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const newMessage = (body.message || "").trim();

    if (!newMessage || newMessage.length === 0) {
      return jsonResponse(
        { error: "Message cannot be empty" },
        400,
        origin,
        env,
      );
    }

    if (newMessage.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` },
        400,
        origin,
        env,
      );
    }

    if (URL_PATTERN.test(newMessage)) {
      return jsonResponse(
        { error: "Links are not allowed." },
        400,
        origin,
        env,
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("chat_messages")
      .update({
        message: newMessage,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select(
        "id, user_id, display_name, message, created_at, message_type, metadata, edited_at, reply_to_id",
      )
      .single();

    if (updateError || !updated) {
      console.error("[Chat] Edit failed:", updateError?.message);
      return jsonResponse(
        { error: "Failed to edit message" },
        500,
        origin,
        env,
      );
    }

    console.log("[Chat] Message edited:", messageId);

    let response = jsonResponse(
      { success: true, message: updated },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Chat] Edit exception:", err.message);
    return jsonResponse({ error: "Failed to edit message" }, 500, origin, env);
  }
}
