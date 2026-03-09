// ============================================================
// useAnalysisHistory hook
// ============================================================
// Fetches user's analysis history via backend API.
// Uses HttpOnly cookies - no token handling in JavaScript.

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { logger } from '@/utils';

export function useAnalysisHistory(user) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/analysis-history`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setItems([]);
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch history');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      const normalized = (data.items || []).map((item) => ({
        ...item,
        requestedAt: item.requestedAt ? new Date(item.requestedAt) : null,
      }));

      setItems(normalized);
      logger.log('[useAnalysisHistory] Loaded items:', normalized.length);
    } catch (err) {
      logger.error('[useAnalysisHistory] Failed:', err);
      setError(t('account.loadError', { defaultValue: 'Failed to load history' }));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { items, loading, error, refresh: fetchHistory };
}

export default useAnalysisHistory;
