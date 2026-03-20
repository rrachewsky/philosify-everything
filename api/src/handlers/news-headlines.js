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
    const variations = [
      src.name.toLowerCase(),
      src.id.replace(/-/g, " "),
      src.id.replace(/-/g, ""),
    ];
    if (SOURCE_ALIASES[src.id]) {
      variations.push(...SOURCE_ALIASES[src.id]);
    }
    SOURCE_NAME_MAP[src.id] = variations;
  }
}

/**
 * Check if an article's source matches any of the enabled source IDs.
 * Uses bidirectional substring matching (the original working logic).
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

    // Deduplicate: remove articles that also appear in highlights (by URL or title)
    const highlightUrls = new Set(highlights.map((h) => h.url));
    const highlightTitles = new Set(highlights.map((h) => h.title?.toLowerCase().trim()));
    articles = articles.filter((a) => {
      const isDupe = highlightUrls.has(a.url) || highlightTitles.has(a.title?.toLowerCase().trim());
      return !isDupe;
    });

    // Get user preferences — determines source filtering
    let enabledSources = null;
    let unlocked = false;
    let userId = null;
    let authStatus = "no_auth";

    try {
      const user = await getUserFromAuth(request, env);
      if (user?.userId) {
        userId = user.userId;
        authStatus = "authenticated";
        const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
        const res = await fetch(
          `${sbUrl}/rest/v1/user_news_preferences?user_id=eq.${user.userId}&select=unlocked,enabled_sources`,
          {
            headers: {
              apikey: sbKey,
              Authorization: `Bearer ${sbKey}`,
            },
          },
        );

        if (res.ok) {
          const rows = await res.json();
          if (rows[0]) {
            unlocked = rows[0].unlocked || false;
            enabledSources = rows[0].enabled_sources;
            authStatus = `ok_unlocked=${unlocked}_sources=${enabledSources?.length || 0}`;
          } else {
            authStatus = "ok_no_preferences_row";
          }
        } else {
          authStatus = `supabase_error_${res.status}`;
        }
      } else {
        authStatus = "no_user";
      }
    } catch (authErr) {
      authStatus = `auth_error: ${authErr.message}`;
      console.error("[News] Auth/preferences error:", authErr.message);
    }

    console.log(`[News] Auth: ${authStatus}`);

    // Determine which sources to use
    let sourcesToUse = DEFAULT_SOURCE_IDS;
    const userHasCustomSources = unlocked && enabledSources && Array.isArray(enabledSources) && enabledSources.length > 0;
    if (userHasCustomSources) {
      sourcesToUse = enabledSources;
      console.log(`[News] CUSTOM sources: ${sourcesToUse.length} — [${sourcesToUse.join(", ")}]`);
    } else {
      console.log(`[News] DEFAULT sources: ${sourcesToUse.length} (unlocked=${unlocked}, enabledSources=${JSON.stringify(enabledSources)})`);
    }

    // Log all unique source names in the feed for debugging
    const uniqueSources = [...new Set(articles.map((a) => a.source))];
    console.log(`[News] Available sources in feed (${uniqueSources.length}): [${uniqueSources.join(", ")}]`);

    // Filter articles by enabled sources
    const filteredArticles = articles.filter((a) => articleMatchesSource(a, sourcesToUse));
    const filteredHighlights = highlights.filter((a) => articleMatchesSource(a, sourcesToUse));

    // When user explicitly chose sources: ALWAYS respect that choice
    // When using defaults: fall back to all if filter is too restrictive
    let useFiltered;
    if (userHasCustomSources) {
      useFiltered = true;
      console.log(`[News] CUSTOM filter result: ${filteredArticles.length}/${articles.length} articles, ${filteredHighlights.length}/${highlights.length} highlights`);
    } else {
      const minArticles = 5;
      useFiltered = filteredArticles.length >= minArticles;
    }

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
        // Debug info — remove after confirming fix
        _debug: {
          authStatus,
          userHasCustomSources,
          selectedSourceCount: sourcesToUse.length,
          selectedSources: userHasCustomSources ? sourcesToUse : null,
          totalArticles: articles.length,
          matchedArticles: filteredArticles.length,
          availableSources: uniqueSources,
        },
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
