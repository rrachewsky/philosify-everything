// ============================================================
// HANDLER - THE UNDERGROUND (Anonymous Confessions)
// ============================================================
// Anonymous posts with reactions. Requires unlocked access (3 credits).
//
// E2E ENCRYPTION (mandatory — pacote pré-privacy item 5):
// - Every post is encrypted with the shared room key; plaintext is
//   rejected (E2E_REQUIRED). The server stores ciphertext only.
// - The room key lives exclusively in members' browsers; the server
//   holds per-member wrapped copies (space_access.encrypted_room_key)
//   and the key fingerprint (underground_room) — never the key.
// - Reports carry voluntary plaintext decrypted by the REPORTER's
//   browser, verified against the stored ciphertext (design §2.8).

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { getServiceSupabase } from "../utils/supabase.js";
import { checkRateLimit } from "../rate-limit/index.js";
import { getLocalizedError } from "../utils/i18n-errors.js";

const MAX_ENCRYPTED_LENGTH = 4000;
const MAX_NONCE_LENGTH = 200;
const MAX_REASON_LENGTH = 500;       // mirrors underground_reports CHECK
const MAX_REPORT_PLAINTEXT = 10000;  // mirrors underground_reports CHECK
const MAX_WRAPPED_KEY_LENGTH = 512;
const FINGERPRINT_REGEX = /^[0-9a-f]{64}$/i;
const PENDING_BATCH = 50;
const PAGE_SIZE = 30;
const VALID_REACTIONS = ["fire", "think", "heart", "skull"];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NICKNAME_REGEX = /^[a-zA-Z0-9]{3,12}$/;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

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
      .select("id, nickname, encrypted_room_key")
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

    // Room meta (service client: underground_room is service_role-only).
    // roomInitialized=false → this client may run room-init (design §2.2).
    const service = await getServiceSupabase(env);
    const { data: roomRows } = await service
      .from("underground_room")
      .select("key_fingerprint", { limit: 1 });
    const room = Array.isArray(roomRows) ? roomRows[0] : roomRows;

    // Include encrypted room key if available
    let response = jsonResponse(
      {
        posts: postsWithReactions,
        myNickname: access.nickname,
        encryptedRoomKey: access.encrypted_room_key || null,
        roomInitialized: !!room,
        roomFingerprint: room?.key_fingerprint || null,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] List exception:", err.message);
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
    console.error("[Underground] Create exception:", err.message);
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
    console.error("[Underground] Edit exception:", err.message);
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
// Reforço 1 (OK final): only an access-holder that ALREADY holds a
// wrapped room key may list pending members or distribute copies.
// Returns the caller's access row via the service client, or null.
// ============================================================
async function getKeyedAccess(service, userId) {
  const { data: rows } = await service
    .from("space_access")
    .select("id, encrypted_room_key", {
      filter: `user_id=eq.${userId}&space=eq.underground`,
      limit: 1,
    });
  const access = Array.isArray(rows) ? rows[0] : rows;
  if (!access || !access.encrypted_room_key) return null;
  return access;
}

// ============================================================
// POST /api/underground/room-init — nascimento da sala (design §2.2)
// O INSERT na meta (PK fixa id=1) é o árbitro atômico da corrida:
// conflito (409 do PostgREST) = perdeu; o perdedor NÃO grava nada e
// recebe o fingerprint vencedor para cair no estado pendente.
// ============================================================
export async function handleUndergroundRoomInit(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  // Reforço 2: rate limit padrão do worker
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `underground-roominit:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  try {
    const body = await request.json();
    const fingerprint = (body.fingerprint || "").toLowerCase();
    const encryptedKey = body.encryptedKey || null;

    if (!FINGERPRINT_REGEX.test(fingerprint)) {
      return jsonResponse({ error: "Invalid fingerprint" }, 400, origin, env);
    }
    if (
      !encryptedKey ||
      typeof encryptedKey !== "string" ||
      encryptedKey.length > MAX_WRAPPED_KEY_LENGTH
    ) {
      return jsonResponse({ error: "Invalid encrypted key" }, 400, origin, env);
    }

    const service = await getServiceSupabase(env);

    // Must be an access-holder (any; keyed or pending)
    const { data: accessRows } = await service
      .from("space_access")
      .select("id, encrypted_room_key", {
        filter: `user_id=eq.${userId}&space=eq.underground`,
        limit: 1,
      });
    const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
    if (!access) {
      return jsonResponse(
        { error: "Underground access required", code: "ACCESS_REQUIRED" },
        403,
        origin,
        env,
      );
    }

    // The arbiter: fixed-PK insert; PostgREST 409 = lost the race
    const { error: insertError } = await service.from("underground_room").insert({
      id: 1,
      key_fingerprint: fingerprint,
      created_by: userId,
    });

    if (insertError) {
      if (insertError.status === 409) {
        const { data: metaRows } = await service
          .from("underground_room")
          .select("key_fingerprint", { limit: 1 });
        const meta = Array.isArray(metaRows) ? metaRows[0] : metaRows;

        // Auto-cura do vencedor órfão (ajuste do OK, 29/08): se a meta
        // carrega EXATAMENTE o fingerprint enviado e o chamador segue sem
        // cópia, a falha anterior ficou entre o INSERT da meta e a gravação
        // da cópia — sem isto a sala nasceria com zero membros chaveados
        // (morta para sempre). Escrita restrita à PRÓPRIA linha e só onde
        // NULL: pior caso é auto-DoS, curado por rekey.
        if (
          meta?.key_fingerprint === fingerprint &&
          !access.encrypted_room_key
        ) {
          await service
            .from("space_access")
            .update(
              { encrypted_room_key: encryptedKey, key_distributed_by: userId },
              `user_id=eq.${userId}&space=eq.underground&encrypted_room_key=is.null`,
            );
          console.log(`[Underground] room-init orphan-winner self-heal for ${userId}`);
        }

        let response = jsonResponse(
          { winner: false, fingerprint: meta?.key_fingerprint || null },
          200,
          origin,
          env,
        );
        return addRefreshedCookieToResponse(response, setCookieHeader);
      }
      console.error("[Underground] room-init failed:", insertError.message);
      return jsonResponse({ error: "Failed to initialize room" }, 500, origin, env);
    }

    // Winner: store own wrapped copy
    const { error: keyError } = await service
      .from("space_access")
      .update(
        { encrypted_room_key: encryptedKey, key_distributed_by: userId },
        `user_id=eq.${userId}&space=eq.underground`,
      );
    if (keyError) {
      console.error("[Underground] room-init key write failed:", keyError.message);
      return jsonResponse({ error: "Failed to store room key" }, 500, origin, env);
    }

    console.log(`[Underground] Room initialized by ${userId}`);
    let response = jsonResponse({ winner: true, fingerprint }, 201, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] room-init exception:", err.message);
    return jsonResponse({ error: "Failed to initialize room" }, 500, origin, env);
  }
}

// ============================================================
// GET /api/underground/pending-keys — pendentes + públicas (design §2.3)
// Reforço 1: 403 se o chamador não for membro COM chave.
// ============================================================
export async function handleUndergroundPendingKeys(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  try {
    const service = await getServiceSupabase(env);

    const keyed = await getKeyedAccess(service, userId);
    if (!keyed) {
      return jsonResponse(
        { error: "Keyed membership required", code: "NOT_KEYED_MEMBER" },
        403,
        origin,
        env,
      );
    }

    const { data: pendingRows } = await service
      .from("space_access")
      .select("user_id", {
        filter: "space=eq.underground&encrypted_room_key=is.null",
        limit: PENDING_BATCH,
      });
    const pending = (pendingRows || []).map((r) => r.user_id).filter(Boolean);

    if (pending.length === 0) {
      let response = jsonResponse({ pending: [] }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // Only pendings with a registered public key can receive a wrap
    const { data: keyRows } = await service
      .from("user_public_keys")
      .select("user_id, public_key", {
        filter: `user_id=in.(${pending.join(",")})`,
      });

    let response = jsonResponse(
      {
        pending: (keyRows || []).map((k) => ({
          userId: k.user_id,
          publicKey: k.public_key,
        })),
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] pending-keys exception:", err.message);
    return jsonResponse({ error: "Failed to list pending members" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/distribute-keys — grava cópias (design §2.3)
// Reforço 1: 403 se o chamador não for membro COM chave.
// Só preenche onde encrypted_room_key IS NULL — nunca sobrescreve
// (sobrescrita seria vetor de DoS); audita key_distributed_by.
// ============================================================
export async function handleUndergroundDistributeKeys(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  try {
    const service = await getServiceSupabase(env);

    const keyed = await getKeyedAccess(service, userId);
    if (!keyed) {
      return jsonResponse(
        { error: "Keyed membership required", code: "NOT_KEYED_MEMBER" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const keys = body.keys;
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > PENDING_BATCH) {
      return jsonResponse({ error: "keys array required (1-50)" }, 400, origin, env);
    }

    let attempted = 0;
    for (const entry of keys) {
      const targetId = entry?.userId;
      const encryptedKey = entry?.encryptedKey;
      if (!targetId || !UUID_REGEX.test(targetId)) continue;
      if (
        !encryptedKey ||
        typeof encryptedKey !== "string" ||
        encryptedKey.length > MAX_WRAPPED_KEY_LENGTH
      ) continue;

      // Fill only where NULL — never overwrite an existing copy
      await service
        .from("space_access")
        .update(
          { encrypted_room_key: encryptedKey, key_distributed_by: userId },
          `user_id=eq.${targetId}&space=eq.underground&encrypted_room_key=is.null`,
        );
      attempted++;
    }

    console.log(`[Underground] ${userId} distributed keys to ${attempted} pending member(s)`);
    let response = jsonResponse({ success: true, distributed: attempted }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] distribute-keys exception:", err.message);
    return jsonResponse({ error: "Failed to distribute keys" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/rekey — recuperação (design §2.6)
// NULLa a PRÓPRIA cópia; o membro volta ao pool de pendentes.
// ============================================================
export async function handleUndergroundRekey(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  // Reforço 2: rate limit padrão do worker
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `underground-rekey:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  try {
    const service = await getServiceSupabase(env);

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

    const { error } = await service
      .from("space_access")
      .update(
        { encrypted_room_key: null, key_distributed_by: null },
        `user_id=eq.${userId}&space=eq.underground`,
      );
    if (error) {
      console.error("[Underground] rekey failed:", error.message);
      return jsonResponse({ error: "Failed to reset key" }, 500, origin, env);
    }

    console.log(`[Underground] ${userId} requested rekey (back to pending pool)`);
    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] rekey exception:", err.message);
    return jsonResponse({ error: "Failed to reset key" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/report — plaintext voluntário (design §2.8)
// A cópia legível vem do navegador do denunciante; só é gravada se
// ciphertext_ref/nonce_ref baterem com o post armazenado (409
// REPORT_STALE em divergência — ex.: post editado no meio). O
// reporter_id fica registrado: denúncia falsa é rastreável.
// ============================================================
export async function handleUndergroundReport(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }
  const { userId, setCookieHeader } = auth;

  // Reforço 2: rate limit padrão do worker (texto livre no body)
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(env, `underground-report:${userId}:${ip}`, true);
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  try {
    const service = await getServiceSupabase(env);

    // Reporters must be members (they decrypted the post to read it)
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
    const plaintext = body.plaintext;
    const ciphertextRef = body.ciphertext_ref;
    const nonceRef = body.nonce_ref;

    if (!postId || !UUID_REGEX.test(postId)) {
      return jsonResponse({ error: "Invalid post id" }, 400, origin, env);
    }
    // Reforço 2: tetos no body (espelham os CHECKs do banco)
    if (!reason || reason.length > MAX_REASON_LENGTH) {
      return jsonResponse({ error: "Reason required (max 500 chars)" }, 400, origin, env);
    }
    if (
      !plaintext ||
      typeof plaintext !== "string" ||
      plaintext.length > MAX_REPORT_PLAINTEXT
    ) {
      return jsonResponse({ error: "Plaintext required (max 10000 chars)" }, 400, origin, env);
    }
    if (
      !ciphertextRef || typeof ciphertextRef !== "string" ||
      ciphertextRef.length > MAX_ENCRYPTED_LENGTH ||
      !nonceRef || typeof nonceRef !== "string" ||
      nonceRef.length > MAX_NONCE_LENGTH
    ) {
      return jsonResponse({ error: "Ciphertext reference required" }, 400, origin, env);
    }

    // Prova de consistência: a ref precisa bater com o post armazenado
    const { data: postRows } = await service
      .from("underground_posts")
      .select("id, user_id, encrypted_content, nonce", {
        filter: `id=eq.${postId}`,
        limit: 1,
      });
    const post = Array.isArray(postRows) ? postRows[0] : postRows;
    if (!post) {
      return jsonResponse({ error: "Post not found" }, 404, origin, env);
    }
    if (post.encrypted_content !== ciphertextRef || post.nonce !== nonceRef) {
      return jsonResponse(
        { error: "Report reference is stale — refetch and retry", code: "REPORT_STALE" },
        409,
        origin,
        env,
      );
    }

    const { error: insertError } = await service.from("underground_reports").insert({
      post_id: postId,
      reporter_id: userId,
      reported_user_id: post.user_id || null,
      reason,
      plaintext,
      ciphertext_ref: ciphertextRef,
      nonce_ref: nonceRef,
    });
    if (insertError) {
      console.error("[Underground] report insert failed:", insertError.message);
      return jsonResponse({ error: "Failed to submit report" }, 500, origin, env);
    }

    console.log(`[Underground] Report filed on post ${postId} by ${userId}`);
    let response = jsonResponse({ success: true }, 201, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] report exception:", err.message);
    return jsonResponse({ error: "Failed to submit report" }, 500, origin, env);
  }
}
