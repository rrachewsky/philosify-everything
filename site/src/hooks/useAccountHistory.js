// ============================================================
// useAccountHistory hook
// ============================================================
// Unified history (analyses + credit transactions) via backend API.
// Uses HttpOnly cookies - no token handling in JavaScript.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { logger } from '@/utils';

// Only show credit additions/adjustments — consumption entries are already
// represented by the unified history items (analyses, panels, debates, etc.)
function isDisplayableCreditType(type) {
  if (!type) return false;
  const displayTypes = ['purchase', 'signup_bonus', 'promo', 'refund'];
  return displayTypes.includes(type);
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
              kind: a.kind, // 'analysis', 'panel', 'debate', 'unsafe-zone', 'quiz'
              mediaType: a.mediaType,
              id: a.id,
              analysisId: a.id,
              date: a.date ? new Date(a.date) : null,
              title: a.title,
              artist: a.artist,
              content: a.content,
              philosophers: a.philosophers,
              threadType: a.threadType,
              accessType: a.accessType,
              turns: a.turns,
              status: a.status,
              credits: a.credits,
              // Quiz-specific fields
              score: a.score,
              totalCorrect: a.totalCorrect,
              totalQuestions: a.totalQuestions,
              maxStreak: a.maxStreak,
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

  // Auto-refresh when credits change
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
    (item, allItems) => {
      // Unsafe Zone sessions
      if (item.kind === 'unsafe-zone') {
        const turns = item.turns || 0;
        const credits = item.credits || 10;
        const preview = item.title || 'Unsafe Zone Talks';
        return `\u{1F9E0} ${preview} (${turns} turns, ${credits} credits)`;
      }

      // Quiz sessions
      if (item.kind === 'quiz') {
        const score = item.score || 0;
        const correct = item.totalCorrect || 0;
        const total = item.totalQuestions || 0;
        const streak = item.maxStreak || 0;
        const status = item.status === 'completed' ? '\u{2705}' : item.status === 'failed' ? '\u{274C}' : '\u{23F3}';
        return `\u{1F9E0} ${status} Quiz — Score: ${score} (${correct}/${total} correct, ${streak}\u{1F525} streak)`;
      }

      // Analyses, panels, debates
      if (item.kind === 'analysis' || item.kind === 'panel' || item.kind === 'debate') {
        const icons = {
          music: '\u{1F3B5}',
          literature: '\u{1F4DA}',
          news: '\u{1F4F0}',
          ideas: '\u{1F4AC}',
        };
        const icon = icons[item.mediaType] || '\u{2728}';
        const title = item.title || t('account.notAvailable', { defaultValue: 'Not available' });
        const artist = item.artist ? ` - ${item.artist}` : '';

        let label = '';
        if (item.kind === 'panel') {
          label = ' [Panel]';
        } else if (item.kind === 'debate') {
          label = item.threadType === 'user_proposed' ? ' [Colloquium]' : ' [Debate]';
          const philosophers = item.artist ? ` - ${item.artist}` : '';
          const context = item.content ? `\n${item.content.slice(0, 100)}${item.content.length > 100 ? '...' : ''}` : '';
          return `${icon} ${title}${philosophers}${label}${context}`;
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
          if (allItems && item.date) {
            const t0 = item.date.getTime();
            const match = allItems.find((other) => {
              if (other.kind !== 'panel' && other.kind !== 'analysis') return false;
              if (!other.date) return false;
              return Math.abs(other.date.getTime() - t0) < 30000;
            });
            if (match) {
              const label = match.kind === 'panel' ? 'Panel' : 'Analysis';
              return `${label}: ${(match.title || '').substring(0, 50)} (${count} ${count === 1 ? 'credit' : 'credits'})`;
            }
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
