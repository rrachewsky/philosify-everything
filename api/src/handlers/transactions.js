// ============================================================
// HANDLER - TRANSACTIONS (ENHANCED)
// ============================================================
// Returns credit history with linked analysis details for consume transactions
// Uses user's token so RLS is enforced (defense in depth)
//
// GET /api/transactions
// Auth: Required (via HttpOnly cookie)
// Response: { success: true, transactions: [...] }

import { jsonResponse } from '../utils/response.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';

/**
 * Handle GET /api/transactions
 * Returns credit history with linked analysis details
 * RLS enforced - queries authenticated as user
 */
export async function handleTransactions(request, env, origin) {
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
    console.log(`[Transactions] Fetching transactions for user: ${userId}`);

    // 1. Get credit history (RLS filters to user's records)
    const { data: credits, error: credErr } = await supabase
      .from('credit_history')
      .select('id, type, amount, stripe_session_id, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(50);

    if (credErr) {
      console.error('[Transactions] credit_history query failed:', credErr);
      return jsonResponse({ success: false, error: 'Failed to fetch transactions' }, 500, origin, env);
    }

    // 2. For consume/analysis transactions, link to analyses
    const enriched = await Promise.all(
      (credits || []).map(async (tx) => {
        // Only enrich consume/analysis type transactions
        if (tx.type !== 'consume' && tx.type !== 'analysis') {
          return tx;
        }

        try {
          // Strategy 1: Check metadata.analysis_id first (if backend stores it)
          let analysisId = tx.metadata?.analysis_id;

          // Strategy 2: Temporal matching via user_analysis_requests
          if (!analysisId) {
            const txTime = new Date(tx.created_at);
            const timeWindow = 30; // seconds
            const startTime = new Date(txTime.getTime() - timeWindow * 1000).toISOString();
            const endTime = new Date(txTime.getTime() + timeWindow * 1000).toISOString();

            const { data: reqs } = await supabase
              .from('user_analysis_requests')
              .select('analysis_id')
              .gte('requested_at', startTime)
              .lte('requested_at', endTime)
              .limit(1);

            analysisId = reqs?.[0]?.analysis_id;
          }

          // Fetch analysis details with song info
          if (analysisId) {
            const { data: analysis } = await supabase
              .from('analyses')
              .select(
                `
                id,
                songs:song_id (
                  title,
                  artist,
                  spotify_id
                )
              `
              )
              .eq('id', analysisId)
              .single();

            if (analysis) {
              const song = analysis.songs
                ? Array.isArray(analysis.songs)
                  ? analysis.songs[0]
                  : analysis.songs
                : null;

              return {
                ...tx,
                analysis_id: analysisId,
                analysis: {
                  id: analysis.id,
                  title: song?.title || null,
                  artist: song?.artist || null,
                  spotify_id: song?.spotify_id || null,
                },
              };
            }
          }

          // Return transaction without analysis details
          return tx;
        } catch (err) {
          console.warn('[Transactions] Failed to enrich tx', tx.id, err.message);
          return tx;
        }
      })
    );

    console.log(`[Transactions] Returning ${enriched.length} transactions for user ${userId}`);

    let response = jsonResponse({ success: true, transactions: enriched }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (error) {
    console.error('[Transactions] Error:', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500, origin, env);
  }
}
