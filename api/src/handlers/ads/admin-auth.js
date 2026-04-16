// ============================================================
// ADS PLATFORM - ADMIN AUTHENTICATION (SECURE)
// ============================================================
// HTTPOnly cookie-based admin authentication with stateless JWT
// Replaces sessionStorage secret storage (CVE-2026-001 fix)
// Uses JWT tokens instead of in-memory sessions (Cloudflare Workers compatible)
// ============================================================

import { jsonResponse } from '../../utils/index.js';
import { getSecret } from '../../utils/secrets.js';
import { safeEq } from '../../payments/crypto.js';

// Admin session configuration
const ADMIN_COOKIE_NAME = 'ads-admin-session';
const ADMIN_SESSION_TTL = 60 * 60 * 8; // 8 hours

// ============================================================
// JWT UTILITIES (Web Crypto HMAC-SHA256)
// ============================================================

/**
 * Base64url encode (URL-safe, no padding)
 */
function base64UrlEncode(input) {
  const bytes = typeof input === 'string' 
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  
  // Convert bytes to base64
  const base64 = btoa(String.fromCharCode(...bytes));
  
  // Make URL-safe and remove padding
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64url decode
 */
function base64UrlDecode(input) {
  // Add padding back if needed
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate admin JWT token
 * Format: {header}.{payload}.{signature}
 * Payload: { exp: timestamp }
 */
async function generateAdminJWT(adminSecret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    exp: Date.now() + (ADMIN_SESSION_TTL * 1000),
    iat: Date.now(),
    role: 'admin',
  };
  
  // Encode header and payload
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  
  // Create signing input
  const signingInput = `${headerB64}.${payloadB64}`;
  
  // Import secret key
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(adminSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput)
  );
  
  // Encode signature
  const signatureB64 = base64UrlEncode(signatureBuffer);
  
  return `${signingInput}.${signatureB64}`;
}

/**
 * Verify admin JWT token
 * Returns payload if valid, null if invalid/expired
 */
async function verifyAdminJWT(jwt, adminSecret) {
  try {
    if (!jwt || typeof jwt !== 'string') {
      return null;
    }
    
    // Parse JWT
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Verify signature
    const signingInput = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(adminSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = base64UrlDecode(signatureB64);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );
    
    if (!valid) {
      return null;
    }
    
    // Decode and verify payload
    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadStr);
    
    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('[Admin Auth] JWT verification error:', error);
    return null;
  }
}

// ============================================================
// COOKIE UTILITIES
// ============================================================

/**
 * Create admin session cookie with JWT
 */
function buildAdminCookie(jwt, isProduction = true) {
  const attributes = [
    `${ADMIN_COOKIE_NAME}=${jwt}`,
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
 * Get JWT from cookie
 */
function getJWTFromCookie(request) {
  try {
    const cookies = request.headers.get('Cookie') || '';
    const match = cookies.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// ============================================================
// AUTHENTICATION HANDLERS
// ============================================================

/**
 * POST /api/ads/admin/auth/login
 * Verify admin secret and create HTTPOnly JWT cookie
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
    
    // Generate JWT
    const jwt = await generateAdminJWT(adminSecret);
    
    // Determine if production
    const isProduction = !env.ALLOWED_ORIGINS?.includes('localhost');
    
    // Return success with HTTPOnly cookie containing JWT
    const headers = {
      ...corsHeaders,
      'Set-Cookie': buildAdminCookie(jwt, isProduction),
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
 * Verify current admin session (JWT)
 */
export async function handleAdminVerify(request, env, corsHeaders) {
  const jwt = getJWTFromCookie(request);
  
  if (!jwt) {
    return jsonResponse({ authenticated: false }, 401, corsHeaders);
  }
  
  const adminSecret = await getSecret(env.ADMIN_SECRET);
  const payload = await verifyAdminJWT(jwt, adminSecret);
  
  if (!payload) {
    return jsonResponse({ authenticated: false }, 401, corsHeaders);
  }
  
  const expiresIn = Math.floor((payload.exp - Date.now()) / 1000);
  
  return jsonResponse({ 
    authenticated: true,
    expiresIn,
  }, 200, corsHeaders);
}

/**
 * Middleware: Verify admin is authenticated via JWT cookie
 * Use this instead of X-Admin-Secret header
 */
export async function verifyAdminCookie(request, env) {
  const jwt = getJWTFromCookie(request);
  
  if (!jwt) {
    return false;
  }
  
  const adminSecret = await getSecret(env.ADMIN_SECRET);
  const payload = await verifyAdminJWT(jwt, adminSecret);
  
  return payload !== null;
}
