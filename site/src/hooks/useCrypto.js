// ============================================================
// useCrypto Hook - E2E Encryption State Management
// ============================================================
// Manages crypto initialization and key setup for the current user.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { logger } from '@/utils';
import * as cryptoService from '@/services/crypto';

/**
 * Hook to manage E2E encryption for the current user.
 * Automatically initializes crypto and ensures keys when user is authenticated.
 */
export function useCrypto() {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [publicKey, setPublicKey] = useState(null);

  // Initialize crypto when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsInitialized(false);
      setPublicKey(null);
      return;
    }

    let mounted = true;

    const initCrypto = async () => {
      if (isInitializing) return;

      setIsInitializing(true);
      setError(null);

      try {
        logger.log('[useCrypto] Initializing E2E encryption...');
        const key = await cryptoService.ensureUserKeys();

        if (mounted) {
          setPublicKey(key);
          setIsInitialized(true);
          logger.log('[useCrypto] E2E encryption ready');
        }
      } catch (err) {
        logger.error('[useCrypto] Initialization failed:', err);
        if (mounted) {
          setError(err.message);
          // Still mark as initialized so app can function (without encryption)
          setIsInitialized(true);
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initCrypto();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isInitializing is set inside this effect; adding it would cause infinite loops
  }, [isAuthenticated, user?.id]);

  // Clear caches on logout
  useEffect(() => {
    if (!isAuthenticated) {
      cryptoService.clearAllCaches();
    }
  }, [isAuthenticated]);

  // Retry initialization
  const retry = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsInitializing(true);
    setError(null);

    try {
      const key = await cryptoService.ensureUserKeys();
      setPublicKey(key);
      setIsInitialized(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsInitializing(false);
    }
  }, [isAuthenticated]);

  return {
    isInitialized,
    isInitializing,
    error,
    publicKey,
    retry,
    // Expose crypto operations
    encryptDM: cryptoService.encryptDM,
    decryptDM: cryptoService.decryptDM,
    encryptCollective: cryptoService.encryptCollectiveMessage,
    decryptCollective: cryptoService.decryptCollectiveMessage,
    encryptUnderground: cryptoService.encryptUndergroundPost,
    decryptUnderground: cryptoService.decryptUndergroundPost,
  };
}

export default useCrypto;
