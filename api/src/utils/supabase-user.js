// ============================================================
// SUPABASE USER CLIENT
// ============================================================
// Creates a Supabase client authenticated as the user from HttpOnly cookie.
// Uses the user's access_token so RLS policies are enforced.
// Includes auto-refresh: if token is expired, refreshes and updates cookie.
//
// Security:
// - RLS enforced (auth.uid() = user's ID)
// - Defense in depth - even buggy code can't access other users' data
// - Refresh token rotation supported (Supabase invalidates old tokens)

import { createClient } from '@supabase/supabase-js';
import { getSessionFromCookie, buildAuthCookie, isProduction } from '../auth/cookies.js';
import { getSecret } from './secrets.js';

/**
 * Get Supabase client authenticated as the user from HttpOnly cookie.
 * RLS policies are enforced - queries only return user's own data.
 * 
 * If access_token is expired, automatically refreshes using refresh_token
 * and includes Set-Cookie header in the response object.
 * 
 * @param {Request} request - Incoming request with HttpOnly cookie
 * @param {Object} env - Cloudflare Worker environment
 * @returns {Promise<Object|null>} { client, userId, email, setCookieHeader } or null if not authenticated
 */
export async function getSupabaseForUser(request, env) {
  const session = getSessionFromCookie(request);
  if (!session?.access_token) {
    return null;
  }

  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseAnonKey = await getSecret(env.SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[SupabaseUser] Missing Supabase configuration');
    return null;
  }

  // Check if token is expired (with 30 second buffer)
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at || 0;
  const isExpired = expiresAt > 0 && (expiresAt - 30) < now;

  let accessToken = session.access_token;
  let setCookieHeader = null;

  // Auto-refresh if expired
  if (isExpired && session.refresh_token) {
    console.log('[SupabaseUser] Access token expired, attempting refresh...');
    
    const refreshResult = await refreshSession(supabaseUrl, supabaseAnonKey, session.refresh_token, env);
    
    if (refreshResult.error) {
      console.error('[SupabaseUser] Token refresh failed:', refreshResult.error);
      return null; // Session is invalid, user needs to re-login
    }

    accessToken = refreshResult.session.access_token;
    setCookieHeader = refreshResult.setCookieHeader;
    console.log('[SupabaseUser] Token refreshed successfully');
  }

  // Create client with user's token (RLS enforced)
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  // Verify token is valid and get user info
  const { data: { user }, error } = await client.auth.getUser(accessToken);
  
  if (error || !user) {
    console.error('[SupabaseUser] Token verification failed:', error?.message);
    return null;
  }

  return {
    client,
    userId: user.id,
    email: user.email,
    userMetadata: user.user_metadata || {},
    setCookieHeader, // Include in response if token was refreshed
  };
}

/**
 * Refresh session using refresh_token
 * @private
 */
async function refreshSession(supabaseUrl, supabaseAnonKey, refreshToken, env) {
  try {
    // Create a temporary client for refresh
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { data, error } = await tempClient.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !data.session) {
      return { error: error?.message || 'Refresh failed' };
    }

    // Build new cookie with refreshed tokens (including rotated refresh_token)
    const isProd = isProduction(env);
    const setCookieHeader = buildAuthCookie(data.session, isProd);

    return {
      session: data.session,
      setCookieHeader
    };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Helper to add Set-Cookie header to response if token was refreshed
 * @param {Response} response - Response object to modify
 * @param {string|null} setCookieHeader - Cookie header from getSupabaseForUser
 * @returns {Response} Response with cookie header added (if needed)
 */
export function addRefreshedCookieToResponse(response, setCookieHeader) {
  if (!setCookieHeader) {
    return response;
  }

  // Clone response and add cookie header
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Set-Cookie', setCookieHeader);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
