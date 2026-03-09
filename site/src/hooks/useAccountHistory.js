// ============================================================
// useAccountHistory hook
// ============================================================
// Unified history (analyses + credit transactions) via backend API.
// Uses HttpOnly cookies - no token handling in JavaScript.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { logger } from '@/utils';

function isDisplayableCreditType(type) {
  if (!type) return false;
  // Show all credit event types including 'consume' (colloquium, spaces, etc.)
  return true;
}

export function useAccountHistory(user) {
  const { t } = useTranslation();
  const [analysisItems, setAnalysisItems] = useState([]);
  const [creditItems, setCreditItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setAnalysisItems([]);
      setCreditItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch analyses
      try {
        const analysisRes = await fetch(`${config.apiUrl}/api/analysis-history`, {
          method: 'GET',
          credentials: 'include',
        });

        if (analysisRes.ok) {
          const analysisData = await analysisRes.json();
          if (analysisData.success && Array.isArray(analysisData.items)) {
            const normalizedAnalyses = analysisData.items.map((a) => ({
              kind: 'analysis',
              id: a.analysisId,
              analysisId: a.analysisId,
              date: a.requestedAt ? new Date(a.requestedAt) : null,
              title: a.title,
              artist: a.artist,
              spotifyId: a.spotifyId,
            }));
            setAnalysisItems(normalizedAnalyses);
            logger.log('[useAccountHistory] Loaded', normalizedAnalyses.length, 'analysis items');
          } else {
            setAnalysisItems([]);
          }
        } else {
          setAnalysisItems([]);
        }
      } catch (e) {
        logger.error('[useAccountHistory] Analysis history failed:', e);
        setAnalysisItems([]);
      }

      // Fetch credits
      let creditRows = [];
      try {
        const creditRes = await fetch(`${config.apiUrl}/api/history`, {
          method: 'GET',
          credentials: 'include',
        });

        if (creditRes.ok) {
          const payload = await creditRes.json();
          if (payload.success && Array.isArray(payload.credits)) {
            creditRows = payload.credits;
          }
        }
      } catch (e) {
        logger.warn('[useAccountHistory] /api/history exception:', e);
      }

      const normalizedCredits = (creditRows || [])
        .filter((c) => isDisplayableCreditType(c.type))
        .map((c) => ({
          kind: 'credit',
          id: c.id,
          date: c.created_at ? new Date(c.created_at) : null,
          type: c.type,
          amount: typeof c.amount === 'number' ? c.amount : Number(c.amount || 0),
          metadata: c.metadata || null,
        }));

      setCreditItems(normalizedCredits);
      logger.log('[useAccountHistory] Loaded', normalizedCredits.length, 'credit events');
    } catch (err) {
      logger.error('[useAccountHistory] Failed:', err);
      setError(t('account.loadError', { defaultValue: 'Failed to load history' }));
      setAnalysisItems([]);
      setCreditItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Auto-refresh when credits change (e.g. after colloquium access, add philosopher, etc.)
  useEffect(() => {
    const handleCreditsChanged = () => {
      logger.log('[useAccountHistory] credits-changed event — refreshing history');
      fetchAll();
    };

    window.addEventListener('credits-changed', handleCreditsChanged);
    return () => window.removeEventListener('credits-changed', handleCreditsChanged);
  }, [fetchAll]);

  const items = useMemo(() => {
    const merged = [...analysisItems, ...creditItems];
    merged.sort((a, b) => (b.date?.getTime?.() || 0) - (a.date?.getTime?.() || 0));
    return merged;
  }, [analysisItems, creditItems]);

  const formatDescription = useCallback(
    (item) => {
      if (item.kind === 'analysis') {
        const title = item.title || t('account.notAvailable', { defaultValue: 'Not available' });
        const artist = item.artist ? ` - ${item.artist}` : '';
        return `${title}${artist}`;
      }

      const count = Math.abs(item.amount || 0);
      switch (item.type) {
        case 'purchase':
          return t('transactions.purchase', { count });
        case 'consume':
          // Use the description stored in metadata by confirmCreditUsage()
          if (item.metadata?.description) {
            return `${item.metadata.description} (${count} ${count === 1 ? 'credit' : 'credits'})`;
          }
          return t('transactions.consume', {
            count,
            defaultValue: `Used ${count} ${count === 1 ? 'credit' : 'credits'}`,
          });
        case 'refund':
          return t('transactions.refund', { count });
        case 'signup_bonus':
          return t('transactions.signupBonus');
        case 'promo':
          return t('transactions.promo', { count });
        default:
          return t('transactions.default');
      }
    },
    [t]
  );

  return { items, loading, error, refresh: fetchAll, formatDescription };
}

export default useAccountHistory;
