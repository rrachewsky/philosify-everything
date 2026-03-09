// ============================================================
// useTransactions hook
// ============================================================
// Fetches credit transaction history via backend API.
// Uses HttpOnly cookies - no token handling in JavaScript.

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { logger } from '@/utils';

export function useTransactions(user) {
  const { t } = useTranslation();
  const [rawTransactions, setRawTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setRawTransactions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.log('[useTransactions] Fetching transactions');

      const response = await fetch(`${config.apiUrl}/api/transactions`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setRawTransactions([]);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch transactions');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      const transactions = data.transactions || [];
      logger.log('[useTransactions] Fetched', transactions.length, 'transactions');

      setRawTransactions(transactions);
    } catch (err) {
      logger.error('[useTransactions] Error:', err);
      setError(t('account.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  const formatDescription = useCallback(
    (tx) => {
      switch (tx.type) {
        case 'purchase':
          return t('transactions.purchase', { count: Math.abs(tx.amount) });
        case 'analysis':
        case 'consume': {
          if (tx.analysis) {
            const { title, artist } = tx.analysis;
            if (title) {
              const songDisplay = artist ? `"${title}" by ${artist}` : `"${title}"`;
              return t('transactions.analysis', { song: songDisplay });
            }
          }
          return t('transactions.analysisGeneric');
        }
        case 'signup_bonus':
          return t('transactions.signupBonus');
        case 'refund':
          return t('transactions.refund', { count: Math.abs(tx.amount) });
        case 'promo':
          return t('transactions.promo', { count: tx.amount });
        default:
          return tx.type || t('transactions.default');
      }
    },
    [t]
  );

  const transactions = useMemo(() => {
    return rawTransactions.map((tx) => {
      const analysisId = tx.analysis_id || tx.analysis?.id || null;

      return {
        id: tx.id,
        date: new Date(tx.created_at),
        type: tx.type,
        amount: tx.amount,
        description: formatDescription(tx),
        analysisId: analysisId,
        receiptUrl: null,
      };
    });
  }, [rawTransactions, formatDescription]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setRawTransactions([]);
    }
  }, [user, fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

export default useTransactions;
