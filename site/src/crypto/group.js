// ============================================================
// CRYPTO - Group Encryption
// ============================================================
// Handles encryption for group chats (Collective, Underground).
//
// Strategy:
// 1. Each group has a symmetric "group key"
// 2. Group key is encrypted separately for each member using their public key
// 3. Messages are encrypted with the group key
// 4. When members join/leave, group key is rotated
//
// This allows efficient group encryption without O(n) encryptions per message.

import { getSodium } from './init.js';
import { encryptWithSymmetricKey, decryptWithSymmetricKey } from './encryption.js';

/**
 * Generate a new random group key (32 bytes).
 * @returns {Uint8Array} Random symmetric key
 */
export function generateGroupKey() {
  const sodium = getSodium();
  return sodium.crypto_secretbox_keygen();
}

/**
 * Encrypt a group key for a specific member using their public key.
 * Uses sealed box (anonymous encryption) so the member can decrypt with their private key.
 *
 * @param {Uint8Array} groupKey - The group's symmetric key
 * @param {Uint8Array} memberPublicKey - Member's X25519 public key
 * @returns {string} Base64-encoded encrypted group key
 */
export function encryptGroupKeyForMember(groupKey, memberPublicKey) {
  const sodium = getSodium();

  // Sealed box: encrypts for recipient without revealing sender
  // Perfect for distributing group keys
  const encryptedKey = sodium.crypto_box_seal(groupKey, memberPublicKey);

  return sodium.to_base64(encryptedKey);
}

/**
 * Decrypt a group key using our private key.
 *
 * @param {string} encryptedKeyBase64 - Base64-encoded encrypted group key
 * @param {Uint8Array} ourPublicKey - Our public key
 * @param {Uint8Array} ourPrivateKey - Our private key
 * @returns {Uint8Array} Decrypted group key
 */
export function decryptGroupKey(encryptedKeyBase64, ourPublicKey, ourPrivateKey) {
  const sodium = getSodium();

  const encryptedKey = sodium.from_base64(encryptedKeyBase64);

  try {
    const groupKey = sodium.crypto_box_seal_open(encryptedKey, ourPublicKey, ourPrivateKey);
    return groupKey;
  } catch {
    throw new Error('Failed to decrypt group key');
  }
}

/**
 * Encrypt a message for a group using the group key.
 *
 * @param {string} plaintext - Message to encrypt
 * @param {Uint8Array} groupKey - Group's symmetric key
 * @returns {{ ciphertext: string, nonce: string }} Base64-encoded ciphertext and nonce
 */
export function encryptForGroup(plaintext, groupKey) {
  return encryptWithSymmetricKey(plaintext, groupKey);
}

/**
 * Decrypt a message from a group using the group key.
 *
 * @param {string} ciphertextBase64 - Base64-encoded ciphertext
 * @param {string} nonceBase64 - Base64-encoded nonce
 * @param {Uint8Array} groupKey - Group's symmetric key
 * @returns {string} Decrypted plaintext
 */
export function decryptFromGroup(ciphertextBase64, nonceBase64, groupKey) {
  return decryptWithSymmetricKey(ciphertextBase64, nonceBase64, groupKey);
}

/**
 * Create encrypted group keys for all members.
 * Called when creating a group or rotating keys.
 *
 * @param {Uint8Array} groupKey - The group key to distribute
 * @param {Array<{ userId: string, publicKey: string }>} members - Members with their base64 public keys
 * @returns {Array<{ userId: string, encryptedKey: string }>} Encrypted keys for each member
 */
export function encryptGroupKeyForAllMembers(groupKey, members) {
  const sodium = getSodium();

  return members.map((member) => ({
    userId: member.userId,
    encryptedKey: encryptGroupKeyForMember(groupKey, sodium.from_base64(member.publicKey)),
  }));
}

/**
 * Store group key in IndexedDB for quick access.
 * Avoids re-decrypting the group key on every message.
 */
const groupKeyCache = new Map();

/**
 * Cache a decrypted group key in memory.
 * @param {string} groupId - Group identifier
 * @param {Uint8Array} groupKey - Decrypted group key
 * @param {number} version - Key version (for rotation)
 */
export function cacheGroupKey(groupId, groupKey, version = 1) {
  groupKeyCache.set(groupId, { key: groupKey, version });
}

/**
 * Get cached group key.
 * @param {string} groupId - Group identifier
 * @returns {{ key: Uint8Array, version: number } | null}
 */
export function getCachedGroupKey(groupId) {
  return groupKeyCache.get(groupId) || null;
}

/**
 * Clear cached group key (on logout or key rotation).
 * @param {string} groupId - Group identifier (or null to clear all)
 */
export function clearGroupKeyCache(groupId = null) {
  if (groupId) {
    groupKeyCache.delete(groupId);
  } else {
    groupKeyCache.clear();
  }
}
