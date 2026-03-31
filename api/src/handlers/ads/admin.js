// ============================================================
// ADS PLATFORM - ADMIN HANDLERS
// ============================================================
// Owner-only endpoints for vetting and management

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getSecret } from '../../utils/secrets.js';
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
  
  // Timing-safe comparison
  if (providedSecret.length !== adminSecret.length) return false;
  let diff = 0;
  for (let i = 0; i < providedSecret.length; i++) {
    diff |= providedSecret.charCodeAt(i) ^ adminSecret.charCodeAt(i);
  }
  return diff === 0;
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
      console.error('[Ads Admin] List pending error:', error);
      return jsonResponse({ error: 'Failed to load pending advertisers' }, 500, corsHeaders);
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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Manually approved by owner';

    const supabase = await getServiceSupabase(env);
    await manualVet(supabase, advertiserId, true, reason, 'owner');

    // Activate any pending campaigns for this advertiser
    await supabase.from('ads.ad_campaigns').update(
      { status: 'active', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      `advertiser_id=eq.${advertiserId}&status=eq.pending`
    );

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

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Rejected by owner';

    const supabase = await getServiceSupabase(env);
    await manualVet(supabase, advertiserId, false, reason, 'owner');

    // Reject any pending campaigns
    await supabase.from('ads.ad_campaigns').update(
      { status: 'rejected', updated_at: new Date().toISOString() },
      `advertiser_id=eq.${advertiserId}&status=eq.pending`
    );

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

    if (status) {
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
      console.error('[Ads Admin] List plans error:', error);
      return jsonResponse({ error: 'Failed to load plans' }, 500, corsHeaders);
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

    return jsonResponse({
      plans: (plans || []).map((plan) => ({
        ...plan,
        advertiser: advertiserMap[plan.advertiser_id] || null,
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

    if (status) {
      filters.push(`status=eq.${status}`);
    }

    const { data: requests, error } = await supabase
      .from('ads.creative_requests')
      .select('*', {
        filter: filters.join('&'),
        order: 'updated_at.desc',
        limit,
      });

    if (error) {
      console.error('[Ads Admin] List creative requests error:', error);
      return jsonResponse({ error: 'Failed to load creative requests' }, 500, corsHeaders);
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

    const drafts = Array.isArray(creativeRequest.drafts) ? [...creativeRequest.drafts] : [];
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
