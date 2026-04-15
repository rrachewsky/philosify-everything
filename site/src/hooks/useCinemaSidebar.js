// useCinemaSidebar — sidebar state + philosopher panel for Cinema
// Same pattern as useLiteratureSidebar but with TMDB films
// Only Philosopher's Panel analysis (3 credits), no 1-credit standalone analysis

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilmSearch } from './useFilmSearch.js';
import { useAuth } from './useAuth.js';
import { config } from '@/config';
import { waitForMinimumAnalysisWindow } from '@/utils/analysisDelay.js';
import { requestPhilosopherPanel } from '../services/api/philosopherPanel.js';
import { getPendingAction, clearPendingAction } from '../utils/pendingAction.js';
import { authService } from '@/services/auth';

export function useCinemaSidebar() {
  const { i18n } = useTranslation();
  const filmSearch = useFilmSearch();
  const { user, sessionBalance: balance, refreshBalance } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState(null);

  // Analysis state (1-credit full analysis)
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Panel state (3-credit philosopher panel)
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState(null);
  const [panelError, setPanelError] = useState(null);

  // Timers (separate for analysis and panel)
  const [elapsedTime, setElapsedTime] = useState(0);
  const [panelElapsed, setPanelElapsed] = useState(0);
  const timerRef = useRef(null);
  const panelTimerRef = useRef(null);
  const abortRef = useRef(null);
  const activeAnalysisRunRef = useRef(0);
  const adDurationRef = useRef(null);
  const [currentAdMediaType, setCurrentAdMediaType] = useState(null);

  const handleAdLoaded = useCallback(({ duration, mediaType }) => {
    adDurationRef.current = duration;
    if (mediaType) setCurrentAdMediaType(mediaType);
  }, []);

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
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  }, []);

  // Open sidebar (fresh)
  const open = useCallback(() => {
    filmSearch.clearAll();
    setSelectedFilm(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    setPanelLoading(false);
    setPanelResult(null);
    setPanelError(null);
    setElapsedTime(0);
    setPanelElapsed(0);
    setIsOpen(true);
  }, [filmSearch]);

  // Close sidebar
  const close = useCallback(() => {
    activeAnalysisRunRef.current += 1;
    if (abortRef.current) abortRef.current.abort();
    stopTimer();
    if (panelTimerRef.current) {
      clearInterval(panelTimerRef.current);
      panelTimerRef.current = null;
    }
    setIsOpen(false);
    window.dispatchEvent(new Event('stopAllAudio'));
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
    activeAnalysisRunRef.current += 1;
    setSelectedFilm(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setPanelResult(null);
    setPanelError(null);
    filmSearch.clearSelection();
  }, [filmSearch]);

  // Open with pre-populated result (from history)
  const openWithResult = useCallback((analysisData) => {
    filmSearch.clearAll();
    const film = {
      title: analysisData.title,
      director: analysisData.artist || analysisData.director,
      tmdb_id: analysisData.tmdb_id,
      poster_url: analysisData.poster_url || analysisData.cover_url,
    };
    setSelectedFilm(film);
    setAnalysisResult(analysisData);
    setAnalysisError(null);
    setPanelResult(null);
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

  // Full philosophical analysis (1 credit)
  const analyze = useCallback(
    async (lang, model = 'grok') => {
      if (!selectedFilm) return;
      const runId = activeAnalysisRunRef.current + 1;
      activeAnalysisRunRef.current = runId;
      const startedAt = Date.now();

      setIsAnalyzing(true);
      setAnalysisError(null);
      startTimer();

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        let response = await fetch(`${config.apiUrl}/api/cinema-analyze`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: selectedFilm.title,
            original_title: selectedFilm.original_title || null, // Prevent AI title hallucination
            director: selectedFilm.director || '',
            tmdb_id: selectedFilm.tmdb_id,
            overview: selectedFilm.overview || '',
            genres: selectedFilm.genres || [],
            countries: selectedFilm.countries || [],
            year: selectedFilm.year,
            poster_url: selectedFilm.poster_url,
            model,
            lang: lang || i18n.resolvedLanguage || i18n.language || 'en',
          }),
          signal: controller.signal,
        });

        // Handle 401 - token expired, trigger refresh and retry once
        if (response.status === 401) {
          console.log('[CinemaAnalyze] Token expired, refreshing session...');
          try {
            await authService.getSession(); // Triggers backend auto-refresh
            console.log('[CinemaAnalyze] Session refreshed, retrying request...');
            await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay
            
            // Retry the request
            response = await fetch(`${config.apiUrl}/api/cinema-analyze`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: selectedFilm.title,
                original_title: selectedFilm.original_title || null,
                director: selectedFilm.director || '',
                tmdb_id: selectedFilm.tmdb_id,
                overview: selectedFilm.overview || '',
                genres: selectedFilm.genres || [],
                countries: selectedFilm.countries || [],
                year: selectedFilm.year,
                poster_url: selectedFilm.poster_url,
                model,
                lang: lang || i18n.resolvedLanguage || i18n.language || 'en',
              }),
              signal: controller.signal,
            });

            if (response.status === 401) {
              throw new Error('Session expired — please sign out and sign back in.');
            }
          } catch (refreshError) {
            console.error('[CinemaAnalyze] Session refresh failed:', refreshError);
            throw new Error('Session expired — please sign out and sign back in.');
          }
        }

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 402) {
            throw Object.assign(new Error(data.error || 'Insufficient credits'), {
              code: 'INSUFFICIENT_CREDITS',
            });
          }
          throw new Error(data.error || `Analysis failed: ${response.status}`);
        }

        if (controller.signal.aborted) return;

        await waitForMinimumAnalysisWindow(startedAt, adDurationRef.current);

        if (controller.signal.aborted || activeAnalysisRunRef.current !== runId) {
          return;
        }

        setAnalysisResult(data);
      } catch (err) {
        if (!controller.signal.aborted && activeAnalysisRunRef.current === runId) {
          setAnalysisError(err.message || 'Analysis failed');
          if (err.code === 'INSUFFICIENT_CREDITS') throw err;
        }
      } finally {
        if (activeAnalysisRunRef.current === runId) {
          stopTimer();
          setIsAnalyzing(false);
        }
      }
    },
    [selectedFilm, startTimer, stopTimer, i18n],
  );

  // Analyze with Philosopher's Panel (3 credits)
  const analyzeWithPanel = useCallback(
    async (philosophers, lang) => {
      if (!selectedFilm) return;

      // Clear any existing regular analysis before starting panel
      setAnalysisResult(null);
      setAnalysisError(null);
      setPanelLoading(true);
      setPanelError(null);
      setPanelElapsed(0);
      if (panelTimerRef.current) clearInterval(panelTimerRef.current);
      const startTime = Date.now();
      panelTimerRef.current = setInterval(() => setPanelElapsed(Date.now() - startTime), 100);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await requestPhilosopherPanel({
          mediaType: 'cinema',
          title: selectedFilm.title,
          artist: selectedFilm.director || '',
          description: selectedFilm.overview || '',
          categories: (selectedFilm.genres || []).join(', '),
          philosophers,
          lang: lang || i18n.resolvedLanguage || i18n.language || 'en',
        });

        if (controller.signal.aborted) return;

        setPanelResult(result.panel);
        if (refreshBalance) refreshBalance();
      } catch (err) {
        if (!controller.signal.aborted) {
          setPanelError(err.message || 'Analysis failed');
          if (err.code === 'INSUFFICIENT_CREDITS') throw err;
        }
      } finally {
        if (panelTimerRef.current) {
          clearInterval(panelTimerRef.current);
          panelTimerRef.current = null;
        }
        setPanelLoading(false);
      }
    },
    [selectedFilm, i18n, refreshBalance],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (panelTimerRef.current) clearInterval(panelTimerRef.current);
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

    // Analysis (1 credit)
    isAnalyzing,
    analysisResult,
    analysisError,
    analyze,
    cancelAnalysis: () => {
      if (abortRef.current) abortRef.current.abort();
      setIsAnalyzing(false);
      stopTimer();
    },

    // Panel
    panelLoading,
    panelResult,
    panelError,
    analyzeWithPanel,

    // Timer
    elapsedTime,
    panelElapsed,
    formatTime,

    // Auth
    user,
    balance,

    // Ads
    handleAdLoaded,
    currentAdMediaType,
  };
}
