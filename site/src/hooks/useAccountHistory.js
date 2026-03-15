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
      // Unified history — one call for all types
      try {
        const historyRes = await fetch(`${config.apiUrl}/api/user-history`, {
          method: 'GET',
          credentials: 'include',
        });

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.success && Array.isArray(historyData.items)) {
            const items = historyData.items.map((a) => ({
              kind: a.kind, // 'analysis', 'panel', 'debate'
              mediaType: a.mediaType,
              id: a.id,
              analysisId: a.id,
              date: a.date ? new Date(a.date) : null,
              title: a.title,
              artist: a.artist,
              philosophers: a.philosophers,
              threadType: a.threadType,
              accessType: a.accessType,
            }));
            setAnalysisItems(items);
            logger.log('[useAccountHistory] Loaded', items.length, 'history items');
          } else {
            setAnalysisItems([]);
          }
        } else {
          setAnalysisItems([]);
        }
      } catch (e) {
        logger.error('[useAccountHistory] Unified history failed:', e);
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
      // Analyses, panels, debates
      if (item.kind === 'analysis' || item.kind === 'panel' || item.kind === 'debate') {
        const icons = {
          music: '\u{1F3B5}',        // musical note
          literature: '\u{1F4DA}',   // books
          news: '\u{1F4F0}',         // newspaper
          ideas: '\u{1F4AC}',        // speech bubble
        };
        const icon = icons[item.mediaType] || '\u{2728}';
        const title = item.title || t('account.notAvailable', { defaultValue: 'Not available' });
        const artist = item.artist ? ` - ${item.artist}` : '';

        let label = '';
        if (item.kind === 'panel') {
          label = ' [Panel]';
        } else if (item.kind === 'debate') {
          label = item.threadType === 'user_proposed' ? ' [Colloquium]' : ' [Debate]';
        }

        return `${icon} ${title}${artist}${label}`;
      }

      // Credit transactions
      const count = Math.abs(item.amount || 0);
      switch (item.type) {
        case 'purchase':
          return t('transactions.purchase', { count });
        case 'consume':
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
