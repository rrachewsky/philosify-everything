// ============================================================
// HANDLER - NEWS HEADLINES
// ============================================================
// GET /api/news/headlines?lang=pt — Returns cached headlines.
// International headlines (EN) + local headlines (user lang) mixed.
// Content filtered: no sports, no inappropriate content.
// If user is authenticated and has unlocked source customization,
// articles are filtered by their enabled sources.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getCachedHeadlines } from "../news/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSupabaseCredentials } from "../utils/supabase.js";
import { DEFAULT_SOURCE_IDS, NEWS_SOURCES } from "./news-preferences.js";

// Build a map of source ID to possible name variations for matching
const SOURCE_NAME_MAP = {};
for (const cat of Object.values(NEWS_SOURCES)) {
  for (const src of cat.sources) {
    // Map ID to lowercase name variations
    SOURCE_NAME_MAP[src.id] = [
      src.name.toLowerCase(),
      src.id.replace(/-/g, " "),
      src.id.replace(/-/g, ""),
    ];
  }
}

/**
 * Check if an article's source matches any of the enabled source IDs.
 */
function articleMatchesSource(article, enabledSourceIds) {
  const articleSource = (article.source || "").toLowerCase().trim();
  if (!articleSource) return false;

  for (const sourceId of enabledSourceIds) {
    const nameVariations = SOURCE_NAME_MAP[sourceId] || [];
    for (const variation of nameVariations) {
      if (articleSource.includes(variation) || variation.includes(articleSource)) {
        return true;
      }
    }
  }
  return false;
}

export async function handleNewsHeadlines(request, env, origin, ctx = null) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || "en";

    const cached = await getCachedHeadlines(env, ctx, lang);
    let articles = cached.articles || [];
    let highlights = cached.highlights || [];

    // Try to get user preferences (optional auth - don't fail if not logged in)
    let enabledSources = null;
    let unlocked = false;

    try {
      const user = await getUserFromAuth(request, env);
      if (user?.userId) {
        const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
        const res = await fetch(
          `${sbUrl}/rest/v1/user_news_preferences?user_id=eq.${user.userId}&select=unlocked,enabled_sources`,
          {
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
            },
          }
        );

        if (res.ok) {
          const rows = await res.json();
          if (rows[0]) {
            unlocked = rows[0].unlocked || false;
            enabledSources = rows[0].enabled_sources;
          }
        }
      }
    } catch (authErr) {
      // Ignore auth errors - user is not logged in or token expired
      console.log("[News] No auth or preferences, using defaults");
    }

    // Determine which sources to use
    let sourcesToUse = DEFAULT_SOURCE_IDS;
    if (unlocked && enabledSources && Array.isArray(enabledSources) && enabledSources.length > 0) {
      sourcesToUse = enabledSources;
      console.log(`[News] User has custom sources: ${sourcesToUse.length} selected`);
    }

    // Filter articles by enabled sources
    const filteredArticles = articles.filter((a) => articleMatchesSource(a, sourcesToUse));
    const filteredHighlights = highlights.filter((a) => articleMatchesSource(a, sourcesToUse));

    // If filtering results in too few articles, fall back to all
    const minArticles = 5;
    const useFiltered = filteredArticles.length >= minArticles;

    return jsonResponse(
      {
        success: true,
        articles: useFiltered ? filteredArticles : articles,
        highlights: useFiltered ? filteredHighlights : highlights,
        count: useFiltered ? filteredArticles.length + filteredHighlights.length : cached.count || 0,
        fetchedAt: cached.fetchedAt,
        lang: cached.lang || "en",
        filtered: useFiltered,
        unlocked,
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
