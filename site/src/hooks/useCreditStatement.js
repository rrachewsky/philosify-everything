// ============================================================
// useCreditStatement hook
// ============================================================
// The user's credit statement: GET /api/credits/history, paginated by a
// composite cursor (before + before_id) the worker hands back as `next`.
// One source (credit_history); items arrive with origin, batches already
// grouped and the running balance computed server-side — the list is a map.
// Uses HttpOnly cookies — no token handling in JavaScript.

import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/config';
import { logger } from '@/utils';
import { authService } from '@/services/auth';

const PAGE_SIZE = 30;

async function fetchStatement(cursor, retried = false) {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) {
    params.set('before', cursor.before);
    params.set('before_id', cursor.before_id);
  }
  const res = await fetch(`${config.apiUrl}/api/credits/history?${params}`, {
    method: 'GET',
    credentials: 'include',
  });
  // 401 — token expired: let the backend refresh the session once, then retry
  if (res.status === 401 && !retried) {
    await authService.getSession();
    await new Promise((resolve) => setTimeout(resolve, 500));
    return fetchStatement(cursor, true);
  }
  if (!res.ok) throw new Error(`statement ${res.status}`);
  const data = await res.json();
  if (!data.success || !Array.isArray(data.items)) throw new Error('statement payload');
  return data;
}

export function useCreditStatement(user, { enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(null);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false); // first page settled (ok or error)
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestSeq = useRef(0);

  const loadFirst = useCallback(async () => {
    if (!user || !enabled) {
      setItems([]);
      setBalance(null);
      setNext(null);
      setLoaded(false);
      return;
    }
    const seq = (requestSeq.current += 1);
    setLoading(true);
    setError(false);
    try {
      const data = await fetchStatement(null);
      if (seq !== requestSeq.current) return; // a newer load superseded this one
      setItems(data.items);
      setBalance(data.balance);
      setNext(data.next);
      logger.log('[useCreditStatement] Loaded', data.items.length, 'items');
    } catch (err) {
      if (seq !== requestSeq.current) return;
      logger.error('[useCreditStatement] Failed:', err);
      setError(true);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setLoaded(true);
      }
    }
  }, [user, enabled]);

  const loadMore = useCallback(async () => {
    if (!next || loadingMore) return;
    const seq = requestSeq.current;
    setLoadingMore(true);
    try {
      const data = await fetchStatement(next);
      if (seq !== requestSeq.current) return; // list was refreshed meanwhile
      setItems((prev) => prev.concat(data.items));
      setNext(data.next);
    } catch (err) {
      logger.error('[useCreditStatement] loadMore failed:', err);
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [next, loadingMore]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  // Any credit movement elsewhere in the app restarts the statement from page 1
  useEffect(() => {
    if (!enabled) return undefined;
    const onChange = () => loadFirst();
    window.addEventListener('credits-changed', onChange);
    return () => window.removeEventListener('credits-changed', onChange);
  }, [loadFirst, enabled]);

  return {
    items,
    balance,
    hasMore: next != null,
    loading,
    loaded,
    loadingMore,
    error,
    loadMore,
    refresh: loadFirst,
  };
}

export default useCreditStatement;
