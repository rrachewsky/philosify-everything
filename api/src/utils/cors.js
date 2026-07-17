// ============================================================
// CORS UTILITIES
// ============================================================

// Fallback for local development (wrangler dev)
// In production, ALLOWED_ORIGINS env var from wrangler.toml is used
const DEV_ALLOWED_ORIGINS = [
  "https://philosify.org",
  "https://www.philosify.org",
  "http://localhost:8787",
  "http://127.0.0.1:8787",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:5173",
];

// Allow only specific Cloudflare Pages preview deployments (not all *.pages.dev).
// Strict matching prevents subdomain attacks (e.g., evil-philosify-frontend.pages.dev).
const ALLOWED_PREVIEW_PATTERNS = [
  "philosify-everything-frontend.pages.dev",
  "philosify-everything-frontend-preview.pages.dev",
  "philosify-frontend.pages.dev",
  "philosify-frontend-preview.pages.dev",
  "philosify-ads.pages.dev",
];

function matchesPreviewPattern(safeOrigin) {
  return (
    !!safeOrigin &&
    ALLOWED_PREVIEW_PATTERNS.some(
      (pattern) =>
        safeOrigin === `https://${pattern}` ||
        safeOrigin.endsWith(`.${pattern}`),
    )
  );
}

/**
 * Strict allow-list check for the request Origin header.
 * Unlike getCorsHeaders (which falls back to a default origin so browsers still
 * receive usable CORS headers), this returns false for a missing or
 * non-allow-listed origin. Use it for CSRF/origin validation on state-changing
 * endpoints (e.g. signout) where "no origin" must be treated as untrusted.
 *
 * @param {string} origin - The request Origin header value
 * @param {Object} env - Cloudflare Worker environment
 * @returns {boolean} true only if origin is present and explicitly allowed
 */
export function isAllowedOrigin(origin, env = {}) {
  const safeOrigin = typeof origin === "string" ? origin : "";
  if (!safeOrigin) return false;

  // Localhost allowed only outside production (exact hostname match)
  if (env.ENVIRONMENT !== "production") {
    try {
      const originUrl = new URL(safeOrigin);
      if (
        originUrl.hostname === "localhost" ||
        originUrl.hostname === "127.0.0.1"
      ) {
        return true;
      }
    } catch {
      // Invalid URL - not allowed
    }
  }

  const allowedOriginsStr = env.ALLOWED_ORIGINS || "";
  const allowedOrigins = allowedOriginsStr
    ? allowedOriginsStr.split(" ").filter(Boolean)
    : DEV_ALLOWED_ORIGINS;

  return allowedOrigins.includes(safeOrigin) || matchesPreviewPattern(safeOrigin);
}

export function getCorsHeaders(origin, env = {}) {
  // Ensure origin is a string (could be undefined, null, or other types in edge cases)
  const safeOrigin = typeof origin === "string" ? origin : "";

  // Security headers (shared across all responses)
  // NOTE: CSP is NOT included here — CSP belongs on HTML documents (served by Cloudflare Pages),
  // not on API JSON responses. Including CSP on API responses causes conflicts with the
  // frontend's CSP when the browser applies both.
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  };

  // Allow localhost only in non-production environments (exact hostname match)
  if (safeOrigin && env.ENVIRONMENT !== "production") {
    try {
      const originUrl = new URL(safeOrigin);
      if (
        originUrl.hostname === "localhost" ||
        originUrl.hostname === "127.0.0.1"
      ) {
        return {
          "Access-Control-Allow-Origin": safeOrigin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Admin-Secret",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
          ...securityHeaders,
        };
      }
    } catch (e) {
      // Invalid URL - skip localhost check
    }
  }

  // Get allowed origins from environment variable (production) or fallback to dev list
  const allowedOriginsStr = env.ALLOWED_ORIGINS || "";
  const allowedOrigins = allowedOriginsStr
    ? allowedOriginsStr.split(" ").filter(Boolean)
    : DEV_ALLOWED_ORIGINS;

  // Allow only specific Cloudflare Pages preview deployments (not all *.pages.dev)
  const isAllowedPreview = matchesPreviewPattern(safeOrigin);

  const allowedOrigin =
    safeOrigin && (allowedOrigins.includes(safeOrigin) || isAllowedPreview)
      ? safeOrigin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Admin-Secret",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    ...securityHeaders,
  };
}
