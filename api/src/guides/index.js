// ============================================================
// GUIDES - BARREL EXPORT
// ============================================================
// All AI models use the English guide (they are polyglot)
// The analysis output language is controlled by the prompt, not the guide

import {
  getGuide as loadGuide,
  getLiteGuide as loadLiteGuide,
  getWrapupSource as loadWrapupSource,
  getDebateAestheticGuide as loadDebateAestheticGuide,
} from "./loader.js";
import { getCachedGuide } from "./cache.js";

// Always load English guide regardless of requested language
export async function getGuide(env) {
  return getCachedGuide(env, "en", () => loadGuide(env));
}

// Load the LITE guide (always English) - used for quick preview analysis
export async function getLiteGuide(env) {
  return getCachedGuide(env, "en_lite", () => loadLiteGuide(env));
}

// Language parameter kept for API compatibility, but always loads English
export async function getGuideForLanguage(env, lang = "en") {
  // Always use English guide - AI models are polyglot
  return getCachedGuide(env, "en", () => loadGuide(env));
}

// Load wrap-up Source of Truth from KV (cached 1h)
export async function getWrapupSource(env) {
  return getCachedGuide(env, "wrapup_source", () => loadWrapupSource(env));
}

// Load debate aesthetic guide from KV with bundled fallback (cached 1h)
export async function getDebateAestheticGuide(env) {
  return getCachedGuide(env, "debate_aesthetic", () =>
    loadDebateAestheticGuide(env),
  );
}

export { clearGuideCache } from "./cache.js";
