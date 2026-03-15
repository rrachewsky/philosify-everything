// ============================================================
// HANDLER - NEWS HEADLINES
// ============================================================
// GET /api/news/headlines?lang=pt — Returns cached headlines.
// International headlines (EN) + local headlines (user lang) mixed.
// Content filtered: no sports, no inappropriate content.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getCachedHeadlines } from "../news/index.js";

export async function handleNewsHeadlines(request, env, origin, ctx = null) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || "en";

    const cached = await getCachedHeadlines(env, ctx, lang);

    return jsonResponse(
      {
        success: true,
        articles: cached.articles || [],
        highlights: cached.highlights || [],
        count: cached.count || 0,
        fetchedAt: cached.fetchedAt,
        lang: cached.lang || "en",
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
