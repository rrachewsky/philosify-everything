// ============================================================
// NEWS - HEADLINES & SEARCH (NewsAPI.ai)
// ============================================================
// PHILOSOPHICAL MISSION:
// Philosify focuses ONLY on news that sparks meaningful philosophical analysis.
//
// APPROVED THEMES:
// ✓ Innovation & Scientific Breakthroughs
// ✓ Great Achievements & Human Progress
// ✓ Business Success & Entrepreneurship
// ✓ Wars & Conflicts (good vs. evil, defense of rights)
// ✓ Heroic Actions & Courage
// ✓ Life-Changing Transformations
// ✓ Justice & Accountability
// ✓ Freedom Victories & Individual Rights
//
// EXCLUDED THEMES:
// ✗ Lottery, gambling, games of chance
// ✗ Sports scores (unless philosophically significant)
// ✗ Celebrity gossip, entertainment, fashion
// ✗ Weather, traffic, daily market noise
// ✗ Viral trends, memes, trivial content
//
// STRATEGY:
// - User searches a topic → NewsAPI.ai returns articles
// - Breaking news ticker polls Tier A sources every 20 min
// - Filter blocked sources (tabloids, propaganda, clickbait)
// - Filter blocked words (sports, gossip, trivial)
// - Prioritize quality sources (Reuters, WSJ, Economist, etc.)
// - Score articles by philosophical keywords
// - Sort by: source priority → philosophical relevance → date
// ============================================================

import { getSecret } from "../utils/secrets.js";

const NEWSAPI_BASE = "https://eventregistry.org/api/v1";

// KV cache keys
const KV_KEY_BREAKING = "news:v3:breaking";
const BREAKING_CACHE_TTL = 20 * 60; // 20 minutes
const BREAKING_STALE_MS = 15 * 60 * 1000; // 15 minutes
const SEARCH_CACHE_TTL = 5 * 60; // 5 minutes

// ============================================================
// ISO 639-1 → ISO 639-3 mapping (NewsAPI.ai uses 639-3)
// ============================================================
const LANG_MAP = {
  en: "eng", pt: "por", es: "spa", fr: "fra", de: "deu",
  it: "ita", nl: "nld", ru: "rus", zh: "zho", ar: "ara",
  he: "heb", ja: "jpn", ko: "kor", tr: "tur", pl: "pol",
  hu: "hun", hi: "hin", fa: "fas",
};

export function langToNewsApi(lang) {
  return LANG_MAP[lang] || "eng";
}

// ============================================================
// PHILOSOPHICAL KEYWORDS — prioritize meaningful content
// ============================================================
export const PHILOSOPHICAL_KEYWORDS = [
  // Innovation & Achievement
  "breakthrough", "innovation", "discovery", "achievement", "pioneer",
  "revolutionize", "transform", "first ever", "historic", "milestone",
  "invented", "patent", "scientific",
  // Heroic Action
  "hero", "heroic", "rescue", "saved lives", "courage", "brave",
  "selfless", "risked life", "medal of honor", "bravery",
  // Freedom & Rights
  "freedom", "liberty", "rights", "independence", "liberation",
  "resistance", "overthrow", "freed from", "escaped tyranny",
  "democracy", "constitution", "civil rights",
  // Business Success & Value Creation
  "entrepreneur", "founder", "startup", "unicorn", "disruption",
  "billion", "ipo", "acquisition", "merger", "growth",
  // Life Transformation
  "overcame", "triumph", "against all odds", "remarkable recovery",
  "turned life around", "second chance", "inspiring story",
  // Justice & Accountability
  "justice", "convicted", "held accountable", "verdict", "sentenced",
  "whistleblower", "exposed corruption", "indicted", "tribunal",
  // Wars - Good vs Evil
  "defended", "liberated", "victory against", "resistance fighters",
  "war crimes", "humanitarian", "peacekeeping", "ceasefire",
  // Philosophy & Ideas
  "philosophy", "ethics", "moral", "principle", "ideology",
];

