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
