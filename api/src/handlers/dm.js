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
import { errorResponse } from "../utils/errorResponse.js";
import { getLocalizedError } from "../utils/i18n-errors.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { getSupabaseCredentials } from "../utils/supabase.js";
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
  const lang = 'en';
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
  }
}

// ============================================================
// POST /api/dm/conversations
// ============================================================
export async function handleCreateConversation(request, env, origin) {
  let lang = 'en';
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `dm-create:${userId}:${ip}`, true);
  if (!rateLimitOk) return errorResponse(env, origin, 'RATE_LIMIT_EXCEEDED', lang);

  try {
    const body = await request.json();
    lang = body.lang || 'en';
    const { type, memberIds, name } = body;

    if (!type || !["direct", "group"].includes(type)) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }
    if (memberIds.some((id) => !UUID_RE.test(id))) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }
    if (memberIds.includes(userId)) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }

    // Block checks
    const blockedByMe = await getBlockedUserIds(env, userId);
    for (const mid of memberIds) {
      if (blockedByMe.has(mid)) {
        return errorResponse(env, origin, 'ACCESS_DENIED', lang);
      }
      const blockedByThem = await getBlockedUserIds(env, mid);
      if (blockedByThem.has(userId)) {
        return errorResponse(env, origin, 'ACCESS_DENIED', lang);
      }
    }

    // For direct: check if conversation already exists
    if (type === "direct") {
      if (memberIds.length !== 1) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
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
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
      if (memberIds.length + 1 > MAX_GROUP_MEMBERS) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
    }

    // Verify all members exist
    const profiles = await pg(env, "GET", "user_profiles", {
      filter: `id=in.(${memberIds.join(",")})`,
      select: "id",
    });
    if (!profiles || profiles.length !== memberIds.length) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
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
      return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  const lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    const url = new URL(request.url);
    const before = url.searchParams.get("before");

    let filter = `conversation_id=eq.${conversationId}`;
    // SECURITY: Validate timestamp format before injecting into PostgREST filter
    if (before) {
      if (!ISO_TIMESTAMP_RE.test(before)) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  let lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, email, userMetadata, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `dm:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return errorResponse(env, origin, 'RATE_LIMIT_EXCEEDED', lang);
  }

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    // Get conversation for type + members
    const conv = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });
    if (!conv) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
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
          return errorResponse(env, origin, 'ACCESS_DENIED', lang);
        }
        const blockedByThem = await getBlockedUserIds(env, partnerId);
        if (blockedByThem.has(userId)) {
          return errorResponse(env, origin, 'ACCESS_DENIED', lang);
        }
      }
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const message = (body.message || "").trim();
    const encryptedContent = body.encrypted_content || null;
    const nonce = body.nonce || null;
    const isEncrypted = !!(encryptedContent && nonce);
    const replyToId = body.reply_to_id || null;
    const isForwarded = body.is_forwarded === true;

    // Validate reply_to_id if provided
    if (replyToId) {
      if (!UUID_RE.test(replyToId)) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
      const replyMsg = await pg(env, "GET", "direct_messages", {
        filter: `id=eq.${replyToId}&conversation_id=eq.${conversationId}`,
        single: true,
      });
      if (!replyMsg) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
    }

    if (isEncrypted) {
      if (encryptedContent.length > MAX_ENCRYPTED_LENGTH) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
    } else {
      if (!message || message.length > MAX_MESSAGE_LENGTH) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
      if (URL_PATTERN.test(message)) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
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
      return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
    for (const member of allMembers) {
      sendPushNotification(env, member.user_id, {
        title: senderName,
        phraseKey: 'sentMessage',
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
  }
}

// ============================================================
// POST /api/dm/conversations/:id/members
// ============================================================
export async function handleAddMembers(request, env, origin, conversationId) {
  let lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    // Verify admin role
    const membership = await getMembership(env, conversationId, userId);
    if (!membership || membership.role !== "admin") {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const { memberIds } = body;
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }
    if (memberIds.some((id) => !UUID_RE.test(id))) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }

    // Check current member count
    const currentMembers =
      (await pg(env, "GET", "dm_conversation_members", {
        filter: `conversation_id=eq.${conversationId}`,
        select: "user_id",
      })) || [];
    if (currentMembers.length + memberIds.length > MAX_GROUP_MEMBERS) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }

    // Filter out already-members
    const existingIds = new Set(currentMembers.map((m) => m.user_id));
    const newIds = memberIds.filter((id) => !existingIds.has(id));
    if (newIds.length === 0) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }

    // Block checks
    const blockedByMe = await getBlockedUserIds(env, userId);
    for (const mid of newIds) {
      if (blockedByMe.has(mid)) {
        return errorResponse(env, origin, 'ACCESS_DENIED', lang);
      }
    }

    // Verify users exist
    const profiles = await pg(env, "GET", "user_profiles", {
      filter: `id=in.(${newIds.join(",")})`,
      select: "id",
    });
    if (!profiles || profiles.length !== newIds.length) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  const lang = 'en';
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(targetUserId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    // Can remove self (leave) or admins can remove non-admins
    const isSelf = targetUserId === userId;
    if (!isSelf && membership.role !== "admin") {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    // Don't let admins remove other admins
    if (!isSelf) {
      const targetMembership = await getMembership(
        env,
        conversationId,
        targetUserId,
      );
      if (!targetMembership) {
        return errorResponse(env, origin, 'NOT_FOUND', lang);
      }
      if (targetMembership.role === "admin") {
        return errorResponse(env, origin, 'ACCESS_DENIED', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  let lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership || membership.role !== "admin") {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const updates = {};
    if (body.name !== undefined)
      updates.name = body.name ? body.name.trim().slice(0, 50) : null;

    if (Object.keys(updates).length === 0) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }

    await pg(env, "PATCH", "dm_conversations", {
      body: updates,
      filter: `id=eq.${conversationId}`,
    });

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[DM] Update conversation error:", err.message);
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  const lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  const lang = 'en';
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(messageId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    // 1. Verify message exists and belongs to sender
    const msg = await pg(env, "GET", "direct_messages", {
      filter: `id=eq.${messageId}&conversation_id=eq.${conversationId}`,
      select: "id,sender_id",
      single: true,
    });
    if (!msg) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
    }
    if (msg.sender_id !== userId) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
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
      return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  let lang = 'en';
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(messageId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    // 1. Verify message exists and belongs to sender
    const msg = await pg(env, "GET", "direct_messages", {
      filter: `id=eq.${messageId}&conversation_id=eq.${conversationId}`,
      select: "id,sender_id,is_encrypted",
      single: true,
    });
    if (!msg) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
    }
    if (msg.sender_id !== userId) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    // 2. Parse and validate new message content
    const body = await request.json();
    lang = body.lang || 'en';
    const newMessage = (body.message || "").trim();
    const encryptedContent = body.encrypted_content || null;
    const nonce = body.nonce || null;
    const isEncrypted = !!(encryptedContent && nonce);

    if (isEncrypted) {
      if (encryptedContent.length > MAX_ENCRYPTED_LENGTH) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
    } else {
      if (!newMessage || newMessage.length > MAX_MESSAGE_LENGTH) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
      }
      if (URL_PATTERN.test(newMessage)) {
        return errorResponse(env, origin, 'INVALID_INPUT', lang);
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
      return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
  }
}

// ============================================================
// POST /api/dm/conversations/:id/read
// ============================================================
export async function handleMarkRead(request, env, origin, conversationId) {
  const lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
  }
}

// ============================================================
// GET /api/dm/user/:userId - Get user profile
// ============================================================
export async function handleGetUserProfile(request, env, origin, targetUserId) {
  const lang = 'en';
  if (!targetUserId || !UUID_RE.test(targetUserId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { setCookieHeader } = auth;

  try {
    const profile = await pg(env, "GET", "user_profiles", {
      filter: `id=eq.${targetUserId}`,
      select: "id,display_name",
      single: true,
    });
    if (!profile) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  const lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  let lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  try {
    const membership = await getMembership(env, conversationId, userId);
    if (!membership || membership.role !== "admin") {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const { memberKeys } = body;
    if (!memberKeys || !Array.isArray(memberKeys)) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  let lang = 'en';
  if (!UUID_RE.test(conversationId) || !UUID_RE.test(messageId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `dm-reaction:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return errorResponse(env, origin, 'RATE_LIMIT_EXCEEDED', lang);
  }

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    // Verify message exists in this conversation
    const msg = await pg(env, "GET", "direct_messages", {
      filter: `id=eq.${messageId}&conversation_id=eq.${conversationId}`,
      select: "id",
      single: true,
    });
    if (!msg) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
    }

    // Parse and validate reaction type
    const body = await request.json();
    lang = body.lang || 'en';
    const { type } = body;
    if (!type || !VALID_REACTIONS.includes(type)) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
  let lang = 'en';
  if (!UUID_RE.test(conversationId)) {
    return errorResponse(env, origin, 'INVALID_INPUT', lang);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return errorResponse(env, origin, 'UNAUTHORIZED', lang);
  const { userId, email, userMetadata, setCookieHeader } = auth;

  // Rate limit (same as regular messages)
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `dm:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return errorResponse(env, origin, 'RATE_LIMIT_EXCEEDED', lang);
  }

  try {
    // Verify membership
    const membership = await getMembership(env, conversationId, userId);
    if (!membership) {
      return errorResponse(env, origin, 'ACCESS_DENIED', lang);
    }

    // Get conversation
    const conv = await pg(env, "GET", "dm_conversations", {
      filter: `id=eq.${conversationId}`,
      single: true,
    });
    if (!conv) {
      return errorResponse(env, origin, 'NOT_FOUND', lang);
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
          return errorResponse(env, origin, 'ACCESS_DENIED', lang);
        }
        const blockedByThem = await getBlockedUserIds(env, partnerId);
        if (blockedByThem.has(userId)) {
          return errorResponse(env, origin, 'ACCESS_DENIED', lang);
        }
      }
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const {
      analysisId,
      songName,
      artist,
      philosophicalNote,
      classification,
      shareSlug,
    } = body;

    // Validate required fields
    if (!analysisId || !UUID_RE.test(analysisId)) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }
    if (!songName || typeof songName !== "string" || songName.length > 200) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }
    if (!artist || typeof artist !== "string" || artist.length > 200) {
      return errorResponse(env, origin, 'INVALID_INPUT', lang);
    }

    // Build display message (plaintext fallback for notifications/previews)
    const displayMessage = `${songName} - ${artist}`;

    // Build metadata
    const metadata = {
      type: "analysis_share",
      analysisId,
      songName,
      artist,
      philosophicalNote: philosophicalNote || null,
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
      return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
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
    return errorResponse(env, origin, 'INTERNAL_ERROR', lang);
  }
}
