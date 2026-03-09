// ============================================================
// CRYPTO - Key Management
// ============================================================
// Handles X25519 keypair generation and secure storage in IndexedDB.
// Private keys NEVER leave the browser.

import { getSodium } from './init.js';

const DB_NAME = 'philosify-crypto';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const KEY_ID = 'user-keypair';

/**
 * Open IndexedDB database for key storage.
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open crypto database'));

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Generate a new X25519 keypair for asymmetric encryption.
 * @returns {{ publicKey: Uint8Array, privateKey: Uint8Array }}
 */
export function generateKeyPair() {
  const sodium = getSodium();
  const keyPair = sodium.crypto_box_keypair();

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

/**
 * Store keypair in IndexedDB.
 * @param {{ publicKey: Uint8Array, privateKey: Uint8Array }} keyPair
 * @returns {Promise<void>}
 */
export async function storeKeyPair(keyPair) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Store as base64 for easier serialization
    const sodium = getSodium();
    const record = {
      id: KEY_ID,
      publicKey: sodium.to_base64(keyPair.publicKey),
      privateKey: sodium.to_base64(keyPair.privateKey),
      createdAt: Date.now(),
    };

    const request = store.put(record);

    request.onsuccess = () => {
      db.close();
      console.log('[Crypto] Keypair stored securely');
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(new Error('Failed to store keypair'));
    };
  });
}

/**
 * Retrieve stored keypair from IndexedDB.
 * @returns {Promise<{ publicKey: Uint8Array, privateKey: Uint8Array } | null>}
 */
export async function getStoredKeyPair() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(KEY_ID);

    request.onsuccess = () => {
      db.close();

      if (!request.result) {
        resolve(null);
        return;
      }

      const sodium = getSodium();
      resolve({
        publicKey: sodium.from_base64(request.result.publicKey),
        privateKey: sodium.from_base64(request.result.privateKey),
      });
    };

    request.onerror = () => {
      db.close();
      reject(new Error('Failed to retrieve keypair'));
    };
  });
}

/**
 * Check if user has a stored keypair.
 * @returns {Promise<boolean>}
 */
export async function hasKeyPair() {
  const keyPair = await getStoredKeyPair();
  return keyPair !== null;
}

/**
 * Get public key as base64 string (for sending to server).
 * @returns {Promise<string | null>}
 */
export async function getPublicKeyBase64() {
  const keyPair = await getStoredKeyPair();
  if (!keyPair) return null;

  const sodium = getSodium();
  return sodium.to_base64(keyPair.publicKey);
}

/**
 * Clear stored keypair (for logout or key rotation).
 * @returns {Promise<void>}
 */
export async function clearKeyPair() {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(KEY_ID);

    request.onsuccess = () => {
      db.close();
      console.log('[Crypto] Keypair cleared');
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(new Error('Failed to clear keypair'));
    };
  });
}

/**
 * Convert base64 public key to Uint8Array.
 * @param {string} base64Key
 * @returns {Uint8Array}
 */
export function publicKeyFromBase64(base64Key) {
  const sodium = getSodium();
  return sodium.from_base64(base64Key);
}

/**
 * Convert Uint8Array public key to base64.
 * @param {Uint8Array} publicKey
 * @returns {string}
 */
export function publicKeyToBase64(publicKey) {
  const sodium = getSodium();
  return sodium.to_base64(publicKey);
}
