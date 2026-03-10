// ============================================================
// useMusicSidebar Hook - Music Sidebar State Management
// ============================================================
// Manages the sidebar open/close and music analysis flow.
// State resets to fresh on close.

import { useState, useCallback, useRef } from 'react';
import { useSpotifySearch, useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';
import { config } from '@/config';
import { getPendingAction, clearPendingAction } from '@/utils/pendingAction.js';

/**
 * Music sidebar state management hook.
 * Handles search, track selection, analysis, and sidebar visibility.
 */
export function useMusicSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { user } = useAuth();
  const { balance, setBalance } = useCreditsContext();
  const spotify = useSpotifySearch();

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastAnalysisParamsRef = useRef(null);

  // Open the sidebar (resets state to fresh)
  const open = useCallback(() => {
    // Reset all state for fresh start
    setSelectedTrack(null);
    setIsAnalyzing(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    setElapsedTime(0);
    spotify.clearAll();
    setIsOpen(true);
  }, [spotify]);

  // Close the sidebar
  const close = useCallback(() => {
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
  }, []);

  // Open sidebar with a pre-loaded result (for history clicks)
  const openWithResult = useCallback(
    (analysisData) => {
      // Set the track info from the analysis
      const track = {
        song: analysisData.song || analysisData.title,
        artist: analysisData.artist,
        spotify_id: analysisData.spotify_id,
      };
      setSelectedTrack(track);
      setAnalysisResult(analysisData);
      setIsAnalyzing(false);
      setAnalysisError(null);
      setElapsedTime(0);
      spotify.clearAll();
      setIsOpen(true);
    },
    [spotify]
  );

  // Open sidebar restoring track from a pending credit action (after payment return)
  const openWithPendingAction = useCallback(() => {
    const pending = getPendingAction();
    if (pending?.type === 'analysis' && pending.track) {
      spotify.selectTrack(pending.track);
      setSelectedTrack(pending.track);
      setAnalysisResult(null);
      setIsAnalyzing(false);
      setAnalysisError(null);
      setElapsedTime(0);
      clearPendingAction();
      setIsOpen(true);
    } else {
      // No valid pending action — just open fresh
      open();
    }
  }, [spotify, open]);

  // Toggle sidebar
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Select a track from search results
  const handleSelectTrack = useCallback(
    (track) => {
      spotify.selectTrack(track);
      setSelectedTrack(track);
      setAnalysisResult(null);
      setAnalysisError(null);
    },
    [spotify]
  );

  // Clear selected track
  const clearTrack = useCallback(() => {
    spotify.clearAll();
    setSelectedTrack(null);
    setAnalysisResult(null);
    setAnalysisError(null);
  }, [spotify]);

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
      if (!selectedTrack || !user) return { success: false, error: 'No track or user' };

      // Check credits (balance is an object with .total)
      if (balance !== null && balance.total !== undefined && balance.total <= 0) {
        return { success: false, error: 'noCredits', needsCredits: true };
      }

      setIsAnalyzing(true);
      setAnalysisResult(null);
      setAnalysisError(null);
      startTimer();

      abortControllerRef.current = new AbortController();
      lastAnalysisParamsRef.current = { song: selectedTrack.song, artist: selectedTrack.artist, model, lang };

      try {
        // Retry logic for 409 (lock still held from cancelled request)
        const maxRetries = 3;
        const retryDelay = 2000; // 2 seconds between retries

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          const response = await fetch(`${config.apiUrl}/api/analyze`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              song: selectedTrack.song,
              artist: selectedTrack.artist,
              spotify_id: selectedTrack.spotify_id,
              model,
              lang,
            }),
            signal: abortControllerRef.current.signal,
          });

          // Handle 409 - analysis lock still held (e.g., from cancelled request)
          if (response.status === 409 && attempt < maxRetries) {
            console.log(
              `[Analyze] Lock held, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue; // Retry
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
    [selectedTrack, user, balance, setBalance, startTimer, stopTimer]
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

    // Tell the backend to release the analysis lock so user can retry immediately
    const params = lastAnalysisParamsRef.current;
    if (params) {
      lastAnalysisParamsRef.current = null;
      fetch(`${config.apiUrl}/api/cancel-analysis`, {
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

    // Search state (from useSpotifySearch)
    query: spotify.query,
    setQuery: spotify.setQuery,
    results: spotify.results,
    loading: spotify.loading,

    // Track state
    selectedTrack,
    selectTrack: handleSelectTrack,
    clearTrack,

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

export default useMusicSidebar;
