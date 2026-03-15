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

async function query(sbUrl, sbKey, path) {
  const res = await fetch(`${sbUrl}/rest/v1/${path}`, {
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  if (!res.ok) return [];
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
      // Fetch thread titles
      const threadFilter = threadIds.map((id) => `id.eq.${id}`).join(",");
      const threads = await query(sbUrl, sbKey,
        `forum_threads?or=(${threadFilter})&select=id,title,thread_type,created_at`
      );
      const threadMap = {};
      for (const t of threads) threadMap[t.id] = t;

      debates = accessRows.map((r) => {
        const thread = threadMap[r.thread_id] || {};
        return {
          kind: "debate",
          mediaType: "ideas",
          id: r.thread_id,
          title: thread.title || "Debate",
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
