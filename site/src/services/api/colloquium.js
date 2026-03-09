// ============================================================
// Colloquium API Service - Academic Colloquium marketplace
// ============================================================

import { config } from '@/config';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Fetch with automatic retry on transient (5xx / network) errors.
 * Safe for credit-gated operations because the backend handlers check
 * for existing records before charging again ("already_unlocked" path).
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} retries - Number of retry attempts (default 1)
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options, retries = 1) {
  let lastResponse;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      // Only retry on server errors (5xx), not client errors (4xx)
      if (res.ok || res.status < 500 || attempt === retries) return res;
      lastResponse = res;
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      // Network error — retry if attempts remain
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return lastResponse;
}

/**
 * Get colloquium storefront list (free to browse)
 * @param {Object} [options] - Query options
 * @param {string} [options.before] - Pagination cursor
 * @returns {Promise<{colloquiums: Array}>}
 */
export async function getColloquiums(options = {}) {
  const params = new URLSearchParams();
  if (options.before) params.set('before', options.before);

  const query = params.toString();
  const url = `${API_BASE}/colloquium${query ? `?${query}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load colloquiums');
  }
  return res.json();
}

/**
 * Get full colloquium thread with replies (requires access)
 * @param {string} threadId - Thread UUID
 * @returns {Promise<{thread: Object, replies: Array, access: Object}>}
 */
