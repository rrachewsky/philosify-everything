// ============================================================
// ADS PLATFORM - INVENTORY MANAGEMENT
// ============================================================
// Browse available inventory, check availability, pricing
// ============================================================

import { getServiceSupabase, getSupabaseCredentials } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getAdvertiserFromRequest } from './utils.js';

/**
 * GET /api/ads/inventory
 * Browse available inventory by date range and placement
 * 
 * Query params:
 * - placement: 'sidebar' | 'constellation' (optional, returns both if not specified)
 * - start_date: YYYY-MM-DD (default: today)
 * - end_date: YYYY-MM-DD (default: 30 days from start)
 */
export async function handleGetInventory(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const placement = url.searchParams.get('placement');
    const startDateStr = url.searchParams.get('start_date');
    const endDateStr = url.searchParams.get('end_date');

    // Default dates
    const today = new Date();
    const startDate = startDateStr || today.toISOString().split('T')[0];
    const endDate = endDateStr || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const supabase = await getServiceSupabase(env);

    // Add filters
    const filters = [`forecast_date=gte.${startDate}`, `forecast_date=lte.${endDate}`];
    if (placement && ['sidebar', 'constellation'].includes(placement)) {
      filters.push(`placement=eq.${placement}`);
    }

    const { data: inventory, error } = await supabase
      .from('ads.inventory_forecast')
      .select(
      'forecast_date,placement,estimated_impressions,reserved_impressions,available_impressions',
      { filter: filters.join('&'), order: 'forecast_date.asc,placement.asc' }
    );

    if (error) {
      console.error('[Ads] Get inventory error:', error);
      return jsonResponse({ error: 'Failed to get inventory' }, 500, corsHeaders);
    }

    // Group by date
    const byDate = {};
    for (const row of inventory || []) {
      if (!byDate[row.forecast_date]) {
        byDate[row.forecast_date] = {};
      }
      byDate[row.forecast_date][row.placement] = {
        estimated: row.estimated_impressions,
        reserved: row.reserved_impressions,
        available: row.available_impressions,
      };
    }

    // Calculate totals
    const totals = {
      sidebar: { estimated: 0, reserved: 0, available: 0 },
      constellation: { estimated: 0, reserved: 0, available: 0 },
    };

    for (const row of inventory || []) {
      totals[row.placement].estimated += row.estimated_impressions;
      totals[row.placement].reserved += row.reserved_impressions;
      totals[row.placement].available += row.available_impressions;
    }

    return jsonResponse({
      startDate,
      endDate,
      inventory: byDate,
      totals,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get inventory error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/inventory/check
 * Check if specific inventory is available for an order
 * 
 * Body:
 * - placement: 'sidebar' | 'constellation'
 * - impressions: number (minimum 1000)
 * - start_date: YYYY-MM-DD (optional for ASAP)
 * - end_date: YYYY-MM-DD (optional for ASAP)
 */
export async function handleCheckAvailability(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { placement, impressions, start_date, end_date } = body;

    // Validate
    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
      return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
    }

    if (!impressions || impressions < 1000) {
      return jsonResponse({ error: 'Minimum 1000 impressions required' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // For ASAP orders, check next 30 days
    const today = new Date();
    const startDate = start_date || today.toISOString().split('T')[0];
    const endDate = end_date || new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    // Get availability
    const { data: inventory, error } = await supabase
      .from('ads.inventory_forecast')
      .select('forecast_date,available_impressions', {
        filter: `placement=eq.${placement}&forecast_date=gte.${startDate}&forecast_date=lte.${endDate}`,
        order: 'forecast_date.asc',
      });

    if (error) {
      console.error('[Ads] Check availability error:', error);
      return jsonResponse({ error: 'Failed to check availability' }, 500, corsHeaders);
    }

    // Calculate totals
    let totalAvailable = 0;
    const dailyBreakdown = [];

    for (const day of inventory || []) {
      totalAvailable += day.available_impressions;
      dailyBreakdown.push({
        date: day.forecast_date,
        available: day.available_impressions,
      });
    }

    const isAvailable = totalAvailable >= impressions;

    // Estimate delivery timeline
    let estimatedDays = 0;
    let remaining = impressions;
    for (const day of dailyBreakdown) {
      if (remaining <= 0) break;
      remaining -= day.available;
      estimatedDays++;
    }

    return jsonResponse({
      available: isAvailable,
      requested: impressions,
      totalAvailable,
      shortage: isAvailable ? 0 : impressions - totalAvailable,
      estimatedDays: isAvailable ? estimatedDays : null,
      startDate,
      endDate,
      dailyBreakdown,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Check availability error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/pricing
 * Get current pricing for all placement/duration combinations
 */
export async function handleGetPricing(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);

    // Get active pricing
    const { data: pricing, error } = await supabase
      .from('ads.pricing_config')
      .select('pricing_type,placement,duration,price_cents', {
        filter: 'is_active=eq.true',
        order: 'placement.asc,duration.asc',
      });

    if (error) {
      console.error('[Ads] Get pricing error:', error);
      return jsonResponse({ error: 'Failed to get pricing' }, 500, corsHeaders);
    }

    // Organize pricing
    const cpm = {};
    const creativeFees = {};

    for (const row of pricing || []) {
      if (row.pricing_type === 'cpm') {
        if (!cpm[row.placement]) {
          cpm[row.placement] = {};
        }
        cpm[row.placement][row.duration] = row.price_cents;
      } else if (row.pricing_type === 'creative_fee') {
        creativeFees[row.duration] = row.price_cents;
      }
    }

    return jsonResponse({
      cpm,
      creativeFees,
      minimumOrder: {
        impressions: 1000,
        amountCents: 1000,  // $10 minimum
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get pricing error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/inventory/quote
 * Get a price quote for an order
 * 
 * Body:
 * - placement: 'sidebar' | 'constellation'
 * - duration: 5 | 10 | 15 | 20
 * - impressions: number
 * - creative_type: 'self' | 'philosify'
 */
export async function handleGetQuote(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { placement, duration, impressions, creative_type } = body;

    // Validate
    if (!placement || !['sidebar', 'constellation'].includes(placement)) {
      return jsonResponse({ error: 'Invalid placement' }, 400, corsHeaders);
    }

    const validDurations = placement === 'constellation' ? [5] : [5, 10, 15, 20, 30];
    if (!duration || !validDurations.includes(duration)) {
      return jsonResponse({ error: `Invalid duration for ${placement}` }, 400, corsHeaders);
    }

    if (!impressions || impressions < 1000) {
      return jsonResponse({ error: 'Minimum 1000 impressions' }, 400, corsHeaders);
    }

    if (!creative_type || !['self', 'philosify'].includes(creative_type)) {
      return jsonResponse({ error: 'Invalid creative_type' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Get CPM
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

    return jsonResponse({
      quote: {
        placement,
        duration,
        impressions,
        creativeType: creative_type,
        cpmCents,
        subtotalCents,
        creativeFeeCents,
        totalCents,
        // Formatted for display
        cpm: `$${(cpmCents / 100).toFixed(2)}`,
        subtotal: `$${(subtotalCents / 100).toFixed(2)}`,
        creativeFee: creativeFeeCents > 0 ? `$${(creativeFeeCents / 100).toFixed(2)}` : null,
        total: `$${(totalCents / 100).toFixed(2)}`,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get quote error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/inventory/calculate
 * Calculate total for multiple inventory items (cart)
 * 
 * Body:
 * - items: Array of { placement, duration, impressions }
 * - creative_type: 'self' | 'philosify'
 */
export async function handleCalculateCart(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { items, creative_type } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return jsonResponse({ error: 'At least one item required' }, 400, corsHeaders);
    }

    if (!creative_type || !['self', 'philosify'].includes(creative_type)) {
      return jsonResponse({ error: 'Invalid creative_type' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Default CPM values (fallback if DB not available) — must match utils.js DEFAULT_CPM
    const { DEFAULT_CPM: defaultCpm } = await import('./utils.js');

    // Get all pricing from DB
    const { data: pricingData } = await supabase
      .from('ads.pricing_config')
      .select('pricing_type,placement,duration,price_cents', {
        filter: 'is_active=eq.true',
      });

    // Build pricing lookup
    const cpmPricing = {};
    let creativeFeeCents = 15000; // Default $150

    for (const row of pricingData || []) {
      if (row.pricing_type === 'cpm') {
        if (!cpmPricing[row.placement]) cpmPricing[row.placement] = {};
        cpmPricing[row.placement][row.duration] = row.price_cents;
      } else if (row.pricing_type === 'creative_fee') {
        creativeFeeCents = row.price_cents;
      }
    }

    // Calculate each item
    const lineItems = [];
    let totalImpressions = 0;
    let subtotalCents = 0;

    for (const item of items) {
      const { placement, duration, impressions } = item;

      // Validate item
      if (!placement || !['sidebar', 'constellation'].includes(placement)) {
        return jsonResponse({ error: `Invalid placement: ${placement}` }, 400, corsHeaders);
      }

      const validDurations = placement === 'constellation' ? [5] : [5, 10, 15, 20, 30];
      if (!duration || !validDurations.includes(duration)) {
        return jsonResponse({ error: `Invalid duration ${duration}s for ${placement}` }, 400, corsHeaders);
      }

      if (!impressions || impressions < 1000) {
        return jsonResponse({ error: 'Minimum 1000 impressions per item' }, 400, corsHeaders);
      }

      // Get CPM (from DB or fallback)
      const cpmCents = cpmPricing[placement]?.[duration] || defaultCpm[placement]?.[duration] || 1000;
      const itemCostCents = Math.ceil((impressions * cpmCents) / 1000);

      lineItems.push({
        placement,
        duration,
        impressions,
        cpmCents,
        costCents: itemCostCents,
        cpm: `$${(cpmCents / 100).toFixed(2)}`,
        cost: `$${(itemCostCents / 100).toFixed(2)}`,
      });

      totalImpressions += impressions;
      subtotalCents += itemCostCents;
    }

    // Add creative fee if Philosify creates
    const finalCreativeFeeCents = creative_type === 'philosify' ? creativeFeeCents : 0;
    const totalCents = subtotalCents + finalCreativeFeeCents;

    // Check minimum order
    if (totalCents < 1000) {
      return jsonResponse({ error: 'Minimum order is $10' }, 400, corsHeaders);
    }

    return jsonResponse({
      cart: {
        items: lineItems,
        totalImpressions,
        subtotalCents,
        creativeFeeCents: finalCreativeFeeCents,
        totalCents,
        // Formatted for display
        subtotal: `$${(subtotalCents / 100).toFixed(2)}`,
        creativeFee: finalCreativeFeeCents > 0 ? `$${(finalCreativeFeeCents / 100).toFixed(2)}` : null,
        total: `$${(totalCents / 100).toFixed(2)}`,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Calculate cart error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

// ============================================================
// INVENTORY FORECAST MAINTENANCE
// ============================================================
// The forecast table is what the planner allocates against: with no rows
// for a date, that day has zero available impressions. Migration 006 seeded
// 90 days from the day it ran and left the refill to "a cron job" that was
// never built, so the window silently lapsed and every generated plan came
// back with no placements. This keeps a rolling window filled.

// Same traffic assumptions as the migration seed (weekends run lighter).
const FORECAST_BASELINE = {
  sidebar: { weekday: 5000, weekend: 3000 },
  constellation: { weekday: 2500, weekend: 1500 },
};

const isoDay = (date) => date.toISOString().split('T')[0];

/**
 * Ensure ads.inventory_forecast covers [today, today + days].
 * Only missing (date, placement) pairs are inserted — existing rows keep
 * their reserved_impressions untouched.
 * @returns {Promise<{created: number, from: string, to: string}>}
 */
export async function topUpInventoryForecast(env, days = 180) {
  const { url, key } = await getSupabaseCredentials(env);
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Accept-Profile': 'ads',
    'Content-Profile': 'ads',
  };

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = isoDay(today);
  const end = isoDay(new Date(today.getTime() + days * 24 * 60 * 60 * 1000));

  const existingRes = await fetch(
    `${url}/rest/v1/inventory_forecast` +
      `?select=forecast_date,placement` +
      `&forecast_date=gte.${start}&forecast_date=lte.${end}`,
    { headers },
  );
  if (!existingRes.ok) {
    throw new Error(`Inventory forecast read failed: ${existingRes.status}`);
  }
  const existing = await existingRes.json();
  const have = new Set((existing || []).map((r) => `${r.forecast_date}|${r.placement}`));

  const rows = [];
  for (let i = 0; i <= days; i++) {
    const day = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
    const date = isoDay(day);
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    for (const placement of Object.keys(FORECAST_BASELINE)) {
      if (have.has(`${date}|${placement}`)) continue;
      rows.push({
        forecast_date: date,
        placement,
        estimated_impressions: FORECAST_BASELINE[placement][weekend ? 'weekend' : 'weekday'],
      });
    }
  }

  if (rows.length === 0) {
    return { created: 0, from: start, to: end };
  }

  // ignore-duplicates so a concurrent run can never overwrite a row that
  // already carries reservations (available_impressions is generated).
  const insertRes = await fetch(`${url}/rest/v1/inventory_forecast`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!insertRes.ok) {
    const detail = await insertRes.text();
    throw new Error(`Inventory forecast insert failed: ${insertRes.status} ${detail}`);
  }

  console.log(`[Ads] Inventory forecast topped up: ${rows.length} row(s) for ${start}..${end}`);
  return { created: rows.length, from: start, to: end };
}
