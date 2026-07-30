// VerdictAudio - v2 audio bar for debate wrap-up / colloquium verdict audio.
// Functional port of DebatePanel's WrapupAudioPlayer (WP3 parity):
// blob fetch with credentials, 402 PARTICIPATE_REQUIRED gate, one retry,
// speed cycle, seekable progress, generation chronometer.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { Button, Telemetry } from '../../../components/v2';
import { formatChrono, formatPlayTime, useChronometer, chronoProgress } from './utils.js';

const SPEEDS = [0.8, 1, 1.2, 1.5, 1.8];

export function VerdictAudio({
  audioUrl: directUrl,
  threadId,
  onUnlockParticipation,
  participateCost,
  canParticipate,
}) {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [participateRequired, setParticipateRequired] = useState(false);
  const [unlockCost, setUnlockCost] = useState(null);
  const [speed, setSpeed] = useState(1);
  // Ref mirror of speed — avoids re-creating togglePlay on speed changes
  const speedRef = useRef(speed);
  const blobUrlRef = useRef(null);
  const prevAudioUrlRef = useRef(null);

  // Playback progress
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressBarRef = useRef(null);

  const genElapsed = useChronometer(loading);

  // Use direct URL if provided, otherwise the forum wrapup proxy endpoint
  const audioUrl = directUrl || `${config.apiUrl}/api/forum/threads/${threadId}/wrapup-audio`;

  // When canParticipate becomes true (after unlock), reset the gate
  useEffect(() => {
    if (canParticipate && participateRequired) {
      setParticipateRequired(false);
      setUnlockCost(null);
    }
  }, [canParticipate, participateRequired]);

  // Stop and clean up old audio when audioUrl changes (e.g. language change)
  useEffect(() => {
    if (prevAudioUrlRef.current && prevAudioUrlRef.current !== audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPlaying(false);
      setError(false);
      setCurrentTime(0);
      setDuration(0);
    }
    prevAudioUrlRef.current = audioUrl;
  }, [audioUrl]);

  const wireAudioEvents = useCallback((audio) => {
    audio.onended = () => setPlaying(false);
    audio.onerror = () => {
      setPlaying(false);
      setError(true);
    };
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => setDuration(audio.duration);
    if (audio.duration) setDuration(audio.duration);
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    setPlaying(false);
  }, []);

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

  const togglePlay = useCallback(async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    if (blobUrlRef.current) {
      if (!audioRef.current) {
        const audio = new Audio(blobUrlRef.current);
        audio.playbackRate = speedRef.current;
        wireAudioEvents(audio);
        audioRef.current = audio;
      }
      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        setError(true);
      }
      return;
    }

    setLoading(true);
    setError(false);
    setParticipateRequired(false);

    const MAX_ATTEMPTS = 2;
    const isApiUrl = audioUrl.startsWith(config.apiUrl);
    const fetchOpts = !directUrl || isApiUrl ? { credentials: 'include' } : {};
    let lastErr;

    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 3000));
          const res = await fetch(audioUrl, fetchOpts);
          if (!res.ok) {
            if (res.status === 402) {
              try {
                const body = await res.json();
                if (body.code === 'PARTICIPATE_REQUIRED') {
                  setParticipateRequired(true);
                  setUnlockCost(body.cost ?? participateCost);
                  return;
                }
              } catch {
                /* fall through to generic error */
              }
            }
            throw new Error('Audio not available');
          }
          const blob = await res.blob();
          if (!blob || blob.size === 0) throw new Error('Empty audio response');
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current.ontimeupdate = null;
            audioRef.current.onloadedmetadata = null;
            audioRef.current = null;
          }
          const audio = new Audio(url);
          audio.playbackRate = speedRef.current;
          wireAudioEvents(audio);
          audioRef.current = audio;
          await audioRef.current.play();
          setPlaying(true);
          return;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [playing, audioUrl, directUrl, participateCost, wireAudioEvents]);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => SPEEDS[(SPEEDS.indexOf(prev) + 1) % SPEEDS.length]);
  }, []);

  // Sync speed changes to ref + live audio element
  useEffect(() => {
    speedRef.current = speed;
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        audioRef.current.ontimeupdate = null;
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Participation gate (402 from the audio endpoint) — cost shown before the click
  if (participateRequired && !canParticipate) {
    const cost = unlockCost ?? participateCost ?? 1;
    return (
      <div className="vaudio">
        <Button variant="secondary" className="sbtn" onClick={onUnlockParticipation}>
          {t('v2.ideas.unlockAudio', {
            defaultValue: 'Unlock audio — {{cost}} credit(s)',
            cost,
          })}
        </Button>
      </div>
    );
  }

  const hasProgress = playing || (blobUrlRef.current && duration > 0);

  return (
    <div className="vaudio">
      <div className="audio">
        <button
          className="play"
          onClick={togglePlay}
          disabled={loading}
          aria-label={
            playing ? t('v2.ideas.pauseAudio', 'Pause') : t('v2.ideas.listenVerdict', 'Listen to the verdict')
          }
        >
          {loading ? '…' : playing ? '❚❚' : '▶'}
        </button>
        <span>
          {loading
            ? t('v2.ideas.loadingAudio', 'Loading audio…')
            : playing
              ? t('v2.ideas.pauseAudio', 'Pause')
              : t('v2.ideas.listenVerdict', 'Listen to the verdict')}
        </span>
        {playing && (
          <button className="play" onClick={stopAudio} aria-label={t('v2.ideas.stopAudio', 'Stop')}>
            ■
          </button>
        )}
        {hasProgress ? (
          <>
            <span className="atime">{formatPlayTime(currentTime)}</span>
            <span
              className="aline aseek"
              ref={progressBarRef}
              onClick={handleSeek}
              role="slider"
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              tabIndex={0}
            >
              <i style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }} />
            </span>
            <span className="atime">{formatPlayTime(duration)}</span>
          </>
        ) : (
          <span className="aline" />
        )}
        {(playing || blobUrlRef.current) && (
          <span className="aspeed" onClick={cycleSpeed} role="button" tabIndex={0}>
            {t('v2.ideas.speed', { defaultValue: 'Speed {{speed}}x', speed })}
          </span>
        )}
      </div>
      {loading && (
        <Telemetry
          label={t('v2.ideas.loadingAudio', 'Loading audio…')}
          time={formatChrono(genElapsed)}
          progress={chronoProgress(genElapsed)}
        />
      )}
      {error && <div className="ierr">{t('v2.ideas.audioError', 'Audio unavailable')}</div>}
    </div>
  );
}

export default VerdictAudio;