// ============================================================
// BLOCKED SOURCES — unreliable, tabloid, clickbait, propaganda
// ============================================================
export const BLOCKED_SOURCES = [
  // Tabloids / gossip
  "daily mail", "dailymail", "the sun", "new york post", "ny post",
  "tmz", "page six", "us weekly", "people magazine", "e! news",
  "entertainment tonight", "buzzfeed", "huffpost", "huffington post",
  // Clickbait / low quality
  "yahoo", "msn", "aol", "newsbreak", "ground news",
  "the daily beast", "salon", "rawstory", "raw story",
  "occupy democrats", "patriot", "infowars", "breitbart",
  "natural news", "the gateway pundit", "zero hedge",
  "newsmax", "one america", "oan",
  // Content farms / SEO sites
  "medium.com", "substack", "blogspot", "wordpress.com",
  // Social media
  "reddit", "twitter", "facebook", "tiktok", "instagram",
  // Propaganda
  "rt.com", "russia today", "sputnik", "global times", "cgtn",
  "press tv", "tasnim", "fars news",
];

// ============================================================
// PRIORITY SOURCES — quality journalism, boosted in sorting
// ============================================================
export const PRIORITY_SOURCES_TIER1 = [
  "reuters", "associated press", "ap news", "afp", "agence france",
  "the economist", "wall street journal", "wsj", "financial times",
  "bloomberg",
];

export const PRIORITY_SOURCES_TIER2 = [
  "reason", "reason magazine", "national review", "the free press",
  "free press", "city journal", "foreign affairs", "quillette",
  "the telegraph", "telegraph", "the times", "the spectator", "spectator",
  "neue zürcher", "nzz", "die welt", "le figaro",
  "times of israel", "jerusalem post", "i24 news", "i24news",
  "gazeta do povo", "crusoé", "crusoe", "piauí", "piaui",
  "poder360", "jovem pan", "o antagonista", "antagonista",
  "techcrunch", "tech crunch", "wired", "ars technica", "arstechnica",
  "mit technology review", "nature", "scientific american",
  "forbes", "fortune", "cnbc",
];

// ============================================================
// CONTENT FILTER — removes inappropriate/trivial articles
// ============================================================
export const BLOCKED_WORDS = [
  // Sports
  "nfl", "nba", "fifa", "premier league", "champions league", "world cup",
  "touchdown", "goalkeeper", "quarterback", "soccer", "football match",
  "baseball", "basketball", "tennis", "cricket", "rugby", "boxing",
  "olympics", "medal count", "playoff", "super bowl", "stanley cup",
  "grand slam", "hole in one", "hat trick",
  // Lottery & Gambling
  "lottery", "jackpot", "powerball", "mega millions", "lotto",
  "winning numbers", "scratch ticket", "casino", "slot machine",
  "betting odds", "sportsbook",
  // Astrology
  "horoscope", "zodiac", "astrology", "fortune teller", "psychic reading",
  "tarot", "numerology",
  // Weather
  "weather forecast", "storm warning", "hurricane watch", "cold front",
  "heat wave warning", "flood watch", "tornado warning",
  // Market noise
  "stock closes", "dow jones", "s&p 500", "market recap", "trading day",
  "futures rise", "futures fall", "nasdaq closes",
  // Traffic
  "traffic jam", "road closure", "commute time", "parking ticket",
  // Fashion & Entertainment
  "best dressed", "fashion week", "red carpet", "award show outfit",
  "grammy", "oscar", "emmy", "golden globe", "mtv awards",
  "met gala", "runway", "designer collection",
  // Viral / Memes
  "viral video", "tiktok trend", "meme", "goes viral", "internet breaks",
  "trending on", "challenge goes viral",
  // Inappropriate
  "porn", "xxx", "nude", "naked", "sex tape", "prostitut",
  "rape", "molest", "pedophil", "incest",
  // Gore
  "dismember", "decapitat", "torture video", "execution video",
  // Tabloid
  "kardashian", "reality tv", "celebrity gossip", "onlyfans",
  "dating rumor", "breakup", "divorce filing", "baby bump",
];

