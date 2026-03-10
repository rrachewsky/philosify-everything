// ============================================================
// useMusicSidebar Hook - Music Sidebar State Management
// ============================================================
// Manages the sidebar open/close and music analysis flow.
// State resets to fresh on close.

import { useState, useCallback, useRef } from 'react';
import { useSpotifySearch, useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';
import { config } from '@/config';

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
    setIsOpen(false);
  }, []);

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

      try {
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
    }
    setIsAnalyzing(false);
    stopTimer();
    setAnalysisError(null);
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
