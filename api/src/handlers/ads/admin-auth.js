// ============================================================
// ADS PLATFORM - ADMIN AUTHENTICATION (SECURE)
// ============================================================
// HTTPOnly cookie-based admin authentication
// Replaces sessionStorage secret storage (CVE-2026-001 fix)
// ============================================================

import { jsonResponse } from '../../utils/index.js';
import { getSecret } from '../../utils/secrets.js';
import { safeEq } from '../../payments/crypto.js';

// Admin session management
const ADMIN_COOKIE_NAME = 'ads-admin-session';
const ADMIN_SESSION_TTL = 60 * 60 * 8; // 8 hours
const adminSessions = new Map(); // sessionId -> { createdAt, expiresAt }

/**
 * Generate secure random session ID
 */
function generateSessionId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create admin session cookie
 */
function buildAdminCookie(sessionId, isProduction = true) {
  const attributes = [
    `${ADMIN_COOKIE_NAME}=${sessionId}`,
    `Max-Age=${ADMIN_SESSION_TTL}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (isProduction) {
    attributes.push('Secure');
    attributes.push('Domain=.philosify.org');
  }

  return attributes.join('; ');
}

/**
 * Clear admin session cookie
 */
function buildClearAdminCookie(isProduction = true) {
  const attributes = [
    `${ADMIN_COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];

  if (isProduction) {
    attributes.push('Secure');
    attributes.push('Domain=.philosify.org');
  }

  return attributes.join('; ');
}

/**
 * Get session from cookie
 */
function getSessionFromCookie(request) {
  try {
    const cookies = request.headers.get('Cookie') || '';
    const match = cookies.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Verify admin session is valid
 */
function verifyAdminSession(sessionId) {
  if (!sessionId) return false;
  
  const session = adminSessions.get(sessionId);
  if (!session) return false;
  
  // Check expiration
  if (Date.now() > session.expiresAt) {
    adminSessions.delete(sessionId);
    return false;
  }
  
  return true;
}

/**
 * Clean up expired sessions (run periodically)
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of adminSessions) {
    if (now > session.expiresAt) {
      adminSessions.delete(sessionId);
    }
  }
}

/**
 * POST /api/ads/admin/auth/login
 * Verify admin secret and create HTTPOnly session cookie
 */
export async function handleAdminLogin(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { secret } = body;
    
    if (!secret) {
      return jsonResponse({ error: 'Admin secret is required' }, 400, corsHeaders);
    }
    
    // Verify against stored admin secret
    const adminSecret = await getSecret(env.ADMIN_SECRET);
    
    if (!adminSecret || !safeEq(secret, adminSecret)) {
      // Add small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return jsonResponse({ error: 'Invalid admin secret' }, 401, corsHeaders);
    }
    
    // Create session
    const sessionId = generateSessionId();
    const now = Date.now();
    adminSessions.set(sessionId, {
      createdAt: now,
      expiresAt: now + (ADMIN_SESSION_TTL * 1000),
    });
    
    // Clean up old sessions
    if (Math.random() < 0.1) {
      cleanupExpiredSessions();
    }
    
    // Determine if production
    const isProduction = !env.ALLOWED_ORIGINS?.includes('localhost');
    
    // Return success with HTTPOnly cookie
    const headers = {
      ...corsHeaders,
      'Set-Cookie': buildAdminCookie(sessionId, isProduction),
    };
    
    return new Response(
      JSON.stringify({ success: true, expiresIn: ADMIN_SESSION_TTL }),
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error('[Admin Auth] Login error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/auth/logout
 * Clear admin session
 */
export async function handleAdminLogout(request, env, corsHeaders) {
  const sessionId = getSessionFromCookie(request);
  
  if (sessionId) {
    adminSessions.delete(sessionId);
  }
  
  const isProduction = !env.ALLOWED_ORIGINS?.includes('localhost');
  
  const headers = {
    ...corsHeaders,
    'Set-Cookie': buildClearAdminCookie(isProduction),
  };
  
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers,
    }
  );
}

/**
 * GET /api/ads/admin/auth/verify
 * Verify current admin session
 */
export async function handleAdminVerify(request, env, corsHeaders) {
  const sessionId = getSessionFromCookie(request);
  const valid = verifyAdminSession(sessionId);
  
  if (!valid) {
    return jsonResponse({ authenticated: false }, 401, corsHeaders);
  }
  
  const session = adminSessions.get(sessionId);
  const expiresIn = Math.floor((session.expiresAt - Date.now()) / 1000);
  
  return jsonResponse({ 
    authenticated: true,
    expiresIn,
  }, 200, corsHeaders);
}

/**
 * Middleware: Verify admin is authenticated via cookie
 * Use this instead of X-Admin-Secret header
 */
export async function verifyAdminCookie(request) {
  const sessionId = getSessionFromCookie(request);
  return verifyAdminSession(sessionId);
}
