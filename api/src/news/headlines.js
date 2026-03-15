// ============================================================
// NEWS - HEADLINES FETCHER (GNews API)
// ============================================================
// Fetches international + local headlines and curated Highlights.
//
// CONTENT POLICY:
// - NO sports
// - NO curse, dirty names, depravation
// - Highlights focus on: innovations, business success, great achievements,
//   freedom victories, scientific breakthroughs, human progress
//
// STRATEGY:
// - International headlines: always in English (Reuters, BBC, AP, Bloomberg)
// - Local headlines: in user's language for regional relevance
// - Mix both for a complete view
// - Content filter removes inappropriate articles
//
// API BUDGET: Free tier = 100 requests/day
// - International: 2 topics/hour = 48/day
// - Local: fetched on-demand per language, cached 2h
// - Highlights: 1 search/4h = 6/day
// - Total: ~54-60/day (well within limit)
// ============================================================

import { getSecret } from "../utils/secrets.js";

const KV_KEY_HEADLINES = "news:headlines";
const KV_KEY_HIGHLIGHTS = "news:highlights";
const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const HIGHLIGHTS_STALE_MS = 4 * 60 * 60 * 1000; // 4 hours

// International topics (NO sports)
const INTL_TOPICS = ["world", "business"];

// GNews supported languages
const GNEWS_LANGS = ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "zh", "ar", "he", "ja", "ko", "tr", "pl", "hu"];

// ============================================================
// TRUSTED SOURCE WHITELIST
// ============================================================
// Only articles from these sources are shown. Everything else is dropped.
// International top agencies + regional major media per language.
// ============================================================
const TRUSTED_INTL_SOURCES = [
  // Wire services
  "reuters", "associated press", "ap news",
  // Major English-language
  "bbc", "bbc news", "cnn", "bloomberg", "the guardian", "the wall street journal",
  "wsj", "the new york times", "nyt", "the washington post", "financial times",
  "the economist", "al jazeera", "dw", "deutsche welle", "nhk",
  "time", "forbes", "the telegraph", "the independent",
  "abc news", "nbc news", "cbs news", "npr", "pbs",
  "politico", "axios", "the hill",
  // Tech/Science
  "nature", "science", "mit technology review", "ars technica",
  "the verge", "wired", "techcrunch",
];

// Trusted regional sources by language
const TRUSTED_LOCAL_SOURCES = {
  pt: [
    "folha de s.paulo", "folha", "o globo", "estadão", "estadao", "g1", "uol",
    "valor econômico", "valor economico", "exame", "gazeta do povo",
    "band", "cnn brasil", "record", "sbt",
    "público", "publico", "observador", "rtp", "expresso", "jornal de notícias",
  ],
  es: [
    "el país", "el pais", "el mundo", "abc", "la vanguardia", "el confidencial",
    "infobae", "clarín", "clarin", "la nación", "la nacion", "el universal",
    "reuters latam", "bbc mundo", "cnn en español",
  ],
  fr: [
    "le monde", "le figaro", "liberation", "les échos", "les echos",
    "france 24", "rfi", "bfm", "l'obs", "le point", "mediapart",
  ],
  de: [
    "der spiegel", "spiegel", "die zeit", "faz", "frankfurter allgemeine",
    "süddeutsche zeitung", "suddeutsche", "handelsblatt", "tagesschau",
    "n-tv", "welt", "die welt", "stern",
  ],
  it: [
    "corriere della sera", "la repubblica", "il sole 24 ore", "ansa",
    "la stampa", "sky tg24", "rai news",
  ],
  nl: [
    "de volkskrant", "nrc", "nos", "rtl nieuws", "trouw", "ad",
    "nu.nl", "telegraaf",
  ],
  ja: [
    "nhk", "nikkei", "asahi shimbun", "mainichi", "yomiuri", "kyodo news",
    "japan times",
  ],
  ko: [
    "yonhap", "chosun", "joongang", "hankyoreh", "korea herald",
    "kbs", "mbc", "sbs",
  ],
  zh: [
    "south china morning post", "scmp", "caixin", "xinhua",
    "the straits times", "channel news asia", "cna",
  ],
  ru: [
    "meduza", "novaya gazeta", "bbc russian", "the moscow times",
  ],
  ar: [
    "al jazeera", "al arabiya", "sky news arabia", "bbc arabic",
    "asharq al-awsat",
  ],
  he: [
    "haaretz", "ynet", "times of israel", "israel hayom", "jerusalem post",
  ],
  tr: [
    "hurriyet", "milliyet", "sabah", "trt", "bbc turkce", "dw turkce",
  ],
  pl: [
    "gazeta wyborcza", "rzeczpospolita", "tvn24", "polsat news", "onet",
  ],
  hu: [
    "hvg", "index.hu", "telex", "rtl klub", "444.hu",
  ],
  hi: [
    "ndtv", "the hindu", "hindustan times", "india today", "the indian express",
    "times of india", "economic times",
  ],
  fa: [
    "bbc persian", "iran international", "radio farda",
  ],
};

