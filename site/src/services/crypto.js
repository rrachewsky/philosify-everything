// ============================================================
// E2E Crypto Service
// ============================================================
// High-level service for E2E encryption operations.
// Handles key initialization, message encryption/decryption for all chat types.

import { logger } from '@/utils';
import {
  initCrypto,
  isReady,
  generateKeyPair,
  getStoredKeyPair,
  storeKeyPair,
  hasKeyPair,
  getPublicKeyBase64,
  encryptMessage,
  decryptMessage,
  encryptForGroup,
  decryptFromGroup,
  generateGroupKey,
  encryptGroupKeyForMember,
  decryptGroupKey,
  cacheGroupKey,
  getCachedGroupKey,
  clearGroupKeyCache,
} from '@/crypto';
import * as cryptoApi from '@/services/api/crypto';
import * as dmApi from '@/services/api/dm';

// Public key cache to avoid repeated API calls
const publicKeyCache = new Map();

/**
 * Initialize the E2E encryption system.
 * Should be called once at app startup.
 */
export async function initializeE2E() {
  if (isReady()) {
    logger.log('[E2E] Already initialized');
    return;
  }

  await initCrypto();
  logger.log('[E2E] Crypto library initialized');
}

/**
 * Ensure the current user has a keypair.
 * Generates one if needed and registers with server.
 * @returns {Promise<string>} The user's public key (base64)
 */
export async function ensureUserKeys() {
  if (!isReady()) {
    await initializeE2E();
  }

  // Check if we have stored keys
  const hasKeys = await hasKeyPair();

  if (hasKeys) {
    const publicKey = await getPublicKeyBase64();
    logger.log('[E2E] Using existing keypair');
    return publicKey;
  }

  // Generate new keypair
  logger.log('[E2E] Generating new keypair...');
  const keyPair = generateKeyPair();
  await storeKeyPair(keyPair);

  // Register public key with server
  const { to_base64 } = await import('libsodium-wrappers').then((m) => m.default);
  const publicKeyBase64 = to_base64(keyPair.publicKey);

  try {
    await cryptoApi.registerPublicKey(publicKeyBase64);
    logger.log('[E2E] Public key registered with server');
  } catch (error) {
    logger.error('[E2E] Failed to register public key:', error);
    // Don't throw - key is stored locally, can retry later
  }

  return publicKeyBase64;
}

/**
 * Get a user's public key (cached).
 * @param {string} userId - User ID
 * @returns {Promise<Uint8Array | null>}
 */
export async function getUserPublicKey(userId) {
  // Check cache first
  if (publicKeyCache.has(userId)) {
    return publicKeyCache.get(userId);
  }

  try {
    const result = await cryptoApi.getPublicKey(userId);
    if (!result || !result.publicKey) {
      return null;
    }

    // Convert base64 to Uint8Array and cache
    const { from_base64 } = await import('libsodium-wrappers').then((m) => m.default);
    const publicKey = from_base64(result.publicKey);
    publicKeyCache.set(userId, publicKey);

    return publicKey;
  } catch (error) {
    logger.error(`[E2E] Failed to get public key for ${userId}:`, error);
    return null;
  }
}

/**
 * Preload public keys for multiple users.
 * @param {string[]} userIds - User IDs
 */
export async function preloadPublicKeys(userIds) {
  // Filter out already cached
  const needed = userIds.filter((id) => !publicKeyCache.has(id));
  if (needed.length === 0) return;

  try {
    const result = await cryptoApi.getPublicKeysBulk(needed);
    const { from_base64 } = await import('libsodium-wrappers').then((m) => m.default);

    for (const [userId, data] of Object.entries(result.keys || {})) {
      if (data.publicKey) {
        publicKeyCache.set(userId, from_base64(data.publicKey));
      }
    }

    logger.log(`[E2E] Preloaded ${Object.keys(result.keys || {}).length} public keys`);
  } catch (error) {
    logger.error('[E2E] Failed to preload public keys:', error);
  }
}

// ============================================================
// DM ENCRYPTION
// ============================================================

