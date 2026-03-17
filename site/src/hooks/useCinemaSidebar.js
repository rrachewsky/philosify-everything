// useCinemaSidebar — sidebar state + philosopher panel for Cinema
// Same pattern as useLiteratureSidebar but with TMDB films
// Only Philosopher's Panel analysis (3 credits), no 1-credit standalone analysis

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilmSearch } from './useFilmSearch.js';
import { useAuth } from './useAuth.js';
import { requestPhilosopherPanel } from '../services/api/philosopherPanel.js';
import { getPendingAction, clearPendingAction } from '../utils/pendingAction.js';

export function useCinemaSidebar() {
  const { i18n } = useTranslation();
  const filmSearch = useFilmSearch();
  const { user, sessionBalance: balance, refreshBalance } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);

  // Panel state
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState(null);
  const [panelError, setPanelError] = useState(null);

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  const startTimer = useCallback(() => {
    setElapsedTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    const start = Date.now();
    timerRef.current = setInterval(() => setElapsedTime(Date.now() - start), 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const formatTime = useCallback((ms) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  }, []);

  // Open sidebar (fresh)
  const open = useCallback(() => {
    filmSearch.clearAll();
    setSelectedFilm(null);
    setPanelLoading(false);
    setPanelResult(null);
    setPanelError(null);
    setElapsedTime(0);
    setIsOpen(true);
  }, [filmSearch]);

  // Close sidebar
  const close = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    stopTimer();
    setIsOpen(false);
  }, [stopTimer]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  // Select film from search
  const selectFilm = useCallback((film) => {
    setSelectedFilm(film);
    filmSearch.selectFilm(film);
  }, [filmSearch]);

  // Clear selection
  const clearFilm = useCallback(() => {
    setSelectedFilm(null);
    setPanelResult(null);
    setPanelError(null);
    filmSearch.clearSelection();
  }, [filmSearch]);

  // Open with pre-populated result (from history)
  const openWithResult = useCallback((analysisData) => {
    filmSearch.clearAll();
    const film = {
      title: analysisData.title,
      director: analysisData.artist,
      tmdb_id: analysisData.tmdb_id,
      poster_url: analysisData.poster_url || analysisData.cover_url,
    };
    setSelectedFilm(film);
    setPanelResult(analysisData);
    setPanelError(null);
    setPanelLoading(false);
    setIsOpen(true);
  }, [filmSearch]);

  // Open with pending action (after payment return)
  const openWithPendingAction = useCallback(() => {
    const action = getPendingAction();
    if (action?.type === 'film-panel' && action.film) {
      setSelectedFilm(action.film);
      clearPendingAction();
      setIsOpen(true);
    }
  }, []);

  // Analyze with Philosopher's Panel
  const analyzeWithPanel = useCallback(
    async (philosophers, lang) => {
      if (!selectedFilm) return;

      setPanelLoading(true);
      setPanelError(null);
      startTimer();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await requestPhilosopherPanel({
          mediaType: 'films',
          title: selectedFilm.title,
          artist: selectedFilm.director || '',
          description: selectedFilm.overview || '',
          categories: (selectedFilm.genres || []).join(', '),
          philosophers,
          lang: lang || i18n.resolvedLanguage || i18n.language || 'en',
        });

        if (controller.signal.aborted) return;

        setPanelResult(result);
        if (refreshBalance) refreshBalance();
      } catch (err) {
        if (!controller.signal.aborted) {
          setPanelError(err.message || 'Analysis failed');
          if (err.code === 'INSUFFICIENT_CREDITS') throw err;
        }
      } finally {
        stopTimer();
        setPanelLoading(false);
      }
    },
    [selectedFilm, startTimer, stopTimer, i18n, refreshBalance],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    // Sidebar
    isOpen,
    open,
    close,
    toggle,
    openWithResult,
    openWithPendingAction,

    // Search (proxied)
    query: filmSearch.query,
    setQuery: filmSearch.setQuery,
    results: filmSearch.results,
    searchLoading: filmSearch.loading,
    hasSearched: filmSearch.hasSearched,
    searchError: filmSearch.error,

    // Selection
    selectedFilm,
    selectFilm,
    clearFilm,

    // Panel
    panelLoading,
    panelResult,
    panelError,
    analyzeWithPanel,

    // Timer
    elapsedTime,
    formatTime,

    // Auth
    user,
    balance,
  };
}
