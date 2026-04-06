// ============================================================
// HANDLER - UNIFIED USER HISTORY
// ============================================================
// GET /api/user-history — Returns ALL user interactions:
//   - Music analyses
//   - Book analyses
//   - Philosopher panels (music, literature, news)
//   - Colloquiums/debates accessed
//   - Unsafe Zone sessions
// Sorted chronologically (newest first).
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSupabaseCredentials } from "../utils/supabase.js";

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
    const [musicRows, bookRows, filmRows, panelRows, accessRows, unsafeRows] = await Promise.all([
      // Music analyses
      query(sbUrl, sbKey,
        `user_analysis_requests?user_id=eq.${uid}&select=analysis_id,song_title,artist_name,requested_at&order=requested_at.desc&limit=50`
      ),
      // Book analyses
      query(sbUrl, sbKey,
        `user_book_analysis_requests?user_id=eq.${uid}&select=analysis_id,title,author,requested_at&order=requested_at.desc&limit=50`
      ),
      // Film analyses
      query(sbUrl, sbKey,
        `user_film_analysis_requests?user_id=eq.${uid}&select=film_analysis_id,title,director,requested_at&order=requested_at.desc&limit=50`
      ),
      // Philosopher panels
      query(sbUrl, sbKey,
        `panel_analyses?user_id=eq.${uid}&select=panel_id,media_type,title,artist,philosophers,created_at&order=created_at.desc&limit=50`
      ),
      // Colloquiums/debates accessed
      query(sbUrl, sbKey,
        `colloquium_access?user_id=eq.${uid}&select=thread_id,access_type,credits_spent,created_at&order=created_at.desc&limit=50`
      ),
      // Unsafe Zone sessions
      query(sbUrl, sbKey,
        `unsafe_zone_sessions?user_id=eq.${uid}&select=id,turn_count,status,created_at,updated_at,messages&order=created_at.desc&limit=50`
      ),
    ]);

    // Normalize music (1 credit per analysis)
    const music = musicRows.map((r) => ({
      kind: "analysis",
      mediaType: "music",
      id: r.analysis_id,
      title: r.song_title,
      artist: r.artist_name,
      date: r.requested_at,
      credits: 1,
    }));

    // Normalize books (1 credit per analysis)
    const books = bookRows.map((r) => ({
      kind: "analysis",
      mediaType: "literature",
      id: r.analysis_id,
      title: r.title,
      artist: r.author,
      date: r.requested_at,
      credits: 1,
    }));

    // Normalize films (1 credit per analysis)
    const films = filmRows.map((r) => ({
      kind: "analysis",
      mediaType: "cinema",
      id: r.film_analysis_id,
      title: r.title,
      artist: r.director,
      date: r.requested_at,
      credits: 1,
    }));

    // Normalize panels (3 credits per panel)
    const panels = panelRows.map((r) => ({
      kind: "panel",
      mediaType: r.media_type,
      id: r.panel_id,
      title: r.title,
      artist: r.artist,
      philosophers: r.philosophers,
      date: r.created_at,
      credits: 3,
    }));

    // Normalize Unsafe Zone sessions
    const unsafeSessions = unsafeRows.map((r) => {
      const firstUserMsg = (r.messages || []).find(m => m.role === 'user');
      const preview = firstUserMsg?.content?.substring(0, 80) || '';
      const cost = r.turn_count <= 20
        ? 10
        : 10 + Math.ceil((r.turn_count - 20) / 10) * 5;
      return {
        kind: "unsafe-zone",
        mediaType: "unsafe-zone",
        id: r.id,
        title: "Unsafe Zone Talks" + (preview ? ': ' + preview + (preview.length >= 80 ? '...' : '') : ''),
        artist: null,
        turns: r.turn_count,
        status: r.status,
        date: r.created_at,
        credits: cost,
      };
    });

    // Fetch thread titles for colloquiums
    let debates = [];
    if (accessRows.length > 0) {
      const threadIds = [...new Set(accessRows.map((r) => r.thread_id))];

      const threadPromises = threadIds.map((tid) =>
        query(sbUrl, sbKey, `forum_threads?id=eq.${tid}&select=id,title,content,metadata,created_at`)
      );
      const threadResults = await Promise.all(threadPromises);
      const threads = threadResults.flat();
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
          threadType: thread.metadata?.colloquium_type || null,
          accessType: r.access_type,
          date: r.created_at,
          credits: r.credits_spent || 0,
        };
      });

      const seen = new Set();
      debates = debates.filter((d) => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      });
    }

    // Merge all and sort by date (newest first)
    const all = [...music, ...books, ...films, ...panels, ...debates, ...unsafeSessions];
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