// ============================================================
// CONTENT FILTER — removes inappropriate articles
// ============================================================
const BLOCKED_WORDS = [
  // Sports
  "nfl", "nba", "fifa", "premier league", "champions league", "world cup",
  "touchdown", "goalkeeper", "quarterback", "soccer", "football match",
  "baseball", "basketball", "tennis", "cricket", "rugby", "boxing",
  "olympics", "medal count", "playoff", "super bowl",
  // Depravation / inappropriate
  "porn", "xxx", "nude", "naked", "sex tape", "prostitut",
  "rape", "molest", "pedophil", "incest",
  // Excessive violence / gore
  "dismember", "decapitat", "torture video", "execution video",
  // Tabloid / gossip
  "kardashian", "reality tv", "celebrity gossip", "onlyfans",
];

function isCleanArticle(article) {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();
  return !BLOCKED_WORDS.some((word) => text.includes(word));
}

/**
 * Check if article is from a trusted source.
 * @param {string} sourceName - The article's source name
 * @param {string} lang - Language code for regional source matching
 */
function isTrustedSource(sourceName, lang = "en") {
  const name = (sourceName || "").toLowerCase().trim();
  if (!name) return false;

  // Check international sources
  if (TRUSTED_INTL_SOURCES.some((s) => name.includes(s) || s.includes(name))) return true;

  // Check regional sources for the user's language
  const localSources = TRUSTED_LOCAL_SOURCES[lang] || [];
  if (localSources.some((s) => name.includes(s) || s.includes(name))) return true;

  return false;
}

// ============================================================
// API FETCHERS
// ============================================================

async function fetchTopicHeadlines(apiKey, topic, lang = "en", max = 10) {
  const url = `https://gnews.io/api/v4/top-headlines?topic=${topic}&lang=${lang}&max=${max}&token=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[News] GNews API error for topic "${topic}" lang="${lang}": ${response.status} ${text}`);
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

