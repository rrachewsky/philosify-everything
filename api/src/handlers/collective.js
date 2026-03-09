// ============================================================
// HANDLER - THE COLLECTIVE (Artist Fan Clubs - Feed Based)
// ============================================================
// Auto-created artist clubs with song analysis feeds and threaded discussions.
// No manual creation - clubs are created automatically when songs are analyzed.

import { jsonResponse } from '../utils/index.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';
import { getSupabaseCredentials, callRpc } from '../utils/supabase.js';

const PAGE_SIZE = 20;

// ============================================================
// GET /api/collective - List user's joined collectives
// ============================================================
export async function handleListCollectives(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Get group IDs where user is a member
    const { data: memberships, error: memError } = await supabase
      .from('collective_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memError) {
      console.error('[Collective] Memberships query failed:', memError.message);
      return jsonResponse({ error: 'Failed to load collectives' }, 500, origin, env);
    }

    const groupIds = (memberships || []).map((m) => m.group_id);

    if (groupIds.length === 0) {
      let response = jsonResponse({ groups: [] }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }

    const { data: groups, error: groupsError } = await supabase
      .from('collective_groups')
      .select('id, spotify_artist_id, artist_name, artist_image_url, member_count, analysis_count, created_at')
      .in('id', groupIds)
      .order('artist_name', { ascending: true });

    if (groupsError) {
      console.error('[Collective] Groups query failed:', groupsError.message);
      return jsonResponse({ error: 'Failed to load collectives' }, 500, origin, env);
    }

    let response = jsonResponse({ groups: groups || [] }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Collective] List exception:', err.message);
    return jsonResponse({ error: 'Failed to load collectives' }, 500, origin, env);
  }
}

