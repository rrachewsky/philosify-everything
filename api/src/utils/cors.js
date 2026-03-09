// ============================================================
// CORS UTILITIES
// ============================================================

// Fallback for local development (wrangler dev)
// In production, ALLOWED_ORIGINS env var from wrangler.toml is used
const DEV_ALLOWED_ORIGINS = [
  "https://everything.philosify.org",
  "https://www.everything.philosify.org",
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

export function getCorsHeaders(origin, env = {}) {
  // Ensure origin is a string (could be undefined, null, or other types in edge cases)
  const safeOrigin = typeof origin === "string" ? origin : "";

  // Security headers (shared across all responses)
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://open.spotify.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-src https://open.spotify.com https://js.stripe.com; connect-src 'self' https://*.supabase.co https://api.stripe.com; img-src 'self' data: https://i.scdn.co https://*.spotify.com",
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
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Admin-Secret",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
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
  // Use strict matching to prevent subdomain attacks (e.g., evil-philosify-frontend.pages.dev)
  const ALLOWED_PREVIEW_PATTERNS = [
    "philosify-everything-frontend.pages.dev",
    "philosify-everything-frontend-preview.pages.dev",
    "philosify-frontend.pages.dev",
    "philosify-frontend-preview.pages.dev",
  ];
  const isAllowedPreview =
    safeOrigin &&
    ALLOWED_PREVIEW_PATTERNS.some(
      (pattern) =>
        safeOrigin === `https://${pattern}` ||
        safeOrigin.endsWith(`.${pattern}`),
    );

  const allowedOrigin =
    safeOrigin && (allowedOrigins.includes(safeOrigin) || isAllowedPreview)
      ? safeOrigin
      : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Admin-Secret",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    ...securityHeaders,
  };
}
