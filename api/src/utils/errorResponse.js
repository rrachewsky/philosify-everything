// ============================================================
// CENTRALIZED ERROR RESPONSE HELPER
// ============================================================
// MANDATORY i18n error responses - prevents hardcoded English strings
// Usage: return errorResponse(env, origin, 'INSUFFICIENT_CREDITS', lang, { needed: 1 });

import { jsonResponse } from "./index.js";
import { getLocalizedError } from "./i18n-errors.js";

/**
 * Create a localized error response (RECOMMENDED - enforces i18n)
 * @param {object} env - Worker environment
 * @param {string} origin - Request origin for CORS
 * @param {string} errorKey - Error key from i18n-errors.js
 * @param {string} lang - Language code (ISO 639-1)
 * @param {object} additionalData - Extra fields to include (e.g., { needed: 1, balance: 0 })
 * @param {number} statusCode - HTTP status code (default: inferred from error type)
 * @returns {Response} JSON response with localized error
 */
export function errorResponse(env, origin, errorKey, lang = 'en', additionalData = {}, statusCode = null) {
  const localizedMessage = getLocalizedError(errorKey, lang);
  
  // Infer status code from error key if not provided
  const code = statusCode || getStatusCodeFromErrorKey(errorKey);
  
  return jsonResponse(
    {
      error: localizedMessage,
      code: errorKey,
      ...additionalData,
    },
    code,
    origin,
    env
  );
}

/**
 * Infer HTTP status code from error key
 */
function getStatusCodeFromErrorKey(errorKey) {
  const statusMap = {
    // 400 - Bad Request
    INVALID_INPUT: 400,
    INVALID_JSON: 400,
    MISSING_REQUIRED_FIELD: 400,
    INPUT_TOO_LONG: 400,
    INVALID_CURSOR: 400,
    INVALID_ID: 400,
    CHAT_MESSAGE_EMPTY: 400,
    CHAT_MESSAGE_TOO_LONG: 400,
    CHAT_LINKS_NOT_ALLOWED: 400,
    CHAT_INVALID_CURSOR: 400,
    CHAT_REPLY_INVALID_ID: 400,
    CHAT_REPLY_NOT_FOUND: 400,
    CHAT_INVALID_MESSAGE_ID: 400,
    MISSING_PUSH_FIELDS: 400,
    INVALID_ENDPOINT_URL: 400,
    UNTRUSTED_PUSH_ENDPOINT: 400,
    MISSING_ENDPOINT: 400,
    NO_VALID_PREFERENCES: 400,
    INVALID_USER_ID: 400,
    INVALID_IDS_ARRAY: 400,
    INVALID_NOTIFICATION_ID: 400,
    
    // 401 - Unauthorized
    UNAUTHORIZED: 401,
    AUTHENTICATION_REQUIRED: 401,
    TOKEN_EXPIRED: 401,
    
    // 402 - Payment Required
    INSUFFICIENT_CREDITS: 402,
    
    // 403 - Forbidden
    FORBIDDEN: 403,
    ACCESS_DENIED: 403,
    CHAT_DELETE_OWN_ONLY: 403,
    CHAT_EDIT_OWN_ONLY: 403,
    
    // 404 - Not Found
    NOT_FOUND: 404,
    ANALYSIS_NOT_FOUND: 404,
    MESSAGE_NOT_FOUND: 404,
    BOOK_NOT_FOUND: 404,
    FILM_NOT_FOUND: 404,
    LYRICS_NOT_FOUND: 404,
    CHAT_MESSAGE_NOT_FOUND: 404,
    SUBSCRIPTION_NOT_FOUND: 404,
    
    // 405 - Method Not Allowed
    METHOD_NOT_ALLOWED: 405,
    
    // 429 - Too Many Requests
    RATE_LIMIT_EXCEEDED: 429,
    TOO_MANY_REQUESTS: 429,
    CHAT_RATE_LIMIT: 429,
    
    // 500 - Internal Server Error
    INTERNAL_ERROR: 500,
    ANALYSIS_FAILED: 500,
    DATABASE_ERROR: 500,
    GUIDE_NOT_LOADED: 500,
    CHAT_LOAD_FAILED: 500,
    CHAT_SEND_FAILED: 500,
    CHAT_DELETE_FAILED: 500,
    CHAT_EDIT_FAILED: 500,
    PUSH_NOT_CONFIGURED: 500,
    SERVER_CONFIG_ERROR: 500,
    SAVE_SUBSCRIPTION_FAILED: 500,
    REMOVE_SUBSCRIPTION_FAILED: 500,
    LOAD_PREFERENCES_FAILED: 500,
    UPDATE_PREFERENCES_FAILED: 500,
    FETCH_NOTIFICATIONS_FAILED: 500,
    ACK_FAILED: 500,
    
    // News errors
    NEWS_TRANSLATION_FAILED: 500,
    NEWS_TITLE_REQUIRED: 400,
    NEWS_TITLE_TOO_LONG: 400,
    NEWS_DESCRIPTION_TOO_LONG: 400,
    NEWS_SERVICE_UNAVAILABLE: 503,
    NEWS_QUERY_REQUIRED: 400,
    NEWS_QUERY_TOO_LONG: 400,
    NEWS_INVALID_LANGUAGE: 400,
    NEWS_SEARCH_FAILED: 500,
    NEWS_BREAKING_FETCH_FAILED: 500,
    NEWS_TEXT_REQUIRED: 400,
    NEWS_TEXT_TOO_LONG: 400,
    NEWS_TTS_FAILED: 500,
    
    // 503 - Service Unavailable
    SERVICE_UNAVAILABLE: 503,
    NETWORK_ERROR: 503,
    
    // 504 - Gateway Timeout
    TIMEOUT: 504,
    AI_TIMEOUT: 504,
  };
  
  return statusMap[errorKey] || 500; // Default to 500 if unknown
}

