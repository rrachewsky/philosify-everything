// ============================================================
// UNDERGROUND SERVICE
// ============================================================
// API calls for The Underground (anonymous confessions).
// Supports E2E encryption using a shared room key.

import { config } from '@/config';
import { logger } from '@/utils';
import * as cryptoService from '@/services/crypto';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Decrypt a single post if encrypted
 * @param {Object} post - Post object from API
 * @returns {Promise<Object>} Post with decrypted content
 */
async function decryptPostIfNeeded(post) {
  if (!post.isEncrypted || !post.encryptedContent || !post.nonce) {
    return post;
  }

  try {
    const decrypted = cryptoService.decryptUndergroundPost(post.encryptedContent, post.nonce);

    if (decrypted) {
      return {
        ...post,
        content: decrypted,
        decrypted: true,
      };
    }
  } catch (err) {
    logger.warn('[Underground] Failed to decrypt post:', err.message);
  }

  return {
    ...post,
    content: '[Unable to decrypt]',
    decryptionFailed: true,
  };
}

/**
 * Get underground posts (paginated, with E2E decryption)
 * @param {string} [before] - ISO timestamp cursor
 */
async function getPosts(before) {
  const url = new URL(`${API_BASE}/underground`);
  if (before) url.searchParams.set('before', before);

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load posts');
  }

  const data = await response.json();

  // Nickname gate — room orchestration only makes sense past it
  if (data.needsNickname) {
    return data;
  }

  // Mandatory E2E: verify/obtain the room key before decrypting
  data.roomStatus = await ensureRoomReady(data);

  // Decrypt posts
  if (data.posts && data.posts.length > 0) {
    data.posts = await Promise.all(data.posts.map(decryptPostIfNeeded));
  }

  return data;
}

/**
 * Room-key orchestration (design §2.2/§2.3/§2.6), runs on every load:
 * ensureUserKeys → init-if-empty → verify copy vs fingerprint
 * (mismatch → automatic rekey) → distributor sweep when keyed.
 * @returns {Promise<'ready' | 'pending' | 'error'>}
 */
async function ensureRoomReady(data) {
  try {
    // Keypair first — also covers pre-E2E members on their next visit
    await cryptoService.ensureUserKeys();

    // Already holding the verified key from a previous load this session
    if (cryptoService.hasUndergroundRoomKey()) {
      runDistributorSweep();
      return 'ready';
    }

    // Room does not exist yet — this client attempts to found it
    if (!data.roomInitialized) {
      const candidate = await cryptoService.generateUndergroundRoomKey();
      if (!candidate) return 'error';

      const result = await roomInit(candidate.fingerprint, candidate.encryptedKeyForSelf);
      if (result.winner) {
        cryptoService.adoptUndergroundRoomKey(candidate.rawKey);
        logger.log('[Underground] Room founded by this client');
        return 'ready';
      }
      // Lost the race. One exception: if the winning fingerprint IS ours,
      // we are the orphan winner healed server-side (backend room-init) —
      // the hash binds the key, so adopting our own candidate is safe.
      if (result.fingerprint === candidate.fingerprint) {
        cryptoService.adoptUndergroundRoomKey(candidate.rawKey);
        logger.log('[Underground] Orphan-winner self-heal: candidate adopted');
        runDistributorSweep();
        return 'ready';
      }
      cryptoService.discardRoomKeyCandidate(candidate.rawKey);
      logger.log('[Underground] Lost room-init race — pending delivery');
      return 'pending';
    }

    // Room exists. No wrapped copy for us yet → pending delivery.
    if (!data.encryptedRoomKey) {
      return 'pending';
    }

    // Verify the wrapped copy BEFORE any use (design §2.3). A failure
    // means our keypair changed or the copy is wrong → automatic rekey
    // puts us back in the pending pool (design §2.6).
    const ok = await cryptoService.setUndergroundRoomKey(
      data.encryptedRoomKey,
      data.roomFingerprint,
    );
    if (!ok) {
      logger.warn('[Underground] Room key copy invalid — requesting rekey');
      try {
        await rekey();
      } catch (err) {
        logger.warn('[Underground] rekey failed:', err.message);
      }
      return 'pending';
    }

    runDistributorSweep();
    return 'ready';
  } catch (err) {
    logger.error('[Underground] Room orchestration failed:', err.message);
    return 'error';
  }
}

/** Fire-and-forget: wrap the room key for pending members (design §2.3). */
function runDistributorSweep() {
  (async () => {
    try {
      const pending = await getPendingKeys();
      if (!pending.length) return;
      const keys = pending
        .map((p) => ({
          userId: p.userId,
          encryptedKey: cryptoService.wrapUndergroundRoomKeyFor(p.publicKey),
        }))
        .filter((k) => k.encryptedKey);
      if (!keys.length) return;
      await distributeKeys(keys);
      logger.log(`[Underground] Distributed room key to ${keys.length} member(s)`);
    } catch (err) {
      logger.log('[Underground] Distributor sweep skipped:', err.message);
    }
  })();
}

