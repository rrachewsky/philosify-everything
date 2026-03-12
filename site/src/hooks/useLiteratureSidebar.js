// ============================================================
// useLiteratureSidebar Hook - Literature Sidebar State Management
// ============================================================
// Manages the sidebar open/close and book analysis flow.
// Mirrors useMusicSidebar.js for literature.
// State resets to fresh on close.

import { useState, useCallback, useRef } from 'react';
import { useBookSearch } from '@/hooks/useBookSearch.js';
import { useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';
import { config } from '@/config';
import { getPendingAction, clearPendingAction } from '@/utils/pendingAction.js';
import { logger } from '@/utils';

/**
 * Literature sidebar state management hook.
 * Handles search, book selection, analysis, and sidebar visibility.
 */
export function useLiteratureSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { user } = useAuth();
  const { balance, setBalance } = useCreditsContext();
  const bookSearch = useBookSearch();

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastAnalysisParamsRef = useRef(null);

  // Open the sidebar (resets state to fresh)
  const open = useCallback(() => {
    setSelectedBook(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    setElapsedTime(0);
    bookSearch.clearAll();
    setIsOpen(true);
  }, [bookSearch]);

  // Close the sidebar
  const close = useCallback(() => {
    logger.log('[LiteratureSidebar] close() called');
    // Cancel any ongoing analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Stop timer
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setIsAnalyzing(false);
    setIsOpen(false);
    logger.log('[LiteratureSidebar] isOpen set to false');
  }, []);

  // Open sidebar with a pre-loaded result (for history clicks)
  const openWithResult = useCallback(
    (analysisData) => {
      const book = {
        title: analysisData.title,
        author: analysisData.author,
        google_books_id: analysisData.google_books_id,
        cover_url: analysisData.cover_url,
      };
      setSelectedBook(book);
      setAnalysisResult(analysisData);
      setIsAnalyzing(false);
      setAnalysisError(null);
      setElapsedTime(0);
      bookSearch.clearAll();
      setIsOpen(true);
    },
    [bookSearch]
  );

  // Open sidebar restoring book from a pending credit action (after payment return)
  const openWithPendingAction = useCallback(() => {
    const pending = getPendingAction();
    logger.log('[LiteratureSidebar] openWithPendingAction - pending:', pending);
    if (pending?.type === 'book-analysis' && pending.book) {
      logger.log('[LiteratureSidebar] Restoring book:', pending.book);
      bookSearch.selectBook(pending.book);
      setSelectedBook(pending.book);
      setAnalysisResult(null);
      setIsAnalyzing(false);
      setAnalysisError(null);
      setElapsedTime(0);
      clearPendingAction();
      setIsOpen(true);
    } else {
      logger.log('[LiteratureSidebar] No valid pending action, opening fresh');
      open();
    }
  }, [bookSearch, open]);

  // Toggle sidebar
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Select a book from search results
  const handleSelectBook = useCallback(
    (book) => {
      bookSearch.selectBook(book);
      setSelectedBook(book);
      setAnalysisResult(null);
      setAnalysisError(null);
    },
    [bookSearch]
  );

  // Clear selected book
  const clearBook = useCallback(() => {
    bookSearch.clearAll();
    setSelectedBook(null);
    setAnalysisResult(null);
    setAnalysisError(null);
  }, [bookSearch]);

  // Start analysis timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    const updateTimer = () => {
      if (startTimeRef.current) {
        setElapsedTime(Date.now() - startTimeRef.current);
      }
      timerRef.current = requestAnimationFrame(updateTimer);
    };

    timerRef.current = requestAnimationFrame(updateTimer);
  }, []);

  // Stop analysis timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  // Run analysis
  const analyze = useCallback(
    async (lang = 'en', model = 'grok') => {
      if (!selectedBook || !user) return { success: false, error: 'No book or user' };

      // Check credits
      if (balance !== null && balance.total !== undefined && balance.total <= 0) {
        return { success: false, error: 'noCredits', needsCredits: true };
      }

      setIsAnalyzing(true);
      setAnalysisResult(null);
      setAnalysisError(null);
      startTimer();

      abortControllerRef.current = new AbortController();
      lastAnalysisParamsRef.current = {
        title: selectedBook.title,
        author: selectedBook.author,
        model,
        lang,
      };

      try {
        // Retry logic for 409 (lock still held from cancelled request)
        const maxRetries = 3;
        const retryDelay = 2000;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          const response = await fetch(`${config.apiUrl}/api/book-analyze`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: selectedBook.title,
              author: selectedBook.author,
              google_books_id: selectedBook.google_books_id,
              model,
              lang,
            }),
            signal: abortControllerRef.current.signal,
          });

          // Handle 409 - analysis lock still held
          if (response.status === 409 && attempt < maxRetries) {
            console.log(
              `[BookAnalyze] Lock held, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue;
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Analysis failed');
          }

          setAnalysisResult(data);

          // Update balance from response
          if (data.balance && typeof data.balance.total !== 'undefined') {
            setBalance({
              total: data.balance.total,
              credits: data.balance.credits,
              freeRemaining: data.balance.freeRemaining,
            });
          }

          return { success: true, data };
        }

        // All retries exhausted
        setAnalysisError('Analysis failed - please try again');
        return { success: false, error: 'Analysis failed after retries' };
      } catch (error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'cancelled' };
        }
        setAnalysisError(error.message);
        return { success: false, error: error.message };
      } finally {
        setIsAnalyzing(false);
        stopTimer();
        abortControllerRef.current = null;
      }
    },
    [selectedBook, user, balance, setBalance, startTimer, stopTimer]
  );

  // Cancel ongoing analysis
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    stopTimer();
    setAnalysisError(null);

    // Tell the backend to release the analysis lock
    const params = lastAnalysisParamsRef.current;
    if (params) {
      lastAnalysisParamsRef.current = null;
      fetch(`${config.apiUrl}/api/cancel-book-analysis`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).catch(() => {}); // Fire-and-forget
    }
  }, [stopTimer]);

  // Format elapsed time as MM:SS.ms
  const formatTime = useCallback((ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // Sidebar state
    isOpen,
    open,
    close,
    toggle,
    openWithResult,
    openWithPendingAction,

    // Search state (from useBookSearch)
    query: bookSearch.query,
    setQuery: bookSearch.setQuery,
    results: bookSearch.results,
    loading: bookSearch.loading,

    // Book state
    selectedBook,
    selectBook: handleSelectBook,
    clearBook,

    // Analysis state
    isAnalyzing,
    analysisResult,
    analysisError,
    analyze,
    cancelAnalysis,

    // Timer
    elapsedTime,
    formatTime,

    // Auth/credits
    user,
    balance,
  };
}

export default useLiteratureSidebar;
