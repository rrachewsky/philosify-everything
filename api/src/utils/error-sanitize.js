// ============================================================
// ERROR SANITIZATION
// ============================================================
// Prevents leaking internal error details to users.
// Strips API keys, internal URLs, SQL details, and stack traces.

// Patterns that indicate sensitive information
const SENSITIVE_PATTERNS = [
  // API keys and tokens
  /key[=:]\s*["']?[a-zA-Z0-9_-]{20,}/gi,
  /token[=:]\s*["']?[a-zA-Z0-9_-]{20,}/gi,
  /bearer\s+[a-zA-Z0-9_-]+/gi,
  /apikey[=:]\s*["']?[a-zA-Z0-9_-]+/gi,
  // Internal URLs
  /https?:\/\/[^/]*supabase[^/]*\.[^/]+/gi,
  /https?:\/\/[^/]*googleapis[^/]*\.[^/]+\/[^\s]*/gi,
  /https?:\/\/api\.openai\.com[^\s]*/gi,
  /https?:\/\/localhost[^\s]*/gi,
  /https?:\/\/127\.0\.0\.1[^\s]*/gi,
  // SQL/Database errors
  /SQLSTATE\[[^\]]+\]/gi,
  /pg_[a-z_]+/gi,
  /relation "[\w]+" does not exist/gi,
  // Stack traces
  /at\s+[\w.]+\s+\([^)]+:\d+:\d+\)/gi,
  /^\s+at\s+/gm,
  // File paths
  /\/home\/[\w/.-]+/gi,
  /C:\\[\w\\.-]+/gi,
  /node_modules\/[^\s]+/gi,
];

// Known safe error messages that can be passed through
const SAFE_ERROR_PREFIXES = [
  'Insufficient credits',
  'Rate limit',
  'Invalid',
  'Missing',
  'Unauthorized',
  'Forbidden',
  'Not found',
  'Too many',
  'Text too short',
  'Title required',
  'Content required',
];

/**
 * Sanitize an error message for safe client exposure
 * @param {string} message - Raw error message
 * @param {string} fallback - Fallback message if sanitization removes all content
 * @returns {string} - Safe error message
 */
export function sanitizeErrorMessage(message, fallback = 'An error occurred') {
  if (!message || typeof message !== 'string') {
    return fallback;
  }

  // Check if this is a known safe error type
  for (const prefix of SAFE_ERROR_PREFIXES) {
    if (message.toLowerCase().startsWith(prefix.toLowerCase())) {
      // Still sanitize URLs/keys even in "safe" messages
      let sanitized = message;
      for (const pattern of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[redacted]');
      }
      return sanitized.substring(0, 200); // Limit length
    }
  }

  // For unknown errors, check for sensitive patterns
  let sanitized = message;
  let hasSensitiveContent = false;

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(sanitized)) {
      hasSensitiveContent = true;
      sanitized = sanitized.replace(pattern, '[redacted]');
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
  }

  // If we found sensitive content, return a generic message
  if (hasSensitiveContent) {
    console.warn('[Security] Sanitized sensitive error content');
    return fallback;
  }

  // Limit message length and remove newlines (potential stack traces)
  sanitized = sanitized.split('\n')[0].trim().substring(0, 200);

  // If the message is too short after sanitization, use fallback
  if (sanitized.length < 3) {
    return fallback;
  }

  return sanitized;
}

/**
 * Create a safe error response object
 * @param {Error|string} error - Error or error message
 * @param {string} context - Context for the error (e.g., 'analysis', 'tts')
 * @returns {object} - Safe error object for JSON response
 */
export function safeError(error, context = 'request') {
  const message = error?.message || String(error);
  return {
    error: sanitizeErrorMessage(message, `${context} failed`),
  };
}
