// ============================================================
// HANDLER - THE UNDERGROUND (Anonymous Confessions)
// ============================================================
// Anonymous posts with reactions. Requires unlocked access (3 credits).
//
// ENCRYPTION — MODO A (at-rest + pseudonymity, NOT E2E):
// - Every post is encrypted with a single ROOM KEY held by the worker
//   (KEK-wrapped at rest). The server stores ciphertext only.
// - The room key is delivered in cleartext over TLS to any authenticated
//   access-holder on GET (see utils/roomKey.js). No per-member keys, no
//   distribution, no fingerprint, no rekey.
// - Moderation decrypts a post server-side via the KEK on demand (admin
//   path), audited in underground_moderation_log.

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { getServiceSupabase } from "../utils/supabase.js";
import { checkRateLimit } from "../rate-limit/index.js";
import { getLocalizedError } from "../utils/i18n-errors.js";
import { getSecret } from "../utils/secrets.js";
import {
  getRoomKeyForDelivery,
  decryptUndergroundCiphertext,
} from "../utils/roomKey.js";

const MAX_ENCRYPTED_LENGTH = 4000;
const MAX_NONCE_LENGTH = 200;
const MAX_REASON_LENGTH = 500;       // mirrors underground_reports CHECK
const PAGE_SIZE = 30;
const VALID_REACTIONS = ["fire", "think", "heart", "skull"];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NICKNAME_REGEX = /^[a-zA-Z0-9]{3,12}$/;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

// Constant-time string comparison via SHA-256 digests — avoids leaking the
// admin secret through early-exit string-comparison timing.
async function constantTimeEqual(a, b) {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(String(a))),
    crypto.subtle.digest("SHA-256", enc.encode(String(b))),
  ]);
  const va = new Uint8Array(da);
  const vb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

