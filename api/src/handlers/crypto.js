// ============================================================
// HANDLER - CRYPTO (Public Key Management)
// ============================================================
// Manages user public keys for E2E encryption.
//
// Endpoints:
// GET  /api/crypto/keys/:userId  - Get a user's public key
// POST /api/crypto/keys          - Register/update own public key
// GET  /api/crypto/keys/bulk     - Get multiple public keys at once

import { jsonResponse } from '../utils/index.js';
import { getSupabaseForUser, addRefreshedCookieToResponse } from '../utils/supabase-user.js';
import { getSupabaseCredentials } from '../utils/supabase.js';

// Base64 public key should be ~44 characters
const PUBLIC_KEY_REGEX = /^[A-Za-z0-9+/]{43}=$/;

/**
 * GET /api/crypto/keys/:userId - Get a user's public key
 */
export async function handleGetPublicKey(request, env, origin, userId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, setCookieHeader } = auth;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return jsonResponse({ error: 'Invalid user ID' }, 400, origin, env);
  }

  try {
    const { data, error } = await supabase
      .from('user_public_keys')
      .select('public_key, key_version')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return jsonResponse({ error: 'Public key not found' }, 404, origin, env);
      }
      console.error('[Crypto] Get public key failed:', error.message);
      return jsonResponse({ error: 'Failed to get public key' }, 500, origin, env);
    }

    let response = jsonResponse({
      userId,
      publicKey: data.public_key,
      keyVersion: data.key_version,
    }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Crypto] Get public key exception:', err.message);
    return jsonResponse({ error: 'Failed to get public key' }, 500, origin, env);
  }
}

/**
 * POST /api/crypto/keys - Register or update own public key
 * Body: { publicKey: string }
 */
export async function handleRegisterPublicKey(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  try {
    const body = await request.json();
    const { publicKey } = body;

    // Validate public key format (base64, ~44 chars for X25519)
    if (!publicKey || typeof publicKey !== 'string') {
      return jsonResponse({ error: 'Public key is required' }, 400, origin, env);
    }

    if (!PUBLIC_KEY_REGEX.test(publicKey)) {
      return jsonResponse({ error: 'Invalid public key format' }, 400, origin, env);
    }

    // Check if key already exists
    const { data: existing } = await supabase
      .from('user_public_keys')
      .select('key_version')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing key (key rotation)
      const { error } = await supabase
        .from('user_public_keys')
        .update({
          public_key: publicKey,
          key_version: existing.key_version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('[Crypto] Update public key failed:', error.message);
        return jsonResponse({ error: 'Failed to update public key' }, 500, origin, env);
      }

      console.log(`[Crypto] Public key updated for user ${userId}, version ${existing.key_version + 1}`);
      let response = jsonResponse({ success: true, keyVersion: existing.key_version + 1 }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    } else {
      // Insert new key
      const { error } = await supabase
        .from('user_public_keys')
        .insert({
          user_id: userId,
          public_key: publicKey,
          key_version: 1,
        });

      if (error) {
        console.error('[Crypto] Insert public key failed:', error.message);
        return jsonResponse({ error: 'Failed to register public key' }, 500, origin, env);
      }

      console.log(`[Crypto] Public key registered for user ${userId}`);
      let response = jsonResponse({ success: true, keyVersion: 1 }, 200, origin, env);
      return addRefreshedCookieToResponse(response, setCookieHeader);
    }
  } catch (err) {
    console.error('[Crypto] Register public key exception:', err.message);
    return jsonResponse({ error: 'Failed to register public key' }, 500, origin, env);
  }
}

/**
 * POST /api/crypto/keys/bulk - Get multiple public keys at once
 * Body: { userIds: string[] }
 */
export async function handleGetPublicKeysBulk(request, env, origin) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, setCookieHeader } = auth;

  try {
    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return jsonResponse({ error: 'userIds array is required' }, 400, origin, env);
    }

    if (userIds.length > 100) {
      return jsonResponse({ error: 'Maximum 100 users per request' }, 400, origin, env);
    }

    // Validate all UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of userIds) {
      if (!uuidRegex.test(id)) {
        return jsonResponse({ error: `Invalid user ID: ${id}` }, 400, origin, env);
      }
    }

    const { data, error } = await supabase
      .from('user_public_keys')
      .select('user_id, public_key, key_version')
      .in('user_id', userIds);

    if (error) {
      console.error('[Crypto] Bulk get public keys failed:', error.message);
      return jsonResponse({ error: 'Failed to get public keys' }, 500, origin, env);
    }

    // Convert to map for easy lookup
    const keys = {};
    for (const row of (data || [])) {
      keys[row.user_id] = {
        publicKey: row.public_key,
        keyVersion: row.key_version,
      };
    }

    let response = jsonResponse({ keys }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Crypto] Bulk get public keys exception:', err.message);
    return jsonResponse({ error: 'Failed to get public keys' }, 500, origin, env);
  }
}

