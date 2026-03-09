// ============================================================
// AUTH - HTTPONLY COOKIE MANAGEMENT
// ============================================================
// Provides secure cookie-based session storage for Supabase auth
// Tokens are stored in HttpOnly cookies, preventing XSS theft
//
// Cookie attributes:
// - HttpOnly: true (JavaScript cannot access)
// - Secure: true (HTTPS only)
// - SameSite: Lax (protects against CSRF while allowing redirects)
// - Path: / (available site-wide)
// - Domain: .philosify.org (shared between api.philosify.org and philosify.org)
// ============================================================

const COOKIE_NAME = "sb-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days (matches Supabase refresh token lifetime)

/**
 * Parse cookies from request
 * @param {Request} request
 * @returns {Object} key-value map of cookies
 */
export function parseCookies(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = {};

  for (const pair of cookieHeader.split(";")) {
    const [key, ...valueParts] = pair.trim().split("=");
    if (key) {
      cookies[key.trim()] = valueParts.join("=").trim();
    }
  }

  return cookies;
}

/**
 * Get session from HttpOnly cookie
 * @param {Request} request
 * @returns {Object|null} Session object or null
 */
export function getSessionFromCookie(request) {
  try {
    const cookies = parseCookies(request);
    const sessionData = cookies[COOKIE_NAME];

    if (!sessionData) {
      return null;
    }

    // Decode and parse session JSON
    const decoded = decodeURIComponent(sessionData);
    const session = JSON.parse(decoded);

    // Validate session structure
    if (!session.access_token || !session.refresh_token) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("[Cookies] Failed to parse session cookie:", error.message);
    return null;
  }
}

/**
 * Build Set-Cookie header for auth session
 * @param {Object} session - Supabase session object
 * @param {boolean} isProduction - Whether running in production
 * @returns {string} Set-Cookie header value
 */
export function buildAuthCookie(session, isProduction = true) {
  // Store minimal session data (tokens only, no PII)
  const cookieData = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };

  const encoded = encodeURIComponent(JSON.stringify(cookieData));

  // Build cookie attributes
  const attributes = [
    `${COOKIE_NAME}=${encoded}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  // Only set Secure and Domain in production
  if (isProduction) {
    attributes.push("Secure");
    attributes.push("Domain=.philosify.org");
  }

  return attributes.join("; ");
}

/**
 * Build cookie header to clear auth session
 * @param {boolean} isProduction - Whether running in production
 * @returns {string} Set-Cookie header value to clear cookie
 */
export function buildClearAuthCookie(isProduction = true) {
  const attributes = [
    `${COOKIE_NAME}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (isProduction) {
    attributes.push("Secure");
    attributes.push("Domain=.philosify.org");
  }

  return attributes.join("; ");
}

/**
 * Determine if running in production
 * @param {Object} env - Cloudflare Worker environment
 * @returns {boolean}
 */
export function isProduction(env) {
  // Check environment variable first, fall back to origin-based check
  if (env.ENVIRONMENT) {
    return env.ENVIRONMENT === "production";
  }
  const origins = env.ALLOWED_ORIGINS || "";
  return !origins.includes("localhost");
}
