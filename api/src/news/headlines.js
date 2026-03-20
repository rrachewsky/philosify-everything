// ============================================================
// NEWS - HEADLINES FETCHER (GNews API)
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
// - Fetch world, business, science, technology, nation topics
// - Filter blocked sources (tabloids, propaganda, clickbait)
// - Filter blocked words (sports, gossip, trivial)
// - Prioritize quality sources (Reuters, WSJ, Economist, etc.)
// - Score articles by philosophical keywords
// - Sort by: source priority → philosophical relevance → date
//
// API BUDGET: Free tier = 100 requests/day
// - 5 topics per language refresh, cached 2h
// - Highlights: 1 search/4h per language
// - English cron refresh hourly; other languages on-demand + cached
// ============================================================

import { getSecret } from "../utils/secrets.js";

const KV_KEY_HEADLINES = "news:v3:headlines";
const KV_KEY_HIGHLIGHTS = "news:v3:highlights";
const CACHE_TTL_SECONDS = 15 * 60; // 15 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const HIGHLIGHTS_STALE_MS = 4 * 60 * 60 * 1000; // 4 hours

// International topics (NO sports) — includes science/tech for magazine-quality content
const INTL_TOPICS = ["world", "business", "science", "technology"];

// GNews supported languages
const GNEWS_LANGS = ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "zh", "ar", "he", "ja", "ko", "tr", "pl", "hu", "hi", "fa"];

// ============================================================
// HIGHLIGHT SEARCH QUERIES — translated per language
// ============================================================
// Each query is tuned for GNews search in the corresponding language.
// GNews filters by article language, so search terms must match.
// ============================================================
const HIGHLIGHT_QUERIES = {
  en: "innovation breakthrough OR startup success OR scientific discovery OR hero rescue OR freedom victory OR justice served OR entrepreneur achievement",
  pt: "inovação avanço OR startup sucesso OR descoberta científica OR herói resgate OR vitória liberdade OR justiça feita OR empreendedor conquista",
  es: "innovación avance OR startup éxito OR descubrimiento científico OR héroe rescate OR victoria libertad OR justicia hecha OR emprendedor logro",
  fr: "innovation percée OR startup succès OR découverte scientifique OR héros sauvetage OR victoire liberté OR justice rendue OR entrepreneur réussite",
  de: "Innovation Durchbruch OR Startup Erfolg OR wissenschaftliche Entdeckung OR Held Rettung OR Freiheit Sieg OR Gerechtigkeit OR Unternehmer Erfolg",
  it: "innovazione svolta OR startup successo OR scoperta scientifica OR eroe salvataggio OR vittoria libertà OR giustizia fatta OR imprenditore successo",
  nl: "innovatie doorbraak OR startup succes OR wetenschappelijke ontdekking OR held redding OR vrijheid overwinning OR gerechtigheid OR ondernemer succes",
  ru: "инновация прорыв OR стартап успех OR научное открытие OR герой спасение OR победа свобода OR справедливость OR предприниматель достижение",
  zh: "创新突破 OR 创业成功 OR 科学发现 OR 英雄救援 OR 自由胜利 OR 正义 OR 企业家成就",
  ar: "ابتكار اختراق OR نجاح شركة ناشئة OR اكتشاف علمي OR بطل إنقاذ OR انتصار الحرية OR العدالة OR رائد أعمال",
  he: "חדשנות פריצת דרך OR הצלחה סטארטאפ OR גילוי מדעי OR גיבור הצלה OR ניצחון חופש OR צדק OR יזם הישג",
  ja: "イノベーション突破 OR スタートアップ成功 OR 科学的発見 OR 英雄救出 OR 自由の勝利 OR 正義 OR 起業家の成功",
  ko: "혁신 돌파구 OR 스타트업 성공 OR 과학적 발견 OR 영웅 구조 OR 자유 승리 OR 정의 실현 OR 기업가 성취",
  tr: "inovasyon atılım OR startup başarı OR bilimsel keşif OR kahraman kurtarma OR özgürlük zaferi OR adalet OR girişimci başarı",
  pl: "innowacja przełom OR startup sukces OR odkrycie naukowe OR bohater ratunek OR zwycięstwo wolności OR sprawiedliwość OR przedsiębiorca sukces",
  hu: "innováció áttörés OR startup siker OR tudományos felfedezés OR hős mentés OR szabadság győzelem OR igazságszolgáltatás OR vállalkozó siker",
};