// Admin allowlist for the authenticated-session moderation path. ADMIN_USER_IDS
// is a comma/whitespace-separated list of user UUIDs (Secrets Store). Empty/unset
// → no session admins (the x-admin-secret automation path still works).
async function isAdminUser(env, userId) {
  if (!userId) return false;
  const raw = await getSecret(env.ADMIN_USER_IDS);
  if (!raw) return false;
  const ids = String(raw)
    .split(/[\s,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return ids.includes(String(userId).toLowerCase());
}

// ============================================================
// GET /api/underground - List anonymous posts
// ============================================================
export async function handleGetUndergroundPosts(request, env, origin) {
  let lang = 'en';
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse(
      { error: getLocalizedError('UNAUTHORIZED', lang) },
      401,
      origin,
      env,
    );
  }

  const { client: supabase, userId, setCookieHeader } = auth;
  const url = new URL(request.url);
  const before = url.searchParams.get("before");
  lang = url.searchParams.get("lang") || 'en';

  try {
    // Check access and nickname
    const { data: access } = await supabase
      .from("space_access")
      .select("id, nickname")
      .eq("user_id", userId)
      .eq("space", "underground")
      .maybeSingle();

    if (!access) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_ACCESS_REQUIRED', lang) },
        403,
        origin,
        env,
      );
    }

    // If no nickname set, prompt user to set one
    if (!access.nickname) {
      let response = jsonResponse({ needsNickname: true }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // Fetch posts (show nickname, not user_id)
    let query = supabase
      .from("underground_posts")
      .select(
        "id, nickname, content, encrypted_content, nonce, is_encrypted, created_at, edited_at, reply_to_id, reaction_fire, reaction_think, reaction_heart, reaction_skull",
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (before) {
      if (!ISO_TIMESTAMP_RE.test(before)) {
        return jsonResponse(
          { error: getLocalizedError('INVALID_CURSOR', lang) },
          400,
          origin,
          env,
        );
      }
      query = query.lt("created_at", before);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error("[Underground] Failed to fetch posts:", error.message);
      return jsonResponse(
        { error: getLocalizedError('FAILED_TO_LOAD_POSTS', lang) },
        500,
        origin,
        env,
      );
    }

    // Get user's reactions for these posts
    const postIds = (posts || []).map((p) => p.id);
    let userReactions = [];

    if (postIds.length > 0) {
      const { data: reactions } = await supabase
        .from("underground_reactions")
        .select("post_id, reaction")
        .eq("user_id", userId)
        .in("post_id", postIds);

      userReactions = reactions || [];
    }

    // Fetch reply previews for posts that are replies
    const replyIds = (posts || [])
      .filter((p) => p.reply_to_id)
      .map((p) => p.reply_to_id);
    let replyPreviews = {};

    if (replyIds.length > 0) {
      const uniqueReplyIds = [...new Set(replyIds)];
      const { data: replyPosts } = await supabase
        .from("underground_posts")
        .select("id, nickname, content, is_encrypted")
        .in("id", uniqueReplyIds);

      if (replyPosts) {
        replyPreviews = Object.fromEntries(
          replyPosts.map((r) => [
            r.id,
            {
              id: r.id,
              nickname: r.nickname,
              content: r.is_encrypted
                ? "[Encrypted]"
                : r.content?.slice(0, 100) || "",
            },
          ]),
        );
      }
    }

    // Attach user's reactions to posts and include encryption info
    const postsWithReactions = (posts || []).map((p) => ({
      id: p.id,
      nickname: p.nickname,
      content: p.is_encrypted ? null : p.content,
      encryptedContent: p.is_encrypted ? p.encrypted_content : null,
      nonce: p.is_encrypted ? p.nonce : null,
      isEncrypted: p.is_encrypted || false,
      createdAt: p.created_at,
      editedAt: p.edited_at || null,
      replyToId: p.reply_to_id || null,
      replyPreview: p.reply_to_id ? replyPreviews[p.reply_to_id] || null : null,
      reactionFire: p.reaction_fire,
      reactionThink: p.reaction_think,
      reactionHeart: p.reaction_heart,
      reactionSkull: p.reaction_skull,
      myReactions: userReactions
        .filter((r) => r.post_id === p.id)
        .map((r) => r.reaction),
    }));

    // MODO A: deliver the worker-held room key (KEK-wrapped at rest) to any
    // authenticated access-holder over TLS. Bootstraps the room on first
    // access. Best-effort: a delivery failure must NOT take down the feed —
    // degrade to roomKey:null (client surfaces a transient error, retries).
    let roomKey = null;
    try {
      roomKey = await getRoomKeyForDelivery(env);
    } catch (keyErr) {
      console.error(
        "[Underground] room key delivery failed (non-fatal):",
        keyErr.message,
        keyErr.stack,
      );
    }

    let response = jsonResponse(
      {
        posts: postsWithReactions,
        myNickname: access.nickname,
        roomKey,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] List exception:", err.message, err.stack);
    return jsonResponse(
      { error: getLocalizedError('FAILED_TO_LOAD_POSTS', lang) },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/underground - Create anonymous post
// ============================================================
export async function handleCreateUndergroundPost(request, env, origin) {
  let lang = 'en';
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse(
      { error: getLocalizedError('UNAUTHORIZED', lang) },
      401,
      origin,
      env,
    );
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `underground-post:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: getLocalizedError('TOO_MANY_POSTS', lang) },
      429,
      origin,
      env,
    );
  }

  try {
    // Check access and nickname
    const { data: access } = await supabase
      .from("space_access")
      .select("id, nickname")
      .eq("user_id", userId)
      .eq("space", "underground")
      .maybeSingle();

    if (!access) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_ACCESS_REQUIRED', lang) },
        403,
        origin,
        env,
      );
    }

    if (!access.nickname) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_SET_NICKNAME_FIRST', lang) },
        400,
        origin,
        env,
      );
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const encryptedContent = body.encrypted_content || null;
    const nonce = body.nonce || null;
    const replyToId = body.reply_to_id || null;

    // E2E only (design §2.7): the Underground stores ciphertext exclusively.
    if (
      !encryptedContent ||
      !nonce ||
      typeof encryptedContent !== "string" ||
      typeof nonce !== "string"
    ) {
      return jsonResponse(
        { error: "Encrypted content required", code: "E2E_REQUIRED" },
        400,
        origin,
        env,
      );
    }
    if (
      encryptedContent.length > MAX_ENCRYPTED_LENGTH ||
      nonce.length > MAX_NONCE_LENGTH
    ) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_ENCRYPTED_CONTENT_TOO_LARGE', lang) },
        400,
        origin,
        env,
      );
    }

    // Validate reply_to_id if provided
    if (replyToId) {
      if (!UUID_REGEX.test(replyToId)) {
        return jsonResponse(
          { error: getLocalizedError('INVALID_POST_ID', lang) },
          400,
          origin,
          env,
        );
      }
      const { data: replyTarget } = await supabase
        .from("underground_posts")
        .select("id")
        .eq("id", replyToId)
        .single();
      if (!replyTarget) {
        return jsonResponse(
          { error: getLocalizedError('CHAT_REPLY_NOT_FOUND', lang) },
          400,
          origin,
          env,
        );
      }
    }

    const insertData = {
      user_id: userId,
      nickname: access.nickname,
      content: null,
      encrypted_content: encryptedContent,
      nonce: nonce,
      is_encrypted: true,
      reply_to_id: replyToId,
    };

    const { data: post, error } = await supabase
      .from("underground_posts")
      .insert(insertData)
      .select(
        "id, nickname, content, encrypted_content, nonce, is_encrypted, created_at, edited_at, reply_to_id, reaction_fire, reaction_think, reaction_heart, reaction_skull",
      )
      .single();

    if (error) {
      console.error("[Underground] Create failed:", error.message);
      return jsonResponse(
        { error: getLocalizedError('FAILED_TO_CREATE_POST', lang) },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse(
      {
        success: true,
        post: {
          id: post.id,
          nickname: post.nickname,
          content: post.is_encrypted ? null : post.content,
          encryptedContent: post.is_encrypted ? post.encrypted_content : null,
          nonce: post.is_encrypted ? post.nonce : null,
          isEncrypted: post.is_encrypted || false,
          createdAt: post.created_at,
          editedAt: post.edited_at || null,
          replyToId: post.reply_to_id || null,
          replyPreview: null, // Caller already knows what they're replying to
          reactionFire: post.reaction_fire,
          reactionThink: post.reaction_think,
          reactionHeart: post.reaction_heart,
          reactionSkull: post.reaction_skull,
          myReactions: [],
        },
      },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] Create exception:", err.message, err.stack);
    return jsonResponse(
      { error: getLocalizedError('FAILED_TO_CREATE_POST', lang) },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/underground/:id/react - Toggle reaction
// ============================================================
export async function handleUndergroundReaction(request, env, origin, postId) {
  let lang = 'en';
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse(
      { error: getLocalizedError('UNAUTHORIZED', lang) },
      401,
      origin,
      env,
    );
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  // Validate postId is a valid UUID
  if (!postId || !UUID_REGEX.test(postId)) {
    return jsonResponse(
      { error: getLocalizedError('INVALID_POST_ID', lang) },
      400,
      origin,
      env,
    );
  }

  // Rate limit reactions to prevent spam/manipulation
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `underground-react:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: getLocalizedError('TOO_MANY_REACTIONS', lang) },
      429,
      origin,
      env,
    );
  }

  try {
    // Check access
    const { data: access } = await supabase
      .from("space_access")
      .select("id")
      .eq("user_id", userId)
      .eq("space", "underground")
      .maybeSingle();

    if (!access) {
      return jsonResponse(
        { error: getLocalizedError('ACCESS_REQUIRED', lang) },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const reaction = (body.reaction || "").toLowerCase();

    if (!VALID_REACTIONS.includes(reaction)) {
      return jsonResponse(
        { error: getLocalizedError('INVALID_REACTION', lang) },
        400,
        origin,
        env,
      );
    }

    // Check if reaction exists
    const { data: existing } = await supabase
      .from("underground_reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("reaction", reaction)
      .maybeSingle();

    const reactionColumn = `reaction_${reaction}`;

    if (existing) {
      // Remove reaction
      await supabase
        .from("underground_reactions")
        .delete()
        .eq("id", existing.id);

      // Decrement count atomically using RPC
      await supabase.rpc("decrement_underground_reaction", {
        p_post_id: postId,
        p_reaction: reaction,
      });

      let response = jsonResponse(
        { success: true, action: "removed", reaction },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } else {
      // Add reaction
      const { error: insertError } = await supabase
        .from("underground_reactions")
        .insert({
          post_id: postId,
          user_id: userId,
          reaction,
        });

      if (insertError) {
        console.error(
          "[Underground] Reaction insert failed:",
          insertError.message,
        );
        return jsonResponse(
          { error: getLocalizedError('FAILED_TO_ADD_REACTION', lang) },
          500,
          origin,
          env,
        );
      }

      // Increment count atomically using RPC
      await supabase.rpc("increment_underground_reaction", {
        p_post_id: postId,
        p_reaction: reaction,
      });

      let response = jsonResponse(
        { success: true, action: "added", reaction },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }
  } catch (err) {
    console.error("[Underground] Reaction exception:", err.message);
    return jsonResponse(
      { error: getLocalizedError('FAILED_TO_PROCESS_REACTION', lang) },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// DELETE /api/underground/:id - Delete own post
// ============================================================
export async function handleDeleteUndergroundPost(
  request,
  env,
  origin,
  postId,
) {
  let lang = 'en';
  // Validate postId is a valid UUID
  if (!postId || !UUID_REGEX.test(postId)) {
    return jsonResponse(
      { error: getLocalizedError('INVALID_POST_ID', lang) },
      400,
      origin,
      env,
    );
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse(
      { error: getLocalizedError('UNAUTHORIZED', lang) },
      401,
      origin,
      env,
    );
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership (RLS should handle this, but double-check)
    const { data: post } = await supabase
      .from("underground_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return jsonResponse(
        { error: getLocalizedError('POST_NOT_FOUND', lang) },
        404,
        origin,
        env,
      );
    }

    if (post.user_id !== userId) {
      return jsonResponse(
        { error: getLocalizedError('CHAT_DELETE_OWN_ONLY', lang) },
        403,
        origin,
        env,
      );
    }

    const { error } = await supabase
      .from("underground_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("[Underground] Delete failed:", error.message);
      return jsonResponse(
        { error: getLocalizedError('CHAT_DELETE_FAILED', lang) },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] Delete exception:", err.message);
    return jsonResponse(
      { error: getLocalizedError('CHAT_DELETE_FAILED', lang) },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// PATCH /api/underground/:id - Edit own post
// ============================================================
export async function handleEditUndergroundPost(request, env, origin, postId) {
  let lang = 'en';
  if (!postId || !UUID_REGEX.test(postId)) {
    return jsonResponse(
      { error: getLocalizedError('INVALID_POST_ID', lang) },
      400,
      origin,
      env,
    );
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse(
      { error: getLocalizedError('UNAUTHORIZED', lang) },
      401,
      origin,
      env,
    );
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership
    const { data: post } = await supabase
      .from("underground_posts")
      .select("id, user_id, is_encrypted")
      .eq("id", postId)
      .single();

    if (!post) {
      return jsonResponse(
        { error: getLocalizedError('POST_NOT_FOUND', lang) },
        404,
        origin,
        env,
      );
    }

    if (post.user_id !== userId) {
      return jsonResponse(
        { error: getLocalizedError('CHAT_EDIT_OWN_ONLY', lang) },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const encryptedContent = body.encrypted_content || null;
    const nonce = body.nonce || null;

    // E2E only (design §2.7): same rule as create.
    if (
      !encryptedContent ||
      !nonce ||
      typeof encryptedContent !== "string" ||
      typeof nonce !== "string"
    ) {
      return jsonResponse(
        { error: "Encrypted content required", code: "E2E_REQUIRED" },
        400,
        origin,
        env,
      );
    }
    if (
      encryptedContent.length > MAX_ENCRYPTED_LENGTH ||
      nonce.length > MAX_NONCE_LENGTH
    ) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_ENCRYPTED_CONTENT_TOO_LARGE', lang) },
        400,
        origin,
        env,
      );
    }

    const updateData = {
      content: null,
      encrypted_content: encryptedContent,
      nonce: nonce,
      is_encrypted: true,
      edited_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from("underground_posts")
      .update(updateData)
      .eq("id", postId)
      .select(
        "id, nickname, content, encrypted_content, nonce, is_encrypted, created_at, edited_at, reaction_fire, reaction_think, reaction_heart, reaction_skull",
      )
      .single();

    if (error || !updated) {
      console.error("[Underground] Edit failed:", error?.message);
      return jsonResponse(
        { error: getLocalizedError('CHAT_EDIT_FAILED', lang) },
        500,
        origin,
        env,
      );
    }

    console.log("[Underground] Post edited:", postId);

    let response = jsonResponse(
      {
        success: true,
        post: {
          id: updated.id,
          nickname: updated.nickname,
          content: updated.is_encrypted ? null : updated.content,
          encryptedContent: updated.is_encrypted
            ? updated.encrypted_content
            : null,
          nonce: updated.is_encrypted ? updated.nonce : null,
          isEncrypted: updated.is_encrypted || false,
          createdAt: updated.created_at,
          editedAt: updated.edited_at,
        },
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] Edit exception:", err.message, err.stack);
    return jsonResponse(
      { error: getLocalizedError('CHAT_EDIT_FAILED', lang) },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/underground/nickname - Set Underground nickname
// ============================================================
export async function handleSetUndergroundNickname(request, env, origin) {
  let lang = 'en';
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse(
      { error: getLocalizedError('UNAUTHORIZED', lang) },
      401,
      origin,
      env,
    );
  }

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Check access exists
    const { data: access } = await supabase
      .from("space_access")
      .select("id, nickname")
      .eq("user_id", userId)
      .eq("space", "underground")
      .maybeSingle();

    if (!access) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_ACCESS_REQUIRED', lang) },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    lang = body.lang || 'en';
    const nickname = (body.nickname || "").trim();

    // Validate nickname format: 3-12 chars, alphanumeric only
    if (!nickname || !NICKNAME_REGEX.test(nickname)) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_INVALID_NICKNAME', lang) },
        400,
        origin,
        env,
      );
    }

    // Check if nickname is already taken
    const { data: existing } = await supabase
      .from("space_access")
      .select("id")
      .eq("space", "underground")
      .eq("nickname", nickname)
      .neq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_NICKNAME_TAKEN', lang) },
        409,
        origin,
        env,
      );
    }

    // Update nickname
    const { error } = await supabase
      .from("space_access")
      .update({ nickname })
      .eq("id", access.id);

    if (error) {
      console.error("[Underground] Set nickname failed:", error.message);
      return jsonResponse(
        { error: getLocalizedError('UNDERGROUND_NICKNAME_SET_FAILED', lang) },
        500,
        origin,
        env,
      );
    }

    console.log(`[Underground] User ${userId} set nickname: ${nickname}`);

    let response = jsonResponse({ success: true, nickname }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] Set nickname exception:", err.message);
    return jsonResponse(
      { error: getLocalizedError('UNDERGROUND_NICKNAME_SET_FAILED', lang) },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// (MODO A) Removidos: getKeyedAccess + room-init + pending-keys +
// distribute-keys + rekey. O worker passou a deter a chave única da
// sala (utils/roomKey.js); não há mais chaves por membro, distribuição,
// fingerprint nem rekey.
// ============================================================

// ============================================================
// POST /api/underground/report — MODO A: {post_id, reason}.
// No voluntary plaintext (the worker decrypts on demand via the KEK on
// the moderation path). reporter_id is recorded: false reports are
// traceable.
// ============================================================
export async function handleUndergroundReport(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  // Rate limit padrão do worker (texto livre no body)
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `underground-report:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  try {
    const service = await getServiceSupabase(env);

    // Reporter must be a member (they can read the post in-app)
    const { data: accessRows } = await service
      .from("space_access")
      .select("id", { filter: `user_id=eq.${userId}&space=eq.underground`, limit: 1 });
    const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
    if (!access) {
      return jsonResponse(
        { error: "Underground access required", code: "ACCESS_REQUIRED" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const postId = body.post_id;
    const reason = (body.reason || "").trim();

    if (!postId || !UUID_REGEX.test(postId)) {
      return jsonResponse({ error: "Invalid post id" }, 400, origin, env);
    }
    if (!reason || reason.length > MAX_REASON_LENGTH) {
      return jsonResponse({ error: "Reason required (max 500 chars)" }, 400, origin, env);
    }

    // Resolve the reported author for the record (best-effort).
    const { data: postRows } = await service
      .from("underground_posts")
      .select("id, user_id", { filter: `id=eq.${postId}`, limit: 1 });
    const post = Array.isArray(postRows) ? postRows[0] : postRows;
    if (!post) {
      return jsonResponse({ error: "Post not found" }, 404, origin, env);
    }

    const { error: insertError } = await service.from("underground_reports").insert({
      post_id: postId,
      reporter_id: userId,
      reported_user_id: post.user_id || null,
      reason,
    });
    if (insertError) {
      console.error("[Underground] report insert failed:", insertError.message);
      return jsonResponse({ error: "Failed to submit report" }, 500, origin, env);
    }

    console.log(`[Underground] Report filed on post ${postId} by ${userId}`);
    let response = jsonResponse({ success: true }, 201, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] report exception:", err.message, err.stack);
    return jsonResponse({ error: "Failed to submit report" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/admin/decrypt — moderation (MODO A §5)
// Admin-only (ADMIN_SECRET via x-admin-secret header). Decrypts ONE
// post by id via the KEK, returns plaintext + authorship, and writes an
// audit row to underground_moderation_log. Rate limited. ANY failure
// (bad secret, missing post, decrypt error) → 404 bland (no detail),
// matching the existing security pattern.
// ============================================================
export async function handleUndergroundAdminDecrypt(request, env, origin) {
  const bland = () => jsonResponse({ error: "Not found" }, 404, origin, env);
  try {
    // Rate limit by IP (applies to both auth paths).
    const ip = request.headers.get("cf-connecting-ip") || "unknown";
    const rateLimitOk = await checkRateLimit(env, `underground-admin-decrypt:${ip}`, true);
    if (!rateLimitOk) return bland();

    // Two accepted admin identities → an `actor` string for the audit row:
    //  (1) authenticated session whose user_id is in ADMIN_USER_IDS (browser path,
    //      no secret in the client), or (2) x-admin-secret === ADMIN_SECRET
    //      (automation). Neither → 404 bland.
    let actor = null;
    let viaSecret = false;
    let setCookieHeader = null;

    const auth = await getSupabaseForUser(request, env).catch(() => null);
    if (auth?.userId && (await isAdminUser(env, auth.userId))) {
      actor = auth.email || auth.userId; // verified identity — never from body
      setCookieHeader = auth.setCookieHeader || null;
    } else {
      const provided = request.headers.get("x-admin-secret") || "";
      const adminSecret = await getSecret(env.ADMIN_SECRET);
      if (adminSecret && (await constantTimeEqual(provided, adminSecret))) {
        viaSecret = true;
      }
    }
    if (!actor && !viaSecret) return bland();

    const body = await request.json().catch(() => ({}));
    const postId = body.post_id;
    const reportId = body.report_id || null;
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : null;
    // Automation may name its actor; the session path is already the verified admin.
    if (viaSecret) {
      actor =
        typeof body.actor === "string" && body.actor
          ? body.actor.slice(0, 200)
          : "admin";
    }
    if (!postId || !UUID_REGEX.test(postId)) return bland();
    if (reportId && !UUID_REGEX.test(reportId)) return bland();

    const service = await getServiceSupabase(env);
    const { data: postRows } = await service
      .from("underground_posts")
      .select("id, user_id, nickname, encrypted_content, nonce, created_at", {
        filter: `id=eq.${postId}`,
        limit: 1,
      });
    const post = Array.isArray(postRows) ? postRows[0] : postRows;
    if (!post || !post.encrypted_content || !post.nonce) return bland();

    let plaintext;
    try {
      plaintext = await decryptUndergroundCiphertext(
        env,
        post.encrypted_content,
        post.nonce,
      );
    } catch {
      return bland();
    }

    // Audit: table row + worker log.
    await service.from("underground_moderation_log").insert({
      post_id: postId,
      report_id: reportId,
      reason,
      actor,
    });
    console.log(
      `[Underground] MODERATION decrypt post ${postId} by ${actor} (report ${reportId || "-"})`,
    );

    const response = jsonResponse(
      {
        post_id: post.id,
        user_id: post.user_id,
        nickname: post.nickname,
        created_at: post.created_at,
        plaintext,
      },
      200,
      origin,
      env,
    );
    return setCookieHeader
      ? addRefreshedCookieToResponse(response, setCookieHeader)
      : response;
  } catch (err) {
    console.error("[Underground] admin decrypt exception:", err.message, err.stack);
    return bland();
  }
}
