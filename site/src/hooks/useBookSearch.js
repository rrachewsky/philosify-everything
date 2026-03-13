// useBookSearch hook - Google Books search with debouncing
// Mirrors useSpotifySearch.js for literature sidebar
import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { searchBooks } from '@/services/api/bookSearch.js';
import { SEARCH_DEBOUNCE_MS } from '@/utils/constants';

export function useBookSearch(debounceMs = SEARCH_DEBOUNCE_MS) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef(null);
  const searchIdRef = useRef(0); // Track latest search to discard stale responses

  // Perform search
  const search = useCallback(
    async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Increment search ID — only the latest search can update state
      const thisSearchId = ++searchIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const data = await searchBooks(searchQuery);
        // Discard if a newer search was triggered while this one was in-flight
        if (thisSearchId !== searchIdRef.current) return;
        setResults(data || []);
      } catch (err) {
        if (thisSearchId !== searchIdRef.current) return;
        console.error('[useBookSearch] Error:', err);
        setError(t('errors.searchFailed'));
        setResults([]);
      } finally {
        if (thisSearchId === searchIdRef.current) {
          setLoading(false);
          setHasSearched(true);
        }
      }
    },
    [t]
  );

  // Handle query change with debouncing
  const handleQueryChange = useCallback(
    (newQuery) => {
      setQuery(newQuery);
      setSelectedBook(null);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Reset search state while typing
      if (newQuery && newQuery.length >= 2) {
        setHasSearched(false);
        debounceTimerRef.current = setTimeout(() => {
          search(newQuery);
        }, debounceMs);
      } else {
        setResults([]);
        setLoading(false);
        setHasSearched(false);
      }
    },
    [search, debounceMs]
  );

  // Select a book from results
  const selectBook = useCallback((book) => {
    setSelectedBook(book);
    setQuery(`${book.title} - ${book.author}`);
    setResults([]);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedBook(null);
    setResults([]);
  }, []);

  // Clear everything (query + selection + results)
  const clearAll = useCallback(() => {
    setQuery('');
    setSelectedBook(null);
    setResults([]);
    setError(null);
    setHasSearched(false);
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
    selectedBook,
    hasSearched,
    setQuery: handleQueryChange,
    search,
    selectBook,
    clearSelection,
    clearAll,
  };
}

export default useBookSearch;
