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
// Include common abbreviations and aliases
const SOURCE_NAME_MAP = {};
const SOURCE_ALIASES = {
  "associated-press": ["ap", "ap news"],
  "wall-street-journal": ["wsj"],
  "new-york-times": ["nyt", "ny times"],
  "washington-post": ["wapo"],
  "los-angeles-times": ["la times", "latimes"],
  "bbc": ["bbc news", "bbc world"],
  "cnn": ["cnn news"],
  "nbc-news": ["nbc"],
  "abc-news": ["abc"],
  "cbs-news": ["cbs"],
  "npr": ["npr news"],
  "financial-times": ["ft"],
  "south-china-morning-post": ["scmp"],
  "times-of-india": ["toi"],
  "hindustan-times": ["ht"],
  "channel-news-asia": ["cna"],
};

for (const cat of Object.values(NEWS_SOURCES)) {
  for (const src of cat.sources) {
    // Map ID to lowercase name variations
    const variations = [
      src.name.toLowerCase(),
      src.id.replace(/-/g, " "),
      src.id.replace(/-/g, ""),
    ];
    // Add any custom aliases
    if (SOURCE_ALIASES[src.id]) {
      variations.push(...SOURCE_ALIASES[src.id]);
    }
    SOURCE_NAME_MAP[src.id] = variations;
  }
}

/**
 * Check if an article's source matches any of the enabled source IDs.
 * Uses strict matching to avoid false positives.
 */
function articleMatchesSource(article, enabledSourceIds, debug = false) {
  const articleSource = (article.source || "").toLowerCase().trim();
  if (!articleSource) return false;

  for (const sourceId of enabledSourceIds) {
    const nameVariations = SOURCE_NAME_MAP[sourceId] || [];
    for (const variation of nameVariations) {
      // Method 1: Article source contains the variation (e.g., "Reuters News" contains "reuters")
      if (articleSource.includes(variation)) {
        if (debug) {
          console.log(`[News] MATCH: "${articleSource}" contains "${variation}" (source: ${sourceId})`);
        }
        return true;
      }
      // Method 2: Variation contains article source, but ONLY if article source is 4+ chars
      // to avoid false positives (e.g., "ap" matching "associated press")
      if (articleSource.length >= 4 && variation.includes(articleSource)) {
        if (debug) {
          console.log(`[News] MATCH: "${variation}" contains "${articleSource}" (source: ${sourceId})`);
        }
        return true;
      }
      // Method 3: Exact match for short sources (2-3 chars like "ap", "bbc", "nbc")
      if (articleSource.length <= 3 && articleSource === variation) {
        if (debug) {
          console.log(`[News] MATCH: "${articleSource}" exact match "${variation}" (source: ${sourceId})`);
        }
        return true;
      }
    }
  }
  if (debug) {
    console.log(`[News] NO MATCH: "${articleSource}" did not match any of [${enabledSourceIds.join(", ")}]`);
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

    // Deduplicate: remove articles that also appear in highlights (by URL or title)
    const highlightUrls = new Set(highlights.map(h => h.url));
    const highlightTitles = new Set(highlights.map(h => h.title?.toLowerCase().trim()));
    articles = articles.filter(a => {
      const isDupe = highlightUrls.has(a.url) || highlightTitles.has(a.title?.toLowerCase().trim());
      return !isDupe;
    });

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
    const userHasCustomSources = unlocked && enabledSources && Array.isArray(enabledSources) && enabledSources.length > 0;
    if (userHasCustomSources) {
      sourcesToUse = enabledSources;
      console.log(`[News] User has custom sources: ${sourcesToUse.length} selected: [${sourcesToUse.join(", ")}]`);
      // Log first 5 article sources for debugging
      console.log(`[News] Sample article sources: [${articles.slice(0, 5).map(a => a.source).join(", ")}]`);
    }

    // Filter articles by enabled sources (debug=true if user has custom sources to trace matching)
    const filteredArticles = articles.filter((a) => articleMatchesSource(a, sourcesToUse, userHasCustomSources));
    const filteredHighlights = highlights.filter((a) => articleMatchesSource(a, sourcesToUse, userHasCustomSources));

    // If user has custom sources, always use filtered results (even if few/none)
    // Only fall back to all if user is NOT unlocked (using defaults)
    const useFiltered = userHasCustomSources || filteredArticles.length > 0;

    console.log(`[News] Filtering: ${articles.length} total, ${filteredArticles.length} matched, userCustom=${userHasCustomSources}, useFiltered=${useFiltered}`);

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
        selectedSources: userHasCustomSources ? enabledSources.length : null,
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
