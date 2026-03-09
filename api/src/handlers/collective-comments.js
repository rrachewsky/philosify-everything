// ============================================================
// HANDLER - COLLECTIVE COMMENTS (Threaded Discussions)
// ============================================================
// GET  /api/collective/analyses/:id/comments - Get comments for analysis
// POST /api/collective/analyses/:id/comments - Add comment/reply
// DELETE /api/collective/comments/:id - Delete own comment
//
// E2E ENCRYPTION:
// - Comments can be encrypted with the collective's group key
// - Server cannot read encrypted comments (zero-knowledge)

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { getSupabaseCredentials } from "../utils/supabase.js";
import { checkRateLimit } from "../rate-limit/index.js";
import { sendPushNotification } from "../push/sender.js";

const MAX_COMMENT_LENGTH = 2000;
const MAX_ENCRYPTED_LENGTH = 8000;
const URL_PATTERN =
  /https?:\/\/|www\.|[a-z0-9-]+\.(com|org|net|io|co|xyz|me|app|dev|gg|tv|info|biz|link)/i;

// ============================================================
// GET /api/collective/analyses/:id/comments - Get comment thread
// ============================================================
export async function handleGetComments(
  request,
  env,
  origin,
  collectiveAnalysisId,
) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Get the analysis to find the group
    const { data: analysis, error: analysisError } = await supabase
      .from("collective_analyses")
      .select(
        "id, group_id, song_name, score, schools, verdict_snippet, analysis_id",
      )
      .eq("id", collectiveAnalysisId)
      .single();

    if (analysisError || !analysis) {
      return jsonResponse({ error: "Analysis not found" }, 404, origin, env);
    }

    // Verify user is a member of this collective
    const { data: membership } = await supabase
      .from("collective_members")
      .select("id")
      .eq("group_id", analysis.group_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return jsonResponse(
        { error: "Join the collective to view comments" },
        403,
        origin,
        env,
      );
    }

    // Fetch all comments (we'll structure them client-side for 2-level threading)
    const { data: comments, error: commentsError } = await supabase
      .from("collective_comments")
      .select(
        "id, user_id, parent_id, display_name, content, encrypted_content, nonce, is_encrypted, created_at",
      )
      .eq("collective_analysis_id", collectiveAnalysisId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("[Comments] Fetch failed:", commentsError.message);
      return jsonResponse(
        { error: "Failed to load comments" },
        500,
        origin,
        env,
      );
    }

    // Mark which comments are by the current user and include encryption info
    const enrichedComments = (comments || []).map((c) => ({
      id: c.id,
      userId: c.user_id,
      parentId: c.parent_id,
      displayName: c.display_name,
      content: c.is_encrypted ? null : c.content,
      encryptedContent: c.is_encrypted ? c.encrypted_content : null,
      nonce: c.is_encrypted ? c.nonce : null,
      isEncrypted: c.is_encrypted || false,
      createdAt: c.created_at,
      isMine: c.user_id === userId,
    }));

    let response = jsonResponse(
      {
        analysis,
        comments: enrichedComments,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Comments] Get exception:", err.message);
    return jsonResponse({ error: "Failed to load comments" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/collective/analyses/:id/comments - Add comment/reply
// ============================================================
export async function handleAddComment(
  request,
  env,
  origin,
  collectiveAnalysisId,
) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const {
    client: supabase,
    userId,
    email,
    userMetadata,
    setCookieHeader,
  } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `collective-comment:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many comments. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    // Get the analysis to find the group
    const { data: analysis, error: analysisError } = await supabase
      .from("collective_analyses")
      .select("id, group_id")
      .eq("id", collectiveAnalysisId)
      .single();

    if (analysisError || !analysis) {
      return jsonResponse({ error: "Analysis not found" }, 404, origin, env);
    }

    // Verify user is a member
    const { data: membership } = await supabase
      .from("collective_members")
      .select("id")
      .eq("group_id", analysis.group_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!membership) {
      return jsonResponse(
        { error: "Join the collective to comment" },
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
    const parentId = body.parentId || null;

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
      if (!content || content.length > MAX_COMMENT_LENGTH) {
        return jsonResponse(
          { error: `Comment required (max ${MAX_COMMENT_LENGTH} chars)` },
          400,
          origin,
          env,
        );
      }
      // Block URLs in plaintext
      if (URL_PATTERN.test(content)) {
        return jsonResponse(
          { error: "Links are not allowed in comments." },
          400,
          origin,
          env,
        );
      }
    }

    // If replying, verify parent exists and is a top-level comment (2-level limit)
    if (parentId) {
      const { data: parentComment, error: parentError } = await supabase
        .from("collective_comments")
        .select("id, parent_id")
        .eq("id", parentId)
        .eq("collective_analysis_id", collectiveAnalysisId)
        .single();

      if (parentError || !parentComment) {
        return jsonResponse(
          { error: "Parent comment not found" },
          404,
          origin,
          env,
        );
      }

      // Only allow reply to top-level comments (parent_id is null)
      if (parentComment.parent_id !== null) {
        return jsonResponse(
          { error: "Can only reply to top-level comments" },
          400,
          origin,
          env,
        );
      }
    }

    // Display name priority: full_name from metadata > email prefix > Anonymous
    const displayName =
      userMetadata?.full_name || (email ? email.split("@")[0] : "Anonymous");

    // Insert comment
    const insertData = {
      collective_analysis_id: collectiveAnalysisId,
      user_id: userId,
      parent_id: parentId,
      display_name: displayName,
      content: isEncrypted ? "[Encrypted]" : content,
      encrypted_content: encryptedContent,
      nonce: nonce,
      is_encrypted: isEncrypted,
    };

    const { data: comment, error: insertError } = await supabase
      .from("collective_comments")
      .insert(insertData)
      .select(
        "id, user_id, parent_id, display_name, content, encrypted_content, nonce, is_encrypted, created_at",
      )
      .single();

    if (insertError) {
      console.error("[Comments] Insert failed:", insertError.message);
      return jsonResponse({ error: "Failed to add comment" }, 500, origin, env);
    }

    // Increment comment count
    await supabase.rpc("increment_analysis_comment_count", {
      p_analysis_id: collectiveAnalysisId,
    });

    // If this is a reply, notify the parent comment author
    if (parentId) {
      await createReplyNotification(
        env,
        supabase,
        parentId,
        userId,
        displayName,
        comment.id,
      );
    }

    // Notify collective members about new comment (fire-and-forget)
    notifyCollectiveMembers(
      env,
      analysis.group_id,
      userId,
      displayName,
      collectiveAnalysisId,
      !!parentId,
    ).catch((err) =>
      console.error(
        "[Comments] Push to collective members failed:",
        err.message,
      ),
    );

    let response = jsonResponse(
      {
        success: true,
        comment: {
          id: comment.id,
          userId: comment.user_id,
          parentId: comment.parent_id,
          displayName: comment.display_name,
          content: comment.is_encrypted ? null : comment.content,
          encryptedContent: comment.is_encrypted
            ? comment.encrypted_content
            : null,
          nonce: comment.is_encrypted ? comment.nonce : null,
          isEncrypted: comment.is_encrypted || false,
          createdAt: comment.created_at,
          isMine: true,
        },
      },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Comments] Add exception:", err.message);
    return jsonResponse({ error: "Failed to add comment" }, 500, origin, env);
  }
}

// ============================================================
// DELETE /api/collective/comments/:id - Delete own comment
// ============================================================
export async function handleDeleteComment(request, env, origin, commentId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Use service credentials for SELECT to bypass RLS membership check.
    // RLS SELECT policy requires active collective membership, which blocks
    // users who left a collective from deleting their own comments.
    // We verify ownership manually instead.
    const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
    const selectRes = await fetch(
      `${sbUrl}/rest/v1/collective_comments?id=eq.${commentId}&select=id,user_id,collective_analysis_id`,
      { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } },
    );
    const comments = await selectRes.json();
    const comment = Array.isArray(comments) ? comments[0] : null;

    if (!comment) {
      return jsonResponse({ error: "Comment not found" }, 404, origin, env);
    }

    if (comment.user_id !== userId) {
      return jsonResponse(
        { error: "Cannot delete others' comments" },
        403,
        origin,
        env,
      );
    }

    // Delete using service role to bypass RLS (ownership already verified above)
    const deleteRes = await fetch(
      `${sbUrl}/rest/v1/collective_comments?id=eq.${commentId}`,
      {
        method: "DELETE",
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          Prefer: "return=minimal",
        },
      },
    );

    if (!deleteRes.ok) {
      const errText = await deleteRes.text().catch(() => "");
      console.error("[Comments] Delete failed:", errText);
      return jsonResponse(
        { error: "Failed to delete comment" },
        500,
        origin,
        env,
      );
    }

    // Decrement comment count
    await supabase.rpc("decrement_analysis_comment_count", {
      p_analysis_id: comment.collective_analysis_id,
    });

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Comments] Delete exception:", err.message);
    return jsonResponse(
      { error: "Failed to delete comment" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// HELPER: Create reply notification
// ============================================================
async function createReplyNotification(
  env,
  supabase,
  parentCommentId,
  replyUserId,
  replyUserName,
  replyCommentId,
) {
  try {
    // Get parent comment author
    const { data: parent } = await supabase
      .from("collective_comments")
      .select("user_id, display_name")
      .eq("id", parentCommentId)
      .single();

    if (!parent || parent.user_id === replyUserId) {
      // Don't notify if replying to own comment
      return;
    }

    // Create notification using service role (direct REST API call)
    const { url, key } = await getSupabaseCredentials(env);
    const res = await fetch(`${url}/rest/v1/notifications`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: parent.user_id,
        type: "comment_reply",
        reference_id: replyCommentId,
        title: "New reply to your comment",
        body: `${replyUserName} replied to your comment`,
      }),
    });

    if (res.ok) {
      console.log(
        `[Notifications] Created reply notification for ${parent.user_id}`,
      );
    } else {
      console.error("[Notifications] Failed to create:", await res.text());
    }

    // Send push notification for the reply
    await sendPushNotification(env, parent.user_id, {
      title: "Reply to your comment",
      body: `${replyUserName} replied to your comment`,
      url: "/community?tab=collective",
      tag: `reply-${parentCommentId}`,
      type: "reply",
      senderName: replyUserName,
    }).catch((err) => console.error("[Push] Reply push failed:", err.message));
  } catch (err) {
    // Don't fail the comment if notification fails
    console.error("[Notifications] Failed to create:", err.message);
  }
}

// ============================================================
// HELPER: Notify collective members about new comment
// ============================================================
// Sends push to all other members of the collective (excluding commenter).
// Only sends for top-level comments to avoid spam from reply threads.
async function notifyCollectiveMembers(
  env,
  groupId,
  commenterId,
  commenterName,
  analysisId,
  isReply,
) {
  // Only notify on top-level comments (replies already notify parent author)
  if (isReply) return;

  try {
    const { url, key } = await getSupabaseCredentials(env);

    // Get all members of this collective (excluding the commenter)
    const membersRes = await fetch(
      `${url}/rest/v1/collective_members?group_id=eq.${groupId}&user_id=neq.${commenterId}&select=user_id`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      },
    );

    if (!membersRes.ok) return;
    const members = await membersRes.json();

    if (members.length === 0) return;

    console.log(
      `[Push] Notifying ${members.length} collective member(s) about new comment`,
    );

    // Send push to each member (fire-and-forget, in parallel)
    await Promise.allSettled(
      members.map((m) =>
        sendPushNotification(env, m.user_id, {
          title: "New in your Collective",
          body: `${commenterName} commented on a discussion`,
          url: "/community?tab=collective",
          tag: `collective-${groupId}`,
          type: "collective",
          senderName: commenterName,
        }),
      ),
    );
  } catch (err) {
    console.error("[Push] Collective members push failed:", err.message);
  }
}
