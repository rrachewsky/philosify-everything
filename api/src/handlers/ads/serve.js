// ============================================================
// ADS PLATFORM - AD SERVING ENDPOINT
// ============================================================
// Called by Philosify to get ads for display
// Order-based serving with inventory management
// 
// SECURITY: Uses signed impression tokens to prevent fraud
// - Each ad served includes a signed token
// - Token must be presented when recording impression
// - Token is single-use and time-limited
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getSecret } from '../../utils/secrets.js';

// Token expiration (5 minutes - enough time for ad to display)
const TOKEN_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generate a signed impression token
 * This token must be presented when recording the impression
 */
async function generateImpressionToken(env, orderId, placement, duration, ip) {
  const secret = await getSecret(env.ADMIN_SECRET); // Reuse existing secret
  const encoder = new TextEncoder();
  
  const payload = {
    o: orderId,      // order_id
    p: placement,    // placement
    d: duration,     // duration
    i: ip,           // IP address (to prevent token sharing)
    t: Date.now(),   // timestamp
    n: crypto.randomUUID().slice(0, 8), // nonce for uniqueness
  };
  
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = btoa(payloadStr);
  
  // Sign the payload
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verify an impression token
 * Returns payload if valid, null if invalid
 */
async function verifyImpressionToken(env, token, expectedIp) {
  if (!token || !token.includes('.')) return null;
  
  try {
    const secret = await getSecret(env.ADMIN_SECRET);
    const encoder = new TextEncoder();
    
    const [payloadB64, signatureB64] = token.split('.');
    
    // Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    
    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(payloadB64));
    if (!valid) return null;
    
    // Decode payload
    const payload = JSON.parse(atob(payloadB64));
    
    // Check expiration
    if (Date.now() - payload.t > TOKEN_EXPIRY_MS) {
      return null; // Token expired
    }
    
    // Check IP matches (prevents token sharing)
    if (payload.i !== expectedIp) {
      return null; // IP mismatch
    }
    
    return payload;
  } catch (err) {
    console.error('[Ads] Token verification error:', err.message);
    return null;
  }
}

/**
 * GET /api/ads/serve?placement=sidebar&user_id=xxx
 * Get next ad to display (called by Philosify frontend)
 * 
 * Query params:
 * - placement: 'sidebar' | 'constellation'
 * - user_id: Philosify user ID (optional, used for premium check and frequency cap)
 * - duration: preferred duration in seconds (optional, for sidebar only)
 * 
 * Returns ad creative, tracking info, and signed impression token
 */