/**
 * Encrypt a DM message for a recipient.
 * @param {string} plaintext - Message content
 * @param {string} recipientId - Recipient's user ID
 * @returns {Promise<{ encrypted_content: string, nonce: string } | null>}
 */
export async function encryptDM(plaintext, recipientId) {
  if (!isReady()) {
    logger.warn('[E2E] Not initialized, sending unencrypted');
    return null;
  }

  const keyPair = await getStoredKeyPair();
  if (!keyPair) {
    logger.warn('[E2E] No keypair, sending unencrypted');
    return null;
  }

  const recipientPublicKey = await getUserPublicKey(recipientId);
  if (!recipientPublicKey) {
    logger.warn('[E2E] Recipient has no public key, sending unencrypted');
    return null;
  }

  try {
    const { ciphertext, nonce } = encryptMessage(plaintext, keyPair.privateKey, recipientPublicKey);

    return {
      encrypted_content: ciphertext,
      nonce: nonce,
    };
  } catch (error) {
    logger.error('[E2E] DM encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt a DM message from a sender.
 * @param {string} encryptedContent - Base64 ciphertext
 * @param {string} nonce - Base64 nonce
 * @param {string} senderId - Sender's user ID
 * @returns {Promise<string | null>}
 */
export async function decryptDM(encryptedContent, nonce, senderId) {
  if (!encryptedContent || !nonce) {
    return null; // Unencrypted message
  }

  if (!isReady()) {
    logger.warn('[E2E] Not initialized, cannot decrypt');
    return null;
  }

  const keyPair = await getStoredKeyPair();
  if (!keyPair) {
    logger.warn('[E2E] No keypair, cannot decrypt');
    return null;
  }

  const senderPublicKey = await getUserPublicKey(senderId);
  if (!senderPublicKey) {
    logger.warn('[E2E] Sender has no public key, cannot decrypt');
    return null;
  }

  try {
    return decryptMessage(encryptedContent, nonce, keyPair.privateKey, senderPublicKey);
  } catch (error) {
    logger.error('[E2E] DM decryption failed:', error);
    return null;
  }
}

// ============================================================
// GROUP ENCRYPTION (Collective)
// ============================================================

/**
 * Get or initialize the group key for a collective.
 * @param {string} groupId - Collective group ID
 * @returns {Promise<Uint8Array | null>}
 */
export async function getCollectiveGroupKey(groupId) {
  // Check cache first
  const cached = getCachedGroupKey(groupId);
  if (cached) {
    return cached.key;
  }

  if (!isReady()) {
    return null;
  }

  const keyPair = await getStoredKeyPair();
  if (!keyPair) {
    return null;
  }

  try {
    const result = await cryptoApi.getCollectiveKey(groupId);
    if (!result.encryptedKey) {
      return null; // Group doesn't have encryption enabled yet
    }

    // Decrypt the group key
    const groupKey = decryptGroupKey(result.encryptedKey, keyPair.publicKey, keyPair.privateKey);

    // Cache it
    cacheGroupKey(groupId, groupKey, result.keyVersion);
    logger.log(`[E2E] Collective group key decrypted, version ${result.keyVersion}`);

    return groupKey;
  } catch (error) {
    logger.error('[E2E] Failed to get collective group key:', error);
    return null;
  }
}

/**
 * Initialize encryption for a collective (called when joining or creating).
 * @param {string} groupId - Collective group ID
 * @param {Array<{ userId: string, publicKey: string }>} members - All members with their public keys
 * @returns {Promise<boolean>}
 */
export async function initializeCollectiveEncryption(groupId, members) {
  if (!isReady()) {
    return false;
  }

  try {
    // Generate new group key
    const groupKey = generateGroupKey();

    // Encrypt for each member
    const { from_base64 } = await import('libsodium-wrappers').then((m) => m.default);
    const memberKeys = members.map((member) => ({
      userId: member.userId,
      encryptedKey: encryptGroupKeyForMember(groupKey, from_base64(member.publicKey)),
    }));

    // Send to server
    await cryptoApi.setCollectiveKeys(groupId, memberKeys);

    // Cache our copy
    cacheGroupKey(groupId, groupKey, 1);
    logger.log('[E2E] Collective encryption initialized');

    return true;
  } catch (error) {
    logger.error('[E2E] Failed to initialize collective encryption:', error);
    return false;
  }
}

/**
 * Encrypt a message for a collective.
 * @param {string} plaintext - Message content
 * @param {string} groupId - Collective group ID
 * @returns {Promise<{ encrypted_content: string, nonce: string } | null>}
 */
export async function encryptCollectiveMessage(plaintext, groupId) {
  const groupKey = await getCollectiveGroupKey(groupId);
  if (!groupKey) {
    logger.warn('[E2E] No group key, sending unencrypted');
    return null;
  }

  try {
    const { ciphertext, nonce } = encryptForGroup(plaintext, groupKey);
    return {
      encrypted_content: ciphertext,
      nonce: nonce,
    };
  } catch (error) {
    logger.error('[E2E] Collective encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt a message from a collective.
 * @param {string} encryptedContent - Base64 ciphertext
 * @param {string} nonce - Base64 nonce
 * @param {string} groupId - Collective group ID
 * @returns {Promise<string | null>}
 */
export async function decryptCollectiveMessage(encryptedContent, nonce, groupId) {
  if (!encryptedContent || !nonce) {
    return null;
  }

  const groupKey = await getCollectiveGroupKey(groupId);
  if (!groupKey) {
    logger.warn('[E2E] No group key, cannot decrypt');
    return null;
  }

  try {
    return decryptFromGroup(encryptedContent, nonce, groupKey);
  } catch (error) {
    logger.error('[E2E] Collective decryption failed:', error);
    return null;
  }
}

// ============================================================
// GROUP DM ENCRYPTION
// ============================================================

/**
 * Get or initialize the group key for a DM conversation.
 * @param {string} conversationId - DM conversation UUID
 * @returns {Promise<Uint8Array | null>}
 */
export async function getDMGroupKey(conversationId) {
  // Check cache first (reuses the same group key cache as collectives)
  const cached = getCachedGroupKey(`dm:${conversationId}`);
  if (cached) {
    return cached.key;
  }

  if (!isReady()) {
    return null;
  }

  const keyPair = await getStoredKeyPair();
  if (!keyPair) {
    return null;
  }

  try {
    const result = await dmApi.getConversationKey(conversationId);
    if (!result.encryptedKey) {
      return null; // No group key set yet
    }

    // Decrypt the group key
    const groupKey = decryptGroupKey(result.encryptedKey, keyPair.publicKey, keyPair.privateKey);

    // Cache it (prefix with "dm:" to avoid collisions with collective group IDs)
    cacheGroupKey(`dm:${conversationId}`, groupKey, result.keyVersion);
    logger.log(`[E2E] DM group key decrypted, version ${result.keyVersion}`);

    return groupKey;
  } catch (error) {
    logger.error('[E2E] Failed to get DM group key:', error);
    return null;
  }
}

/**
 * Initialize encryption for a group DM conversation.
 * Called when promoting direct→group or creating a new group.
 * @param {string} conversationId - DM conversation UUID
 * @param {Array<{ userId: string, publicKey: string }>} members - All members with public keys
 * @returns {Promise<boolean>}
 */
export async function initializeDMGroupEncryption(conversationId, members) {
  if (!isReady()) {
    return false;
  }

  try {
    // Generate new group key
    const groupKey = generateGroupKey();

    // Encrypt for each member
    const { from_base64 } = await import('libsodium-wrappers').then((m) => m.default);
    const memberKeys = members.map((member) => ({
      userId: member.userId,
      encryptedKey: encryptGroupKeyForMember(groupKey, from_base64(member.publicKey)),
    }));

    // Send to server via DM key endpoint
    await dmApi.setConversationKeys(conversationId, memberKeys);

    // Cache our copy
    cacheGroupKey(`dm:${conversationId}`, groupKey, 1);
    logger.log('[E2E] DM group encryption initialized');

    return true;
  } catch (error) {
    logger.error('[E2E] Failed to initialize DM group encryption:', error);
    return false;
  }
}

/**
 * Encrypt a message for a group DM conversation.
 * @param {string} plaintext - Message content
 * @param {string} conversationId - DM conversation UUID
 * @returns {Promise<{ encrypted_content: string, nonce: string } | null>}
 */
export async function encryptGroupDM(plaintext, conversationId) {
  const groupKey = await getDMGroupKey(conversationId);
  if (!groupKey) {
    logger.warn('[E2E] No DM group key, sending unencrypted');
    return null;
  }

  try {
    const { ciphertext, nonce } = encryptForGroup(plaintext, groupKey);
    return {
      encrypted_content: ciphertext,
      nonce: nonce,
    };
  } catch (error) {
    logger.error('[E2E] DM group encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt a message from a group DM conversation.
 * @param {string} encryptedContent - Base64 ciphertext
 * @param {string} nonce - Base64 nonce
 * @param {string} conversationId - DM conversation UUID
 * @returns {Promise<string | null>}
 */
export async function decryptGroupDM(encryptedContent, nonce, conversationId) {
  if (!encryptedContent || !nonce) {
    return null;
  }

  const groupKey = await getDMGroupKey(conversationId);
  if (!groupKey) {
    logger.warn('[E2E] No DM group key, cannot decrypt');
    return null;
  }

  try {
    return decryptFromGroup(encryptedContent, nonce, groupKey);
  } catch (error) {
    logger.error('[E2E] DM group decryption failed:', error);
    return null;
  }
}

// ============================================================
// UNDERGROUND ENCRYPTION
// ============================================================
// Underground uses a shared room key for all unlocked users.
// Simpler than per-conversation keys since it's a single room.

let undergroundRoomKey = null;

/**
 * Set the Underground room key (received when unlocking).
 * @param {string} encryptedKey - Base64 encrypted room key
 */
export async function setUndergroundRoomKey(encryptedKey) {
  if (!encryptedKey || !isReady()) {
    return;
  }

  const keyPair = await getStoredKeyPair();
  if (!keyPair) {
    return;
  }

  try {
    undergroundRoomKey = decryptGroupKey(encryptedKey, keyPair.publicKey, keyPair.privateKey);
    logger.log('[E2E] Underground room key set');
  } catch (error) {
    logger.error('[E2E] Failed to decrypt Underground room key:', error);
  }
}

/**
 * Encrypt a post for Underground.
 * @param {string} plaintext - Post content
 * @returns {{ encrypted_content: string, nonce: string } | null}
 */
export function encryptUndergroundPost(plaintext) {
  if (!undergroundRoomKey) {
    return null;
  }

  try {
    const { ciphertext, nonce } = encryptForGroup(plaintext, undergroundRoomKey);
    return {
      encrypted_content: ciphertext,
      nonce: nonce,
    };
  } catch (error) {
    logger.error('[E2E] Underground encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt a post from Underground.
 * @param {string} encryptedContent - Base64 ciphertext
 * @param {string} nonce - Base64 nonce
 * @returns {string | null}
 */
export function decryptUndergroundPost(encryptedContent, nonce) {
  if (!encryptedContent || !nonce || !undergroundRoomKey) {
    return null;
  }

  try {
    return decryptFromGroup(encryptedContent, nonce, undergroundRoomKey);
  } catch (error) {
    logger.error('[E2E] Underground decryption failed:', error);
    return null;
  }
}

// ============================================================
// CLEANUP
// ============================================================

/**
 * Clear all cached keys (call on logout).
 */
export function clearAllCaches() {
  publicKeyCache.clear();
  clearGroupKeyCache();
  undergroundRoomKey = null;
  logger.log('[E2E] All caches cleared');
}

export default {
  initializeE2E,
  ensureUserKeys,
  getUserPublicKey,
  preloadPublicKeys,
  // DM (pairwise)
  encryptDM,
  decryptDM,
  // DM (group)
  getDMGroupKey,
  initializeDMGroupEncryption,
  encryptGroupDM,
  decryptGroupDM,
  // Collective
  getCollectiveGroupKey,
  initializeCollectiveEncryption,
  encryptCollectiveMessage,
  decryptCollectiveMessage,
  // Underground
  setUndergroundRoomKey,
  encryptUndergroundPost,
  decryptUndergroundPost,
  // Cleanup
  clearAllCaches,
};
