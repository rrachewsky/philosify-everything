// ============================================================
// HANDLER - UNIFIED USER HISTORY
// ============================================================
// GET /api/user-history — Returns ALL user interactions:
//   - Music analyses
//   - Book analyses
//   - Philosopher panels (music, literature, news)
//   - Colloquiums/debates accessed
// Sorted chronologically (newest first).
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSupabaseCredentials } from "../utils/supabase.js";
import { pg } from "../utils/pg.js";

async function query(sbUrl, sbKey, path) {
  const url = `${sbUrl}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[UserHistory] Query failed: ${res.status} ${path.split("?")[0]} — ${errText.slice(0, 200)}`);
    return [];
  }
  return res.json();
}

export async function handleUserHistory(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const uid = user.userId;
    const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);

    // Fetch all types in parallel
    const [musicRows, bookRows, panelRows, accessRows] = await Promise.all([
      // Music analyses
      query(sbUrl, sbKey,
        `user_analysis_requests?user_id=eq.${uid}&select=analysis_id,song_title,artist_name,requested_at&order=requested_at.desc&limit=50`
      ),
      // Book analyses
      query(sbUrl, sbKey,
        `user_book_analysis_requests?user_id=eq.${uid}&select=analysis_id,title,author,requested_at&order=requested_at.desc&limit=50`
      ),
      // Philosopher panels
      query(sbUrl, sbKey,
        `panel_analyses?user_id=eq.${uid}&select=panel_id,media_type,title,artist,philosophers,created_at&order=created_at.desc&limit=50`
      ),
      // Colloquiums/debates accessed
      query(sbUrl, sbKey,
        `colloquium_access?user_id=eq.${uid}&select=thread_id,access_type,credits_spent,created_at&order=created_at.desc&limit=50`
      ),
    ]);

    // Normalize music
    const music = musicRows.map((r) => ({
      kind: "analysis",
      mediaType: "music",
      id: r.analysis_id,
      title: r.song_title,
      artist: r.artist_name,
      date: r.requested_at,
    }));

    // Normalize books
    const books = bookRows.map((r) => ({
      kind: "analysis",
      mediaType: "literature",
      id: r.analysis_id,
      title: r.title,
      artist: r.author,
      date: r.requested_at,
    }));

    // Normalize panels
    const panels = panelRows.map((r) => ({
      kind: "panel",
      mediaType: r.media_type,
      id: r.panel_id,
      title: r.title,
      artist: r.artist,
      philosophers: r.philosophers,
      date: r.created_at,
    }));

    // Fetch thread titles for colloquiums
    let debates = [];
    if (accessRows.length > 0) {
      const threadIds = [...new Set(accessRows.map((r) => r.thread_id))];
      console.log(`[UserHistory] Debate thread IDs:`, JSON.stringify(threadIds));

      // Use pg() helper — proven to work with forum_threads (same as colloquium handler)
      const threadPromises = threadIds.map((tid) =>
        pg(env, "GET", "forum_threads", {
          filter: `id=eq.${tid}`,
          select: "id,title,content,thread_type,metadata,created_at",
        })
      );
      const threadResults = await Promise.all(threadPromises);
      // pg returns array or null
      const threads = threadResults.flat().filter(Boolean);
      console.log(`[UserHistory] Found ${threads.length} threads, titles: ${threads.map(t => t.title).join(" | ")}`);
      const threadMap = {};
      for (const t of threads) threadMap[t.id] = t;

      debates = accessRows.map((r) => {
        const thread = threadMap[r.thread_id] || {};
        const philosophers = thread.metadata?.philosophers || [];
        return {
          kind: "debate",
          mediaType: "ideas",
          id: r.thread_id,
          title: thread.title || "Debate",
          content: thread.content || null,
          artist: philosophers.length > 0 ? philosophers.join(", ") : null,
          threadType: thread.thread_type,
          accessType: r.access_type,
          date: r.created_at,
        };
      });

      // Deduplicate by thread_id (user may have multiple access records for same thread)
      const seen = new Set();
      debates = debates.filter((d) => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
    }

    // Merge all and sort by date (newest first)
    const all = [...music, ...books, ...panels, ...debates];
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return jsonResponse(
      {
        success: true,
        items: all,
        count: all.length,
        _debug: {
          accessRows: accessRows.length,
          threadIds: accessRows.length > 0 ? [...new Set(accessRows.map((r) => r.thread_id))] : [],
          threadsFound: debates.filter((d) => d.title !== "Debate").length,
          debateTitles: debates.map((d) => d.title),
        },
      },
      200,
      origin,
      env,
    );
  } catch (err) {
    console.error("[UserHistory]", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}
