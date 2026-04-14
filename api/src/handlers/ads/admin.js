// ============================================================
// ADS PLATFORM - ADMIN HANDLERS
// ============================================================
// Owner-only endpoints for vetting and management

import { getServiceSupabase, getSupabaseCredentials } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getSecret } from '../../utils/secrets.js';
import { safeEq } from '../../payments/crypto.js';
import { manualVet } from './vetting.js';

/**
 * Verify admin access via X-Admin-Secret header
 */
async function verifyAdmin(request, env) {
  const adminSecret = await getSecret(env.ADMIN_SECRET);
  const providedSecret = request.headers.get('X-Admin-Secret');
  
  if (!providedSecret || !adminSecret) {
    return false;
  }
  
  return safeEq(providedSecret, adminSecret);
}

/**
 * GET /api/ads/admin/pending
 * List advertisers pending review
 */
export async function handleListPending(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    const { data: advertisers, error } = await supabase
      .from('ads.advertisers')
      .select('id,email,company_name,website,vetting_score,vetting_reason,created_at', {
        filter: 'status=eq.pending',
        order: 'created_at.asc',
      });

    if (error) {
      console.warn('[Ads Admin] List pending query error (table may not exist):', error.message || error);
    }

    return jsonResponse({ advertisers: advertisers || [] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] List pending error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/approve/:id
 * Approve an advertiser
 */
export async function handleApproveAdvertiser(request, env, corsHeaders, advertiserId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    // SECURITY: Validate advertiserId as UUID to prevent filter injection
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(advertiserId)) {
      return jsonResponse({ error: 'Invalid advertiser ID' }, 400, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Manually approved by owner';

    const supabase = await getServiceSupabase(env);
    await manualVet(supabase, advertiserId, true, reason, 'owner');

    // Activate any pending campaigns for this advertiser
    await supabase.from('ads.ad_campaigns').update(
      { status: 'active', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      `advertiser_id=eq.${advertiserId}&status=eq.pending`
    );

    // Send approval email
    try {
      const { data: adv } = await supabase
        .from('ads.advertisers')
        .select('email,company_name', { filter: `id=eq.${advertiserId}`, limit: 1 });
      if (adv?.[0]) {
        const { sendApprovalEmail } = await import('./emails.js');
        sendApprovalEmail(env, adv[0].email, adv[0].company_name).catch(() => {});
      }
    } catch (e) { console.warn('[AdsAdmin] Approval email failed:', e.message); }

    return jsonResponse({ success: true, status: 'approved' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Approve error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/reject/:id
 * Reject an advertiser
 */
export async function handleRejectAdvertiser(request, env, corsHeaders, advertiserId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    // SECURITY: Validate advertiserId as UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(advertiserId)) {
      return jsonResponse({ error: 'Invalid advertiser ID' }, 400, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Rejected by owner';

    const supabase = await getServiceSupabase(env);
    await manualVet(supabase, advertiserId, false, reason, 'owner');

    // Reject any pending campaigns
    await supabase.from('ads.ad_campaigns').update(
      { status: 'rejected', updated_at: new Date().toISOString() },
      `advertiser_id=eq.${advertiserId}&status=eq.pending`
    );

    // Send rejection email
    try {
      const { data: adv } = await supabase
        .from('ads.advertisers')
        .select('email,company_name', { filter: `id=eq.${advertiserId}`, limit: 1 });
      if (adv?.[0]) {
        const { sendRejectionEmail } = await import('./emails.js');
        sendRejectionEmail(env, adv[0].email, adv[0].company_name, reason).catch(() => {});
      }
    } catch (e) { console.warn('[AdsAdmin] Rejection email failed:', e.message); }

    return jsonResponse({ success: true, status: 'rejected' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Reject error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/suspend/:id
 * Suspend an advertiser
 */
export async function handleSuspendAdvertiser(request, env, corsHeaders, advertiserId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    // SECURITY: Validate advertiserId as UUID
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(advertiserId)) {
      return jsonResponse({ error: 'Invalid advertiser ID' }, 400, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Suspended by owner';

    const supabase = await getServiceSupabase(env);

    await supabase.from('ads.advertisers').update(
      { status: 'suspended', vetting_reason: reason, updated_at: new Date().toISOString() },
      `id=eq.${advertiserId}`
    );

    // Pause all active campaigns
    await supabase.from('ads.ad_campaigns').update(
      { status: 'paused', paused_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      `advertiser_id=eq.${advertiserId}&status=eq.active`
    );

    return jsonResponse({ success: true, status: 'suspended' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Suspend error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/admin/stats
 * Platform-wide stats
 */
export async function handleAdminStats(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Get counts
    const [advertisers, campaigns, impressions] = await Promise.all([
      supabase.from('ads.advertisers').select('status'),
      supabase.from('ads.ad_campaigns').select('status,impressions,clicks,spent_cents'),
      supabase.from('ads.ad_impressions').select('cost_cents', { limit: 10000 }),
    ]);

    const advertiserStats = {
      total: advertisers.data?.length || 0,
      pending: advertisers.data?.filter(a => a.status === 'pending').length || 0,
      approved: advertisers.data?.filter(a => a.status === 'approved').length || 0,
      rejected: advertisers.data?.filter(a => a.status === 'rejected').length || 0,
      suspended: advertisers.data?.filter(a => a.status === 'suspended').length || 0,
    };

    const campaignStats = {
      total: campaigns.data?.length || 0,
      active: campaigns.data?.filter(c => c.status === 'active').length || 0,
      paused: campaigns.data?.filter(c => c.status === 'paused').length || 0,
      exhausted: campaigns.data?.filter(c => c.status === 'exhausted').length || 0,
    };

    const totalImpressions = campaigns.data?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
    const totalClicks = campaigns.data?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
    const totalRevenue = campaigns.data?.reduce((sum, c) => sum + (c.spent_cents || 0), 0) || 0;

    return jsonResponse({
      advertisers: advertiserStats,
      campaigns: campaignStats,
      performance: {
        totalImpressions,
        totalClicks,
        clickRate: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0',
        totalRevenueCents: totalRevenue,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Stats error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/admin/distribution
 * Show current proportional distribution of active campaigns
 */
export async function handleAdminDistribution(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    
    // Get active campaigns eligible for proportional distribution
    const { data: activeOrders, error } = await supabase
      .from('ads.ad_orders')
      .select(`
        id,
        name,
        advertiser_id,
        placement,
        total_cents,
        impressions_ordered,
        impressions_delivered,
        creative_url,
        target_url,
        status,
        creative_status,
        schedule_type,
        created_at
      `, {
        filter: [
          'status=eq.active',
          'creative_status=eq.ready',
          'schedule_type=eq.asap',
        ].join('&'),
        order: 'placement,total_cents.desc',
      });

    if (error) {
      console.error('[Ads Admin] Distribution error:', error);
      return jsonResponse({ error: 'Database error' }, 500, corsHeaders);
    }

    // Filter out exhausted campaigns
    const eligibleOrders = (activeOrders || []).filter(
      o => o.impressions_delivered < o.impressions_ordered
    );

    // Get advertiser names
    const advertiserIds = [...new Set(eligibleOrders.map(o => o.advertiser_id))];
    const { data: advertisers } = await supabase
      .from('ads.advertisers')
      .select('id,company_name', {
        filter: `id=in.(${advertiserIds.join(',')})`,
      });
    const advertiserMap = Object.fromEntries((advertisers || []).map(a => [a.id, a.company_name]));

    // Get today's impressions for actual distribution
    const today = new Date().toISOString().split('T')[0];
    const { data: todayImpressions } = await supabase
      .from('ads.ad_impressions')
      .select('order_id,placement', {
        filter: `created_at=gte.${today}`,
      });

    // Calculate distribution by placement
    const byPlacement = {};
    
    for (const order of eligibleOrders) {
      if (!byPlacement[order.placement]) {
        byPlacement[order.placement] = {
          campaigns: [],
          totalBudget: 0,
          totalImpressionsToday: 0,
        };
      }
      
      byPlacement[order.placement].totalBudget += order.total_cents;
      byPlacement[order.placement].campaigns.push(order);
    }

    // Count impressions by placement and order
    for (const imp of todayImpressions || []) {
      if (byPlacement[imp.placement]) {
        byPlacement[imp.placement].totalImpressionsToday++;
        const campaign = byPlacement[imp.placement].campaigns.find(c => c.id === imp.order_id);
        if (campaign) {
          campaign.impressions_today = (campaign.impressions_today || 0) + 1;
        }
      }
    }

    // Calculate proportions
    const distribution = {};
    for (const [placement, data] of Object.entries(byPlacement)) {
      distribution[placement] = {
        totalBudget: data.totalBudget / 100, // dollars
        totalImpressionsToday: data.totalImpressionsToday,
        campaigns: data.campaigns.map(c => ({
          id: c.id,
          name: c.name,
          advertiser: advertiserMap[c.advertiser_id] || 'Unknown',
          budgetDollars: c.total_cents / 100,
          targetPercentage: ((c.total_cents / data.totalBudget) * 100).toFixed(2),
          impressionsToday: c.impressions_today || 0,
          actualPercentage: data.totalImpressionsToday > 0 
            ? (((c.impressions_today || 0) / data.totalImpressionsToday) * 100).toFixed(2)
            : '0.00',
          deficit: data.totalImpressionsToday > 0
            ? (((c.total_cents / data.totalBudget) - ((c.impressions_today || 0) / data.totalImpressionsToday)) * 100).toFixed(2)
            : ((c.total_cents / data.totalBudget) * 100).toFixed(2),
          impressionsRemaining: c.impressions_ordered - c.impressions_delivered,
          creativeUrl: c.creative_url,
          targetUrl: c.target_url,
          createdAt: c.created_at,
        })),
      };
    }

    return jsonResponse({
      distribution,
      summary: {
        totalActiveCampaigns: eligibleOrders.length,
        placements: Object.keys(distribution),
        timestamp: new Date().toISOString(),
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Distribution error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/admin/overview
 * Unified queue-oriented admin overview for Ads v1
 */
export async function handleAdminOverview(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const [pendingAdvertisers, plans, creativeRequests] = await Promise.all([
      supabase.from('ads.advertisers').select('id', { filter: 'status=eq.pending' }),
      supabase.from('ads.ad_plans').select('id,status,total_cost_cents,start_date,end_date,paid_at', {
        order: 'created_at.desc',
        limit: 200,
      }),
      supabase.from('ads.creative_requests').select('id,status,updated_at', {
        order: 'updated_at.desc',
        limit: 200,
      }),
    ]);

    const planList = plans.data || [];
    const requestList = creativeRequests.data || [];

    return jsonResponse({
      counts: {
        pendingAdvertisers: pendingAdvertisers.data?.length || 0,
        draftPlans: planList.filter((plan) => plan.status === 'draft').length,
        paidPlans: planList.filter((plan) => !!plan.paid_at).length,
        creativeInProgress: requestList.filter((request) =>
          ['pending', 'in_progress', 'revision'].includes(request.status)
        ).length,
        awaitingClientApproval: requestList.filter((request) => request.status === 'review').length,
        awaitingAdminApproval: planList.filter((plan) => plan.status === 'pending_approval').length,
        activePlans: planList.filter((plan) => plan.status === 'active').length,
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Overview error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/admin/plans
 * List plans across the system for operational review
 */
export async function handleAdminListPlans(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 100, 200);
    const filters = [];

    // SECURITY: Validate status against allowlist to prevent PostgREST filter injection
    const VALID_PLAN_STATUSES = ['draft', 'pending', 'active', 'paused', 'completed', 'rejected', 'cancelled'];
    if (status) {
      if (!VALID_PLAN_STATUSES.includes(status)) {
        return jsonResponse({ error: 'Invalid status filter' }, 400, corsHeaders);
      }
      filters.push(`status=eq.${status}`);
    }

    const { data: plans, error } = await supabase
      .from('ads.ad_plans')
      .select('*', {
        filter: filters.join('&'),
        order: 'created_at.desc',
        limit,
      });

    if (error) {
      console.warn('[Ads Admin] List plans query error (table may not exist):', error.message || error);
      return jsonResponse({ plans: [] }, 200, corsHeaders);
    }

    const advertiserIds = [...new Set((plans || []).map((plan) => plan.advertiser_id).filter(Boolean))];
    let advertiserMap = {};

    if (advertiserIds.length > 0) {
      const { data: advertisers } = await supabase
        .from('ads.advertisers')
        .select('id,company_name,email,status', {
          filter: `id=in.(${advertiserIds.join(',')})`,
        });

      advertiserMap = Object.fromEntries((advertisers || []).map((advertiser) => [advertiser.id, advertiser]));
    }

    // Get impression totals for each plan from orders
    const planIds = (plans || []).map((p) => p.id).filter(Boolean);
    let orderStats = {};
    if (planIds.length > 0) {
      const { data: orders } = await supabase
        .from('ads.ad_orders')
        .select('plan_id,impressions_ordered,impressions_delivered', {
          filter: `plan_id=in.(${planIds.join(',')})`,
        });
      for (const order of orders || []) {
        if (!orderStats[order.plan_id]) {
          orderStats[order.plan_id] = { ordered: 0, delivered: 0 };
        }
        orderStats[order.plan_id].ordered += order.impressions_ordered || 0;
        orderStats[order.plan_id].delivered += order.impressions_delivered || 0;
      }
    }

    return jsonResponse({
      plans: (plans || []).map((plan) => ({
        ...plan,
        advertiser: advertiserMap[plan.advertiser_id] || null,
        impressions_ordered: orderStats[plan.id]?.ordered || 0,
        impressions_delivered: orderStats[plan.id]?.delivered || 0,
      })),
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] List plans error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/admin/creative-requests
 * List creative production queue
 */
export async function handleAdminListCreativeRequests(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 100, 200);
    const filters = [];

    // SECURITY: Validate status against allowlist to prevent PostgREST filter injection
    const VALID_CR_STATUSES = ['pending', 'in_progress', 'review', 'revision', 'completed', 'approved', 'rejected', 'cancelled'];
    if (status && status !== 'all') {
      if (!VALID_CR_STATUSES.includes(status)) {
        return jsonResponse({ error: 'Invalid status filter' }, 400, corsHeaders);
      }
      filters.push(`status=eq.${status}`);
    } else if (!status) {
      // Default: only show actionable requests
      filters.push(`status=in.(pending,in_progress,review,revision)`);
    }
    // status=all → no filter, returns everything

    const { data: requests, error } = await supabase
      .from('ads.creative_requests')
      .select('*', {
        filter: filters.join('&'),
        order: 'updated_at.desc',
        limit,
      });

    if (error) {
      console.warn('[Ads Admin] List creative requests query error (table may not exist):', error.message || error);
      return jsonResponse({ requests: [] }, 200, corsHeaders);
    }

    const advertiserIds = [...new Set((requests || []).map((item) => item.advertiser_id).filter(Boolean))];
    let advertiserMap = {};

    if (advertiserIds.length > 0) {
      const { data: advertisers } = await supabase
        .from('ads.advertisers')
        .select('id,company_name,email', {
          filter: `id=in.(${advertiserIds.join(',')})`,
        });

      advertiserMap = Object.fromEntries((advertisers || []).map((advertiser) => [advertiser.id, advertiser]));
    }

    return jsonResponse({
      requests: (requests || []).map((item) => ({
        ...item,
        advertiser: advertiserMap[item.advertiser_id] || null,
      })),
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] List creative requests error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/creative-requests/:id/draft
 * Submit a mock draft for advertiser review
 */
export async function handleAdminSubmitCreativeDraft(request, env, corsHeaders, requestId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    // SECURITY: Validate requestId as UUID
    const UUID_RE2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE2.test(requestId)) {
      return jsonResponse({ error: 'Invalid request ID' }, 400, corsHeaders);
    }

    const body = await request.json().catch(() => ({}));
    const draftUrl = body.draft_url;
    const note = body.note || '';

    if (!draftUrl) {
      return jsonResponse({ error: 'draft_url is required' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const { data: requests } = await supabase
      .from('ads.creative_requests')
      .select('*', {
        filter: `id=eq.${requestId}`,
        limit: 1,
      });

    const creativeRequest = requests?.[0];
    if (!creativeRequest) {
      return jsonResponse({ error: 'Creative request not found' }, 404, corsHeaders);
    }

    let rawDrafts = creativeRequest.drafts;
    if (typeof rawDrafts === 'string') { try { rawDrafts = JSON.parse(rawDrafts); } catch { rawDrafts = []; } }
    const drafts = Array.isArray(rawDrafts) ? [...rawDrafts] : [];
    drafts.push({
      url: draftUrl,
      note,
      submitted_at: new Date().toISOString(),
    });

    await supabase.from('ads.creative_requests').update(
      {
        status: 'review',
        drafts,
        current_draft_url: draftUrl,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${requestId}`
    );

    if (creativeRequest.plan_id) {
      await supabase.from('ads.ad_plans').update(
        {
          status: 'pending_creative',
          updated_at: new Date().toISOString(),
        },
        `id=eq.${creativeRequest.plan_id}`
      );
    }

    if (creativeRequest.order_id) {
      await supabase.from('ads.ad_orders').update(
        {
          status: 'pending_creative',
          updated_at: new Date().toISOString(),
        },
        `id=eq.${creativeRequest.order_id}`
      );
    }

    // Notify advertiser that creative is ready for review
    try {
      const { data: order } = await supabase
        .from('ads.ad_orders')
        .select('advertiser_id,name', { filter: `id=eq.${creativeRequest.order_id}`, limit: 1 });
      if (order?.[0]) {
        const { data: adv } = await supabase
          .from('ads.advertisers')
          .select('email', { filter: `id=eq.${order[0].advertiser_id}`, limit: 1 });
        if (adv?.[0]) {
          const { sendCreativeReadyEmail } = await import('./emails.js');
          sendCreativeReadyEmail(env, adv[0].email, order[0].name).catch(() => {});
        }
      }
    } catch (e) { console.warn('[AdsAdmin] Creative ready email failed:', e.message); }

    return jsonResponse({ success: true, status: 'review' }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Submit creative draft error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/plans/:id/approve
 * Final admin release for a plan that is ready to launch
 */
export async function handleAdminApprovePlan(request, env, corsHeaders, planId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    // SECURITY: Validate planId as UUID
    const UUID_RE3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE3.test(planId)) {
      return jsonResponse({ error: 'Invalid plan ID' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('*', {
        filter: `id=eq.${planId}`,
        limit: 1,
      });

    const plan = plans?.[0];
    if (!plan) {
      return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    }

    const now = new Date();
    const planStart = plan.start_date ? new Date(plan.start_date) : now;
    const nextStatus = planStart <= now ? 'active' : 'approved';

    await supabase.from('ads.ad_plans').update(
      {
        status: nextStatus,
        creative_status: 'ready',
        updated_at: new Date().toISOString(),
      },
      `id=eq.${planId}`
    );

    await supabase.from('ads.ad_orders').update(
      {
        status: nextStatus,
        creative_status: 'ready',
        updated_at: new Date().toISOString(),
      },
      `plan_id=eq.${planId}`
    );

    return jsonResponse({ success: true, status: nextStatus }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Approve plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/plans/:id/generate-creative
 * Trigger AI creative generation for a plan in pending_creative status
 */
export async function handleAdminGenerateCreative(request, env, corsHeaders, planId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const UUID_RE3 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE3.test(planId)) {
      return jsonResponse({ error: 'Invalid plan ID' }, 400, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Get the plan
    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('*', { filter: `id=eq.${planId}`, limit: 1 });

    const plan = plans?.[0];
    if (!plan) {
      return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    }

    if (plan.creative_type !== 'philosify') {
      return jsonResponse({ error: 'Plan does not use Philosify creative' }, 400, corsHeaders);
    }

    // Get advertiser info
    const { data: advData } = await supabase
      .from('ads.advertisers')
      .select('company_name', { filter: `id=eq.${plan.advertiser_id}`, limit: 1 });

    // Get orders for placement info
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('placement,duration', { filter: `plan_id=eq.${planId}`, limit: 1 });

    // Get revision feedback from creative request (if advertiser requested changes)
    const { data: crRequests } = await supabase
      .from('ads.creative_requests')
      .select('drafts', { filter: `plan_id=eq.${planId}`, limit: 1 });

    let revisionNotes = '';
    let rawDrafts2 = crRequests?.[0]?.drafts;
    if (typeof rawDrafts2 === 'string') { try { rawDrafts2 = JSON.parse(rawDrafts2); } catch { rawDrafts2 = []; } }
    const drafts = Array.isArray(rawDrafts2) ? rawDrafts2 : [];
    if (drafts.length > 0) {
      const feedbacks = drafts
        .map((d) => d.feedback)
        .filter(Boolean);
      if (feedbacks.length > 0) {
        revisionNotes = feedbacks.join('\n');
      }
    }

    const { generateAICreative, generateAIVideo } = await import('./creatives.js');

    // Get admin notes from request body (for regeneration adjustments)
    const body = await request.json().catch(() => ({}));
    const adminNotes = body.admin_notes || '';

    let fullBrief = plan.creative_brief || '';
    if (revisionNotes) {
      fullBrief += `\n\nREVISION REQUESTED BY ADVERTISER:\n${revisionNotes}`;
    }
    if (adminNotes) {
      fullBrief += `\n\nADMIN DIRECTION:\n${adminNotes}`;
    }

    // Check if plan requests video (targeting is stored as JSON string in DB)
    let targeting = {};
    try { targeting = typeof plan.targeting === 'string' ? JSON.parse(plan.targeting) : (plan.targeting || {}); } catch {}
    const isVideo = targeting.media_format === 'video';

    const result = isVideo
      ? await generateAIVideo(env, {
          advertiserId: plan.advertiser_id,
          brief: fullBrief,
          brandName: advData?.[0]?.company_name || 'Brand',
          targetUrl: plan.target_url,
          placement: orders?.[0]?.placement || 'sidebar',
          duration: orders?.[0]?.duration || 5,
        })
      : await generateAICreative(env, {
          advertiserId: plan.advertiser_id,
          brief: fullBrief,
          brandName: advData?.[0]?.company_name || 'Brand',
          targetUrl: plan.target_url,
          placement: orders?.[0]?.placement || 'sidebar',
        });

    if (!result?.url) {
      return jsonResponse({ error: `AI ${isVideo ? 'video' : 'image'} generation failed.${result?.error ? ' ' + result.error : ''}` }, 500, corsHeaders);
    }

    // Update plan — bypass Supabase client, use raw fetch to debug
    const { url: supabaseUrl, key: supabaseKey } = await getSupabaseCredentials(env);
    
    const patchUrl = `${supabaseUrl}/rest/v1/ad_plans?id=eq.${planId}`;
    // Keep plan in pending_creative — admin must review before sending to advertiser
    const patchBody = {
      creative_url: result.url,
      creative_status: 'in_progress',
      updated_at: new Date().toISOString(),
    };
    
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'ads',
        'Accept-Profile': 'ads',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(patchBody),
    });
    
    const patchText = await patchRes.text();
    console.log(`[Ads Admin] Raw PATCH ${patchRes.status}: ${patchText.slice(0, 200)}`);
    
    if (!patchRes.ok) {
      return jsonResponse({ error: `Plan update failed: ${patchText}` }, 500, corsHeaders);
    }

    // Don't update orders/creative request yet — admin reviews first

    return jsonResponse({ success: true, creative_url: result.url }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Generate creative error:', err.message, err.stack?.slice(0, 300));
    return jsonResponse({ error: err.message || 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * DELETE /api/ads/admin/media/:path
 * Delete a creative file from R2 (authenticated admin only)
 */
export async function handleAdminDeleteMedia(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const mediaPath = url.pathname.replace(/^\/api\/ads\/admin\/media\//, '');

    if (!mediaPath || !mediaPath.startsWith('ads/')) {
      return jsonResponse({ error: 'Invalid path' }, 400, corsHeaders);
    }

    if (mediaPath.includes('..') || mediaPath.includes('//')) {
      return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
    }

    const object = await env.TTS_CACHE.head(mediaPath);
    if (!object) {
      return jsonResponse({ error: 'File not found' }, 404, corsHeaders);
    }

    await env.TTS_CACHE.delete(mediaPath);

    console.log(`[Ads Admin] Deleted media: ${mediaPath}`);
    return jsonResponse({ success: true, deleted: mediaPath }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Delete media error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/plans/:id/approve-creative
 * Admin approves the generated creative and sends it to the advertiser for review
 */
export async function handleAdminApproveCreative(request, env, corsHeaders, planId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const { url: supabaseUrl, key: supabaseKey } = await getSupabaseCredentials(env);

    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('id,creative_url,status', { filter: `id=eq.${planId}`, limit: 1 });

    const plan = plans?.[0];
    if (!plan || !plan.creative_url) {
      return jsonResponse({ error: 'Plan not found or no creative generated' }, 404, corsHeaders);
    }

    // Update plan: send to advertiser for review
    await fetch(`${supabaseUrl}/rest/v1/ad_plans?id=eq.${planId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'ads',
        'Accept-Profile': 'ads',
      },
      body: JSON.stringify({
        creative_status: 'ready',
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      }),
    });

    // Update orders
    await fetch(`${supabaseUrl}/rest/v1/ad_orders?plan_id=eq.${planId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'ads',
        'Accept-Profile': 'ads',
      },
      body: JSON.stringify({
        creative_url: plan.creative_url,
        creative_status: 'ready',
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      }),
    });

    // Update creative request
    await fetch(`${supabaseUrl}/rest/v1/creative_requests?plan_id=eq.${planId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'ads',
        'Accept-Profile': 'ads',
      },
      body: JSON.stringify({
        current_draft_url: plan.creative_url,
        status: 'review',
        updated_at: new Date().toISOString(),
      }),
    });

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Approve creative error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/plans/:id/reject-creative
 * Admin rejects the generated creative — clears it so it can be regenerated
 */
export async function handleAdminRejectCreative(request, env, corsHeaders, planId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const { url: supabaseUrl, key: supabaseKey } = await getSupabaseCredentials(env);

    // Read optional admin notes for the regeneration
    const body = await request.json().catch(() => ({}));

    // Clear creative URL, keep plan in pending_creative
    await fetch(`${supabaseUrl}/rest/v1/ad_plans?id=eq.${planId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'ads',
        'Accept-Profile': 'ads',
      },
      body: JSON.stringify({
        creative_url: null,
        creative_status: 'pending',
        status: 'pending_creative',
        updated_at: new Date().toISOString(),
      }),
    });

    // If admin provided a revised brief, update it
    if (body.revised_brief) {
      await fetch(`${supabaseUrl}/rest/v1/ad_plans?id=eq.${planId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Content-Profile': 'ads',
          'Accept-Profile': 'ads',
        },
        body: JSON.stringify({ creative_brief: body.revised_brief }),
      });
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Reject creative error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/plans/:id/pause
 */
export async function handleAdminPausePlan(request, env, corsHeaders, planId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const { url: supabaseUrl, key: supabaseKey } = await getSupabaseCredentials(env);
    const patchHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Content-Profile': 'ads', 'Accept-Profile': 'ads' };

    const { data: plans } = await supabase.from('ads.ad_plans').select('id,status', { filter: `id=eq.${planId}`, limit: 1 });
    const plan = plans?.[0];

    if (!plan) return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    if (plan.status !== 'active') return jsonResponse({ error: 'Only active campaigns can be paused' }, 400, corsHeaders);

    await fetch(`${supabaseUrl}/rest/v1/ad_plans?id=eq.${planId}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ status: 'paused', updated_at: new Date().toISOString() }) });
    await fetch(`${supabaseUrl}/rest/v1/ad_orders?plan_id=eq.${planId}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ status: 'paused', updated_at: new Date().toISOString() }) });

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Pause plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/plans/:id/resume
 */
export async function handleAdminResumePlan(request, env, corsHeaders, planId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const { url: supabaseUrl, key: supabaseKey } = await getSupabaseCredentials(env);
    const patchHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Content-Profile': 'ads', 'Accept-Profile': 'ads' };

    const { data: plans } = await supabase.from('ads.ad_plans').select('id,status', { filter: `id=eq.${planId}`, limit: 1 });
    const plan = plans?.[0];

    if (!plan) return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    if (plan.status !== 'paused') return jsonResponse({ error: 'Only paused campaigns can be resumed' }, 400, corsHeaders);

    await fetch(`${supabaseUrl}/rest/v1/ad_plans?id=eq.${planId}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ status: 'active', updated_at: new Date().toISOString() }) });
    await fetch(`${supabaseUrl}/rest/v1/ad_orders?plan_id=eq.${planId}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ status: 'active', updated_at: new Date().toISOString() }) });

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Resume plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/plans/:id/cancel
 */
export async function handleAdminCancelPlan(request, env, corsHeaders, planId) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);
    const { url: supabaseUrl, key: supabaseKey } = await getSupabaseCredentials(env);
    const patchHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Content-Profile': 'ads', 'Accept-Profile': 'ads' };

    const { data: plans } = await supabase.from('ads.ad_plans').select('id,status,advertiser_id,total_cost_cents,creative_fee_cents', { filter: `id=eq.${planId}`, limit: 1 });
    const plan = plans?.[0];

    if (!plan) return jsonResponse({ error: 'Plan not found' }, 404, corsHeaders);
    if (!['active', 'paused', 'pending_approval'].includes(plan.status)) {
      return jsonResponse({ error: 'This campaign cannot be cancelled' }, 400, corsHeaders);
    }

    // Calculate refund: total paid minus creative fee minus impressions already delivered
    const { data: orders } = await supabase.from('ads.ad_orders').select('impressions_delivered,cpm_cents', { filter: `plan_id=eq.${planId}` });
    let impressionSpend = 0;
    for (const order of orders || []) {
      impressionSpend += Math.ceil((order.impressions_delivered || 0) * (order.cpm_cents || 0) / 1000);
    }

    const creativeFee = plan.creative_fee_cents || 0;
    const totalPaid = plan.total_cost_cents || 0;
    const refundCents = Math.max(0, totalPaid - creativeFee - impressionSpend);

    // Cancel plan and orders
    await fetch(`${supabaseUrl}/rest/v1/ad_plans?id=eq.${planId}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }) });
    await fetch(`${supabaseUrl}/rest/v1/ad_orders?plan_id=eq.${planId}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ status: 'cancelled', updated_at: new Date().toISOString() }) });

    // Refund remaining balance to advertiser
    if (refundCents > 0 && plan.advertiser_id) {
      const { data: advData } = await supabase.from('ads.advertisers').select('balance_cents', { filter: `id=eq.${plan.advertiser_id}`, limit: 1 });
      const currentBalance = advData?.[0]?.balance_cents || 0;
      const newBalance = currentBalance + refundCents;

      await fetch(`${supabaseUrl}/rest/v1/advertisers?id=eq.${plan.advertiser_id}`, { method: 'PATCH', headers: patchHeaders, body: JSON.stringify({ balance_cents: newBalance, updated_at: new Date().toISOString() }) });

      await supabase.from('ads.advertiser_transactions').insert({
        advertiser_id: plan.advertiser_id,
        type: 'refund',
        amount_cents: refundCents,
        balance_after_cents: newBalance,
        description: 'Campaign cancelled — unused impressions refund',
      });
    }

    return jsonResponse({ success: true, refunded_cents: refundCents }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Cancel plan error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/fix-billing
 * One-time fix: clear duplicate transactions and rebuild from source of truth.
 */
export async function handleAdminFixBilling(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Get all advertisers
    const { data: advertisers } = await supabase
      .from('ads.advertisers')
      .select('id');

    const results = [];

    for (const adv of advertisers || []) {
      // Delete ALL transactions for this advertiser
      await supabase.from('ads.advertiser_transactions').delete(`advertiser_id=eq.${adv.id}`);

      // Get all paid plans
      const { data: plans } = await supabase
        .from('ads.ad_plans')
        .select('id,name,total_cost_cents,creative_fee_cents,paid_at', {
          filter: `advertiser_id=eq.${adv.id}`,
          order: 'paid_at.asc',
        });

      const paidPlans = (plans || []).filter((p) => p.paid_at);
      let balance = 0;

      for (const plan of paidPlans) {
        const { data: orders } = await supabase
          .from('ads.ad_orders')
          .select('impressions_delivered,cpm_cents', { filter: `plan_id=eq.${plan.id}` });

        let impressionSpend = 0;
        let totalImpressions = 0;
        for (const order of orders || []) {
          impressionSpend += Math.ceil((order.impressions_delivered || 0) * (order.cpm_cents || 0) / 1000);
          totalImpressions += order.impressions_delivered || 0;
        }

        // Deposit
        balance += plan.total_cost_cents;
        await supabase.from('ads.advertiser_transactions').insert({
          advertiser_id: adv.id,
          type: 'deposit',
          amount_cents: plan.total_cost_cents,
          balance_after_cents: balance,
          description: `${plan.name} — payment received`,
          created_at: plan.paid_at,
        });

        // Creative fee
        const creativeFee = plan.creative_fee_cents || 0;
        if (creativeFee > 0) {
          balance -= creativeFee;
          await supabase.from('ads.advertiser_transactions').insert({
            advertiser_id: adv.id,
            type: 'campaign_spend',
            amount_cents: -creativeFee,
            balance_after_cents: balance,
            description: `${plan.name} — creative fee`,
            created_at: plan.paid_at,
          });
        }

        // Impression spend
        if (impressionSpend > 0) {
          balance -= impressionSpend;
          await supabase.from('ads.advertiser_transactions').insert({
            advertiser_id: adv.id,
            type: 'campaign_spend',
            amount_cents: -impressionSpend,
            balance_after_cents: balance,
            description: `${plan.name} — ${totalImpressions} impressions delivered`,
          });
        }
      }

      // Update balance
      await supabase.from('ads.advertisers').update(
        { balance_cents: balance, updated_at: new Date().toISOString() },
        `id=eq.${adv.id}`
      );

      results.push({ advertiser: adv.id, balance, plans: paidPlans.length });
    }

    return jsonResponse({ success: true, results }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Fix billing error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/admin/backfill-transactions
 * @deprecated Use fix-billing instead
 */
export async function handleAdminBackfillTransactions(request, env, corsHeaders) {
  try {
    if (!await verifyAdmin(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const supabase = await getServiceSupabase(env);

    // Get all paid plans
    const { data: plans } = await supabase
      .from('ads.ad_plans')
      .select('id,advertiser_id,name,total_cost_cents,creative_fee_cents,paid_at');

    const paidPlans = (plans || []).filter((p) => p.paid_at);
    const results = [];

    for (const plan of paidPlans) {
      // Check if transactions already exist for this plan
      const { data: existing } = await supabase
        .from('ads.advertiser_transactions')
        .select('id', { filter: `advertiser_id=eq.${plan.advertiser_id}&description=cs.${encodeURIComponent(plan.name)}`, limit: 1 });

      if (existing && existing.length > 0) {
        results.push({ plan: plan.name, status: 'skipped — transactions exist' });
        continue;
      }

      // Get orders for impression data
      const { data: orders } = await supabase
        .from('ads.ad_orders')
        .select('impressions_delivered,cpm_cents', { filter: `plan_id=eq.${plan.id}` });

      let totalImpressionSpend = 0;
      for (const order of orders || []) {
        totalImpressionSpend += Math.ceil((order.impressions_delivered || 0) * (order.cpm_cents || 0) / 1000);
      }

      // Clear any partial transactions
      // (none should exist since we checked above)

      let balance = 0;

      // Get current balance
      const { data: advData } = await supabase
        .from('ads.advertisers')
        .select('balance_cents', { filter: `id=eq.${plan.advertiser_id}`, limit: 1 });
      balance = advData?.[0]?.balance_cents || 0;

      // 1. Deposit
      balance += plan.total_cost_cents;
      await supabase.from('ads.advertiser_transactions').insert({
        advertiser_id: plan.advertiser_id,
        type: 'deposit',
        amount_cents: plan.total_cost_cents,
        balance_after_cents: balance,
        description: `${plan.name} — payment received`,
      });

      // 2. Creative fee
      const creativeFee = plan.creative_fee_cents || 0;
      if (creativeFee > 0) {
        balance -= creativeFee;
        await supabase.from('ads.advertiser_transactions').insert({
          advertiser_id: plan.advertiser_id,
          type: 'campaign_spend',
          amount_cents: -creativeFee,
          balance_after_cents: balance,
          description: `${plan.name} — creative fee`,
        });
      }

      // 3. Impression spend
      if (totalImpressionSpend > 0) {
        balance -= totalImpressionSpend;
        const totalImpressions = (orders || []).reduce((sum, o) => sum + (o.impressions_delivered || 0), 0);
        await supabase.from('ads.advertiser_transactions').insert({
          advertiser_id: plan.advertiser_id,
          type: 'campaign_spend',
          amount_cents: -totalImpressionSpend,
          balance_after_cents: balance,
          description: `${plan.name} — ${totalImpressions} impressions delivered`,
        });
      }

      // 4. Update advertiser balance
      await supabase.from('ads.advertisers').update(
        { balance_cents: balance, updated_at: new Date().toISOString() },
        `id=eq.${plan.advertiser_id}`
      );

      results.push({
        plan: plan.name,
        status: 'backfilled',
        deposit: plan.total_cost_cents,
        creativeFee,
        impressionSpend: totalImpressionSpend,
        balance,
      });
    }

    return jsonResponse({ success: true, results }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Backfill error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}
