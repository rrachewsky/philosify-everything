// ListenButton - Text-to-Speech for analysis results
// Uses Gemini 2.5 Flash TTS Preview for expressive philosophical narration
// Audio is pre-generated in background - button is for playback only
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getPreloadedAudio,
  getAudioStatus,
  getAudioError,
  preloadTTS,
  cancelPreload,
} from '../../services/ttsCache';

// Speed options for playback
const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5, 1.8];

export function ListenButton({ result }) {
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [ttsComplete, setTtsComplete] = useState(false);
  // Playback progress state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressBarRef = useRef(null);
  // Use global language from i18n (selected on landing page)
  const selectedTTSLang = i18n.language || 'en';
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  // Ref mirror of playbackSpeed — avoids re-creating playAudioFromUrl on speed changes
  const playbackSpeedRef = useRef(playbackSpeed);

  // Track which result + language the audio belongs to
  const cachedKeyRef = useRef(null);
  // Track previous loading state for auto-play detection
  const wasLoadingRef = useRef(false);
  // Track user intent to play
  const userWantsToPlayRef = useRef(false);

  // Format time as MM:SS.ms (same as LandingScreen)
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Format playback time as M:SS
  const formatPlayTime = (secs) => {
    if (!secs || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Seek handler for playback progress bar
  const handleSeek = useCallback(
    (e) => {
      if (!audioRef.current || !duration) return;
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      audioRef.current.currentTime = ratio * duration;
      setCurrentTime(audioRef.current.currentTime);
    },
    [duration]
  );

  // Chronometer effect - runs while TTS is generating
  useEffect(() => {
    if (isPreparing && !ttsComplete) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);

      const updateTimer = () => {
        if (startTimeRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
        timerRef.current = requestAnimationFrame(updateTimer);
      };

      timerRef.current = requestAnimationFrame(updateTimer);
    } else if (!isPreparing && startTimeRef.current) {
      // TTS finished - stop timer but keep displaying final time
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      setTtsComplete(true);
    }
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isPreparing, ttsComplete]);

  // Stop audio helper
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Don't revoke preloaded URLs - they're managed by the cache
    audioUrlRef.current = null;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Play audio from a URL (defined early so it can be used in useEffect below)
  // Reads playbackSpeed from ref to keep a stable callback identity — prevents
  // the polling useEffect from restarting on every speed change, which was
  // orphaning Audio objects and causing perceived acceleration.
  const playAudioFromUrl = useCallback(
    (url) => {
      // Stop any previously-playing audio to avoid orphaned Audio objects
      // stacking up and sounding like acceleration.
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current.onloadedmetadata = null;
        audioRef.current = null;
      }

      const audio = new Audio(url);
      audio.playbackRate = playbackSpeedRef.current;
      audioRef.current = audio;
      audioUrlRef.current = url;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setError(t('listen.playbackFailed'));
        setIsPlaying(false);
      };

      // Playback progress tracking
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setDuration(audio.duration);

      audio.play();
      setIsPlaying(true);
    },
    [t]
  );

  // Trigger preload when result is available
  useEffect(() => {
    if (result && selectedTTSLang) {
      // Start pre-generating audio in background
      preloadTTS(result, selectedTTSLang);
    }
  }, [result, selectedTTSLang]);

  // Monitor preload status and auto-play when ready.
  // Once audio starts playing (or errors out), polling stops to prevent
  // accidental duplicate plays.
  useEffect(() => {
    if (!result) return;

    let interval;

    const checkStatus = () => {
      const status = getAudioStatus(result, selectedTTSLang);
      const wasLoading = wasLoadingRef.current;
      const isLoading = status === 'loading' || status === 'retrying';

      // Update refs and state
      wasLoadingRef.current = isLoading;
      setIsPreparing(isLoading);
      setIsRetrying(status === 'retrying');

      if (status === 'error') {
        // Get specific error type for better messages
        const errorInfo = getAudioError(result, selectedTTSLang);
        if (errorInfo === 'timeout') {
          setError(t('listen.audioTimeout'));
        } else {
          setError(t('listen.audioPrepareFailed'));
        }
        userWantsToPlayRef.current = false;
        // No need to keep polling after error
        if (interval) clearInterval(interval);
        return;
      }

      // Auto-play: if user wanted to play and audio just became ready (transition from loading to ready)
      if (status === 'ready' && wasLoading && userWantsToPlayRef.current && !audioRef.current) {
        const preloadedUrl = getPreloadedAudio(result, selectedTTSLang);
        if (preloadedUrl) {
          console.log('[ListenButton] Audio ready, auto-playing from status check');
          userWantsToPlayRef.current = false;
          playAudioFromUrl(preloadedUrl);
        }
        // Stop polling — audio is now playing (or will be momentarily)
        if (interval) clearInterval(interval);
        return;
      }

      // If audio is already ready and no auto-play needed, stop polling
      if (status === 'ready' && !isLoading) {
        if (interval) clearInterval(interval);
      }
    };

    // Check immediately
    checkStatus();

    // Poll for status changes while loading
    interval = setInterval(checkStatus, 500);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [result, selectedTTSLang, t, playAudioFromUrl]);

  // Clear audio when result changes
  useEffect(() => {
    const resultId = result
      ? `${result.song || result.song_name || result.title || ''}|${result.artist || result.author || ''}`
      : null;
    const cacheKey = `${resultId}|${selectedTTSLang}`;

    if (cachedKeyRef.current && cachedKeyRef.current !== cacheKey) {
      stopAudio();
      setError(null);
    }

    cachedKeyRef.current = cacheKey;
  }, [result, selectedTTSLang, stopAudio]);

  // Listen for global stop audio event
  useEffect(() => {
    const handleStopAllAudio = () => {
      stopAudio();
    };

    window.addEventListener('stopAllAudio', handleStopAllAudio);
    return () => {
      window.removeEventListener('stopAllAudio', handleStopAllAudio);
    };
  }, [stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // Update playback speed when it changes (sync ref + live audio element)
  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const handleListen = useCallback(() => {
    setError(null);

    // If already have audio loaded, toggle play/pause
    if (audioRef.current && audioUrlRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Try to get preloaded audio
    const preloadedUrl = getPreloadedAudio(result, selectedTTSLang);

    if (preloadedUrl) {
      // Audio is ready - play it instantly!
      console.log('[ListenButton] Playing preloaded audio');
      playAudioFromUrl(preloadedUrl);
    } else {
      // Audio not ready yet - trigger preload and show preparing state
      const status = getAudioStatus(result, selectedTTSLang);

      if (status === 'loading') {
        // Already loading - just wait
        console.log('[ListenButton] Audio still preparing...');
      } else {
        // Not started or failed - start preload
        console.log('[ListenButton] Starting audio preload');
        preloadTTS(result, selectedTTSLang);
      }
    }
  }, [result, selectedTTSLang, isPlaying, playAudioFromUrl]);

  const handleListenWithIntent = useCallback(() => {
    const preloadedUrl = getPreloadedAudio(result, selectedTTSLang);

    if (preloadedUrl) {
      handleListen();
    } else {
      // Mark intent to play - auto-play will trigger when audio becomes ready
      userWantsToPlayRef.current = true;
      handleListen();
    }
  }, [result, selectedTTSLang, handleListen]);

  // Stop audio
  const handleStop = () => {
    userWantsToPlayRef.current = false;
    stopAudio();
  };

  // Cancel waiting for audio
  const handleCancel = () => {
    userWantsToPlayRef.current = false;
    setIsPreparing(false);
    setError(null);
    // Cancel the actual preload request
    cancelPreload(result, selectedTTSLang);
    // Reset timer state
    setElapsedTime(0);
    setTtsComplete(false);
    startTimeRef.current = null;
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  };

  // Determine button state
  // eslint-disable-next-line react-hooks/refs -- ref read during render is intentional; value is synchronized with isPreparing state
  const isWaitingForAudio = isPreparing && userWantsToPlayRef.current;

  return (
    <div className="listen-section-card">
      {/* Main Listen Button with Cancel */}
      <div className="listen-button-container">
        <button
          onClick={handleListenWithIntent}
          disabled={isWaitingForAudio}
          className={`listen-main-button ${isPlaying ? 'playing' : ''} ${isWaitingForAudio ? 'loading' : ''}`}
        >
          {isWaitingForAudio ? (
            <>
              <svg
                className="listen-main-icon spinning"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32" />
              </svg>
              <span className="listen-main-text">
                {isRetrying ? t('listen.retrying') : t('listen.preparing')}
              </span>
            </>
          ) : isPlaying ? (
            <>
              <svg className="listen-main-icon" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <span className="listen-main-text">{t('pauseAnalysis')}</span>
            </>
          ) : (
            <>
              <svg className="listen-main-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <span className="listen-main-text">
                {isPreparing ? t('listen.listenPreparing') : t('listenToAnalysis')}
              </span>
            </>
          )}
        </button>

        {/* Cancel button - shown while waiting for audio */}
        {isWaitingForAudio && (
          <button
            className="listen-cancel-btn"
            type="button"
            onClick={handleCancel}
            title={t('listen.cancel')}
            aria-label={t('listen.cancel')}
          >
            ×
          </button>
        )}
      </div>

      {isPlaying && (
        <button onClick={handleStop} className="listen-stop-btn" title={t('stop')}>
          <svg className="listen-stop-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
      )}

      {/* Seekable playback progress bar */}
      {isPlaying && duration > 0 && (
        <div className="listen-progress">
          <span className="listen-progress__time">{formatPlayTime(currentTime)}</span>
          <div
            className="listen-progress__bar"
            ref={progressBarRef}
            onClick={handleSeek}
            role="slider"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            tabIndex={0}
          >
            <div
              className="listen-progress__fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="listen-progress__thumb"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span className="listen-progress__time">{formatPlayTime(duration)}</span>
        </div>
      )}

      {/* Speed control slider */}
      <div className="listen-speed-control">
        <label className="listen-speed-label">
          {t('listen.speed')}: {playbackSpeed}x
        </label>
        <div className="listen-speed-slider-container">
          <input
            type="range"
            min="0"
            max={SPEED_OPTIONS.length - 1}
            step="1"
            value={SPEED_OPTIONS.indexOf(playbackSpeed)}
            onChange={(e) => setPlaybackSpeed(SPEED_OPTIONS[parseInt(e.target.value)])}
            className="listen-speed-slider"
          />
          <div className="listen-speed-marks">
            {SPEED_OPTIONS.map((speed) => (
              <span
                key={speed}
                className={`listen-speed-mark ${playbackSpeed === speed ? 'active' : ''}`}
              >
                {speed}x
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* TTS Generation Timer - shows during preparation or when just completed */}
      {(isPreparing || ttsComplete) && (
        <div className="listen-timer-section">
          {/* Progress Bar with marks */}
          <div className="listen-timer-bar-container">
            <div
              className={`listen-timer-bar ${isPreparing ? 'active' : ''} ${ttsComplete ? 'complete' : ''}`}
            >
              <div className="listen-timer-bar-fill"></div>
              <div className="listen-timer-bar-glow"></div>
            </div>
            {/* Time marks: 0, 30, 60, 90, 120 */}
            <div className="listen-timer-marks">
              <span className="listen-timer-mark" style={{ left: '0%' }}>
                0
              </span>
              <span className="listen-timer-mark" style={{ left: '25%' }}>
                30
              </span>
              <span className="listen-timer-mark" style={{ left: '50%' }}>
                60
              </span>
              <span className="listen-timer-mark" style={{ left: '75%' }}>
                90
              </span>
              <span className="listen-timer-mark" style={{ left: '100%' }}>
                120
              </span>
            </div>
          </div>

          <div className="listen-timer-row">
            <div className="listen-timer-icon">⏱</div>
            <div
              className={`listen-chronometer ${isPreparing ? 'active' : ''} ${ttsComplete ? 'complete' : ''}`}
            >
              {formatTime(elapsedTime)}
            </div>
          </div>
          {isPreparing && (
            <div className="listen-timer-label">
              {isRetrying ? t('listen.retrying') : t('listen.generatingAudio')}
            </div>
          )}
          {ttsComplete && (
            <div className="listen-timer-label listen-timer-label--complete">
              {t('listen.audioReady')}
            </div>
          )}
        </div>
      )}

      {error && <span className="listen-error-text">{error}</span>}
    </div>
  );
}
