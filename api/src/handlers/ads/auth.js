// ============================================================
// ADS PLATFORM - AUTHENTICATION HANDLERS (Supabase Auth)
// ============================================================
// Uses Supabase Auth for user authentication.
// Advertiser profiles stored in ads.advertisers linked by user_id.
// Tokens stored in HttpOnly cookies (same security as main Philosify).
// ============================================================

import { getServiceSupabase, getSupabaseCredentials } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { isValidEmail, isValidUrl, getAdvertiserFromRequest } from './utils.js';
import { vetAdvertiser } from './vetting.js';

// Cookie configuration (matches main Philosify)
const COOKIE_NAME = 'ads-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Build HttpOnly cookie for ads auth session
 */
function buildAdsCookie(session, isProduction = true) {
  const cookieData = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };

  const encoded = encodeURIComponent(JSON.stringify(cookieData));

  const attributes = [
    `${COOKIE_NAME}=${encoded}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (isProduction) {
    attributes.push('Secure');
    attributes.push('Domain=.philosify.org');
  }

  return attributes.join('; ');
}

/**
 * Build cookie to clear ads auth session
 */
function buildClearAdsCookie(isProduction = true) {
  const attributes = [
    `${COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (isProduction) {
    attributes.push('Secure');
    attributes.push('Domain=.philosify.org');
  }

  return attributes.join('; ');
}

/**
 * Check if running in production
 */
function isProduction(env) {
  if (env.ENVIRONMENT) {
    return env.ENVIRONMENT === 'production';
  }
  const origins = env.ALLOWED_ORIGINS || '';
  return !origins.includes('localhost');
}

function getCreatedUserId(supabaseUser) {
  return supabaseUser?.user?.id || supabaseUser?.id || null;
}

/**
 * Sign up a new user via Supabase Admin API
 */
async function supabaseAdminSignUp(env, email, password) {
  const { url, key } = await getSupabaseCredentials(env);

  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // Auto-confirm email for advertisers
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.msg || 'Failed to create user');
  }

  return response.json();
}

/**
 * Sign in user via Supabase Auth API (returns session tokens)
 */
async function supabaseSignIn(env, email, password) {
  const { url, key } = await getSupabaseCredentials(env);

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || error.message || 'Invalid credentials');
  }

  return response.json();
}

/**
 * POST /api/ads/auth/signup
 * Register a new advertiser
 */
