// ============================================================
// GUIDES - IN-MEMORY CACHING
// ============================================================

const GUIDE_CACHE_TTL = 3600000; // 1 hour in ms
let GUIDE_CACHE = {}; // Cache by language: { 'guide_en': { txt, ts }, 'guide_pt': { txt, ts } }

// Get cached guide or load from KV
export async function getCachedGuide(env, lang = 'en', loaderFn) {
  const now = Date.now();
  const cacheKey = `guide_${lang}`;

  // Check cache
  if (GUIDE_CACHE[cacheKey] && (now - GUIDE_CACHE[cacheKey].ts < GUIDE_CACHE_TTL)) {
    console.log(`[Guide] Using cached guide for ${lang}`);
    return GUIDE_CACHE[cacheKey].txt;
  }

  // Load from KV using provided loader function
  const txt = await loaderFn();

  // Update cache
  GUIDE_CACHE[cacheKey] = { txt, ts: now };

  return txt;
}

// Clear cache (useful for testing)
export function clearGuideCache() {
  GUIDE_CACHE = {};
}
