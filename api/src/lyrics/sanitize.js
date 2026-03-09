// ============================================================
// LYRICS SANITIZATION
// ============================================================
// Protects against prompt injection, XSS, and excessive token usage

/**
 * Sanitize lyrics before sending to AI models
 * Removes HTML, potential injection patterns, and enforces length limits
 *
 * @param {string} rawLyrics - Raw lyrics from lyrics service
 * @param {number} maxLength - Maximum allowed length (default: 10000 chars)
 * @returns {string|null} Sanitized lyrics or null if invalid
 */
export function sanitizeLyrics(rawLyrics, maxLength = 10000) {
  if (!rawLyrics || typeof rawLyrics !== 'string') {
    return null;
  }

  let cleaned = rawLyrics;

  // Remove HTML tags (defense against XSS)
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Remove script/style content more aggressively
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove potential prompt injection patterns
  // These are common patterns used to manipulate AI responses
  cleaned = cleaned.replace(/ignore\s+(all\s+)?previous\s+(instructions?|commands?|prompts?)/gi, '[removed]');
  cleaned = cleaned.replace(/system\s*:/gi, '[removed]');
  cleaned = cleaned.replace(/assistant\s*:/gi, '[removed]');
  cleaned = cleaned.replace(/\[INST\]/gi, '[removed]');
  cleaned = cleaned.replace(/\[\/INST\]/gi, '[removed]');

  // Remove excessive control characters (but keep newlines and tabs)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize whitespace (but preserve line breaks for readability)
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Multiple blank lines to double newline

  // Trim each line
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Enforce max length
  if (cleaned.length > maxLength) {
    console.warn(`[Lyrics] Truncated lyrics from ${rawLyrics.length} to ${maxLength} chars`);
    cleaned = cleaned.substring(0, maxLength);
    // Try to cut at a word boundary
    const lastSpace = cleaned.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.9) { // Only if we're close to the limit
      cleaned = cleaned.substring(0, lastSpace);
    }
    cleaned += '\n[...]'; // Indicate truncation
  }

  // Validate minimum length
  if (cleaned.length < 20) {
    console.warn('[Lyrics] Sanitized lyrics too short, likely invalid');
    return null;
  }

  return cleaned;
}

/**
 * Validate lyrics are reasonable before sanitization
 * Catches obviously malicious or broken data early
 *
 * @param {string} lyrics - Lyrics to validate
 * @returns {boolean} True if lyrics pass basic validation
 */
export function validateLyricsFormat(lyrics) {
  if (!lyrics || typeof lyrics !== 'string') {
    return false;
  }

  // Too short
  if (lyrics.length < 20) {
    return false;
  }

  // Too long (100KB limit - likely not actual lyrics)
  if (lyrics.length > 100000) {
    console.warn('[Lyrics] Suspiciously large lyrics payload');
    return false;
  }

  // Too many HTML tags (likely scraped HTML page instead of lyrics)
  const htmlTagCount = (lyrics.match(/<[^>]+>/g) || []).length;
  if (htmlTagCount > 50) {
    console.warn('[Lyrics] Too many HTML tags, likely not clean lyrics');
    return false;
  }

  // Check for suspicious binary data
  const binaryCharCount = (lyrics.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
  if (binaryCharCount > lyrics.length * 0.1) { // More than 10% binary chars
    console.warn('[Lyrics] Suspicious binary data in lyrics');
    return false;
  }

  return true;
}
