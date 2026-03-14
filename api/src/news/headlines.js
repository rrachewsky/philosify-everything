// ============================================================
// NEWS - HEADLINES FETCHER (GNews API)
// ============================================================
// Fetches top headlines + curated "Highlights" (positive impact stories).
// Free tier: 100 requests/day.
// Budget: 3 topics/hour (72/day) + 1 highlights search/4h (6/day) = 78/day.
// ============================================================

import { getSecret } from "../utils/secrets.js";

const KV_KEY_HEADLINES = "news:headlines";
const KV_KEY_HIGHLIGHTS = "news:highlights";
const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours TTL in KV
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour — refresh if older
const HIGHLIGHTS_STALE_MS = 4 * 60 * 60 * 1000; // 4 hours — refresh highlights less often

// GNews topics for general headlines (3 to save API quota for highlights)
const TOPICS = ["world", "business", "technology"];

// ============================================================
// HIGHLIGHTS — Positive impact news
// ============================================================
// Searches for stories about innovation, achievement, freedom,
// business success, scientific breakthroughs, human progress.
// These are the stories that celebrate human potential.
// ============================================================
const HIGHLIGHT_SEARCHES = [
  "innovation breakthrough technology",
  "freedom democracy victory rights",
  "business success startup achievement",
  "scientific discovery space exploration cure",
];

/**
 * Fetch top headlines from GNews API for a given topic.
 */
async function fetchTopicHeadlines(apiKey, topic, lang = "en", max = 10) {
  const url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=${lang}&max=${max}&token=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[News] GNews API error for topic "${topic}": ${response.status} ${text}`);
    return [];
  }

  const data = await response.json();
  return (data.articles || []).map((article) => ({
    title: article.title,
    description: article.description || "",
    source: article.source?.name || "Unknown",
    sourceUrl: article.source?.url || "",
    url: article.url,
    imageUrl: article.image || null,
    publishedAt: article.publishedAt,
    topic,
  }));
}

/**
 * Fetch articles by search query from GNews API.
 */
async function fetchSearchArticles(apiKey, query, lang = "en", max = 5) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}&max=${max}&sortby=publishedAt&token=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[News] GNews search error for "${query}": ${response.status} ${text}`);
    return [];
  }

  const data = await response.json();
  return (data.articles || []).map((article) => ({
    title: article.title,
    description: article.description || "",
    source: article.source?.name || "Unknown",
    sourceUrl: article.source?.url || "",
    url: article.url,
    imageUrl: article.image || null,
    publishedAt: article.publishedAt,
    highlight: true,
  }));
}

/**
 * Deduplicate articles by title.
 */
function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter((article) => {
    const key = article.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Fetch headlines across multiple topics, deduplicate, and return.
 */
export async function fetchAllHeadlines(env) {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) {
    throw new Error("GNEWS_API_KEY not configured");
  }

  console.log("[News] Fetching headlines from GNews API...");

  // Fetch 3 topics in parallel (3 API calls)
  const results = await Promise.all(
    TOPICS.map((topic) => fetchTopicHeadlines(apiKey, topic, "en", 10))
  );

  const allArticles = deduplicateArticles(results.flat());

  // Sort by published date (newest first)
  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(`[News] Fetched ${allArticles.length} unique headlines across ${TOPICS.length} topics`);
  return allArticles;
}

/**
 * Fetch highlight articles (positive impact stories).
 * Uses a SINGLE combined search to save API quota.
 */
export async function fetchHighlights(env) {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) {
    throw new Error("GNEWS_API_KEY not configured");
  }

  console.log("[News] Fetching highlights (positive impact stories)...");

  // Single search with combined keywords to save API quota (1 call instead of 4)
  const combinedQuery = "innovation OR breakthrough OR freedom OR achievement OR discovery";
  const articles = await fetchSearchArticles(apiKey, combinedQuery, "en", 10);

  const unique = deduplicateArticles(articles);

  // Sort by published date (newest first)
  unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(`[News] Fetched ${unique.length} highlight articles`);
  return unique;
}

/**
 * Refresh general headlines and store in KV.
 */
export async function refreshHeadlines(env) {
  try {
    const articles = await fetchAllHeadlines(env);

    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
    };

    await env.PHILOSIFY_KV.put(KV_KEY_HEADLINES, JSON.stringify(cached), {
      expirationTtl: CACHE_TTL_SECONDS,
    });

    console.log(`[News] Cached ${articles.length} headlines in KV`);
    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh headlines: ${err.message}`);
    throw err;
  }
}

/**
 * Refresh highlights and store in KV.
 */
export async function refreshHighlights(env) {
  try {
    const articles = await fetchHighlights(env);

    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
    };

    await env.PHILOSIFY_KV.put(KV_KEY_HIGHLIGHTS, JSON.stringify(cached), {
      expirationTtl: CACHE_TTL_SECONDS * 2, // 4h TTL
    });

    console.log(`[News] Cached ${articles.length} highlights in KV`);
    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh highlights: ${err.message}`);
    throw err;
  }
}

/**
 * Get cached headlines from KV. If stale, trigger background refresh.
 */
export async function getCachedHeadlines(env, ctx = null) {
  // Fetch both headlines and highlights in parallel
  const [headlinesRaw, highlightsRaw] = await Promise.all([
    env.PHILOSIFY_KV.get(KV_KEY_HEADLINES),
    env.PHILOSIFY_KV.get(KV_KEY_HIGHLIGHTS),
  ]);

  let headlines = null;
  let highlights = null;

  if (headlinesRaw) {
    headlines = JSON.parse(headlinesRaw);
    const age = Date.now() - new Date(headlines.fetchedAt).getTime();
    if (age > STALE_THRESHOLD_MS && ctx) {
      console.log("[News] Headlines stale, refreshing in background...");
      ctx.waitUntil(refreshHeadlines(env).catch((e) =>
        console.error("[News] Background headlines refresh failed:", e.message)
      ));
    }
  } else if (ctx) {
    // No cache — fetch in background, return empty for now
    console.log("[News] No cached headlines, fetching in background...");
    ctx.waitUntil(refreshHeadlines(env).catch((e) =>
      console.error("[News] Background headlines fetch failed:", e.message)
    ));
  } else {
    // No ctx — fetch synchronously
    headlines = await refreshHeadlines(env);
  }

  if (highlightsRaw) {
    highlights = JSON.parse(highlightsRaw);
    const age = Date.now() - new Date(highlights.fetchedAt).getTime();
    if (age > HIGHLIGHTS_STALE_MS && ctx) {
      console.log("[News] Highlights stale, refreshing in background...");
      ctx.waitUntil(refreshHighlights(env).catch((e) =>
        console.error("[News] Background highlights refresh failed:", e.message)
      ));
    }
  } else if (ctx) {
    ctx.waitUntil(refreshHighlights(env).catch((e) =>
      console.error("[News] Background highlights fetch failed:", e.message)
    ));
  } else {
    highlights = await refreshHighlights(env);
  }

  return {
    articles: headlines?.articles || [],
    highlights: highlights?.articles || [],
    count: (headlines?.count || 0) + (highlights?.count || 0),
    fetchedAt: headlines?.fetchedAt || new Date().toISOString(),
  };
}
