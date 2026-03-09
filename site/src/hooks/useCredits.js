// useCredits hook - Credit balance management
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getBalance } from '@/services/api';
import { purchaseCredits } from '@/services/stripe';
import { logger } from '@/utils';

export function useCredits(user, initialBalance = null) {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0); // Debounce fetch calls
  const balanceRef = useRef(initialBalance); // Stable ref for debounce return

  // Stable user ID reference
  const userId = user?.id;

  // Set balance from session when it arrives (initial load)
  useEffect(() => {
    if (initialBalance && !balance) {
      logger.log('[useCredits] Setting initial balance from session:', initialBalance);
      setBalance(initialBalance);
      balanceRef.current = initialBalance;
      lastFetchRef.current = Date.now(); // Prevent immediate re-fetch
    }
  }, [initialBalance, balance]);

  // Fetch balance (debounced - min 2 seconds between calls, unless forced)
  const fetchBalance = useCallback(
    async (force = false) => {
      if (!userId) {
        setBalance(null);
        balanceRef.current = null;
        return;
      }

      // Debounce: Skip if last fetch was less than 2 seconds ago (unless forced)
      const now = Date.now();
      if (!force && now - lastFetchRef.current < 2000) {
        logger.log('[useCredits] Skipping fetch - debounced');
        return balanceRef.current;
      }
      lastFetchRef.current = now;

      setLoading(true);
      setError(null);

      try {
        const data = await getBalance();
        setBalance(data);
        balanceRef.current = data; // Keep ref in sync
        return data;
      } catch (err) {
        logger.error('[useCredits] Error fetching balance:', err);
        // Map sentinel codes to localized messages
        if (err.message === 'BALANCE_FETCH_ERROR' || err.message === 'BALANCE_FORMAT_ERROR') {
          setError(t('errors.balanceFailed'));
        } else if (err.message === 'UNAUTHORIZED') {
          setError(t('errors.signInRequired'));
        } else {
          setError(t('errors.balanceFailed'));
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [userId, t]
  ); // Removed 'balance' - using ref for stable debounce return

  // Fetch balance when user ID changes (only if we don't have it from session)
  useEffect(() => {
    if (userId) {
      // Skip fetch if we already have balance (from session or previous fetch)
      if (!balance && !balanceRef.current) {
        fetchBalance();
      }
    } else {
      setBalance(null);
      balanceRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Intentionally only depend on userId

  // Listen for credit changes and refresh balance (forced, bypass debounce)
  useEffect(() => {
    const handleCreditsChanged = () => {
      fetchBalance(true); // Force refresh after credit change
    };

    window.addEventListener('credits-changed', handleCreditsChanged);
    return () => window.removeEventListener('credits-changed', handleCreditsChanged);
  }, [fetchBalance]);

  // Purchase credits
  const purchase = useCallback(
    async (amount) => {
      if (!user) {
        const msg = t('errors.signInRequired');
        setError(msg);
        return { success: false, error: msg };
      }

      setLoading(true);
      setError(null);

      try {
        await purchaseCredits(amount);
        // Note: redirect happens inside purchaseCredits
        return { success: true };
      } catch (err) {
        logger.error('[useCredits] Error purchasing credits:', err);
        // Map sentinel codes to localized messages
        let msg;
        if (
          err.message === 'CHECKOUT_PACKAGE_ERROR' ||
          err.message === 'CHECKOUT_CREATE_FAILED' ||
          err.message === 'CHECKOUT_URL_MISSING'
        ) {
          msg = t('errors.checkoutFailed');
        } else if (err.message === 'UNAUTHORIZED') {
          msg = t('errors.signInRequired');
        } else {
          msg = t('errors.checkoutFailed');
        }
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [user, t]
  );

  // Check if user has sufficient credits
  const hasSufficientCredits = useCallback(() => {
    if (!balance) return false;
    return balance.total > 0;
  }, [balance]);

  // Get formatted balance info
  const getBalanceInfo = useCallback(() => {
    if (!balance) return { credits: 0, free: 0, total: 0 };

    return {
      credits: balance.credits || 0,
      free: balance.freeRemaining || 0,
      total: balance.total || 0,
    };
  }, [balance]);

  // Directly set balance (for use after verifyPayment)
  const setBalanceDirectly = useCallback((newBalance) => {
    logger.log('[useCredits] Setting balance directly:', newBalance);
    setBalance(newBalance);
    balanceRef.current = newBalance;
    lastFetchRef.current = Date.now(); // Update timestamp to prevent stale fetch
  }, []);

  return {
    balance,
    loading,
    error,
    fetchBalance,
    setBalance: setBalanceDirectly,
    purchaseCredits: purchase,
    hasSufficientCredits,
    getBalanceInfo,
  };
}

export default useCredits;
