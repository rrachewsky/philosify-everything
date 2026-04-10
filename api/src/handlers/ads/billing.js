// ============================================================
// ADS PLATFORM - BILLING HANDLERS
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getSecret } from '../../utils/secrets.js';
import { getAdvertiserFromRequest } from './utils.js';
import { handleOrderPaymentWebhook } from './orders.js';
import { handlePlanPaymentWebhook } from './planner.js';

/**
 * GET /api/ads/billing/balance
 * Get current balance
 */
export async function handleGetBalance(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    return jsonResponse({ balance_cents: advertiser.balance_cents }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get balance error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/billing/transactions
 * Get transaction history
 */
export async function handleGetTransactions(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 50, 100);

    const { data: transactions, error } = await supabase
      .from('ads.advertiser_transactions')
      .select('*', {
        filter: `advertiser_id=eq.${advertiser.id}`,
        order: 'created_at.desc',
        limit,
      });

    if (error) {
      console.error('[Ads] Get transactions error:', error);
      return jsonResponse({ error: 'Failed to load transactions' }, 500, corsHeaders);
    }

    return jsonResponse({ transactions: transactions || [] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get transactions error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/billing/checkout
 * Create Stripe checkout session for adding funds
 */
export async function handleCreateCheckout(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const body = await request.json();
    const { amount_cents } = body;

    if (!amount_cents || amount_cents < 1000) {
      return jsonResponse({ error: 'Minimum amount is $10' }, 400, corsHeaders);
    }

    if (amount_cents > 1000000) {
      return jsonResponse({ error: 'Maximum amount is $10,000' }, 400, corsHeaders);
    }

    const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);

    // Create Stripe checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': 'Philosify Ads - Account Funding',
        'line_items[0][price_data][product_data][description]': `Add $${(amount_cents / 100).toFixed(2)} to your advertising balance`,
        'line_items[0][price_data][unit_amount]': amount_cents.toString(),
        'line_items[0][quantity]': '1',
        'success_url': `${env.ADS_FRONTEND_URL || 'https://ads.philosify.org'}/billing?success=true`,
        'cancel_url': `${env.ADS_FRONTEND_URL || 'https://ads.philosify.org'}/billing?canceled=true`,
        'client_reference_id': advertiser.id,
        'customer_email': advertiser.email,
        'metadata[advertiser_id]': advertiser.id,
        'metadata[type]': 'ads_funding',
        'metadata[amount_cents]': amount_cents.toString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Ads] Stripe checkout error:', error);
      return jsonResponse({ error: 'Failed to create checkout session' }, 500, corsHeaders);
    }

    const session = await response.json();

    return jsonResponse({ checkout_url: session.url }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Create checkout error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/billing/webhook
 * Handle Stripe webhook for completed payments
 */
export async function handleBillingWebhook(request, env, corsHeaders) {
  try {
    const body = await request.text();
    const signature = request.headers.get('Stripe-Signature');

    if (!signature) {
      return jsonResponse({ error: 'Missing signature' }, 400, corsHeaders);
    }

    const webhookSecret = await getSecret(env.STRIPE_ADS_WEBHOOK_SECRET);

    // Verify webhook signature
    const verified = await verifyStripeSignature(body, signature, webhookSecret);
    if (!verified) {
      return jsonResponse({ error: 'Invalid signature' }, 400, corsHeaders);
    }

    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const paymentType = session.metadata?.type;

      if (paymentType === 'ad_order') {
        await handleOrderPaymentWebhook(env, session);
        return jsonResponse({ received: true }, 200, corsHeaders);
      }

      if (paymentType === 'ad_plan') {
        await handlePlanPaymentWebhook(env, session);
        return jsonResponse({ received: true }, 200, corsHeaders);
      }

      // Verify this is an ads funding payment
      if (paymentType !== 'ads_funding') {
        return jsonResponse({ received: true }, 200, corsHeaders);
      }

      const advertiserId = session.metadata.advertiser_id;
      const amountCents = parseInt(session.metadata.amount_cents, 10);
      
      // SECURITY: Cross-check metadata amount against actual payment
      if (session.amount_total && amountCents !== session.amount_total) {
        console.error(`[Ads] Amount mismatch: metadata=${amountCents}, actual=${session.amount_total}`);
        return jsonResponse({ error: 'Amount mismatch' }, 400, corsHeaders);
      }

      if (!advertiserId || !amountCents) {
        console.error('[Ads] Webhook missing metadata:', session.metadata);
        return jsonResponse({ error: 'Missing metadata' }, 400, corsHeaders);
      }

      const supabase = await getServiceSupabase(env);

      // Check for duplicate processing
      const { data: existing } = await supabase
        .from('ads.advertiser_transactions')
        .select('id', { filter: `stripe_checkout_session_id=eq.${session.id}` });

      if (existing && existing.length > 0) {
        console.log('[Ads] Duplicate webhook ignored:', session.id);
        return jsonResponse({ received: true }, 200, corsHeaders);
      }

      // Get current balance
      const { data: advertisers } = await supabase
        .from('ads.advertisers')
        .select('balance_cents', { filter: `id=eq.${advertiserId}` });

      if (!advertisers || advertisers.length === 0) {
        console.error('[Ads] Advertiser not found:', advertiserId);
        return jsonResponse({ error: 'Advertiser not found' }, 400, corsHeaders);
      }

      const currentBalance = advertisers[0].balance_cents;
      const newBalance = currentBalance + amountCents;

      // Update balance
      await supabase.from('ads.advertisers').update(
        { balance_cents: newBalance, updated_at: new Date().toISOString() },
        `id=eq.${advertiserId}`
      );

      // Record transaction
      await supabase.from('ads.advertiser_transactions').insert({
        advertiser_id: advertiserId,
        type: 'deposit',
        amount_cents: amountCents,
        balance_after_cents: newBalance,
        description: 'Funds added via Stripe',
        stripe_payment_intent_id: session.payment_intent,
        stripe_checkout_session_id: session.id,
      });

      console.log(`[Ads] Funded ${advertiserId}: +$${(amountCents / 100).toFixed(2)}`);

      // Send deposit confirmation email
      try {
        const { data: adv } = await supabase
          .from('ads.advertisers')
          .select('email', { filter: `id=eq.${advertiserId}`, limit: 1 });
        if (adv?.[0]) {
          const { sendDepositConfirmationEmail } = await import('./emails.js');
          sendDepositConfirmationEmail(env, adv[0].email, amountCents).catch(() => {});
        }
      } catch (e) { console.warn('[AdsBilling] Deposit email failed:', e.message); }
    }

    return jsonResponse({ received: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Webhook error:', err);
    return jsonResponse({ error: 'Webhook processing failed' }, 500, corsHeaders);
  }
}

/**
 * Verify Stripe webhook signature
 */
async function verifyStripeSignature(payload, signature, secret) {
  try {
    const encoder = new TextEncoder();
    
    // Parse signature header
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {});

    const timestamp = parts.t;
    const expectedSig = parts.v1;

    if (!timestamp || !expectedSig) {
      return false;
    }

    // Check timestamp (reject if older than 5 minutes)
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (age > 300) {
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Timing-safe comparison
    if (computedSig.length !== expectedSig.length) return false;
    let diff = 0;
    for (let i = 0; i < computedSig.length; i++) {
      diff |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('[Ads] Signature verification error:', err);
    return false;
  }
}
