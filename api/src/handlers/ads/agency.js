// ============================================================
// ADS PLATFORM - AGENCY HANDLERS
// ============================================================
// Uses Supabase Auth for agency authentication (same security as advertisers)
// Agency profiles stored in ads.agencies linked by user_id
// ============================================================

import * as jose from 'jose';
import { getServiceSupabase, getSupabaseCredentials } from '../../utils/supabase.js';
import { jsonResponse, sanitizeErrorMessage } from '../../utils/index.js';

// SECURITY: UUID validation for route parameters
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import { getSecret } from '../../utils/secrets.js';
import { isValidEmail, isValidUrl, getCpmCents } from './utils.js';
import { vetAdvertiser } from './vetting.js';

// Cookie configuration
const COOKIE_NAME = 'agency-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Cache JWKS at module level
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
const jwksCache = new Map();

// ============================================================
// AUTH HELPERS
// ============================================================

function buildAgencyCookie(session, isProduction = true) {
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

function buildClearAgencyCookie(isProduction = true) {
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

function isProduction(env) {
  if (env.ENVIRONMENT) {
    return env.ENVIRONMENT === 'production';
  }
  const origins = env.ALLOWED_ORIGINS || '';
  return !origins.includes('localhost');
}

function getSessionFromCookie(request) {
  try {
    const cookies = request.headers.get('Cookie') || '';
    const cookieMatch = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    
    if (!cookieMatch) return null;

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

async function verifySupabaseToken(env, token) {
  if (!token) return null;

  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    if (!supabaseUrl) return null;

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
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
    });

    return payload;
  } catch (error) {
    if (error.code !== 'ERR_JWT_EXPIRED') {
      console.error('[Agency] JWT verification failed:', error.message);
    }
    return null;
  }
}

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
      email_confirm: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.msg || 'Failed to create user');
  }

  return response.json();
}

function getCreatedUserId(supabaseUser) {
  return supabaseUser?.user?.id || supabaseUser?.id || null;
}

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

export async function getAgencyFromRequest(env, request, supabase) {
  const session = getSessionFromCookie(request);
  if (!session?.access_token) return null;

  const payload = await verifySupabaseToken(env, session.access_token);
  if (!payload?.sub) return null;

  const userId = payload.sub;

  const { data: agencies, error } = await supabase
    .from('ads.agencies')
    .select('*', { filter: `user_id=eq.${userId}` });

  if (error || !agencies || agencies.length === 0) {
    // Try by email for legacy accounts
    if (payload.email) {
      const { data: byEmail } = await supabase
        .from('ads.agencies')
        .select('*', { filter: `email=eq.${payload.email}` });
      
      if (byEmail?.[0]) {
        if (!byEmail[0].user_id) {
          await supabase.from('ads.agencies').update(
            { user_id: userId },
            `id=eq.${byEmail[0].id}`
          );
        }
        return byEmail[0];
      }
    }
    return null;
  }

  return agencies[0];
}

// ============================================================
// AGENCY AUTH HANDLERS
// ============================================================

/**
 * POST /api/ads/agency/signup
 */