/**
 * Legacy wrapper for quick migration (allows raw English string + lang)
 * @deprecated Use errorResponse() with error keys instead
 */
export function localizedErrorResponse(env, origin, englishMessage, lang = 'en', statusCode = 500, additionalData = {}) {
  console.warn(`[errorResponse] Using legacy localizedErrorResponse with raw string: "${englishMessage}". Migrate to errorResponse() with error keys.`);
  
  // Try to map common English messages to error keys
  const errorKey = mapEnglishToErrorKey(englishMessage);
  
  if (errorKey) {
    return errorResponse(env, origin, errorKey, lang, additionalData, statusCode);
  }
  
  // Fallback - return as-is (NOT localized, but better than breaking)
  return jsonResponse(
    {
      error: englishMessage,
      ...additionalData,
    },
    statusCode,
    origin,
    env
  );
}

/**
 * Map common English error messages to error keys (for legacy migration)
 */
function mapEnglishToErrorKey(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes('insufficient credit')) return 'INSUFFICIENT_CREDITS';
  if (lowerMsg.includes('authentication required') || lowerMsg.includes('unauthorized')) return 'UNAUTHORIZED';
  if (lowerMsg.includes('not found')) return 'NOT_FOUND';
  if (lowerMsg.includes('invalid input') || lowerMsg.includes('invalid json')) return 'INVALID_INPUT';
  if (lowerMsg.includes('too many requests') || lowerMsg.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED';
  if (lowerMsg.includes('analysis failed')) return 'ANALYSIS_FAILED';
  if (lowerMsg.includes('guide not loaded')) return 'GUIDE_NOT_LOADED';
  if (lowerMsg.includes('method not allowed')) return 'METHOD_NOT_ALLOWED';
  if (lowerMsg.includes('forbidden') || lowerMsg.includes('access denied')) return 'FORBIDDEN';
  
  return null; // Can't map - return raw string
}