// ============================================================
// PHILOSOPHICAL KEYWORDS — prioritize meaningful content
// ============================================================
// Articles containing these keywords are scored higher and sorted first.
// This ensures philosophically significant news rises to the top.
// ============================================================
const PHILOSOPHICAL_KEYWORDS = [
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
// Everything NOT in this blacklist is allowed (if it passes content filter).
// This is more robust than a whitelist because GNews source names vary.
// ============================================================
const BLOCKED_SOURCES = [
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
// Articles from these sources get priority in the feed.
// Tier 1: Wire services & top quality (highest priority)
// Tier 2: Quality newspapers & magazines (high priority)
// ============================================================
const PRIORITY_SOURCES_TIER1 = [
  // Wire Services (most reliable for facts)
  "reuters", "associated press", "ap news", "afp", "agence france",
  // Top Quality International
  "the economist", "wall street journal", "wsj", "financial times",
  "bloomberg",
];

const PRIORITY_SOURCES_TIER2 = [
  // US Quality
  "reason", "reason magazine", "national review", "the free press",
  "free press", "city journal", "foreign affairs", "quillette",
  // UK / Europe
  "the telegraph", "telegraph", "the times", "the spectator", "spectator",
  "neue zürcher", "nzz", "die welt", "le figaro",
  // Israel / Middle East
  "times of israel", "jerusalem post", "i24 news", "i24news",
  // Brazil / Latin America
  "gazeta do povo", "crusoé", "crusoe", "piauí", "piaui",
  "poder360", "jovem pan", "o antagonista", "antagonista",
  // Tech / Science / Business
  "techcrunch", "tech crunch", "wired", "ars technica", "arstechnica",
  "mit technology review", "nature", "scientific american",
  "forbes", "fortune", "cnbc",
];

// ============================================================
// CONTENT FILTER — removes inappropriate/trivial articles
// ============================================================
const BLOCKED_WORDS = [
  // Sports (trivial scores, not philosophically significant)
  "nfl", "nba", "fifa", "premier league", "champions league", "world cup",
  "touchdown", "goalkeeper", "quarterback", "soccer", "football match",
  "baseball", "basketball", "tennis", "cricket", "rugby", "boxing",
  "olympics", "medal count", "playoff", "super bowl", "stanley cup",
  "grand slam", "hole in one", "hat trick",
  // Lottery & Gambling
  "lottery", "jackpot", "powerball", "mega millions", "lotto",
  "winning numbers", "scratch ticket", "casino", "slot machine",
  "betting odds", "sportsbook",
  // Astrology & Superstition
  "horoscope", "zodiac", "astrology", "fortune teller", "psychic reading",
  "tarot", "numerology",
  // Weather (trivial forecasts)
  "weather forecast", "storm warning", "hurricane watch", "cold front",
  "heat wave warning", "flood watch", "tornado warning",
  // Daily Market Noise (not policy-related)
  "stock closes", "dow jones", "s&p 500", "market recap", "trading day",
  "futures rise", "futures fall", "nasdaq closes",
  // Traffic & Local Trivial
  "traffic jam", "road closure", "commute time", "parking ticket",
  // Fashion & Entertainment
  "best dressed", "fashion week", "red carpet", "award show outfit",
  "grammy", "oscar", "emmy", "golden globe", "mtv awards",
  "met gala", "runway", "designer collection",
  // Viral / Memes / Trivial Internet
  "viral video", "tiktok trend", "meme", "goes viral", "internet breaks",
  "trending on", "challenge goes viral",
  // Depravation / inappropriate
  "porn", "xxx", "nude", "naked", "sex tape", "prostitut",
  "rape", "molest", "pedophil", "incest",
  // Excessive violence / gore
  "dismember", "decapitat", "torture video", "execution video",
  // Tabloid / gossip
  "kardashian", "reality tv", "celebrity gossip", "onlyfans",
  "dating rumor", "breakup", "divorce filing", "baby bump",
];

function isCleanArticle(article) {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();
  return !BLOCKED_WORDS.some((word) => text.includes(word));
}

/**
 * Score article by philosophical relevance (higher = more relevant).
 * Used for sorting priority, not filtering.
 */
function getPhilosophicalScore(article) {
  const text = `${article.title} ${article.description || ""}`.toLowerCase();
  let score = 0;
  for (const keyword of PHILOSOPHICAL_KEYWORDS) {
    if (text.includes(keyword)) score += 1;
  }
  return score;
}

/**
 * Score article by source quality (higher = more trusted).
 * Tier 1 sources (wire services, top quality) = 10 points
 * Tier 2 sources (quality journalism) = 5 points
 * Other sources = 0 points
 */
function getSourcePriorityScore(article) {
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

/**
 * Check if article is from a blocked source.
 */
function isBlockedSource(sourceName) {
  const name = (sourceName || "").toLowerCase().trim();
  if (!name) return true; // no source = blocked
  return BLOCKED_SOURCES.some((s) => name.includes(s) || s.includes(name));
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
  if (!data.articles || data.articles.length === 0) {
    console.warn(`[News] GNews returned 0 articles for topic="${topic}" lang="${lang}". Possible quota exceeded.`);
  }
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

/**
 * Deduplicate articles — removes exact title matches AND fuzzy matches
 * (same story from different languages with slightly different titles).
 * Uses normalized keywords to catch "Trump signs order" vs "Trump assina decreto".
 */
function deduplicateArticles(articles) {
  const seen = new Set();
  const seenFuzzy = new Set();
  return articles.filter((article) => {
    // Exact match on full title
    const exactKey = article.title.toLowerCase().trim();
    if (seen.has(exactKey)) return false;
    seen.add(exactKey);

    // Fuzzy match: extract significant words (4+ chars), sort, take first 5
    // This catches the same story reported in different languages
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

// ============================================================
// MAIN FETCHERS
// ============================================================

/**
 * Fetch headlines from ALL GNews-supported languages for the "world" topic,
 * giving truly global coverage (5 continents, all major source regions).
 * Also fetches all topics in the user's language for local depth.
 *
 * This ensures sources from China, Israel, Iran, Brazil, Japan, Germany,
 * Russia, Korea, etc. all appear regardless of the user's interface language.
 * The AI summarizer and analysis translate content to the user's language.
 */
export async function fetchAllHeadlines(env, lang = "en") {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) throw new Error("GNEWS_API_KEY not configured");

  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";

  console.log(`[News] API key starts with: ${apiKey.substring(0, 6)}...`);
  console.log(`[News] Fetching GLOBAL headlines: "world" from ${GNEWS_LANGS.length} languages + all topics in "${gnewsLang}"`);

  const promises = [];

  // 1. Fetch "world" topic from ALL supported languages — global coverage
  //    This pulls articles from sources in every region: WSJ (en), Xinhua (zh),
  //    Haaretz (he), Al Jazeera (ar), Le Monde (fr), Der Spiegel (de), etc.
  for (const fetchLang of GNEWS_LANGS) {
    promises.push(fetchTopicHeadlines(apiKey, "world", fetchLang, 10));
  }

  // 2. Fetch remaining topics in user's language for local depth
  const otherTopics = INTL_TOPICS.filter((t) => t !== "world");
  for (const topic of otherTopics) {
    promises.push(fetchTopicHeadlines(apiKey, topic, gnewsLang, 10));
  }

  // 3. National/local news in user's language
  promises.push(fetchTopicHeadlines(apiKey, "nation", gnewsLang, 10));

  console.log(`[News] ${promises.length} API calls in parallel...`);
  const results = await Promise.all(promises);
  const allArticles = deduplicateArticles(results.flat());
  console.log(`[News] ${allArticles.length} articles after dedup (from ${promises.length} fetches)`);

  // Apply source blacklist + content filter
  const notBlocked = allArticles.filter((a) => !isBlockedSource(a.source));
  const clean = notBlocked.filter(isCleanArticle);
  const sourceBlocked = allArticles.length - notBlocked.length;
  const contentFiltered = notBlocked.length - clean.length;
  if (sourceBlocked > 0) console.log(`[News] Blocked ${sourceBlocked} articles from unreliable sources`);
  if (contentFiltered > 0) console.log(`[News] Filtered ${contentFiltered} inappropriate articles`);

  // Sort by: 1) source priority, 2) philosophical relevance, 3) date
  clean.sort((a, b) => {
    const srcA = getSourcePriorityScore(a);
    const srcB = getSourcePriorityScore(b);
    if (srcB !== srcA) return srcB - srcA;
    const philA = getPhilosophicalScore(a);
    const philB = getPhilosophicalScore(b);
    if (philB !== philA) return philB - philA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const priorityCount = clean.filter(a => getSourcePriorityScore(a) > 0).length;
  console.log(`[News] ${clean.length} clean global headlines (${priorityCount} priority, ${sourceBlocked} blocked, ${contentFiltered} filtered)`);
  return clean;
}

/**
 * Fetch highlight articles (positive impact stories) in user's language.
 * Uses language-specific search queries so results are natively translated.
 */
export async function fetchHighlights(env, lang = "en") {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) throw new Error("GNEWS_API_KEY not configured");

  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";
  const query = HIGHLIGHT_QUERIES[gnewsLang] || HIGHLIGHT_QUERIES.en;

  console.log(`[News] Fetching highlights in "${gnewsLang}" (positive impact stories)...`);

  const articles = await fetchSearchArticles(apiKey, query, gnewsLang, 10);
  const clean = deduplicateArticles(articles)
    .filter((a) => !isBlockedSource(a.source))
    .filter(isCleanArticle);

  // Sort by: 1) source priority, 2) philosophical relevance, 3) date
  clean.sort((a, b) => {
    const srcA = getSourcePriorityScore(a);
    const srcB = getSourcePriorityScore(b);
    if (srcB !== srcA) return srcB - srcA;
    const philA = getPhilosophicalScore(a);
    const philB = getPhilosophicalScore(b);
    if (philB !== philA) return philB - philA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  console.log(`[News] ${clean.length} highlight articles`);
  return clean;
}

// ============================================================
// AI SUMMARIZER — ~40-word summary per article via Gemini Flash
// ============================================================

async function summarizeArticles(articles, lang, env) {
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
      // Keep original title in a separate field for reference
      originalTitle: a.title,
      // Replace title with translated version
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

export async function refreshHeadlines(env, lang = "en") {
  try {
    let articles = await fetchAllHeadlines(env, lang);
    articles = await summarizeArticles(articles, lang, env);
    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      lang,
    };

    // Never cache empty results — they indicate API errors or quota issues
    if (articles.length > 0) {
      const kvKey = lang === "en" ? KV_KEY_HEADLINES : `${KV_KEY_HEADLINES}:${lang}`;
      await env.PHILOSIFY_KV.put(kvKey, JSON.stringify(cached), {
        expirationTtl: CACHE_TTL_SECONDS,
      });
      console.log(`[News] Cached ${articles.length} headlines (${lang})`);
    } else {
      console.warn(`[News] NOT caching empty headlines (${lang}) — possible API issue`);
    }

    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh headlines (${lang}): ${err.message}`);
    throw err;
  }
}

export async function refreshHighlights(env, lang = "en") {
  try {
    const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";
    let articles = await fetchHighlights(env, gnewsLang);
    articles = await summarizeArticles(articles, gnewsLang, env);
    const cached = {
      articles,
      fetchedAt: new Date().toISOString(),
      count: articles.length,
      lang: gnewsLang,
    };

    if (articles.length > 0) {
      const kvKey = gnewsLang === "en" ? KV_KEY_HIGHLIGHTS : `${KV_KEY_HIGHLIGHTS}:${gnewsLang}`;
      await env.PHILOSIFY_KV.put(kvKey, JSON.stringify(cached), {
        expirationTtl: CACHE_TTL_SECONDS * 2,
      });
      console.log(`[News] Cached ${articles.length} highlights (${gnewsLang})`);
    } else {
      console.warn(`[News] NOT caching empty highlights (${gnewsLang}) — possible API issue`);
    }

    return cached;
  } catch (err) {
    console.error(`[News] Failed to refresh highlights (${lang}): ${err.message}`);
    throw err;
  }
}

/**
 * Get cached headlines. If stale, refresh in background.
 * @param {string} lang - User language for local news mix
 */
export async function getCachedHeadlines(env, ctx = null, lang = "en") {
  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";
  // Language-specific cache keys for both headlines and highlights
  const headlinesKey = gnewsLang === "en" ? KV_KEY_HEADLINES : `${KV_KEY_HEADLINES}:${gnewsLang}`;
  const highlightsKey = gnewsLang === "en" ? KV_KEY_HIGHLIGHTS : `${KV_KEY_HIGHLIGHTS}:${gnewsLang}`;

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
      ctx.waitUntil(refreshHighlights(env, gnewsLang).catch((e) =>
        console.error(`[News] Background highlights refresh failed:`, e.message)
      ));
    }
  } else {
    try {
      highlights = await refreshHighlights(env, gnewsLang);
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
