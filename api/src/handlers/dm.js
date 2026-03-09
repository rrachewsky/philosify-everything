// ============================================================
// HANDLER - DIRECT MESSAGES (Conversation-based)
// ============================================================
// Supports both 1-to-1 (direct) and group conversations.
// All endpoints are conversation-centric.
//
// GET    /api/dm/conversations                           - List conversations
// POST   /api/dm/conversations                           - Create conversation
// GET    /api/dm/conversations/:id/messages               - Get messages
// POST   /api/dm/conversations/:id/messages               - Send message
// POST   /api/dm/conversations/:id/messages/:msgId/reactions - Toggle reaction
// POST   /api/dm/conversations/:id/members                - Add members
// DELETE /api/dm/conversations/:id/members/:userId        - Remove member
// PATCH  /api/dm/conversations/:id                        - Update conversation
// DELETE /api/dm/conversations/:id                        - Leave/delete conversation
// DELETE /api/dm/conversations/:id/messages/:messageId    - Delete message
// POST   /api/dm/conversations/:id/read                   - Mark read
// GET    /api/dm/user/:userId                             - Get user profile
// GET    /api/dm/conversations/:id/key                    - Get group key
// POST   /api/dm/conversations/:id/key                    - Set group keys

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { checkRateLimit } from "../rate-limit/index.js";
import { getBlockedUserIds } from "./block.js";
import { sendPushNotification } from "../push/sender.js";
import { pg, rpc } from "../utils/pg.js";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_ENCRYPTED_LENGTH = 4000;
const PAGE_SIZE = 50;
const MAX_GROUP_MEMBERS = 20;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// SECURITY: Validates ISO 8601 timestamps for PostgREST filter parameters
const ISO_TIMESTAMP_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
const URL_PATTERN =
  /https?:\/\/|www\.|[a-z0-9-]+\.(com|org|net|io|co|xyz|me|app|dev|gg|tv|info|biz|link)/i;
const VALID_REACTIONS = [
  "reason",
  "dialectic",
  "reflect",
  "provoke",
  "absurd",
  "virtue",
];

// ============================================================
// Helper: verify membership + get role
// ============================================================
async function getMembership(env, conversationId, userId) {
  return pg(env, "GET", "dm_conversation_members", {
    filter: `conversation_id=eq.${conversationId}&user_id=eq.${userId}`,
    select: "conversation_id,user_id,role",
    single: true,
  });
}

// ============================================================
// Helper: enrich conversations with members + display names
// ============================================================
async function enrichConversations(env, conversations, userId) {
  if (!conversations || conversations.length === 0) return [];

  const convIds = conversations.map((c) => c.id);

  // Get all members for these conversations
  const members =
    (await pg(env, "GET", "dm_conversation_members", {
      filter: `conversation_id=in.(${convIds.join(",")})`,
      select: "conversation_id,user_id,role",
    })) || [];

  // Get all unique user IDs for display names
  const allUserIds = [...new Set(members.map((m) => m.user_id))];
  const profiles =
    allUserIds.length > 0
      ? (await pg(env, "GET", "user_profiles", {
          filter: `id=in.(${allUserIds.join(",")})`,
          select: "id,display_name",
        })) || []
      : [];
  const nameMap = Object.fromEntries(
    profiles.map((p) => [p.id, p.display_name]),
  );

  // Get read receipts for this user
  const receipts =
    (await pg(env, "GET", "dm_read_receipts", {
      filter: `user_id=eq.${userId}&conversation_id=in.(${convIds.join(",")})`,
      select: "conversation_id,last_read_at",
    })) || [];
  const receiptMap = Object.fromEntries(
    receipts.map((r) => [r.conversation_id, r.last_read_at]),
  );

  // Get blocked user IDs
  const blockedIds = await getBlockedUserIds(env, userId);

  // Compute unread counts: for conversations with messages after last_read_at
  const unreadMap = {};
  for (const conv of conversations) {
    const lastRead = receiptMap[conv.id] || "1970-01-01T00:00:00Z";
    if (
      conv.last_message_at &&
      new Date(conv.last_message_at) > new Date(lastRead) &&
      conv.last_sender_id !== userId
    ) {
      const unreadMsgs = await pg(env, "GET", "direct_messages", {
        filter: `conversation_id=eq.${conv.id}&sender_id=neq.${userId}&created_at=gt.${lastRead}`,
        select: "id",
      });
      unreadMap[conv.id] = unreadMsgs ? unreadMsgs.length : 0;
    } else {
      unreadMap[conv.id] = 0;
    }
  }

  // Assemble
  return conversations
    .map((conv) => {
      const convMembers = members
        .filter((m) => m.conversation_id === conv.id)
        .map((m) => ({
          id: m.user_id,
          displayName: nameMap[m.user_id] || "Unknown",
          role: m.role,
        }));

      // Filter: skip conversations where ALL other members are blocked
      const otherMembers = convMembers.filter((m) => m.id !== userId);
      if (
        otherMembers.length > 0 &&
        otherMembers.every((m) => blockedIds.has(m.id))
      ) {
        return null;
      }

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        members: convMembers,
        lastMessage: conv.last_message_preview,
        lastMessageAt: conv.last_message_at,
        lastSenderId: conv.last_sender_id,
        unreadCount: unreadMap[conv.id] || 0,
        createdAt: conv.created_at,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a.lastMessageAt || a.createdAt;
      const bTime = b.lastMessageAt || b.createdAt;
      return new Date(bTime) - new Date(aTime);
    });
}

