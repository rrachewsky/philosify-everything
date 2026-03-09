// ============================================================
// HANDLER - GROUP ANALYSIS
// ============================================================
// POST   /api/groups          - Create a group for an analysis
// GET    /api/groups          - List user's groups
// POST   /api/groups/join     - Join a group by invite code
// GET    /api/groups/:id      - Get group detail (analysis + members + chat)
// GET    /api/groups/:id/chat - Fetch group chat (paginated)
// POST   /api/groups/:id/chat - Send message to group
// POST   /api/groups/:id/leave - Leave a group
// DELETE /api/groups/:id/members/:userId - Kick a member (owner only)

import { jsonResponse } from '../utils/index.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';
import { checkRateLimit } from '../rate-limit/index.js';

const MAX_MESSAGE_LENGTH = 500;
const MAX_GROUP_NAME_LENGTH = 100;
const INVITE_CODE_LENGTH = 6;
const PAGE_SIZE = 50;

/**
 * Generate a random invite code (A-Z, 0-9)
 */
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint8Array(INVITE_CODE_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * POST /api/groups - Create a group for an analysis
 * Body: { analysisId: string, name: string }
 */
export async function handleCreateGroup(request, env, origin) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, email, setCookieHeader } = auth;

    try {
        const body = await request.json();
        const { analysisId, name } = body;

        if (!analysisId) {
            return jsonResponse({ error: 'analysisId is required' }, 400, origin, env);
        }

        const groupName = (name || '').trim();
        if (!groupName || groupName.length > MAX_GROUP_NAME_LENGTH) {
            return jsonResponse({ error: 'Group name is required (max 100 chars)' }, 400, origin, env);
        }

        // Generate invite code (retry on collision)
        let inviteCode;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            attempts++;
            inviteCode = generateInviteCode();

            const { data: group, error } = await supabase
                .from('analysis_groups')
                .insert({
                    analysis_id: analysisId,
                    owner_id: userId,
                    name: groupName,
                    invite_code: inviteCode,
                })
                .select('id, name, invite_code, invite_expires_at, created_at')
                .single();

            if (error) {
                if (error.code === '23505' && error.message.includes('invite_code')) {
                    console.log(`[Groups] Invite code collision on attempt ${attempts}, retrying...`);
                    continue;
                }
                console.error('[Groups] Failed to create group:', error.message);
                return jsonResponse({ error: 'Failed to create group' }, 500, origin, env);
            }

            // Add owner as member
            const displayName = email ? email.split('@')[0] : 'Anonymous';
            await supabase
                .from('group_members')
                .insert({
                    group_id: group.id,
                    user_id: userId,
                    role: 'owner',
                    display_name: displayName,
                });

            console.log(`[Groups] Created group "${groupName}" (${inviteCode}) for analysis ${analysisId}`);

            let response = jsonResponse({ success: true, group }, 201, origin, env);
            return addRefreshedCookieToResponse(response, setCookieHeader);
        }

        return jsonResponse({ error: 'Failed to generate invite code' }, 500, origin, env);
    } catch (err) {
        console.error('[Groups] Create exception:', err.message);
        return jsonResponse({ error: 'Failed to create group' }, 500, origin, env);
    }
}

/**
 * GET /api/groups - List user's groups
 */
export async function handleListGroups(request, env, origin) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;

    try {
        // Get group IDs user belongs to
        const { data: memberships, error: memberError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', userId);

        if (memberError) {
            console.error('[Groups] Failed to fetch memberships:', memberError.message);
            return jsonResponse({ error: 'Failed to load groups' }, 500, origin, env);
        }

        const groupIds = (memberships || []).map((m) => m.group_id);

        if (groupIds.length === 0) {
            let response = jsonResponse({ groups: [] }, 200, origin, env);
            return addRefreshedCookieToResponse(response, setCookieHeader);
        }

        const { data: groups, error: groupError } = await supabase
            .from('analysis_groups')
            .select('id, name, invite_code, invite_expires_at, owner_id, analysis_id, created_at')
            .in('id', groupIds)
            .order('created_at', { ascending: false });

        if (groupError) {
            console.error('[Groups] Failed to fetch groups:', groupError.message);
            return jsonResponse({ error: 'Failed to load groups' }, 500, origin, env);
        }

        let response = jsonResponse({ groups: groups || [] }, 200, origin, env);
        return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
        console.error('[Groups] List exception:', err.message);
        return jsonResponse({ error: 'Failed to load groups' }, 500, origin, env);
    }
}

