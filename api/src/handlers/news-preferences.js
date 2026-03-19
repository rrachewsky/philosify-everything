// ============================================================
// HANDLER - USER NEWS PREFERENCES
// ============================================================
// Allows users to customize news sources (costs 1 credit to unlock).
// Default users see pre-selected quality outlets.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { reserveCredit, confirmReservation, releaseReservation } from "../credits/index.js";
import { getSupabaseCredentials } from "../utils/supabase.js";

// ============================================================
// AVAILABLE NEWS SOURCES - Preset list for user selection
// ============================================================
// Organized by category for the frontend UI.
// Keys must match source names returned by GNews API (lowercase comparison).
// ============================================================

export const NEWS_SOURCES = {
  wire_services: {
    label: "Wire Services",
    sources: [
      { id: "reuters", name: "Reuters" },
      { id: "associated-press", name: "Associated Press" },
      { id: "afp", name: "AFP" },
      { id: "efe", name: "EFE" },
      { id: "dpa", name: "DPA" },
      { id: "ansa", name: "ANSA" },
      { id: "xinhua", name: "Xinhua" },
      { id: "tass", name: "TASS" },
      { id: "kyodo", name: "Kyodo News" },
      { id: "yonhap", name: "Yonhap" },
      { id: "pti", name: "Press Trust of India" },
    ],
  },
  business_finance: {
    label: "Business & Finance",
    sources: [
      { id: "wall-street-journal", name: "Wall Street Journal" },
      { id: "bloomberg", name: "Bloomberg" },
      { id: "financial-times", name: "Financial Times" },
      { id: "the-economist", name: "The Economist" },
      { id: "forbes", name: "Forbes" },
      { id: "cnbc", name: "CNBC" },
      { id: "fortune", name: "Fortune" },
      { id: "barrons", name: "Barron's" },
      { id: "marketwatch", name: "MarketWatch" },
      { id: "business-insider", name: "Business Insider" },
      { id: "investors-business-daily", name: "Investor's Business Daily" },
      { id: "nikkei", name: "Nikkei Asia" },
      { id: "handelsblatt", name: "Handelsblatt" },
      { id: "les-echos", name: "Les Echos" },
      { id: "il-sole-24-ore", name: "Il Sole 24 Ore" },
      { id: "valor-economico", name: "Valor Econômico" },
      { id: "infomoney", name: "InfoMoney" },
      { id: "expansion", name: "Expansión" },
      { id: "cinco-dias", name: "Cinco Días" },
    ],
  },
  quality_news: {
    label: "Quality News",
    sources: [
      { id: "the-telegraph", name: "The Telegraph" },
      { id: "the-times", name: "The Times" },
      { id: "the-spectator", name: "The Spectator" },
      { id: "the-guardian", name: "The Guardian" },
      { id: "bbc", name: "BBC" },
      { id: "sky-news", name: "Sky News" },
      { id: "abc-news", name: "ABC News" },
      { id: "cbs-news", name: "CBS News" },
      { id: "nbc-news", name: "NBC News" },
      { id: "npr", name: "NPR" },
      { id: "pbs", name: "PBS NewsHour" },
      { id: "new-york-times", name: "New York Times" },
      { id: "washington-post", name: "Washington Post" },
      { id: "la-times", name: "Los Angeles Times" },
      { id: "chicago-tribune", name: "Chicago Tribune" },
      { id: "usa-today", name: "USA Today" },
      { id: "politico", name: "Politico" },
      { id: "axios", name: "Axios" },
      { id: "the-hill", name: "The Hill" },
      { id: "ap-news", name: "AP News" },
    ],
  },
  tech_science: {
    label: "Tech & Science",
    sources: [
      { id: "techcrunch", name: "TechCrunch" },
      { id: "wired", name: "Wired" },
      { id: "ars-technica", name: "Ars Technica" },
      { id: "mit-technology-review", name: "MIT Technology Review" },
      { id: "nature", name: "Nature" },
      { id: "scientific-american", name: "Scientific American" },
      { id: "the-verge", name: "The Verge" },
      { id: "engadget", name: "Engadget" },
      { id: "cnet", name: "CNET" },
      { id: "zdnet", name: "ZDNet" },
      { id: "gizmodo", name: "Gizmodo" },
      { id: "mashable", name: "Mashable" },
      { id: "new-scientist", name: "New Scientist" },
      { id: "science", name: "Science Magazine" },
      { id: "ieee-spectrum", name: "IEEE Spectrum" },
      { id: "live-science", name: "Live Science" },
      { id: "space-com", name: "Space.com" },
      { id: "phys-org", name: "Phys.org" },
    ],
  },
  opinion_analysis: {
    label: "Opinion & Analysis",
    sources: [
      { id: "reason", name: "Reason" },
      { id: "national-review", name: "National Review" },
      { id: "the-free-press", name: "The Free Press" },
      { id: "city-journal", name: "City Journal" },
      { id: "quillette", name: "Quillette" },
      { id: "foreign-affairs", name: "Foreign Affairs" },
      { id: "the-atlantic", name: "The Atlantic" },
      { id: "the-new-yorker", name: "The New Yorker" },
      { id: "commentary", name: "Commentary" },
      { id: "the-weekly-standard", name: "The Weekly Standard" },
      { id: "american-spectator", name: "The American Spectator" },
      { id: "the-federalist", name: "The Federalist" },
      { id: "the-daily-wire", name: "The Daily Wire" },
      { id: "spiked", name: "Spiked" },
      { id: "unherd", name: "UnHerd" },
      { id: "tablet", name: "Tablet Magazine" },
    ],
  },
  europe: {
    label: "Europe",
    sources: [
      { id: "der-spiegel", name: "Der Spiegel" },
      { id: "faz", name: "Frankfurter Allgemeine" },
      { id: "suddeutsche", name: "Süddeutsche Zeitung" },
      { id: "die-welt", name: "Die Welt" },
      { id: "die-zeit", name: "Die Zeit" },
      { id: "le-monde", name: "Le Monde" },
      { id: "le-figaro", name: "Le Figaro" },
      { id: "liberation", name: "Libération" },
      { id: "el-pais", name: "El País" },
      { id: "el-mundo", name: "El Mundo" },
      { id: "abc-spain", name: "ABC (Spain)" },
      { id: "la-vanguardia", name: "La Vanguardia" },
      { id: "corriere-della-sera", name: "Corriere della Sera" },
      { id: "la-repubblica", name: "La Repubblica" },
      { id: "la-stampa", name: "La Stampa" },
      { id: "nrc", name: "NRC Handelsblad" },
      { id: "de-volkskrant", name: "De Volkskrant" },
      { id: "de-telegraaf", name: "De Telegraaf" },
      { id: "politiken", name: "Politiken" },
      { id: "aftenposten", name: "Aftenposten" },
      { id: "dagens-nyheter", name: "Dagens Nyheter" },
      { id: "rzeczpospolita", name: "Rzeczpospolita" },
      { id: "gazeta-wyborcza", name: "Gazeta Wyborcza" },
      { id: "irish-times", name: "The Irish Times" },
      { id: "rte", name: "RTÉ News" },
      { id: "swiss-info", name: "SWI swissinfo.ch" },
      { id: "neue-zurcher", name: "Neue Zürcher Zeitung" },
    ],
  },
  americas: {
    label: "Americas",
    sources: [
      { id: "globe-and-mail", name: "The Globe and Mail" },
      { id: "national-post", name: "National Post" },
      { id: "cbc", name: "CBC News" },
      { id: "toronto-star", name: "Toronto Star" },
      { id: "folha", name: "Folha de S.Paulo" },
      { id: "estadao", name: "O Estado de S.Paulo" },
      { id: "gazeta-do-povo", name: "Gazeta do Povo" },
      { id: "jovem-pan", name: "Jovem Pan" },
      { id: "o-antagonista", name: "O Antagonista" },
      { id: "uol", name: "UOL" },
      { id: "g1", name: "G1" },
      { id: "cnn-brasil", name: "CNN Brasil" },
      { id: "infobae", name: "Infobae" },
      { id: "clarin", name: "Clarín" },
      { id: "la-nacion-ar", name: "La Nación (AR)" },
      { id: "el-universal", name: "El Universal" },
      { id: "reforma", name: "Reforma" },
      { id: "el-mercurio", name: "El Mercurio" },
      { id: "el-comercio-pe", name: "El Comercio (Peru)" },
      { id: "el-tiempo", name: "El Tiempo (Colombia)" },
      { id: "miami-herald", name: "Miami Herald" },
    ],
  },
  asia_pacific: {
    label: "Asia & Pacific",
    sources: [
      { id: "scmp", name: "South China Morning Post" },
      { id: "japan-times", name: "The Japan Times" },
      { id: "asahi-shimbun", name: "Asahi Shimbun" },
      { id: "korea-herald", name: "The Korea Herald" },
      { id: "korea-times", name: "The Korea Times" },
      { id: "chosun", name: "Chosun Ilbo" },
      { id: "times-of-india", name: "Times of India" },
      { id: "hindustan-times", name: "Hindustan Times" },
      { id: "indian-express", name: "The Indian Express" },
      { id: "ndtv", name: "NDTV" },
      { id: "straits-times", name: "The Straits Times" },
      { id: "channel-news-asia", name: "Channel NewsAsia" },
      { id: "bangkok-post", name: "Bangkok Post" },
      { id: "jakarta-post", name: "The Jakarta Post" },
      { id: "vietnam-news", name: "Vietnam News" },
      { id: "philippine-star", name: "The Philippine Star" },
      { id: "abc-australia", name: "ABC Australia" },
      { id: "sydney-morning-herald", name: "Sydney Morning Herald" },
      { id: "the-age", name: "The Age" },
      { id: "nz-herald", name: "NZ Herald" },
      { id: "stuff-nz", name: "Stuff (NZ)" },
    ],
  },
  middle_east_africa: {
    label: "Middle East & Africa",
    sources: [
      { id: "times-of-israel", name: "Times of Israel" },
      { id: "jerusalem-post", name: "Jerusalem Post" },
      { id: "i24-news", name: "i24 News" },
      { id: "haaretz", name: "Haaretz" },
      { id: "ynet", name: "Ynet" },
      { id: "al-jazeera", name: "Al Jazeera" },
      { id: "al-arabiya", name: "Al Arabiya" },
      { id: "arab-news", name: "Arab News" },
      { id: "gulf-news", name: "Gulf News" },
      { id: "the-national-uae", name: "The National (UAE)" },
      { id: "daily-sabah", name: "Daily Sabah" },
      { id: "hurriyet", name: "Hürriyet Daily News" },
      { id: "daily-maverick", name: "Daily Maverick" },
      { id: "news24", name: "News24" },
      { id: "mail-guardian", name: "Mail & Guardian" },
      { id: "the-east-african", name: "The East African" },
      { id: "punch-nigeria", name: "Punch (Nigeria)" },
      { id: "daily-nation", name: "Daily Nation (Kenya)" },
    ],
  },
};

