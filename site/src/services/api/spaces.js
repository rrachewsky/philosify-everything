// ============================================================
// SPACES SERVICE
// ============================================================
// API calls for checking and unlocking premium space access.

import { config } from '@/config';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Check if user has access to a space
 * @param {string} space - 'underground' | 'forum'
 */
async function getStatus(space) {
  const response = await fetch(`${API_BASE}/spaces/${space}/status`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to check access');
  }

  return response.json();
}

/**
 * Unlock access to a space (costs credits)
 * @param {string} space - 'underground' | 'forum'
 */
async function unlock(space) {
  const response = await fetch(`${API_BASE}/spaces/${space}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to unlock space');
  }

  return response.json();
}

export const spacesService = {
  getStatus,
  unlock,
};

export default spacesService;