// ============================================================
// GET /api/dm/conversations
// ============================================================
export async function handleGetConversations(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    // Get conversation IDs where user is a member
    const memberships = await pg(env, "GET", "dm_conversation_members", {
      filter: `user_id=eq.${userId}`,
      select: "conversation_id",
    });
    if (!memberships || memberships.length === 0) {
      let response = jsonResponse({ conversations: [] }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    const convIds = memberships.map((m) => m.conversation_id);
    const conversations = await pg(env, "GET", "dm_conversations", {
      filter: `id=in.(${convIds.join(",")})`,
      order: "last_message_at.desc.nullslast",
    });

    const enriched = await enrichConversations(
      env,
      conversations || [],
      userId,
    );

    let response = jsonResponse({ conversations: enriched }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Get conversations error:", err.message);
    return jsonResponse(
      { error: "Failed to load conversations" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/dm/conversations
// ============================================================
export async function handleCreateConversation(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    const body = await request.json();
    const { type, memberIds, name } = body;

    if (!type || !["direct", "group"].includes(type)) {
      return jsonResponse(
        { error: "Invalid type: must be direct or group" },
        400,
        origin,
        env,
      );
    }
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return jsonResponse({ error: "memberIds required" }, 400, origin, env);
    }
    if (memberIds.some((id) => !UUID_RE.test(id))) {
      return jsonResponse({ error: "Invalid member ID" }, 400, origin, env);
    }
    if (memberIds.includes(userId)) {
      return jsonResponse(
        { error: "Do not include yourself in memberIds" },
        400,
        origin,
        env,
      );
    }

    // Block checks
    const blockedByMe = await getBlockedUserIds(env, userId);
    for (const mid of memberIds) {
      if (blockedByMe.has(mid)) {
        return jsonResponse(
          { error: "Cannot create conversation with a blocked user" },
          403,
          origin,
          env,
        );
      }
      const blockedByThem = await getBlockedUserIds(env, mid);
      if (blockedByThem.has(userId)) {
        return jsonResponse(
          { error: "You cannot message this user" },
          403,
          origin,
          env,
        );
      }
    }

    // For direct: check if conversation already exists
    if (type === "direct") {
      if (memberIds.length !== 1) {
        return jsonResponse(
          { error: "Direct conversations require exactly 1 member" },
          400,
          origin,
          env,
        );
      }
      const partnerId = memberIds[0];
      const existingId = await rpc(env, "find_direct_conversation", {
        p_user_a: userId,
        p_user_b: partnerId,
      });
      if (existingId) {
        // Return existing conversation
        const conv = await pg(env, "GET", "dm_conversations", {
          filter: `id=eq.${existingId}`,
          single: true,
        });
        const enriched = await enrichConversations(
          env,
          conv ? [conv] : [],
          userId,
        );
        let response = jsonResponse(
          { conversation: enriched[0] || null, existing: true },
          200,
          origin,
          env,
        );
        return addRefreshedCookieToResponse(response, setCookieHeader);
      }
    }

    if (type === "group") {
      if (memberIds.length < 1) {
        return jsonResponse(
          { error: "Groups require at least 1 other member" },
          400,
          origin,
          env,
        );
      }
      if (memberIds.length + 1 > MAX_GROUP_MEMBERS) {
        return jsonResponse(
          { error: `Groups limited to ${MAX_GROUP_MEMBERS} members` },
          400,
          origin,
          env,
        );
      }
    }

    // Verify all members exist
    const profiles = await pg(env, "GET", "user_profiles", {
      filter: `id=in.(${memberIds.join(",")})`,
      select: "id",
    });
    if (!profiles || profiles.length !== memberIds.length) {
      return jsonResponse(
        { error: "One or more users not found" },
        404,
        origin,
        env,
      );
    }

    // Create conversation
    const conv = await pg(env, "POST", "dm_conversations", {
      body: {
        type,
        name: type === "group" ? name || null : null,
        created_by: userId,
      },
      single: true,
    });
    if (!conv) {
      return jsonResponse(
        { error: "Failed to create conversation" },
        500,
        origin,
        env,
      );
    }

    // Add members: creator is admin, others are admin (direct) or member (group)
    const allMembers = [
      { conversation_id: conv.id, user_id: userId, role: "admin" },
      ...memberIds.map((mid) => ({
        conversation_id: conv.id,
        user_id: mid,
        role: type === "direct" ? "admin" : "member",
      })),
    ];
    await pg(env, "POST", "dm_conversation_members", { body: allMembers });

    // Initialize read receipts
    const receipts = allMembers.map((m) => ({
      conversation_id: conv.id,
      user_id: m.user_id,
      last_read_at: new Date().toISOString(),
    }));
    await pg(env, "POST", "dm_read_receipts", { body: receipts });

    // Return enriched conversation
    const enriched = await enrichConversations(env, [conv], userId);

    let response = jsonResponse(
      { conversation: enriched[0] || null, existing: false },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Create conversation error:", err.message);
    return jsonResponse(
      { error: "Failed to create conversation" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// GET /api/dm/conversations/:id/messages
// ============================================================
export async function handleGetConversationMessages(
  request,
  env,
  origin,
  conversationId,
) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse(
        { error: "Not a member of this conversation" },
        403,
        origin,
        env,
      );
    }

    const url = new URL(request.url);
    const before = url.searchParams.get("before");

    let filter = `conversation_id=eq.${conversationId}`;
    // SECURITY: Validate timestamp format before injecting into PostgREST filter
    if (before) {
      if (!ISO_TIMESTAMP_RE.test(before)) {
        return jsonResponse(
          { error: "Invalid timestamp format" },
          400,
          origin,
          env,
        );
      }
      filter += `&created_at=lt.${before}`;
    }

    const messages =
      (await pg(env, "GET", "direct_messages", {
        select:
          "id,sender_id,recipient_id,conversation_id,message,encrypted_content,nonce,is_encrypted,created_at,reply_to_id,edited_at,is_forwarded,message_type,metadata",
        filter,
        order: "created_at.desc",
        limit: PAGE_SIZE,
      })) || [];

    // Get conversation info
    const conv = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });

    // Get members with display names
    const members =
      (await pg(env, "GET", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}`,
        select: "user_id,role",
      })) || [];
    const memberIds = members.map((m) => m.user_id);
    const profiles =
      memberIds.length > 0
        ? (await pg(env, "GET", "user_profiles", {
            filter: `id=in.(${memberIds.join(",")})`,
            select: "id,display_name",
          })) || []
        : [];
    const nameMap = Object.fromEntries(
      profiles.map((p) => [p.id, p.display_name]),
    );

    // Fetch reply previews for messages that are replies
    const replyIds = messages
      .filter((m) => m.reply_to_id)
      .map((m) => m.reply_to_id);
    let replyPreviews = {};
    if (replyIds.length > 0) {
      const uniqueReplyIds = [...new Set(replyIds)];
      const replyMessages =
        (await pg(env, "GET", "direct_messages", {
          select: "id,sender_id,message,is_encrypted",
          filter: `id=in.(${uniqueReplyIds.join(",")})`,
        })) || [];
      replyPreviews = Object.fromEntries(
        replyMessages.map((r) => [
          r.id,
          {
            id: r.id,
            senderId: r.sender_id,
            senderName: nameMap[r.sender_id] || "Unknown",
            message: r.is_encrypted
              ? "[Encrypted]"
              : r.message?.slice(0, 100) || "",
            isEncrypted: r.is_encrypted || false,
          },
        ]),
      );
    }

    // Fetch reactions for these messages
    const messageIds = messages.map((m) => m.id);
    let reactionsMap = {}; // messageId -> { counts: { reason: 2, ... }, myReactions: ['reason'] }
    if (messageIds.length > 0) {
      const reactions =
        (await pg(env, "GET", "dm_reactions", {
          filter: `message_id=in.(${messageIds.join(",")})`,
          select: "message_id,user_id,reaction_type",
        })) || [];

      for (const r of reactions) {
        if (!reactionsMap[r.message_id]) {
          reactionsMap[r.message_id] = { counts: {}, myReactions: [] };
        }
        const entry = reactionsMap[r.message_id];
        entry.counts[r.reaction_type] =
          (entry.counts[r.reaction_type] || 0) + 1;
        if (r.user_id === userId) {
          entry.myReactions.push(r.reaction_type);
        }
      }
    }

    // Mark as read
    await pg(env, "POST", "dm_read_receipts", {
      body: {
        conversation_id: conversationId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      },
      prefer: "return=representation,resolution=merge-duplicates",
    });

    // Enrich messages (reverse for chronological)
    const enriched = messages
      .map((m) => ({
        id: m.id,
        message: m.is_encrypted ? null : m.message,
        encryptedContent: m.is_encrypted ? m.encrypted_content : null,
        nonce: m.is_encrypted ? m.nonce : null,
        isEncrypted: m.is_encrypted || false,
        senderId: m.sender_id,
        senderName: nameMap[m.sender_id] || "Unknown",
        conversationId: m.conversation_id,
        createdAt: m.created_at,
        isMine: m.sender_id === userId,
        replyToId: m.reply_to_id || null,
        replyPreview: m.reply_to_id
          ? replyPreviews[m.reply_to_id] || null
          : null,
        editedAt: m.edited_at || null,
        isForwarded: m.is_forwarded || false,
        messageType: m.message_type || "text",
        metadata: m.metadata || null,
        reactions: reactionsMap[m.id]?.counts || {},
        myReactions: reactionsMap[m.id]?.myReactions || [],
      }))
      .reverse();

    let response = jsonResponse(
      {
        conversation: conv
          ? {
              id: conv.id,
              type: conv.type,
              name: conv.name,
              members: members.map((m) => ({
                id: m.user_id,
                displayName: nameMap[m.user_id] || "Unknown",
                role: m.role,
              })),
            }
          : null,
        messages: enriched,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Get messages error:", err.message);
    return jsonResponse({ error: "Failed to load messages" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/dm/conversations/:id/messages
// ============================================================
export async function handleSendConversationMessage(
  request,
  env,
  origin,
  conversationId,
) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, email, userMetadata, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `dm:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many messages. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse(
        { error: "Not a member of this conversation" },
        403,
        origin,
        env,
      );
    }

    // Get conversation for type + members
    const conv = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });
    if (!conv) {
      return jsonResponse(
        { error: "Conversation not found" },
        404,
        origin,
        env,
      );
    }

    // Block check for direct conversations
    if (conv.type === "direct") {
      const members =
        (await pg(env, "GET", "dm_conversation_members", {
          filter: `conversation_id=eq.${conversationId}`,
          select: "user_id",
        })) || [];
      const partnerId = members.find((m) => m.user_id !== userId)?.user_id;
      if (partnerId) {
        const blockedByMe = await getBlockedUserIds(env, userId);
        if (blockedByMe.has(partnerId)) {
          return jsonResponse(
            { error: "You have blocked this user" },
            403,
            origin,
            env,
          );
        }
        const blockedByThem = await getBlockedUserIds(env, partnerId);
        if (blockedByThem.has(userId)) {
          return jsonResponse(
            { error: "You cannot message this user" },
            403,
            origin,
            env,
          );
        }
      }
    }

    const body = await request.json();
    const message = (body.message || "").trim();
    const encryptedContent = body.encrypted_content || null;
    const nonce = body.nonce || null;
    const isEncrypted = !!(encryptedContent && nonce);
    const replyToId = body.reply_to_id || null;
    const isForwarded = body.is_forwarded === true;

    // Validate reply_to_id if provided
    if (replyToId) {
      if (!UUID_RE.test(replyToId)) {
        return jsonResponse({ error: "Invalid reply_to_id" }, 400, origin, env);
      }
      const replyMsg = await pg(env, "GET", "direct_messages", {
        filter: `id=eq.${replyToId}&conversation_id=eq.${conversationId}`,
        single: true,
      });
      if (!replyMsg) {
        return jsonResponse(
          { error: "Reply target not found in this conversation" },
          400,
          origin,
          env,
        );
      }
    }

    if (isEncrypted) {
      if (encryptedContent.length > MAX_ENCRYPTED_LENGTH) {
        return jsonResponse(
          { error: "Encrypted content too large" },
          400,
          origin,
          env,
        );
      }
    } else {
      if (!message || message.length > MAX_MESSAGE_LENGTH) {
        return jsonResponse(
          { error: `Message required (max ${MAX_MESSAGE_LENGTH} chars)` },
          400,
          origin,
          env,
        );
      }
      if (URL_PATTERN.test(message)) {
        return jsonResponse(
          { error: "Links are not allowed." },
          400,
          origin,
          env,
        );
      }
    }

    // For direct conversations, set recipient_id for backward compat
    let recipientId = null;
    if (conv.type === "direct") {
      const members =
        (await pg(env, "GET", "dm_conversation_members", {
          filter: `conversation_id=eq.${conversationId}`,
          select: "user_id",
        })) || [];
      recipientId = members.find((m) => m.user_id !== userId)?.user_id || null;
    }

    const insertData = {
      sender_id: userId,
      recipient_id: recipientId,
      conversation_id: conversationId,
      message: isEncrypted ? "[Encrypted]" : message,
      encrypted_content: encryptedContent,
      nonce: nonce,
      is_encrypted: isEncrypted,
      reply_to_id: replyToId,
      is_forwarded: isForwarded,
    };

    const dm = await pg(env, "POST", "direct_messages", {
      body: insertData,
      single: true,
    });
    if (!dm) {
      return jsonResponse(
        { error: "Failed to send message" },
        500,
        origin,
        env,
      );
    }

    // Update conversation metadata
    const preview = isEncrypted
      ? "[Encrypted]"
      : message.length > 100
        ? message.slice(0, 100)
        : message;
    await pg(env, "PATCH", "dm_conversations", {
      body: {
        last_message_at: dm.created_at,
        last_message_preview: preview,
        last_sender_id: userId,
      },
      filter: `id=eq.${conversationId}`,
    });

    // Update sender's read receipt
    await pg(env, "POST", "dm_read_receipts", {
      body: {
        conversation_id: conversationId,
        user_id: userId,
        last_read_at: dm.created_at,
      },
      prefer: "return=representation,resolution=merge-duplicates",
    });

    // Push notifications to all other members (fire-and-forget)
    const allMembers =
      (await pg(env, "GET", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}&user_id=neq.${userId}`,
        select: "user_id",
      })) || [];

    const senderName =
      userMetadata?.full_name ||
      userMetadata?.display_name ||
      (email ? email.split("@")[0] : "Someone");
    // Never include message content in push — DMs are encrypted; just advise that a message was sent
    const pushBody = "Sent you a message";

    for (const member of allMembers) {
      sendPushNotification(env, member.user_id, {
        title:
          conv.type === "group"
            ? `${senderName} in ${conv.name || "Group"}`
            : senderName,
        body: pushBody,
        url: "/community?tab=messages",
        tag: `dm-${conversationId}`,
        type: "dm",
        senderName: senderName,
      }).catch((err) => console.error("[DM] Push failed:", err.message));
    }

    let response = jsonResponse(
      {
        success: true,
        message: {
          id: dm.id,
          message: dm.is_encrypted ? null : dm.message,
          encryptedContent: dm.encrypted_content,
          nonce: dm.nonce,
          isEncrypted: dm.is_encrypted || false,
          senderId: dm.sender_id,
          conversationId: dm.conversation_id,
          createdAt: dm.created_at,
          isMine: true,
          replyToId: dm.reply_to_id || null,
          isForwarded: dm.is_forwarded || false,
          messageType: dm.message_type || "text",
          metadata: dm.metadata || null,
        },
      },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Send message error:", err.message);
    return jsonResponse({ error: "Failed to send message" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/dm/conversations/:id/members
// ============================================================
export async function handleAddMembers(request, env, origin, conversationId) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    // Verify admin role
    const membership = await getMembership(env, conversationId, userId);
    if (!membership || membership.role !== "admin") {
      return jsonResponse(
        { error: "Only admins can add members" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const { memberIds } = body;
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return jsonResponse({ error: "memberIds required" }, 400, origin, env);
    }
    if (memberIds.some((id) => !UUID_RE.test(id))) {
      return jsonResponse({ error: "Invalid member ID" }, 400, origin, env);
    }

    // Check current member count
    const currentMembers =
      (await pg(env, "GET", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}`,
        select: "user_id",
      })) || [];
    if (currentMembers.length + memberIds.length > MAX_GROUP_MEMBERS) {
      return jsonResponse(
        { error: `Groups limited to ${MAX_GROUP_MEMBERS} members` },
        400,
        origin,
        env,
      );
    }

    // Filter out already-members
    const existingIds = new Set(currentMembers.map((m) => m.user_id));
    const newIds = memberIds.filter((id) => !existingIds.has(id));
    if (newIds.length === 0) {
      return jsonResponse(
        { error: "All users are already members" },
        400,
        origin,
        env,
      );
    }

    // Block checks
    const blockedByMe = await getBlockedUserIds(env, userId);
    for (const mid of newIds) {
      if (blockedByMe.has(mid)) {
        return jsonResponse(
          { error: "Cannot add a blocked user" },
          403,
          origin,
          env,
        );
      }
    }

    // Verify users exist
    const profiles = await pg(env, "GET", "user_profiles", {
      filter: `id=in.(${newIds.join(",")})`,
      select: "id",
    });
    if (!profiles || profiles.length !== newIds.length) {
      return jsonResponse(
        { error: "One or more users not found" },
        404,
        origin,
        env,
      );
    }

    // If conversation is 'direct', promote to 'group'
    const conv = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });
    if (conv && conv.type === "direct") {
      await pg(env, "PATCH", "dm_conversations", {
        body: { type: "group" },
        filter: `id=eq.${conversationId}`,
      });
    }

    // Add new members
    const newMembers = newIds.map((mid) => ({
      conversation_id: conversationId,
      user_id: mid,
      role: "member",
    }));
    await pg(env, "POST", "dm_conversation_members", { body: newMembers });

    // Add read receipts for new members
    const receipts = newIds.map((mid) => ({
      conversation_id: conversationId,
      user_id: mid,
      last_read_at: new Date().toISOString(),
    }));
    await pg(env, "POST", "dm_read_receipts", { body: receipts });

    // Return updated conversation
    const updated = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });
    const enriched = await enrichConversations(
      env,
      updated ? [updated] : [],
      userId,
    );

    let response = jsonResponse(
      { conversation: enriched[0] || null },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Add members error:", err.message);
    return jsonResponse({ error: "Failed to add members" }, 500, origin, env);
  }
}

