// ============================================================
// useGlobe - Timeline state and controls for Globe of Ideas
// ============================================================

import { useState, useCallback } from 'react';

const MIN_YEAR = -600;
const MAX_YEAR = 2026;

export function useGlobe() {
  const [currentYear, setCurrentYear] = useState(MIN_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(50); // years per second

  const formatYear = useCallback((y) => {
    if (y < 0) return `${Math.abs(Math.round(y))} BC`;
    return `${Math.round(y)} AD`;
  }, []);

  const jumpToEra = useCallback((year) => {
    setCurrentYear(year);
    setIsPlaying(false);
  }, []);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(() => setIsPlaying((v) => !v), []);

  const reset = useCallback(() => {
    setCurrentYear(MIN_YEAR);
    setIsPlaying(false);
  }, []);

  return {
    currentYear,
    setCurrentYear,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    formatYear,
    jumpToEra,
    play,
    pause,
    toggle,
    reset,
    MIN_YEAR,
    MAX_YEAR,
  };
}

export default useGlobe;