// ============================================================
// BREAKING NEWS — Tier A sources + event keywords
// ============================================================
const BREAKING_NEWS_SOURCES_TIER_A = [
  "reuters.com", "apnews.com", "afp.com", "efe.com",
  "bbc.co.uk", "npr.org", "pbs.org", "swissinfo.ch", "abc.net.au",
];

const BREAKING_NEWS_KEYWORDS = [
  "war", "invasion", "attack", "coup", "assassination", "missile", "ceasefire", "nuclear",
  "election", "referendum", "impeachment", "sanctions", "treaty", "summit",
  "market crash", "recession", "default", "rate decision", "bank collapse",
  "earthquake", "tsunami", "pandemic", "outbreak", "eruption",
  "discovery", "breakthrough", "Nobel", "historic",
];

// ============================================================
// FILTER / SCORE FUNCTIONS
// ============================================================

export function isCleanArticle(article) {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();
  return !BLOCKED_WORDS.some((word) => text.includes(word));
}

export function getPhilosophicalScore(article) {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();
  let score = 0;
  for (const keyword of PHILOSOPHICAL_KEYWORDS) {
    if (text.includes(keyword)) score += 1;
  }
  return score;
}

export function getSourcePriorityScore(article) {
  const source = (article.source || "").toLowerCase();
  if (!source) return 0;
  for (const s of PRIORITY_SOURCES_TIER1) {
    if (source.includes(s) || s.includes(source)) return 10;
  }
  for (const s of PRIORITY_SOURCES_TIER2) {
    if (source.includes(s) || s.includes(source)) return 5;
  }
  return 0;
}

export function isBlockedSource(sourceName) {
  const name = (sourceName || "").toLowerCase().trim();
  if (!name) return true;
  return BLOCKED_SOURCES.some((s) => name.includes(s) || s.includes(name));
}