// ============================================================
// DELETE /api/dm/conversations/:id/members/:targetUserId
// ============================================================
export async function handleRemoveMember(
  request,
  env,
  origin,
  conversationId,
  targetUserId,
) {
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(targetUserId)) {
    return jsonResponse({ error: "Invalid ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse({ error: "Not a member" }, 403, origin, env);
    }

    // Can remove self (leave) or admins can remove non-admins
    const isSelf = targetUserId === userId;
    if (!isSelf && membership.role !== "admin") {
      return jsonResponse(
        { error: "Only admins can remove members" },
        403,
        origin,
        env,
      );
    }

    // Don't let admins remove other admins
    if (!isSelf) {
      const targetMembership = await getMembership(
        env,
        conversationId,
        targetUserId,
      );
      if (!targetMembership) {
        return jsonResponse(
          { error: "User is not a member" },
          404,
          origin,
          env,
        );
      }
      if (targetMembership.role === "admin") {
        return jsonResponse(
          { error: "Cannot remove another admin" },
          403,
          origin,
          env,
        );
      }
    }

    // Remove member
    await pg(env, "DELETE", "dm_conversation_members", {
      filter: `conversation_id=eq.${conversationId}&user_id=eq.${targetUserId}`,
    });

    // Remove their read receipt and group key
    await pg(env, "DELETE", "dm_read_receipts", {
      filter: `conversation_id=eq.${conversationId}&user_id=eq.${targetUserId}`,
    });
    await pg(env, "DELETE", "dm_group_keys", {
      filter: `conversation_id=eq.${conversationId}&user_id=eq.${targetUserId}`,
    });

    // Check remaining members
    const remaining =
      (await pg(env, "GET", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}`,
        select: "user_id",
      })) || [];

    if (remaining.length === 0) {
      // Delete conversation and all messages
      await pg(env, "DELETE", "direct_messages", {
        filter: `conversation_id=eq.${conversationId}`,
      });
      await pg(env, "DELETE", "dm_conversations", {
        filter: `id=eq.${conversationId}`,
      });
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Remove member error:", err.message);
    return jsonResponse({ error: "Failed to remove member" }, 500, origin, env);
  }
}

// ============================================================
// PATCH /api/dm/conversations/:id
// ============================================================
export async function handleUpdateConversation(
  request,
  env,
  origin,
  conversationId,
) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership || membership.role !== "admin") {
      return jsonResponse(
        { error: "Only admins can update conversations" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const updates = {};
    if (body.name !== undefined)
      updates.name = body.name ? body.name.trim().slice(0, 50) : null;

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: "Nothing to update" }, 400, origin, env);
    }

    await pg(env, "PATCH", "dm_conversations", {
      body: updates,
      filter: `id=eq.${conversationId}`,
    });

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Update conversation error:", err.message);
    return jsonResponse(
      { error: "Failed to update conversation" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// DELETE /api/dm/conversations/:id
// ============================================================
export async function handleLeaveConversation(
  request,
  env,
  origin,
  conversationId,
) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse({ error: "Not a member" }, 403, origin, env);
    }

    const conv = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });

    if (conv && conv.type === "direct") {
      // Direct: delete all messages and the conversation
      await pg(env, "DELETE", "direct_messages", {
        filter: `conversation_id=eq.${conversationId}`,
      });
      await pg(env, "DELETE", "dm_read_receipts", {
        filter: `conversation_id=eq.${conversationId}`,
      });
      await pg(env, "DELETE", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}`,
      });
      await pg(env, "DELETE", "dm_group_keys", {
        filter: `conversation_id=eq.${conversationId}`,
      });
      await pg(env, "DELETE", "dm_conversations", {
        filter: `id=eq.${conversationId}`,
      });
    } else {
      // Group: remove self
      await pg(env, "DELETE", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}&user_id=eq.${userId}`,
      });
      await pg(env, "DELETE", "dm_read_receipts", {
        filter: `conversation_id=eq.${conversationId}&user_id=eq.${userId}`,
      });
      await pg(env, "DELETE", "dm_group_keys", {
        filter: `conversation_id=eq.${conversationId}&user_id=eq.${userId}`,
      });

      // If no members left, delete everything
      const remaining =
        (await pg(env, "GET", "dm_conversation_members", {
          filter: `conversation_id=eq.${conversationId}`,
          select: "user_id",
        })) || [];
      if (remaining.length === 0) {
        await pg(env, "DELETE", "direct_messages", {
          filter: `conversation_id=eq.${conversationId}`,
        });
        await pg(env, "DELETE", "dm_conversations", {
          filter: `id=eq.${conversationId}`,
        });
      }
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Leave conversation error:", err.message);
    return jsonResponse(
      { error: "Failed to leave conversation" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// DELETE /api/dm/conversations/:id/messages/:messageId
// ============================================================
export async function handleDeleteConversationMessage(
  request,
  env,
  origin,
  conversationId,
  messageId,
) {
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(messageId)) {
    return jsonResponse({ error: "Invalid ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    // 1. Verify message exists and belongs to sender
    const msg = await pg(env, "GET", "direct_messages", {
      filter: `id=eq.${messageId}&conversation_id=eq.${conversationId}`,
      select: "id,sender_id",
      single: true,
    });
    if (!msg) {
      return jsonResponse({ error: "Message not found" }, 404, origin, env);
    }
    if (msg.sender_id !== userId) {
      return jsonResponse(
        { error: "Can only delete your own messages" },
        403,
        origin,
        env,
      );
    }

    // 2. Get all conversation members BEFORE delete (for backup broadcast)
    const members =
      (await pg(env, "GET", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}`,
        select: "user_id",
      })) || [];

    // 3. Delete the message (DB trigger will broadcast to realtime)
    const deleteResult = await pg(env, "DELETE", "direct_messages", {
      filter: `id=eq.${messageId}`,
      prefer: "return=representation",
    });

    // 4. Verify deletion actually happened by checking if message still exists
    const verifyDeleted = await pg(env, "GET", "direct_messages", {
      filter: `id=eq.${messageId}`,
      select: "id",
      single: true,
    });

    if (verifyDeleted) {
      console.error("[DM] Delete failed - message still exists:", messageId);
      return jsonResponse(
        { error: "Failed to delete message" },
        500,
        origin,
        env,
      );
    }

    console.log("[DM] Message deleted successfully:", messageId);

    // 5. Backup broadcast via Supabase Realtime (in case DB trigger failed)
    // SECURITY: Minimal payload only - {id, action} per 10/10 architecture guide
    try {
      const { url, key } = await getSupabaseCredentials(env);

      // Broadcast to each member's private channel
      for (const member of members) {
        await fetch(`${url}/realtime/v1/api/broadcast`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: `dm:${member.user_id}`,
            event: "message-deleted",
            payload: {
              id: messageId,
              action: "deleted",
            },
            private: true,
          }),
        });
      }
      console.log(`[DM] Backup broadcast sent to ${members.length} member(s)`);
    } catch (broadcastErr) {
      // Non-fatal - DB trigger should have handled it
      console.warn("[DM] Backup broadcast failed:", broadcastErr.message);
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Delete message error:", err.message);
    return jsonResponse(
      { error: "Failed to delete message" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// PATCH /api/dm/conversations/:id/messages/:messageId
// ============================================================
export async function handleEditConversationMessage(
  request,
  env,
  origin,
  conversationId,
  messageId,
) {
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(messageId)) {
    return jsonResponse({ error: "Invalid ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    // 1. Verify message exists and belongs to sender
    const msg = await pg(env, "GET", "direct_messages", {
      filter: `id=eq.${messageId}&conversation_id=eq.${conversationId}`,
      select: "id,sender_id,is_encrypted",
      single: true,
    });
    if (!msg) {
      return jsonResponse({ error: "Message not found" }, 404, origin, env);
    }
    if (msg.sender_id !== userId) {
      return jsonResponse(
        { error: "Can only edit your own messages" },
        403,
        origin,
        env,
      );
    }

    // 2. Parse and validate new message content
    const body = await request.json();
    const newMessage = (body.message || "").trim();
    const encryptedContent = body.encrypted_content || null;
    const nonce = body.nonce || null;
    const isEncrypted = !!(encryptedContent && nonce);

    if (isEncrypted) {
      if (encryptedContent.length > MAX_ENCRYPTED_LENGTH) {
        return jsonResponse(
          { error: "Encrypted content too large" },
          400,
          origin,
          env,
        );
      }
    } else {
      if (!newMessage || newMessage.length > MAX_MESSAGE_LENGTH) {
        return jsonResponse(
          { error: `Message required (max ${MAX_MESSAGE_LENGTH} chars)` },
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
    }

    // 3. Update the message with edited_at timestamp
    const updateData = {
      message: isEncrypted ? "[Encrypted]" : newMessage,
      encrypted_content: encryptedContent,
      nonce: nonce,
      is_encrypted: isEncrypted,
      edited_at: new Date().toISOString(),
    };

    const updated = await pg(env, "PATCH", "direct_messages", {
      body: updateData,
      filter: `id=eq.${messageId}`,
      single: true,
    });

    if (!updated) {
      return jsonResponse(
        { error: "Failed to update message" },
        500,
        origin,
        env,
      );
    }

    console.log("[DM] Message edited:", messageId);

    // Backup broadcast via Supabase Realtime (in case DB trigger failed)
    try {
      const members =
        (await pg(env, "GET", "dm_conversation_members", {
          filter: `conversation_id=eq.${conversationId}`,
          select: "user_id",
        })) || [];

      const { url, key } = await getSupabaseCredentials(env);

      for (const member of members) {
        if (member.user_id === userId) continue; // Skip sender
        await fetch(`${url}/realtime/v1/api/broadcast`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: `dm:${member.user_id}`,
            event: "message-edited",
            payload: {
              id: messageId,
              message: updated.message,
              encrypted_content: updated.encrypted_content,
              nonce: updated.nonce,
              is_encrypted: updated.is_encrypted,
              sender_id: userId,
              conversation_id: conversationId,
              edited_at: updated.edited_at,
            },
            private: true,
          }),
        });
      }
      console.log(
        `[DM] Edit backup broadcast sent to ${members.length - 1} member(s)`,
      );
    } catch (broadcastErr) {
      // Non-fatal - DB trigger should have handled it
      console.warn("[DM] Edit backup broadcast failed:", broadcastErr.message);
    }

    let response = jsonResponse(
      {
        success: true,
        message: {
          id: updated.id,
          message: updated.is_encrypted ? null : updated.message,
          encryptedContent: updated.encrypted_content,
          nonce: updated.nonce,
          isEncrypted: updated.is_encrypted || false,
          editedAt: updated.edited_at,
        },
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Edit message error:", err.message);
    return jsonResponse({ error: "Failed to edit message" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/dm/conversations/:id/read
// ============================================================
export async function handleMarkRead(request, env, origin, conversationId) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse({ error: "Not a member" }, 403, origin, env);
    }

    await pg(env, "POST", "dm_read_receipts", {
      body: {
        conversation_id: conversationId,
        user_id: userId,
        last_read_at: new Date().toISOString(),
      },
      prefer: "return=representation,resolution=merge-duplicates",
    });

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Mark read error:", err.message);
    return jsonResponse({ error: "Failed to mark read" }, 500, origin, env);
  }
}

// ============================================================
// GET /api/dm/user/:userId - Get user profile
// ============================================================
export async function handleGetUserProfile(request, env, origin, targetUserId) {
  if (!targetUserId || !UUID_RE.test(targetUserId)) {
    return jsonResponse({ error: "Invalid user ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { setCookieHeader } = auth;

  try {
    const profile = await pg(env, "GET", "user_profiles", {
      filter: `id=eq.${targetUserId}`,
      select: "id,display_name",
      single: true,
    });
    if (!profile) {
      return jsonResponse({ error: "User not found" }, 404, origin, env);
    }

    let response = jsonResponse(
      {
        user: { id: profile.id, displayName: profile.display_name },
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Profile error:", err.message);
    return jsonResponse({ error: "Failed to load user" }, 500, origin, env);
  }
}

// ============================================================
// GET /api/dm/conversations/:id/key - Get group encryption key
// ============================================================
export async function handleGetConversationKey(
  request,
  env,
  origin,
  conversationId,
) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse({ error: "Not a member" }, 403, origin, env);
    }

    const keyRow = await pg(env, "GET", "dm_group_keys", {
      filter: `conversation_id=eq.${conversationId}&user_id=eq.${userId}`,
      select: "encrypted_key,key_version",
      single: true,
    });

    let response = jsonResponse(
      {
        encryptedKey: keyRow?.encrypted_key || null,
        keyVersion: keyRow?.key_version || 0,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Get key error:", err.message);
    return jsonResponse({ error: "Failed to get key" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/dm/conversations/:id/key - Set group encryption keys
// ============================================================
export async function handleSetConversationKeys(
  request,
  env,
  origin,
  conversationId,
) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership || membership.role !== "admin") {
      return jsonResponse(
        { error: "Only admins can set keys" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const { memberKeys } = body;
    if (!memberKeys || !Array.isArray(memberKeys)) {
      return jsonResponse({ error: "memberKeys required" }, 400, origin, env);
    }

    // Get current max version
    const existing = await pg(env, "GET", "dm_group_keys", {
      filter: `conversation_id=eq.${conversationId}`,
      select: "key_version",
      order: "key_version.desc",
      limit: 1,
    });
    const newVersion =
      (existing && existing.length > 0 ? existing[0].key_version : 0) + 1;

    // Delete old keys for this conversation
    await pg(env, "DELETE", "dm_group_keys", {
      filter: `conversation_id=eq.${conversationId}`,
    });

    // Insert new keys
    const rows = memberKeys.map((mk) => ({
      conversation_id: conversationId,
      user_id: mk.userId,
      encrypted_key: mk.encryptedKey,
      key_version: newVersion,
    }));
    await pg(env, "POST", "dm_group_keys", { body: rows });

    let response = jsonResponse(
      { success: true, keyVersion: newVersion },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Set keys error:", err.message);
    return jsonResponse({ error: "Failed to set keys" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/dm/conversations/:id/messages/:messageId/reactions
// ============================================================
export async function handleToggleReaction(
  request,
  env,
  origin,
  conversationId,
  messageId,
) {
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(messageId)) {
    return jsonResponse({ error: "Invalid ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `dm-reaction:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many reactions. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse(
        { error: "Not a member of this conversation" },
        403,
        origin,
        env,
      );
    }

    // Verify message exists in this conversation
    const msg = await pg(env, "GET", "direct_messages", {
      filter: `id=eq.${messageId}&conversation_id=eq.${conversationId}`,
      select: "id",
      single: true,
    });
    if (!msg) {
      return jsonResponse({ error: "Message not found" }, 404, origin, env);
    }

    // Parse and validate reaction type
    const body = await request.json();
    const { type } = body;
    if (!type || !VALID_REACTIONS.includes(type)) {
      return jsonResponse(
        {
          error: `Invalid reaction type. Must be one of: ${VALID_REACTIONS.join(", ")}`,
        },
        400,
        origin,
        env,
      );
    }

    // Check if reaction already exists (toggle logic)
    const existing = await pg(env, "GET", "dm_reactions", {
      filter: `message_id=eq.${messageId}&user_id=eq.${userId}&reaction_type=eq.${type}`,
      select: "id",
      single: true,
    });

    let action;
    if (existing) {
      // Remove existing reaction
      await pg(env, "DELETE", "dm_reactions", {
        filter: `id=eq.${existing.id}`,
      });
      action = "removed";
      console.log(
        `[DM] Reaction removed: ${type} on ${messageId} by ${userId}`,
      );
    } else {
      // Add new reaction
      await pg(env, "POST", "dm_reactions", {
        body: {
          message_id: messageId,
          user_id: userId,
          reaction_type: type,
        },
      });
      action = "added";
      console.log(`[DM] Reaction added: ${type} on ${messageId} by ${userId}`);
    }

    // Broadcast reaction change to all conversation members
    try {
      const members =
        (await pg(env, "GET", "dm_conversation_members", {
          filter: `conversation_id=eq.${conversationId}`,
          select: "user_id",
        })) || [];

      const { url, key } = await getSupabaseCredentials(env);

      for (const member of members) {
        if (member.user_id === userId) continue; // Skip self
        await fetch(`${url}/realtime/v1/api/broadcast`, {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: `dm:${member.user_id}`,
            event: "reaction-toggled",
            payload: {
              messageId,
              conversationId,
              userId,
              reactionType: type,
              action,
            },
            private: true,
          }),
        });
      }
    } catch (broadcastErr) {
      console.warn("[DM] Reaction broadcast failed:", broadcastErr.message);
    }

    let response = jsonResponse(
      { success: true, action, type },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Toggle reaction error:", err.message);
    return jsonResponse(
      { error: "Failed to toggle reaction" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/dm/conversations/:id/share-analysis
// ============================================================
// Sends a structured "analysis_share" message to a DM conversation.
// Bypasses URL validation since the analysis reference is stored in metadata.
export async function handleShareAnalysis(
  request,
  env,
  origin,
  conversationId,
) {
  if (!UUID_RE.test(conversationId)) {
    return jsonResponse({ error: "Invalid conversation ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  const { userId, email, userMetadata, setCookieHeader } = auth;

  // Rate limit (same as regular messages)
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `dm:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many messages. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return jsonResponse(
        { error: "Not a member of this conversation" },
        403,
        origin,
        env,
      );
    }

    // Get conversation
    const conv = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });
    if (!conv) {
      return jsonResponse(
        { error: "Conversation not found" },
        404,
        origin,
        env,
      );
    }

    // Block check for direct conversations
    if (conv.type === "direct") {
      const members =
        (await pg(env, "GET", "dm_conversation_members", {
          filter: `conversation_id=eq.${conversationId}`,
          select: "user_id",
        })) || [];
      const partnerId = members.find((m) => m.user_id !== userId)?.user_id;
      if (partnerId) {
        const blockedByMe = await getBlockedUserIds(env, userId);
        if (blockedByMe.has(partnerId)) {
          return jsonResponse(
            { error: "You have blocked this user" },
            403,
            origin,
            env,
          );
        }
        const blockedByThem = await getBlockedUserIds(env, partnerId);
        if (blockedByThem.has(userId)) {
          return jsonResponse(
            { error: "You cannot message this user" },
            403,
            origin,
            env,
          );
        }
      }
    }

    const body = await request.json();
    const {
      analysisId,
      songName,
      artist,
      finalScore,
      classification,
      shareSlug,
    } = body;

    // Validate required fields
    if (!analysisId || !UUID_RE.test(analysisId)) {
      return jsonResponse(
        { error: "Valid analysisId required" },
        400,
        origin,
        env,
      );
    }
    if (!songName || typeof songName !== "string" || songName.length > 200) {
      return jsonResponse(
        { error: "Valid songName required (max 200 chars)" },
        400,
        origin,
        env,
      );
    }
    if (!artist || typeof artist !== "string" || artist.length > 200) {
      return jsonResponse(
        { error: "Valid artist required (max 200 chars)" },
        400,
        origin,
        env,
      );
    }

    // Build display message (plaintext fallback for notifications/previews)
    const displayMessage = `${songName} - ${artist}`;

    // Build metadata
    const metadata = {
      type: "analysis_share",
      analysisId,
      songName,
      artist,
      finalScore: finalScore != null ? Number(finalScore) : null,
      classification: classification || null,
      shareSlug: shareSlug || null,
    };

    // For direct conversations, set recipient_id
    let recipientId = null;
    if (conv.type === "direct") {
      const members =
        (await pg(env, "GET", "dm_conversation_members", {
          filter: `conversation_id=eq.${conversationId}`,
          select: "user_id",
        })) || [];
      recipientId = members.find((m) => m.user_id !== userId)?.user_id || null;
    }

    const insertData = {
      sender_id: userId,
      recipient_id: recipientId,
      conversation_id: conversationId,
      message: displayMessage,
      is_encrypted: false,
      message_type: "analysis_share",
      metadata,
    };

    const dm = await pg(env, "POST", "direct_messages", {
      body: insertData,
      single: true,
    });
    if (!dm) {
      return jsonResponse(
        { error: "Failed to share analysis" },
        500,
        origin,
        env,
      );
    }

    // Update conversation metadata
    const preview = `Shared: ${songName} - ${artist}`;
    await pg(env, "PATCH", "dm_conversations", {
      body: {
        last_message_at: dm.created_at,
        last_message_preview:
          preview.length > 100 ? preview.slice(0, 100) : preview,
        last_sender_id: userId,
      },
      filter: `id=eq.${conversationId}`,
    });

    // Update sender's read receipt
    await pg(env, "POST", "dm_read_receipts", {
      body: {
        conversation_id: conversationId,
        user_id: userId,
        last_read_at: dm.created_at,
      },
      prefer: "return=representation,resolution=merge-duplicates",
    });

    // Push notifications to all other members
    const allMembers =
      (await pg(env, "GET", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}&user_id=neq.${userId}`,
        select: "user_id",
      })) || [];

    const senderName =
      userMetadata?.full_name ||
      userMetadata?.display_name ||
      (email ? email.split("@")[0] : "Someone");

    for (const member of allMembers) {
      sendPushNotification(env, member.user_id, {
        title:
          conv.type === "group"
            ? `${senderName} in ${conv.name || "Group"}`
            : senderName,
        body: `Shared an analysis: ${songName} - ${artist}`,
        url: "/community?tab=messages",
        tag: `dm-${conversationId}`,
        type: "dm",
        senderName: senderName,
      }).catch((err) => console.error("[DM] Push failed:", err.message));
    }

    let response = jsonResponse(
      {
        success: true,
        message: {
          id: dm.id,
          message: dm.message,
          senderId: dm.sender_id,
          conversationId: dm.conversation_id,
          createdAt: dm.created_at,
          isMine: true,
          messageType: "analysis_share",
          metadata,
        },
      },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Share analysis error:", err.message);
    return jsonResponse(
      { error: "Failed to share analysis" },
      500,
      origin,
      env,
    );
  }
}