export async function handleAdsSignup(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, password, company_name, website } = body;

    // Validation
    if (!email || !password || !company_name) {
      return jsonResponse({ error: 'Email, password, and company name are required' }, 400, corsHeaders);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400, corsHeaders);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400, corsHeaders);
    }

    if (company_name.length < 2 || company_name.length > 100) {
      return jsonResponse({ error: 'Company name must be 2-100 characters' }, 400, corsHeaders);
    }

    if (website && !isValidUrl(website)) {
      return jsonResponse({ error: 'Invalid website URL' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Check if email already exists in advertisers
    const { data: existing } = await supabase
      .from('ads.advertisers')
      .select('id', { filter: `email=eq.${encodeURIComponent(email.toLowerCase())}` });

    if (existing && existing.length > 0) {
      // Generic message to prevent account enumeration
      return jsonResponse({ error: 'Unable to create account. Please try again or contact support.' }, 400, corsHeaders);
    }

    // Create Supabase user
    let supabaseUser;
    try {
      supabaseUser = await supabaseAdminSignUp(env, email.toLowerCase(), password);
    } catch (err) {
      // User might already exist in Supabase but not as advertiser
      // Use generic message to prevent account enumeration
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        return jsonResponse({ error: 'Unable to create account. Please try again or contact support.' }, 400, corsHeaders);
      }
      throw err;
    }

    const createdUserId = getCreatedUserId(supabaseUser);
    if (!createdUserId) {
      throw new Error('Failed to create advertiser auth user');
    }

    // AI vetting
    const vetting = await vetAdvertiser(env, { email, company_name, website });

    // Create advertiser profile
    const { data: advertiser, error } = await supabase
      .from('ads.advertisers')
      .insert({
        user_id: createdUserId,
        email: email.toLowerCase(),
        password_hash: null, // Not used with Supabase Auth
        company_name,
        website: website || null,
        contact_email: email.toLowerCase(),
        status: vetting.score >= 80 ? 'approved' : 'pending',
        vetting_score: vetting.score,
        vetting_reason: vetting.reason,
        vetted_at: new Date().toISOString(),
        vetted_by: 'ai',
      });

    if (error) {
      console.error('[Ads] Signup error:', error);
      return jsonResponse({ error: 'Failed to create account' }, 500, corsHeaders);
    }

    // Sign in to get session tokens
    const session = await supabaseSignIn(env, email.toLowerCase(), password);

    // Build response with HttpOnly cookie
    const response = jsonResponse({
      success: true,
      advertiser: {
        id: advertiser.id,
        email: advertiser.email,
        company_name: advertiser.company_name,
        status: advertiser.status,
      },
    }, 201, corsHeaders);

    response.headers.set('Set-Cookie', buildAdsCookie(session, isProduction(env)));
    return response;
  } catch (err) {
    console.error('[Ads] Signup error:', err);
    return jsonResponse({ error: err.message || 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/auth/login
 * Login as advertiser
 */
export async function handleAdsLogin(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400, corsHeaders);
    }

    // Sign in via Supabase
    let session;
    try {
      session = await supabaseSignIn(env, email.toLowerCase(), password);
    } catch (err) {
      return jsonResponse({ error: 'Invalid email or password' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Find advertiser profile
    const { data: advertisers, error } = await supabase
      .from('ads.advertisers')
      .select('*', { filter: `user_id=eq.${session.user.id}` });

    // Also check by email (for accounts created before migration)
    let advertiser = advertisers?.[0];
    if (!advertiser) {
      const { data: byEmail } = await supabase
        .from('ads.advertisers')
        .select('*', { filter: `email=eq.${encodeURIComponent(email.toLowerCase())}` });
      advertiser = byEmail?.[0];
      
      // Link user_id if found by email
      if (advertiser && !advertiser.user_id) {
        await supabase.from('ads.advertisers').update(
          { user_id: session.user.id },
          `id=eq.${advertiser.id}`
        );
      }
    }

    if (!advertiser) {
      // Generic message to prevent account enumeration
      return jsonResponse({ error: 'Invalid email or password' }, 401, corsHeaders);
    }

    // Check if account is suspended (still generic to prevent enumeration)
    if (advertiser.status === 'suspended') {
      return jsonResponse({ error: 'Invalid email or password' }, 401, corsHeaders);
    }

    // Update last login
    await supabase.from('ads.advertisers').update(
      { last_login_at: new Date().toISOString() },
      `id=eq.${advertiser.id}`
    );

    // Build response with HttpOnly cookie
    const response = jsonResponse({
      success: true,
      advertiser: {
        id: advertiser.id,
        email: advertiser.email,
        company_name: advertiser.company_name,
        website: advertiser.website,
        status: advertiser.status,
        balance_cents: advertiser.balance_cents,
        created_at: advertiser.created_at,
      },
    }, 200, corsHeaders);

    response.headers.set('Set-Cookie', buildAdsCookie(session, isProduction(env)));
    return response;
  } catch (err) {
    console.error('[Ads] Login error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/auth/logout
 * Logout advertiser (clear cookie AND revoke server-side session)
 */
export async function handleAdsLogout(request, env, corsHeaders) {
  try {
    // Get current session to revoke it server-side
    const cookies = request.headers.get('Cookie') || '';
    const cookieMatch = cookies.match(/ads-auth=([^;]+)/);
    
    if (cookieMatch) {
      try {
        const session = JSON.parse(decodeURIComponent(cookieMatch[1]));
        if (session.access_token) {
          // Revoke session in Supabase (invalidates refresh token)
          const { url, key } = await getSupabaseCredentials(env);
          await fetch(`${url}/auth/v1/logout`, {
            method: 'POST',
            headers: {
              apikey: key,
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      } catch {
        // Continue with cookie clear even if revocation fails
      }
    }
  } catch {
    // Continue with cookie clear even if errors
  }

  const response = jsonResponse({ success: true }, 200, corsHeaders);
  response.headers.set('Set-Cookie', buildClearAdsCookie(isProduction(env)));
  return response;
}

/**
 * GET /api/ads/auth/me
 * Get current advertiser
 */
export async function handleAdsMe(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    return jsonResponse({
      advertiser: {
        id: advertiser.id,
        email: advertiser.email,
        company_name: advertiser.company_name,
        website: advertiser.website,
        contact_email: advertiser.contact_email,
        status: advertiser.status,
        balance_cents: advertiser.balance_cents,
        created_at: advertiser.created_at,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Me error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/auth/refresh
 * Refresh access token (via HttpOnly cookie)
 */
export async function handleAdsRefresh(request, env, corsHeaders) {
  try {
    // Get refresh token from cookie
    const cookies = request.headers.get('Cookie') || '';
    const cookieMatch = cookies.match(/ads-auth=([^;]+)/);
    
    if (!cookieMatch) {
      return jsonResponse({ error: 'No session' }, 401, corsHeaders);
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(cookieMatch[1]));
    } catch {
      return jsonResponse({ error: 'Invalid session' }, 401, corsHeaders);
    }

    if (!session.refresh_token) {
      return jsonResponse({ error: 'No refresh token' }, 401, corsHeaders);
    }

    const { url, key } = await getSupabaseCredentials(env);

    const refreshResponse = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });

    if (!refreshResponse.ok) {
      const response = jsonResponse({ error: 'Session expired' }, 401, corsHeaders);
      response.headers.set('Set-Cookie', buildClearAdsCookie(isProduction(env)));
      return response;
    }

    const newSession = await refreshResponse.json();

    // Build response with new HttpOnly cookie
    const response = jsonResponse({ success: true }, 200, corsHeaders);
    response.headers.set('Set-Cookie', buildAdsCookie(newSession, isProduction(env)));
    return response;
  } catch (err) {
    console.error('[Ads] Refresh error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}
