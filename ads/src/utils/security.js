/**
 * SECURITY UTILITIES
 * 
 * Comprehensive input validation and sanitization for Philosify Ads
 * Prevents XSS, injection attacks, and other security vulnerabilities
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * Uses a whitelist approach - only allows safe characters
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize campaign name
 * Max 100 characters, no special HTML/script tags
 */
export function validateCampaignName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Campaign name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Campaign name must be at least 3 characters' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: 'Campaign name must be less than 100 characters' };
  }
  
  // Block obvious XSS attempts
  const xssPatterns = /<script|javascript:|onerror=|onclick=|onload=|<iframe|<object|<embed/i;
  if (xssPatterns.test(trimmed)) {
    return { valid: false, error: 'Campaign name contains invalid characters' };
  }
  
  return { valid: true, sanitized: sanitizeHTML(trimmed) };
}

/**
 * Validate and sanitize company name
 */
export function validateCompanyName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Company name is required' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Company name must be at least 2 characters' };
  }
  
  if (trimmed.length > 200) {
    return { valid: false, error: 'Company name must be less than 200 characters' };
  }
  
  const xssPatterns = /<script|javascript:|onerror=|onclick=/i;
  if (xssPatterns.test(trimmed)) {
    return { valid: false, error: 'Company name contains invalid characters' };
  }
  
  return { valid: true, sanitized: sanitizeHTML(trimmed) };
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim().toLowerCase();
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long' };
  }
  
  return { valid: true, sanitized: trimmed };
}

/**
 * Validate URL format
 */
export function validateURL(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(trimmed)) {
    return { valid: false, error: 'URL protocol not allowed' };
  }
  
  // Must be http or https
  if (!trimmed.match(/^https?:\/\//i)) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }
  
  try {
    const parsed = new URL(trimmed);
    
    // Additional safety checks
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
    }
    
    return { valid: true, sanitized: parsed.href };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate UUID v4 format
 */
export function validateUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where y is 8, 9, a, or b
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate budget amount (in cents)
 */
export function validateBudget(amountCents) {
  if (typeof amountCents !== 'number') {
    return { valid: false, error: 'Budget must be a number' };
  }
  
  if (amountCents < 1000) { // Min $10
    return { valid: false, error: 'Minimum budget is $10.00' };
  }
  
  if (amountCents > 100000000) { // Max $1,000,000
    return { valid: false, error: 'Maximum budget is $1,000,000.00' };
  }
  
  if (!Number.isInteger(amountCents)) {
    return { valid: false, error: 'Budget must be a whole number (cents)' };
  }
  
  if (amountCents < 0) {
    return { valid: false, error: 'Budget cannot be negative' };
  }
  
  return { valid: true, amount: amountCents };
}

/**
 * Sanitize feedback/comment text
 * Allows more characters but still prevents XSS
 */
export function sanitizeFeedback(text) {
  if (!text || typeof text !== 'string') return '';
  
  const trimmed = text.trim();
  
  // Max length check
  if (trimmed.length > 5000) {
    return trimmed.substring(0, 5000);
  }
  
  // Remove script tags and event handlers
  return trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Rate limiting key generator
 * Creates a safe key for rate limiting based on IP or user ID
 */
export function getRateLimitKey(request, prefix = '') {
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') ||
             'unknown';
  
  return `${prefix}:${ip}`;
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks on sensitive comparisons
 */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