// ============================================================
// GET /api/collective/browse - Browse/search collectives
// ============================================================
export async function handleBrowseCollectives(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, setCookieHeader } = auth;
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();

  try {
    let dbQuery = supabase
      .from('collective_groups')
      .select('id, spotify_artist_id, artist_name, artist_image_url, member_count, analysis_count, created_at')
      .order('member_count', { ascending: false })
      .limit(50);

    if (query) {
      // Escape LIKE special characters
      const escapedQuery = query.replace(/[%_\\]/g, '\\$&');
      dbQuery = dbQuery.ilike('artist_name', `%${escapedQuery}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('[Collective] Browse failed:', error.message);
      return jsonResponse({ error: 'Failed to browse collectives' }, 500, origin, env);
    }

    let response = jsonResponse({ groups: data || [] }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Collective] Browse exception:', err.message);
    return jsonResponse({ error: 'Failed to browse collectives' }, 500, origin, env);
  }
}

// ============================================================
// POST /api/collective/join - Join a collective (free)
// ============================================================
export async function handleJoinCollective(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, email, setCookieHeader } = auth;

  try {
    const body = await request.json();
    const groupId = (body.groupId || '').trim();

    if (!groupId) {
      return jsonResponse({ error: 'Group ID required' }, 400, origin, env);
    }

    // Check if group exists
    const { data: group, error: groupError } = await supabase
      .from('collective_groups')
      .select('id, artist_name')
      .eq('id', groupId)
      .maybeSingle();

    if (groupError || !group) {
      return jsonResponse({ error: 'Collective not found' }, 404, origin, env);
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('collective_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ error: 'Already a member', groupId: group.id }, 409, origin, env);
    }

    // Insert member
    const { error: insertError } = await supabase
      .from('collective_members')
      .insert({
        group_id: groupId,
        user_id: userId,
      });

    if (insertError) {
      console.error('[Collective] Join failed:', insertError.message);
      return jsonResponse({ error: 'Failed to join collective' }, 500, origin, env);
    }

    // Increment member count atomically
    await supabase.rpc('increment_collective_member_count', { p_group_id: groupId });

    console.log(`[Collective] ${email} joined "${group.artist_name}"`);

    let response = jsonResponse({ success: true, groupId: group.id }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Collective] Join exception:', err.message);
    return jsonResponse({ error: 'Failed to join collective' }, 500, origin, env);
  }
}

// ============================================================
// GET /api/collective/:id - Get collective detail with analyses feed
// ============================================================
export async function handleGetCollectiveDetail(request, env, origin, groupId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Fetch group info
    const { data: group, error: groupError } = await supabase
      .from('collective_groups')
      .select('id, spotify_artist_id, artist_name, artist_image_url, member_count, analysis_count, created_at')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return jsonResponse({ error: 'Collective not found' }, 404, origin, env);
    }

    // Check if user is a member
    const { data: membership } = await supabase
      .from('collective_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    const isMember = !!membership;

    // Fetch analyses (sorted by score descending)
    const { data: analyses, error: analysesError } = await supabase
      .from('collective_analyses')
      .select('id, analysis_id, song_name, score, schools, verdict_snippet, language, comment_count, created_at')
      .eq('group_id', groupId)
      .order('score', { ascending: false, nullsFirst: false })
      .limit(PAGE_SIZE);

    if (analysesError) {
      console.error('[Collective] Analyses fetch failed:', analysesError.message);
    }

    let response = jsonResponse({
      group,
      isMember,
      analyses: analyses || [],
    }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Collective] Detail exception:', err.message);
    return jsonResponse({ error: 'Failed to load collective' }, 500, origin, env);
  }
}

// ============================================================
// GET /api/collective/:id/analyses - Paginated analyses feed
// ============================================================
export async function handleGetCollectiveAnalyses(request, env, origin, groupId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, setCookieHeader } = auth;
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  try {
    const { data: analyses, error } = await supabase
      .from('collective_analyses')
      .select('id, analysis_id, song_name, score, schools, verdict_snippet, language, comment_count, created_at')
      .eq('group_id', groupId)
      .order('score', { ascending: false, nullsFirst: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('[Collective] Analyses fetch failed:', error.message);
      return jsonResponse({ error: 'Failed to load analyses' }, 500, origin, env);
    }

    let response = jsonResponse({
      analyses: analyses || [],
      hasMore: (analyses || []).length === PAGE_SIZE,
    }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Collective] Analyses exception:', err.message);
    return jsonResponse({ error: 'Failed to load analyses' }, 500, origin, env);
  }
}

// ============================================================
// POST /api/collective/:id/leave - Leave collective
// ============================================================
export async function handleLeaveCollective(request, env, origin, groupId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    // Check membership
    const { data: membership } = await supabase
      .from('collective_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      return jsonResponse({ error: 'Not a member' }, 404, origin, env);
    }

    // Delete membership
    const { error } = await supabase
      .from('collective_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) {
      console.error('[Collective] Leave failed:', error.message);
      return jsonResponse({ error: 'Failed to leave collective' }, 500, origin, env);
    }

    // Decrement member count atomically
    await supabase.rpc('decrement_collective_member_count', { p_group_id: groupId });

    let response = jsonResponse({ success: true }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Collective] Leave exception:', err.message);
    return jsonResponse({ error: 'Failed to leave collective' }, 500, origin, env);
  }
}

// ============================================================
// AUTO-CREATE COLLECTIVE (internal, called after analysis)
// ============================================================
export async function autoCreateCollective(env, spotifyArtistId, artistName, artistImageUrl) {
  const { url, key } = await getSupabaseCredentials(env);
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    // Check if collective exists for this artist
    const checkUrl = `${url}/rest/v1/collective_groups?spotify_artist_id=eq.${encodeURIComponent(spotifyArtistId)}&select=id&limit=1`;
    const checkRes = await fetch(checkUrl, { headers });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing && existing.length > 0) {
        return { groupId: existing[0].id, created: false };
      }
    }

    // Create new collective
    const createRes = await fetch(`${url}/rest/v1/collective_groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        spotify_artist_id: spotifyArtistId,
        artist_name: artistName,
        artist_image_url: artistImageUrl || null,
      })
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      console.error('[Collective] Auto-create failed:', error);
      return { groupId: null, created: false, error };
    }

    const [group] = await createRes.json();
    console.log(`[Collective] Auto-created "${artistName}" (${group.id})`);
    return { groupId: group.id, created: true };
  } catch (err) {
    console.error('[Collective] Auto-create exception:', err.message);
    return { groupId: null, created: false, error: err.message };
  }
}

// ============================================================
// ADD ANALYSIS TO COLLECTIVE (internal, called after analysis)
// ============================================================
export async function addAnalysisToCollective(env, groupId, analysisData) {
  const { url, key } = await getSupabaseCredentials(env);
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    const createRes = await fetch(`${url}/rest/v1/collective_analyses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        group_id: groupId,
        analysis_id: analysisData.analysisId,
        song_name: analysisData.songName,
        score: analysisData.score,
        schools: analysisData.schools || [],
        verdict_snippet: analysisData.verdictSnippet || null,
        analyzed_by: analysisData.userId || null,
        language: analysisData.language || 'en',
      })
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      // Might be duplicate (unique constraint), that's OK
      if (errorText.includes('duplicate') || errorText.includes('23505')) {
        console.log(`[Collective] Analysis already exists in collective`);
        return { success: true, duplicate: true };
      }
      console.error('[Collective] Add analysis failed:', errorText);
      return { success: false, error: errorText };
    }

    const [data] = await createRes.json();

    // Increment analysis count using RPC
    await callRpc(env, 'increment_collective_analysis_count', { p_group_id: groupId });

    console.log(`[Collective] Added analysis "${analysisData.songName}" to collective`);
    return { success: true, collectiveAnalysisId: data.id };
  } catch (err) {
    console.error('[Collective] Add analysis exception:', err.message);
    return { success: false, error: err.message };
  }
}
