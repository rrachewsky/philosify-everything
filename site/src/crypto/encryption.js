// ============================================================
// CRYPTO - Message Encryption/Decryption
// ============================================================
// Provides E2E encryption for 1:1 messages using:
// - X25519 for key exchange (Diffie-Hellman)
// - XChaCha20-Poly1305 for authenticated encryption
//
// The shared secret is derived from sender's private key + recipient's public key.
// This is the same secret derived by recipient using their private key + sender's public key.

import { getSodium } from './init.js';

/**
 * Derive a shared secret from our private key and their public key.
 * Uses X25519 Diffie-Hellman key exchange.
 *
 * @param {Uint8Array} ourPrivateKey - Our X25519 private key
 * @param {Uint8Array} theirPublicKey - Their X25519 public key
 * @returns {Uint8Array} 32-byte shared secret
 */
export function deriveSharedSecret(ourPrivateKey, theirPublicKey) {
  const sodium = getSodium();

  // X25519 scalar multiplication: shared = ourPrivate * theirPublic
  // Both parties derive the same shared secret
  return sodium.crypto_scalarmult(ourPrivateKey, theirPublicKey);
}

/**
 * Encrypt a message for a specific recipient.
 * Uses XChaCha20-Poly1305 authenticated encryption.
 *
 * @param {string} plaintext - Message to encrypt
 * @param {Uint8Array} ourPrivateKey - Sender's private key
 * @param {Uint8Array} theirPublicKey - Recipient's public key
 * @returns {{ ciphertext: string, nonce: string }} Base64-encoded ciphertext and nonce
 */
export function encryptMessage(plaintext, ourPrivateKey, theirPublicKey) {
  const sodium = getSodium();

  // Derive shared secret using X25519
  const sharedSecret = deriveSharedSecret(ourPrivateKey, theirPublicKey);

  // Derive encryption key from shared secret using BLAKE2b
  const encryptionKey = sodium.crypto_generichash(sodium.crypto_secretbox_KEYBYTES, sharedSecret);

  // Generate random nonce (24 bytes for XChaCha20)
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  // Encrypt with XChaCha20-Poly1305
  const plaintextBytes = sodium.from_string(plaintext);
  const ciphertext = sodium.crypto_secretbox_easy(plaintextBytes, nonce, encryptionKey);

  // Return base64-encoded for transport/storage
  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  };
}

/**
 * Decrypt a message from a specific sender.
 *
 * @param {string} ciphertextBase64 - Base64-encoded ciphertext
 * @param {string} nonceBase64 - Base64-encoded nonce
 * @param {Uint8Array} ourPrivateKey - Our private key
 * @param {Uint8Array} theirPublicKey - Sender's public key
 * @returns {string} Decrypted plaintext
 * @throws {Error} If decryption fails (tampered or wrong key)
 */
export function decryptMessage(ciphertextBase64, nonceBase64, ourPrivateKey, theirPublicKey) {
  const sodium = getSodium();

  // Derive same shared secret
  const sharedSecret = deriveSharedSecret(ourPrivateKey, theirPublicKey);

  // Derive same encryption key
  const encryptionKey = sodium.crypto_generichash(sodium.crypto_secretbox_KEYBYTES, sharedSecret);

  // Decode from base64
  const ciphertext = sodium.from_base64(ciphertextBase64);
  const nonce = sodium.from_base64(nonceBase64);

  // Decrypt and verify authentication tag
  try {
    const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, encryptionKey);
    return sodium.to_string(plaintextBytes);
  } catch {
    throw new Error('Decryption failed: message may be tampered or wrong key');
  }
}

/**
 * Encrypt a message using a pre-shared symmetric key.
 * Used for group encryption where all members share the same key.
 *
 * @param {string} plaintext - Message to encrypt
 * @param {Uint8Array} symmetricKey - 32-byte symmetric key
 * @returns {{ ciphertext: string, nonce: string }} Base64-encoded ciphertext and nonce
 */
export function encryptWithSymmetricKey(plaintext, symmetricKey) {
  const sodium = getSodium();

  // Generate random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);

  // Encrypt
  const plaintextBytes = sodium.from_string(plaintext);
  const ciphertext = sodium.crypto_secretbox_easy(plaintextBytes, nonce, symmetricKey);

  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
  };
}

/**
 * Decrypt a message using a pre-shared symmetric key.
 *
 * @param {string} ciphertextBase64 - Base64-encoded ciphertext
 * @param {string} nonceBase64 - Base64-encoded nonce
 * @param {Uint8Array} symmetricKey - 32-byte symmetric key
 * @returns {string} Decrypted plaintext
 */
export function decryptWithSymmetricKey(ciphertextBase64, nonceBase64, symmetricKey) {
  const sodium = getSodium();

  const ciphertext = sodium.from_base64(ciphertextBase64);
  const nonce = sodium.from_base64(nonceBase64);

  try {
    const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, symmetricKey);
    return sodium.to_string(plaintextBytes);
  } catch {
    throw new Error('Decryption failed: message may be tampered or wrong key');
  }
}