/**
 * GET /api/crypto/collective/:groupId/key - Get my encrypted group key
 */
export async function handleGetCollectiveKey(request, env, origin, groupId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { client: supabase, userId, setCookieHeader } = auth;

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(groupId)) {
    return jsonResponse({ error: 'Invalid group ID' }, 400, origin, env);
  }

  try {
    // Check membership first
    const { data: membership } = await supabase
      .from('collective_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      return jsonResponse({ error: 'Not a member of this collective' }, 403, origin, env);
    }

    // Get encrypted group key
    const { data, error } = await supabase
      .from('collective_group_keys')
      .select('encrypted_key, key_version')
      .eq('group_id', groupId)
      .eq('member_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No key yet - group may not have encryption enabled
        return jsonResponse({ encryptedKey: null, keyVersion: 0 }, 200, origin, env);
      }
      console.error('[Crypto] Get collective key failed:', error.message);
      return jsonResponse({ error: 'Failed to get group key' }, 500, origin, env);
    }

    let response = jsonResponse({
      encryptedKey: data.encrypted_key,
      keyVersion: data.key_version,
    }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Crypto] Get collective key exception:', err.message);
    return jsonResponse({ error: 'Failed to get group key' }, 500, origin, env);
  }
}

/**
 * POST /api/crypto/collective/:groupId/key - Initialize or rotate group key
 * Body: { memberKeys: [{ userId, encryptedKey }] }
 * Only callable by group creator/admin
 */
export async function handleSetCollectiveKeys(request, env, origin, groupId) {
  const auth = await getSupabaseForUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, origin, env);

  const { userId, setCookieHeader } = auth;
  const { url, key } = await getSupabaseCredentials(env);

  // Use service role for writing group keys
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(groupId)) {
    return jsonResponse({ error: 'Invalid group ID' }, 400, origin, env);
  }

  try {
    // Check if user is member (for now, any member can set keys; could restrict to creator)
    const checkUrl = `${url}/rest/v1/collective_members?group_id=eq.${groupId}&user_id=eq.${userId}&select=id`;
    const checkRes = await fetch(checkUrl, { headers });
    const memberCheck = await checkRes.json();

    if (!memberCheck || memberCheck.length === 0) {
      return jsonResponse({ error: 'Not a member of this collective' }, 403, origin, env);
    }

    const body = await request.json();
    const { memberKeys } = body;

    if (!Array.isArray(memberKeys) || memberKeys.length === 0) {
      return jsonResponse({ error: 'memberKeys array is required' }, 400, origin, env);
    }

    // Get current key version
    const versionUrl = `${url}/rest/v1/rpc/get_collective_key_version`;
    const versionRes = await fetch(versionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_group_id: groupId }),
    });
    const currentVersion = (await versionRes.json()) || 0;
    const newVersion = currentVersion + 1;

    // Upsert keys for all members
    for (const { userId: memberId, encryptedKey } of memberKeys) {
      if (!uuidRegex.test(memberId)) continue;

      const upsertUrl = `${url}/rest/v1/collective_group_keys`;
      await fetch(upsertUrl, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          group_id: groupId,
          member_id: memberId,
          encrypted_key: encryptedKey,
          key_version: newVersion,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    console.log(`[Crypto] Group keys set for collective ${groupId}, version ${newVersion}`);

    let response = jsonResponse({ success: true, keyVersion: newVersion }, 200, origin, env);
    return addRefreshedCookieToResponse(response, setCookieHeader);
  } catch (err) {
    console.error('[Crypto] Set collective keys exception:', err.message);
    return jsonResponse({ error: 'Failed to set group keys' }, 500, origin, env);
  }
}
