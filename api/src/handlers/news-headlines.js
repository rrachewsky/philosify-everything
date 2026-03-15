// ============================================================
// HANDLER - NEWS HEADLINES
// ============================================================
// GET /api/news/headlines?lang=pt — Returns cached headlines in user's language.
// Public endpoint, no auth required.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getCachedHeadlines } from "../news/index.js";

export async function handleNewsHeadlines(request, env, origin, ctx = null) {
  try {
    // Always fetch headlines in English — major international sources (Reuters, BBC, AP, etc.)
    // publish in English. The philosophical ANALYSIS is generated in the user's language.
    const cached = await getCachedHeadlines(env, ctx, "en");

    return jsonResponse(
      {
        success: true,
        articles: cached.articles || [],
        highlights: cached.highlights || [],
        count: cached.count || 0,
        fetchedAt: cached.fetchedAt,
        lang: cached.lang || lang,
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
