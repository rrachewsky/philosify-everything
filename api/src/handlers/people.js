// ============================================================
// HANDLER - PEOPLE (Community Members Directory)
// ============================================================
// GET /api/people - List all Philosify members
//   - "In Your Collectives" section: users sharing at least one collective, sorted by shared count
//   - "All Members" section: everyone else, sorted alphabetically
//   - Excludes: self, blocked users

import { jsonResponse } from '../utils/index.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';
import { getBlockedUserIds } from './block.js';
import { getSecret } from '../utils/secrets.js';

// ============================================================
// GET /api/people
// ============================================================
export async function handleGetPeople(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { userId, setCookieHeader } = auth;

  try {
    // Use service role for cross-user queries
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Fetch in parallel: all user_profiles, my collectives, all collective_members, blocked users
    const [profilesRes, myCollectivesRes, allMembersRes, blockedIds] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/user_profiles?select=id,display_name&order=display_name.asc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/collective_members?user_id=eq.${userId}&select=group_id`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/collective_members?select=user_id,group_id`, { headers }),
      getBlockedUserIds(env, userId),
    ]);

    if (!profilesRes.ok || !myCollectivesRes.ok || !allMembersRes.ok) {
      console.error('[People] Failed to fetch data');
      return jsonResponse({ error: 'Failed to load members' }, 500, origin, env);
    }

    const [profiles, myCollectives, allMembers] = await Promise.all([
      profilesRes.json(),
      myCollectivesRes.json(),
      allMembersRes.json(),
    ]);

    // Also fetch language from auth.users metadata (service role)
    let userLanguages = {};
    try {
      const usersRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?per_page=1000`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.users || usersData || [];
        for (const u of users) {
          if (u.id && u.raw_user_meta_data?.language) {
            userLanguages[u.id] = u.raw_user_meta_data.language;
          }
        }
      }
    } catch (err) {
      console.warn('[People] Could not fetch user languages:', err.message);
    }

    // Build set of my collective group IDs
    const myGroupIds = new Set(myCollectives.map((m) => m.group_id));

    // Build map: userId -> set of group IDs they belong to
    const userGroupMap = new Map();
    for (const member of allMembers) {
      if (!userGroupMap.has(member.user_id)) {
        userGroupMap.set(member.user_id, new Set());
      }
      userGroupMap.get(member.user_id).add(member.group_id);
    }

    // Categorize members
    const inCollectives = [];
    const allOthers = [];

    for (const profile of profiles) {
      // Skip self and blocked users
      if (profile.id === userId) continue;
      if (blockedIds.has(profile.id)) continue;
      // Skip profiles without a display name
      if (!profile.display_name) continue;

      const theirGroups = userGroupMap.get(profile.id);
      let sharedCount = 0;

      if (theirGroups && myGroupIds.size > 0) {
        for (const gid of theirGroups) {
          if (myGroupIds.has(gid)) sharedCount++;
        }
      }

      const member = {
        id: profile.id,
        displayName: profile.display_name,
        language: userLanguages[profile.id] || null,
        sharedCollectives: sharedCount,
      };

      if (sharedCount > 0) {
        inCollectives.push(member);
      } else {
        allOthers.push(member);
      }
    }

    // Sort: in-collectives by shared count DESC, then alpha; all-others alphabetically
    inCollectives.sort((a, b) => {
      if (b.sharedCollectives !== a.sharedCollectives) {
        return b.sharedCollectives - a.sharedCollectives;
      }
      return (a.displayName || '').localeCompare(b.displayName || '');
    });

    allOthers.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));

    let response = jsonResponse({
      inCollectives,
      allMembers: allOthers,
      totalCount: inCollectives.length + allOthers.length,
    }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[People] Exception:', err.message);
    return jsonResponse({ error: 'Failed to load members' }, 500, origin, env);
  }
}
