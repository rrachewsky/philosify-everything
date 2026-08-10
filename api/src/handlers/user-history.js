// ============================================================
// HANDLER - UNIFIED USER HISTORY
// ============================================================
// GET /api/user-history — Returns ALL user interactions:
//   - Music analyses
//   - Book analyses
//   - Film analyses
//   - Philosopher panels (music, literature, news)
//   - Colloquiums/debates accessed
//   - Unsafe Zone sessions
//   - Quiz sessions
// Sorted chronologically (newest first).
// ============================================================

import { jsonResponse, sanitizeErrorMessage } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSupabaseCredentials } from "../utils/supabase.js";

async function query(sbUrl, sbKey, path) {
  const url = `${sbUrl}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    // LOUD on purpose: a failed query silently empties a whole history
    // category (D2 incident, Aug 2026). The full PostgREST body names the
    // offending column; the category still degrades to [] for the client.
    console.error(
      `[UserHistory] QUERY FAILED — table=${path.split("?")[0]} status=${res.status} ` +
      `query=${path.slice(0, 300)} body=${errText.slice(0, 500)}`
    );
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
    const [musicRows, bookRows, filmRows, panelRows, accessRows, unsafeRows, quizRows] = await Promise.all([
      // Music analyses — user_analysis_requests carries no title columns
      // (only id/user_id/analysis_id/requested_at/metadata, confirmed Aug
      // 2026); titles come from the analyses→songs join below, the same
      // source analysis-history uses.
      query(sbUrl, sbKey,
        `user_analysis_requests?user_id=eq.${uid}&select=analysis_id,requested_at&order=requested_at.desc&limit=50`
      ),
      // Book analyses (join through book_analyses → books to get title/author)
      query(sbUrl, sbKey,
        `user_book_analysis_requests?user_id=eq.${uid}&select=book_analysis_id,created_at,book_analyses:book_analysis_id(id,books:book_id(title,author))&order=created_at.desc&limit=50`
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
      // Quiz sessions — started_at is referenced nowhere else in the
      // codebase (quiz.js never writes it); created_at is the table default
      // every sibling table carries. 4.4's live test + tail verifies.
      query(sbUrl, sbKey,
        `quiz_sessions?user_id=eq.${uid}&select=id,status,score,total_correct,total_wrong,max_streak,credits_spent,created_at,ended_at&order=created_at.desc&limit=50`
      ),
    ]);

    // One lookup serves two needs: classification (news scans share
    // user_analysis_requests with music) and title/artist via the
    // analyses→songs join — the same join analysis-history uses.
    const newsIds = new Set();
    const songByAnalysis = {};
    const scanIds = musicRows.map((r) => r.analysis_id).filter(Boolean);
    if (scanIds.length) {
      const scanRows = await query(sbUrl, sbKey,
        `analyses?id=in.(${scanIds.join(",")})&select=id,classification,song_id,songs:song_id(title,artist)`
      );
      for (const a of scanRows) {
        if (a.classification === "news") newsIds.add(a.id);
        const song = a.songs ? (Array.isArray(a.songs) ? a.songs[0] : a.songs) : null;
        if (song) songByAnalysis[a.id] = song;
      }
    }

    // Normalize music + news scans (1 credit per analysis)
    const music = musicRows.map((r) => ({
      kind: "analysis",
      mediaType: newsIds.has(r.analysis_id) ? "news" : "music",
      id: r.analysis_id,
      title: songByAnalysis[r.analysis_id]?.title || null,
      artist: songByAnalysis[r.analysis_id]?.artist || null,
      date: r.requested_at,
      credits: 1,
    }));

    // Normalize books (1 credit per analysis)
    // Data comes from PostgREST join: book_analyses → books
    const books = bookRows.map((r) => {
      const ba = r.book_analyses || {};
      const book = ba.books ? (Array.isArray(ba.books) ? ba.books[0] : ba.books) : {};
      return {
        kind: "analysis",
        mediaType: "literature",
        id: r.book_analysis_id,
        title: book.title || null,
        artist: book.author || null,
        date: r.created_at,
        credits: 1,
      };
    });

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

    // Normalize quiz sessions
    const quizSessions = quizRows.map((r) => {
      const totalQuestions = (r.total_correct || 0) + (r.total_wrong || 0);
      return {
        kind: "quiz",
        mediaType: "quiz",
        id: r.id,
        title: null,
        artist: null,
        score: r.score || 0,
        totalCorrect: r.total_correct || 0,
        totalQuestions,
        maxStreak: r.max_streak || 0,
        status: r.status,
        date: r.created_at,
        credits: r.credits_spent || 1,
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
    const all = [...music, ...books, ...films, ...panels, ...debates, ...unsafeSessions, ...quizSessions];
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
    return jsonResponse({ error: sanitizeErrorMessage(err.message, 'Failed to load history') }, 500, origin, env);
  }
}
