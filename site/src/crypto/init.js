// ============================================================
// CRYPTO - Initialization
// ============================================================
// Initializes libsodium library. Must be called before any crypto operations.

import _sodium from 'libsodium-wrappers';

let sodium = null;
let initialized = false;

/**
 * Initialize the crypto library.
 * Must be called once at app startup before any encryption operations.
 * @returns {Promise<void>}
 */
export async function initCrypto() {
  if (initialized) return;

  await _sodium.ready;
  sodium = _sodium;
  initialized = true;

  console.log('[Crypto] Libsodium initialized');
}

/**
 * Check if crypto library is ready.
 * @returns {boolean}
 */
export function isReady() {
  return initialized;
}

/**
 * Get the sodium instance.
 * Throws if not initialized.
 * @returns {typeof _sodium}
 */
export function getSodium() {
  if (!initialized) {
    throw new Error('[Crypto] Not initialized. Call initCrypto() first.');
  }
  return sodium;
}
