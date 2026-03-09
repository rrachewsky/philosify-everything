// ============================================================
// HANDLER - ANALYSIS HISTORY
// ============================================================
// Returns user's analysis history with song details
// Uses user's token so RLS is enforced (defense in depth)
//
// GET /api/analysis-history
// Auth: Required (via HttpOnly cookie)
// Response: { success: true, items: [...] }

import { jsonResponse } from '../utils/response.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';

/**
 * Handle GET /api/analysis-history
 * Returns user's analysis history (songs they've analyzed)
 * RLS enforced - queries authenticated as user
 */
export async function handleAnalysisHistory(request, env, origin) {
  // Only allow GET
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, origin, env);
  }

  try {
    // Get Supabase client authenticated as user (RLS enforced)
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;
    console.log(`[Analysis History] Fetching history for user: ${userId}`);

    // 1. Get user's analysis request IDs (source of truth for what user requested)
    // RLS will automatically filter to user's own records
    const { data: reqs, error: reqErr } = await supabase
      .from('user_analysis_requests')
      .select('analysis_id, requested_at')
      .order('requested_at', { ascending: false })
      .limit(50);

    if (reqErr) {
      console.error('[Analysis History] user_analysis_requests query failed:', reqErr);
      return jsonResponse({ success: false, error: 'Failed to fetch history' }, 500, origin, env);
    }

    const analysisIds = (reqs || []).map((r) => r.analysis_id).filter(Boolean);

    if (analysisIds.length === 0) {
      console.log('[Analysis History] No history found for user');
      let response = jsonResponse({ success: true, items: [] }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    // Build map of analysis_id -> requested_at for sorting
    const requestedAtById = new Map(
      (reqs || []).map((r) => [r.analysis_id, r.requested_at])
    );

    // 2. Fetch analyses with song details
    // Note: analyses table may have different RLS (shared data), but we filter by IDs from user's requests
    const { data: analyses, error: aErr } = await supabase
      .from('analyses')
      .select(
        `
        id,
        song_id,
        songs:song_id (
          title,
          artist,
          spotify_id
        )
      `
      )
      .in('id', analysisIds);

    if (aErr) {
      console.error('[Analysis History] analyses query failed:', aErr);
      return jsonResponse({ success: false, error: 'Failed to fetch analyses' }, 500, origin, env);
    }

    // 3. Normalize and sort results
    const items = (analyses || [])
      .map((a) => {
        const song = a.songs ? (Array.isArray(a.songs) ? a.songs[0] : a.songs) : null;
        return {
          analysisId: a.id,
          requestedAt: requestedAtById.get(a.id) || null,
          title: song?.title || null,
          artist: song?.artist || null,
          spotifyId: song?.spotify_id || null,
        };
      })
      .filter((x) => x.analysisId)
      // Sort by requested_at descending (most recent first)
      .sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return dateB - dateA;
      });

    console.log(`[Analysis History] Returning ${items.length} items for user ${userId}`);

    let response = jsonResponse({ success: true, items }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (error) {
    console.error('[Analysis History] Error:', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500, origin, env);
  }
}
