// ============================================================
// NEWS - HEADLINES FETCHER (GNews API)
// ============================================================
// Fetches top headlines from GNews API and caches in KV.
// Called by cron (hourly) or on-demand with stale-while-revalidate.
// Free tier: 100 requests/day (hourly = 24/day, well within limits).
// ============================================================

import { getSecret } from "../utils/secrets.js";

const KV_KEY = "news:headlines";
const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours TTL in KV
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour — refresh if older

// GNews topics to fetch for diverse coverage
const TOPICS = ["world", "business", "science", "technology", "nation"];

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
 * Fetch headlines across multiple topics, deduplicate, and return.
 */
export async function fetchAllHeadlines(env) {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) {
    throw new Error("GNEWS_API_KEY not configured");
  }

  console.log("[News] Fetching headlines from GNews API...");

  // Fetch 5 topics in parallel (5 API calls = 5 of 100 daily quota)
  const results = await Promise.all(
    TOPICS.map((topic) => fetchTopicHeadlines(apiKey, topic, "en", 10))
  );

  // Flatten and deduplicate by title
  const seen = new Set();
  const allArticles = [];

  for (const articles of results) {
    for (const article of articles) {
      const key = article.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        allArticles.push(article);
      }
    }
  }

  // Sort by published date (newest first)
  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(`[News] Fetched ${allArticles.length} unique headlines across ${TOPICS.length} topics`);

  return allArticles;
}

/**
 * Refresh headlines and store in KV.
 * Called by cron or on-demand.
 */
export async function refreshHeadlines(env) {
  try {
    const articles = await fetchAllHeadlines(env);

    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
    };

    await env.PHILOSIFY_KV.put(KV_KEY, JSON.stringify(cached), {
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
 * Get cached headlines from KV. If stale, trigger background refresh.
 * Returns cached data immediately (stale-while-revalidate pattern).
 */
export async function getCachedHeadlines(env, ctx = null) {
  const raw = await env.PHILOSIFY_KV.get(KV_KEY);

  if (raw) {
    const cached = JSON.parse(raw);
    const age = Date.now() - new Date(cached.fetchedAt).getTime();

    // If stale (>1 hour), trigger background refresh
    if (age > STALE_THRESHOLD_MS && ctx) {
      console.log("[News] Headlines stale, refreshing in background...");
      ctx.waitUntil(refreshHeadlines(env).catch((e) =>
        console.error("[News] Background refresh failed:", e.message)
      ));
    }

    return cached;
  }

  // No cache — fetch synchronously
  console.log("[News] No cached headlines, fetching synchronously...");
  return refreshHeadlines(env);
}