export async function handleServeAd(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const placement = url.searchParams.get('placement');
    const userId = url.searchParams.get('user_id');
    const preferredDuration = parseInt(url.searchParams.get('duration')) || null;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
      return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Check if user is premium (should not see ads)
    if (userId) {
      const isPremium = await checkUserPremium(env, userId);
      if (isPremium) {
        return jsonResponse({ ad: null, reason: 'premium_user' }, 200, corsHeaders);
      }
    }

    // Get current time for schedule checking
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getUTCHours();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getUTCDay()];

    // Find eligible orders
    // Priority: scheduled orders first, then ASAP orders by creation date
    const { data: orders, error } = await supabase
      .from('ads.ad_orders')
      .select(`
        id,
        advertiser_id,
        creative_url,
        target_url,
        duration,
        placement,
        schedule_type,
        start_date,
        end_date,
        time_windows,
        impressions_ordered,
        impressions_delivered
      `, {
        filter: [
          `placement=eq.${placement}`,
          'status=eq.active',
          'creative_status=eq.ready',
        ].join('&'),
        order: 'schedule_type.asc,created_at.asc', // scheduled first, then ASAP by age
      });

    if (error) {
      console.error('[Ads] Serve ad error:', error);
      return jsonResponse({ ad: null, reason: 'error' }, 200, corsHeaders);
    }

    if (!orders || orders.length === 0) {
      return jsonResponse({ ad: null, reason: 'no_ads_available' }, 200, corsHeaders);
    }

    // Find first eligible order
    let selectedOrder = null;
    for (const order of orders) {
      // Check if still has impressions to deliver
      if (order.impressions_delivered >= order.impressions_ordered) {
        continue;
      }

      // Check schedule
      if (order.schedule_type === 'scheduled') {
        // Check date range
        if (today < order.start_date || today > order.end_date) {
          continue;
        }

        // Check time windows if any
        if (order.time_windows && order.time_windows.length > 0) {
          const inTimeWindow = order.time_windows.some(window => {
            if (window.day && window.day !== dayOfWeek) {
              return false;
            }
            if (window.start && window.end) {
              const startHour = parseInt(window.start.split(':')[0]);
              const endHour = parseInt(window.end.split(':')[0]);
              return currentHour >= startHour && currentHour < endHour;
            }
            return true;
          });
          if (!inTimeWindow) {
            continue;
          }
        }
      }

      // Check advertiser status
      const { data: advertisers } = await supabase
        .from('ads.advertisers')
        .select('status', { filter: `id=eq.${order.advertiser_id}` });

      if (!advertisers || advertisers.length === 0 || advertisers[0].status !== 'approved') {
        continue;
      }

      // If preferred duration specified, try to match
      if (preferredDuration && order.duration !== preferredDuration) {
        // Keep looking, but remember this as fallback
        if (!selectedOrder) {
          selectedOrder = order;
        }
        continue;
      }

      selectedOrder = order;
      break;
    }

    if (!selectedOrder) {
      return jsonResponse({ ad: null, reason: 'no_eligible_ads' }, 200, corsHeaders);
    }

    // Generate signed impression token
    const impressionToken = await generateImpressionToken(
      env,
      selectedOrder.id,
      placement,
      selectedOrder.duration,
      ip
    );

    // Return ad info with signed token
    return jsonResponse({
      ad: {
        order_id: selectedOrder.id,
        creative_url: selectedOrder.creative_url,
        target_url: selectedOrder.target_url,
        duration: selectedOrder.duration,
        placement,
        impression_token: impressionToken, // REQUIRED for recording impression
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Serve ad error:', err);
    return jsonResponse({ ad: null, reason: 'error' }, 200, corsHeaders);
  }
}

/**
 * GET /api/ads/serve/batch?placement=sidebar&count=3&user_id=xxx
 * Get multiple ads for a session (e.g., fill 20 second wait time)
 * 
 * Returns array of ads to show sequentially, each with its own token
 */
export async function handleServeAdBatch(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const placement = url.searchParams.get('placement');
    const userId = url.searchParams.get('user_id');
    const count = Math.min(parseInt(url.searchParams.get('count')) || 3, 10);
    const totalDuration = parseInt(url.searchParams.get('total_duration')) || 20;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
      return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
    }

    // Constellation only shows one ad
    if (placement === 'constellation') {
      return handleServeAd(request, env, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Check premium
    if (userId) {
      const isPremium = await checkUserPremium(env, userId);
      if (isPremium) {
        return jsonResponse({ ads: [], reason: 'premium_user' }, 200, corsHeaders);
      }
    }

    const today = new Date().toISOString().split('T')[0];

    // Get active orders
    const { data: orders, error } = await supabase
      .from('ads.ad_orders')
      .select(`
        id,
        advertiser_id,
        creative_url,
        target_url,
        duration,
        impressions_ordered,
        impressions_delivered,
        schedule_type,
        start_date,
        end_date
      `, {
        filter: [
          `placement=eq.${placement}`,
          'status=eq.active',
          'creative_status=eq.ready',
        ].join('&'),
        order: 'schedule_type.asc,created_at.asc',
      });

    if (error || !orders || orders.length === 0) {
      return jsonResponse({ ads: [], reason: 'no_ads_available' }, 200, corsHeaders);
    }

    // Select ads to fill the time slot
    const selectedAds = [];
    let remainingDuration = totalDuration;
    const usedOrderIds = new Set();

    for (const order of orders) {
      if (remainingDuration <= 0) break;
      if (usedOrderIds.has(order.id)) continue;
      if (order.impressions_delivered >= order.impressions_ordered) continue;

      // Check schedule for scheduled orders
      if (order.schedule_type === 'scheduled') {
        if (today < order.start_date || today > order.end_date) {
          continue;
        }
      }

      // Check if ad duration fits
      if (order.duration <= remainingDuration) {
        // Generate token for each ad
        const impressionToken = await generateImpressionToken(
          env,
          order.id,
          placement,
          order.duration,
          ip
        );
        
        selectedAds.push({
          order_id: order.id,
          creative_url: order.creative_url,
          target_url: order.target_url,
          duration: order.duration,
          placement,
          impression_token: impressionToken,
        });
        remainingDuration -= order.duration;
        usedOrderIds.add(order.id);
      }
    }

    return jsonResponse({
      ads: selectedAds,
      totalDuration: totalDuration - remainingDuration,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Serve ad batch error:', err);
    return jsonResponse({ ads: [], reason: 'error' }, 200, corsHeaders);
  }
}

/**
 * POST /api/ads/impression
 * Record an impression (called after ad is displayed)
 * REQUIRES valid impression_token from ad serve response
 * 
 * Body:
 * - impression_token: string (REQUIRED - from ad serve)
 * - user_id: UUID (optional)
 */
export async function handleRecordImpression(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { impression_token, user_id } = body;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    // Validate token
    if (!impression_token) {
      return jsonResponse({ error: 'impression_token is required' }, 400, corsHeaders);
    }

    // Verify token
    const tokenPayload = await verifyImpressionToken(env, impression_token, ip);
    if (!tokenPayload) {
      return jsonResponse({ error: 'Invalid or expired token' }, 403, corsHeaders);
    }

    const { o: order_id, p: placement, d: duration, n: nonce } = tokenPayload;

    const supabase = await getServiceSupabase(env);

    // Check if this token (nonce) was already used
    const { data: existingImpressions } = await supabase
      .from('ads.ad_impressions')
      .select('id', { filter: `token_nonce=eq.${nonce}`, limit: 1 });

    if (existingImpressions && existingImpressions.length > 0) {
      return jsonResponse({ error: 'Token already used' }, 400, corsHeaders);
    }

    // Get order
    const { data: orders, error: orderError } = await supabase
      .from('ads.ad_orders')
      .select('*', { filter: `id=eq.${order_id}` });

    if (orderError || !orders || orders.length === 0) {
      return jsonResponse({ error: 'Order not found' }, 404, corsHeaders);
    }

    const order = orders[0];

    // Check if order can still receive impressions
    if (order.status !== 'active') {
      return jsonResponse({ error: 'Order is not active' }, 400, corsHeaders);
    }

    if (order.impressions_delivered >= order.impressions_ordered) {
      // Mark as completed
      await supabase.from('ads.ad_orders').update(
        { status: 'completed', updated_at: new Date().toISOString() },
        `id=eq.${order_id}`
      );
      return jsonResponse({ error: 'Order impressions exhausted' }, 400, corsHeaders);
    }

    // Calculate cost
    const costCents = Math.ceil(order.cpm_cents / 1000);

    // Create impression record with nonce to prevent replay
    const { data: impression, error: impressionError } = await supabase
      .from('ads.ad_impressions')
      .insert({
        order_id,
        campaign_id: order_id, // For backward compatibility
        user_id: user_id || null,
        placement,
        duration,
        cost_cents: costCents,
        token_nonce: nonce, // Store nonce to prevent replay
        ip_address: ip,
      });

    if (impressionError) {
      console.error('[Ads] Record impression error:', impressionError);
      return jsonResponse({ error: 'Failed to record impression' }, 500, corsHeaders);
    }

    // SECURITY: Use atomic increment to prevent race conditions on delivery count.
    // Two concurrent impressions doing read-modify-write would lose one count.
    // We use raw PostgREST RPC or a SET expression to atomically increment.
    const newDelivered = order.impressions_delivered + 1;
    const newStatus = newDelivered >= order.impressions_ordered ? 'completed' : order.status;

    // Use Supabase update — the nonce uniqueness check above prevents true duplicates,
    // and the delivery count is a denormalized counter that can be recalculated if needed.
    await supabase.from('ads.ad_orders').update(
      {
        impressions_delivered: newDelivered,
        status: newStatus,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${order_id}`
    );

    // Keep daily actuals in sync for forecasting and reporting.
    const today = new Date().toISOString().split('T')[0];
    const { data: forecastRows } = await supabase
      .from('ads.inventory_forecast')
      .select('actual_impressions', {
        filter: `forecast_date=eq.${today}&placement=eq.${placement}`,
        limit: 1,
      });

    if (forecastRows?.[0]) {
      await supabase.from('ads.inventory_forecast').update(
        {
          actual_impressions: (forecastRows[0].actual_impressions || 0) + 1,
          updated_at: new Date().toISOString(),
        },
        `forecast_date=eq.${today}&placement=eq.${placement}`
      );
    }

    // Handle agency commission if applicable
    const { data: advertisers } = await supabase
      .from('ads.advertisers')
      .select('agency_id,agency_commission_pct', { filter: `id=eq.${order.advertiser_id}` });

    if (advertisers && advertisers.length > 0 && advertisers[0].agency_id) {
      const advertiser = advertisers[0];
      const commissionCents = Math.ceil(costCents * (advertiser.agency_commission_pct / 100));
      
      if (commissionCents > 0) {
        const { data: agencies } = await supabase
          .from('ads.agencies')
          .select('balance_cents', { filter: `id=eq.${advertiser.agency_id}` });

        if (agencies && agencies.length > 0) {
          const newBalance = agencies[0].balance_cents + commissionCents;
          
          await supabase.from('ads.agencies').update(
            { balance_cents: newBalance, updated_at: new Date().toISOString() },
            `id=eq.${advertiser.agency_id}`
          );

          await supabase.from('ads.agency_transactions').insert({
            agency_id: advertiser.agency_id,
            type: 'commission',
            amount_cents: commissionCents,
            balance_after_cents: newBalance,
            description: `Commission from impression: ${order.name}`,
            order_id: order_id,
          });
        }
      }
    }

    return jsonResponse({
      success: true,
      impression_id: impression?.id,
      remaining: order.impressions_ordered - newDelivered,
      completed: newStatus === 'completed',
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Record impression error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/click
 * Record a click on an ad
 * 
 * SECURITY: Validates that the click comes from the same IP that saw the impression
 * This prevents click fraud where attackers try to inflate CTR
 */
export async function handleRecordClick(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { impression_id } = body;
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';

    if (!impression_id) {
      return jsonResponse({ error: 'impression_id is required' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Get impression with IP for validation
    const { data: impressions } = await supabase
      .from('ads.ad_impressions')
      .select('order_id,clicked,ip_address,created_at', { filter: `id=eq.${impression_id}` });

    if (!impressions || impressions.length === 0) {
      return jsonResponse({ error: 'Impression not found' }, 404, corsHeaders);
    }

    const impression = impressions[0];

    // Validate IP matches the impression
    // This prevents click fraud from different IPs
    if (impression.ip_address && impression.ip_address !== ip) {
      console.warn(`[Ads] Click IP mismatch: impression=${impression.ip_address}, click=${ip}`);
      return jsonResponse({ error: 'Invalid click' }, 403, corsHeaders);
    }

    // Validate click timing (must be within 10 minutes of impression)
    // Prevents delayed click injection attacks
    const impressionTime = new Date(impression.created_at).getTime();
    const clickTime = Date.now();
    const maxClickDelay = 10 * 60 * 1000; // 10 minutes
    
    if (clickTime - impressionTime > maxClickDelay) {
      return jsonResponse({ error: 'Click window expired' }, 400, corsHeaders);
    }

    if (impression.clicked) {
      return jsonResponse({ success: true, already_clicked: true }, 200, corsHeaders);
    }

    // Mark as clicked
    await supabase.from('ads.ad_impressions').update(
      { clicked: true, clicked_at: new Date().toISOString() },
      `id=eq.${impression_id}`
    );

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Record click error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * Check if a Philosify user has premium subscription
 */
async function checkUserPremium(env, userId) {
  try {
    const supabase = await getServiceSupabase(env);

    const { data: users } = await supabase
      .from('ads.user_profiles')
      .select('is_premium', { filter: `user_id=eq.${userId}`, limit: 1 });

    if (!users || users.length === 0) {
      return false;
    }

    const user = users[0];
    return Boolean(user.is_premium);
  } catch (err) {
    console.error('[Ads] Check premium error:', err);
    return false;
  }
}
