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

  // Nickname gate — the room key only matters past it
  if (data.needsNickname) {
    return data;
  }

  // MODO A: the server delivers the room key on GET. Store it, then decrypt.
  const held = cryptoService.setUndergroundRoomKeyFromServer(data.roomKey);
  data.roomStatus = held ? 'ready' : 'error';

  // Decrypt posts
  if (data.posts && data.posts.length > 0) {
    data.posts = await Promise.all(data.posts.map(decryptPostIfNeeded));
  }

  return data;
}

// (MODO A) Removed: ensureRoomReady, runDistributorSweep, roomInit,
// getPendingKeys, distributeKeys, rekey. The server delivers the single
// room key on GET; there is no per-member key flow anymore.

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
 * Report a post (MODO A): {post_id, reason}. No plaintext leaves the client —
 * the server decrypts on demand on the moderation path. The UI warns that
 * moderation can read the post.
 */
async function reportPost(post, reason) {
  const response = await fetch(`${API_BASE}/underground/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_id: post.id, reason }),
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));
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
};

export default undergroundService;