async function roomInit(fingerprint, encryptedKey) {
  const response = await fetch(`${API_BASE}/underground/room-init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint, encryptedKey }),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to initialize room');
  return data; // { winner, fingerprint }
}

async function getPendingKeys() {
  const response = await fetch(`${API_BASE}/underground/pending-keys`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to list pending members');
  return data.pending || [];
}

async function distributeKeys(keys) {
  const response = await fetch(`${API_BASE}/underground/distribute-keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys }),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to distribute keys');
  return data;
}

/** Reset own wrapped copy — back to the pending pool (design §2.6). */
async function rekey() {
  const response = await fetch(`${API_BASE}/underground/rekey`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Failed to reset key');
  return data;
}

/**
 * Create a new anonymous post (with E2E encryption if available)
 * @param {string} content - Post content (max 1000 chars)
 * @param {Object} [options] - Optional parameters
 * @param {string} [options.replyToId] - UUID of post being replied to
 */
async function createPost(content, options = {}) {
  // Mandatory E2E (design §2.7): no room key = no post, never plaintext.
  const encrypted = cryptoService.encryptUndergroundPost(content);
  if (!encrypted) {
    const err = new Error('Room key not available yet');
    err.code = 'E2E_NO_ROOM_KEY';
    throw err;
  }

  const body = {
    encrypted_content: encrypted.encrypted_content,
    nonce: encrypted.nonce,
    ...(options.replyToId ? { reply_to_id: options.replyToId } : {}),
  };

  const response = await fetch(`${API_BASE}/underground`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create post');
  }

  const data = await response.json();

  // Set content for the returned post (since we just wrote it)
  if (data.post) {
    data.post.content = content;
  }

  return data;
}

/**
 * Toggle reaction on a post
 * @param {string} postId - UUID
 * @param {string} reaction - 'fire' | 'think' | 'heart' | 'skull'
 */
async function toggleReaction(postId, reaction) {
  const response = await fetch(`${API_BASE}/underground/${postId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reaction }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to react');
  }

  return response.json();
}

/**
 * Edit own post
 * @param {string} postId - UUID
 * @param {string} content - Updated post content
 */
async function editPost(postId, content) {
  // Mandatory E2E (design §2.7): same rule as create.
  const encrypted = cryptoService.encryptUndergroundPost(content);
  if (!encrypted) {
    const err = new Error('Room key not available yet');
    err.code = 'E2E_NO_ROOM_KEY';
    throw err;
  }

  const body = {
    encrypted_content: encrypted.encrypted_content,
    nonce: encrypted.nonce,
  };

  const response = await fetch(`${API_BASE}/underground/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to edit post');
  }

  const data = await response.json();

  // Set content for the returned post (since we just wrote it)
  if (data.post) {
    data.post.content = content;
  }

  return data;
}

/**
 * Delete own post
 * @param {string} postId - UUID
 */
async function deletePost(postId) {
  const response = await fetch(`${API_BASE}/underground/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete post');
  }

  return response.json();
}

/**
 * Set Underground nickname
 * @param {string} nickname - 3-20 chars, alphanumeric/underscore/hyphen
 */
async function setNickname(nickname) {
  const response = await fetch(`${API_BASE}/underground/nickname`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to set nickname');
  }

  return response.json();
}

/**
 * Report a post — sends the reporter's OWN decrypted copy (design §2.8).
 * The UI warns explicitly before calling this. Field shapes: the post
 * object carries camelCase encryptedContent/nonce (as mapped by the
 * backend GET and preserved through decryptPostIfNeeded); the request
 * body uses the endpoint's snake_case ciphertext_ref/nonce_ref.
 * Retries ONCE on REPORT_STALE (post edited between read and report).
 */
async function reportPost(post, reason, _retried = false) {
  const response = await fetch(`${API_BASE}/underground/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post_id: post.id,
      reason,
      plaintext: post.content,
      ciphertext_ref: post.encryptedContent,
      nonce_ref: post.nonce,
    }),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 409 && data.code === 'REPORT_STALE' && !_retried) {
    // Post changed since we read it — refetch, re-decrypt, resend once
    const fresh = await getPosts();
    const updated = (fresh.posts || []).find((p) => p.id === post.id);
    if (updated && updated.content && !updated.decryptionFailed) {
      return reportPost(updated, reason, true);
    }
  }

  if (!response.ok) {
    const err = new Error(data.error || 'Failed to submit report');
    err.code = data.code;
    err.status = response.status;
    throw err;
  }
  return data;
}

export const undergroundService = {
  getPosts,
  createPost,
  editPost,
  toggleReaction,
  deletePost,
  setNickname,
  reportPost,
  rekey,
};

export default undergroundService;
