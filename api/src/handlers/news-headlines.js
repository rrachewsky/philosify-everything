// ============================================================
// HANDLER - NEWS HEADLINES
// ============================================================
// GET /api/news/headlines — Returns cached headlines (public, no auth).
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getCachedHeadlines } from "../news/index.js";

export async function handleNewsHeadlines(request, env, origin, ctx = null) {
  try {
    const cached = await getCachedHeadlines(env, ctx);

    return jsonResponse(
      {
        success: true,
        articles: cached.articles || [],
        count: cached.count || 0,
        fetchedAt: cached.fetchedAt,
      },
      200,
      origin,
      env,
    );
  } catch (err) {
    console.error("[News] Headlines handler error:", err.message);
    return jsonResponse(
      { error: "Failed to fetch news headlines", message: err.message },
      500,
      origin,
      env,
    );
  }
}
