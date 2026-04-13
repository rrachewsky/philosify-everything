// ============================================================
// ADS PLATFORM - ACCOUNT HANDLERS
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import {
  getAdvertiserFromRequest,
  isValidEmail,
  isValidUrl,
} from './utils.js';
import { getSupabaseCredentials } from '../../utils/supabase.js';

/**
 * PUT /api/ads/account/profile
 * Update advertiser profile
 */
export async function handleUpdateProfile(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const body = await request.json();
    const updates = { updated_at: new Date().toISOString() };

    if (body.company_name !== undefined) {
      if (body.company_name.length < 2 || body.company_name.length > 100) {
        return jsonResponse({ error: 'Company name must be 2-100 characters' }, 400, corsHeaders);
      }
      updates.company_name = body.company_name;
    }

    if (body.website !== undefined) {
      if (body.website && !isValidUrl(body.website)) {
        return jsonResponse({ error: 'Invalid website URL' }, 400, corsHeaders);
      }
      updates.website = body.website || null;
    }

    if (body.contact_email !== undefined) {
      if (body.contact_email && !isValidEmail(body.contact_email)) {
        return jsonResponse({ error: 'Invalid contact email' }, 400, corsHeaders);
      }
      updates.contact_email = body.contact_email || advertiser.email;
    }

    const { data: updated, error } = await supabase
      .from('ads.advertisers')
      .update(updates, `id=eq.${advertiser.id}`);

    if (error) {
      console.error('[Ads] Update profile error:', error);
      return jsonResponse({ error: 'Failed to update profile' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true, advertiser: updated }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Update profile error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * PUT /api/ads/account/password
 * Change password via Supabase Auth
 */
export async function handleChangePassword(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (!advertiser.user_id) {
      return jsonResponse({ error: 'Account not linked to auth system' }, 400, corsHeaders);
    }

    const body = await request.json();
    const { new_password } = body;

    if (!new_password) {
      return jsonResponse({ error: 'New password is required' }, 400, corsHeaders);
    }

    if (new_password.length < 8) {
      return jsonResponse({ error: 'New password must be at least 8 characters' }, 400, corsHeaders);
    }

    // Update password via Supabase Admin API
    const { url, key } = await getSupabaseCredentials(env);

    const response = await fetch(`${url}/auth/v1/admin/users/${advertiser.user_id}`, {
      method: 'PUT',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: new_password }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Ads] Change password error:', error);
      return jsonResponse({ error: 'Failed to change password' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Change password error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * DELETE /api/ads/account
 * Delete advertiser account
 */
export async function handleDeleteAccount(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Delete Supabase auth user if linked
    if (advertiser.user_id) {
      const { url, key } = await getSupabaseCredentials(env);
      await fetch(`${url}/auth/v1/admin/users/${advertiser.user_id}`, {
        method: 'DELETE',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
    }

    // Delete advertiser (cascades to campaigns, impressions, transactions)
    const { error } = await supabase
      .from('ads.advertisers')
      .delete(`id=eq.${advertiser.id}`);

    if (error) {
      console.error('[Ads] Delete account error:', error);
      return jsonResponse({ error: 'Failed to delete account' }, 500, corsHeaders);
    }

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Delete account error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/stats/overview
 * Get advertiser stats overview
 */
export async function handleStatsOverview(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    // Get aggregate stats from campaigns
    const { data: campaigns } = await supabase
      .from('ads.ad_campaigns')
      .select('impressions,clicks,spent_cents', { filter: `advertiser_id=eq.${advertiser.id}` });

    const stats = (campaigns || []).reduce(
      (acc, c) => ({
        totalImpressions: acc.totalImpressions + (c.impressions || 0),
        totalClicks: acc.totalClicks + (c.clicks || 0),
        totalSpent: acc.totalSpent + (c.spent_cents || 0),
      }),
      { totalImpressions: 0, totalClicks: 0, totalSpent: 0 }
    );

    const clickRate = stats.totalImpressions > 0
      ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2)
      : '0';

    return jsonResponse({
      totalImpressions: stats.totalImpressions,
      totalClicks: stats.totalClicks,
      clickRate,
      totalSpentCents: stats.totalSpent,
      balanceCents: advertiser.balance_cents,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Stats overview error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

// ============================================================
// AGENCY INVITATIONS (advertiser side)
// ============================================================

/**
 * GET /api/ads/account/invitations
 * List pending agency invitations for this advertiser
 */
export async function handleListInvitations(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const { data: invitations } = await supabase
      .from('ads.agency_clients')
      .select('id,agency_id,commission_rate,status,created_at', {
        filter: `advertiser_id=eq.${advertiser.id}`,
        order: 'created_at.desc',
      });

    // Get agency names for each invitation
    const agencyIds = [...new Set((invitations || []).map((i) => i.agency_id).filter(Boolean))];
    let agencyMap = {};

    if (agencyIds.length > 0) {
      const { data: agencies } = await supabase
        .from('ads.agencies')
        .select('id,agency_name,email,website', {
          filter: `id=in.(${agencyIds.join(',')})`,
        });
      agencyMap = Object.fromEntries((agencies || []).map((a) => [a.id, a]));
    }

    return jsonResponse({
      invitations: (invitations || []).map((inv) => ({
        ...inv,
        agency: agencyMap[inv.agency_id] || null,
      })),
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] List invitations error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/account/invitations/:id/accept
 * Advertiser accepts an agency invitation
 */
export async function handleAcceptInvitation(request, env, corsHeaders, invitationId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(invitationId)) {
      return jsonResponse({ error: 'Invalid invitation ID' }, 400, corsHeaders);
    }

    // Verify invitation belongs to this advertiser and is pending
    const { data: invitations } = await supabase
      .from('ads.agency_clients')
      .select('id,agency_id,commission_rate,status', {
        filter: `id=eq.${invitationId}&advertiser_id=eq.${advertiser.id}`,
        limit: 1,
      });

    const invitation = invitations?.[0];
    if (!invitation) {
      return jsonResponse({ error: 'Invitation not found' }, 404, corsHeaders);
    }

    if (invitation.status !== 'pending') {
      return jsonResponse({ error: 'Invitation is no longer pending' }, 400, corsHeaders);
    }

    // Accept: update agency_clients status and link advertiser to agency
    await supabase.from('ads.agency_clients').update(
      { status: 'active', updated_at: new Date().toISOString() },
      `id=eq.${invitationId}`
    );

    await supabase.from('ads.advertisers').update(
      {
        agency_id: invitation.agency_id,
        agency_commission_pct: invitation.commission_rate,
        updated_at: new Date().toISOString(),
      },
      `id=eq.${advertiser.id}`
    );

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Accept invitation error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/account/invitations/:id/decline
 * Advertiser declines an agency invitation
 */
export async function handleDeclineInvitation(request, env, corsHeaders, invitationId) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(invitationId)) {
      return jsonResponse({ error: 'Invalid invitation ID' }, 400, corsHeaders);
    }

    const { data: invitations } = await supabase
      .from('ads.agency_clients')
      .select('id,status', {
        filter: `id=eq.${invitationId}&advertiser_id=eq.${advertiser.id}`,
        limit: 1,
      });

    if (!invitations?.[0] || invitations[0].status !== 'pending') {
      return jsonResponse({ error: 'Invitation not found or not pending' }, 404, corsHeaders);
    }

    await supabase.from('ads.agency_clients').update(
      { status: 'removed', updated_at: new Date().toISOString() },
      `id=eq.${invitationId}`
    );

    return jsonResponse({ success: true }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Decline invitation error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/account/request-agency
 * Advertiser requests to join an agency (by agency email)
 */
export async function handleRequestAgency(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    if (advertiser.agency_id) {
      return jsonResponse({ error: 'Already managed by an agency' }, 409, corsHeaders);
    }

    const body = await request.json();
    const { agency_email } = body;

    if (!agency_email) {
      return jsonResponse({ error: 'Agency email is required' }, 400, corsHeaders);
    }

    // Find the agency
    const { data: agencies } = await supabase
      .from('ads.agencies')
      .select('id,agency_name,email,status', {
        filter: `email=eq.${agency_email.toLowerCase()}`,
        limit: 1,
      });

    const agency = agencies?.[0];
    if (!agency) {
      return jsonResponse({ error: 'No agency found with this email' }, 404, corsHeaders);
    }

    if (agency.status !== 'approved') {
      return jsonResponse({ error: 'This agency is not active' }, 400, corsHeaders);
    }

    // Check for existing link
    const { data: existing } = await supabase
      .from('ads.agency_clients')
      .select('id,status', {
        filter: `agency_id=eq.${agency.id}&advertiser_id=eq.${advertiser.id}`,
        limit: 1,
      });

    if (existing?.[0]) {
      if (existing[0].status === 'pending') {
        return jsonResponse({ error: 'Request already pending' }, 409, corsHeaders);
      }
      if (existing[0].status === 'active') {
        return jsonResponse({ error: 'Already a client of this agency' }, 409, corsHeaders);
      }
    }

    // Create pending request (agency will see it in their client list)
    await supabase.from('ads.agency_clients').insert({
      agency_id: agency.id,
      advertiser_id: advertiser.id,
      commission_rate: agency.default_commission_pct || 15,
      status: 'pending',
    });

    return jsonResponse({
      success: true,
      agency_name: agency.agency_name,
    }, 201, corsHeaders);
  } catch (err) {
    console.error('[Ads] Request agency error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}
