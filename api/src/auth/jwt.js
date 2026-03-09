// ============================================================
// AUTH - JWT VERIFICATION WITH JWKS
// ============================================================
// Extracts and verifies JWT from HttpOnly cookie only.
// No Authorization header support - all auth via secure cookies.
//
// Security:
// - JWT signatures verified using Supabase JWKS endpoint
// - Uses public key cryptography to verify tokens
// - Only accepts valid JWTs issued by Supabase
// - JWKS cached at module level (50-200ms saved per request)

import * as jose from "jose";
import { getSecret } from "../utils/secrets.js";
import { getSessionFromCookie } from "./cookies.js";

// Cache JWKS at module level - persists across requests in same Worker instance
// TTL: refresh JWKS every 1 hour (3600s) to pick up key rotations
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
const jwksCache = new Map();

/**
 * Get user from HttpOnly cookie authentication.
 * Extracts JWT from cookie and verifies signature with Supabase JWKS.
 *
 * @param {Request} req - Incoming request with HttpOnly cookie
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Promise<Object|null>} { userId, email, token, payload } or null
 */
export async function getUserFromAuth(req, env) {
  // Extract token from HttpOnly cookie only
  const session = getSessionFromCookie(req);
  if (!session?.access_token) {
    return null;
  }

  const token = session.access_token;

  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);

    if (!supabaseUrl) {
      console.error("[Auth] SUPABASE_URL not configured");
      return null;
    }

    // Use cached JWKS or create new one (with TTL to pick up key rotations)
    const cached = jwksCache.get(supabaseUrl);
    if (!cached || Date.now() - cached.createdAt > JWKS_CACHE_TTL_MS) {
      jwksCache.set(supabaseUrl, {
        jwks: jose.createRemoteJWKSet(
          new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
        ),
        createdAt: Date.now(),
      });
    }

    const JWKS = jwksCache.get(supabaseUrl).jwks;

    // Verify JWT signature with cached public key
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: "authenticated",
    });

    const userId = payload.sub;
    const email = payload.email;

    if (!userId) {
      console.error("[Auth] JWT missing user ID (sub claim)");
      return null;
    }

    return { userId, email, token, payload };
  } catch (error) {
    // Don't log expected errors (expired tokens, etc.)
    if (error.code !== "ERR_JWT_EXPIRED") {
      console.error("[Auth] JWT verification failed:", error.message);
    }
    return null;
  }
}
