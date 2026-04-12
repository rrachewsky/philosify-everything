// ============================================================
// ADS PLATFORM - ADMIN HANDLERS
// ============================================================
// Owner-only endpoints for vetting and management

import { getServiceSupabase } from '../../utils/supabase.js';
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

    // SECURITY: Validate status against allowlist to prevent PostgREST filter injection
    const VALID_CR_STATUSES = ['pending', 'in_progress', 'completed', 'rejected', 'cancelled'];
    if (status) {
      if (!VALID_CR_STATUSES.includes(status)) {
        return jsonResponse({ error: 'Invalid status filter' }, 400, corsHeaders);
      }
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
      .select('placement', { filter: `plan_id=eq.${planId}`, limit: 1 });

    // Get revision feedback from creative request (if advertiser requested changes)
    const { data: crRequests } = await supabase
      .from('ads.creative_requests')
      .select('drafts', { filter: `plan_id=eq.${planId}`, limit: 1 });

    let revisionNotes = '';
    const drafts = crRequests?.[0]?.drafts;
    if (Array.isArray(drafts)) {
      const feedbacks = drafts
        .map((d) => d.feedback)
        .filter(Boolean);
      if (feedbacks.length > 0) {
        revisionNotes = feedbacks.join('\n');
      }
    }

    const { generateAICreative } = await import('./creatives.js');

    const fullBrief = revisionNotes
      ? `${plan.creative_brief || ''}\n\nREVISION REQUESTED BY ADVERTISER:\n${revisionNotes}`
      : plan.creative_brief || '';

    const result = await generateAICreative(env, {
      advertiserId: plan.advertiser_id,
      brief: fullBrief,
      brandName: advData?.[0]?.company_name || 'Brand',
      targetUrl: plan.target_url,
      placement: orders?.[0]?.placement || 'sidebar',
    });

    if (!result?.url) {
      return jsonResponse({ error: 'AI generation failed. Brief may have been rejected by content moderation.' }, 500, corsHeaders);
    }

    // Update plan
    const { error: planErr } = await supabase.from('ads.ad_plans').update(
      {
        creative_url: result.url,
        creative_status: 'review',
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      },
      `id=eq.${planId}`
    );
    if (planErr) console.error('[Ads Admin] Plan update error:', JSON.stringify(planErr));

    // Update orders
    const { error: orderErr } = await supabase.from('ads.ad_orders').update(
      {
        creative_url: result.url,
        creative_status: 'ready',
        status: 'pending_approval',
        updated_at: new Date().toISOString(),
      },
      `plan_id=eq.${planId}`
    );
    if (orderErr) console.error('[Ads Admin] Order update error:', JSON.stringify(orderErr));

    // Update creative request if exists
    await supabase.from('ads.creative_requests').update(
      {
        current_draft_url: result.url,
        status: 'review',
        drafts: JSON.stringify([{ url: result.url, generated_at: new Date().toISOString(), method: 'dall-e-3' }]),
        updated_at: new Date().toISOString(),
      },
      `plan_id=eq.${planId}`
    );

    return jsonResponse({ success: true, creative_url: result.url }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads Admin] Generate creative error:', err);
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
