// ============================================================
// useHistoryGraph - Data fetching hook for History Graph
// ============================================================

import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.philosify.org';

export function useHistoryGraph() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchGraph() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/history/graph`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setGraphData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useHistoryGraph] Fetch error:', err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchGraph();

    return () => {
      cancelled = true;
    };
  }, []);

  return { graphData, loading, error };
}

export default useHistoryGraph;