/**
 * POST /api/groups/join - Join a group by invite code
 * Body: { code: string }
 */
export async function handleJoinGroup(request, env, origin) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, email, setCookieHeader } = auth;

    try {
        const body = await request.json();
        const code = (body.code || '').trim().toUpperCase();

        if (!code || code.length !== INVITE_CODE_LENGTH) {
            return jsonResponse({ error: 'Invalid invite code' }, 400, origin, env);
        }

        // Find group by invite code
        const { data: group, error: groupError } = await supabase
            .from('analysis_groups')
            .select('id, name, invite_code, invite_expires_at, owner_id')
            .eq('invite_code', code)
            .single();

        if (groupError || !group) {
            return jsonResponse({ error: 'Invalid invite code' }, 404, origin, env);
        }

        // Check if invite has expired
        if (group.invite_expires_at && new Date(group.invite_expires_at) < new Date()) {
            return jsonResponse({ error: 'This invite code has expired' }, 410, origin, env);
        }

        // Check if already a member
        const { data: existing } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', group.id)
            .eq('user_id', userId)
            .single();

        if (existing) {
            return jsonResponse({ success: true, group, alreadyMember: true }, 200, origin, env);
        }

        // Add as member
        const displayName = email ? email.split('@')[0] : 'Anonymous';
        const { error: insertError } = await supabase
            .from('group_members')
            .insert({
                group_id: group.id,
                user_id: userId,
                role: 'member',
                display_name: displayName,
            });

        if (insertError) {
            console.error('[Groups] Failed to join group:', insertError.message);
            return jsonResponse({ error: 'Failed to join group' }, 500, origin, env);
        }

        console.log(`[Groups] User ${userId} joined group ${group.id} via code ${code}`);

        let response = jsonResponse({ success: true, group, alreadyMember: false }, 200, origin, env);
        return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
        console.error('[Groups] Join exception:', err.message);
        return jsonResponse({ error: 'Failed to join group' }, 500, origin, env);
    }
}

/**
 * GET /api/groups/:id - Get group detail
 * Returns group info, analysis, members, and recent chat
 */
export async function handleGetGroupDetail(request, env, origin, groupId) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;

    try {
        // Verify membership
        const { data: membership } = await supabase
            .from('group_members')
            .select('id, role')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return jsonResponse({ error: 'You are not a member of this group' }, 403, origin, env);
        }

        // Fetch group info
        const { data: group, error: groupError } = await supabase
            .from('analysis_groups')
            .select('id, name, invite_code, invite_expires_at, owner_id, analysis_id, created_at')
            .eq('id', groupId)
            .single();

        if (groupError || !group) {
            return jsonResponse({ error: 'Group not found' }, 404, origin, env);
        }

        // Fetch members
        const { data: members } = await supabase
            .from('group_members')
            .select('id, user_id, display_name, role, joined_at')
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true });

        // Fetch recent group chat messages
        const { data: messages } = await supabase
            .from('group_chat_messages')
            .select('id, user_id, display_name, message, created_at')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE);

        // Fetch the analysis
        const { data: analysis } = await supabase
            .from('analyses')
            .select('*, songs(title, artist, spotify_id)')
            .eq('id', group.analysis_id)
            .single();

        // Flatten song data if present
        let enrichedAnalysis = null;
        if (analysis) {
            const songData = analysis.songs;
            enrichedAnalysis = {
                ...analysis,
                song: songData?.title,
                song_name: songData?.title,
                artist: songData?.artist || analysis.artist,
                spotify_id: songData?.spotify_id || analysis.spotify_id,
            };
            delete enrichedAnalysis.songs;
        }

        let response = jsonResponse({
            group,
            analysis: enrichedAnalysis,
            members: members || [],
            messages: (messages || []).reverse(), // Oldest first for display
            userRole: membership.role,
        }, 200, origin, env);
        return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
        console.error('[Groups] Detail exception:', err.message);
        return jsonResponse({ error: 'Failed to load group' }, 500, origin, env);
    }
}

/**
 * GET /api/groups/:id/chat - Fetch group chat messages (paginated)
 */
