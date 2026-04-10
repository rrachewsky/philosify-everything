// ============================================================
// INPUT VALIDATION
// ============================================================

// Valid AI models (expanded for reasoning models)
const VALID_MODELS = [
  "gpt4",
  "openai", // Legacy OpenAI
  "o1",
  "o1-mini",
  "o1-preview",
  "o3",
  "o3-mini", // OpenAI reasoning models
  "gemini", // Google Gemini (3.1 Flash)
  "claude",
  "anthropic", // Claude (Sonnet 4 with extended thinking)
  "grok", // Grok
  "deepseek",
  "deepseek-r1",
  "deepseek-reasoner", // DeepSeek R1 reasoning
];

// Valid languages (18 supported - must match frontend i18n/config.js)
const VALID_LANGUAGES = [
  "en",
  "pt",
  "es",
  "fr",
  "de",
  "it",
  "ru",
  "hu",
  "he",
  "zh",
  "ja",
  "ko",
  "ar",
  "hi",
  "fa",
  "nl",
  "pl",
  "tr",
];

/**
 * UUID v4 regex for parameter validation
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates a UUID string
 * @param {string} value - String to validate
 * @returns {boolean} - True if valid UUID
 */
export function isValidUUID(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Validates song and artist input
 * @param {string} song - Song title
 * @param {string} artist - Artist name
 * @returns {Object} - Sanitized song and artist
 * @throws {Error} - If validation fails
 */
export function validateSongInput(song, artist) {
  // Type validation
  if (!song || typeof song !== "string") {
    throw new Error("Song name is required and must be a string");
  }

  if (artist && typeof artist !== "string") {
    throw new Error("Artist name must be a string");
  }

  // Length validation
  if (song.length < 1) {
    throw new Error("Song name cannot be empty");
  }

  if (song.length > 200) {
    throw new Error("Song name too long (maximum 200 characters)");
  }

  if (artist && artist.length > 200) {
    throw new Error("Artist name too long (maximum 200 characters)");
  }

  // Control character validation (block null bytes, control chars, etc.)
  const dangerousChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
  if (dangerousChars.test(song)) {
    throw new Error("Song name contains invalid control characters");
  }
  if (artist && dangerousChars.test(artist)) {
    throw new Error("Artist name contains invalid control characters");
  }

  // Remove potentially dangerous characters (XSS prevention)
  const cleanString = (str) => str.replace(/[<>{}]/g, "").trim();

  return {
    song: cleanString(song),
    artist: artist ? cleanString(artist) : "",
  };
}

/**
 * Validates AI model selection
 * @param {string} model - AI model identifier
 * @returns {string} - Validated model (or default)
 */
export function validateModel(model) {
  if (!model || typeof model !== "string") {
    return "claude"; // Default model
  }

  const normalizedModel = model.toLowerCase().trim();

  if (!VALID_MODELS.includes(normalizedModel)) {
    throw new Error(
      `Invalid model "${model}". Must be one of: ${VALID_MODELS.join(", ")}`,
    );
  }

  return normalizedModel;
}

/**
 * Validates language selection
 * @param {string} lang - Language code
 * @returns {string} - Validated language (or default)
 */
export function validateLanguage(lang) {
  if (!lang || typeof lang !== "string") {
    return "en"; // Default language
  }

  const normalizedLang = lang.toLowerCase().trim();

  if (!VALID_LANGUAGES.includes(normalizedLang)) {
    throw new Error(
      `Invalid language "${lang}". Must be one of: ${VALID_LANGUAGES.join(", ")}`,
    );
  }

  return normalizedLang;
}

/**
 * Checks if a language code is valid without throwing
 * @param {string} lang - Language code
 * @returns {boolean} - True if valid
 */
export function isValidLanguage(lang) {
  if (!lang || typeof lang !== 'string') return false;
  return VALID_LANGUAGES.includes(lang.toLowerCase().trim().split('-')[0]);
}

/**
 * Safely parse JSON from a Request object.
 * Returns null instead of throwing on invalid JSON.
 * @param {Request} request - Incoming request
 * @returns {Promise<Object|null>} - Parsed body or null
 */
export async function safeJsonParse(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
