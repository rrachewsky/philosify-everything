// ============================================================
// ADS PLATFORM - ORDER MANAGEMENT
// ============================================================
// Create, manage, and track ad orders
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getAdvertiserFromRequest, isValidUrl } from './utils.js';
import { getSecret } from '../../utils/secrets.js';

// SECURITY: UUID validation for route parameters
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/ads/orders
 * List orders for the authenticated advertiser
 */
export async function handleListOrders(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    // Build filter
    // SECURITY: Validate status against allowlist to prevent PostgREST filter injection
    const VALID_ORDER_STATUSES = ['pending', 'active', 'completed', 'cancelled', 'refunded', 'paused'];
    const filters = [`advertiser_id=eq.${advertiser.id}`];
    if (status) {
      if (!VALID_ORDER_STATUSES.includes(status)) {
        return jsonResponse({ error: 'Invalid status filter' }, 400, corsHeaders);
      }
      filters.push(`status=eq.${status}`);
    }

    const { data: orders, error } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: filters.join('&'),
        order: 'created_at.desc',
        limit,
        offset,
      });

    if (error) {
      console.error('[Ads] List orders error:', error);
      return jsonResponse({ error: 'Failed to list orders' }, 500, corsHeaders);
    }

    return jsonResponse({ orders: orders || [] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] List orders error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/orders/:id
 * Get a specific order
 */
export async function handleGetOrder(request, env, corsHeaders, orderId) {
  try {
    if (!UUID_RE.test(orderId)) {
      return jsonResponse({ error: 'Invalid order ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: orders, error } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: `id=eq.${orderId}&advertiser_id=eq.${advertiser.id}`,
      });

    if (error || !orders || orders.length === 0) {
      return jsonResponse({ error: 'Order not found' }, 404, corsHeaders);
    }

    const order = orders[0];

    // Get reservations if any
    const { data: reservations } = await supabase
      .from('ads.order_reservations')
      .select('*,inventory:inventory_id(forecast_date,placement)', {
        filter: `order_id=eq.${orderId}`,
        order: 'created_at.asc',
      });

    // Get creative request if any
    let creativeRequest = null;
    if (order.creative_type === 'philosify') {
      const { data: requests } = await supabase
        .from('ads.creative_requests')
        .select('*', {
          filter: `order_id=eq.${orderId}`,
          limit: 1,
        });
      creativeRequest = requests?.[0] || null;
    }

    return jsonResponse({
      order,
      reservations: reservations || [],
      creativeRequest,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get order error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/orders
 * Create a new order (draft status, not yet paid)
 */
export async function handleCreateOrder(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const body = await request.json();
    const {
      name,
      placement,
      duration,
      impressions,
      target_url,
      creative_type,
      schedule_type,
      start_date,
      end_date,
      time_windows,
      // For self-uploaded creative
      creative_url,
      // For Philosify-created creative
      creative_brief,
      creative_assets_url,
      // Targeting criteria (optional)
      targeting,
    } = body;

    // Validate required fields
    if (!name || !placement || !duration || !impressions || !target_url || !creative_type || !schedule_type) {
      return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
    }

    // Validate placement
    if (!['sidebar', 'constellation'].includes(placement)) {
      return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
    }

    // Validate duration
    const validDurations = placement === 'constellation' ? [5] : [5, 10, 15, 20];
    if (!validDurations.includes(duration)) {
      return jsonResponse({ error: `Invalid duration for ${placement}` }, 400, corsHeaders);
    }

    // Validate impressions
    if (impressions < 1000) {
      return jsonResponse({ error: 'Minimum 1000 impressions required' }, 400, corsHeaders);
    }

    // Validate URL
    if (!isValidUrl(target_url)) {
      return jsonResponse({ error: 'Invalid target URL' }, 400, corsHeaders);
    }

    // Validate creative type
    if (!['self', 'philosify'].includes(creative_type)) {
      return jsonResponse({ error: 'Invalid creative_type' }, 400, corsHeaders);
    }

    // Validate schedule
    if (!['asap', 'scheduled'].includes(schedule_type)) {
      return jsonResponse({ error: 'Invalid schedule_type' }, 400, corsHeaders);
    }

    if (schedule_type === 'scheduled') {
      if (!start_date || !end_date) {
        return jsonResponse({ error: 'Scheduled orders require start_date and end_date' }, 400, corsHeaders);
      }
      // Validate dates
      const start = new Date(start_date);
      const end = new Date(end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        return jsonResponse({ error: 'start_date cannot be in the past' }, 400, corsHeaders);
      }
      if (end < start) {
        return jsonResponse({ error: 'end_date must be after start_date' }, 400, corsHeaders);
      }
    }

    // For self-upload, creative_url is required
    if (creative_type === 'self' && !creative_url) {
      return jsonResponse({ error: 'creative_url required for self-uploaded creatives' }, 400, corsHeaders);
    }

    // For Philosify creative, brief is required
    if (creative_type === 'philosify' && !creative_brief) {
      return jsonResponse({ error: 'creative_brief required for Philosify-created creatives' }, 400, corsHeaders);
    }

    // Get pricing
    const { data: cpmData } = await supabase
      .from('ads.pricing_config')
      .select('price_cents', {
        filter: `pricing_type=eq.cpm&placement=eq.${placement}&duration=eq.${duration}&is_active=eq.true`,
        limit: 1,
      });
    const cpmCents = cpmData?.[0]?.price_cents || 1000;

    // Get creative fee if applicable
    let creativeFeeCents = 0;
    if (creative_type === 'philosify') {
      const { data: feeData } = await supabase
        .from('ads.pricing_config')
        .select('price_cents', {
          filter: `pricing_type=eq.creative_fee&duration=eq.${duration}&is_active=eq.true`,
          limit: 1,
        });
      creativeFeeCents = feeData?.[0]?.price_cents || 15000;
    }

    // Calculate totals
    const subtotalCents = Math.ceil((impressions * cpmCents) / 1000);
    const totalCents = subtotalCents + creativeFeeCents;

    // Determine initial status
    const initialStatus = creative_type === 'self' ? 'draft' : 'draft';
    const creativeStatus = creative_type === 'self' ? 'ready' : 'pending';

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('ads.ad_orders')
      .insert({
        advertiser_id: advertiser.id,
        name,
        placement,
        duration,
        impressions_ordered: impressions,
        target_url,
        creative_type,
        creative_url: creative_type === 'self' ? creative_url : null,
        creative_status: creativeStatus,
        creative_brief: creative_type === 'philosify' ? creative_brief : null,
        creative_assets_url: creative_type === 'philosify' ? creative_assets_url : null,
        creative_fee_cents: creativeFeeCents,
        targeting: targeting || {},
        schedule_type,
        start_date: schedule_type === 'scheduled' ? start_date : null,
        end_date: schedule_type === 'scheduled' ? end_date : null,
        time_windows: time_windows || [],
        cpm_cents: cpmCents,
        subtotal_cents: subtotalCents,
        creative_fee_total_cents: creativeFeeCents,
        total_cents: totalCents,
        status: initialStatus,
      });

    if (orderError) {
      console.error('[Ads] Create order error:', orderError);
      return jsonResponse({ error: 'Failed to create order' }, 500, corsHeaders);
    }

    // If Philosify creative, create creative request
    if (creative_type === 'philosify' && order?.id) {
      await supabase.from('ads.creative_requests').insert({
        order_id: order.id,
        advertiser_id: advertiser.id,
        brief: creative_brief,
        brand_name: advertiser.company_name,
        logo_url: creative_assets_url,
        placement,
        duration,
        fee_cents: creativeFeeCents,
      });
    }

    return jsonResponse({
      order,
      pricing: {
        cpmCents,
        subtotalCents,
        creativeFeeCents,
        totalCents,
      },
    }, 201, corsHeaders);
  } catch (err) {
    console.error('[Ads] Create order error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * PUT /api/ads/orders/:id
 * Update an order (only allowed for draft/pending orders)
 */
export async function handleUpdateOrder(request, env, corsHeaders, orderId) {
  try {
    if (!UUID_RE.test(orderId)) {
      return jsonResponse({ error: 'Invalid order ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Verify ownership and editable status
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('*', { filter: `id=eq.${orderId}&advertiser_id=eq.${advertiser.id}` });

    if (!orders || orders.length === 0) {
      return jsonResponse({ error: 'Order not found' }, 404, corsHeaders);
    }

    const order = orders[0];
    if (!['draft', 'pending_creative', 'pending_approval'].includes(order.status)) {
      return jsonResponse({ error: 'Only draft or pending orders can be edited' }, 400, corsHeaders);
    }

    const body = await request.json();
    const updates = {};

    // Editable fields
    if (body.name !== undefined) updates.name = body.name;
    if (body.target_url !== undefined) {
      if (!isValidUrl(body.target_url)) {
        return jsonResponse({ error: 'Invalid target URL' }, 400, corsHeaders);
      }
      updates.target_url = body.target_url;
    }
    if (body.creative_url !== undefined) updates.creative_url = body.creative_url;
    if (body.creative_brief !== undefined) updates.creative_brief = body.creative_brief;
    if (body.targeting !== undefined) updates.targeting = body.targeting;

    // Schedule can only be changed for draft orders
    if (order.status === 'draft') {
      if (body.schedule_type !== undefined) updates.schedule_type = body.schedule_type;
      if (body.start_date !== undefined) updates.start_date = body.start_date;
      if (body.end_date !== undefined) updates.end_date = body.end_date;
      if (body.time_windows !== undefined) updates.time_windows = body.time_windows;
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: 'No valid fields to update' }, 400, corsHeaders);
    }

    updates.updated_at = new Date().toISOString();

    await supabase.from('ads.ad_orders').update(updates, `id=eq.${orderId}`);

    // Return updated order
    const { data: updated } = await supabase
      .from('ads.ad_orders')
      .select('*', { filter: `id=eq.${orderId}` });

    return jsonResponse({ order: updated?.[0] || null }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Update order error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/orders/:id/checkout
 * Create Stripe checkout session for an order
 */
export async function handleOrderCheckout(request, env, corsHeaders, orderId) {
  try {
    if (!UUID_RE.test(orderId)) {
      return jsonResponse({ error: 'Invalid order ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Get order
    const { data: orders, error: orderError } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: `id=eq.${orderId}&advertiser_id=eq.${advertiser.id}`,
      });

    if (orderError || !orders || orders.length === 0) {
      return jsonResponse({ error: 'Order not found' }, 404, corsHeaders);
    }

    const order = orders[0];

    if (order.status !== 'draft') {
      return jsonResponse({ error: 'Order has already been paid or is not in draft status' }, 400, corsHeaders);
    }

    const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);
    const frontendUrl = env.ADS_FRONTEND_URL || 'https://ads.philosify.org';

    // Build form params for Stripe API
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${frontendUrl}/orders/${orderId}?payment=success`);
    params.append('cancel_url', `${frontendUrl}/orders/${orderId}?payment=cancelled`);
    params.append('customer_email', advertiser.email);
    params.append('metadata[order_id]', orderId);
    params.append('metadata[advertiser_id]', advertiser.id);
    params.append('metadata[type]', 'ad_order');

    // Line item 1: Ad impressions
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Ad Order: ${order.name}`);
    params.append('line_items[0][price_data][product_data][description]', 
      `${order.impressions_ordered.toLocaleString()} impressions on ${order.placement} (${order.duration}s)`);
    params.append('line_items[0][price_data][unit_amount]', order.subtotal_cents.toString());
    params.append('line_items[0][quantity]', '1');

    // Line item 2: Creative fee (if applicable)
    if (order.creative_fee_total_cents > 0) {
      params.append('line_items[1][price_data][currency]', 'usd');
      params.append('line_items[1][price_data][product_data][name]', 'Creative Services');
      params.append('line_items[1][price_data][product_data][description]', 
        `Philosify-created ${order.duration}s ad creative`);
      params.append('line_items[1][price_data][unit_amount]', order.creative_fee_total_cents.toString());
      params.append('line_items[1][quantity]', '1');
    }

    // Create checkout session via Stripe API
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (!response.ok) {
      console.error('[Ads] Stripe checkout error:', session);
      return jsonResponse({ error: 'Failed to create checkout session' }, 500, corsHeaders);
    }

    // Update order with checkout session ID
    await supabase.from('ads.ad_orders').update(
      { stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() },
      `id=eq.${orderId}`
    );

    return jsonResponse({
      checkoutUrl: session.url,
      sessionId: session.id,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Order checkout error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/orders/:id/pause
 * Pause an active order
 */
export async function handlePauseOrder(request, env, corsHeaders, orderId) {
  try {
    if (!UUID_RE.test(orderId)) {
      return jsonResponse({ error: 'Invalid order ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: `id=eq.${orderId}&advertiser_id=eq.${advertiser.id}`,
      });

    if (!orders || orders.length === 0) {
      return jsonResponse({ error: 'Order not found' }, 404, corsHeaders);
    }

    const order = orders[0];

    if (order.status !== 'active') {
      return jsonResponse({ error: 'Only active orders can be paused' }, 400, corsHeaders);
    }

    await supabase.from('ads.ad_orders').update(
      { status: 'paused', updated_at: new Date().toISOString() },
      `id=eq.${orderId}`
    );

    return jsonResponse({ success: true, status: 'paused' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Pause order error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/orders/:id/resume
 * Resume a paused order
 */
export async function handleResumeOrder(request, env, corsHeaders, orderId) {
  try {
    if (!UUID_RE.test(orderId)) {
      return jsonResponse({ error: 'Invalid order ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: `id=eq.${orderId}&advertiser_id=eq.${advertiser.id}`,
      });

    if (!orders || orders.length === 0) {
      return jsonResponse({ error: 'Order not found' }, 404, corsHeaders);
    }

    const order = orders[0];

    if (order.status !== 'paused') {
      return jsonResponse({ error: 'Only paused orders can be resumed' }, 400, corsHeaders);
    }

    // Check if still has impressions to deliver
    if (order.impressions_delivered >= order.impressions_ordered) {
      return jsonResponse({ error: 'Order has already delivered all impressions' }, 400, corsHeaders);
    }

    await supabase.from('ads.ad_orders').update(
      { status: 'active', updated_at: new Date().toISOString() },
      `id=eq.${orderId}`
    );

    return jsonResponse({ success: true, status: 'active' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Resume order error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/orders/:id/cancel
 * Cancel an order and request refund
 */
export async function handleCancelOrder(request, env, corsHeaders, orderId) {
  try {
    if (!UUID_RE.test(orderId)) {
      return jsonResponse({ error: 'Invalid order ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: `id=eq.${orderId}&advertiser_id=eq.${advertiser.id}`,
      });

    if (!orders || orders.length === 0) {
      return jsonResponse({ error: 'Order not found' }, 404, corsHeaders);
    }

    const order = orders[0];

    // Can only cancel certain statuses
    const cancellableStatuses = ['draft', 'pending_creative', 'pending_approval', 'approved', 'paused'];
    if (!cancellableStatuses.includes(order.status)) {
      return jsonResponse({ 
        error: `Cannot cancel order in '${order.status}' status` 
      }, 400, corsHeaders);
    }

    // Calculate refund (if paid)
    let refundCents = 0;
    if (order.paid_at) {
      // Refund undelivered portion
      const deliveredCost = Math.ceil(
        (order.impressions_delivered / order.impressions_ordered) * order.subtotal_cents
      );
      refundCents = order.total_cents - deliveredCost;

      // Process Stripe refund if applicable
      if (order.stripe_payment_intent_id && refundCents > 0) {
        try {
          const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);
          const refundParams = new URLSearchParams();
          refundParams.append('payment_intent', order.stripe_payment_intent_id);
          refundParams.append('amount', refundCents.toString());

          const refundResponse = await fetch('https://api.stripe.com/v1/refunds', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: refundParams.toString(),
          });

          if (!refundResponse.ok) {
            const refundError = await refundResponse.json();
            console.error('[Ads] Stripe refund error:', refundError);
          }
        } catch (stripeErr) {
          console.error('[Ads] Stripe refund error:', stripeErr);
          // Continue with cancellation even if refund fails
        }
      }
    }

    // Release inventory reservations
    await supabase.rpc('ads.release_inventory', { p_order_id: orderId });

    // Update order
    await supabase.from('ads.ad_orders').update(
      { 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      },
      `id=eq.${orderId}`
    );

    return jsonResponse({ 
      success: true, 
      status: 'cancelled',
      refundCents,
      refund: refundCents > 0 ? `$${(refundCents / 100).toFixed(2)}` : null,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Cancel order error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * Webhook handler for order payments
 * Called when Stripe checkout completes
 */
export async function handleOrderPaymentWebhook(env, session) {
  try {
    const { order_id } = session.metadata;
    
    if (!order_id) {
      console.error('[Ads] Order webhook missing order_id');
      return;
    }

    const supabase = await getServiceSupabase(env);

    // Get the order
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('*', { filter: `id=eq.${order_id}` });

    if (!orders || orders.length === 0) {
      console.error('[Ads] Order not found for webhook:', order_id);
      return;
    }

    const order = orders[0];
    if (order.paid_at) {
      return;
    }

    // Update order status
    // Self-uploaded creatives with ready status go directly to active
    // Philosify-created creatives need the creative production workflow
    const newStatus = order.creative_type === 'self' && order.creative_status === 'ready'
      ? 'active'
      : order.creative_type === 'philosify'
        ? 'pending_creative'
        : 'pending_approval';
    
    await supabase.from('ads.ad_orders').update(
      {
        status: newStatus,
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${order_id}`
    );

    // Reserve inventory
    if (order.schedule_type === 'scheduled') {
      // Reserve specific dates
      const { error: rpcError } = await supabase.rpc('ads.reserve_inventory', {
        p_order_id: order_id,
        p_placement: order.placement,
        p_start_date: order.start_date,
        p_end_date: order.end_date,
        p_total_impressions: order.impressions_ordered,
      });
      if (rpcError) {
        console.error('[Ads] Reserve inventory error:', rpcError);
      }
    } else {
      // ASAP - reserve next 30 days
      const today = new Date();
      const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const { error: rpcError } = await supabase.rpc('ads.reserve_inventory', {
        p_order_id: order_id,
        p_placement: order.placement,
        p_start_date: today.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0],
        p_total_impressions: order.impressions_ordered,
      });
      if (rpcError) {
        console.error('[Ads] Reserve inventory error:', rpcError);
      }
    }

    console.log(`[Ads] Order ${order_id} paid, status: ${newStatus}`);

    // Send emails
    try {
      const { data: adv } = await supabase
        .from('ads.advertisers')
        .select('email,company_name', { filter: `id=eq.${order.advertiser_id}`, limit: 1 });
      if (adv?.[0]) {
        const { sendPaymentConfirmationEmail, sendCreativeRequestAdminEmail } = await import('./emails.js');
        sendPaymentConfirmationEmail(env, adv[0].email, order.name, order.total_cents).catch(() => {});
        if (newStatus === 'active') {
          const { sendCampaignLiveEmail } = await import('./emails.js');
          sendCampaignLiveEmail(env, adv[0].email, order.name).catch(() => {});
        }
        if (order.creative_type === 'philosify') {
          sendCreativeRequestAdminEmail(env, adv[0].company_name, order.name).catch(() => {});
        }
      }
    } catch (e) { console.warn('[AdsOrders] Payment email failed:', e.message); }
  } catch (err) {
    console.error('[Ads] Order payment webhook error:', err);
  }
}
