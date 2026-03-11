// ============================================================
// HANDLER - COLLOQUIUM USER ENDPOINTS
// ============================================================
// User-facing API endpoints for the Academic Colloquium:
//   - Storefront (list colloquiums, browse free)
//   - Access gate (1 credit to read)
//   - Participate gate (1-2 credits to reply)
//   - Propose colloquium (5 credits, Type 2)
//   - Add philosopher (2-3 credits)
//   - Invite users (free access for invitee)
//   - Philosopher roster (with pricing)

import { jsonResponse } from "../utils/index.js";
import {
  getSupabaseForUser,
  addRefreshedCookieToResponse,
} from "../utils/supabase-user.js";
import { pg, rpc } from "../utils/pg.js";
import { getSecret } from "../utils/secrets.js";
import { checkRateLimit } from "../rate-limit/index.js";
import {
  reserveCredit,
  confirmReservation,
  releaseReservation,
  cleanupUserStaleReservations,
} from "../credits/index.js";
import {
  getPhilosopherRoster,
  getPhilosopherPrice,
  findPhilosopher,
  createUserColloquium,
  createColloquiumThread,
  generateAllPhilosopherReplies,
  generateAllPhilosopherRebuttals,
  choosePhilosophersForTopic,
  addPhilosopherOnDemand,
  generateColloquiumVerdictForThread,
  generateImmediateFirstReply,
  translateTitleAndContent,
  broadcastColloquiumEvent,
  notifyAllUsersOfNewColloquium,
} from "./colloquium.js";
import { safeEq } from "../payments/crypto.js";
import {
  generateWrapupTTS,
  translateWithGemini,
  saveToR2Cache,
  getFromR2Cache,
} from "../tts/gemini.js";
import { getCorsHeaders } from "../utils/cors.js";
import { fetchDisplayNames } from "./forum.js";
import { sendPushNotification } from "../push/sender.js";

