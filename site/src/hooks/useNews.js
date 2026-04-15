// useNews - State management for the News module
// Search-based paradigm + breaking news ticker
// Handles article search, selection, analysis, and philosopher panel

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { searchNews, fetchBreakingNews } from '../services/api/newsApi.js';
import { requestPhilosopherPanel } from '../services/api/philosopherPanel.js';
import { getPendingAction, clearPendingAction } from '../utils/pendingAction.js';
import { waitForMinimumAnalysisWindow } from '@/utils/analysisDelay.js';

export function useNews() {
  const { i18n } = useTranslation();
  const userLang = i18n.language || 'en';

  // Sidebar state
  const [isOpen, setIsOpen] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastQuery, setLastQuery] = useState('');
  const [searchFiltered, setSearchFiltered] = useState(false);

  // Breaking news state
  const [breakingNews, setBreakingNews] = useState([]);
  const [breakingLoading, setBreakingLoading] = useState(false);

  // Article selection + analysis state (preserved from useNewsSidebar)
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState(null);
  const [panelError, setPanelError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [panelElapsed, setPanelElapsed] = useState(0);
  const timerRef = useRef(null);
  const panelTimerRef = useRef(null);
  const adDurationRef = useRef(null);
  const [currentAdMediaType, setCurrentAdMediaType] = useState(null);

  const handleAdLoaded = useCallback(({ duration, mediaType }) => {
    adDurationRef.current = duration;
    if (mediaType) setCurrentAdMediaType(mediaType);
  }, []);

  // Load breaking news on sidebar open
  const loadBreaking = useCallback(async () => {
    // Check cache synchronously first to avoid loading flash
    const CACHE_KEY = `philosify:breaking-news:${userLang}`;
    const CACHE_MAX_AGE = 15 * 60 * 1000; // 15 minutes
    
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - new Date(data.cachedAt).getTime();
        if (age < CACHE_MAX_AGE) {
          // Fresh cache → show immediately, no loading state
          setBreakingNews(data.articles || []);
          console.log(`[useNews] Loaded breaking news from cache (${Math.floor(age / 1000)}s old)`);
          return;
        }
      }
    } catch (err) {
      console.warn('[useNews] Cache check failed:', err.message);
    }

    // Cache miss or stale → show loading and fetch
    setBreakingLoading(true);
    try {
      const data = await fetchBreakingNews(userLang);
      setBreakingNews(data.articles || []);
    } catch (err) {
      console.error('[useNews] Breaking news failed:', err.message);
      // Non-critical — don't block the UI
    } finally {
      setBreakingLoading(false);
    }
  }, [userLang]);

  // Search articles
  const search = useCallback(async (searchQuery) => {
    const q = (searchQuery || '').trim();
    if (q.length < 2) return;

    setSearchLoading(true);
    setSearchError(null);
    setLastQuery(q);

    try {
      const data = await searchNews(q, userLang);
      setSearchResults(data.articles || []);
      setSearchFiltered(data.filtered || false);
    } catch (err) {
      console.error('[useNews] Search failed:', err.message);
      setSearchError(err.message);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [userLang]);

  // Search all sources (when user clicks "Search all sources" on empty filtered result)
  const searchAllSources = useCallback(async () => {
    if (!lastQuery) return;
    setSearchLoading(true);
    setSearchError(null);

    try {
      // Bypass source filter by not sending credentials for preferences
      const params = new URLSearchParams({ q: lastQuery, lang: userLang, all: '1' });
      const response = await fetch(`${config.apiUrl}/api/news/search?${params}`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      setSearchResults(data.articles || []);
      setSearchFiltered(false);
    } catch (err) {
      console.error('[useNews] Search all sources failed:', err.message);
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  }, [lastQuery, userLang]);

  // Open sidebar
  const open = useCallback(() => {
    setIsOpen(true);
    loadBreaking();
  }, [loadBreaking]);

  // Close sidebar — clears ALL state, clean slate on reopen
  const close = useCallback(() => {
    setIsOpen(false);
    // Clear search
    setSearchInput('');
    setQuery('');
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
    setLastQuery('');
    setSearchFiltered(false);
    // Clear article selection
    setSelectedArticle(null);
    // Clear analysis
    setAnalysisResult(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
    // Clear panel
    setPanelResult(null);
    setPanelError(null);
    setPanelLoading(false);
    // Clear timer
    setElapsedTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Select article for analysis
  const selectArticle = useCallback((article) => {
    setSelectedArticle(article);
    setAnalysisResult(null);
    setAnalysisError(null);
    setPanelResult(null);
    setPanelError(null);
    setElapsedTime(0);
  }, []);

  // Go back to search results
  const clearArticle = useCallback(() => {
    setSelectedArticle(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setPanelResult(null);
    setPanelError(null);
    setElapsedTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Format elapsed time (MM:SS.mm)
  const formatTime = useCallback((ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  }, []);

  // Full philosophical analysis (1 credit) — UNCHANGED from useNewsSidebar
  const analyzeArticle = useCallback(
    async (lang = 'en', model = 'grok') => {
      if (!selectedArticle) return;

      setIsAnalyzing(true);
      setAnalysisError(null);
      setElapsedTime(0);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);

      try {
        const response = await fetch(`${config.apiUrl}/api/news-analyze`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: selectedArticle.title,
            source: selectedArticle.source || '',
            description: selectedArticle.description || selectedArticle.aiSummary || '',
            topic: selectedArticle.topic || '',
            publishedAt: selectedArticle.publishedAt || null,
            aiSummary: selectedArticle.aiSummary || '',
            model,
            lang,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 402) {
            throw Object.assign(new Error(data.error || 'Insufficient credits'), {
              code: 'INSUFFICIENT_CREDITS',
            });
          }
          throw new Error(data.error || `Analysis failed: ${response.status}`);
        }

        await waitForMinimumAnalysisWindow(startTime, adDurationRef.current);
        setAnalysisResult(data);
        window.dispatchEvent(new CustomEvent('credits-changed'));
      } catch (err) {
        setAnalysisError(err.message || 'Analysis failed');
        throw err;
      } finally {
        setIsAnalyzing(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    },
    [selectedArticle],
  );

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisError(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Philosopher panel analysis (3 credits) — UNCHANGED from useNewsSidebar
  const analyzeWithPanel = useCallback(
    async (chosenPhilosophers, lang = 'en') => {
      if (!selectedArticle) return;

      setPanelLoading(true);
      setPanelError(null);
      setPanelElapsed(0);
      const startTime = Date.now();
      panelTimerRef.current = setInterval(() => {
        setPanelElapsed(Date.now() - startTime);
      }, 100);

      try {
        const result = await requestPhilosopherPanel({
          mediaType: 'news',
          title: selectedArticle.title,
          artist: selectedArticle.source || 'News',
          description: selectedArticle.description || null,
          source: selectedArticle.source,
          publishedAt: selectedArticle.publishedAt,
          philosophers: chosenPhilosophers,
          lang,
        });
        setPanelResult(result.panel);
        window.dispatchEvent(new CustomEvent('credits-changed'));
      } catch (err) {
        setPanelError(err.message);
        throw err;
      } finally {
        setPanelLoading(false);
        if (panelTimerRef.current) {
          clearInterval(panelTimerRef.current);
          panelTimerRef.current = null;
        }
      }
    },
    [selectedArticle],
  );

  // Open with a pre-loaded result (for history/cache)
  const openWithResult = useCallback((result) => {
    setIsOpen(true);
    setPanelResult(result);
    setSelectedArticle({
      title: result.title,
      source: result.artist || result.source,
    });
  }, []);

  // Open with pending action (after payment return)
  const openWithPendingAction = useCallback(() => {
    const action = getPendingAction();
    if ((action?.type === 'news-analysis' || action?.type === 'news-panel') && action.article) {
      setSelectedArticle(action.article);
      clearPendingAction();
      setIsOpen(true);
      loadBreaking();
    } else {
      // Just open the sidebar if no valid pending action
      setIsOpen(true);
      loadBreaking();
    }
  }, [loadBreaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (panelTimerRef.current) {
        clearInterval(panelTimerRef.current);
      }
    };
  }, []);

  return {
    // Sidebar
    isOpen,
    open,
    close,
    // Search
    searchInput,
    setSearchInput,
    query,
    setQuery,
    search,
    searchResults,
    searchLoading,
    searchError,
    lastQuery,
    searchFiltered,
    searchAllSources,
    // Breaking news
    breakingNews,
    breakingLoading,
    loadBreaking,
    // Article selection
    selectedArticle,
    selectArticle,
    clearArticle,
    // Analysis
    isAnalyzing,
    analysisResult,
    analysisError,
    analyzeArticle,
    cancelAnalysis,
    // Philosopher panel
    panelLoading,
    panelResult,
    panelError,
    analyzeWithPanel,
    // Timer
    elapsedTime,
    panelElapsed,
    formatTime,
    currentAdMediaType,
    // History
    openWithResult,
    // Payment return
    openWithPendingAction,
    // Ad duration
    handleAdLoaded,
  };
}
