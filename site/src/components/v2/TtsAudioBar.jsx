// TtsAudioBar - shared v2 TTS audio bar (music / cinema / literature / news).
// Telemetry mirrors the ANALYZING state: live chronometer + estimated bar while
// the audio is generated; visible seekable progress + m:ss / m:ss while it
// plays. Wired to services/ttsCache.js (lazy generation on first press).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Telemetry, analysisProgress } from './Telemetry.jsx';
import {
  getPreloadedAudio,
  getAudioStatus,
  getAudioError,
  preloadTTS,
  cancelPreload,
} from '../../services/ttsCache';

const SPEEDS = [0.8, 1, 1.2, 1.5, 1.8];
const EXPECTED_GEN_MS = 45_000;

/** mm:ss.cc — same shape as the analysis chronometer */
export function formatChrono(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

/** m:ss playback time */
export function formatPlayTime(secs) {
  if (!secs || !isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Elapsed-ms chronometer while `active` (rAF-driven, resets on start) */
function useChronometer(active) {
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  useEffect(() => {
    if (active) {
      startRef.current = Date.now();
      setElapsed(0); // eslint-disable-line react-hooks/set-state-in-effect -- intentional reset
      const tick = () => {
        if (startRef.current) setElapsed(Date.now() - startRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);
  return elapsed;
}

/**
 * @param {object} result     analysis object understood by ttsCache (music/cinema/literature/news)
 * @param {string} lang       TTS language
 * @param {object} labels     { listen, pause, play, cancel, seek, preparing, failed, timeout,
 *                              playbackFailed, speed: (x) => string }
 * @param {number} expectedMs pacing of the estimated generation bar
 */
export function TtsAudioBar({ result, lang, labels, expectedMs = EXPECTED_GEN_MS }) {
  const [playing, setPlaying] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const wantsPlayRef = useRef(false);
  const speedRef = useRef(1);
  const seekRef = useRef(null);
  const genElapsed = useChronometer(preparing);

  const detach = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.onended = null;
      a.onerror = null;
      a.ontimeupdate = null;
      a.onloadedmetadata = null;
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    detach();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [detach]);

  const playUrl = useCallback(
    (url) => {
      detach();
      const audio = new Audio(url);
      audio.playbackRate = speedRef.current;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setError(labels.playbackFailed);
        setPlaying(false);
      };
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDuration(audio.duration);
      if (audio.duration) setDuration(audio.duration);
      audioRef.current = audio;
      audio.play().catch(() => {
        setError(labels.playbackFailed);
        setPlaying(false);
      });
      setPlaying(true);
    },
    [detach, labels.playbackFailed]
  );

  // Poll the TTS cache while the audio is being prepared
  useEffect(() => {
    if (!preparing || !result) return undefined;
    const id = setInterval(() => {
      const status = getAudioStatus(result, lang);
      if (status === 'ready') {
        clearInterval(id);
        setPreparing(false);
        if (wantsPlayRef.current) {
          wantsPlayRef.current = false;
          const url = getPreloadedAudio(result, lang);
          if (url) playUrl(url);
        }
      } else if (status === 'error') {
        clearInterval(id);
        setPreparing(false);
        wantsPlayRef.current = false;
        setError(getAudioError(result, lang) === 'timeout' ? labels.timeout : labels.failed);
      }
    }, 400);
    return () => clearInterval(id);
  }, [preparing, result, lang, playUrl, labels.timeout, labels.failed]);

  const cancelGeneration = () => {
    wantsPlayRef.current = false;
    setPreparing(false);
    cancelPreload(result, lang);
  };

  const handlePlay = () => {
    setError(null);
    if (preparing) {
      cancelGeneration();
      return;
    }
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
      return;
    }
    const url = getPreloadedAudio(result, lang);
    if (url) {
      playUrl(url);
      return;
    }
    wantsPlayRef.current = true;
    setPreparing(true);
    const status = getAudioStatus(result, lang);
    if (status !== 'loading' && status !== 'retrying') preloadTTS(result, lang);
  };

  const handleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    speedRef.current = next;
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const bar = seekRef.current;
    if (!audio || !duration || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  // Global stop (module navigation, new analysis) + unmount cleanup
  useEffect(() => {
    window.addEventListener('stopAllAudio', stop);
    return () => {
      window.removeEventListener('stopAllAudio', stop);
      stop();
    };
  }, [stop]);

  // Result or language change: drop the old audio
  useEffect(() => () => stop(), [result, lang, stop]);

  // duration is reset to 0 by stop(), so it doubles as "an audio element is live"
  const hasProgress = duration > 0;
  const label = error ? error : preparing ? labels.preparing : labels.listen;

  return (
    <>
      <div className="audio">
        <button
          className="play"
          onClick={handlePlay}
          aria-label={preparing ? labels.cancel : playing ? labels.pause : labels.play}
        >
          {preparing ? '✕' : playing ? '❚❚' : '▶'}
        </button>
        <span className={error ? 'aerrtxt' : undefined}>{label}</span>
        {hasProgress ? (
          <>
            <span className="atime">{formatPlayTime(currentTime)}</span>
            <span
              className="aline aseek"
              ref={seekRef}
              onClick={handleSeek}
              role="slider"
              aria-label={labels.seek}
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              tabIndex={0}
            >
              <i style={{ width: `${(currentTime / duration) * 100}%` }} />
            </span>
            <span className="atime">{formatPlayTime(duration)}</span>
          </>
        ) : (
          <span className="aline" />
        )}
        <button className="aspeed" onClick={handleSpeed}>
          {labels.speed(speed)}
        </button>
      </div>
      {preparing && (
        <Telemetry
          label={labels.preparing}
          time={formatChrono(genElapsed)}
          progress={analysisProgress(genElapsed, expectedMs)}
          onCancel={cancelGeneration}
          cancelLabel={labels.cancel}
        />
      )}
    </>
  );
}

export default TtsAudioBar;