// ============================================================
// GET /api/colloquium - Storefront list (free to browse)
// ============================================================
// Returns colloquiums without full content — just enough for
// the storefront display (title, philosophers, type, reply count).
export async function handleGetColloquiums(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;
  const url = new URL(request.url);
  const before = url.searchParams.get("before");

  try {
    // Fetch colloquium threads (storefront data only)
    let filter = "category=eq.colloquium";
    if (before) filter += `&last_reply_at=lt.${before}`;

    const threads = await pg(env, "GET", "forum_threads", {
      filter,
      select:
        "id,title,content,category,is_pinned,reply_count,last_reply_at,created_at,wrapup,metadata",
      order: "is_pinned.desc,last_reply_at.desc",
      limit: 20,
    });

    // Check user's access for each thread
    const threadIds = (threads || []).map((t) => `"${t.id}"`).join(",");
    let accessRecords = [];
    if (threadIds) {
      accessRecords =
        (await pg(env, "GET", "colloquium_access", {
          filter: `user_id=eq.${userId}&thread_id=in.(${threadIds})`,
          select: "thread_id,access_type",
        })) || [];
    }

    // Build access map: { threadId: { access: true, participate: true, proposer: true } }
    const accessMap = {};
    for (const record of accessRecords) {
      if (!accessMap[record.thread_id]) accessMap[record.thread_id] = {};
      accessMap[record.thread_id][record.access_type] = true;
    }

    // Build storefront response (filter out closed colloquiums for non-proposers)
    const colloquiums = (threads || [])
      .filter((t) => {
        const metadata = t.metadata || {};
        const visibility = metadata.visibility || "open";
        if (visibility === "closed") {
          // Closed: only visible to proposer (and invited users)
          const userAccess = accessMap[t.id] || {};
          return userAccess.proposer || userAccess.invite || false;
        }
        return true; // Open: everyone sees it
      })
      .map((t) => {
        const userAccess = accessMap[t.id] || {};
        const isProposer = userAccess.proposer || false;
        const metadata = t.metadata || {};
        const isOpenDebate = metadata.colloquium_type === "open_debate";
        // Open debates are free to read — always hasAccess
        const hasAccess =
          isOpenDebate ||
          isProposer ||
          userAccess.access ||
          userAccess.invite ||
          false;
        const canParticipate = isProposer || userAccess.participate || false;

        return {
          id: t.id,
          // Storefront shows title and excerpt for free
          title: t.title,
          excerpt:
            t.content && t.content.length > 150
              ? t.content.slice(0, 150) + "..."
              : t.content,
          category: t.category,
          is_pinned: t.is_pinned,
          reply_count: t.reply_count,
          last_reply_at: t.last_reply_at,
          created_at: t.created_at,
          has_verdict: !!t.wrapup,
          // Metadata for display
          colloquium_type: metadata.colloquium_type || "daily",
          visibility: metadata.visibility || "open",
          philosophers: metadata.philosophers || [],
          philosopher_prices: metadata.philosopher_prices || {},
          philosopher_index: metadata.philosopher_index ?? 4,
          user_added_philosophers: metadata.user_added_philosophers || [],
          proposer_id: metadata.proposer_id || null,
          verdict_at: metadata.auto_verdict_at || metadata.verdict_at || null,
          // Translations for storefront
          translations: metadata.translations || {},
          // Access state for this user
          access: {
            hasAccess,
            canParticipate,
            isProposer,
            isInvited: userAccess.invite || false,
            isOpenDebate,
          },
        };
      });

    let response = jsonResponse({ colloquiums }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Colloquium] List error:", err.message);
    return jsonResponse(
      { error: "Failed to load colloquiums" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// GET /api/colloquium/:id - Full content (requires access)
// ============================================================
export async function handleGetColloquium(request, env, origin, threadId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Check access
    const accessRecords = await pg(env, "GET", "colloquium_access", {
      filter: `user_id=eq.${userId}&thread_id=eq.${threadId}`,
      select: "access_type",
    });

    if (accessRecords === null) {
      console.error(
        `[Colloquium] Failed to query colloquium_access for user=${userId} thread=${threadId}`,
      );
      return jsonResponse(
        { error: "Failed to check access" },
        500,
        origin,
        env,
      );
    }

    const accessTypes = (accessRecords || []).map((r) => r.access_type);

    // Check if this is an open_debate (free to read)
    const threadMeta = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}`,
      select: "metadata",
      limit: 1,
    });
    const isOpenDebate =
      threadMeta?.[0]?.metadata?.colloquium_type === "open_debate";

    const hasAccess =
      isOpenDebate ||
      accessTypes.includes("access") ||
      accessTypes.includes("participate") ||
      accessTypes.includes("proposer") ||
      accessTypes.includes("invite");

    if (!hasAccess) {
      return jsonResponse(
        { error: "Access required", code: "ACCESS_REQUIRED" },
        403,
        origin,
        env,
      );
    }

    // Fetch full thread
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

    // On-demand wrapup translation: if verdict exists but user's language
    // translation is missing, translate now and cache for future requests.
    const reqUrl = new URL(request.url);
    const reqLang = (reqUrl.searchParams.get("lang") || "en").split("-")[0];
    if (
      thread.wrapup &&
      reqLang !== "en" &&
      !thread.metadata?.translations?.wrapup?.[reqLang]
    ) {
      try {
        const apiKey = await getSecret(env.GEMINI_API_KEY);
        const englishText =
          thread.metadata?.translations?.wrapup?.en || thread.wrapup;
        if (apiKey && englishText) {
          console.log(
            `[Colloquium] Starting on-demand wrapup translation to ${reqLang} (${englishText.length} chars, thread ${thread.id})`,
          );

          // Try up to 2 attempts — Gemini can return original text on transient failures
          let translated = null;
          for (let attempt = 1; attempt <= 2; attempt++) {
            const result = await translateWithGemini(
              englishText,
              reqLang,
              "en",
              apiKey,
            );
            if (result && result !== englishText) {
              translated = result;
              break;
            }
            if (attempt === 1) {
              console.warn(
                `[Colloquium] Wrapup translation attempt 1 returned original text for ${reqLang}, retrying...`,
              );
            }
          }

          if (translated) {
            // Inject into response so user sees it immediately
            if (!thread.metadata) thread.metadata = {};
            if (!thread.metadata.translations)
              thread.metadata.translations = {};
            if (!thread.metadata.translations.wrapup)
              thread.metadata.translations.wrapup = { en: englishText };
            thread.metadata.translations.wrapup[reqLang] = translated;

            // Persist to DB for future requests (fire-and-forget)
            pg(env, "PATCH", "forum_threads", {
              filter: `id=eq.${thread.id}`,
              body: {
                metadata: thread.metadata,
              },
            }).catch((err) =>
              console.warn(
                `[Colloquium] Failed to cache wrapup translation for ${reqLang}:`,
                err.message,
              ),
            );
            console.log(
              `[Colloquium] On-demand wrapup translation for ${reqLang} (thread ${thread.id}, ${translated.length} chars)`,
            );
          } else {
            console.error(
              `[Colloquium] Wrapup translation FAILED for ${reqLang} after 2 attempts (thread ${thread.id}). User sees English fallback.`,
            );
          }
        }
      } catch (err) {
        console.warn(
          `[Colloquium] On-demand wrapup translation failed for ${reqLang}:`,
          err.message,
        );
        // Non-fatal: user sees English fallback
      }
    }

    // On-demand title/content translation: if the user's language is missing,
    // translate now and cache.  This handles cases where batch translation
    // failed during creation (e.g. model 404) or new languages are added.
    if (reqLang !== "en") {
      let metaDirty = false;
      try {
        const apiKey = await getSecret(env.GEMINI_API_KEY);
        if (apiKey) {
          if (!thread.metadata) thread.metadata = {};
          if (!thread.metadata.translations) thread.metadata.translations = {};

          // Title
          if (thread.title && !thread.metadata.translations.title?.[reqLang]) {
            const enTitle =
              thread.metadata.translations.title?.en || thread.title;
            const trTitle = await translateWithGemini(
              enTitle,
              reqLang,
              "en",
              apiKey,
            );
            if (trTitle && trTitle !== enTitle) {
              if (!thread.metadata.translations.title)
                thread.metadata.translations.title = { en: enTitle };
              thread.metadata.translations.title[reqLang] = trTitle;
              metaDirty = true;
            }
          }

          // Content
          if (
            thread.content &&
            !thread.metadata.translations.content?.[reqLang]
          ) {
            const enContent =
              thread.metadata.translations.content?.en || thread.content;
            const trContent = await translateWithGemini(
              enContent,
              reqLang,
              "en",
              apiKey,
            );
            if (trContent && trContent !== enContent) {
              if (!thread.metadata.translations.content)
                thread.metadata.translations.content = { en: enContent };
              thread.metadata.translations.content[reqLang] = trContent;
              metaDirty = true;
            }
          }

          // Persist cached translations (fire-and-forget)
          if (metaDirty) {
            pg(env, "PATCH", "forum_threads", {
              filter: `id=eq.${thread.id}`,
              body: { metadata: thread.metadata },
            }).catch((err) =>
              console.warn(
                `[Colloquium] Failed to cache title/content translation for ${reqLang}:`,
                err.message,
              ),
            );
            console.log(
              `[Colloquium] On-demand title/content translation for ${reqLang} (thread ${thread.id})`,
            );
          }
        }
      } catch (err) {
        console.warn(
          `[Colloquium] On-demand title/content translation failed for ${reqLang}:`,
          err.message,
        );
      }
    }

    // Fetch replies with metadata (includes translations)
    const { data: replies } = await supabase
      .from("forum_replies")
      .select(
        "id, user_id, content, upvotes, downvotes, created_at, edited_at, parent_id, is_philosopher, philosopher_name, metadata",
      )
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    // Fetch display names for user replies
    const userReplyIds = (replies || [])
      .filter((r) => !r.is_philosopher)
      .map((r) => r.user_id);
    const uniqueUserIds = [...new Set([...userReplyIds])];

    let displayNames = {};
    if (uniqueUserIds.length > 0) {
      const supabaseUrl = await getSecret(env.SUPABASE_URL);
      const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
      const filter = uniqueUserIds.map((id) => `"${id}"`).join(",");
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
      for (const p of profiles) {
        if (p.display_name) displayNames[p.user_id] = p.display_name;
      }
    }

    // Get user's votes
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

    // On-demand translation for user comments: translate non-philosopher
    // replies that don't yet have the user's language cached.
    if (reqLang !== "en" && replies && replies.length > 0) {
      try {
        const apiKey = await getSecret(env.GEMINI_API_KEY);
        if (apiKey) {
          const untranslatedUserReplies = replies.filter(
            (r) =>
              !r.is_philosopher &&
              r.content &&
              !r.metadata?.translations?.[reqLang],
          );
          // Translate up to 10 user comments per request to avoid subrequest limits
          const toTranslate = untranslatedUserReplies.slice(0, 10);
          if (toTranslate.length > 0) {
            const translationResults = await Promise.allSettled(
              toTranslate.map(async (r) => {
                const translated = await translateWithGemini(
                  r.content,
                  reqLang,
                  "en",
                  apiKey,
                );
                if (translated && translated !== r.content) {
                  if (!r.metadata) r.metadata = {};
                  if (!r.metadata.translations) r.metadata.translations = {};
                  r.metadata.translations[reqLang] = translated;

                  // Cache to DB (fire-and-forget)
                  pg(env, "PATCH", "forum_replies", {
                    filter: `id=eq.${r.id}`,
                    body: { metadata: r.metadata },
                  }).catch(() => {});
                }
              }),
            );
            const succeeded = translationResults.filter(
              (r) => r.status === "fulfilled",
            ).length;
            if (succeeded > 0) {
              console.log(
                `[Colloquium] On-demand user comment translation: ${succeeded}/${toTranslate.length} for ${reqLang}`,
              );
            }
          }
        }
      } catch (err) {
        console.warn(
          `[Colloquium] User comment translation failed for ${reqLang}:`,
          err.message,
        );
      }
    }

    const canParticipate =
      accessTypes.includes("participate") || accessTypes.includes("proposer");

    const sanitizedThread = {
      ...thread,
      isOwner: thread.user_id === userId,
      user_id: undefined,
    };

    const sanitizedReplies = (replies || []).map((r) => {
      const userVote = userVotes.find((v) => v.reply_id === r.id);
      return {
        ...r,
        author: r.is_philosopher
          ? r.philosopher_name
          : displayNames[r.user_id] || "user",
        isOwner: r.user_id === userId,
        myVote: userVote?.vote_type || null,
        user_id: undefined,
      };
    });

    // Compute poll tallies from metadata.poll_votes (privacy: never expose user IDs)
    const pollVotes = thread.metadata?.poll_votes || {};
    const pollTallies = {};
    for (const vid of Object.values(pollVotes)) {
      pollTallies[vid] = (pollTallies[vid] || 0) + 1;
    }
    const myPollVote = pollVotes[userId] || null;

    let response = jsonResponse(
      {
        thread: sanitizedThread,
        replies: sanitizedReplies,
        access: {
          hasAccess: true,
          canParticipate,
          isProposer: accessTypes.includes("proposer"),
          isOpenDebate,
        },
        poll: {
          tallies: pollTallies,
          myVote: myPollVote,
          totalVotes: Object.keys(pollVotes).length,
        },
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Colloquium] Get thread error:", err.message);
    return jsonResponse(
      { error: "Failed to load colloquium" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/colloquium/:id/access - Pay 1 credit to read
// ============================================================
export async function handleColloquiumAccess(request, env, origin, threadId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  try {
    // Check if already has access
    const existing = await pg(env, "GET", "colloquium_access", {
      filter: `user_id=eq.${userId}&thread_id=eq.${threadId}&access_type=in.(access,proposer,invite)`,
      select: "id",
      limit: 1,
    });

    if (existing && existing.length > 0) {
      let response = jsonResponse(
        { success: true, already_unlocked: true },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // Clean up any stale reservations from prior failed attempts
    await cleanupUserStaleReservations(env, userId);

    // Reserve 1 credit
    const reservation = await reserveCredit(env, userId);
    if (!reservation.success) {
      return jsonResponse(
        {
          error: "Insufficient credits",
          code: "INSUFFICIENT_CREDITS",
          credits: 0,
        },
        402,
        origin,
        env,
      );
    }

    try {
      // Grant access
      console.log(
        `[Colloquium] Inserting access record for user=${userId} thread=${threadId}`,
      );
      const inserted = await pg(env, "POST", "colloquium_access", {
        body: {
          user_id: userId,
          thread_id: threadId,
          access_type: "access",
          credits_spent: 1,
        },
      });

      if (!inserted) {
        console.error(
          `[Colloquium] INSERT failed for colloquium_access: user=${userId} thread=${threadId}`,
        );
        throw new Error("Failed to insert access record");
      }
      console.log(`[Colloquium] Access granted for user=${userId}`);

      // Confirm credit
      const confirmed = await confirmReservation(
        env,
        reservation.reservationId,
        `colloquium:access:${threadId}`,
      );

      let response = jsonResponse(
        {
          success: true,
          balance: {
            total: confirmed.newTotal,
            credits: confirmed.credits,
            freeRemaining: confirmed.freeRemaining,
          },
        },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
      try {
        await releaseReservation(env, reservation.reservationId, "failed");
      } catch (releaseErr) {
        console.error(
          `[Colloquium] Release failed during access error recovery: ${releaseErr.message}`,
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("[Colloquium] Access error:", err.message);
    return jsonResponse({ error: "Failed to unlock access" }, 500, origin, env);
  }
}

// ============================================================
// POST /api/colloquium/:id/participate - Pay 1-2 credits to reply
// ============================================================
// Type 1 (daily): 1 credit on top of access
// Type 2 (user_proposed): 2 credits on top of access
export async function handleColloquiumParticipate(
  request,
  env,
  origin,
  threadId,
) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  try {
    // Check if already has participation access
    const existing = await pg(env, "GET", "colloquium_access", {
      filter: `user_id=eq.${userId}&thread_id=eq.${threadId}&access_type=in.(participate,proposer)`,
      select: "id",
      limit: 1,
    });

    if (existing && existing.length > 0) {
      let response = jsonResponse(
        { success: true, already_unlocked: true },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // Determine colloquium type to set cost and access requirements
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}`,
      select: "metadata",
      limit: 1,
    });
    const colloquiumType = threads?.[0]?.metadata?.colloquium_type || "daily";
    const isOpenDebate = colloquiumType === "open_debate";

    // Open debates don't require prior access (they're free to read)
    // Other types require access or invite first
    if (!isOpenDebate) {
      const accessCheck = await pg(env, "GET", "colloquium_access", {
        filter: `user_id=eq.${userId}&thread_id=eq.${threadId}&access_type=in.(access,invite)`,
        select: "id",
        limit: 1,
      });

      if (!accessCheck || accessCheck.length === 0) {
        return jsonResponse(
          { error: "You must unlock access first", code: "ACCESS_REQUIRED" },
          403,
          origin,
          env,
        );
      }
    }

    // Cost: open_debate = 1, daily = 1, user_proposed = 2
    const cost = colloquiumType === "user_proposed" ? 2 : 1;

    // Clean up any stale reservations from prior failed attempts
    await cleanupUserStaleReservations(env, userId);

    // Reserve credits
    const reservations = [];
    for (let i = 0; i < cost; i++) {
      const reservation = await reserveCredit(env, userId);
      if (!reservation.success) {
        // Release any already-reserved credits
        for (const prev of reservations) {
          try {
            await releaseReservation(env, prev.reservationId, "failed");
          } catch (releaseErr) {
            console.error(
              `[Colloquium] Release failed during participate reserve rollback: ${releaseErr.message}`,
            );
          }
        }
        return jsonResponse(
          {
            error: "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            needed: cost,
          },
          402,
          origin,
          env,
        );
      }
      reservations.push(reservation);
    }

    try {
      // Grant participation
      const inserted = await pg(env, "POST", "colloquium_access", {
        body: {
          user_id: userId,
          thread_id: threadId,
          access_type: "participate",
          credits_spent: cost,
        },
      });

      if (!inserted) {
        throw new Error("Failed to insert participate record");
      }

      // Confirm all credits
      let lastConfirm;
      for (const res of reservations) {
        lastConfirm = await confirmReservation(
          env,
          res.reservationId,
          `colloquium:participate:${threadId}`,
        );
      }

      let response = jsonResponse(
        {
          success: true,
          balance: {
            total: lastConfirm.newTotal,
            credits: lastConfirm.credits,
            freeRemaining: lastConfirm.freeRemaining,
          },
        },
        200,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
      for (const res of reservations) {
        try {
          await releaseReservation(env, res.reservationId, "failed");
        } catch (releaseErr) {
          console.error(
            `[Colloquium] Release failed during participate error recovery: ${releaseErr.message}`,
          );
        }
      }
      throw err;
    }
  } catch (err) {
    console.error("[Colloquium] Participate error:", err.message);
    return jsonResponse(
      { error: "Failed to unlock participation" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/colloquium/:id/add-philosopher - Pay 2-3 credits
// ============================================================
export async function handleAddPhilosopher(
  request,
  env,
  origin,
  threadId,
  ctx,
) {
  try {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

    const { userId, setCookieHeader } = auth;

    const body = await request.json();
    const philosopherName = body.philosopher_name;

    if (!philosopherName) {
      return jsonResponse(
        { error: "philosopher_name is required" },
        400,
        origin,
        env,
      );
    }

    const philosopher = findPhilosopher(philosopherName);
    if (!philosopher) {
      return jsonResponse({ error: "Philosopher not found" }, 404, origin, env);
    }

    // Check if user has participation access
    const accessCheck = await pg(env, "GET", "colloquium_access", {
      filter: `user_id=eq.${userId}&thread_id=eq.${threadId}&access_type=in.(participate,proposer)`,
      select: "id",
      limit: 1,
    });

    if (!accessCheck || accessCheck.length === 0) {
      return jsonResponse(
        {
          error: "Participation access required",
          code: "PARTICIPATE_REQUIRED",
        },
        403,
        origin,
        env,
      );
    }

    // Check if philosopher already in this colloquium
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}`,
      select: "metadata,wrapup",
      limit: 1,
    });

    if (!threads || threads.length === 0) {
      return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
    }

    const thread = threads[0];
    if (thread.wrapup) {
      return jsonResponse(
        { error: "Colloquium already has a verdict" },
        400,
        origin,
        env,
      );
    }

    const existingPhilosophers = thread.metadata?.philosophers || [];
    if (existingPhilosophers.includes(philosopher.name)) {
      return jsonResponse(
        { error: "This philosopher is already in the debate" },
        400,
        origin,
        env,
      );
    }

    // Determine cost
    const cost = getPhilosopherPrice(philosopher.name);

    // Clean up any stale reservations from prior failed attempts
    await cleanupUserStaleReservations(env, userId);

    // Reserve credits
    const reservations = [];
    for (let i = 0; i < cost; i++) {
      const reservation = await reserveCredit(env, userId);
      if (!reservation.success) {
        for (const prev of reservations) {
          try {
            await releaseReservation(env, prev.reservationId, "failed");
          } catch (releaseErr) {
            console.error(
              `[Colloquium] Release failed during add-philosopher reserve rollback: ${releaseErr.message}`,
            );
          }
        }
        return jsonResponse(
          {
            error: "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            needed: cost,
          },
          402,
          origin,
          env,
        );
      }
      reservations.push(reservation);
    }

    try {
      // Confirm credits BEFORE starting background generation
      let lastConfirm;
      for (const res of reservations) {
        lastConfirm = await confirmReservation(
          env,
          res.reservationId,
          `colloquium:philosopher:${threadId}:${philosopher.name}`,
        );
      }

      // Generate philosopher reply in background (broadcast will notify frontend)
      ctx.waitUntil(
        addPhilosopherOnDemand(env, threadId, philosopher.name).catch(
          (bgErr) => {
            console.error(
              `[Colloquium] Background addPhilosopher failed for ${philosopher.name}:`,
              bgErr.message,
            );
            // Credits already confirmed — no release (work was attempted)
          },
        ),
      );

      let response = jsonResponse(
        {
          success: true,
          philosopher: philosopher.name,
          price: cost,
          balance: {
            total: lastConfirm.newTotal,
            credits: lastConfirm.credits,
            freeRemaining: lastConfirm.freeRemaining,
          },
        },
        201,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (innerErr) {
      // Release all reservations on failure
      for (const res of reservations) {
        try {
          await releaseReservation(env, res.reservationId, "failed");
        } catch (releaseErr) {
          console.error(
            `[Colloquium] Release failed during add-philosopher error recovery: ${releaseErr.message}`,
          );
        }
      }
      throw innerErr;
    }
  } catch (err) {
    console.error("[Colloquium] Add philosopher error:", err.message);
    return jsonResponse(
      { error: `Failed to add philosopher: ${err.message}` },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/colloquium/propose - User proposes a topic (5 credits)
// ============================================================
// Architecture: Sync phase creates thread + charges credits + returns 201.
// Background phase (ctx.waitUntil) generates philosopher replies + rebuttals
// in parallel, then marks rebuttals_complete so the verdict button appears.
export async function handleProposeColloquium(request, env, origin, ctx) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(env, `colloquium-propose:${userId}:${ip}`);
  if (!rl) {
    return jsonResponse(
      { error: "Too many proposals. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    const content = (body.content || "").trim();
    const visibility = body.visibility === "closed" ? "closed" : "open";
    const lang = (body.lang || "en").trim();

    if (!title || title.length < 3 || title.length > 200) {
      return jsonResponse(
        { error: "Title required (3-200 chars)" },
        400,
        origin,
        env,
      );
    }
    if (!content || content.length < 10 || content.length > 5000) {
      return jsonResponse(
        { error: "Content required (10-5000 chars)" },
        400,
        origin,
        env,
      );
    }

    // Reserve 5 credits
    const reservations = [];
    for (let i = 0; i < 5; i++) {
      const reservation = await reserveCredit(env, userId);
      if (!reservation.success) {
        for (const prev of reservations) {
          try {
            await releaseReservation(env, prev.reservationId, "failed");
          } catch (releaseErr) {
            console.error(
              `[Colloquium] Release failed during propose reserve rollback: ${releaseErr.message}`,
            );
          }
        }
        return jsonResponse(
          {
            error: "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            needed: 5,
          },
          402,
          origin,
          env,
        );
      }
      reservations.push(reservation);
    }

    try {
      // AI chooses the best 4 philosophers for this topic
      console.log("[Colloquium] AI selecting philosophers for user topic...");
      const chosenNames = await choosePhilosophersForTopic(env, title, content);
      console.log("[Colloquium] Selected:", chosenNames.join(", "));

      // === SYNC PHASE: Create thread + translate title/content ===
      const result = await createColloquiumThread(
        env,
        userId,
        title,
        content,
        chosenNames,
        visibility,
        lang,
      );

      if (!result.success) {
        for (const res of reservations) {
          try {
            await releaseReservation(env, res.reservationId, "failed");
          } catch (releaseErr) {
            console.error(
              `[Colloquium] Release failed during propose thread-creation rollback: ${releaseErr.message}`,
            );
          }
        }
        return jsonResponse(
          { error: result.reason || "Failed to create colloquium" },
          500,
          origin,
          env,
        );
      }

      // Confirm all 5 credits
      let lastConfirm;
      for (const res of reservations) {
        lastConfirm = await confirmReservation(
          env,
          res.reservationId,
          `colloquium:propose:${result.threadId}`,
        );
      }

      // === IMMEDIATE FIRST REPLY + CRON FOR THE REST ===
      // Generate the first philosopher reply immediately (like daily colloquiums).
      // Remaining philosophers speak via the */5 cron, one every 5 min.
      // If the immediate generation fails, the cron safety net handles it
      // (next_philosopher_at is set to T+3min in createColloquiumThread).
      if (ctx) {
        // First philosopher speaks immediately
        ctx.waitUntil(
          generateImmediateFirstReply(env, result.threadId).catch((err) =>
            console.error(
              "[Colloquium] Immediate first reply failed (cron will handle it):",
              err.message,
            ),
          ),
        );

        // Push-notify all users about the new colloquium (fire-and-forget)
        ctx.waitUntil(
          notifyAllUsersOfNewColloquium(
            env,
            result.threadId,
            title,
            "user_proposed",
          ).catch((err) =>
            console.error(
              "[Colloquium] Push notify failed for propose:",
              err.message,
            ),
          ),
        );
      }

      let response = jsonResponse(
        {
          success: true,
          threadId: result.threadId,
          title: result.title,
          philosophers: chosenNames,
          balance: {
            total: lastConfirm.newTotal,
            credits: lastConfirm.credits,
            freeRemaining: lastConfirm.freeRemaining,
          },
        },
        201,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
      for (const res of reservations) {
        try {
          await releaseReservation(env, res.reservationId, "failed");
        } catch (releaseErr) {
          console.error(
            `[Colloquium] Release failed during propose error recovery: ${releaseErr.message}`,
          );
        }
      }
      throw err;
    }
  } catch (err) {
    console.error("[Colloquium] Propose error:", err.message);
    return jsonResponse(
      { error: "Failed to create colloquium" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/colloquium/:id/invite - Invite users to colloquium
// ============================================================
// Grants free ACCESS (not participation) to invited users.
// - User-proposed / open_debate: only the proposer can invite.
// - AI daily: any participant (user with access) can invite.
export async function handleColloquiumInvite(request, env, origin, threadId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  try {
    // Rate limit (10 invite requests per minute)
    const rateLimitOk = await checkRateLimit(
      env,
      `colloquium-invite:${userId}`,
    );
    if (!rateLimitOk) {
      return jsonResponse(
        { error: "Too many invitations, slow down" },
        429,
        origin,
        env,
      );
    }

    // Fetch thread to determine colloquium type and title
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}`,
      select: "id,title,metadata",
      limit: 1,
    });
    if (!threads || threads.length === 0) {
      return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
    }
    const colloquiumType =
      threads[0].metadata?.colloquium_type ||
      threads[0].metadata?.type ||
      "daily";

    // Authorization: proposer only for user-proposed/open_debate; any participant for daily
    if (colloquiumType === "daily") {
      const accessCheck = await pg(env, "GET", "colloquium_access", {
        filter: `user_id=eq.${userId}&thread_id=eq.${threadId}&access_type=in.(proposer,invite,access)`,
        select: "id",
        limit: 1,
      });
      if (!accessCheck || accessCheck.length === 0) {
        return jsonResponse(
          { error: "You must have access to this colloquium to invite others" },
          403,
          origin,
          env,
        );
      }
    } else {
      const proposerCheck = await pg(env, "GET", "colloquium_access", {
        filter: `user_id=eq.${userId}&thread_id=eq.${threadId}&access_type=eq.proposer`,
        select: "id",
        limit: 1,
      });
      if (!proposerCheck || proposerCheck.length === 0) {
        return jsonResponse(
          { error: "Only the proposer can invite users" },
          403,
          origin,
          env,
        );
      }
    }

    const body = await request.json();
    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const MAX_INVITE_BATCH = 20;

    let userIds = [];
    if (Array.isArray(body.user_ids) && body.user_ids.length > 0) {
      userIds = body.user_ids.filter(
        (id) => typeof id === "string" && UUID_RE.test(id) && id !== userId,
      );
      if (userIds.length > MAX_INVITE_BATCH) {
        return jsonResponse(
          { error: `Maximum ${MAX_INVITE_BATCH} invitations per request` },
          400,
          origin,
          env,
        );
      }
    } else if (
      body.user_id &&
      typeof body.user_id === "string" &&
      UUID_RE.test(body.user_id)
    ) {
      userIds = [body.user_id];
    }

    if (userIds.length === 0) {
      return jsonResponse(
        { error: "user_id or user_ids array is required" },
        400,
        origin,
        env,
      );
    }

    let invited = 0;
    let alreadyInvited = 0;
    const invitedUserIds = [];

    for (const inviteUserId of userIds) {
      const existingAccess = await pg(env, "GET", "colloquium_access", {
        filter: `user_id=eq.${inviteUserId}&thread_id=eq.${threadId}`,
        select: "id",
        limit: 1,
      });

      if (existingAccess && existingAccess.length > 0) {
        alreadyInvited += 1;
        continue;
      }

      const inserted = await pg(env, "POST", "colloquium_access", {
        body: {
          user_id: inviteUserId,
          thread_id: threadId,
          access_type: "invite",
          credits_spent: 0,
        },
      });

      if (inserted) {
        invited += 1;
        invitedUserIds.push(inviteUserId);
      }
    }

    // Send DM + push notification to each invited user
    if (invitedUserIds.length > 0) {
      const threadTitle = threads[0].title || "Academic Colloquium";
      const nameMap = await fetchDisplayNames(env, [userId]);
      const inviterName = nameMap[userId] || "Someone";
      const siteUrl = env.SITE_URL || "https://everything.philosify.org";
      const colloquiumUrl = `${siteUrl}/debate/${threadId}`;
      const messageText = `${inviterName} invited you to a colloquium: "${threadTitle}" — ${colloquiumUrl}`;
      const messagePreview = `Colloquium invite: ${threadTitle}`;

      await Promise.allSettled(
        invitedUserIds.map(async (targetUserId) => {
          try {
            let conversationId = await rpc(env, "find_direct_conversation", {
              p_user_a: userId,
              p_user_b: targetUserId,
            });

            if (!conversationId) {
              const conv = await pg(env, "POST", "dm_conversations", {
                body: { type: "direct", created_by: userId },
                single: true,
              });
              if (!conv) throw new Error("Failed to create conversation");
              conversationId = conv.id;

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

            await pg(env, "PATCH", "dm_conversations", {
              filter: `id=eq.${conversationId}`,
              body: {
                last_message_at: new Date().toISOString(),
                last_message_preview: messagePreview,
                last_sender_id: userId,
              },
            });

            await pg(env, "POST", "dm_read_receipts", {
              body: {
                conversation_id: conversationId,
                user_id: userId,
                last_read_at: new Date().toISOString(),
              },
              prefer: "resolution=merge-duplicates",
            });

            sendPushNotification(
              env,
              targetUserId,
              {
                title: inviterName,
                body: "Invited you to a colloquium",
                url: `${siteUrl}/debate/${threadId}`,
                tag: `dm-${conversationId}`,
                type: "dm",
                senderName: inviterName,
              },
              { skipPreferenceCheck: true },
            ).catch((err) =>
              console.error("[Colloquium] Invite push failed:", err.message),
            );

            return { success: true };
          } catch (err) {
            console.error(
              `[Colloquium] DM/push to ${targetUserId} failed:`,
              err.message,
            );
            return { success: false };
          }
        }),
      );
    }

    // Update invited_users in metadata
    if (invited > 0) {
      const threadRows = await pg(env, "GET", "forum_threads", {
        filter: `id=eq.${threadId}`,
        select: "metadata",
        limit: 1,
      });
      if (threadRows && threadRows.length > 0) {
        const metadata = threadRows[0].metadata || {};
        const invitedList = metadata.invited_users || [];
        const toAdd = userIds.filter((id) => !invitedList.includes(id));
        if (toAdd.length > 0) {
          await pg(env, "PATCH", "forum_threads", {
            filter: `id=eq.${threadId}`,
            body: {
              metadata: {
                ...metadata,
                invited_users: [...invitedList, ...toAdd],
              },
            },
          });
        }
      }
    }

    let response = jsonResponse(
      {
        success: true,
        invited,
        already_invited: alreadyInvited,
        total: userIds.length,
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Colloquium] Invite error:", err.message);
    return jsonResponse({ error: "Failed to invite user" }, 500, origin, env);
  }
}

// ============================================================
// GET /api/colloquium/roster - Philosopher roster with pricing
// ============================================================
export async function handleGetRoster(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { setCookieHeader } = auth;
  const roster = getPhilosopherRoster();

  let response = jsonResponse({ roster }, 200, origin, env);
  return addRefreshedCookieToResponse(response, setCookieHeader);
}

// ============================================================
// POST /api/colloquium/open-debate - Propose an Open Debate (3 credits)
// ============================================================
// Type 2: Open Debate
//   - 3 credits to create (no AI philosophers included)
//   - Free to read (no access gate)
//   - 1 credit to participate (reply)
//   - Users can add philosophers on-demand (2-3 credits each)
//   - Proposer triggers verdict manually; auto-verdict after 59min as safety net
export async function handleProposeOpenDebate(request, env, origin, ctx) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(env, `open-debate-propose:${userId}:${ip}`);
  if (!rl) {
    return jsonResponse(
      { error: "Too many proposals. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    const body = await request.json();
    const title = (body.title || "").trim();
    const content = (body.content || "").trim();
    const lang = (body.lang || "en").trim();

    if (!title || title.length < 3 || title.length > 200) {
      return jsonResponse(
        { error: "Title required (3-200 chars)" },
        400,
        origin,
        env,
      );
    }
    if (!content || content.length < 10 || content.length > 5000) {
      return jsonResponse(
        { error: "Content required (10-5000 chars)" },
        400,
        origin,
        env,
      );
    }

    // Reserve 3 credits
    const reservations = [];
    for (let i = 0; i < 3; i++) {
      const reservation = await reserveCredit(env, userId);
      if (!reservation.success) {
        for (const prev of reservations) {
          try {
            await releaseReservation(env, prev.reservationId, "failed");
          } catch (releaseErr) {
            console.error(
              `[OpenDebate] Release failed during reserve rollback: ${releaseErr.message}`,
            );
          }
        }
        return jsonResponse(
          {
            error: "Insufficient credits",
            code: "INSUFFICIENT_CREDITS",
            needed: 3,
          },
          402,
          origin,
          env,
        );
      }
      reservations.push(reservation);
    }

    try {
      // Pre-translate title and content
      console.log("[OpenDebate] Pre-translating topic...");
      const topicTranslations = await translateTitleAndContent(
        title,
        content,
        env,
      );

      const today = new Date().toISOString().split("T")[0];
      const autoVerdictAt = new Date(Date.now() + 59 * 60 * 1000).toISOString(); // 59 minutes safety net

      // Create the thread — no philosophers, proposer triggers verdict
      const thread = await pg(env, "POST", "forum_threads", {
        body: {
          user_id: userId,
          title,
          content,
          category: "colloquium",
          is_pinned: false,
          metadata: {
            type: "academic_colloquium",
            colloquium_type: "open_debate",
            visibility: "open",
            date: today,
            proposer_id: userId,
            lang,
            philosophers: [],
            philosopher_prices: {},
            philosopher_index: 0,
            auto_verdict_at: autoVerdictAt,
            invited_users: [],
            translations: {
              title: topicTranslations.title,
              content: topicTranslations.content,
            },
          },
        },
        single: true,
      });

      if (!thread) {
        console.error("[OpenDebate] Failed to create thread");
        for (const res of reservations) {
          try {
            await releaseReservation(env, res.reservationId, "failed");
          } catch (releaseErr) {
            console.error(
              `[OpenDebate] Release failed during thread-creation rollback: ${releaseErr.message}`,
            );
          }
        }
        return jsonResponse(
          { error: "Failed to create open debate" },
          500,
          origin,
          env,
        );
      }

      console.log(`[OpenDebate] Created thread: ${thread.id}`);

      // Grant proposer full access (access + participate + proposer)
      const proposerAccess = await pg(env, "POST", "colloquium_access", {
        body: {
          user_id: userId,
          thread_id: thread.id,
          access_type: "proposer",
          credits_spent: 3,
        },
      });

      if (!proposerAccess) {
        console.error("[OpenDebate] Failed to insert proposer access");
        for (const res of reservations) {
          try {
            await releaseReservation(env, res.reservationId, "failed");
          } catch (releaseErr) {
            console.error(
              `[OpenDebate] Release failed during access-insert rollback: ${releaseErr.message}`,
            );
          }
        }
        return jsonResponse(
          { error: "Failed to create open debate" },
          500,
          origin,
          env,
        );
      }

      // Confirm all 3 credits
      let lastConfirm;
      for (const res of reservations) {
        lastConfirm = await confirmReservation(
          env,
          res.reservationId,
          `colloquium:open-debate:${thread.id}`,
        );
      }

      // Push-notify all users about the new open debate (fire-and-forget)
      if (ctx) {
        ctx.waitUntil(
          notifyAllUsersOfNewColloquium(
            env,
            thread.id,
            title,
            "open_debate",
          ).catch((err) =>
            console.error("[OpenDebate] Push notify failed:", err.message),
          ),
        );
      }

      let response = jsonResponse(
        {
          success: true,
          threadId: thread.id,
          title,
          colloquium_type: "open_debate",
          balance: {
            total: lastConfirm.newTotal,
            credits: lastConfirm.credits,
            freeRemaining: lastConfirm.freeRemaining,
          },
        },
        201,
        origin,
        env,
      );
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
      for (const res of reservations) {
        try {
          await releaseReservation(env, res.reservationId, "failed");
        } catch (releaseErr) {
          console.error(
            `[OpenDebate] Release failed during error recovery: ${releaseErr.message}`,
          );
        }
      }
      throw err;
    }
  } catch (err) {
    console.error("[OpenDebate] Propose error:", err.message);
    return jsonResponse(
      { error: "Failed to create open debate" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/colloquium/:id/verdict - Admin or proposer verdict trigger
// ============================================================
export async function handleColloquiumVerdict(
  request,
  env,
  origin,
  threadId,
  ctx,
) {
  // Check admin auth first
  const adminSecret = request.headers.get("X-Admin-Secret");
  const expectedSecret = await getSecret(env.ADMIN_SECRET);
  const isAdmin =
    adminSecret && expectedSecret && safeEq(adminSecret, expectedSecret);

  // If not admin, check if user is the proposer of an open_debate or user_proposed
  let isProposerAllowed = false;
  let setCookieHeader = null;
  if (!isAdmin) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
      return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
    }
    setCookieHeader = auth.setCookieHeader;

    // Verify this is an open_debate or user_proposed and user is proposer
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}&category=eq.colloquium`,
      select: "metadata",
      limit: 1,
    });

    if (!threads || threads.length === 0) {
      return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
    }

    const metadata = threads[0].metadata || {};
    const isProposer = metadata.proposer_id === auth.userId;
    const type = metadata.colloquium_type;

    if ((type === "open_debate" || type === "user_proposed") && isProposer) {
      isProposerAllowed = true;
    }

    if (!isProposerAllowed) {
      return jsonResponse({ error: "Forbidden" }, 403, origin, env);
    }
  }

  // Parse URL for ?force=true query param (admin-only)
  const url = new URL(request.url);
  const force = isAdmin && url.searchParams.get("force") === "true";

  try {
    // Fetch the thread
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}&category=eq.colloquium`,
      select: "id,title,content,metadata,wrapup",
      limit: 1,
    });

    if (!threads || threads.length === 0) {
      return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
    }

    const thread = threads[0];

    // Allow admin to force-regenerate by clearing existing wrapup
    if (thread.wrapup && !force) {
      return jsonResponse(
        { error: "Verdict already exists. Use ?force=true to regenerate." },
        400,
        origin,
        env,
      );
    }
    if (thread.wrapup && force) {
      console.log(
        `[Colloquium] Admin force-regenerating verdict for thread ${threadId}`,
      );
      // Clear existing wrapup so generateColloquiumVerdictForThread proceeds
      thread.wrapup = null;
    }

    // ── Guard: all philosophers must have spoken before verdict ──
    // Cron-based staggered generation: each philosopher speaks once
    // sequentially (no separate rebuttal round). Verdict is blocked until
    // every philosopher on the panel has at least one reply.
    if (!force) {
      const allPhilosophers = thread.metadata?.philosophers || [];
      if (allPhilosophers.length > 0) {
        const philReplies =
          (await pg(env, "GET", "forum_replies", {
            filter: `thread_id=eq.${threadId}&is_philosopher=eq.true`,
            select: "philosopher_name,metadata",
            order: "created_at.asc",
          })) || [];

        const missingReply = [];

        for (const name of allPhilosophers) {
          const hasReply = philReplies.some(
            (r) =>
              r.philosopher_name === name &&
              (!r.metadata?.reply_type || r.metadata?.reply_type === "initial"),
          );
          if (!hasReply) missingReply.push(name);
        }

        if (missingReply.length > 0) {
          console.log(
            `[Colloquium] Verdict blocked — philosophers still pending: ${missingReply.join(", ")}`,
          );
          return jsonResponse(
            {
              error:
                "All philosophers must present their views before the verdict.",
              code: "DISCUSSION_INCOMPLETE",
              missing_reply: missingReply,
            },
            400,
            origin,
            env,
          );
        }
      }
    }

    const triggeredBy = isAdmin ? "Admin" : "Proposer";
    const langParam = url.searchParams.get("lang") || "en";
    console.log(
      `[Colloquium] ${triggeredBy} triggering verdict for thread ${threadId} (lang=${langParam})`,
    );
    const result = await generateColloquiumVerdictForThread(
      env,
      thread,
      langParam,
    );

    // Pre-generate verdict audio in background for the user's language
    if (result.success && ctx) {
      ctx.waitUntil(
        preGenerateVerdictAudio(env, threadId, thread, langParam).catch(
          (err) => {
            console.warn(
              `[Colloquium] Verdict audio pre-generation failed: ${err.message}`,
            );
          },
        ),
      );
    }

    let response = jsonResponse(
      result,
      result.success ? 200 : 500,
      origin,
      env,
    );
    if (setCookieHeader) {
      response = addRefreshedCookieToResponse(response, setCookieHeader);
    }
    return response;
  } catch (err) {
    console.error("[Colloquium] Verdict error:", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}

/**
 * Background helper: pre-generate verdict audio for a language so the first
 * play click hits R2 cache instead of triggering on-demand TTS.
 */
async function preGenerateVerdictAudio(env, threadId, thread, langCode) {
  const baseLang = langCode.split("-")[0].toLowerCase();
  const r2Key = `tts_wrapup_${threadId}_${baseLang}.wav`;

  // Check if already cached
  const cached = await getFromR2Cache(env, r2Key);
  if (cached) {
    console.log(
      `[Verdict] Audio already cached for ${threadId}/${baseLang}, skipping`,
    );
    return;
  }

  // Re-fetch the thread to get the saved wrapup + translations
  const threads = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${threadId}`,
    select: "title,wrapup,metadata",
    limit: 1,
  });
  if (!threads || !threads[0]?.wrapup) return;

  const saved = threads[0];
  const translations = saved.metadata?.translations?.wrapup || {};
  const textForLang = translations[baseLang] || saved.wrapup;

  console.log(
    `[Verdict] Pre-generating audio for ${threadId} in ${baseLang} (${textForLang.length} chars)`,
  );

  const wavBuffer = await generateWrapupTTS(
    textForLang,
    saved.title,
    env,
    baseLang,
  );
  await saveToR2Cache(env, r2Key, wavBuffer, {
    contentType: "audio/wav",
    customMetadata: { threadId, lang: baseLang, type: "verdict" },
  });
  console.log(
    `[Verdict] Pre-generated audio cached: ${r2Key} (${wavBuffer.byteLength} bytes)`,
  );
}

// ============================================================
// GET /api/colloquium/:id/verdict-audio?lang=xx
// On-demand TTS: check R2 cache, generate if missing, serve WAV
// ============================================================
export async function handleColloquiumVerdictAudio(
  request,
  env,
  origin,
  threadId,
) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  // Parse requested language from query string
  const url = new URL(request.url);
  const langCode = url.searchParams.get("lang") || "en";

  // Verify user has access to this colloquium (or it's an open debate)
  const accessRecords = await pg(env, "GET", "colloquium_access", {
    filter: `user_id=eq.${userId}&thread_id=eq.${threadId}`,
    select: "access_type",
  });
  const accessTypes = (accessRecords || []).map((r) => r.access_type);

  const threadRows = await pg(env, "GET", "forum_threads", {
    filter: `id=eq.${threadId}&category=eq.colloquium`,
    select: "id,title,wrapup,metadata",
    limit: 1,
  });

  if (!threadRows || threadRows.length === 0) {
    return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
  }

  const thread = threadRows[0];
  const isOpenDebate = thread.metadata?.colloquium_type === "open_debate";

  // Audio requires participation (or proposer/invite). Access-only users
  // must upgrade to participate before they can listen.
  const hasAudioAccess =
    isOpenDebate ||
    accessTypes.includes("participate") ||
    accessTypes.includes("proposer") ||
    accessTypes.includes("invite");

  const hasAccessOnly = !hasAudioAccess && accessTypes.includes("access");

  if (!hasAudioAccess && !hasAccessOnly) {
    return jsonResponse(
      { error: "Access required", code: "ACCESS_REQUIRED" },
      403,
      origin,
      env,
    );
  }

  if (!thread.wrapup) {
    return jsonResponse({ error: "No verdict yet" }, 404, origin, env);
  }

  // Access-only users must upgrade to participate to unlock audio
  if (hasAccessOnly) {
    const colloquiumType = thread.metadata?.colloquium_type || "daily";
    const cost = colloquiumType === "user_proposed" ? 2 : 1;
    return jsonResponse(
      {
        error: "Participation required to listen",
        code: "PARTICIPATE_REQUIRED",
        cost,
      },
      402,
      origin,
      env,
    );
  }

  // R2 cache key per thread+language
  const r2Key = `tts_wrapup_${threadId}_${langCode}.wav`;

  try {
    // 1. Check R2 cache first
    const cached = await getFromR2Cache(env, r2Key);
    if (cached) {
      console.log(
        `[Colloquium] Verdict audio cache HIT: ${threadId} / ${langCode}`,
      );
      let response = new Response(cached, {
        status: 200,
        headers: {
          ...getCorsHeaders(origin, env),
          "Content-Type": "audio/wav",
          "Content-Length": String(cached.byteLength),
          "Cache-Control": "public, max-age=31536000",
        },
      });
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // 2. Cache miss — generate TTS for this language
    console.log(
      `[Colloquium] Verdict audio cache MISS: ${threadId} / ${langCode}, generating...`,
    );

    // Get the verdict text in the requested language.
    // If the exact translation is missing, fall back but translate on-demand
    // so the verdict content language matches the TTS host phrases (langCode).
    const translations = thread.metadata?.translations?.wrapup || {};
    const baseLang = langCode.split("-")[0];

    let textForLang = translations[langCode] || translations[baseLang];
    let actualLang = textForLang ? langCode : null;

    if (!textForLang) {
      // Fallback: use English or raw wrapup (which is always English), then translate on-demand
      const fallbackText = translations.en || thread.wrapup;
      const fallbackLang = "en";

      if (fallbackText && baseLang !== "en") {
        console.log(
          `[Colloquium] Translation missing for ${langCode}, translating from ${fallbackLang} on-demand`,
        );
        const apiKey = await getSecret(env.GEMINI_API_KEY);
        if (apiKey) {
          textForLang = await translateWithGemini(
            fallbackText,
            langCode,
            fallbackLang,
            apiKey,
          );
          actualLang = langCode;
        }
      }

      // If translation failed or no API key, use fallback as-is with matching lang
      if (!textForLang) {
        textForLang = fallbackText || thread.wrapup;
        actualLang = "en";
        console.warn(
          `[Colloquium] On-demand translation failed, using English text with langCode=${actualLang}`,
        );
      }
    }

    let wavBuffer;
    try {
      wavBuffer = await generateWrapupTTS(
        textForLang,
        thread.title,
        env,
        actualLang,
      );
    } catch (firstErr) {
      console.warn(
        `[Colloquium] TTS attempt 1 failed (${langCode}): ${firstErr.message}, retrying...`,
      );
      // One retry after a short delay for transient Gemini errors
      await new Promise((r) => setTimeout(r, 2000));
      wavBuffer = await generateWrapupTTS(
        textForLang,
        thread.title,
        env,
        actualLang,
      );
    }

    // Only cache if the audio language matches the requested language.
    // If we fell back to English, don't cache under the wrong langCode
    // so the next request can retry the translation.
    if (actualLang === langCode || actualLang === baseLang) {
      await saveToR2Cache(env, r2Key, wavBuffer, {
        song: thread.title,
        artist: "colloquium-verdict",
        language: langCode,
        model: "gemini-tts",
      });
      console.log(
        `[Colloquium] Verdict audio generated & cached: ${threadId} / ${langCode} (${wavBuffer.byteLength} bytes)`,
      );
    } else {
      console.warn(
        `[Colloquium] Verdict audio generated in ${actualLang} (fallback), NOT caching under ${langCode}`,
      );
    }

    let response = new Response(wavBuffer, {
      status: 200,
      headers: {
        ...getCorsHeaders(origin, env),
        "Content-Type": "audio/wav",
        "Content-Length": String(wavBuffer.byteLength),
        "Cache-Control": "public, max-age=31536000",
      },
    });
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error(
      `[Colloquium] Verdict audio error (${langCode}):`,
      err.message,
      err.stack,
    );
    return jsonResponse(
      { error: "Failed to generate audio", detail: err.message },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// DELETE /api/colloquium/:id - Delete a colloquium
// ============================================================
// Allowed for: proposer of the colloquium OR admin (via X-Admin-Secret).
// Cleans up: forum_replies, forum_votes, colloquium_access, R2 audio cache,
// and finally the forum_threads row itself.
export async function handleDeleteColloquium(request, env, origin, threadId) {
  // Check admin auth first
  const adminSecret = request.headers.get("X-Admin-Secret");
  const expectedSecret = await getSecret(env.ADMIN_SECRET);
  const isAdmin =
    adminSecret && expectedSecret && safeEq(adminSecret, expectedSecret);

  let setCookieHeader = null;

  if (!isAdmin) {
    // Not admin — check if the user is the proposer
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
      return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
    }
    setCookieHeader = auth.setCookieHeader;

    // Verify the thread exists and user is proposer
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}&category=eq.colloquium`,
      select: "metadata",
      limit: 1,
    });

    if (!threads || threads.length === 0) {
      return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
    }

    const metadata = threads[0].metadata || {};
    if (metadata.proposer_id !== auth.userId) {
      return jsonResponse(
        { error: "Only the proposer or admin can delete a colloquium" },
        403,
        origin,
        env,
      );
    }
  } else {
    // Admin: verify the thread exists
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}&category=eq.colloquium`,
      select: "id",
      limit: 1,
    });

    if (!threads || threads.length === 0) {
      return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
    }
  }

  try {
    console.log(
      `[Colloquium] Deleting colloquium ${threadId} (admin=${isAdmin})`,
    );

    // 1. Delete votes on replies belonging to this thread
    const replies = await pg(env, "GET", "forum_replies", {
      filter: `thread_id=eq.${threadId}`,
      select: "id",
    });

    if (replies && replies.length > 0) {
      const replyIds = replies.map((r) => r.id);
      // Delete votes in batches (PostgREST in-filter)
      await pg(env, "DELETE", "forum_votes", {
        filter: `reply_id=in.(${replyIds.join(",")})`,
      });
    }

    // 2. Delete all replies for this thread
    await pg(env, "DELETE", "forum_replies", {
      filter: `thread_id=eq.${threadId}`,
    });

    // 3. Delete colloquium_access records
    await pg(env, "DELETE", "colloquium_access", {
      filter: `thread_id=eq.${threadId}`,
    });

    // 4. Clean up R2 cached verdict audio (all languages)
    const langCodes = [
      "en",
      "pt",
      "es",
      "de",
      "fr",
      "it",
      "ja",
      "ko",
      "zh",
      "ru",
      "ar",
      "he",
      "hi",
      "fa",
      "hu",
      "nl",
      "pl",
      "tr",
    ];
    const r2Deletes = langCodes.map((lang) => {
      const key = `tts_wrapup_${threadId}_${lang}.wav`;
      return env.TTS_CACHE.delete(key).catch(() => {});
    });
    await Promise.all(r2Deletes);

    // 5. Delete the thread itself
    const result = await pg(env, "DELETE", "forum_threads", {
      filter: `id=eq.${threadId}`,
    });

    if (result === null) {
      console.error("[Colloquium] Failed to delete thread row:", threadId);
      return jsonResponse(
        { error: "Failed to delete colloquium" },
        500,
        origin,
        env,
      );
    }

    console.log(`[Colloquium] Successfully deleted colloquium ${threadId}`);

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Colloquium] Delete error:", err.message);
    return jsonResponse(
      { error: "Failed to delete colloquium" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// BACKGROUND GENERATION WITH RETRY
// ============================================================

/**
 * Run philosopher reply + rebuttal generation with automatic retry.
 * On final failure, sets metadata.generation_failed = true and broadcasts
 * so the frontend can show a retry button instead of an infinite spinner.
 *
 * Used by both handleProposeColloquium (initial creation) and
 * handleRetryGeneration (manual retry by proposer).
 */
export async function runColloquiumGeneration(
  env,
  threadId,
  philosopherNames,
  title,
  content,
  langCode,
) {
  const MAX_ATTEMPTS = 2;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(
        `[Colloquium] Generation attempt ${attempt}/${MAX_ATTEMPTS} for ${threadId}`,
      );

      // Step 1: Generate all initial replies in parallel
      const replyResult = await generateAllPhilosopherReplies(
        env,
        threadId,
        philosopherNames,
        title,
        content,
        langCode,
      );

      // If zero replies succeeded, treat as failure for retry
      if (replyResult.succeeded === 0) {
        throw new Error(`All ${replyResult.total} philosopher replies failed`);
      }

      // Step 2: Generate all rebuttals in parallel (after initial replies)
      await generateAllPhilosopherRebuttals(
        env,
        threadId,
        philosopherNames,
        langCode,
      );

      console.log(
        `[Colloquium] Background generation complete for ${threadId}`,
      );
      return; // Success — exit
    } catch (err) {
      console.error(
        `[Colloquium] Generation attempt ${attempt} failed for ${threadId}: ${err.message}`,
      );

      if (attempt < MAX_ATTEMPTS) {
        // Wait 3 seconds before retry
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        // All attempts exhausted — mark as failed so frontend can show retry button
        console.error(
          `[Colloquium] All ${MAX_ATTEMPTS} generation attempts failed for ${threadId}. Marking as generation_failed.`,
        );
        try {
          const threads = await pg(env, "GET", "forum_threads", {
            filter: `id=eq.${threadId}`,
            select: "metadata",
            limit: 1,
          });
          const meta = threads && threads[0] ? threads[0].metadata || {} : {};
          await pg(env, "PATCH", "forum_threads", {
            filter: `id=eq.${threadId}`,
            body: {
              metadata: { ...meta, generation_failed: true },
            },
          });
          await broadcastColloquiumEvent(env, threadId, "thread-updated");
        } catch (metaErr) {
          console.error(
            `[Colloquium] Failed to set generation_failed for ${threadId}: ${metaErr.message}`,
          );
        }
      }
    }
  }
}

// ============================================================
// RETRY GENERATION (Proposer-only, no credits)
// ============================================================

/**
 * POST /api/colloquium/:id/retry
 * Re-triggers philosopher reply + rebuttal generation for a stuck colloquium.
 * Only the proposer can call this. No credits are charged.
 * Clears generation_failed and launches background processing via ctx.waitUntil.
 */
export async function handleRetryGeneration(
  request,
  env,
  origin,
  threadId,
  ctx,
) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  // Rate limit
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rl = await checkRateLimit(env, `colloquium-retry:${userId}:${ip}`);
  if (!rl) {
    return jsonResponse(
      { error: "Too many retries. Please slow down." },
      429,
      origin,
      env,
    );
  }

  try {
    // Fetch the thread
    const threads = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}`,
      select: "id,title,content,metadata,wrapup",
      limit: 1,
    });

    if (!threads || threads.length === 0) {
      return jsonResponse({ error: "Thread not found" }, 404, origin, env);
    }

    const thread = threads[0];
    const metadata = thread.metadata || {};

    // Only proposer can retry
    if (metadata.proposer_id !== userId) {
      return jsonResponse(
        { error: "Only the proposer can retry generation" },
        403,
        origin,
        env,
      );
    }

    // Only retry for user_proposed / open_debate colloquiums
    const collType = metadata.colloquium_type;
    if (collType !== "user_proposed" && collType !== "open_debate") {
      return jsonResponse(
        { error: "Retry not applicable for this type" },
        400,
        origin,
        env,
      );
    }

    // Don't retry if verdict already exists
    if (thread.wrapup) {
      return jsonResponse(
        { error: "Colloquium already has a verdict" },
        400,
        origin,
        env,
      );
    }

    const philosophers = metadata.philosophers || [];
    if (philosophers.length === 0) {
      return jsonResponse(
        { error: "No philosophers assigned" },
        400,
        origin,
        env,
      );
    }

    // Check if all philosophers have already spoken — no retry needed
    const philReplies =
      (await pg(env, "GET", "forum_replies", {
        filter: `thread_id=eq.${threadId}&is_philosopher=eq.true`,
        select: "philosopher_name,metadata",
      })) || [];

    const allSpoken = philosophers.every((name) =>
      philReplies.some(
        (r) =>
          r.philosopher_name === name &&
          (!r.metadata?.reply_type || r.metadata?.reply_type === "initial"),
      ),
    );

    if (allSpoken) {
      return jsonResponse(
        { error: "All philosophers have already spoken" },
        400,
        origin,
        env,
      );
    }

    // Clear failure flag and schedule next philosopher via cron
    // Set next_philosopher_at to now so the next cron tick picks it up
    await pg(env, "PATCH", "forum_threads", {
      filter: `id=eq.${threadId}`,
      body: {
        metadata: {
          ...metadata,
          generation_failed: false,
          next_philosopher_at: new Date().toISOString(),
        },
      },
    });
    await broadcastColloquiumEvent(env, threadId, "thread-updated");

    console.log(
      `[Colloquium] Retry generation triggered for ${threadId} by ${userId} — cron will resume`,
    );

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Colloquium] Retry generation error:", err.message);
    return jsonResponse(
      { error: "Failed to retry generation" },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// POST /api/colloquium/:id/poll-vote - Vote for a philosopher
// ============================================================
// One vote per user per colloquium.  User can change their vote.
// Votes stored in metadata.poll_votes: { userId: philosopherName }
export async function handlePollVote(request, env, origin, threadId) {
  try {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401, origin, env);

    const { userId, setCookieHeader } = auth;

    const body = await request.json();
    const philosopherName = body.philosopher_name;

    if (!philosopherName) {
      return jsonResponse(
        { error: "philosopher_name is required" },
        400,
        origin,
        env,
      );
    }

    // Verify user has access to this colloquium
    const accessRecords = await pg(env, "GET", "colloquium_access", {
      filter: `user_id=eq.${userId}&thread_id=eq.${threadId}`,
      select: "access_type",
      limit: 1,
    });

    const threadRows = await pg(env, "GET", "forum_threads", {
      filter: `id=eq.${threadId}&category=eq.colloquium`,
      select: "metadata",
      limit: 1,
    });

    if (!threadRows || threadRows.length === 0) {
      return jsonResponse({ error: "Colloquium not found" }, 404, origin, env);
    }

    const metadata = threadRows[0].metadata || {};
    const isOpenDebate = metadata.colloquium_type === "open_debate";
    const accessTypes = (accessRecords || []).map((r) => r.access_type);
    const hasAccess =
      isOpenDebate ||
      accessTypes.includes("access") ||
      accessTypes.includes("participate") ||
      accessTypes.includes("proposer") ||
      accessTypes.includes("invite");

    if (!hasAccess) {
      return jsonResponse(
        { error: "Access required", code: "ACCESS_REQUIRED" },
        403,
        origin,
        env,
      );
    }

    // Verify philosopher is on the panel
    const philosophers = metadata.philosophers || [];
    if (!philosophers.includes(philosopherName)) {
      return jsonResponse(
        { error: "Philosopher is not on this panel" },
        400,
        origin,
        env,
      );
    }

    // Update vote (read-modify-write on metadata.poll_votes)
    const pollVotes = metadata.poll_votes || {};
    pollVotes[userId] = philosopherName;

    await pg(env, "PATCH", "forum_threads", {
      filter: `id=eq.${threadId}`,
      body: {
        metadata: {
          ...metadata,
          poll_votes: pollVotes,
        },
      },
    });

    // Compute tallies
    const tallies = {};
    for (const vid of Object.values(pollVotes)) {
      tallies[vid] = (tallies[vid] || 0) + 1;
    }
    const totalVotes = Object.keys(pollVotes).length;

    // Broadcast poll-updated with tallies in payload so other viewers
    // can update instantly without a full thread refetch
    await broadcastColloquiumEvent(env, threadId, "poll-updated", {
      tallies,
      totalVotes,
    });

    let response = jsonResponse(
      {
        success: true,
        poll: { tallies, myVote: philosopherName, totalVotes },
      },
      200,
      origin,
      env,
    );
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error("[Colloquium] Poll vote error:", err.message);
    return jsonResponse({ error: "Failed to cast vote" }, 500, origin, env);
  }
}
