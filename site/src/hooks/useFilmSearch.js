// useFilmSearch — search TMDB for films with debounce
// Mirrors useBookSearch.js pattern

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFilms } from '../services/api/filmSearch.js';

const SEARCH_DEBOUNCE_MS = 400;

export function useFilmSearch() {
  const { i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchIdRef = useRef(0);
  const debounceRef = useRef(null);

  const search = useCallback(
    async (q) => {
      const trimmed = (q || '').trim();
      if (trimmed.length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      const thisSearchId = ++searchIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const lang = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
        const options = await searchFilms(trimmed, lang);

        if (thisSearchId !== searchIdRef.current) return; // stale

        setResults(options);
        setHasSearched(true);
      } catch (err) {
        if (thisSearchId !== searchIdRef.current) return;
        setError(err.message);
        setResults([]);
      } finally {
        if (thisSearchId === searchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [i18n.resolvedLanguage, i18n.language],
  );

  // Debounced search on query change
  useEffect(() => {
    if (selectedFilm) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => search(query), SEARCH_DEBOUNCE_MS);
    } else {
      setResults([]);
      setHasSearched(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search, selectedFilm]);

  const selectFilm = useCallback((film) => {
    setSelectedFilm(film);
    setResults([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFilm(null);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFilm(null);
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
    searchIdRef.current++;
  }, []);

  return {
    query,
    results,
    loading,
    error,
    selectedFilm,
    hasSearched,
    setQuery,
    search,
    selectFilm,
    clearSelection,
    clearAll,
  };
}