export async function handleAgencySignup(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, password, agency_name, website } = body;

    if (!email || !password || !agency_name) {
      return jsonResponse({ error: 'Email, password, and agency name are required' }, 400, corsHeaders);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400, corsHeaders);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400, corsHeaders);
    }

    if (agency_name.length < 2 || agency_name.length > 100) {
      return jsonResponse({ error: 'Agency name must be 2-100 characters' }, 400, corsHeaders);
    }

    if (website && !isValidUrl(website)) {
      return jsonResponse({ error: 'Invalid website URL' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Check if email already exists
    const { data: existing } = await supabase
      .from('ads.agencies')
      .select('id', { filter: `email=eq.${email.toLowerCase()}` });

    if (existing && existing.length > 0) {
      // Generic message to prevent account enumeration
      return jsonResponse({ error: 'Unable to create account. Please try again or contact support.' }, 400, corsHeaders);
    }

    // Create Supabase user
    let supabaseUser;
    try {
      supabaseUser = await supabaseAdminSignUp(env, email.toLowerCase(), password);
    } catch (err) {
      // Generic message to prevent account enumeration
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        return jsonResponse({ error: 'Unable to create account. Please try again or contact support.' }, 400, corsHeaders);
      }
      throw err;
    }

    const createdUserId = getCreatedUserId(supabaseUser);
    if (!createdUserId) {
      throw new Error('Failed to create agency auth user');
    }

    // AI vetting
    const vetting = await vetAdvertiser(env, { email, company_name: agency_name, website });

    // Create agency profile
    const { data: agency, error } = await supabase
      .from('ads.agencies')
      .insert({
        user_id: createdUserId,
        email: email.toLowerCase(),
        password_hash: null,
        agency_name,
        website: website || null,
        contact_email: email.toLowerCase(),
        status: vetting.score >= 80 ? 'approved' : 'pending',
        vetting_score: vetting.score,
        vetting_reason: vetting.reason,
        vetted_at: new Date().toISOString(),
        vetted_by: 'ai',
        commission_rate: 15,
        balance_cents: 0,
      });

    if (error) {
      console.error('[Agency] Signup error:', error);
      return jsonResponse({ error: 'Failed to create account' }, 500, corsHeaders);
    }

    // Sign in to get session
    const session = await supabaseSignIn(env, email.toLowerCase(), password);

    const response = jsonResponse({
      success: true,
      agency: {
        id: agency.id,
        email: agency.email,
        agency_name: agency.agency_name,
        status: agency.status,
      },
    }, 201, corsHeaders);

    response.headers.set('Set-Cookie', buildAgencyCookie(session, isProduction(env)));
    return response;
  } catch (err) {
    console.error('[Agency] Signup error:', err);
    return jsonResponse({ error: sanitizeErrorMessage(err.message, 'Internal server error') }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/agency/login
 */
export async function handleAgencyLogin(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse({ error: 'Email and password are required' }, 400, corsHeaders);
    }

    let session;
    try {
      session = await supabaseSignIn(env, email.toLowerCase(), password);
    } catch (err) {
      return jsonResponse({ error: 'Invalid email or password' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Find agency by user_id
    const { data: agencies } = await supabase
      .from('ads.agencies')
      .select('*', { filter: `user_id=eq.${session.user.id}` });

    let agency = agencies?.[0];
    if (!agency) {
      // Try by email
      const { data: byEmail } = await supabase
        .from('ads.agencies')
        .select('*', { filter: `email=eq.${email.toLowerCase()}` });
      agency = byEmail?.[0];
      
      if (agency && !agency.user_id) {
        await supabase.from('ads.agencies').update(
          { user_id: session.user.id },
          `id=eq.${agency.id}`
        );
      }
    }

    if (!agency) {
      // Generic message to prevent account enumeration
      return jsonResponse({ error: 'Invalid email or password' }, 401, corsHeaders);
    }

    if (agency.status === 'suspended') {
      // Generic message to prevent account enumeration
      return jsonResponse({ error: 'Invalid email or password' }, 401, corsHeaders);
    }

    await supabase.from('ads.agencies').update(
      { last_login_at: new Date().toISOString() },
      `id=eq.${agency.id}`
    );

    const response = jsonResponse({
      success: true,
      agency: {
        id: agency.id,
        email: agency.email,
        agency_name: agency.agency_name,
        website: agency.website,
        status: agency.status,
        balance_cents: agency.balance_cents,
        commission_rate: agency.commission_rate,
        created_at: agency.created_at,
      },
    }, 200, corsHeaders);

    response.headers.set('Set-Cookie', buildAgencyCookie(session, isProduction(env)));
    return response;
  } catch (err) {
    console.error('[Agency] Login error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/agency/logout
 * Clear cookie AND revoke server-side session
 */
export async function handleAgencyLogout(request, env, corsHeaders) {
  try {
    // Get current session to revoke it server-side
    const cookies = request.headers.get('Cookie') || '';
    const cookieMatch = cookies.match(/agency-auth=([^;]+)/);
    
    if (cookieMatch) {
      try {
        const session = JSON.parse(decodeURIComponent(cookieMatch[1]));
        if (session.access_token) {
          // Revoke session in Supabase
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
  response.headers.set('Set-Cookie', buildClearAgencyCookie(isProduction(env)));
  return response;
}

/**
 * GET /api/ads/agency/me
 */
export async function handleAgencyMe(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    return jsonResponse({
      agency: {
        id: agency.id,
        email: agency.email,
        agency_name: agency.agency_name,
        website: agency.website,
        contact_email: agency.contact_email,
        status: agency.status,
        balance_cents: agency.balance_cents,
        commission_rate: agency.commission_rate,
        created_at: agency.created_at,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] Me error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

// ============================================================
// CLIENT MANAGEMENT HANDLERS
// ============================================================

/**
 * GET /api/ads/agency/clients
 */
export async function handleListClients(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: clients, error } = await supabase
      .from('ads.agency_clients')
      .select('*, advertiser:ads.advertisers(*)', {
        filter: `agency_id=eq.${agency.id}`,
        order: 'created_at.desc',
      });

    if (error) {
      console.error('[Agency] List clients error:', error);
      return jsonResponse({ error: 'Failed to load clients' }, 500, corsHeaders);
    }

    return jsonResponse({ clients: clients || [] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] List clients error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/agency/clients
 * Create a new client advertiser under this agency
 */
export async function handleCreateClient(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (agency.status !== 'approved') {
      return jsonResponse({ error: 'Agency must be approved to create clients' }, 403, corsHeaders);
    }

    const body = await request.json();
    const { email, password, company_name, website, commission_rate } = body;

    if (!email || !password || !company_name) {
      return jsonResponse({ error: 'Email, password, and company name are required' }, 400, corsHeaders);
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: 'Invalid email format' }, 400, corsHeaders);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400, corsHeaders);
    }

    // Use agency's default commission or custom
    const clientCommission = commission_rate !== undefined
      ? Math.min(Math.max(commission_rate, 0), 50)
      : agency.commission_rate;

    // Create Supabase user for client
    let supabaseUser;
    try {
      supabaseUser = await supabaseAdminSignUp(env, email.toLowerCase(), password);
    } catch (err) {
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        return jsonResponse({ error: 'Email already registered' }, 409, corsHeaders);
      }
      throw err;
    }

    // Create advertiser (auto-approved since agency is approved)
    const { data: advertiser, error: advError } = await supabase
      .from('ads.advertisers')
      .insert({
        user_id: supabaseUser.id,
        email: email.toLowerCase(),
        password_hash: null,
        company_name,
        website: website || null,
        contact_email: email.toLowerCase(),
        status: 'approved',
        vetting_score: 100,
        vetting_reason: `Created by approved agency: ${agency.agency_name}`,
        vetted_at: new Date().toISOString(),
        vetted_by: 'agency',
      });

    if (advError) {
      console.error('[Agency] Create client advertiser error:', advError);
      return jsonResponse({ error: 'Failed to create client' }, 500, corsHeaders);
    }

    // Create agency-client link
    const { data: client, error: clientError } = await supabase
      .from('ads.agency_clients')
      .insert({
        agency_id: agency.id,
        advertiser_id: advertiser.id,
        commission_rate: clientCommission,
      });

    if (clientError) {
      console.error('[Agency] Create client link error:', clientError);
      return jsonResponse({ error: 'Failed to link client' }, 500, corsHeaders);
    }

    return jsonResponse({
      success: true,
      client: {
        ...client,
        advertiser,
      },
    }, 201, corsHeaders);
  } catch (err) {
    console.error('[Agency] Create client error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * PUT /api/ads/agency/clients/:id/commission
 */
export async function handleUpdateClientCommission(request, env, corsHeaders, clientId) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (!UUID_RE.test(clientId)) {
      return jsonResponse({ error: 'Invalid client ID' }, 400, corsHeaders);
    }

    const body = await request.json();
    const { commission_rate } = body;

    if (commission_rate === undefined || commission_rate < 0 || commission_rate > 50) {
      return jsonResponse({ error: 'Commission rate must be between 0 and 50' }, 400, corsHeaders);
    }

    const { data: client, error } = await supabase
      .from('ads.agency_clients')
      .update(
        { commission_rate, updated_at: new Date().toISOString() },
        `id=eq.${clientId}&agency_id=eq.${agency.id}`
      );

    if (error) {
      console.error('[Agency] Update commission error:', error);
      return jsonResponse({ error: 'Failed to update commission' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true, client }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] Update commission error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

// ============================================================
// EARNINGS HANDLERS
// ============================================================

/**
 * GET /api/ads/agency/earnings
 */
export async function handleAgencyEarnings(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Get earnings from agency_earnings table
    const { data: earnings, error } = await supabase
      .from('ads.agency_earnings')
      .select('*', {
        filter: `agency_id=eq.${agency.id}`,
        order: 'created_at.desc',
        limit: 100,
      });

    if (error) {
      console.error('[Agency] Get earnings error:', error);
      return jsonResponse({ error: 'Failed to load earnings' }, 500, corsHeaders);
    }

    // Calculate totals
    const totalEarned = (earnings || []).reduce((sum, e) => sum + e.amount_cents, 0);
    const pendingPayout = agency.balance_cents;

    return jsonResponse({
      earnings: earnings || [],
      totalEarned,
      pendingPayout,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] Get earnings error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/agency/payout
 */
export async function handleAgencyPayout(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (agency.balance_cents < 10000) {
      return jsonResponse({ error: 'Minimum payout is $100' }, 400, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const requestedAmount = body.amount_cents || agency.balance_cents;

    if (typeof requestedAmount !== 'number' || requestedAmount <= 0) {
      return jsonResponse({ error: 'Invalid payout amount' }, 400, corsHeaders);
    }
    if (requestedAmount > agency.balance_cents) {
      return jsonResponse({ error: 'Insufficient balance' }, 400, corsHeaders);
    }
    if (requestedAmount < 10000) {
      return jsonResponse({ error: 'Minimum payout is $100' }, 400, corsHeaders);
    }

    // SECURITY: Atomic conditional deduction to prevent double-withdrawal race condition.
    // Two concurrent payout requests both reading balance=20000 would both succeed without this.
    // We use a conditional UPDATE that only succeeds if balance is still sufficient.
    const { data: updatedAgency, error: deductError } = await supabase
      .from('ads.agencies')
      .update(
        {
          balance_cents: agency.balance_cents - requestedAmount,
          updated_at: new Date().toISOString(),
        },
        `id=eq.${agency.id}&balance_cents=gte.${requestedAmount}`
      );

    // If the update affected 0 rows, balance was already deducted by a concurrent request
    if (deductError || !updatedAgency) {
      return jsonResponse({ error: 'Payout failed — balance may have changed. Please try again.' }, 409, corsHeaders);
    }

    const newBalance = agency.balance_cents - requestedAmount;

    // Create payout record after successful deduction
    const { data: payout, error } = await supabase
      .from('ads.agency_payouts')
      .insert({
        agency_id: agency.id,
        amount_cents: requestedAmount,
        status: 'pending',
        payout_method: body.payout_method || 'bank_transfer',
        payout_details: body.payout_details || null,
      });

    if (error) {
      console.error('[Agency] Payout record error:', error);
      // Balance already deducted — restore it
      await supabase.from('ads.agencies').update(
        { balance_cents: agency.balance_cents, updated_at: new Date().toISOString() },
        `id=eq.${agency.id}`
      );
      return jsonResponse({ error: 'Failed to request payout' }, 500, corsHeaders);
    }

    // Record transaction
    await supabase.from('ads.agency_transactions').insert({
      agency_id: agency.id,
      type: 'payout',
      amount_cents: -requestedAmount,
      balance_after_cents: newBalance,
      description: `Payout request: $${(requestedAmount / 100).toFixed(2)}`,
    });

    // Send notification email to admin for processing
    try {
      const { getSecret } = await import('../../utils/secrets.js');
      const resendKey = await getSecret(env.RESEND_API_KEY);
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Philosify Ads <ads@philosify.org>',
            to: ['admin@philosify.org'],
            subject: `Agency Payout Request: $${(requestedAmount / 100).toFixed(2)}`,
            text: `Agency "${agency.company_name}" (${agency.email}) has requested a payout of $${(requestedAmount / 100).toFixed(2)}.

Method: ${body.payout_method || 'bank_transfer'}
Agency ID: ${agency.id}

Please process in Stripe dashboard or via bank transfer.`,
          }),
        });
      }
    } catch (emailErr) {
      console.warn('[Agency] Payout notification email failed:', emailErr.message);
    }

    return jsonResponse({
      success: true,
      payout_id: payout?.id,
      amount_cents: requestedAmount,
      new_balance_cents: newBalance,
      status: 'pending',
      message: 'Payout request submitted. Processing typically takes 3-5 business days.',
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] Payout request error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

// ============================================================
// CAMPAIGN MANAGEMENT (ON BEHALF OF CLIENTS)
// ============================================================

/**
 * GET /api/ads/agency/clients/:clientId/campaigns
 */
export async function handleAgencyListClientCampaigns(request, env, corsHeaders, clientId) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (!UUID_RE.test(clientId)) {
      return jsonResponse({ error: 'Invalid client ID' }, 400, corsHeaders);
    }

    // Verify client belongs to agency
    const { data: clients } = await supabase
      .from('ads.agency_clients')
      .select('advertiser_id', { filter: `agency_id=eq.${agency.id}&advertiser_id=eq.${clientId}` });

    if (!clients || clients.length === 0) {
      return jsonResponse({ error: 'Client not found' }, 404, corsHeaders);
    }

    const { data: campaigns, error } = await supabase
      .from('ads.ad_campaigns')
      .select('*', {
        filter: `advertiser_id=eq.${clientId}`,
        order: 'created_at.desc',
      });

    if (error) {
      console.error('[Agency] List client campaigns error:', error);
      return jsonResponse({ error: 'Failed to load campaigns' }, 500, corsHeaders);
    }

    return jsonResponse({ campaigns: campaigns || [] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] List client campaigns error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/agency/clients/:clientId/campaigns
 */
export async function handleAgencyCreateClientCampaign(request, env, corsHeaders, clientId) {
  try {
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Verify client belongs to agency
    const { data: clients } = await supabase
      .from('ads.agency_clients')
      .select('*', { filter: `agency_id=eq.${agency.id}&advertiser_id=eq.${clientId}` });

    if (!clients || clients.length === 0) {
      return jsonResponse({ error: 'Client not found' }, 404, corsHeaders);
    }

    const body = await request.json();
    const { name, placement, duration, target_url, budget_cents, creative_url } = body;

    if (!name || name.length < 2 || name.length > 100) {
      return jsonResponse({ error: 'Campaign name must be 2-100 characters' }, 400, corsHeaders);
    }

    if (!['sidebar', 'constellation'].includes(placement)) {
      return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
    }

    const validDurations = placement === 'sidebar' ? [5, 10, 15, 20] : [5];
    if (!validDurations.includes(duration)) {
      return jsonResponse({ error: 'Invalid duration for placement' }, 400, corsHeaders);
    }

    if (!target_url || !isValidUrl(target_url)) {
      return jsonResponse({ error: 'Invalid target URL' }, 400, corsHeaders);
    }

    if (!budget_cents || budget_cents < 10000) {
      return jsonResponse({ error: 'Minimum budget is $100' }, 400, corsHeaders);
    }

    if (!creative_url) {
      return jsonResponse({ error: 'Creative URL is required' }, 400, corsHeaders);
    }

    const cpm_cents = getCpmCents(placement, duration);
    if (!cpm_cents) {
      return jsonResponse({ error: 'Invalid placement/duration combination' }, 400, corsHeaders);
    }

    const { data: campaign, error } = await supabase
      .from('ads.ad_campaigns')
      .insert({
        advertiser_id: clientId,
        name,
        placement,
        duration,
        target_url,
        budget_cents,
        creative_url,
        cpm_cents,
        status: 'active',
        approved_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Agency] Create client campaign error:', error);
      return jsonResponse({ error: 'Failed to create campaign' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true, campaign }, 201, corsHeaders);
  } catch (err) {
    console.error('[Agency] Create client campaign error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * PUT /api/ads/agency/clients/:clientId/campaigns/:campaignId
 */
export async function handleAgencyUpdateClientCampaign(request, env, corsHeaders, clientId, campaignId) {
  try {
    if (!UUID_RE.test(clientId) || !UUID_RE.test(campaignId)) {
      return jsonResponse({ error: 'Invalid ID format' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Verify client belongs to agency
    const { data: clients } = await supabase
      .from('ads.agency_clients')
      .select('*', { filter: `agency_id=eq.${agency.id}&advertiser_id=eq.${clientId}` });

    if (!clients || clients.length === 0) {
      return jsonResponse({ error: 'Client not found' }, 404, corsHeaders);
    }

    // Get existing campaign
    const { data: existing } = await supabase
      .from('ads.ad_campaigns')
      .select('*', { filter: `id=eq.${campaignId}&advertiser_id=eq.${clientId}` });

    if (!existing || existing.length === 0) {
      return jsonResponse({ error: 'Campaign not found' }, 404, corsHeaders);
    }

    const campaign = existing[0];
    const body = await request.json();
    const updates = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      if (body.name.length < 2 || body.name.length > 100) {
        return jsonResponse({ error: 'Campaign name must be 2-100 characters' }, 400, corsHeaders);
      }
      updates.name = body.name;
    }

    if (body.target_url !== undefined) {
      if (!isValidUrl(body.target_url)) {
        return jsonResponse({ error: 'Invalid target URL' }, 400, corsHeaders);
      }
      updates.target_url = body.target_url;
    }

    if (body.creative_url !== undefined) {
      updates.creative_url = body.creative_url;
    }

    if (body.budget_cents !== undefined) {
      if (body.budget_cents < 10000) {
        return jsonResponse({ error: 'Minimum budget is $100' }, 400, corsHeaders);
      }
      if (body.budget_cents < campaign.spent_cents) {
        return jsonResponse({ error: 'Budget cannot be less than amount spent' }, 400, corsHeaders);
      }
      updates.budget_cents = body.budget_cents;
      if (campaign.status === 'exhausted' && body.budget_cents > campaign.spent_cents) {
        updates.status = 'active';
      }
    }

    if (body.status !== undefined) {
      if (body.status === 'paused' && campaign.status === 'active') {
        updates.status = 'paused';
        updates.paused_at = new Date().toISOString();
      } else if (body.status === 'active' && campaign.status === 'paused') {
        updates.status = 'active';
        updates.paused_at = null;
      }
    }

    const { data: updated, error } = await supabase
      .from('ads.ad_campaigns')
      .update(updates, `id=eq.${campaignId}`);

    if (error) {
      console.error('[Agency] Update client campaign error:', error);
      return jsonResponse({ error: 'Failed to update campaign' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true, campaign: updated }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] Update client campaign error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * DELETE /api/ads/agency/clients/:clientId/campaigns/:campaignId
 */
export async function handleAgencyDeleteClientCampaign(request, env, corsHeaders, clientId, campaignId) {
  try {
    if (!UUID_RE.test(clientId) || !UUID_RE.test(campaignId)) {
      return jsonResponse({ error: 'Invalid ID format' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const agency = await getAgencyFromRequest(env, request, supabase);

    if (!agency) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Verify client belongs to agency
    const { data: clients } = await supabase
      .from('ads.agency_clients')
      .select('*', { filter: `agency_id=eq.${agency.id}&advertiser_id=eq.${clientId}` });

    if (!clients || clients.length === 0) {
      return jsonResponse({ error: 'Client not found' }, 404, corsHeaders);
    }

    // Verify campaign belongs to client
    const { data: existing } = await supabase
      .from('ads.ad_campaigns')
      .select('id', { filter: `id=eq.${campaignId}&advertiser_id=eq.${clientId}` });

    if (!existing || existing.length === 0) {
      return jsonResponse({ error: 'Campaign not found' }, 404, corsHeaders);
    }

    const { error } = await supabase
      .from('ads.ad_campaigns')
      .delete(`id=eq.${campaignId}`);

    if (error) {
      console.error('[Agency] Delete client campaign error:', error);
      return jsonResponse({ error: 'Failed to delete campaign' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Agency] Delete client campaign error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}
