// ============================================================
// SHARING SYSTEM
// ============================================================
// Handles WhatsApp sharing, referral tracking, and credit bonuses

import { getSecret } from '../utils/secrets.js';

/**
 * Generate a random alphanumeric slug for share tokens
 * @param {number} length - Length of slug (default: 8)
 * @returns {string} Random slug (e.g., "x4H7Qk2P")
 */
export function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  // Use crypto.getRandomValues() for cryptographically secure random tokens
  // This prevents predictable token generation and enumeration attacks
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Create a shareable link for an analysis
 * @param {object} env - Cloudflare environment
 * @param {string} analysisId - UUID of the analysis
 * @param {string} userId - UUID of user creating the share
 * @param {string} origin - Optional: request origin for dynamic URL generation
 * @returns {Promise<object>} { success, slug, url, error }
 */
export async function createShareToken(env, analysisId, userId, origin = null) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  // Try up to 5 times to generate unique slug (collision is extremely rare)
  const maxAttempts = 5;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const slug = generateSlug(8);

    try {
      // Call Supabase function to create share token
      const rpcUrl = `${supabaseUrl}/rest/v1/rpc/create_share_token`;
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_analysis_id: analysisId,
          p_user_id: userId,
          p_slug: slug
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Sharing] RPC error (attempt ${attempt}):`, error);

        if (attempt >= maxAttempts) {
          return { success: false, error: 'Failed to create share token' };
        }
        continue; // Try again with new slug
      }

      const result = await response.json();
      const data = Array.isArray(result) ? result[0] : result;

      if (!data || !data.success) {
        if (data?.error_message === 'Slug collision') {
          console.log(`[Sharing] Slug collision on attempt ${attempt}, retrying...`);
          continue; // Try again with new slug
        }

        return {
          success: false,
          error: data?.error_message || 'Failed to create share token'
        };
      }

      // Success! Generate full URL
      // Use origin if provided (for local development), otherwise use production URL
      let baseUrl = 'https://philosify.org';
      if (origin && origin.includes('localhost')) {
        baseUrl = origin;
      }
      const shareUrl = `${baseUrl}/a/${data.slug}`;

      console.log(`[Sharing] Created share token: ${data.slug} for analysis ${analysisId} (URL: ${shareUrl})`);

      return {
        success: true,
        slug: data.slug,
        url: shareUrl,
        id: data.id
      };

    } catch (error) {
      console.error(`[Sharing] Error on attempt ${attempt}:`, error);

      if (attempt >= maxAttempts) {
        console.error(`[Sharing] FAILED after ${maxAttempts} attempts - giving up`);
        return { success: false, error: 'Failed to create share link' };
      }
    }
  }

  console.error(`[Sharing] FAILED - exhausted all ${maxAttempts} attempts`);
  return { success: false, error: 'Failed to generate unique slug' };
}

/**
 * Get analysis from a share token
 * @param {object} env - Cloudflare environment
 * @param {string} slug - Share token slug
 * @param {string} viewerUserId - Optional: UUID of viewer
 * @returns {Promise<object>} { success, analysis, expired, maxViewsReached, error }
 */
export async function getSharedAnalysis(env, slug, viewerUserId = null) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  try {
    // Call Supabase function to get shared analysis
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_shared_analysis`;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_slug: slug,
        p_viewer_user_id: viewerUserId
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Sharing] Failed to get shared analysis:', error);
      return { success: false, error: 'Failed to retrieve shared analysis' };
    }

    const result = await response.json();
    const data = Array.isArray(result) ? result[0] : result;

    if (!data || !data.success) {
      return {
        success: false,
        expired: data?.expired || false,
        maxViewsReached: data?.max_views_reached || false,
        error: data?.error_message || 'Share link not valid'
      };
    }

    // Fetch the actual analysis with song details (join with songs table)
    const analysisUrl = `${supabaseUrl}/rest/v1/analyses?id=eq.${data.analysis_id}&select=*,songs(title,artist,spotify_id)`;
    const analysisResponse = await fetch(analysisUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!analysisResponse.ok) {
      console.error('[Sharing] Failed to fetch analysis');
      return { success: false, error: 'Analysis not found' };
    }

    const analyses = await analysisResponse.json();

    if (!analyses || analyses.length === 0) {
      return { success: false, error: 'Analysis not found' };
    }

    // Flatten the song data into the analysis object
    const analysis = analyses[0];
    const songData = analysis.songs;

    // Merge song data into analysis for frontend compatibility
    const enrichedAnalysis = {
      ...analysis,
      song: songData?.title,
      song_name: songData?.title,
      title: songData?.title,
      artist: songData?.artist,
      spotify_id: songData?.spotify_id || analysis.spotify_id
    };

    // Remove the nested songs object
    delete enrichedAnalysis.songs;

    console.log(`[Sharing] Retrieved shared analysis for slug: ${slug}`);

    return {
      success: true,
      analysis: enrichedAnalysis
    };

  } catch (error) {
    console.error('[Sharing] Error getting shared analysis:', error);
    return { success: false, error: 'Failed to get shared analysis' };
  }
}

/**
 * Track referral when new user signs up from a share link
 * @param {object} env - Cloudflare environment
 * @param {string} slug - Share token slug
 * @param {string} newUserId - UUID of the new user who signed up
 * @param {number} bonusCredits - Credits to grant (default: 2)
 * @returns {Promise<object>} { success, referrerUserId, alreadyReferred, error }
 */
export async function trackReferral(env, slug, newUserId, bonusCredits = 2) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  try {
    // Call Supabase function to track referral and grant bonuses
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/track_referral`;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_slug: slug,
        p_new_user_id: newUserId,
        p_bonus_credits: bonusCredits
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Sharing] Failed to track referral:', error);
      return { success: false, error: 'Failed to track referral' };
    }

    const result = await response.json();
    const data = Array.isArray(result) ? result[0] : result;

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error_message || 'Failed to track referral'
      };
    }

    if (data.already_referred) {
      console.log(`[Sharing] User ${newUserId} was already referred via ${slug}`);
      return {
        success: true,
        alreadyReferred: true,
        referrerUserId: data.referrer_user_id
      };
    }

    console.log(`[Sharing] Referral tracked: ${data.referrer_user_id} -> ${newUserId} (${bonusCredits} credits each)`);

    return {
      success: true,
      alreadyReferred: false,
      referrerUserId: data.referrer_user_id
    };

  } catch (error) {
    console.error('[Sharing] Error tracking referral:', error);
    return { success: false, error: 'Failed to track referral' };
  }
}
