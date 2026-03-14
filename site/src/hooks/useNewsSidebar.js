// useNewsSidebar - State management for the News sidebar
// Handles headline fetching, article selection, and panel analysis

import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '../utils';
import { fetchNewsHeadlines } from '../services/api/newsApi.js';
import { requestPhilosopherPanel } from '../services/api/philosopherPanel.js';

export function useNewsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headlines, setHeadlines] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(false);
  const [headlinesError, setHeadlinesError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState(null);
  const [panelError, setPanelError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  // Fetch headlines when sidebar opens
  const loadHeadlines = useCallback(async () => {
    setHeadlinesLoading(true);
    setHeadlinesError(null);
    try {
      const data = await fetchNewsHeadlines();
      setHeadlines(data.articles || []);
      setHighlights(data.highlights || []);
      logger.log('[NewsSidebar] Loaded', (data.articles || []).length, 'headlines +', (data.highlights || []).length, 'highlights');
    } catch (err) {
      logger.error('[NewsSidebar] Failed to load headlines:', err.message);
      setHeadlinesError(err.message);
    } finally {
      setHeadlinesLoading(false);
    }
  }, []);

  // Open sidebar and load headlines
  const open = useCallback(() => {
    setIsOpen(true);
    loadHeadlines();
  }, [loadHeadlines]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedArticle(null);
    setPanelResult(null);
    setPanelError(null);
    setElapsedTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const selectArticle = useCallback((article) => {
    setSelectedArticle(article);
    setPanelResult(null);
    setPanelError(null);
    setElapsedTime(0);
  }, []);

  const clearArticle = useCallback(() => {
    setSelectedArticle(null);
    setPanelResult(null);
    setPanelError(null);
    setElapsedTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Format elapsed time (same as other sidebars)
  const formatTime = useCallback((ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
  }, []);

  // Analyze selected article with philosopher panel
  const analyzeWithPanel = useCallback(
    async (chosenPhilosophers, lang = 'en') => {
      if (!selectedArticle) return;

      setPanelLoading(true);
      setPanelError(null);
      setElapsedTime(0);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
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
        throw err; // Re-throw so caller can handle INSUFFICIENT_CREDITS
      } finally {
        setPanelLoading(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    },
    [selectedArticle],
  );

  // Open with a specific result (for history/cache)
  const openWithResult = useCallback((result) => {
    setIsOpen(true);
    setPanelResult(result);
    setSelectedArticle({
      title: result.title,
      source: result.artist || result.source,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    open,
    close,
    headlines,
    highlights,
    headlinesLoading,
    headlinesError,
    selectedArticle,
    selectArticle,
    clearArticle,
    panelLoading,
    panelResult,
    panelError,
    elapsedTime,
    formatTime,
    analyzeWithPanel,
    openWithResult,
    loadHeadlines,
  };
}
