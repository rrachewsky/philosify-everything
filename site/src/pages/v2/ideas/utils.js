// Ideas v2 - shared helpers (time, countdown, chronometer)
// Logic lifted from components/community/DebatePanel.jsx (WP3 parity).
import { useEffect, useRef, useState } from 'react';

/** Relative time label ("Just now", "5m ago", …) */
export function formatTimeAgo(isoString, t) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('v2.ideas.justNow', 'Just now');
  if (mins < 60) return t('v2.ideas.minutesAgo', { defaultValue: '{{count}}m ago', count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('v2.ideas.hoursAgo', { defaultValue: '{{count}}h ago', count: hours });
  const days = Math.floor(hours / 24);
  return t('v2.ideas.daysAgo', { defaultValue: '{{count}}d ago', count: days });
}

/** Countdown string ("M:SS") for the Type 2 verdict window; null when past */
export function formatCountdown(verdictAt) {
  if (!verdictAt) return null;
  const remaining = new Date(verdictAt).getTime() - Date.now();
  if (remaining <= 0) return null;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** MM:SS.cs chronometer format (same as the analysis timer) */
export function formatChrono(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centis
    .toString()
    .padStart(2, '0')}`;
}

/** M:SS playback time */
export function formatPlayTime(secs) {
  if (!secs || !isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Elapsed-ms chronometer while `active` (rAF-driven, resets on start) */
export function useChronometer(active) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (active) {
      startRef.current = Date.now();
      setElapsed(0); // eslint-disable-line react-hooks/set-state-in-effect -- intentional reset
      const tick = () => {
        if (startRef.current) setElapsed(Date.now() - startRef.current);
        timerRef.current = requestAnimationFrame(tick);
      };
      timerRef.current = requestAnimationFrame(tick);
    } else {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      startRef.current = null;
    }
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [active]);

  return elapsed;
}

/** Chronometer progress % against a 120s reference window */
export function chronoProgress(ms) {
  return Math.min(100, (ms / 120000) * 100);
}
