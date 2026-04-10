// ============================================================
// ADS PLATFORM - UTILITY FUNCTIONS
// ============================================================
// Uses Supabase Auth with HttpOnly cookies (same as main Philosify)
// ============================================================

import * as jose from 'jose';
import { getSecret } from '../../utils/secrets.js';

// Cookie name for ads auth (matches auth.js)
const COOKIE_NAME = 'ads-auth';

// Cache JWKS at module level - persists across requests in same Worker instance
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const jwksCache = new Map();

/**
 * Parse session from HttpOnly cookie
 * Validates BOTH access_token and refresh_token are present
 */
function getSessionFromCookie(request) {
  try {
    const cookies = request.headers.get('Cookie') || '';
    const cookieMatch = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    
    if (!cookieMatch) {
      return null;
    }

    const decoded = decodeURIComponent(cookieMatch[1]);
    const session = JSON.parse(decoded);

    // Validate session structure - require BOTH tokens
    if (!session.access_token || !session.refresh_token) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Verify Supabase JWT using JWKS
 * Returns user payload if valid, null otherwise
 */
async function verifySupabaseToken(env, token) {
  if (!token) return null;

  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);

    if (!supabaseUrl) {
      console.error('[Ads] SUPABASE_URL not configured');
      return null;
    }

    // Use cached JWKS or create new one
    const cached = jwksCache.get(supabaseUrl);
    if (!cached || Date.now() - cached.createdAt > JWKS_CACHE_TTL_MS) {
      jwksCache.set(supabaseUrl, {
        jwks: jose.createRemoteJWKSet(
          new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
        ),
        createdAt: Date.now(),
      });
    }

    const JWKS = jwksCache.get(supabaseUrl).jwks;

    // Verify JWT signature with cached public key
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });

    return payload;
  } catch (error) {
    if (error.code !== 'ERR_JWT_EXPIRED') {
      console.error('[Ads] JWT verification failed:', error.message);
    }
    return null;
  }
}

/**
 * Get advertiser from request (HttpOnly cookie with Supabase token)
 * Returns advertiser object or null
 */
export async function getAdvertiserFromRequest(env, request, supabase) {
  // Get token from HttpOnly cookie
  const session = getSessionFromCookie(request);
  if (!session?.access_token) {
    return null;
  }

  const payload = await verifySupabaseToken(env, session.access_token);

  if (!payload?.sub) {
    return null;
  }

  const userId = payload.sub;

  // Fetch advertiser by user_id
  const { data: advertisers, error } = await supabase
    .from('ads.advertisers')
    .select('*', { filter: `user_id=eq.${userId}` });

  if (error || !advertisers || advertisers.length === 0) {
    // Also try by email (for legacy accounts)
    if (payload.email) {
      const { data: byEmail } = await supabase
        .from('ads.advertisers')
        .select('*', { filter: `email=eq.${payload.email}` });
      
      if (byEmail?.[0]) {
        // Link user_id if not already linked
        if (!byEmail[0].user_id) {
          await supabase.from('ads.advertisers').update(
            { user_id: userId },
            `id=eq.${byEmail[0].id}`
          );
        }
        return byEmail[0];
      }
    }
    return null;
  }

  return advertisers[0];
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Get CPM for placement/duration (fallback values — DB pricing_config is source of truth)
 * These must match inventory.js DEFAULT_CPM and the pricing_config table
 */
export const DEFAULT_CPM = {
  sidebar: { 5: 600, 10: 800, 15: 1000, 20: 1200 },
  constellation: { 5: 400 },
};

export function getCpmCents(placement, duration) {
  return DEFAULT_CPM[placement]?.[duration] || null;
}
