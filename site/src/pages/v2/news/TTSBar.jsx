// TTSBar - v2 audio bar for News TTS (services/ttsCache.js news path).
// Playback only: generation is lazy (first press), preload is cached per
// result+lang by ttsCache, which routes news results and panel results
// to POST /api/news/tts.
import { useEffect, useRef, useState } from 'react';
import { AudioBar } from '../../../components/v2';
import { getPreloadedAudio, getAudioStatus, getAudioError, preloadTTS } from '../../../services/ttsCache.js';

const SPEEDS = [0.8, 1, 1.2, 1.5, 1.8];

export function TTSBar({ result, lang, t }) {
  const [playing, setPlaying] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState(null);
  const [speedIdx, setSpeedIdx] = useState(1); // 1x
  const audioRef = useRef(null);
  const pollRef = useRef(null);
  const wantsPlayRef = useRef(false);
  const speedIdxRef = useRef(speedIdx);
  speedIdxRef.current = speedIdx;

  // Stop playback + polling when the result or language changes / on unmount.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      wantsPlayRef.current = false;
      setPlaying(false);
      setPreparing(false);
      setError(null);
    };
  }, [result, lang]);

  const play = (url) => {
    const audio = new Audio(url);
    audio.playbackRate = SPEEDS[speedIdxRef.current];
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setError(t('v2.news.audioPlaybackFailed', 'Audio playback failed'));
      setPlaying(false);
    };
    audioRef.current = audio;
    audio.play();
    setPlaying(true);
  };

  const onPlay = () => {
    setError(null);
    // Toggle existing audio
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
    // Instant play when cached
    const ready = getPreloadedAudio(result, lang);
    if (ready) {
      play(ready);
      return;
    }
    // Generate (or resume waiting), then auto-play when ready
    wantsPlayRef.current = true;
    setPreparing(true);
    const status = getAudioStatus(result, lang);
    if (status !== 'loading' && status !== 'retrying') {
      preloadTTS(result, lang);
    }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      const st = getAudioStatus(result, lang);
      if (st === 'ready') {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setPreparing(false);
        const url = getPreloadedAudio(result, lang);
        if (url && wantsPlayRef.current) {
          wantsPlayRef.current = false;
          play(url);
        }
      } else if (st === 'error') {
        clearInterval(pollRef.current);
        pollRef.current = null;
        setPreparing(false);
        wantsPlayRef.current = false;
        setError(
          getAudioError(result, lang) === 'timeout'
            ? t('v2.news.audioTimeout', 'Audio generation timed out — press play to retry')
            : t('v2.news.audioFailed', 'Audio generation failed — press play to retry')
        );
      }
    }, 500);
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  const label = preparing
    ? t('v2.news.audioPreparing', 'Preparing audio…')
    : error || t('v2.news.listen', 'Listen to the analysis');

  return (
    <AudioBar
      label={label}
      speed={`${t('v2.news.speed', 'Speed')} ${SPEEDS[speedIdx]}x`}
      onPlay={onPlay}
      onSpeed={cycleSpeed}
      playing={playing}
    />
  );
}

export default TTSBar;
