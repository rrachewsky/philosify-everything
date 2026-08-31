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
  publicKeyFromBase64,
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

  let publicKeyBase64;
  if (hasKeys) {
    publicKeyBase64 = await getPublicKeyBase64();
    logger.log('[E2E] Using existing keypair');
  } else {
    logger.log('[E2E] Generating new keypair...');
    const keyPair = generateKeyPair();
    await storeKeyPair(keyPair);
    const { to_base64 } = await import('libsodium-wrappers').then((m) => m.default);
    publicKeyBase64 = to_base64(keyPair.publicKey);
  }

  // ALWAYS register with the server. A local keypair does NOT imply the
  // server has it: E2E-optional-era keys were never pushed, and a prior
  // registration may have failed silently — either way, unlock rejects the
  // member with 409 KEYPAIR_REQUIRED. Registration is idempotent server-side
  // (same key → no version churn), so re-calling is cheap and self-heals.
  try {
    await cryptoApi.registerPublicKey(publicKeyBase64);
    logger.log('[E2E] Public key registered with server');
  } catch (error) {
    logger.error('[E2E] Failed to register public key:', error);
    // Not fatal here: unlock surfaces 409 and the next attempt retries.
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
// UNDERGROUND ENCRYPTION — MODO A (at-rest, worker-held room key)
// ============================================================
// One shared room key held by the WORKER (KEK-wrapped at rest) and
// delivered raw on GET /api/underground. No per-member keys, no
// fingerprint, no rekey. The raw key lives in memory here only to
// encrypt/decrypt posts (secretbox). Losing it in the browser is
// harmless — the next load re-delivers it.

let undergroundRoomKey = null;

/**
 * Store the room key delivered by the server (base64 url-safe → raw bytes).
 * @param {string|null} roomKeyBase64
 * @returns {boolean} true = a usable key is now held
 */
export function setUndergroundRoomKeyFromServer(roomKeyBase64) {
  if (!roomKeyBase64) {
    undergroundRoomKey = null;
    return false;
  }
  try {
    // publicKeyFromBase64 is a generic sodium.from_base64 (URLSAFE_NO_PADDING),
    // matching the worker's delivery encoding.
    undergroundRoomKey = publicKeyFromBase64(roomKeyBase64);
    return true;
  } catch (error) {
    logger.error('[Underground] Failed to decode delivered room key:', error);
    undergroundRoomKey = null;
    return false;
  }
}

/** Whether this browser currently holds the room key. */
export function hasUndergroundRoomKey() {
  return !!undergroundRoomKey;
}

/**
 * Encrypt a post for Underground. Null when the key is absent —
 * the caller must surface the pending state, never send plaintext.
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
  // Underground (MODO A)
  setUndergroundRoomKeyFromServer,
  hasUndergroundRoomKey,
  encryptUndergroundPost,
  decryptUndergroundPost,
  // Cleanup
  clearAllCaches,
};
