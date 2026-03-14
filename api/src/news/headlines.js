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
 * @param {Object} env
 * @param {string} [lang='en'] - Language code for headlines (GNews supports: en, pt, es, fr, de, it, nl, ru, zh, ar, he, ja, ko, tr, pl, hu)
 */
export async function fetchAllHeadlines(env, lang = "en") {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) {
    throw new Error("GNEWS_API_KEY not configured");
  }

  // GNews supported languages (subset — map unsupported to English)
  const GNEWS_LANGS = ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "zh", "ar", "he", "ja", "ko", "tr", "pl", "hu"];
  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";

  console.log(`[News] Fetching headlines in "${gnewsLang}" from GNews API...`);

  // Fetch 3 topics in parallel (3 API calls)
  const results = await Promise.all(
    TOPICS.map((topic) => fetchTopicHeadlines(apiKey, topic, gnewsLang, 10))
  );

  const allArticles = deduplicateArticles(results.flat());

  // Sort by published date (newest first)
  allArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(`[News] Fetched ${allArticles.length} unique headlines in "${gnewsLang}" across ${TOPICS.length} topics`);
  return allArticles;
}

/**
 * Fetch highlight articles (positive impact stories).
 * Uses a SINGLE combined search to save API quota.
 */
export async function fetchHighlights(env, lang = "en") {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) {
    throw new Error("GNEWS_API_KEY not configured");
  }

  const GNEWS_LANGS = ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "zh", "ar", "he", "ja", "ko", "tr", "pl", "hu"];
  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";

  console.log(`[News] Fetching highlights in "${gnewsLang}"...`);

  // Focused search for positive impact stories: innovation, freedom victories,
  // business success, scientific breakthroughs, human achievement
  const combinedQuery = "innovation breakthrough OR startup success OR freedom victory democracy OR scientific discovery cure OR space exploration achievement";
  const articles = await fetchSearchArticles(apiKey, combinedQuery, gnewsLang, 10);

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
 * @param {Object} env
 * @param {string} [lang='en'] - Language code
 */
export async function refreshHeadlines(env, lang = "en") {
  try {
    const articles = await fetchAllHeadlines(env, lang);

    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      lang,
    };

    const kvKey = lang === "en" ? KV_KEY_HEADLINES : `${KV_KEY_HEADLINES}:${lang}`;
    await env.PHILOSIFY_KV.put(kvKey, JSON.stringify(cached), {
      expirationTtl: CACHE_TTL_SECONDS,
    });

    console.log(`[News] Cached ${articles.length} headlines (${lang}) in KV`);
    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh headlines (${lang}): ${err.message}`);
    throw err;
  }
}

/**
 * Refresh highlights and store in KV.
 * @param {Object} env
 * @param {string} [lang='en'] - Language code
 */
export async function refreshHighlights(env, lang = "en") {
  try {
    const articles = await fetchHighlights(env, lang);

    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      lang,
    };

    const kvKey = lang === "en" ? KV_KEY_HIGHLIGHTS : `${KV_KEY_HIGHLIGHTS}:${lang}`;
    await env.PHILOSIFY_KV.put(kvKey, JSON.stringify(cached), {
      expirationTtl: CACHE_TTL_SECONDS * 2, // 4h TTL
    });

    console.log(`[News] Cached ${articles.length} highlights (${lang}) in KV`);
    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh highlights (${lang}): ${err.message}`);
    throw err;
  }
}

/**
 * Get cached headlines from KV. If stale, trigger background refresh.
 * @param {Object} env
 * @param {Object|null} ctx - Cloudflare context for waitUntil
 * @param {string} [lang='en'] - User language
 */
export async function getCachedHeadlines(env, ctx = null, lang = "en") {
  const headlinesKey = lang === "en" ? KV_KEY_HEADLINES : `${KV_KEY_HEADLINES}:${lang}`;
  const highlightsKey = lang === "en" ? KV_KEY_HIGHLIGHTS : `${KV_KEY_HIGHLIGHTS}:${lang}`;

  // Fetch both headlines and highlights in parallel
  const [headlinesRaw, highlightsRaw] = await Promise.all([
    env.PHILOSIFY_KV.get(headlinesKey),
    env.PHILOSIFY_KV.get(highlightsKey),
  ]);

  let headlines = null;
  let highlights = null;

  if (headlinesRaw) {
    headlines = JSON.parse(headlinesRaw);
    const age = Date.now() - new Date(headlines.fetchedAt).getTime();
    if (age > STALE_THRESHOLD_MS && ctx) {
      console.log(`[News] Headlines (${lang}) stale, refreshing in background...`);
      ctx.waitUntil(refreshHeadlines(env, lang).catch((e) =>
        console.error(`[News] Background headlines (${lang}) refresh failed:`, e.message)
      ));
    }
  } else {
    // No cache for this language — fetch synchronously (first request)
    console.log(`[News] No cached headlines for "${lang}", fetching...`);
    try {
      headlines = await refreshHeadlines(env, lang);
    } catch (e) {
      console.error(`[News] Headlines fetch (${lang}) failed:`, e.message);
      // Fallback to English cache
      if (lang !== "en") {
        const enRaw = await env.PHILOSIFY_KV.get(KV_KEY_HEADLINES);
        if (enRaw) headlines = JSON.parse(enRaw);
      }
    }
  }

  if (highlightsRaw) {
    highlights = JSON.parse(highlightsRaw);
    const age = Date.now() - new Date(highlights.fetchedAt).getTime();
    if (age > HIGHLIGHTS_STALE_MS && ctx) {
      ctx.waitUntil(refreshHighlights(env, lang).catch((e) =>
        console.error(`[News] Background highlights (${lang}) refresh failed:`, e.message)
      ));
    }
  } else {
    console.log(`[News] No cached highlights for "${lang}", fetching...`);
    try {
      highlights = await refreshHighlights(env, lang);
    } catch (e) {
      console.error(`[News] Highlights fetch (${lang}) failed:`, e.message);
      if (lang !== "en") {
        const enRaw = await env.PHILOSIFY_KV.get(KV_KEY_HIGHLIGHTS);
        if (enRaw) highlights = JSON.parse(enRaw);
      }
    }
  }

  return {
    articles: headlines?.articles || [],
    highlights: highlights?.articles || [],
    count: (headlines?.count || 0) + (highlights?.count || 0),
    fetchedAt: headlines?.fetchedAt || new Date().toISOString(),
    lang,
  };
}