export async function getColloquium(threadId, lang) {
  const langParam = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  const url = `${API_BASE}/colloquium/${threadId}${langParam}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to load colloquium');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Pay 1 credit to unlock read access to a colloquium
 * @param {string} threadId - Thread UUID
 * @returns {Promise<{success: boolean, balance?: Object}>}
 */
export async function accessColloquium(threadId) {
  const url = `${API_BASE}/colloquium/${threadId}/access`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to unlock access');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Pay 1-2 credits to unlock participation (reply) in a colloquium
 * @param {string} threadId - Thread UUID
 * @returns {Promise<{success: boolean, balance?: Object}>}
 */
export async function participateColloquium(threadId) {
  const url = `${API_BASE}/colloquium/${threadId}/participate`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to unlock participation');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Add a philosopher to a colloquium (2-3 credits based on tier)
 * @param {string} threadId - Thread UUID
 * @param {string} philosopherName - Philosopher name
 * @returns {Promise<{success: boolean, philosopher: string, price: number, balance?: Object}>}
 */
export async function addPhilosopher(threadId, philosopherName) {
  const url = `${API_BASE}/colloquium/${threadId}/add-philosopher`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ philosopher_name: philosopherName }),
  });
  if (!res.ok) {
    // Handle timeout — philosopher may have been added despite timeout
    if (res.status === 504 || res.status === 524) {
      const error = new Error('CREATION_TIMEOUT');
      error.code = 'CREATION_TIMEOUT';
      error.status = res.status;
      throw error;
    }
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to add philosopher');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Cast a poll vote for a philosopher in a colloquium.
 * One vote per user; calling again changes the vote.
 * @param {string} threadId - Thread UUID
 * @param {string} philosopherName - Philosopher to vote for
 * @returns {Promise<{success: boolean, poll: {tallies: Object, myVote: string, totalVotes: number}}>}
 */
export async function castPollVote(threadId, philosopherName) {
  const url = `${API_BASE}/colloquium/${threadId}/poll-vote`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ philosopher_name: philosopherName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to cast vote');
  }
  return res.json();
}

/**
 * Propose a new colloquium topic (5 credits)
 * Returns immediately after thread creation — philosopher replies generate in background.
 * @param {string} title - Topic title (3-200 chars)
 * @param {string} content - Topic content/context (10-5000 chars)
 * @param {string} visibility - 'open' (everyone sees) or 'closed' (only proposer)
 * @param {string} lang - User's language code (e.g., 'pt', 'en')
 * @returns {Promise<{success: boolean, threadId: string, philosophers: string[], balance?: Object}>}
 */
export async function proposeColloquium(title, content, visibility = 'open', lang = 'en') {
  const url = `${API_BASE}/colloquium/propose`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, visibility, lang }),
  });
  if (!res.ok) {
    // Handle timeout — thread may have been created despite timeout
    if (res.status === 504 || res.status === 524) {
      const error = new Error('CREATION_TIMEOUT');
      error.code = 'CREATION_TIMEOUT';
      error.status = res.status;
      throw error;
    }
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to propose colloquium');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Propose an Open Debate (3 credits, no AI philosophers, proposer triggers verdict)
 * @param {string} title - Topic title (3-200 chars)
 * @param {string} content - Topic content/context (10-5000 chars)
 * @param {string} lang - User's language code (e.g., 'pt', 'en')
 * @returns {Promise<{success: boolean, threadId: string, balance?: Object}>}
 */
export async function proposeOpenDebate(title, content, lang = 'en') {
  const url = `${API_BASE}/colloquium/open-debate`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, lang }),
  });
  if (!res.ok) {
    if (res.status === 504 || res.status === 524) {
      const error = new Error('CREATION_TIMEOUT');
      error.code = 'CREATION_TIMEOUT';
      error.status = res.status;
      throw error;
    }
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to create open debate');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Proposer: trigger verdict generation for an open debate
 * @param {string} threadId - Thread UUID
 * @returns {Promise<{success: boolean}>}
 */
export async function triggerProposerVerdict(threadId, lang) {
  const langParam = lang ? `?lang=${encodeURIComponent(lang.split('-')[0])}` : '';
  const url = `${API_BASE}/colloquium/${threadId}/verdict${langParam}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to generate verdict');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Invite a user to a colloquium (proposer for user-proposed; any participant for AI daily)
 * @param {string} threadId - Thread UUID
 * @param {string} userId - User UUID to invite
 * @returns {Promise<{success: boolean}>}
 */
export async function inviteToColloquium(threadId, userId) {
  const url = `${API_BASE}/colloquium/${threadId}/invite`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to invite user');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Invite multiple users to a colloquium (batch)
 * @param {string} threadId - Thread UUID
 * @param {string[]} userIds - User UUIDs to invite
 * @returns {Promise<{success: boolean, invited: number, already_invited: number, total: number}>}
 */
export async function inviteToColloquiumBatch(threadId, userIds) {
  const url = `${API_BASE}/colloquium/${threadId}/invite`;
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_ids: userIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to invite users');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Get philosopher roster with pricing
 * @returns {Promise<{roster: Array<{name: string, era: string, school: string, price: number}>}>}
 */
export async function getPhilosopherRoster() {
  const url = `${API_BASE}/colloquium/roster`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load roster');
  }
  return res.json();
}

/**
 * Delete a colloquium (proposer or admin).
 * Proposers use cookie auth; admin uses X-Admin-Secret header.
 * @param {string} threadId - Thread UUID
 * @param {string} [adminSecret] - Admin secret (omit for proposer auth)
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteColloquium(threadId, adminSecret) {
  const url = `${API_BASE}/colloquium/${threadId}`;
  const headers = { 'Content-Type': 'application/json' };
  if (adminSecret) {
    headers['X-Admin-Secret'] = adminSecret;
  }
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete colloquium');
  }
  return res.json();
}

/**
 * Admin: trigger verdict generation for a colloquium
 * @param {string} threadId - Thread UUID
 * @param {string} adminSecret - Admin secret
 * @returns {Promise<{success: boolean}>}
 */
/**
 * Retry philosopher generation for a stuck colloquium (proposer only, no credits)
 * @param {string} threadId - Thread UUID
 * @returns {Promise<{success: boolean}>}
 */
export async function retryGeneration(threadId) {
  const url = `${API_BASE}/colloquium/${threadId}/retry`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to retry generation');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

/**
 * Admin: trigger verdict generation for a colloquium
 * @param {string} threadId - Thread UUID
 * @param {string} adminSecret - Admin secret
 * @returns {Promise<{success: boolean}>}
 */
export async function triggerVerdict(threadId, adminSecret) {
  const url = `${API_BASE}/colloquium/${threadId}/verdict?force=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': adminSecret,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err.error || 'Failed to generate verdict');
    error.code = err.code;
    error.status = res.status;
    throw error;
  }
  return res.json();
}
