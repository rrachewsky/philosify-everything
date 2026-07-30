// V2AudioBar (Literature) - v2 TTS audio bar (music-template .audio anatomy)
// wired to services/ttsCache.js. Lazy generation: first click triggers the
// preload (POST /api/tts under the hood), playback starts when ready.
// Speed cycles the same options as the legacy ListenButton; the hairline
// doubles as a seekable progress. Mirrors pages/v2/music/V2AudioBar.jsx.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getPreloadedAudio,
  getAudioStatus,
  getAudioError,
  preloadTTS,
  cancelPreload,
} from '../../../services/ttsCache';

const SPEEDS = [0.8, 1, 1.2, 1.5, 1.8];

export function V2AudioBar({ result }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [playing, setPlaying] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef(null);
  const wantsPlayRef = useRef(false);
  const speedRef = useRef(1);
  const lineRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setProgress(0);
  }, []);

  const playUrl = useCallback(
    (url) => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      const audio = new Audio(url);
      audio.playbackRate = speedRef.current;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setError(t('v2.literature.audioPlaybackFailed', 'Audio playback failed'));
        setPlaying(false);
      };
      audio.ontimeupdate = () => {
        if (audio.duration) setProgress(audio.currentTime / audio.duration);
      };
      audioRef.current = audio;
      audio.play();
      setPlaying(true);
    },
    [t]
  );

  // Poll the TTS cache while audio is being prepared
  useEffect(() => {
    if (!preparing || !result) return undefined;
    const started = Date.now();
    const id = setInterval(() => {
      setElapsed(Date.now() - started);
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
        const err = getAudioError(result, lang);
        setError(
          err === 'timeout'
            ? t('v2.literature.audioTimeout', 'Audio timed out — try again')
            : t('v2.literature.audioFailed', 'Audio unavailable — try again')
        );
      }
    }, 400);
    return () => clearInterval(id);
  }, [preparing, result, lang, playUrl, t]);

  const handlePlay = () => {
    setError(null);
    if (preparing) {
      // Second click while preparing cancels the generation
      wantsPlayRef.current = false;
      setPreparing(false);
      cancelPreload(result, lang);
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
    setElapsed(0);
    setPreparing(true);
    if (getAudioStatus(result, lang) !== 'loading') preloadTTS(result, lang);
  };

  const handleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    speedRef.current = next;
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const line = lineRef.current;
    if (!audio || !audio.duration || !line) return;
    const rect = line.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
  };

  // Global stop (module navigation, new analysis) + unmount cleanup
  useEffect(() => {
    const onStopAll = () => stop();
    window.addEventListener('stopAllAudio', onStopAll);
    return () => {
      window.removeEventListener('stopAllAudio', onStopAll);
      stop();
    };
  }, [stop]);

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const label = error
    ? error
    : preparing
      ? `${t('v2.literature.preparingAudio', 'Preparing audio')} · ${fmt(elapsed)}`
      : t('v2.literature.listen', 'Listen to the analysis');

  return (
    <div className="audio">
      <button
        className="play"
        onClick={handlePlay}
        aria-label={
          preparing
            ? t('v2.literature.cancel', 'Cancel')
            : playing
              ? t('v2.literature.pause', 'Pause')
              : t('v2.literature.play', 'Play')
        }
      >
        {preparing ? '✕' : playing ? '❚❚' : '▶'}
      </button>
      <span className={error ? 'aerrtxt' : undefined}>{label}</span>
      <span
        className="aline"
        ref={lineRef}
        onClick={handleSeek}
        aria-label={t('v2.literature.seek', 'Seek')}
      >
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
      </span>
      <button className="aspeed" onClick={handleSpeed}>
        {t('v2.literature.speed', 'Speed')} {speed}x
      </button>
    </div>
  );
}

export default V2AudioBar;
