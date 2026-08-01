// ============================================================
// PROMPTS - LANGUAGE NAMES (single source of truth)
// ============================================================
// Prompts must name the language, never hand the model a bare ISO code.
// "pt" alone does not distinguish Brazil from Portugal — pt-BR is precisely
// the distinguishing subtag — and a model given the naked code drifts to
// European Portuguese. Philosify's Portuguese is BRAZILIAN Portuguese, so the
// name carries it explicitly (ruling 31 Jul 2026).
//
// Must match the frontend's i18n/config.js locale list.

export const LANGUAGE_NAMES = {
  en: "English",
  pt: "Brazilian Portuguese",
  es: "Spanish",
  de: "German",
  fr: "French",
  it: "Italian",
  hu: "Hungarian",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  he: "Hebrew",
  ar: "Arabic",
  hi: "Hindi",
  fa: "Farsi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};

/**
 * Human-readable name for a language code, for use inside prompts.
 * Falls back to English rather than echoing an unknown code back at the model.
 */
export function languageName(lang) {
  if (!lang) return LANGUAGE_NAMES.en;
  const key = String(lang).toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_NAMES[key] || LANGUAGE_NAMES.en;
}
