// ============================================================
// Forum API Service - Public debates and threads
// ============================================================

import { config } from '@/config';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Get forum threads (paginated)
 * @param {Object} options - Query options
 * @param {string} [options.category] - Filter by category
 * @param {string} [options.before] - Pagination cursor (last_reply_at)
 */
export async function getForumThreads(options = {}) {
  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.before) params.set('before', options.before);

  const query = params.toString();
  const url = `${API_BASE}/forum/threads${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load threads');
  }
  return res.json();
}

/**
 * Get single thread with replies
 * @param {string} threadId - Thread UUID
 */
export async function getForumThread(threadId) {
  const url = `${API_BASE}/forum/threads/${threadId}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load thread');
  }
  return res.json();
}

/**
 * Create a new thread
 * @param {Object} data - Thread data
 * @param {string} data.title - Thread title (3-200 chars)
 * @param {string} data.content - Thread content (10-5000 chars)
 * @param {string} [data.category] - Category (default: 'general')
 */
export async function createForumThread(data) {
  const url = `${API_BASE}/forum/threads`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create thread');
  }
  return res.json();
}

/**
 * Delete own thread
 * @param {string} threadId - Thread UUID
 */
export async function deleteForumThread(threadId) {
  const url = `${API_BASE}/forum/threads/${threadId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete thread');
  }
  return res.json();
}

/**
 * Create a reply to a thread
 * @param {string} threadId - Thread UUID
 * @param {Object} data - Reply data
 * @param {string} data.content - Reply content (1-3000 chars)
 * @param {string} [data.parent_id] - Parent reply ID for nested replies
 */
export async function createForumReply(threadId, data) {
  const url = `${API_BASE}/forum/threads/${threadId}/replies`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create reply');
  }
  return res.json();
}

/**
 * Delete own reply
 * @param {string} replyId - Reply UUID
 */
export async function deleteForumReply(replyId) {
  const url = `${API_BASE}/forum/replies/${replyId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete reply');
  }
  return res.json();
}

/**
 * Edit own reply (before verdict)
 * @param {string} replyId - Reply UUID
 * @param {string} content - New content
 */
export async function editForumReply(replyId, content) {
  const url = `${API_BASE}/forum/replies/${replyId}`;
  const res = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to edit reply');
  }
  return res.json();
}

/**
 * Vote on a reply (upvote/downvote)
 * @param {string} replyId - Reply UUID
 * @param {string|null} voteType - 'up', 'down', or null to remove vote
 */
export async function voteForumReply(replyId, voteType) {
  const url = `${API_BASE}/forum/replies/${replyId}/vote`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote_type: voteType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to vote');
  }
  return res.json();
}

/**
 * Request AI wrap-up for a debate (owner only)
 * @param {string} threadId - Thread UUID
 * @returns {Promise<{success: boolean, wrapup: string, cached: boolean}>}
 */
export async function wrapupDebate(threadId, language) {
  const url = `${API_BASE}/forum/threads/${threadId}/wrapup`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language: language || 'en' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate wrap-up');
  }
  return res.json();
}

/**
 * Invite users to a debate (sends DM + push notification)
 * @param {string} threadId - Thread UUID
 * @param {string[]} userIds - Array of user UUIDs to invite
 * @returns {Promise<{success: boolean, invited: number, total: number}>}
 */
export async function inviteToDebate(threadId, userIds) {
  const url = `${API_BASE}/forum/threads/${threadId}/invite`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_ids: userIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to send invitations');
    error.status = res.status;
    throw error;
  }
  return res.json();
}
