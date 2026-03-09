// useSpotifySearch hook - Spotify search with debouncing
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { searchSongs } from '@/services/api';
import { SEARCH_DEBOUNCE_MS } from '@/utils/constants';

export function useSpotifySearch(debounceMs = SEARCH_DEBOUNCE_MS) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  const debounceTimerRef = useRef(null);

  // Perform search
  const search = useCallback(
    async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await searchSongs(searchQuery);
        setResults(data || []);
      } catch (err) {
        console.error('[useSpotifySearch] Error:', err);
        // Map sentinel codes to localized messages
        if (err.message === 'SEARCH_FAILED') {
          setError(t('errors.searchFailed'));
        } else {
          setError(t('errors.searchFailed'));
        }
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // Handle query change with debouncing
  const handleQueryChange = useCallback(
    (newQuery) => {
      setQuery(newQuery);
      setSelectedTrack(null);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      if (newQuery && newQuery.length >= 2) {
        debounceTimerRef.current = setTimeout(() => {
          search(newQuery);
        }, debounceMs);
      } else {
        setResults([]);
        setLoading(false);
      }
    },
    [search, debounceMs]
  );

  // Select a track from results
  const selectTrack = useCallback((track) => {
    setSelectedTrack(track);
    setQuery(`${track.song} - ${track.artist}`);
    setResults([]);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedTrack(null);
    setResults([]);
  }, []);

  // Clear everything (query + selection + results)
  const clearAll = useCallback(() => {
    setQuery('');
    setSelectedTrack(null);
    setResults([]);
    setError(null);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    loading,
    error,
    selectedTrack,
    setQuery: handleQueryChange,
    search,
    selectTrack,
    clearSelection,
    clearAll,
  };
}

export default useSpotifySearch;