export async function handleGetGroupChat(request, env, origin, groupId) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;
    const url = new URL(request.url);
    const before = url.searchParams.get('before');

    try {
        // Verify membership
        const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return jsonResponse({ error: 'You are not a member of this group' }, 403, origin, env);
        }

        let query = supabase
            .from('group_chat_messages')
            .select('id, user_id, display_name, message, created_at')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })
            .limit(PAGE_SIZE);

        if (before) {
            query = query.lt('created_at', before);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[Groups] Failed to fetch chat:', error.message);
            return jsonResponse({ error: 'Failed to load messages' }, 500, origin, env);
        }

        let response = jsonResponse({ messages: data || [] }, 200, origin, env);
        return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
        console.error('[Groups] Chat fetch exception:', err.message);
        return jsonResponse({ error: 'Failed to load messages' }, 500, origin, env);
    }
}

/**
 * POST /api/groups/:id/chat - Send message to group chat
 * Body: { message: string }
 */
export async function handleSendGroupMessage(request, env, origin, groupId) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, email, setCookieHeader } = auth;

    // Rate limit
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const rateLimitOk = await checkRateLimit(env, `groupchat:${userId}:${ip}`, true);
    if (!rateLimitOk) {
        return jsonResponse({ error: 'Too many messages. Please slow down.' }, 429, origin, env);
    }

    try {
        // Verify membership
        const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!membership) {
            return jsonResponse({ error: 'You are not a member of this group' }, 403, origin, env);
        }

        const body = await request.json();
        const message = (body.message || '').trim();

        if (!message || message.length === 0) {
            return jsonResponse({ error: 'Message cannot be empty' }, 400, origin, env);
        }

        if (message.length > MAX_MESSAGE_LENGTH) {
            return jsonResponse({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` }, 400, origin, env);
        }

        const displayName = email ? email.split('@')[0] : 'Anonymous';

        const { data, error } = await supabase
            .from('group_chat_messages')
            .insert({
                group_id: groupId,
                user_id: userId,
                display_name: displayName,
                message: message,
            })
            .select('id, user_id, display_name, message, created_at')
            .single();

        if (error) {
            console.error('[Groups] Failed to send message:', error.message);
            return jsonResponse({ error: 'Failed to send message' }, 500, origin, env);
        }

        let response = jsonResponse({ success: true, message: data }, 201, origin, env);
        return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
        console.error('[Groups] Send exception:', err.message);
        return jsonResponse({ error: 'Failed to send message' }, 500, origin, env);
    }
}

/**
 * POST /api/groups/:id/leave - Leave a group
 */
export async function handleLeaveGroup(request, env, origin, groupId) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;

    try {
        // Check if user is the owner
        const { data: group } = await supabase
            .from('analysis_groups')
            .select('owner_id')
            .eq('id', groupId)
            .single();

        if (group && group.owner_id === userId) {
            return jsonResponse({ error: 'Group owner cannot leave. Delete the group instead.' }, 400, origin, env);
        }

        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) {
            console.error('[Groups] Failed to leave group:', error.message);
            return jsonResponse({ error: 'Failed to leave group' }, 500, origin, env);
        }

        console.log(`[Groups] User ${userId} left group ${groupId}`);

        let response = jsonResponse({ success: true }, 200, origin, env);
        return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
        console.error('[Groups] Leave exception:', err.message);
        return jsonResponse({ error: 'Failed to leave group' }, 500, origin, env);
    }
}

/**
 * DELETE /api/groups/:id/members/:memberId - Kick a member (owner only)
 */
export async function handleKickMember(request, env, origin, groupId, memberUserId) {
    const auth = await getSupabaseForUser(request, env);
    if (!auth) {
        return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);
    }

    const { client: supabase, userId, setCookieHeader } = auth;

    try {
        // Verify caller is the owner
        const { data: group } = await supabase
            .from('analysis_groups')
            .select('owner_id')
            .eq('id', groupId)
            .single();

        if (!group || group.owner_id !== userId) {
            return jsonResponse({ error: 'Only the group owner can kick members' }, 403, origin, env);
        }

        // Cannot kick yourself
        if (memberUserId === userId) {
            return jsonResponse({ error: 'Cannot kick yourself' }, 400, origin, env);
        }

        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', memberUserId);

        if (error) {
            console.error('[Groups] Failed to kick member:', error.message);
            return jsonResponse({ error: 'Failed to kick member' }, 500, origin, env);
        }

        console.log(`[Groups] Owner ${userId} kicked ${memberUserId} from group ${groupId}`);

        let response = jsonResponse({ success: true }, 200, origin, env);
        return addRefreshedCookieToResponse(response, setCookieHeader);
    } catch (err) {
        console.error('[Groups] Kick exception:', err.message);
        return jsonResponse({ error: 'Failed to kick member' }, 500, origin, env);
    }
}
