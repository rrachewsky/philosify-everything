// ============================================================
// ADS PLATFORM - BUDGET-BASED AD PLANNER
// ============================================================
// Advertiser sets budget, Philosify creates optimal ad plan
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getAdvertiserFromRequest } from './utils.js';

// SECURITY: UUID validation for route parameters
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/ads/planner/generate
 * Generate an ad plan based on budget and preferences
 * 
 * Body:
 * - budget_cents: number (required, minimum $50 = 5000 cents)
 * - goal: 'reach' | 'engagement' | 'balanced' (default: 'balanced')
 * - start_date: YYYY-MM-DD (optional, default: tomorrow)
 * - end_date: YYYY-MM-DD (optional, default: calculated based on budget)
 * - placement_preference: 'sidebar' | 'constellation' | 'mixed' (default: 'mixed')
 * - duration_preference: 5 | 10 | 15 | 20 | 'mixed' (default: 'mixed')
 */
export async function handleGeneratePlan(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const body = await request.json();
    const {
      budget_cents,
      goal = 'balanced',
      start_date,
      end_date,
      placement_preference = 'mixed',
      duration_preference = 'mixed',
    } = body;

    // Validate budget
    if (!budget_cents || budget_cents < 5000) {
      return jsonResponse({ error: 'Minimum budget is $50' }, 400, corsHeaders);
    }

    if (budget_cents > 10000000) {
      return jsonResponse({ error: 'Maximum budget is $100,000' }, 400, corsHeaders);
    }

    // Validate goal
    if (!['reach', 'engagement', 'balanced'].includes(goal)) {
      return jsonResponse({ error: 'Invalid goal' }, 400, corsHeaders);
    }

    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const planStartDate = start_date ? new Date(start_date) : tomorrow;
    if (planStartDate < today) {
      return jsonResponse({ error: 'Start date cannot be in the past' }, 400, corsHeaders);
    }

    // Get current pricing
    const { data: pricingData } = await supabase
      .from('ads.pricing_config')
      .select('placement,duration,price_cents', {
        filter: 'pricing_type=eq.cpm&is_active=eq.true',
      });

    const pricing = {};
    for (const p of pricingData || []) {
      if (!pricing[p.placement]) pricing[p.placement] = {};
      pricing[p.placement][p.duration] = p.price_cents;
    }

    // Get available inventory
    const inventoryEndDate = end_date || 
      new Date(planStartDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: inventory } = await supabase
      .from('ads.inventory_forecast')
      .select('forecast_date,placement,available_impressions', {
        filter: `forecast_date=gte.${planStartDate.toISOString().split('T')[0]}&forecast_date=lte.${inventoryEndDate}`,
        order: 'forecast_date.asc',
      });

    // Calculate total available inventory
    const availableByPlacement = { sidebar: 0, constellation: 0 };
    for (const day of inventory || []) {
      availableByPlacement[day.placement] += day.available_impressions;
    }

    // Generate the plan
    const plan = generateOptimalPlan({
      budgetCents: budget_cents,
      goal,
      placementPreference: placement_preference,
      durationPreference: duration_preference,
      pricing,
      availableInventory: availableByPlacement,
      startDate: planStartDate.toISOString().split('T')[0],
      endDate: inventoryEndDate,
    });

    // Calculate plan duration in days
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);
    const durationDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000)) + 1;

    return jsonResponse({
      plan: {
        ...plan,
        durationDays,
        budgetCents: budget_cents,
        budget: `$${(budget_cents / 100).toFixed(2)}`,
        goal,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Generate plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * Generate optimal ad plan based on budget and preferences
 */
function generateOptimalPlan({
  budgetCents,
  goal,
  placementPreference,
  durationPreference,
  pricing,
  availableInventory,
  startDate,
  endDate,
}) {
  const placements = [];
  let remainingBudget = budgetCents;
  let totalImpressions = 0;

  // Define allocation strategy based on goal
  let allocationStrategy;
  switch (goal) {
    case 'reach':
      // Maximize impressions - prefer cheaper options
      allocationStrategy = [
        { placement: 'constellation', duration: 5, weight: 0.5 },
        { placement: 'sidebar', duration: 5, weight: 0.3 },
        { placement: 'sidebar', duration: 10, weight: 0.2 },
      ];
      break;
    case 'engagement':
      // Maximize engagement - prefer longer, more visible ads
      allocationStrategy = [
        { placement: 'sidebar', duration: 20, weight: 0.4 },
        { placement: 'sidebar', duration: 15, weight: 0.35 },
        { placement: 'sidebar', duration: 10, weight: 0.25 },
      ];
      break;
    case 'balanced':
    default:
      // Balanced mix
      allocationStrategy = [
        { placement: 'sidebar', duration: 10, weight: 0.35 },
        { placement: 'sidebar', duration: 5, weight: 0.25 },
        { placement: 'constellation', duration: 5, weight: 0.25 },
        { placement: 'sidebar', duration: 15, weight: 0.15 },
      ];
  }

  // Filter by placement preference
  if (placementPreference !== 'mixed') {
    allocationStrategy = allocationStrategy.filter(a => a.placement === placementPreference);
    // Renormalize weights
    const totalWeight = allocationStrategy.reduce((sum, a) => sum + a.weight, 0);
    allocationStrategy = allocationStrategy.map(a => ({ ...a, weight: a.weight / totalWeight }));
  }

  // Filter by duration preference
  if (durationPreference !== 'mixed' && typeof durationPreference === 'number') {
    allocationStrategy = allocationStrategy.filter(a => a.duration === durationPreference);
    if (allocationStrategy.length === 0) {
      // Fallback to requested duration for sidebar
      allocationStrategy = [{ placement: 'sidebar', duration: durationPreference, weight: 1 }];
    } else {
      const totalWeight = allocationStrategy.reduce((sum, a) => sum + a.weight, 0);
      allocationStrategy = allocationStrategy.map(a => ({ ...a, weight: a.weight / totalWeight }));
    }
  }

  // Allocate budget across placements
  for (const allocation of allocationStrategy) {
    const allocatedBudget = Math.floor(budgetCents * allocation.weight);
    if (allocatedBudget < 1000) continue; // Minimum $10 per placement

    const cpm = pricing[allocation.placement]?.[allocation.duration] || 1000;
    const impressions = Math.floor((allocatedBudget / cpm) * 1000);
    
    // Check inventory availability
    const availableForPlacement = availableInventory[allocation.placement] || 0;
    const finalImpressions = Math.min(impressions, availableForPlacement);
    
    if (finalImpressions < 1000) continue; // Minimum 1000 impressions

    const actualCost = Math.ceil((finalImpressions * cpm) / 1000);

    placements.push({
      placement: allocation.placement,
      duration: allocation.duration,
      impressions: finalImpressions,
      cpmCents: cpm,
      cpm: `$${(cpm / 100).toFixed(2)}`,
      costCents: actualCost,
      cost: `$${(actualCost / 100).toFixed(2)}`,
      scheduleType: 'distributed', // Spread across date range
    });

    remainingBudget -= actualCost;
    totalImpressions += finalImpressions;
  }

  // If we have significant remaining budget, add more to highest-weight placement
  if (remainingBudget >= 1000 && allocationStrategy.length > 0) {
    const topAllocation = allocationStrategy[0];
    const cpm = pricing[topAllocation.placement]?.[topAllocation.duration] || 1000;
    const extraImpressions = Math.floor((remainingBudget / cpm) * 1000);
    
    if (extraImpressions >= 500) {
      // Find existing placement or add new
      const existing = placements.find(
        p => p.placement === topAllocation.placement && p.duration === topAllocation.duration
      );
      
      if (existing) {
        existing.impressions += extraImpressions;
        const newCost = Math.ceil((existing.impressions * cpm) / 1000);
        remainingBudget += existing.costCents - newCost;
        existing.costCents = newCost;
        existing.cost = `$${(newCost / 100).toFixed(2)}`;
        totalImpressions += extraImpressions;
      }
    }
  }

  // Calculate totals
  const totalCost = placements.reduce((sum, p) => sum + p.costCents, 0);
  const unusedBudget = budgetCents - totalCost;

  // Estimate results based on goal
  const estimatedClickRate = goal === 'engagement' ? 0.025 : goal === 'reach' ? 0.01 : 0.015;
  const estimatedClicks = Math.round(totalImpressions * estimatedClickRate);

  // Calculate recommended date range based on pacing
  // Aim for ~2000-5000 impressions per day for good distribution
  const targetDailyImpressions = goal === 'engagement' ? 2000 : 4000;
  const recommendedDays = Math.max(7, Math.ceil(totalImpressions / targetDailyImpressions));
  const calculatedEndDate = new Date(new Date(startDate).getTime() + (recommendedDays - 1) * 24 * 60 * 60 * 1000);
  const finalEndDate = endDate && new Date(endDate) < calculatedEndDate 
    ? endDate 
    : calculatedEndDate.toISOString().split('T')[0];

  return {
    placements,
    totalImpressions,
    totalCostCents: totalCost,
    totalCost: `$${(totalCost / 100).toFixed(2)}`,
    unusedBudgetCents: unusedBudget,
    unusedBudget: unusedBudget > 0 ? `$${(unusedBudget / 100).toFixed(2)}` : null,
    startDate,
    endDate: finalEndDate,
    estimatedClicks,
    estimatedClickRate: `${(estimatedClickRate * 100).toFixed(1)}%`,
    pacing: 'distributed', // Impressions spread evenly across days
  };
}

/**
 * POST /api/ads/planner/create-from-plan
 * Create orders from a generated plan
 * 
 * Body:
 * - plan: object (the plan from /generate)
 * - name: string (campaign name)
 * - target_url: string (click destination)
 * - creative_type: 'self' | 'philosify'
 * - creative_url: string (if self)
 * - creative_brief: string (if philosify)
 */
export async function handleCreateFromPlan(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const body = await request.json();
    const {
      plan,
      name,
      target_url,
      creative_type,
      creative_url,
      creative_brief,
    } = body;

    // Validate
    if (!plan || !plan.placements || plan.placements.length === 0) {
      return jsonResponse({ error: 'Invalid plan' }, 400, corsHeaders);
    }

    if (!name || !target_url || !creative_type) {
      return jsonResponse({ error: 'Missing required fields' }, 400, corsHeaders);
    }

    if (creative_type === 'self' && !creative_url) {
      return jsonResponse({ error: 'creative_url required for self-uploaded creatives' }, 400, corsHeaders);
    }

    if (creative_type === 'philosify' && !creative_brief) {
      return jsonResponse({ error: 'creative_brief required for Philosify-created creatives' }, 400, corsHeaders);
    }

    // Moderate the brief before accepting the campaign
    if (creative_type === 'philosify' && creative_brief) {
      const { moderateBrief } = await import('./creatives.js');
      const moderation = await moderateBrief(env, creative_brief, name);
      if (!moderation.safe) {
        return jsonResponse({ error: moderation.reason }, 400, corsHeaders);
      }
    }

    // Get creative fee if applicable
    let creativeFeeCents = 0;
    if (creative_type === 'philosify') {
      // Use the longest duration for creative fee (most expensive)
      const maxDuration = Math.max(...plan.placements.map(p => p.duration));
      const { data: feeData } = await supabase
        .from('ads.pricing_config')
        .select('price_cents', {
          filter: `pricing_type=eq.creative_fee&duration=eq.${maxDuration}&is_active=eq.true`,
          limit: 1,
        });
      creativeFeeCents = feeData?.[0]?.price_cents || 15000;
    }

    // Create a campaign group (ad_plans table)
    const { data: adPlan, error: planError } = await supabase
      .from('ads.ad_plans')
      .insert({
        advertiser_id: advertiser.id,
        name,
        target_url,
        creative_type,
        creative_url: creative_type === 'self' ? creative_url : null,
        creative_brief: creative_type === 'philosify' ? creative_brief : null,
        creative_status: creative_type === 'self' ? 'ready' : 'pending',
        creative_fee_cents: creativeFeeCents,
        budget_cents: plan.budgetCents || plan.totalCostCents,
        total_cost_cents: plan.totalCostCents + creativeFeeCents,
        start_date: plan.startDate,
        end_date: plan.endDate,
        goal: plan.goal || 'balanced',
        status: 'draft',
      });

    if (planError) {
      console.error('[Ads] Create plan error:', planError);
      return jsonResponse({ error: 'Failed to create ad plan' }, 500, corsHeaders);
    }

    // Create individual orders for each placement
    const orders = [];
    for (const placement of plan.placements) {
      const { data: order, error: orderError } = await supabase
        .from('ads.ad_orders')
        .insert({
          advertiser_id: advertiser.id,
          plan_id: adPlan?.id,
          name: `${name} - ${placement.placement} ${placement.duration}s`,
          placement: placement.placement,
          duration: placement.duration,
          impressions_ordered: placement.impressions,
          target_url,
          creative_type,
          creative_url: creative_type === 'self' ? creative_url : null,
          creative_status: creative_type === 'self' ? 'ready' : 'pending',
          schedule_type: 'scheduled',
          start_date: plan.startDate,
          end_date: plan.endDate,
          cpm_cents: placement.cpmCents,
          subtotal_cents: placement.costCents,
          creative_fee_total_cents: 0, // Fee is on the plan level
          total_cents: placement.costCents,
          status: 'draft',
        });

      if (!orderError && order) {
        orders.push(order);
      }
    }

    // Update plan with order IDs
    const orderIds = orders.map(o => o.id);
    await supabase.from('ads.ad_plans').update(
      { order_ids: orderIds, updated_at: new Date().toISOString() },
      `id=eq.${adPlan?.id}`
    );

    // If Philosify creative, create creative request
    if (creative_type === 'philosify' && adPlan?.id) {
      await supabase.from('ads.creative_requests').insert({
        plan_id: adPlan.id,
        advertiser_id: advertiser.id,
        brief: creative_brief,
        brand_name: advertiser.company_name,
        placement: plan.placements[0]?.placement || 'sidebar',
        duration: Math.max(...plan.placements.map(p => p.duration)),
        fee_cents: creativeFeeCents,
      });
    }

    return jsonResponse({
      plan: adPlan,
      orders,
      totalCostCents: plan.totalCostCents + creativeFeeCents,
      totalCost: `$${((plan.totalCostCents + creativeFeeCents) / 100).toFixed(2)}`,
    }, 201, corsHeaders);
  } catch (err) {
    console.error('[Ads] Create from plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/plans
 * List ad plans for the authenticated advertiser
 */
export async function handleListPlans(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: plans, error } = await supabase
      .from('ads.ad_plans')
      .select('*', {
        filter: `advertiser_id=eq.${advertiser.id}`,
        order: 'created_at.desc',
      });

    if (error) {
      console.error('[Ads] List plans error:', error);
      return jsonResponse({ error: 'Failed to list plans' }, 500, corsHeaders);
    }

    return jsonResponse({ plans: plans || [] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] List plans error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/plans/:id
 * Get a specific ad plan with its orders
 */
export async function handleGetPlan(request, env, corsHeaders, planId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (!UUID_RE.test(planId)) {
      return jsonResponse({ error: 'Invalid plan ID' }, 400, corsHeaders);
    }

    const { data: plans, error } = await supabase
      .from('ads.ad_plans')
      .select('*', {
        filter: `id=eq.${planId}&advertiser_id=eq.${advertiser.id}`,
      });

    if (error || !plans || plans.length === 0) {
      return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    }

    const plan = plans[0];

    // Get associated orders
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: `plan_id=eq.${planId}`,
        order: 'created_at.asc',
      });

    // Get creative request if any
    let creativeRequest = null;
    if (plan.creative_type === 'philosify') {
      const { data: requests } = await supabase
        .from('ads.creative_requests')
        .select('*', {
          filter: `plan_id=eq.${planId}`,
          limit: 1,
        });
      creativeRequest = requests?.[0] || null;
    }

    // Calculate delivery stats
    const totalOrdered = orders?.reduce((sum, o) => sum + o.impressions_ordered, 0) || 0;
    const totalDelivered = orders?.reduce((sum, o) => sum + o.impressions_delivered, 0) || 0;
    const deliveryPercent = totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;

    return jsonResponse({
      plan,
      orders: orders || [],
      creativeRequest,
      stats: {
        totalOrdered,
        totalDelivered,
        deliveryPercent,
        remainingImpressions: totalOrdered - totalDelivered,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * PUT /api/ads/plans/:id
 * Update plan fields (target_url, start_date, end_date) before launch
 */
export async function handleUpdatePlan(request, env, corsHeaders, planId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (!UUID_RE.test(planId)) {
      return jsonResponse({ error: 'Invalid plan ID' }, 400, corsHeaders);
    }

    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('id,status,advertiser_id', {
        filter: `id=eq.${planId}&advertiser_id=eq.${advertiser.id}`,
      });

    const plan = plans?.[0];
    if (!plan) {
      return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    }

    // Only allow edits before launch
    if (!['draft', 'pending_creative', 'pending_approval'].includes(plan.status)) {
      return jsonResponse({ error: 'Cannot edit a launched campaign' }, 400, corsHeaders);
    }

    const body = await request.json();
    const updates = {};

    if (body.target_url) {
      updates.target_url = body.target_url;
    }
    if (body.start_date) {
      updates.start_date = body.start_date;
    }
    if (body.end_date) {
      updates.end_date = body.end_date;
    }
    if (body.creative_url) {
      updates.creative_url = body.creative_url;
      updates.creative_status = 'ready';
    }

    if (Object.keys(updates).length === 0) {
      return jsonResponse({ error: 'No fields to update' }, 400, corsHeaders);
    }

    updates.updated_at = new Date().toISOString();

    console.log('[Ads] Updating plan', planId, 'with:', JSON.stringify(updates));
    const { error: updateErr } = await supabase.from('ads.ad_plans').update(updates, `id=eq.${planId}`);
    if (updateErr) {
      console.error('[Ads] Plan update failed:', JSON.stringify(updateErr));
      return jsonResponse({ error: 'Failed to update plan' }, 500, corsHeaders);
    }

    // Also update orders if target_url or dates changed
    if (body.target_url) {
      await supabase.from('ads.ad_orders').update(
        { target_url: body.target_url, updated_at: new Date().toISOString() },
        `plan_id=eq.${planId}`
      );
    }
    if (body.start_date || body.end_date) {
      const orderDateUpdates = { updated_at: new Date().toISOString() };
      if (body.start_date) orderDateUpdates.start_date = body.start_date;
      if (body.end_date) orderDateUpdates.end_date = body.end_date;
      await supabase.from('ads.ad_orders').update(orderDateUpdates, `plan_id=eq.${planId}`);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Update plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/plans/:id/checkout
 * Pay for all orders in a plan
 */
export async function handlePlanCheckout(request, env, corsHeaders, planId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (!UUID_RE.test(planId)) {
      return jsonResponse({ error: 'Invalid plan ID' }, 400, corsHeaders);
    }

    // Get plan
    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('*', {
        filter: `id=eq.${planId}&advertiser_id=eq.${advertiser.id}`,
      });

    if (!plans || plans.length === 0) {
      return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    }

    const plan = plans[0];

    if (plan.status !== 'draft') {
      return jsonResponse({ error: 'Plan has already been paid' }, 400, corsHeaders);
    }

    // Get orders
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('*', {
        filter: `plan_id=eq.${planId}`,
      });

    if (!orders || orders.length === 0) {
      return jsonResponse({ error: 'No orders in this plan' }, 400, corsHeaders);
    }

    // Calculate total
    const ordersCost = orders.reduce((sum, o) => sum + o.total_cents, 0);
    const totalCost = ordersCost + (plan.creative_fee_cents || 0);

    // Create Stripe checkout
    const { getSecret } = await import('../../utils/secrets.js');
    const stripeKey = await getSecret(env.STRIPE_SECRET_KEY);
    const frontendUrl = env.ADS_FRONTEND_URL || 'https://ads.philosify.org';

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', `${frontendUrl}/app/campaigns/${planId}?payment=success`);
    params.append('cancel_url', `${frontendUrl}/app/campaigns/${planId}?payment=cancelled`);
    params.append('customer_email', advertiser.email);
    params.append('metadata[plan_id]', planId);
    params.append('metadata[advertiser_id]', advertiser.id);
    params.append('metadata[type]', 'ad_plan');

    // Line item: Ad placements
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `Ad Campaign: ${plan.name}`);
    
    const totalImpressions = orders.reduce((sum, o) => sum + o.impressions_ordered, 0);
    params.append('line_items[0][price_data][product_data][description]', 
      `${totalImpressions.toLocaleString()} total impressions across ${orders.length} placements`);
    params.append('line_items[0][price_data][unit_amount]', ordersCost.toString());
    params.append('line_items[0][quantity]', '1');

    // Line item: Creative fee (if applicable)
    if (plan.creative_fee_cents > 0) {
      params.append('line_items[1][price_data][currency]', 'usd');
      params.append('line_items[1][price_data][product_data][name]', 'Creative Services');
      params.append('line_items[1][price_data][product_data][description]', 
        'Philosify-designed ad creative');
      params.append('line_items[1][price_data][unit_amount]', plan.creative_fee_cents.toString());
      params.append('line_items[1][quantity]', '1');
    }

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

    // Update plan with checkout session
    await supabase.from('ads.ad_plans').update(
      { stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() },
      `id=eq.${planId}`
    );

    return jsonResponse({
      checkoutUrl: session.url,
      sessionId: session.id,
      totalCents: totalCost,
      total: `$${(totalCost / 100).toFixed(2)}`,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Plan checkout error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * Webhook handler for plan payments
 */
export async function handlePlanPaymentWebhook(env, session) {
  try {
    const { plan_id } = session.metadata;
    
    if (!plan_id) {
      console.error('[Ads] Plan webhook missing plan_id');
      return;
    }

    const supabase = await getServiceSupabase(env);

    // Update plan status
    const newStatus = await supabase.from('ads.ad_plans').select('creative_type,paid_at', {
      filter: `id=eq.${plan_id}`,
    });
    const planRecord = newStatus?.data?.[0];
    const creativeType = planRecord?.creative_type;

    if (!planRecord || planRecord.paid_at) {
      return;
    }

    // Get plan details for transaction record
    const { data: planFull } = await supabase
      .from('ads.ad_plans')
      .select('advertiser_id,name,total_cost_cents,creative_fee_cents', {
        filter: `id=eq.${plan_id}`,
        limit: 1,
      });
    const planDetail = planFull?.[0];

    // Balance accounting: deposit full payment, then deduct creative fee
    if (planDetail?.advertiser_id && planDetail?.total_cost_cents) {
      // Check for duplicate
      const { data: existingTx } = await supabase
        .from('ads.advertiser_transactions')
        .select('id', { filter: `stripe_checkout_session_id=eq.${session.id}`, limit: 1 });

      if (!existingTx || existingTx.length === 0) {
        const advertiserId = planDetail.advertiser_id;
        const totalPaid = planDetail.total_cost_cents;
        const creativeFee = planDetail.creative_fee_cents || 0;

        // Get current balance
        const { data: advBal } = await supabase
          .from('ads.advertisers')
          .select('balance_cents', { filter: `id=eq.${advertiserId}`, limit: 1 });
        let balance = advBal?.[0]?.balance_cents || 0;

        // 1. Deposit full payment to balance
        balance += totalPaid;
        await supabase.from('ads.advertisers').update(
          { balance_cents: balance, updated_at: new Date().toISOString() },
          `id=eq.${advertiserId}`
        );
        await supabase.from('ads.advertiser_transactions').insert({
          advertiser_id: advertiserId,
          type: 'deposit',
          amount_cents: totalPaid,
          balance_after_cents: balance,
          description: `${planDetail.name || 'Campaign'} — payment received`,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
        });

        // 2. Deduct creative fee immediately (art is generated on payment)
        if (creativeFee > 0) {
          balance -= creativeFee;
          await supabase.from('ads.advertisers').update(
            { balance_cents: balance, updated_at: new Date().toISOString() },
            `id=eq.${advertiserId}`
          );
          await supabase.from('ads.advertiser_transactions').insert({
            advertiser_id: advertiserId,
            type: 'campaign_spend',
            amount_cents: -creativeFee,
            balance_after_cents: balance,
            description: `${planDetail.name || 'Campaign'} — creative fee`,
          });
        }

        console.log(`[Ads] Balance: +$${(totalPaid / 100).toFixed(2)} deposit, -$${(creativeFee / 100).toFixed(2)} creative fee. Balance: $${(balance / 100).toFixed(2)}`);
      }
    }
    
    const planStatus = creativeType === 'philosify' ? 'pending_creative' : 'pending_approval';
    
    await supabase.from('ads.ad_plans').update(
      {
        status: planStatus,
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${plan_id}`
    );

    // Update all orders in the plan
    await supabase.from('ads.ad_orders').update(
      {
        status: planStatus,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      `plan_id=eq.${plan_id}`
    );

    // Reserve inventory for each order
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('id,placement,start_date,end_date,impressions_ordered', {
        filter: `plan_id=eq.${plan_id}`,
      });

    for (const order of orders || []) {
      const { error: rpcError } = await supabase.rpc('ads.reserve_inventory', {
        p_order_id: order.id,
        p_placement: order.placement,
        p_start_date: order.start_date,
        p_end_date: order.end_date,
        p_total_impressions: order.impressions_ordered,
      });

      if (rpcError) {
        console.warn('[Ads] Reserve inventory error (function may not exist yet):', rpcError);
      }
    }

    console.log(`[Ads] Plan ${plan_id} paid, status: ${planStatus}`);

    // Auto-generate AI creative for 'philosify' creative type
    if (creativeType === 'philosify') {
      try {
        const { generateAICreative } = await import('./creatives.js');

        // Get advertiser info for the prompt
        const { data: advData } = await supabase
          .from('ads.advertisers')
          .select('company_name', { filter: `id=eq.${session.metadata.advertiser_id}`, limit: 1 });

        // Get the plan's full details
        const { data: planDetails } = await supabase
          .from('ads.ad_plans')
          .select('creative_brief,target_url', { filter: `id=eq.${plan_id}`, limit: 1 });

        const brandName = advData?.[0]?.company_name || 'Brand';
        const brief = planDetails?.[0]?.creative_brief || '';
        const targetUrl = planDetails?.[0]?.target_url || '';
        const placement = orders?.[0]?.placement || 'sidebar';

        const result = await generateAICreative(env, {
          advertiserId: session.metadata.advertiser_id,
          brief,
          brandName,
          targetUrl,
          placement,
        });

        if (result?.url) {
          // Update plan with generated creative
          await supabase.from('ads.ad_plans').update(
            {
              creative_url: result.url,
              creative_status: 'review',
              status: 'pending_approval',
              updated_at: new Date().toISOString(),
            },
            `id=eq.${plan_id}`
          );

          // Update orders too
          await supabase.from('ads.ad_orders').update(
            {
              creative_url: result.url,
              creative_status: 'ready',
              status: 'pending_approval',
              updated_at: new Date().toISOString(),
            },
            `plan_id=eq.${plan_id}`
          );

          // Update creative request if it exists
          await supabase.from('ads.creative_requests').update(
            {
              current_draft_url: result.url,
              status: 'review',
              drafts: JSON.stringify([{ url: result.url, generated_at: new Date().toISOString(), method: 'dall-e-3' }]),
              updated_at: new Date().toISOString(),
            },
            `plan_id=eq.${plan_id}`
          );

          console.log(`[Ads AI] Auto-generated creative for plan ${plan_id}: ${result.url}`);
        } else {
          console.warn(`[Ads AI] Creative generation failed for plan ${plan_id}, remains in pending_creative`);
        }
      } catch (aiErr) {
        console.error('[Ads AI] Auto-generation error:', aiErr.message);
        // Plan stays in pending_creative — admin can generate manually
      }
    }
  } catch (err) {
    console.error('[Ads] Plan payment webhook error:', err);
  }
}

/**
 * POST /api/ads/plans/:id/creative/approve
 * Advertiser approves the current draft for final admin release
 */
export async function handleApprovePlanCreative(request, env, corsHeaders, planId) {
  try {
    if (!UUID_RE.test(planId)) {
      return jsonResponse({ error: 'Invalid plan ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('*', {
        filter: `id=eq.${planId}&advertiser_id=eq.${advertiser.id}`,
      });

    const plan = plans?.[0];
    if (!plan) {
      return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    }

    const { data: requests } = await supabase
      .from('ads.creative_requests')
      .select('*', {
        filter: `plan_id=eq.${planId}`,
        limit: 1,
      });

    const creativeRequest = requests?.[0];
    if (!creativeRequest || !creativeRequest.current_draft_url) {
      return jsonResponse({ error: 'No creative draft available to approve' }, 400, corsHeaders);
    }

    await supabase.from('ads.creative_requests').update(
      {
        status: 'approved',
        final_url: creativeRequest.current_draft_url,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      `id=eq.${creativeRequest.id}`
    );

    await supabase.from('ads.ad_plans').update(
      {
        creative_url: creativeRequest.current_draft_url,
        creative_status: 'ready',
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      },
      `id=eq.${planId}`
    );

    await supabase.from('ads.ad_orders').update(
      {
        creative_url: creativeRequest.current_draft_url,
        creative_status: 'ready',
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      },
      `plan_id=eq.${planId}`
    );

    return jsonResponse({ success: true, status: 'pending_approval' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Approve plan creative error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/plans/:id/creative/revision
 * Advertiser requests another creative iteration
 */
export async function handleRequestPlanRevision(request, env, corsHeaders, planId) {
  try {
    if (!UUID_RE.test(planId)) {
      return jsonResponse({ error: 'Invalid plan ID' }, 400, corsHeaders);
    }
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const feedback = body.feedback || '';

    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('*', {
        filter: `id=eq.${planId}&advertiser_id=eq.${advertiser.id}`,
      });

    const plan = plans?.[0];
    if (!plan) {
      return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    }

    const { data: requests } = await supabase
      .from('ads.creative_requests')
      .select('*', {
        filter: `plan_id=eq.${planId}`,
        limit: 1,
      });

    const creativeRequest = requests?.[0];
    if (!creativeRequest) {
      return jsonResponse({ error: 'Creative request not found' }, 404, corsHeaders);
    }

    const drafts = Array.isArray(creativeRequest.drafts) ? [...creativeRequest.drafts] : [];
    if (drafts.length > 0) {
      drafts[drafts.length - 1] = {
        ...drafts[drafts.length - 1],
        feedback,
      };
    }

    await supabase.from('ads.creative_requests').update(
      {
        status: 'revision',
        drafts,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${creativeRequest.id}`
    );

    await supabase.from('ads.ad_plans').update(
      {
        status: 'pending_creative',
        updated_at: new Date().toISOString(),
      },
      `id=eq.${planId}`
    );

    await supabase.from('ads.ad_orders').update(
      {
        status: 'pending_creative',
        updated_at: new Date().toISOString(),
      },
      `plan_id=eq.${planId}`
    );

    return jsonResponse({ success: true, status: 'pending_creative' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Request plan revision error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}
