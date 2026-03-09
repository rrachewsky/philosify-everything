// ============================================================
// Block API Service - Block/unblock users
// ============================================================

import { config } from '@/config';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Block a user
 * @param {string} userId - UUID of user to block
 */
export async function blockUser(userId) {
  const res = await fetch(`${API_BASE}/users/block`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to block user');
  }
  return res.json();
}

/**
 * Unblock a user
 * @param {string} userId - UUID of user to unblock
 */
export async function unblockUser(userId) {
  const res = await fetch(`${API_BASE}/users/block/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to unblock user');
  }
  return res.json();
}

/**
 * Get list of blocked user IDs
 */
export async function getBlockedUsers() {
  const res = await fetch(`${API_BASE}/users/blocked`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load blocked users');
  }
  return res.json();
}

export const blockService = {
  blockUser,
  unblockUser,
  getBlockedUsers,
};

export default blockService;
