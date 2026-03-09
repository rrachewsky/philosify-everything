// ============================================================
// HANDLER - BLOCK/UNBLOCK USERS
// ============================================================
// POST   /api/users/block          - Block a user
// DELETE /api/users/block/:userId  - Unblock a user
// GET    /api/users/blocked        - List blocked users

import { jsonResponse } from '../utils/index.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';
import { getSecret } from '../utils/secrets.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/users/block
 * Body: { userId: string }
 */
export async function handleBlockUser(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, origin, env);
  }

  const targetId = body.userId;
  if (!targetId || !UUID_REGEX.test(targetId)) {
    return jsonResponse({ error: 'Invalid user ID' }, 400, origin, env);
  }

  if (targetId === userId) {
    return jsonResponse({ error: 'Cannot block yourself' }, 400, origin, env);
  }

  try {
    const { error } = await supabase
      .from('blocked_users')
      .insert({ blocker_id: userId, blocked_id: targetId });

    if (error) {
      if (error.code === '23505') {
        // Already blocked (unique constraint)
        return jsonResponse({ success: true, alreadyBlocked: true }, 200, origin, env);
      }
      console.error('[Block] Insert failed:', error.message);
      return jsonResponse({ error: 'Failed to block user' }, 500, origin, env);
    }

    console.log(`[Block] User ${userId} blocked ${targetId}`);
    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Block] Exception:', err.message);
    return jsonResponse({ error: 'Failed to block user' }, 500, origin, env);
  }
}

/**
 * DELETE /api/users/block/:userId
 */
export async function handleUnblockUser(request, env, origin, targetId) {
  if (!targetId || !UUID_REGEX.test(targetId)) {
    return jsonResponse({ error: 'Invalid user ID' }, 400, origin, env);
  }

  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', userId)
      .eq('blocked_id', targetId);

    if (error) {
      console.error('[Block] Delete failed:', error.message);
      return jsonResponse({ error: 'Failed to unblock user' }, 500, origin, env);
    }

    console.log(`[Block] User ${userId} unblocked ${targetId}`);
    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Block] Exception:', err.message);
    return jsonResponse({ error: 'Failed to unblock user' }, 500, origin, env);
  }
}

/**
 * GET /api/users/blocked
 * Returns list of blocked user IDs
 */
export async function handleGetBlockedUsers(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('blocked_id, created_at')
      .eq('blocker_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Block] Fetch failed:', error.message);
      return jsonResponse({ error: 'Failed to load blocked users' }, 500, origin, env);
    }

    let response = jsonResponse({
      blockedUsers: (data || []).map((b) => b.blocked_id),
    }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Block] Exception:', err.message);
    return jsonResponse({ error: 'Failed to load blocked users' }, 500, origin, env);
  }
}

/**
 * Helper: Get set of blocked user IDs for a user (using service role)
 * Used by DM handlers to filter conversations
 */
export async function getBlockedUserIds(env, userId) {
  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    const res = await fetch(
      `${supabaseUrl}/rest/v1/blocked_users?blocker_id=eq.${userId}&select=blocked_id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!res.ok) return new Set();

    const data = await res.json();
    return new Set((data || []).map((b) => b.blocked_id));
  } catch {
    return new Set();
  }
}