export function deduplicateArticles(articles) {
  const seen = new Set();
  const seenFuzzy = new Set();
  return articles.filter((article) => {
    const exactKey = article.title.toLowerCase().trim();
    if (seen.has(exactKey)) return false;
    seen.add(exactKey);
    const words = exactKey
      .replace(/[^a-zA-Z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .sort()
      .slice(0, 5)
      .join("|");
    if (words.length >= 10) {
      if (seenFuzzy.has(words)) return false;
      seenFuzzy.add(words);
    }
    return true;
  });
}

function sortArticles(articles) {
  return articles.sort((a, b) => {
    const srcA = getSourcePriorityScore(a);
    const srcB = getSourcePriorityScore(b);
    if (srcB !== srcA) return srcB - srcA;
    const philA = getPhilosophicalScore(a);
    const philB = getPhilosophicalScore(b);
    if (philB !== philA) return philB - philA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

// ============================================================
// NEWSAPI.AI — article normalizer
// ============================================================

function normalizeNewsApiArticle(article) {
  return {
    title: article.title || "",
    description: article.body?.substring(0, 300) || "",
    content: article.body || "",
    source: article.source?.title || article.source?.uri || "",
    sourceUrl: article.source?.uri ? `https://${article.source.uri}` : "",
    url: article.url || "",
    imageUrl: article.image || null,
    publishedAt: article.date && article.time
      ? `${article.date}T${article.time}Z`
      : article.dateTime || new Date().toISOString(),
    lang: article.lang || "eng",
    sentiment: article.sentiment ?? null,
  };
}

// ============================================================
// NEWSAPI.AI — search articles
// ============================================================

export async function searchNewsArticles(env, query, lang = "en", sourceUris = [], count = 20) {
  const apiKey = await getSecret(env.NEWSAPI_AI_KEY);
  if (!apiKey) throw new Error("NEWSAPI_AI_KEY not configured");

  const newsApiLang = langToNewsApi(lang);

  const body = {
    action: "getArticles",
    keyword: query,
    lang: [newsApiLang],
    articlesPage: 1,
    articlesCount: count,
    articlesSortBy: "date",
    articlesSortByAsc: false,
    dataType: ["news"],
    forceMaxDataTimeWindow: 31,
    resultType: "articles",
    apiKey,
  };

  // If user has specific sources, pass them to the API
  if (sourceUris.length > 0) {
    body.sourceUri = sourceUris;
  }

  console.log(`[News] Searching NewsAPI.ai: "${query}" lang=${newsApiLang} sources=${sourceUris.length || "all"}`);

  const res = await fetch(`${NEWSAPI_BASE}/article/getArticles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[News] NewsAPI.ai error: ${res.status} ${errText.substring(0, 200)}`);
    throw new Error(`NewsAPI.ai error: ${res.status}`);
  }

  const data = await res.json();
  const results = data.articles?.results ?? [];

  console.log(`[News] NewsAPI.ai returned ${results.length} articles (total: ${data.articles?.totalResults ?? 0})`);

  const articles = results.map(normalizeNewsApiArticle);

  // Apply curation: dedup, block sources, block content, sort
  const deduped = deduplicateArticles(articles);
  const notBlocked = deduped.filter((a) => !isBlockedSource(a.source));
  const clean = notBlocked.filter(isCleanArticle);
  const sorted = sortArticles(clean);

  const blocked = deduped.length - notBlocked.length;
  const filtered = notBlocked.length - clean.length;
  if (blocked > 0) console.log(`[News] Blocked ${blocked} articles from unreliable sources`);
  if (filtered > 0) console.log(`[News] Filtered ${filtered} inappropriate articles`);
  console.log(`[News] ${sorted.length} clean articles after curation`);

  return sorted;
}

// ============================================================
// NEWSAPI.AI — breaking news fetch (Tier A sources + keywords)
// ============================================================

export async function fetchBreakingNews(env) {
  const apiKey = await getSecret(env.NEWSAPI_AI_KEY);
  if (!apiKey) throw new Error("NEWSAPI_AI_KEY not configured");

  console.log(`[News] Fetching breaking news...`);

  // Fetch major stories — no source filter (let isBlockedSource clean up after).
  // Using keyword OR gives broad coverage; source filter was too restrictive with keywords.
  const res = await fetch(`${NEWSAPI_BASE}/article/getArticles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "getArticles",
      keyword: "war OR election OR recession OR earthquake OR pandemic OR breakthrough OR assassination OR sanctions OR treaty",
      lang: ["eng"],
      articlesPage: 1,
      articlesCount: 20,
      articlesSortBy: "date",
      articlesSortByAsc: false,
      dataType: ["news"],
      forceMaxDataTimeWindow: 3,
      resultType: "articles",
      apiKey,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[News] Breaking news API error: ${res.status} ${errText.substring(0, 200)}`);
    throw new Error(`Breaking news fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const results = data.articles?.results ?? [];
  console.log(`[News] Breaking news API returned ${results.length} raw articles`);

  const articles = results
    .map(normalizeNewsApiArticle)
    .filter((a) => !isBlockedSource(a.source))
    .filter(isCleanArticle);

  const deduped = deduplicateArticles(articles);
  const sorted = sortArticles(deduped);

  console.log(`[News] ${sorted.length} breaking news after curation`);
  return sorted;
}

// ============================================================
// AI SUMMARIZER — for breaking news ticker only
// Translates titles + generates 40-word summaries in user language
// Search results skip this (user is active, latency matters)
// ============================================================

export async function summarizeArticles(articles, lang, env) {
  const apiKey = await getSecret(env.GEMINI_API_KEY);
  if (!apiKey || articles.length === 0) return articles;

  const batch = articles.map((a, i) => `[${i}] ${a.title}${a.description ? " — " + a.description : ""}`).join("\n");

  const prompt = `You are a multilingual news editor. For each article below:
1. Translate the headline title into the language with ISO code "${lang}" (if it is already in "${lang}", keep it as-is).
2. Write a concise summary of approximately 40 words in "${lang}".

The articles may be in ANY language (English, Chinese, Arabic, Hebrew, Japanese, etc.).
You MUST translate EVERY title and summary into "${lang}". No exceptions.

Return ONLY a valid JSON array:
[{"id":0,"title":"translated title in ${lang}","summary":"summary in ${lang}"},{"id":1,"title":"...","summary":"..."},...]
No markdown fences, no explanation, ONLY the JSON array.

Articles:
${batch}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
      }),
    });

    if (!res.ok) {
      console.error(`[News] Summary API error: ${res.status}`);
      return articles;
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const summaries = JSON.parse(jsonStr);

    const map = {};
    for (const s of summaries) map[s.id] = s;

    console.log(`[News] Translated + summarized ${summaries.length} articles into "${lang}"`);
    return articles.map((a, i) => ({
      ...a,
      originalTitle: a.title,
      title: map[i]?.title || a.title,
      aiSummary: map[i]?.summary || a.description || "",
    }));
  } catch (err) {
    console.error(`[News] AI translate+summary failed (${lang}): ${err.message}`);
    return articles;
  }
}

// ============================================================
// CACHE MANAGEMENT
// ============================================================

/**
 * Refresh breaking news and cache in KV (called by cron every 20 min)
 */
export async function refreshBreakingNews(env, lang = "en") {
  try {
    let articles = await fetchBreakingNews(env);
    articles = await summarizeArticles(articles, lang, env);

    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      lang,
    };

    if (articles.length > 0) {
      const kvKey = lang === "en" ? KV_KEY_BREAKING : `${KV_KEY_BREAKING}:${lang}`;
      await env.PHILOSIFY_KV.put(kvKey, JSON.stringify(cached), {
        expirationTtl: BREAKING_CACHE_TTL,
      });
      console.log(`[News] Cached ${articles.length} breaking news (${lang})`);
    } else {
      console.warn(`[News] NOT caching empty breaking news (${lang}) — possible API issue`);
    }

    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh breaking news (${lang}): ${err.message}`);
    throw err;
  }
}

/**
 * Get cached breaking news. If stale, refresh in background.
 */
export async function getCachedBreakingNews(env, ctx = null, lang = "en") {
  const kvKey = lang === "en" ? KV_KEY_BREAKING : `${KV_KEY_BREAKING}:${lang}`;
  const raw = await env.PHILOSIFY_KV.get(kvKey);

  if (raw) {
    const cached = JSON.parse(raw);
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age > BREAKING_STALE_MS && ctx) {
      ctx.waitUntil(refreshBreakingNews(env, lang).catch((e) =>
        console.error(`[News] Background breaking refresh failed:`, e.message)
      ));
    }
    return cached;
  }

  // No cache — fetch now
  try {
    return await refreshBreakingNews(env, lang);
  } catch (e) {
    console.error(`[News] Breaking news fetch failed:`, e.message);
    // Fallback to English cache
    if (lang !== "en") {
      const enRaw = await env.PHILOSIFY_KV.get(KV_KEY_BREAKING);
      if (enRaw) return JSON.parse(enRaw);
    }
    return { articles: [], fetchedAt: new Date().toISOString(), count: 0, lang };
  }
}

/**
 * Get cached search results (5 min TTL)
 */
export async function getCachedSearch(env, cacheKey) {
  const raw = await env.PHILOSIFY_KV.get(cacheKey);
  if (raw) return JSON.parse(raw);
  return null;
}

/**
 * Cache search results
 */
export async function cacheSearchResults(env, cacheKey, data) {
  await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(data), {
    expirationTtl: SEARCH_CACHE_TTL,
  });
}