// Flat list of all source IDs for validation
export const ALL_SOURCE_IDS = Object.values(NEWS_SOURCES)
  .flatMap((cat) => cat.sources.map((s) => s.id));

// Default sources for non-paying users (quality curated feed)
export const DEFAULT_SOURCE_IDS = [
  "reuters",
  "associated-press",
  "afp",
  "wall-street-journal",
  "bloomberg",
  "the-economist",
  "financial-times",
  "techcrunch",
  "nature",
];

/**
 * GET /api/user/news-preferences
 * Returns user's news preferences and unlock status.
 */
export async function handleGetNewsPreferences(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);
    
    const res = await fetch(
      `${sbUrl}/rest/v1/user_news_preferences?user_id=eq.${user.userId}&select=*`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`);
    }

    const rows = await res.json();
    const prefs = rows[0] || null;

    return jsonResponse(
      {
        success: true,
        unlocked: prefs?.unlocked || false,
        enabledSources: prefs?.enabled_sources || null,
        defaultSources: DEFAULT_SOURCE_IDS,
        availableSources: NEWS_SOURCES,
      },
      200,
      origin,
      env
    );
  } catch (err) {
    console.error("[NewsPreferences] Get error:", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}

/**
 * POST /api/user/news-preferences/unlock
 * Unlocks custom source selection for 1 credit.
 */
export async function handleUnlockNewsPreferences(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);

    // Check if already unlocked
    const checkRes = await fetch(
      `${sbUrl}/rest/v1/user_news_preferences?user_id=eq.${user.userId}&select=unlocked`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );

    const existing = await checkRes.json();
    if (existing[0]?.unlocked) {
      return jsonResponse(
        { success: true, message: "Already unlocked", unlocked: true },
        200,
        origin,
        env
      );
    }

    // Reserve 1 credit
    const reservation = await reserveCredit(env, user.userId);
    if (!reservation.success) {
      return jsonResponse(
        { error: "Insufficient credits", code: "INSUFFICIENT_CREDITS" },
        402,
        origin,
        env
      );
    }

    try {
      // Upsert preferences with unlocked = true
      const upsertRes = await fetch(
        `${sbUrl}/rest/v1/user_news_preferences`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            user_id: user.userId,
            unlocked: true,
            unlocked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!upsertRes.ok) {
        throw new Error(`Failed to unlock: ${upsertRes.status}`);
      }

      // Confirm credit
      const confirm = await confirmReservation(
        env,
        reservation.reservationId,
        "News source customization unlock"
      );

      console.log(`[NewsPreferences] User ${user.userId} unlocked source customization`);

      return jsonResponse(
        {
          success: true,
          unlocked: true,
          credits: confirm?.credits ?? null,
          remaining: confirm?.newTotal ?? null,
        },
        200,
        origin,
        env
      );
    } catch (err) {
      // Release credit on failure
      await releaseReservation(env, reservation.reservationId, "failed");
      throw err;
    }
  } catch (err) {
    console.error("[NewsPreferences] Unlock error:", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}

/**
 * PUT /api/user/news-preferences
 * Updates user's enabled sources. Requires unlocked status.
 * Body: { sources: ["reuters", "bloomberg", ...] }
 */
export async function handleUpdateNewsPreferences(request, env, origin) {
  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Authentication required" }, 401, origin, env);
    }

    const body = await request.json();
    const { sources } = body;

    // Validate sources array
    if (!Array.isArray(sources)) {
      return jsonResponse({ error: "sources must be an array" }, 400, origin, env);
    }

    // Validate all source IDs exist
    const invalidSources = sources.filter((s) => !ALL_SOURCE_IDS.includes(s));
    if (invalidSources.length > 0) {
      return jsonResponse(
        { error: `Invalid sources: ${invalidSources.join(", ")}` },
        400,
        origin,
        env
      );
    }

    const { url: sbUrl, key: sbKey } = await getSupabaseCredentials(env);

    // Check if unlocked
    const checkRes = await fetch(
      `${sbUrl}/rest/v1/user_news_preferences?user_id=eq.${user.userId}&select=unlocked`,
      {
        headers: {
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
        },
      }
    );

    const existing = await checkRes.json();
    if (!existing[0]?.unlocked) {
      return jsonResponse(
        { error: "Source customization not unlocked. Pay 1 credit to unlock.", code: "NOT_UNLOCKED" },
        403,
        origin,
        env
      );
    }

    // Update sources
    const updateRes = await fetch(
      `${sbUrl}/rest/v1/user_news_preferences?user_id=eq.${user.userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: sbKey,
          Authorization: `Bearer ${sbKey}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          enabled_sources: sources,
          updated_at: new Date().toISOString(),
        }),
      }
    );

    if (!updateRes.ok) {
      throw new Error(`Failed to update: ${updateRes.status}`);
    }

    console.log(`[NewsPreferences] User ${user.userId} updated sources: ${sources.length} selected`);

    return jsonResponse(
      {
        success: true,
        enabledSources: sources,
      },
      200,
      origin,
      env
    );
  } catch (err) {
    console.error("[NewsPreferences] Update error:", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}
