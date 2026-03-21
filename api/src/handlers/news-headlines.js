// ============================================================
// HANDLER - NEWS SEARCH + BREAKING NEWS
// ============================================================
// GET /api/news/search?q={query}&lang={lang} — user-initiated search
// GET /api/news/breaking?lang={lang} — breaking news for ticker
// ============================================================

import { jsonResponse } from "../utils/index.js";
import {
  searchNewsArticles,
  getCachedBreakingNews,
  getCachedSearch,
  cacheSearchResults,
} from "../news/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSupabaseCredentials } from "../utils/supabase.js";
import { DEFAULT_SOURCE_IDS, sourcesToUris } from "./news-preferences.js";

async function hashCacheKey(str) {
  const data = new TextEncoder().encode(str.toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("").substring(0, 24);
}

// ============================================================
// GET /api/news/search?q={query}&lang={lang}
// ============================================================
export async function handleNewsSearch(request, env, origin, ctx = null) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim();
    const lang = url.searchParams.get("lang") || "en";

    if (!query || query.length < 2) {
      return jsonResponse({ error: "Query required (min 2 chars)" }, 400, origin, env);
    }

    // Get user preferences for source filtering
    let sourceUris = [];
    let userHasCustomSources = false;

    try {
      const user = await getUserFromAuth(request, env);
      if (user?.userId) {
        const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
        const res = await fetch(
          `${sbUrl}/rest/v1/user_news_preferences?user_id=eq.${user.userId}&select=unlocked,enabled_sources`,
          { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } },
        );

        if (res.ok) {
          const rows = await res.json();
          if (rows[0]?.unlocked && rows[0]?.enabled_sources?.length > 0) {
            sourceUris = sourcesToUris(rows[0].enabled_sources);
            userHasCustomSources = sourceUris.length > 0;
            console.log(`[NewsSearch] User sources: ${sourceUris.length} URIs from ${rows[0].enabled_sources.length} IDs`);
          }
        }
      }
    } catch (authErr) {
      console.log("[NewsSearch] No auth, searching all sources");
    }

    // Check search cache (5 min TTL)
    const cacheInput = `${query}:${lang}:${sourceUris.sort().join(",")}`;
    const cacheHash = await hashCacheKey(cacheInput);
    const cacheKey = `news:search:${cacheHash}`;
    const cached = await getCachedSearch(env, cacheKey);

    if (cached) {
      console.log(`[NewsSearch] Cache HIT: "${query}" (${lang})`);
      return jsonResponse(cached, 200, origin, env);
    }

    console.log(`[NewsSearch] Cache MISS: "${query}" (${lang}), fetching from NewsAPI.ai`);

    // Search with user's source filter
    const articles = await searchNewsArticles(env, query, lang, sourceUris, 20);

    const result = {
      success: true,
      articles,
      count: articles.length,
      query,
      lang,
      filtered: userHasCustomSources,
      sourceCount: sourceUris.length,
      fetchedAt: new Date().toISOString(),
    };

    // Only include debug info in non-production
    if (env.ENVIRONMENT !== "production") {
      result._debug = {
        userHasCustomSources,
        sourceUris: sourceUris.slice(0, 10),
        cacheKey,
      };
    }

    // Cache results (5 min)
    await cacheSearchResults(env, cacheKey, result);

    return jsonResponse(result, 200, origin, env);
  } catch (err) {
    console.error("[NewsSearch] Error:", err.message);
    return jsonResponse(
      { error: "Search failed", message: err.message },
      500,
      origin,
      env,
    );
  }
}

// ============================================================
// GET /api/news/breaking?lang={lang}
// ============================================================
export async function handleBreakingNews(request, env, origin, ctx = null) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || "en";

    const cached = await getCachedBreakingNews(env, ctx, lang);

    return jsonResponse(
      {
        success: true,
        articles: cached.articles || [],
        count: cached.count || 0,
        fetchedAt: cached.fetchedAt,
        lang: cached.lang || lang,
      },
      200,
      origin,
      env,
    );
  } catch (err) {
    console.error("[BreakingNews] Error:", err.message);
    return jsonResponse(
      { error: "Failed to fetch breaking news", message: err.message },
      500,
      origin,
      env,
    );
  }
}
