// ============================================================
// HANDLER - NEWS HEADLINES
// ============================================================
// GET /api/news/headlines?lang=pt — Returns cached headlines.
// International headlines (EN) + local headlines (user lang) mixed.
// Content filtered: no sports, no inappropriate content.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getCachedHeadlines } from "../news/index.js";
import { getSecret } from "../utils/secrets.js";

export async function handleNewsHeadlines(request, env, origin, ctx = null) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || "en";

    // Diagnostic mode: ?diag=1 tests the GNews API directly
    if (url.searchParams.get("diag") === "1") {
      const apiKey = await getSecret(env.GNEWS_API_KEY);
      const keyInfo = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)` : "MISSING";

      let testResult = null;
      let testError = null;
      try {
        const testUrl = `https://gnews.io/api/v4/top-headlines?topic=world&lang=en&max=3&token=${apiKey}`;
        const testRes = await fetch(testUrl);
        const testBody = await testRes.text();
        testResult = { status: testRes.status, body: testBody.substring(0, 300) };
      } catch (e) {
        testError = e.message;
      }

      return jsonResponse({ diag: true, keyInfo, testResult, testError }, 200, origin, env);
    }

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
