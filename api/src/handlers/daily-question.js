// ============================================================
// HANDLER - QUESTION OF THE DAY (Agora)
// ============================================================
// Inserts a system message into chat_messages with a philosophical
// question derived from recent analysis scores.
// Called by the scheduled() handler daily at noon UTC.

import { getSupabaseCredentials } from "../utils/supabase.js";

// Question templates keyed by philosophical axis
// Each template uses {song} and {artist} placeholders
const QUESTION_TEMPLATES = {
  high_individualism: [
    'Should we admire the radical self-reliance in "{song}" by {artist}, or does it cross into isolation?',
    '"{song}" by {artist} scored high on individualism. Is self-interest a virtue or a vice?',
    'What would Ayn Rand say about the message in "{song}" by {artist}?',
  ],
  high_collectivism: [
    '"{song}" by {artist} champions collective action. When does solidarity become conformity?',
    'Is the collectivist vision in "{song}" by {artist} inspiring or dangerous?',
    'Marx would approve of "{song}" by {artist}. Would you?',
  ],
  high_reason: [
    '"{song}" by {artist} celebrates reason and logic. Can pure rationality guide a good life?',
    'The Objectivist clarity in "{song}" by {artist}: is radical honesty always a virtue?',
  ],
  high_emotion: [
    '"{song}" by {artist} is pure emotional intensity. Is feeling more authentic than thinking?',
    'Nietzsche might say "{song}" by {artist} taps into the Dionysian. Do you agree?',
  ],
  existential_crisis: [
    '"{song}" by {artist} scored near the abyss on multiple axes. Is nihilism a dead end or a starting point?',
    'Camus said we must imagine Sisyphus happy. Does "{song}" by {artist} find meaning in absurdity?',
  ],
  virtue_signal: [
    '"{song}" by {artist} radiates virtue. Is classical nobility still relevant in modern music?',
    'The Stoics would meditate on "{song}" by {artist}. What lesson does it hold for us?',
  ],
  provocative: [
    '"{song}" by {artist} provokes and challenges. Is artistic provocation a form of philosophy?',
    'Beyond good and evil: what does "{song}" by {artist} reveal about our moral assumptions?',
  ],
  general: [
    'What philosophical school best describes today\'s music? Discuss with reference to "{song}" by {artist}.',
    'If you could debate one philosopher about "{song}" by {artist}, who would it be and why?',
    'Is music a mirror of society or a hammer to shape it? Consider "{song}" by {artist}.',
  ],
};

/**
 * PostgREST helper (service role, bypasses RLS)
 */
async function pg(
  env,
  method,
  table,
  { filter, select, order, limit, body, single, prefer } = {},
) {
  const { url, key } = await getSupabaseCredentials(env);
  const params = [];
  if (select) params.push(`select=${encodeURIComponent(select)}`);
  if (filter) params.push(filter);
  if (order) params.push(`order=${order}`);
  if (limit) params.push(`limit=${limit}`);
  const qs = params.length ? `?${params.join("&")}` : "";

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers["Prefer"] = prefer;
  else if (method === "POST" || method === "PATCH")
    headers["Prefer"] = "return=representation";
  if (single) headers["Accept"] = "application/vnd.pgrst.object+json";

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${url}/rest/v1/${table}${qs}`, opts);
  if (!res.ok) {
    if (single && res.status === 406) return null;
    const err = await res.text();
    console.error(`[DB] ${method} ${table}: ${res.status} - ${err}`);
    return null;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : method === "DELETE" ? true : null;
}

/**
 * Pick a category based on analysis scores
 */
function pickCategory(analysis) {
  const scores = analysis.scores || {};
  const avg = analysis.overall_score || 5;

  // Check for extreme scores
  if (avg >= 8.5) return "virtue_signal";
  if (avg <= 2.5) return "existential_crisis";

  // Check individual axes
  if (scores.individualism >= 8.5) return "high_individualism";
  if (scores.collectivism >= 8.5 || scores.individualism <= 2.5)
    return "high_collectivism";
  if (scores.reason >= 8.5) return "high_reason";
  if (scores.emotion >= 8.5 || scores.reason <= 2.5) return "high_emotion";
  if (scores.provocation >= 8.5 || scores.rebellion >= 8.5)
    return "provocative";

  return "general";
}

/**
 * Generate and insert the daily philosophical question into Agora (chat_messages).
 * Returns { success: true, question } or { success: false, reason }.
 */
export async function generateDailyQuestion(env) {
  console.log("[DailyQuestion] Generating question of the day...");

  try {
    // Find a recent analysis with interesting scores (last 7 days)
    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const analyses = await pg(env, "GET", "analyses", {
      select: "id,overall_score,scores,song_id",
      filter: `created_at=gte.${weekAgo}`,
      order: "created_at.desc",
      limit: 50,
    });

    if (!analyses || analyses.length === 0) {
      console.log("[DailyQuestion] No recent analyses found");
      return { success: false, reason: "No recent analyses" };
    }

    // Prefer analyses with extreme scores (more interesting questions)
    const interesting = analyses.filter((a) => {
      const avg = a.overall_score || 5;
      return avg >= 8.0 || avg <= 3.0;
    });

    const pool = interesting.length > 0 ? interesting : analyses;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    // Fetch song info
    const song = await pg(env, "GET", "songs", {
      filter: `id=eq.${picked.song_id}`,
      select: "title,artist",
      single: true,
    });

    if (!song) {
      console.log("[DailyQuestion] Song not found for analysis:", picked.id);
      return { success: false, reason: "Song not found" };
    }

    // Pick question template
    const category = pickCategory(picked);
    const templates =
      QUESTION_TEMPLATES[category] || QUESTION_TEMPLATES.general;
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Fill in placeholders
    const question = template
      .replace("{song}", song.title)
      .replace("{artist}", song.artist);

    // Insert as system message into chat_messages
    const inserted = await pg(env, "POST", "chat_messages", {
      body: {
        user_id: "00000000-0000-0000-0000-000000000000", // System user
        display_name: "Philosify",
        message: question,
        message_type: "system",
        metadata: {
          type: "question_of_the_day",
          category,
          analysis_id: picked.id,
          song: song.title,
          artist: song.artist,
        },
      },
      single: true,
    });

    if (!inserted) {
      console.error("[DailyQuestion] Failed to insert question");
      return { success: false, reason: "Insert failed" };
    }

    console.log(
      `[DailyQuestion] Posted: "${question}" (category: ${category})`,
    );
    return { success: true, question, category };
  } catch (err) {
    console.error("[DailyQuestion] Error:", err.message);
    return { success: false, reason: err.message };
  }
}
