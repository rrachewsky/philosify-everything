// ============================================================
// CRYPTO - E2E Encryption Module
// ============================================================
// Provides end-to-end encryption for private communications.
// Uses libsodium (X25519 + XChaCha20-Poly1305) for industry-standard security.
//
// Security guarantees:
// - Zero-knowledge: Server cannot read messages
// - Forward secrecy: Compromised key doesn't expose past messages
// - Authenticated encryption: Tampered messages are rejected
// - Private keys never leave the browser

export { initCrypto, isReady } from './init.js';
export {
  generateKeyPair,
  getStoredKeyPair,
  storeKeyPair,
  clearKeyPair,
  hasKeyPair,
  getPublicKeyBase64,
} from './keys.js';
export { encryptMessage, decryptMessage, deriveSharedSecret } from './encryption.js';
export {
  encryptForGroup,
  decryptFromGroup,
  generateGroupKey,
  encryptGroupKeyForMember,
  decryptGroupKey,
  cacheGroupKey,
  getCachedGroupKey,
  clearGroupKeyCache,
} from './group.js';