async function fetchSearchArticles(apiKey, query, lang = "en", max = 10) {
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

function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter((article) => {
    const key = article.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================
// MAIN FETCHERS
// ============================================================

/**
 * Fetch international headlines (English) + local headlines (user language).
 * Mix both, filter content, deduplicate.
 */
export async function fetchAllHeadlines(env, lang = "en") {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) throw new Error("GNEWS_API_KEY not configured");

  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";
  const isLocalDifferent = gnewsLang !== "en";

  console.log(`[News] Fetching headlines: international (EN) ${isLocalDifferent ? `+ local (${gnewsLang})` : ""}`);

  // Fetch international headlines (always English)
  const intlPromises = INTL_TOPICS.map((topic) =>
    fetchTopicHeadlines(apiKey, topic, "en", 10)
  );

  // If user language differs from EN, also fetch local headlines
  const localPromises = isLocalDifferent
    ? [fetchTopicHeadlines(apiKey, "nation", gnewsLang, 10)]
    : [];

  const results = await Promise.all([...intlPromises, ...localPromises]);
  const allArticles = deduplicateArticles(results.flat());

  // Apply trusted source filter + content filter
  const trusted = allArticles.filter((a) => isTrustedSource(a.source, gnewsLang));
  const clean = trusted.filter(isCleanArticle);
  const sourceFiltered = allArticles.length - trusted.length;
  const contentFiltered = trusted.length - clean.length;
  if (sourceFiltered > 0) console.log(`[News] Dropped ${sourceFiltered} articles from untrusted sources`);
  if (contentFiltered > 0) console.log(`[News] Filtered ${contentFiltered} inappropriate articles`);

  // Sort newest first
  clean.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  console.log(`[News] ${clean.length} clean headlines (${allArticles.length} total, ${filtered} filtered)`);
  return clean;
}

/**
 * Fetch highlight articles (positive impact stories).
 */
export async function fetchHighlights(env) {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) throw new Error("GNEWS_API_KEY not configured");

  console.log("[News] Fetching highlights (positive impact stories)...");

  const combinedQuery = "innovation breakthrough OR startup success OR freedom victory democracy OR scientific discovery cure OR space exploration achievement";
  const articles = await fetchSearchArticles(apiKey, combinedQuery, "en", 10);
  const clean = deduplicateArticles(articles)
    .filter((a) => isTrustedSource(a.source, "en"))
    .filter(isCleanArticle);

  clean.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  console.log(`[News] ${clean.length} highlight articles`);
  return clean;
}

// ============================================================
// CACHE MANAGEMENT
// ============================================================

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

    console.log(`[News] Cached ${articles.length} headlines (${lang})`);
    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh headlines (${lang}): ${err.message}`);
    throw err;
  }
}

export async function refreshHighlights(env) {
  try {
    const articles = await fetchHighlights(env);
    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
    };

    await env.PHILOSIFY_KV.put(KV_KEY_HIGHLIGHTS, JSON.stringify(cached), {
      expirationTtl: CACHE_TTL_SECONDS * 2,
    });

    console.log(`[News] Cached ${articles.length} highlights`);
    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh highlights: ${err.message}`);
    throw err;
  }
}

/**
 * Get cached headlines. If stale, refresh in background.
 * @param {string} lang - User language for local news mix
 */
export async function getCachedHeadlines(env, ctx = null, lang = "en") {
  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";
  // Use language-specific cache key if local news is needed
  const headlinesKey = gnewsLang === "en" ? KV_KEY_HEADLINES : `${KV_KEY_HEADLINES}:${gnewsLang}`;

  const [headlinesRaw, highlightsRaw] = await Promise.all([
    env.PHILOSIFY_KV.get(headlinesKey),
    env.PHILOSIFY_KV.get(KV_KEY_HIGHLIGHTS),
  ]);

  let headlines = null;
  let highlights = null;

  if (headlinesRaw) {
    headlines = JSON.parse(headlinesRaw);
    const age = Date.now() - new Date(headlines.fetchedAt).getTime();
    if (age > STALE_THRESHOLD_MS && ctx) {
      ctx.waitUntil(refreshHeadlines(env, gnewsLang).catch((e) =>
        console.error(`[News] Background headlines refresh failed:`, e.message)
      ));
    }
  } else {
    try {
      headlines = await refreshHeadlines(env, gnewsLang);
    } catch (e) {
      console.error(`[News] Headlines fetch failed:`, e.message);
      // Fallback to English cache
      if (gnewsLang !== "en") {
        const enRaw = await env.PHILOSIFY_KV.get(KV_KEY_HEADLINES);
        if (enRaw) headlines = JSON.parse(enRaw);
      }
    }
  }

  if (highlightsRaw) {
    highlights = JSON.parse(highlightsRaw);
    const age = Date.now() - new Date(highlights.fetchedAt).getTime();
    if (age > HIGHLIGHTS_STALE_MS && ctx) {
      ctx.waitUntil(refreshHighlights(env).catch((e) =>
        console.error(`[News] Background highlights refresh failed:`, e.message)
      ));
    }
  } else {
    try {
      highlights = await refreshHighlights(env);
    } catch (e) {
      console.error(`[News] Highlights fetch failed:`, e.message);
    }
  }

  return {
    articles: headlines?.articles || [],
    highlights: highlights?.articles || [],
    count: (headlines?.count || 0) + (highlights?.count || 0),
    fetchedAt: headlines?.fetchedAt || new Date().toISOString(),
    lang: gnewsLang,
  };
}
