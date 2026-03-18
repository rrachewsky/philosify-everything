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
// - Score articles by philosophical keywords
// - Sort by philosophical relevance, then by date
//
// API BUDGET: Free tier = 100 requests/day
// - 5 topics per language refresh, cached 2h
// - Highlights: 1 search/4h per language
// - English cron refresh hourly; other languages on-demand + cached
// ============================================================

import { getSecret } from "../utils/secrets.js";

const KV_KEY_HEADLINES = "news:v3:headlines";
const KV_KEY_HIGHLIGHTS = "news:v3:highlights";
const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const HIGHLIGHTS_STALE_MS = 4 * 60 * 60 * 1000; // 4 hours

// International topics (NO sports) — includes science/tech for magazine-quality content
const INTL_TOPICS = ["world", "business", "science", "technology"];

// GNews supported languages
const GNEWS_LANGS = ["en", "pt", "es", "fr", "de", "it", "nl", "ru", "zh", "ar", "he", "ja", "ko", "tr", "pl", "hu"];

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
 * Fetch headlines in user's language — ALL topics + national/local.
 * International topics (world, business, science, technology) are fetched
 * in the user's language so sources naturally publish in that language.
 * National topic adds local source diversity (local newspapers/magazines).
 * This ensures all headlines are natively in the user's language.
 */
export async function fetchAllHeadlines(env, lang = "en") {
  const apiKey = await getSecret(env.GNEWS_API_KEY);
  if (!apiKey) throw new Error("GNEWS_API_KEY not configured");

  const gnewsLang = GNEWS_LANGS.includes(lang) ? lang : "en";

  // Debug: log key prefix to verify correct key is loaded
  console.log(`[News] API key starts with: ${apiKey.substring(0, 6)}...`);
  console.log(`[News] Fetching all topics in "${gnewsLang}" (international + local mix)`);

  // Fetch ALL topics in user's language for natural translation
  // This returns a mix of international coverage + local sources publishing in that language
  const topicPromises = INTL_TOPICS.map((topic) =>
    fetchTopicHeadlines(apiKey, topic, gnewsLang, 10)
  );

  // Always include national/local news for local source diversity
  // (local newspapers, agencies, magazines alongside major outlets)
  topicPromises.push(fetchTopicHeadlines(apiKey, "nation", gnewsLang, 10));

  const results = await Promise.all(topicPromises);
  const allArticles = deduplicateArticles(results.flat());

  // Apply source blacklist + content filter
  const notBlocked = allArticles.filter((a) => !isBlockedSource(a.source));
  const clean = notBlocked.filter(isCleanArticle);
  const sourceBlocked = allArticles.length - notBlocked.length;
  const contentFiltered = notBlocked.length - clean.length;
  if (sourceBlocked > 0) console.log(`[News] Blocked ${sourceBlocked} articles from unreliable sources`);
  if (contentFiltered > 0) console.log(`[News] Filtered ${contentFiltered} inappropriate articles`);

  // Sort by philosophical relevance first, then by date (newest first)
  clean.sort((a, b) => {
    const scoreA = getPhilosophicalScore(a);
    const scoreB = getPhilosophicalScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  console.log(`[News] ${clean.length} clean headlines (${allArticles.length} total, ${sourceBlocked} source-blocked, ${contentFiltered} content-filtered)`);
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

  // Sort by philosophical relevance first, then by date (newest first)
  clean.sort((a, b) => {
    const scoreA = getPhilosophicalScore(a);
    const scoreB = getPhilosophicalScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
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

  const prompt = `You are a news editor. For each article below, write a concise summary of approximately 40 words.
Write ALL summaries in the language with ISO code "${lang}".
Return ONLY a valid JSON array: [{"id":0,"summary":"..."},{"id":1,"summary":"..."},...]
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
        generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
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
    for (const s of summaries) map[s.id] = s.summary;

    console.log(`[News] Generated ${summaries.length} AI summaries (${lang})`);
    return articles.map((a, i) => ({ ...a, aiSummary: map[i] || a.description || "" }));
  } catch (err) {
    console.error(`[News] AI summary failed (${lang}): ${err.message}`);
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
