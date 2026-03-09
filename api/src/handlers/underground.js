// ============================================================
// HANDLER - THE UNDERGROUND (Anonymous Confessions)
// ============================================================
// Anonymous posts with reactions. Requires unlocked access (3 credits).
//
// E2E ENCRYPTION:
// - Posts can be encrypted with a shared room key
// - All unlocked users share the same room key
// - Server cannot read encrypted posts (zero-knowledge)

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { checkRateLimit } from "../rate-limit/index.js";

const MAX_POST_LENGTH = 1000;
const MAX_ENCRYPTED_LENGTH = 4000;
const PAGE_SIZE = 30;
const VALID_REACTIONS = ["fire", "think", "heart", "skull"];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_PATTERN =
  /https?:\/\/|www\.|[a-z0-9-]+\.(com|org|net|io|co|xyz|me|app|dev|gg|tv|info|biz|link)/i;
const NICKNAME_REGEX = /^[a-zA-Z0-9]{3,12}$/;

// ============================================================
// GET /api/underground - List anonymous posts
// ============================================================
export async function handleGetUndergroundPosts(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;
  const url = new URL(request.url);
  const before = url.searchParams.get("before");

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
        { error: "Access required. Unlock Underground first." },
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

    if (before) query = query.lt("created_at", before);

    const { data: posts, error } = await query;

    if (error) {
      console.error("[Underground] Failed to fetch posts:", error.message);
      return jsonResponse({ error: "Failed to load posts" }, 500, origin, env);
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

    // Include encrypted room key if available
    let response = jsonResponse(
      {
        posts: postsWithReactions,
        myNickname: access.nickname,
        encryptedRoomKey: access.encrypted_room_key || null,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] List exception:", err.message);
    return jsonResponse({ error: "Failed to load posts" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground - Create anonymous post
// ============================================================
export async function handleCreateUndergroundPost(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

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
      { error: "Too many posts. Please slow down." },
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
        { error: "Access required. Unlock Underground first." },
        403,
        origin,
        env,
      );
    }

    if (!access.nickname) {
      return jsonResponse(
        { error: "Set your Underground nickname first." },
        400,
        origin,
        env,
      );
    }

    const body = await request.json();
    const content = (body.content || "").trim();
    const encryptedContent = body.encrypted_content || null;
    const nonce = body.nonce || null;
    const isEncrypted = !!(encryptedContent && nonce);
    const replyToId = body.reply_to_id || null;

    // Validate: either plaintext or encrypted
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
      if (!content || content.length > MAX_POST_LENGTH) {
        return jsonResponse(
          { error: `Content required (max ${MAX_POST_LENGTH} chars)` },
          400,
          origin,
          env,
        );
      }
      // Block URLs in plaintext
      if (URL_PATTERN.test(content)) {
        return jsonResponse(
          { error: "Links are not allowed." },
          400,
          origin,
          env,
        );
      }
    }

    // Validate reply_to_id if provided
    if (replyToId) {
      if (!UUID_REGEX.test(replyToId)) {
        return jsonResponse({ error: "Invalid reply_to_id" }, 400, origin, env);
      }
      const { data: replyTarget } = await supabase
        .from("underground_posts")
        .select("id")
        .eq("id", replyToId)
        .single();
      if (!replyTarget) {
        return jsonResponse(
          { error: "Reply target not found" },
          400,
          origin,
          env,
        );
      }
    }

    const insertData = {
      user_id: userId,
      nickname: access.nickname,
      content: isEncrypted ? "[Encrypted]" : content,
      encrypted_content: encryptedContent,
      nonce: nonce,
      is_encrypted: isEncrypted,
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
      return jsonResponse({ error: "Failed to create post" }, 500, origin, env);
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
    return jsonResponse({ error: "Failed to create post" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/:id/react - Toggle reaction
// ============================================================
export async function handleUndergroundReaction(request, env, origin, postId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  // Validate postId is a valid UUID
  if (!postId || !UUID_REGEX.test(postId)) {
    return jsonResponse({ error: "Invalid post ID" }, 400, origin, env);
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
      { error: "Too many reactions. Please slow down." },
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
      return jsonResponse({ error: "Access required" }, 403, origin, env);
    }

    const body = await request.json();
    const reaction = (body.reaction || "").toLowerCase();

    if (!VALID_REACTIONS.includes(reaction)) {
      return jsonResponse({ error: "Invalid reaction" }, 400, origin, env);
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
          { error: "Failed to add reaction" },
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
      { error: "Failed to process reaction" },
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
  // Validate postId is a valid UUID
  if (!postId || !UUID_REGEX.test(postId)) {
    return jsonResponse({ error: "Invalid post ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership (RLS should handle this, but double-check)
    const { data: post } = await supabase
      .from("underground_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return jsonResponse({ error: "Post not found" }, 404, origin, env);
    }

    if (post.user_id !== userId) {
      return jsonResponse(
        { error: "Cannot delete others' posts" },
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
      return jsonResponse({ error: "Failed to delete post" }, 500, origin, env);
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Underground] Delete exception:", err.message);
    return jsonResponse({ error: "Failed to delete post" }, 500, origin, env);
  }
}

// ============================================================
// PATCH /api/underground/:id - Edit own post
// ============================================================
export async function handleEditUndergroundPost(request, env, origin, postId) {
  if (!postId || !UUID_REGEX.test(postId)) {
    return jsonResponse({ error: "Invalid post ID" }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership
    const { data: post } = await supabase
      .from("underground_posts")
      .select("id, user_id, is_encrypted")
      .eq("id", postId)
      .single();

    if (!post) {
      return jsonResponse({ error: "Post not found" }, 404, origin, env);
    }

    if (post.user_id !== userId) {
      return jsonResponse(
        { error: "Can only edit your own posts" },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const content = (body.content || "").trim();
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
      if (!content || content.length > MAX_POST_LENGTH) {
        return jsonResponse(
          { error: `Content required (max ${MAX_POST_LENGTH} chars)` },
          400,
          origin,
          env,
        );
      }
      if (URL_PATTERN.test(content)) {
        return jsonResponse(
          { error: "Links are not allowed." },
          400,
          origin,
          env,
        );
      }
    }

    const updateData = {
      content: isEncrypted ? "[Encrypted]" : content,
      encrypted_content: encryptedContent,
      nonce: nonce,
      is_encrypted: isEncrypted,
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
      return jsonResponse({ error: "Failed to edit post" }, 500, origin, env);
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
    return jsonResponse({ error: "Failed to edit post" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/underground/nickname - Set Underground nickname
// ============================================================
export async function handleSetUndergroundNickname(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

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
        { error: "Access required. Unlock Underground first." },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const nickname = (body.nickname || "").trim();

    // Validate nickname format: 3-20 chars, alphanumeric, underscore, hyphen
    if (!nickname || !NICKNAME_REGEX.test(nickname)) {
      return jsonResponse(
        {
          error:
            "Nickname must be 3-20 characters (letters, numbers, underscore, hyphen only)",
        },
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
        { error: "Nickname already taken. Choose another." },
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
        { error: "Failed to set nickname" },
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
    return jsonResponse({ error: "Failed to set nickname" }, 500, origin, env);
  }
}
