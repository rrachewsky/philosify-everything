// ============================================================
// HANDLER - THE FORUM (Public Debates & Threads)
// ============================================================
// Public discussion threads with replies and voting. Free access.

import { jsonResponse, getCorsHeaders } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { getSecret } from "../utils/secrets.js";
import { checkRateLimit } from "../rate-limit/index.js";
import {
  getGuide,
  getWrapupSource,
  getDebateAestheticGuide,
} from "../guides/index.js";
import { callGrok } from "../ai/models/index.js";
import { generateGuideProofWithSignature } from "../guides/loader.js";
import {
  generateWrapupTTS,
  getFromR2Cache,
  saveToR2Cache,
  getR2PublicUrl,
} from "../tts/gemini.js";
import { pg, rpc } from "../utils/pg.js";
import { sendPushNotification } from "../push/sender.js";
import { broadcastColloquiumEvent } from "./colloquium.js";

// Batch-fetch display names from profiles using service role (bypasses RLS)
// Falls back to email username (part before @) when display_name is null.
// Never returns null — always has a usable name for every requested userId.
export async function fetchDisplayNames(env, userIds) {
  if (!userIds || userIds.length === 0) return {};
  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
    const uniqueIds = [...new Set(userIds)];
    const filter = uniqueIds.map((id) => `"${id}"`).join(",");

    // 1. Fetch display_name from profiles table
    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?user_id=in.(${filter})&select=user_id,display_name`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      },
    );
    const profiles = res.ok ? await res.json() : [];
    const map = {};
    const missingIds = [];
    for (const id of uniqueIds) {
      const profile = profiles.find((p) => p.user_id === id);
      if (profile && profile.display_name) {
        map[id] = profile.display_name;
      } else {
        missingIds.push(id);
      }
    }

    // 2. For users without display_name, fetch email from auth.users admin API
    if (missingIds.length > 0) {
      const emailFetches = missingIds.map(async (id) => {
        try {
          const userRes = await fetch(
            `${supabaseUrl}/auth/v1/admin/users/${id}`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            },
          );
          if (userRes.ok) {
            const user = await userRes.json();
            const email = user.email || "";
            return { id, name: email.split("@")[0] || "user" };
          }
          return { id, name: "user" };
        } catch {
          return { id, name: "user" };
        }
      });
      const results = await Promise.all(emailFetches);
      for (const { id, name } of results) {
        map[id] = name;
      }
    }

    return map;
  } catch (err) {
    console.warn("[Forum] fetchDisplayNames error:", err.message);
    return {};
  }
}

// Fetch a single user's language preference from auth.users metadata
async function fetchUserLanguage(env, userId) {
  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!res.ok) return "English";
    const user = await res.json();
    return user.raw_user_meta_data?.language || "English";
  } catch (err) {
    console.warn("[Forum] fetchUserLanguage error:", err.message);
    return "English";
  }
}

// Map language codes to full names for Grok
const LANG_CODE_TO_NAME = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  he: "Hebrew",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  hu: "Hungarian",
  fa: "Persian",
};

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 5000;
const MAX_REPLY_LENGTH = 3000;
const PAGE_SIZE = 20;
const VALID_CATEGORIES = [
  "general",
  "ethics",
  "metaphysics",
  "epistemology",
  "politics",
  "aesthetics",
  "logic",
  "debate",
  "colloquium",
];

// ============================================================
// GET /api/forum/threads - List threads
// ============================================================
export async function handleGetForumThreads(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, setCookieHeader } = auth;
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const before = url.searchParams.get("before");

  try {
    let query = supabase
      .from("forum_threads")
      .select(
        "id, user_id, title, content, category, is_pinned, reply_count, last_reply_at, created_at, wrapup, wrapup_audio_url, metadata",
      )
      .order("is_pinned", { ascending: false })
      .order("last_reply_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (category && VALID_CATEGORIES.includes(category)) {
      query = query.eq("category", category);
    }

    if (before) {
      query = query.lt("last_reply_at", before);
    }

    const { data: threads, error } = await query;

    if (error) {
      console.error(
        "[Forum] Failed to fetch threads:",
        error.message,
        error.code,
        error.details,
      );
      return jsonResponse(
        { error: "Failed to load threads. Please try again." },
        500,
        origin,
        env,
      );
    }

    // Fetch display names for thread authors
    const authorIds = (threads || []).map((t) => t.user_id);
    const displayNames = await fetchDisplayNames(env, authorIds);

    const sanitizedThreads = (threads || []).map((t) => ({
      ...t,
      author: displayNames[t.user_id] || "user",
      user_id: undefined,
    }));

    let response = jsonResponse(
      { threads: sanitizedThreads },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] List threads exception:", err.message);
    return jsonResponse({ error: "Failed to load threads" }, 500, origin, env);
  }
}

// ============================================================
// GET /api/forum/threads/:id - Get thread with replies
// ============================================================
export async function handleGetForumThread(request, env, origin, threadId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Get thread
    const { data: thread, error: threadError } = await supabase
      .from("forum_threads")
      .select(
        "id, user_id, title, content, category, is_pinned, reply_count, last_reply_at, created_at, wrapup, wrapup_audio_url, metadata",
      )
      .eq("id", threadId)
      .single();

    if (threadError || !thread) {
      return jsonResponse({ error: "Thread not found" }, 404, origin, env);
    }

    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from("forum_replies")
      .select(
        "id, user_id, content, upvotes, downvotes, created_at, edited_at, parent_id, is_philosopher, philosopher_name",
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (repliesError) {
      console.error("[Forum] Failed to fetch replies:", repliesError.message);
    }

    // Fetch display names for thread author + all reply authors
    const allUserIds = [
      thread.user_id,
      ...(replies || []).map((r) => r.user_id),
    ];
    const displayNames = await fetchDisplayNames(env, allUserIds);

    // Get user's votes for replies in this thread
    const replyIds = (replies || []).map((r) => r.id);
    let userVotes = [];

    if (replyIds.length > 0) {
      const { data: votes } = await supabase
        .from("forum_votes")
        .select("reply_id, vote_type")
        .eq("user_id", userId)
        .in("reply_id", replyIds);

      userVotes = votes || [];
    }

    // Process thread
    const sanitizedThread = {
      ...thread,
      author: displayNames[thread.user_id] || "user",
      isOwner: thread.user_id === userId,
      user_id: undefined,
    };

    // Process replies with vote info
    const sanitizedReplies = (replies || []).map((r) => {
      const userVote = userVotes.find((v) => v.reply_id === r.id);
      return {
        ...r,
        author: displayNames[r.user_id] || "user",
        isOwner: r.user_id === userId,
        myVote: userVote?.vote_type || null,
        user_id: undefined,
      };
    });

    let response = jsonResponse(
      {
        thread: sanitizedThread,
        replies: sanitizedReplies,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Get thread exception:", err.message);
    return jsonResponse({ error: "Failed to load thread" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/forum/threads - Create thread
// ============================================================
export async function handleCreateForumThread(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `forum-thread:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many threads. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    const content = (body.content || "").trim();
    const category = body.category || "general";

    if (!title || title.length < 3 || title.length > MAX_TITLE_LENGTH) {
      return jsonResponse(
        { error: `Title required (3-${MAX_TITLE_LENGTH} chars)` },
        400,
        origin,
        env,
      );
    }

    if (
      !content ||
      content.length < 10 ||
      content.length > MAX_CONTENT_LENGTH
    ) {
      return jsonResponse(
        { error: `Content required (10-${MAX_CONTENT_LENGTH} chars)` },
        400,
        origin,
        env,
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return jsonResponse({ error: "Invalid category" }, 400, origin, env);
    }

    const { data: thread, error } = await supabase
      .from("forum_threads")
      .insert({
        user_id: userId,
        title,
        content,
        category,
      })
      .select(
        "id, title, content, category, is_pinned, reply_count, last_reply_at, created_at",
      )
      .single();

    if (error) {
      console.error(
        "[Forum] Create thread failed:",
        error.message,
        error.code,
        error.details,
      );
      return jsonResponse(
        { error: "Failed to create thread. Please try again." },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse(
      { success: true, thread: { ...thread, isOwner: true } },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Create thread exception:", err.message);
    return jsonResponse({ error: "Failed to create thread" }, 500, origin, env);
  }
}

// ============================================================
// DELETE /api/forum/threads/:id - Delete own thread
// ============================================================
export async function handleDeleteForumThread(request, env, origin, threadId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("user_id")
      .eq("id", threadId)
      .single();

    if (!thread) {
      return jsonResponse({ error: "Thread not found" }, 404, origin, env);
    }

    if (thread.user_id !== userId) {
      return jsonResponse(
        { error: "Cannot delete others' threads" },
        403,
        origin,
        env,
      );
    }

    const { error } = await supabase
      .from("forum_threads")
      .delete()
      .eq("id", threadId);

    if (error) {
      console.error("[Forum] Delete thread failed:", error.message);
      return jsonResponse(
        { error: "Failed to delete thread" },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Delete thread exception:", err.message);
    return jsonResponse({ error: "Failed to delete thread" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/forum/threads/:id/replies - Create reply
// ============================================================
export async function handleCreateForumReply(request, env, origin, threadId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `forum-reply:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many replies. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    // Verify thread exists and check if locked (wrap-up generated)
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("id, wrapup")
      .eq("id", threadId)
      .single();

    if (!thread) {
      return jsonResponse({ error: "Thread not found" }, 404, origin, env);
    }

    // Lock replies after wrap-up is generated
    if (thread.wrapup) {
      return jsonResponse(
        { error: "This debate has been wrapped up. No more replies allowed." },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const content = (body.content || "").trim();
    const parentId = body.parent_id || null;

    if (!content || content.length > MAX_REPLY_LENGTH) {
      return jsonResponse(
        { error: `Content required (max ${MAX_REPLY_LENGTH} chars)` },
        400,
        origin,
        env,
      );
    }

    // Verify parent reply exists if provided
    if (parentId) {
      const { data: parent } = await supabase
        .from("forum_replies")
        .select("id")
        .eq("id", parentId)
        .eq("thread_id", threadId)
        .single();

      if (!parent) {
        return jsonResponse(
          { error: "Parent reply not found" },
          400,
          origin,
          env,
        );
      }
    }

    const { data: reply, error } = await supabase
      .from("forum_replies")
      .insert({
        thread_id: threadId,
        user_id: userId,
        parent_id: parentId,
        content,
      })
      .select("id, content, upvotes, downvotes, created_at, parent_id")
      .single();

    if (error) {
      console.error(
        "[Forum] Create reply failed:",
        error.message,
        error.code,
        error.details,
      );
      return jsonResponse(
        { error: "Failed to create reply. Please try again." },
        500,
        origin,
        env,
      );
    }

    // For colloquium threads: broadcast user comment and notify on replies
    try {
      const { data: threadMeta } = await supabase
        .from("forum_threads")
        .select("category")
        .eq("id", threadId)
        .single();

      if (threadMeta?.category === "colloquium") {
        // Broadcast so other viewers see the comment in real time
        broadcastColloquiumEvent(env, threadId, "new-reply");

        // If replying to another user's comment, notify them
        if (parentId) {
          const { data: parent } = await supabase
            .from("forum_replies")
            .select("user_id")
            .eq("id", parentId)
            .single();

          if (parent && parent.user_id !== userId) {
            // Get commenter's display name
            const names = await fetchDisplayNames(env, [userId]);
            const commenterName = names[userId] || "Someone";

            sendPushNotification(env, parent.user_id, {
              title: commenterName,
              body: "Replied to your comment in the debate",
              url: `/debate/${threadId}`,
              tag: `colloquium-comment-${threadId}`,
              type: "colloquium",
            }).catch((err) =>
              console.warn(
                "[Forum] Colloquium reply push failed:",
                err.message,
              ),
            );
          }
        }
      }
    } catch (notifyErr) {
      // Non-fatal — don't block the response
      console.warn(
        "[Forum] Post-reply notification failed:",
        notifyErr.message,
      );
    }

    let response = jsonResponse(
      {
        success: true,
        reply: { ...reply, isOwner: true, myVote: null },
      },
      201,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Create reply exception:", err.message);
    return jsonResponse({ error: "Failed to create reply" }, 500, origin, env);
  }
}

// ============================================================
// DELETE /api/forum/replies/:id - Delete own reply
// ============================================================
// For colloquium threads, deletion is blocked after verdict (wrapup).
export async function handleDeleteForumReply(request, env, origin, replyId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership and fetch thread_id for verdict check
    const { data: reply } = await supabase
      .from("forum_replies")
      .select("user_id, thread_id")
      .eq("id", replyId)
      .single();

    if (!reply) {
      return jsonResponse({ error: "Reply not found" }, 404, origin, env);
    }

    if (reply.user_id !== userId) {
      return jsonResponse(
        { error: "Cannot delete others' replies" },
        403,
        origin,
        env,
      );
    }

    // Block deletion after verdict (wrapup) on the parent thread
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("wrapup")
      .eq("id", reply.thread_id)
      .single();

    if (thread?.wrapup) {
      return jsonResponse(
        {
          error: "Cannot delete comments after the verdict has been published.",
        },
        403,
        origin,
        env,
      );
    }

    const { error } = await supabase
      .from("forum_replies")
      .delete()
      .eq("id", replyId);

    if (error) {
      console.error("[Forum] Delete reply failed:", error.message);
      return jsonResponse(
        { error: "Failed to delete reply" },
        500,
        origin,
        env,
      );
    }

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Delete reply exception:", err.message);
    return jsonResponse({ error: "Failed to delete reply" }, 500, origin, env);
  }
}

// ============================================================
// PUT /api/forum/replies/:id - Edit own reply
// ============================================================
// Users can edit their own (non-philosopher) replies before verdict.
export async function handleEditForumReply(request, env, origin, replyId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Verify ownership and check it's not a philosopher reply
    const { data: reply } = await supabase
      .from("forum_replies")
      .select("user_id, thread_id, is_philosopher")
      .eq("id", replyId)
      .single();

    if (!reply) {
      return jsonResponse({ error: "Reply not found" }, 404, origin, env);
    }

    if (reply.user_id !== userId) {
      return jsonResponse(
        { error: "Cannot edit others' replies" },
        403,
        origin,
        env,
      );
    }

    if (reply.is_philosopher) {
      return jsonResponse(
        { error: "Cannot edit philosopher replies" },
        403,
        origin,
        env,
      );
    }

    // Block editing after verdict (wrapup)
    const { data: thread } = await supabase
      .from("forum_threads")
      .select("wrapup")
      .eq("id", reply.thread_id)
      .single();

    if (thread?.wrapup) {
      return jsonResponse(
        { error: "Cannot edit comments after the verdict has been published." },
        403,
        origin,
        env,
      );
    }

    const body = await request.json();
    const content = (body.content || "").trim();

    if (!content || content.length > MAX_REPLY_LENGTH) {
      return jsonResponse(
        { error: `Content required (max ${MAX_REPLY_LENGTH} chars)` },
        400,
        origin,
        env,
      );
    }

    const { data: updated, error } = await supabase
      .from("forum_replies")
      .update({ content, edited_at: new Date().toISOString() })
      .eq("id", replyId)
      .select("id, content, edited_at")
      .single();

    if (error) {
      console.error("[Forum] Edit reply failed:", error.message);
      return jsonResponse({ error: "Failed to edit reply" }, 500, origin, env);
    }

    let response = jsonResponse(
      { success: true, reply: updated },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Edit reply exception:", err.message);
    return jsonResponse({ error: "Failed to edit reply" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/forum/replies/:id/vote - Upvote/downvote
// ============================================================
export async function handleForumVote(request, env, origin, replyId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  // Rate limit votes to prevent manipulation
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `forum-vote:${userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse(
      { error: "Too many votes. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    const body = await request.json();
    const voteType = body.vote_type; // 'up', 'down', or null to remove

    if (voteType !== null && voteType !== "up" && voteType !== "down") {
      return jsonResponse(
        { error: "Invalid vote type (up, down, or null)" },
        400,
        origin,
        env,
      );
    }

    // Get reply
    const { data: reply } = await supabase
      .from("forum_replies")
      .select("id, upvotes, downvotes")
      .eq("id", replyId)
      .single();

    if (!reply) {
      return jsonResponse({ error: "Reply not found" }, 404, origin, env);
    }

    // Check existing vote
    const { data: existingVote } = await supabase
      .from("forum_votes")
      .select("id, vote_type")
      .eq("reply_id", replyId)
      .eq("user_id", userId)
      .maybeSingle();

    let newUpvotes = reply.upvotes;
    let newDownvotes = reply.downvotes;

    if (existingVote) {
      // Remove old vote from counts
      if (existingVote.vote_type === "up")
        newUpvotes = Math.max(0, newUpvotes - 1);
      if (existingVote.vote_type === "down")
        newDownvotes = Math.max(0, newDownvotes - 1);

      if (voteType === null) {
        // Just remove the vote
        await supabase.from("forum_votes").delete().eq("id", existingVote.id);
      } else {
        // Update to new vote type
        await supabase
          .from("forum_votes")
          .update({ vote_type: voteType })
          .eq("id", existingVote.id);

        // Add new vote to counts
        if (voteType === "up") newUpvotes += 1;
        if (voteType === "down") newDownvotes += 1;
      }
    } else if (voteType !== null) {
      // Create new vote
      await supabase.from("forum_votes").insert({
        reply_id: replyId,
        user_id: userId,
        vote_type: voteType,
      });

      // Add new vote to counts
      if (voteType === "up") newUpvotes += 1;
      if (voteType === "down") newDownvotes += 1;
    }

    // Update reply counts
    await supabase
      .from("forum_replies")
      .update({ upvotes: newUpvotes, downvotes: newDownvotes })
      .eq("id", replyId);

    let response = jsonResponse(
      {
        success: true,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        myVote: voteType,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Vote exception:", err.message);
    return jsonResponse({ error: "Failed to process vote" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/forum/threads/:id/wrapup - AI Debate Wrap-Up
// ============================================================
// Only the debate creator (proponent) can request a wrap-up.
// Uses Gemini Flash + the philosophical guide to produce a
// structured summary and philosophical verdict.
export async function handleDebateWrapup(request, env, origin, threadId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  // Rate limit: 5 wrap-ups per hour per user
  const rl = await checkRateLimit(env, `wrapup:${userId}`, true);
  if (!rl) {
    return jsonResponse(
      { error: "Rate limit exceeded. Try again later." },
      429,
      origin,
      env,
    );
  }

  try {
    // 1. Fetch thread and verify ownership
    const { data: thread, error: threadErr } = await supabase
      .from("forum_threads")
      .select(
        "id, title, content, category, user_id, wrapup, wrapup_audio_url, created_at",
      )
      .eq("id", threadId)
      .single();

    if (threadErr || !thread) {
      return jsonResponse({ error: "Thread not found" }, 404, origin, env);
    }
    if (thread.category !== "debate" && thread.category !== "colloquium") {
      return jsonResponse(
        { error: "Wrap-up is only available for debates" },
        400,
        origin,
        env,
      );
    }
    if (thread.user_id !== userId) {
      return jsonResponse(
        { error: "Only the debate creator can request a wrap-up" },
        403,
        origin,
        env,
      );
    }

    // 2. If wrap-up already exists, return it (retry TTS if audio is missing)
    if (thread.wrapup) {
      let audioUrl = thread.wrapup_audio_url || null;

      // Retry TTS if text exists but audio was never generated
      if (!audioUrl) {
        console.log(
          `[Forum] Wrapup - text exists but no audio, retrying TTS for ${threadId}`,
        );
        let proposerLangCode = "en";
        try {
          const body = await request.json();
          if (body && body.language) proposerLangCode = body.language;
        } catch {
          // ignore
        }
        if (proposerLangCode === "en") {
          const storedLang = await fetchUserLanguage(env, thread.user_id);
          if (storedLang && storedLang !== "English")
            proposerLangCode = storedLang;
        }
        try {
          const r2Key = `tts_wrapup_${threadId}.wav`;
          const wavBuffer = await generateWrapupTTS(
            thread.wrapup,
            thread.title,
            env,
            proposerLangCode,
          );
          const saved = await saveToR2Cache(env, r2Key, wavBuffer, {
            song: thread.title,
            artist: "debate-wrapup",
            language: proposerLangCode || "en",
            model: "gemini-tts",
          });
          if (saved) {
            audioUrl = getR2PublicUrl(env, r2Key);
            console.log(`[Forum] Wrapup - TTS retry succeeded: ${audioUrl}`);
            // Persist audio URL
            await supabase
              .from("forum_threads")
              .update({ wrapup_audio_url: audioUrl })
              .eq("id", threadId);
          }
        } catch (ttsRetryErr) {
          console.warn(
            "[Forum] Wrapup - TTS retry failed:",
            ttsRetryErr.message,
          );
        }
      }

      let response = jsonResponse(
        {
          success: true,
          wrapup: thread.wrapup,
          wrapup_audio_url: audioUrl,
          cached: true,
        },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // 3. Fetch all replies
    const { data: replies, error: repliesErr } = await supabase
      .from("forum_replies")
      .select("id, user_id, content, upvotes, downvotes, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (repliesErr) {
      console.error(
        "[Forum] Wrapup - failed to load replies:",
        repliesErr.message,
      );
      return jsonResponse(
        { error: "Failed to load debate data" },
        500,
        origin,
        env,
      );
    }

    // Read language from request body (sent by frontend), fallback to user metadata
    let proposerLangCode = "en";
    try {
      const body = await request.json();
      if (body && body.language) {
        proposerLangCode = body.language;
      }
    } catch {
      // No body or invalid JSON — will fall back to user metadata below
    }
    if (proposerLangCode === "en") {
      // Fallback: check user's stored language preference
      const storedLang = await fetchUserLanguage(env, thread.user_id);
      if (storedLang && storedLang !== "English") {
        proposerLangCode = storedLang;
      }
    }

    // Fetch display names for reply authors (in parallel with nothing now)
    const replyAuthorIds = (replies || []).map((r) => r.user_id);
    const wrapupDisplayNames = await fetchDisplayNames(env, replyAuthorIds);
    const proposerLanguage =
      LANG_CODE_TO_NAME[proposerLangCode] || proposerLangCode || "English";
    console.log(
      `[Forum] Wrapup - proposer language: ${proposerLanguage} (code: ${proposerLangCode})`,
    );

    // 4. Load the philosophical guide + wrap-up Source of Truth + aesthetic guide (in parallel)
    let guide = "";
    let sourceOfTruth = "";
    let aestheticGuide = "";
    try {
      [guide, sourceOfTruth, aestheticGuide] = await Promise.all([
        getGuide(env).catch((err) => {
          console.warn("[Forum] Wrapup - guide unavailable:", err.message);
          return "";
        }),
        getWrapupSource(env).catch((err) => {
          console.warn(
            "[Forum] Wrapup - source of truth unavailable:",
            err.message,
          );
          return "";
        }),
        getDebateAestheticGuide(env).catch((err) => {
          console.warn(
            "[Forum] Wrapup - aesthetic guide unavailable:",
            err.message,
          );
          return "";
        }),
      ]);
    } catch (loadErr) {
      console.warn("[Forum] Wrapup - failed to load texts:", loadErr.message);
    }

    // GUARD: guide_text and aesthetic guide are mandatory for verdict generation
    if (!guide) {
      console.error(
        `[Forum] ABORTING wrapup for thread ${threadId}: guide_text is empty`,
      );
      return jsonResponse(
        { error: "Philosophical guide unavailable — cannot generate verdict." },
        503,
        origin,
        env,
      );
    }
    if (!aestheticGuide) {
      console.error(
        `[Forum] ABORTING wrapup for thread ${threadId}: aesthetic guide is empty`,
      );
      return jsonResponse(
        { error: "Aesthetic guide unavailable — cannot generate verdict." },
        503,
        origin,
        env,
      );
    }

    // 5. Build the wrap-up prompt
    const replySummaries = (replies || [])
      .map((r, i) => {
        const author = wrapupDisplayNames[r.user_id] || `User ${i + 1}`;
        const score = (r.upvotes || 0) - (r.downvotes || 0);
        return `[${author}] (score: ${score}): ${r.content}`;
      })
      .join("\n\n");

    // Build internal reference sections (these labels are stripped from output)
    let referenceSection = "";
    if (sourceOfTruth) {
      referenceSection = `
═══ AUTHORITATIVE PHILOSOPHICAL REFERENCE ═══
This text is your primary analytical reference. When the guide and this reference conflict, this reference takes precedence.
${sourceOfTruth}
═══ END REFERENCE ═══
`;
    }
    if (aestheticGuide) {
      referenceSection += `
═══ AESTHETIC PHILOSOPHY FRAMEWORK (Literature & Debate Sessions) ═══
${aestheticGuide}
═══ END AESTHETIC FRAMEWORK ═══
`;
    }

    const prompt = `You are Philosify's AI debate analyst. You evaluate debates using the philosophical framework outlined in the references below, which values reason, individual rights, virtuous self-interest, and objective reality.

Your task: analyse the debate proposition posed by the debate creator, evaluate every comment from participants, and produce a concise philosophical wrap-up.
${referenceSection}
═══ PHILOSOPHICAL GUIDE (analytical framework) ═══
${guide || "Guide unavailable — rely on philosophical first principles: reason, individual rights, virtuous self-interest, and objective reality."}
═══ END GUIDE ═══

═══ DEBATE ═══
Title: ${thread.title}
Proposition: ${thread.content}
Created: ${thread.created_at}
Total replies: ${(replies || []).length}

═══ ARGUMENTS ═══
${replySummaries || "(No arguments were posted.)"}
═══ END ARGUMENTS ═══

Instructions:
1. Summarize the key positions presented (2-3 sentences max per position).
2. Identify the strongest argument and explain WHY it is strongest, grounding your reasoning in the philosophical references above.
3. Note any logical fallacies or contradictions you spotted.
4. Give a philosophical verdict: which position is most aligned with reason, individual rights, and objective reality? Ground your verdict in the philosophical framework.
5. Keep the entire wrap-up under 600 words.
6. Use clear section headers: **Key Positions**, **Strongest Argument**, **Fallacies & Contradictions**, **Verdict**.
7. Be direct and philosophical — not diplomatic. State the verdict clearly without hedging.
8. Write in ${proposerLanguage}.
9. CRITICAL: Your response is the FINAL output shown to users. Do NOT reference internal terms like "Source of Truth", "Philosophical Guide", "reference documents", or any internal system labels. Speak as a philosopher delivering your own analysis — the reasoning must stand on its own merits.
10. Engage with ALL philosophical schools of thought present in the arguments (e.g. Stoicism, Existentialism, Marxism, etc.) — not just one. The verdict should explain why the winning position is strongest based on reason and evidence, referencing the relevant schools.

IMPORTANT: This is a text response, NOT JSON. Write naturally with markdown formatting. The ENTIRE response must be in ${proposerLanguage}.`;

    // 6. Call Grok (same model used for song analysis — proven philosophical reasoning)
    console.log(
      `[Forum] Wrapup - calling Grok for thread ${threadId} in ${proposerLanguage}`,
    );

    let wrapupText;
    try {
      wrapupText = await callGrok(prompt, proposerLanguage, env);
    } catch (grokErr) {
      console.error(`[Forum] Wrapup - Grok error:`, grokErr.message);
      return jsonResponse(
        { error: "AI analysis failed. Please try again." },
        502,
        origin,
        env,
      );
    }

    if (!wrapupText) {
      console.error("[Forum] Wrapup - no text in Grok response");
      return jsonResponse(
        { error: "AI returned an empty response. Please try again." },
        502,
        origin,
        env,
      );
    }

    console.log(`[Forum] Wrapup - received ${wrapupText.length} chars`);

    // 7. Generate podcast-style TTS audio
    let wrapupAudioUrl = null;
    const r2Key = `tts_wrapup_${threadId}.wav`;
    try {
      const wavBuffer = await generateWrapupTTS(
        wrapupText,
        thread.title,
        env,
        proposerLangCode,
      );
      // Save to R2 (fire-and-forget ok, but we await to get the URL)
      const saved = await saveToR2Cache(env, r2Key, wavBuffer, {
        song: thread.title,
        artist: "debate-wrapup",
        language: proposerLangCode || "en",
        model: "gemini-tts",
      });
      if (saved) {
        wrapupAudioUrl = getR2PublicUrl(env, r2Key);
        console.log(`[Forum] Wrapup - audio saved: ${wrapupAudioUrl}`);
      }
    } catch (ttsErr) {
      // TTS failure should NOT block the text wrap-up
      console.warn(
        "[Forum] Wrapup - TTS failed (text still saved):",
        ttsErr.message,
      );
    }

    // 8. Generate guide proof signatures (binds guide hashes to this thread ID)
    let guideProof = null;
    try {
      const proofSecret = await getSecret(env.GUIDE_PROOF_SECRET);
      if (proofSecret) {
        const [guideHash, aestheticHash] = await Promise.all([
          generateGuideProofWithSignature(
            guide,
            threadId,
            proofSecret,
            "grok",
            env,
          ),
          generateGuideProofWithSignature(
            aestheticGuide,
            threadId,
            proofSecret,
            "grok",
            env,
          ),
        ]);
        guideProof = {
          guide_sha256: guideHash.sha256,
          guide_version: guideHash.version,
          guide_signature: guideHash.signature,
          aesthetic_sha256: aestheticHash.sha256,
          aesthetic_signature: aestheticHash.signature,
          source_of_truth_present: !!sourceOfTruth,
          modelo: guideHash.modelo,
          generated_at: new Date().toISOString(),
        };
        console.log(`[Forum] Guide proof generated for thread ${threadId}`);
      }
    } catch (proofErr) {
      console.warn(
        "[Forum] Guide proof generation failed (non-fatal):",
        proofErr.message,
      );
    }

    // 9. Store the wrap-up text + audio URL + guide proof (immutable)
    const updateData = { wrapup: wrapupText };
    if (wrapupAudioUrl) {
      updateData.wrapup_audio_url = wrapupAudioUrl;
    }
    // Store guide proof in thread metadata
    if (guideProof) {
      const { data: currentThread } = await supabase
        .from("forum_threads")
        .select("metadata")
        .eq("id", threadId)
        .single();
      updateData.metadata = {
        ...(currentThread?.metadata || {}),
        guide_proof: guideProof,
      };
    }
    const { error: updateErr } = await supabase
      .from("forum_threads")
      .update(updateData)
      .eq("id", threadId);

    if (updateErr) {
      console.warn(
        "[Forum] Wrapup - failed to persist (returning anyway):",
        updateErr.message,
      );
    }

    let response = jsonResponse(
      {
        success: true,
        wrapup: wrapupText,
        wrapup_audio_url: wrapupAudioUrl,
        cached: false,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Forum] Wrapup exception:", err.message);
    return jsonResponse(
      { error: "Failed to generate wrap-up" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// HANDLER - SERVE WRAP-UP AUDIO FROM R2
// ============================================================
// GET /api/forum/threads/:id/wrapup-audio
// Proxies the cached WAV file from R2 (public bucket may not be accessible).

export async function handleWrapupAudio(request, env, origin, threadId) {
  // SECURITY: Require authentication to access wrapup audio (matches other forum endpoints)
  const auth = await getSupabaseForUser(request, env);
  if (!auth) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  const r2Key = `tts_wrapup_${threadId}.wav`;

  try {
    const audioBuffer = await getFromR2Cache(env, r2Key);

    if (!audioBuffer) {
      return jsonResponse({ error: "Audio not found" }, 404, origin, env);
    }

    let response = new Response(audioBuffer, {
      status: 200,
      headers: {
        ...getCorsHeaders(origin, env),
        "Content-Type": "audio/wav",
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "public, max-age=31536000",
      },
    });
    return addRefreshedCookieToResponse(response, auth.setCookieHeader);
  } catch (err) {
    console.error("[Forum] Wrapup audio error:", err.message);
    return jsonResponse({ error: "Failed to load audio" }, 500, origin, env);
  }
}

// ============================================================
// HANDLER - INVITE USERS TO A DEBATE
// ============================================================
// POST /api/forum/threads/:id/invite
// Sends a DM message + push notification to each selected user.
// Fire-and-forget: no invitation tracking in DB.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_INVITE_BATCH = 20;

export async function handleDebateInvite(request, env, origin, threadId) {
  try {
    // 1. Authenticate
    const { client, userId, setCookieHeader } = await getSupabaseForUser(
      request,
      env,
    );
    if (!userId) {
      return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
    }

    // 2. Rate limit (10 invite requests per minute)
    const rateLimitOk = await checkRateLimit(env, `invite:${userId}`);
    if (!rateLimitOk) {
      return jsonResponse(
        { error: "Too many invitations, slow down" },
        429,
        origin,
        env,
      );
    }

    // 3. Parse + validate body
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.user_ids) || body.user_ids.length === 0) {
      return jsonResponse(
        { error: "user_ids array is required" },
        400,
        origin,
        env,
      );
    }

    const userIds = body.user_ids.filter(
      (id) => typeof id === "string" && UUID_RE.test(id) && id !== userId,
    );
    if (userIds.length === 0) {
      return jsonResponse(
        { error: "No valid user IDs provided" },
        400,
        origin,
        env,
      );
    }
    if (userIds.length > MAX_INVITE_BATCH) {
      return jsonResponse(
        { error: `Maximum ${MAX_INVITE_BATCH} invitations per request` },
        400,
        origin,
        env,
      );
    }

    // 4. Verify the debate thread exists
    const { data: thread, error: threadErr } = await client
      .from("forum_threads")
      .select("id,title,category")
      .eq("id", threadId)
      .single();

    if (threadErr || !thread) {
      return jsonResponse({ error: "Debate not found" }, 404, origin, env);
    }
    if (thread.category !== "debate") {
      return jsonResponse(
        { error: "Thread is not a debate" },
        400,
        origin,
        env,
      );
    }

    // 5. Get inviter's display name
    const nameMap = await fetchDisplayNames(env, [userId]);
    const inviterName = nameMap[userId] || "Someone";

    // 6. Build the invite message
    const debateUrl = `${env.SITE_URL || "https://philosify.app"}/debate/${threadId}`;
    const messageText = `${inviterName} invited you to a debate: "${thread.title}" — ${debateUrl}`;
    const messagePreview = `Debate invite: ${thread.title}`;

    // 7. Send DM + push to each user (in parallel, fire-and-forget style)
    const results = await Promise.allSettled(
      userIds.map(async (targetUserId) => {
        try {
          // a. Find or create DM conversation
          let conversationId = await rpc(env, "find_direct_conversation", {
            p_user_a: userId,
            p_user_b: targetUserId,
          });

          if (!conversationId) {
            // Create new direct conversation
            const conv = await pg(env, "POST", "dm_conversations", {
              body: { type: "direct", created_by: userId },
              single: true,
            });
            if (!conv) throw new Error("Failed to create conversation");
            conversationId = conv.id;

            // Add both members
            await pg(env, "POST", "dm_conversation_members", {
              body: [
                {
                  conversation_id: conversationId,
                  user_id: userId,
                  role: "admin",
                },
                {
                  conversation_id: conversationId,
                  user_id: targetUserId,
                  role: "admin",
                },
              ],
            });

            // Initialize read receipts
            await pg(env, "POST", "dm_read_receipts", {
              body: [
                {
                  conversation_id: conversationId,
                  user_id: userId,
                  last_read_at: new Date().toISOString(),
                },
                {
                  conversation_id: conversationId,
                  user_id: targetUserId,
                  last_read_at: new Date().toISOString(),
                },
              ],
            });
          }

          // b. Insert DM message (unencrypted, system-generated)
          const dm = await pg(env, "POST", "direct_messages", {
            body: {
              sender_id: userId,
              recipient_id: targetUserId,
              conversation_id: conversationId,
              message: messageText,
              is_encrypted: false,
            },
            single: true,
          });

          if (!dm) throw new Error("Failed to insert message");

          // c. Update conversation metadata
          await pg(env, "PATCH", "dm_conversations", {
            filter: `id=eq.${conversationId}`,
            body: {
              last_message_at: new Date().toISOString(),
              last_message_preview: messagePreview,
              last_sender_id: userId,
            },
          });

          // d. Update sender's read receipt
          await pg(env, "POST", "dm_read_receipts", {
            body: {
              conversation_id: conversationId,
              user_id: userId,
              last_read_at: new Date().toISOString(),
            },
            prefer: "resolution=merge-duplicates",
          });

          // e. Send push notification (fire-and-forget)
          // skipPreferenceCheck: invites are high-priority, send even if dm_enabled off
          sendPushNotification(
            env,
            targetUserId,
            {
              title: inviterName,
              body: "Invited you to a debate",
              url: `${debateUrl}`,
              tag: `dm-${conversationId}`,
              type: "dm",
              senderName: inviterName,
            },
            { skipPreferenceCheck: true },
          ).catch((err) =>
            console.error("[Forum] Invite push failed:", err.message),
          );

          return { userId: targetUserId, success: true };
        } catch (err) {
          console.error(
            `[Forum] Invite to ${targetUserId} failed:`,
            err.message,
          );
          return { userId: targetUserId, success: false };
        }
      }),
    );

    const invited = results.filter(
      (r) => r.status === "fulfilled" && r.value.success,
    ).length;

    const resp = jsonResponse(
      { success: true, invited, total: userIds.length },
      200,
      origin,
      env,
    );
    if (setCookieHeader) addRefreshedCookieToResponse(resp, setCookieHeader);
    return resp;
  } catch (err) {
    console.error("[Forum] Invite exception:", err.message);
    return jsonResponse(
      { error: "Failed to send invitations" },
      500,
      origin,
      env,
    );
  }
}
