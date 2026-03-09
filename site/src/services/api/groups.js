// ============================================================
// GROUPS SERVICE
// ============================================================
// API calls for group analysis functionality.
//
// Usage:
//   import { groupsService } from '@/services/api/groups';
//   await groupsService.createGroup(analysisId, 'My Group');
//   await groupsService.joinGroup('PH3K9X');

import { config } from '@/config';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Create a group for an analysis
 * @param {string} analysisId - UUID of the analysis
 * @param {string} name - Group name
 */
async function createGroup(analysisId, name) {
  const response = await fetch(`${API_BASE}/groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, name }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create group');
  }

  return response.json();
}

/**
 * List user's groups
 */
async function getMyGroups() {
  const response = await fetch(`${API_BASE}/groups`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load groups');
  }

  return response.json();
}

/**
 * Join a group by invite code
 * @param {string} code - 6-character invite code
 */
async function joinGroup(code) {
  const response = await fetch(`${API_BASE}/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to join group');
  }

  return response.json();
}

/**
 * Get group detail (analysis, members, recent chat)
 * @param {string} groupId - UUID of the group
 */
async function getGroupDetail(groupId) {
  const response = await fetch(`${API_BASE}/groups/${groupId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load group');
  }

  return response.json();
}

/**
 * Fetch group chat messages (paginated)
 * @param {string} groupId - UUID of the group
 * @param {string} [before] - ISO timestamp cursor for pagination
 */
async function getGroupChat(groupId, before) {
  const url = new URL(`${API_BASE}/groups/${groupId}/chat`);
  if (before) {
    url.searchParams.set('before', before);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load messages');
  }

  return response.json();
}

/**
 * Send a message to a group chat
 * @param {string} groupId - UUID of the group
 * @param {string} message - Message text
 */
async function sendGroupMessage(groupId, message) {
  const response = await fetch(`${API_BASE}/groups/${groupId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to send message');
  }

  return response.json();
}

/**
 * Leave a group
 * @param {string} groupId - UUID of the group
 */
async function leaveGroup(groupId) {
  const response = await fetch(`${API_BASE}/groups/${groupId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to leave group');
  }

  return response.json();
}

/**
 * Kick a member from a group (owner only)
 * @param {string} groupId - UUID of the group
 * @param {string} memberUserId - UUID of the member to kick
 */
async function kickMember(groupId, memberUserId) {
  const response = await fetch(`${API_BASE}/groups/${groupId}/members/${memberUserId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to kick member');
  }

  return response.json();
}

export {
  createGroup,
  getMyGroups,
  joinGroup,
  getGroupDetail,
  getGroupChat,
  sendGroupMessage,
  leaveGroup,
  kickMember,
};

export const groupsService = {
  createGroup,
  getMyGroups,
  joinGroup,
  getGroupDetail,
  getGroupChat,
  sendGroupMessage,
  leaveGroup,
  kickMember,
};

export default groupsService;
