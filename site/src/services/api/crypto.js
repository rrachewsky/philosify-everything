// ============================================================
// Crypto API Service
// ============================================================
// Handles public key registration and retrieval for E2E encryption.

import { config } from '@/config';
import { logger } from '@/utils';

/**
 * Register or update the current user's public key.
 * @param {string} publicKey - Base64-encoded X25519 public key
 * @returns {Promise<{ success: boolean, keyVersion: number }>}
 */
export async function registerPublicKey(publicKey) {
  logger.log('[Crypto API] Registering public key');

  const response = await fetch(`${config.apiUrl}/api/crypto/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ publicKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to register public key');
  }

  return response.json();
}

/**
 * Get a user's public key.
 * @param {string} userId - User ID
 * @returns {Promise<{ userId: string, publicKey: string, keyVersion: number }>}
 */
export async function getPublicKey(userId) {
  const response = await fetch(`${config.apiUrl}/api/crypto/keys/${userId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // User doesn't have a public key yet
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get public key');
  }

  return response.json();
}

/**
 * Get multiple users' public keys at once.
 * @param {string[]} userIds - Array of user IDs
 * @returns {Promise<{ keys: Record<string, { publicKey: string, keyVersion: number }> }>}
 */
export async function getPublicKeysBulk(userIds) {
  if (!userIds || userIds.length === 0) {
    return { keys: {} };
  }

  const response = await fetch(`${config.apiUrl}/api/crypto/keys/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get public keys');
  }

  return response.json();
}

/**
 * Get my encrypted group key for a collective.
 * @param {string} groupId - Collective group ID
 * @returns {Promise<{ encryptedKey: string | null, keyVersion: number }>}
 */
export async function getCollectiveKey(groupId) {
  const response = await fetch(`${config.apiUrl}/api/crypto/collective/${groupId}/key`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get collective key');
  }

  return response.json();
}

/**
 * Set group keys for all members of a collective.
 * @param {string} groupId - Collective group ID
 * @param {Array<{ userId: string, encryptedKey: string }>} memberKeys - Encrypted keys for each member
 * @returns {Promise<{ success: boolean, keyVersion: number }>}
 */
export async function setCollectiveKeys(groupId, memberKeys) {
  const response = await fetch(`${config.apiUrl}/api/crypto/collective/${groupId}/key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ memberKeys }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to set collective keys');
  }

  return response.json();
}

export default {
  registerPublicKey,
  getPublicKey,
  getPublicKeysBulk,
  getCollectiveKey,
  setCollectiveKeys,
};
