// ============================================================
// ADS PLATFORM - CAMPAIGN HANDLERS
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getAdvertiserFromRequest, getCpmCents, isValidUrl } from './utils.js';

/**
 * GET /api/ads/campaigns
 * List campaigns for current advertiser
 */
export async function handleListCampaigns(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(parseInt(url.searchParams.get('limit'), 10) || 50, 100);

    let filter = `advertiser_id=eq.${advertiser.id}`;
    if (status && status !== 'all') {
      filter += `&status=eq.${status}`;
    }

    const { data: campaigns, error } = await supabase
      .from('ads.ad_campaigns')
      .select('*', { filter, order: 'created_at.desc', limit });

    if (error) {
      console.error('[Ads] List campaigns error:', error);
      return jsonResponse({ error: 'Failed to load campaigns' }, 500, corsHeaders);
    }

    return jsonResponse({ campaigns: campaigns || [] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] List campaigns error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/campaigns/:id
 * Get single campaign
 */
export async function handleGetCampaign(request, env, corsHeaders, campaignId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: campaigns, error } = await supabase
      .from('ads.ad_campaigns')
      .select('*', { filter: `id=eq.${campaignId}&advertiser_id=eq.${advertiser.id}` });

    if (error || !campaigns || campaigns.length === 0) {
      return jsonResponse({ error: 'Campaign not found' }, 404, corsHeaders);
    }

    return jsonResponse({ campaign: campaigns[0] }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get campaign error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/campaigns
 * Create new campaign
 */
export async function handleCreateCampaign(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const body = await request.json();
    const { name, placement, duration, target_url, budget_cents, creative_url } = body;

    // Validation
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

    if (!budget_cents || budget_cents < 1000) {
      return jsonResponse({ error: 'Minimum budget is $10' }, 400, corsHeaders);
    }

    if (!creative_url) {
      return jsonResponse({ error: 'Creative URL is required' }, 400, corsHeaders);
    }

    // Get CPM
    const cpm_cents = getCpmCents(placement, duration);
    if (!cpm_cents) {
      return jsonResponse({ error: 'Invalid placement/duration combination' }, 400, corsHeaders);
    }

    // Determine initial status
    // If advertiser is approved, campaign can go active (or pending review if we want)
    // For now, approved advertisers get active campaigns immediately
    const status = advertiser.status === 'approved' ? 'active' : 'pending';

    const { data: campaign, error } = await supabase
      .from('ads.ad_campaigns')
      .insert({
        advertiser_id: advertiser.id,
        name,
        placement,
        duration,
        target_url,
        budget_cents,
        creative_url,
        cpm_cents,
        status,
        approved_at: status === 'active' ? new Date().toISOString() : null,
      });

    if (error) {
      console.error('[Ads] Create campaign error:', error);
      return jsonResponse({ error: 'Failed to create campaign' }, 500, corsHeaders);
    }

    return jsonResponse({ campaign, success: true }, 201, corsHeaders);
  } catch (err) {
    console.error('[Ads] Create campaign error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * PUT /api/ads/campaigns/:id
 * Update campaign
 */
export async function handleUpdateCampaign(request, env, corsHeaders, campaignId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('ads.ad_campaigns')
      .select('*', { filter: `id=eq.${campaignId}&advertiser_id=eq.${advertiser.id}` });

    if (!existing || existing.length === 0) {
      return jsonResponse({ error: 'Campaign not found' }, 404, corsHeaders);
    }

    const campaign = existing[0];
    const body = await request.json();

    // Build update object
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
      if (body.budget_cents < 1000) {
        return jsonResponse({ error: 'Minimum budget is $10' }, 400, corsHeaders);
      }
      // Can only increase budget, not decrease below spent
      if (body.budget_cents < campaign.spent_cents) {
        return jsonResponse({ error: 'Budget cannot be less than amount already spent' }, 400, corsHeaders);
      }
      updates.budget_cents = body.budget_cents;
      
      // If campaign was exhausted and budget increased, reactivate
      if (campaign.status === 'exhausted' && body.budget_cents > campaign.spent_cents) {
        updates.status = 'active';
      }
    }

    if (body.status !== undefined) {
      // Only allow pause/resume
      if (body.status === 'paused' && campaign.status === 'active') {
        updates.status = 'paused';
        updates.paused_at = new Date().toISOString();
      } else if (body.status === 'active' && campaign.status === 'paused') {
        updates.status = 'active';
        updates.paused_at = null;
      }
    }

    // Placement and duration cannot be changed after creation
    if (body.placement !== undefined && body.placement !== campaign.placement) {
      return jsonResponse({ error: 'Placement cannot be changed after creation' }, 400, corsHeaders);
    }
    if (body.duration !== undefined && body.duration !== campaign.duration) {
      return jsonResponse({ error: 'Duration cannot be changed after creation' }, 400, corsHeaders);
    }

    const { data: updated, error } = await supabase
      .from('ads.ad_campaigns')
      .update(updates, `id=eq.${campaignId}`);

    if (error) {
      console.error('[Ads] Update campaign error:', error);
      return jsonResponse({ error: 'Failed to update campaign' }, 500, corsHeaders);
    }

    return jsonResponse({ campaign: updated, success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Update campaign error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * DELETE /api/ads/campaigns/:id
 * Delete campaign
 */
export async function handleDeleteCampaign(request, env, corsHeaders, campaignId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('ads.ad_campaigns')
      .select('id', { filter: `id=eq.${campaignId}&advertiser_id=eq.${advertiser.id}` });

    if (!existing || existing.length === 0) {
      return jsonResponse({ error: 'Campaign not found' }, 404, corsHeaders);
    }

    const { error } = await supabase
      .from('ads.ad_campaigns')
      .delete(`id=eq.${campaignId}`);

    if (error) {
      console.error('[Ads] Delete campaign error:', error);
      return jsonResponse({ error: 'Failed to delete campaign' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Delete campaign error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}
