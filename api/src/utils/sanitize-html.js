// ============================================================
// SERVER-SIDE HTML SANITIZATION
// ============================================================
// Defense-in-depth: strips HTML/script content from user input
// BEFORE storing in the database. React auto-escapes in JSX,
// but future consumers (email digests, admin panels, mobile
// apps, export tools) may not. Sanitize at the boundary.

/**
 * Strip all HTML tags and dangerous content from a string.
 * Preserves plain text content only.
 *
 * @param {string} input - Raw user input
 * @returns {string} - Sanitized plain text
 */
export function stripHtml(input) {
  if (!input || typeof input !== 'string') return input;

  return input
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove script/style blocks entirely
    .replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove self-closing dangerous tags
    .replace(/<(script|style|iframe|object|embed|form|input|textarea|select|button)[^>]*\/?>/gi, '')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    // Re-strip any tags that were hidden in entities
    .replace(/<[^>]+>/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize a user message for safe storage.
 * Removes HTML but preserves line breaks and basic formatting.
 *
 * @param {string} message - User message content
 * @returns {string} - Sanitized message
 */
export function sanitizeMessage(message) {
  if (!message || typeof message !== 'string') return message;

  return message
    // Remove script/style blocks
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove event handlers (onerror, onclick, etc.)
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: and data: URLs
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    // Remove all HTML tags but preserve text
    .replace(/<[^>]+>/g, '')
    .trim();
}
