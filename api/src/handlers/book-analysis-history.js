// ============================================================
// HANDLER - BOOK ANALYSIS HISTORY
// ============================================================
// Returns user's book analysis history with book details.
// Mirrors analysis-history.js for literature.
//
// GET /api/book-analysis-history
// Auth: Required (via HttpOnly cookie)

import { jsonResponse } from '../utils/response.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';

export async function handleBookAnalysisHistory(request, env, origin) {
  if (request.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405, origin, env);
  }

  try {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
      return jsonResponse({ success: false, error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;
    console.log(`[BookHistory] Fetching book history for user: ${userId}`);

    // 1. Get user's book analysis request IDs
    const { data: reqs, error: reqErr } = await supabase
      .from('user_book_analysis_requests')
      .select('book_analysis_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (reqErr) {
      console.error('[BookHistory] user_book_analysis_requests query failed:', reqErr);
      return jsonResponse({ success: false, error: 'Failed to fetch history' }, 500, origin, env);
    }

    const analysisIds = (reqs || []).map((r) => r.book_analysis_id).filter(Boolean);

    if (analysisIds.length === 0) {
      console.log('[BookHistory] No book history found for user');
      let response = jsonResponse({ success: true, items: [] }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    const requestedAtById = new Map(
      (reqs || []).map((r) => [r.book_analysis_id, r.created_at])
    );

    // 2. Fetch book analyses with book details
    const { data: analyses, error: aErr } = await supabase
      .from('book_analyses')
      .select(
        `
        id,
        book_id,
        books:book_id (
          title,
          author,
          google_books_id,
          cover_url
        )
      `
      )
      .in('id', analysisIds);

    if (aErr) {
      console.error('[BookHistory] book_analyses query failed:', aErr);
      return jsonResponse({ success: false, error: 'Failed to fetch analyses' }, 500, origin, env);
    }

    // 3. Normalize and sort results
    const items = (analyses || [])
      .map((a) => {
        const book = a.books ? (Array.isArray(a.books) ? a.books[0] : a.books) : null;
        return {
          analysisId: a.id,
          requestedAt: requestedAtById.get(a.id) || null,
          title: book?.title || null,
          author: book?.author || null,
          googleBooksId: book?.google_books_id || null,
          coverUrl: book?.cover_url || null,
          mediaType: 'literature',
        };
      })
      .filter((x) => x.analysisId)
      .sort((a, b) => {
        const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return dateB - dateA;
      });

    console.log(`[BookHistory] Returning ${items.length} items for user ${userId}`);

    let response = jsonResponse({ success: true, items }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (error) {
    console.error('[BookHistory] Error:', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500, origin, env);
  }
}
