// DebatePanel - Philosophical Debates + Academic Colloquium marketplace
// List view: shows debate topics + colloquium storefront
// Detail view: threaded discussion with upvote/downvote
// Colloquium: credit-gated access, participation, propose, add philosopher
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebate } from '../../hooks/useDebate.js';
import { useColloquium, getLocalizedContent } from '../../hooks/useColloquium.js';
import { config } from '@/config';
import { InvitePeopleModal } from './InvitePeopleModal.jsx';
import { TranslateButton } from '../common/TranslateButton.jsx';
import { PaymentModal } from '../payment/PaymentModal.jsx';
import { getPendingAction, clearPendingAction } from '@utils/pendingAction.js';
import { logger } from '@utils';
import { translateEra, translateSchool } from '../../data/philosopherI18n.js';

function formatTimeAgo(isoString, t) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('community.debate.justNow');
  if (mins < 60) return t('community.debate.minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('community.debate.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('community.debate.daysAgo', { count: days });
}

/** Countdown string for Type 2 verdict window */
function formatCountdown(verdictAt) {
  if (!verdictAt) return null;
  const remaining = new Date(verdictAt).getTime() - Date.now();
  if (remaining <= 0) return null;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ─── Debate List Item (regular debates) ─────────────────────
function DebateListItem({ debate, onOpen, t }) {
  const isEnded = !!debate.wrapup;
  return (
    <div
      className={`debate-item${isEnded ? ' debate-item--ended' : ''}`}
      onClick={() => onOpen(debate.id)}
      role="button"
      tabIndex={0}
    >
      <div className="debate-item__header">
        <span className="debate-item__author">{debate.author}</span>
        <div className="debate-item__header-right">
          <span
            className={`debate-item__status ${isEnded ? 'debate-item__status--ended' : 'debate-item__status--open'}`}
          >
            {isEnded ? t('community.debate.statusEnded') : t('community.debate.statusOpen')}
          </span>
          <span className="debate-item__time">{formatTimeAgo(debate.created_at, t)}</span>
        </div>
      </div>
      <div className="debate-item__title">{debate.title}</div>
      {debate.content && (
        <div className="debate-item__excerpt">
          {debate.content.length > 120 ? debate.content.slice(0, 120) + '...' : debate.content}
        </div>
      )}
      <div className="debate-item__stats">
        <span className="debate-item__replies">
          {debate.reply_count || 0} {t('community.debate.replies')}
        </span>
      </div>
    </div>
  );
}

// ─── Colloquium Storefront Item ─────────────────────────────
function ColloquiumListItem({ item, onOpen, t, lang }) {
  const isEnded = item.has_verdict;
  const isDaily = item.colloquium_type === 'daily';
  const isOpenDebate = item.colloquium_type === 'open_debate';
  const philosophers = item.philosophers || [];
  const prices = item.philosopher_prices || {};
  const userAddedSet = new Set(
    item.user_added_philosophers || item.metadata?.user_added_philosophers || []
  );
  const access = item.access || {};
  // Open debates have no countdown (no verdict_at — proposer triggers manually)
  const countdown = !isEnded && !isDaily && !isOpenDebate ? formatCountdown(item.verdict_at) : null;

  // Get localized title
  const localizedTitle = getLocalizedContent(item.translations?.title, lang, item.title);

  // Badge label
  const badgeLabel = isOpenDebate
    ? t('community.colloquium.openDebateBadge')
    : isDaily
      ? t('community.colloquium.dailyBadge')
      : t('community.colloquium.userBadge');

  return (
    <div
      className={`debate-item debate-item--colloquium${isOpenDebate ? ' debate-item--open-debate' : ''}${isEnded ? ' debate-item--ended' : ''}${access.hasAccess ? ' debate-item--unlocked' : ''}`}
      onClick={() => onOpen(item.id)}
      role="button"
      tabIndex={0}
    >
      <div className="debate-item__header">
        <span className="debate-item__author">
          {isOpenDebate
            ? t('community.colloquium.openDebateLabel')
            : t('community.debate.colloquiumLabel')}
        </span>
        <div className="debate-item__header-right">
          <span
            className={`debate-item__badge ${isOpenDebate ? 'debate-item__badge--open-debate' : 'debate-item__badge--colloquium'}`}
          >
            {badgeLabel}
          </span>
          {item.visibility === 'closed' && (
            <span className="debate-item__badge debate-item__badge--closed">
              {t('community.colloquium.closedBadge')}
            </span>
          )}
          {access.hasAccess && !isOpenDebate && (
            <span className="debate-item__badge debate-item__badge--unlocked">
              {t('community.colloquium.unlocked')}
            </span>
          )}
          <span
            className={`debate-item__status ${isEnded ? 'debate-item__status--ended' : 'debate-item__status--open'}`}
          >
            {isEnded ? t('community.debate.statusEnded') : t('community.debate.statusOpen')}
          </span>
          <span className="debate-item__time">{formatTimeAgo(item.created_at, t)}</span>
        </div>
      </div>
      <div className="debate-item__title">{localizedTitle}</div>
      {(item.translations?.content || item.excerpt) && (
        <div className="debate-item__excerpt">
          {(() => {
            const text = getLocalizedContent(item.translations?.content, lang, item.excerpt);
            return text && text.length > 120 ? text.slice(0, 120) + '...' : text;
          })()}
        </div>
      )}
      {philosophers.length > 0 && (
        <div className="debate-item__philosophers">
          {philosophers.map((name) => {
            const isUserAdded = userAddedSet.has(name);
            return (
              <span
                key={name}
                className={`debate-item__philosopher-chip${isUserAdded ? ' philosopher-chip--user-added' : ''}`}
              >
                {isUserAdded && <span className="philosopher-chip__star">&#9733;</span>}
                {name}
                <span className="philosopher-chip__price">
                  {prices[name] || 2}
                  {t('community.colloquium.creditAbbr')}
                </span>
              </span>
            );
          })}
        </div>
      )}
      <div className="debate-item__stats">
        <span className="debate-item__replies">
          {item.reply_count || 0} {t('community.debate.replies')}
        </span>
        {countdown && (
          <span className="debate-item__countdown">
            {countdown} {t('community.colloquium.remaining')}
          </span>
        )}
        {isOpenDebate && (
          <span className="debate-item__free-tag">{t('community.colloquium.freeToRead')}</span>
        )}
        {!access.hasAccess && !isOpenDebate && (
          <span className="debate-item__cost">1 {t('community.colloquium.creditToAccess')}</span>
        )}
      </div>
    </div>
  );
}

// ─── Reply Item (shared for debates and colloquiums) ────────
function ReplyItem({ reply, onVote, onDelete, onEdit, t, isColloquium, lang, hasVerdict }) {
  const isOwner = reply.isOwner;
  const isPhilosopher = reply.is_philosopher;
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  // For colloquium replies (philosopher AND user), use translated content when available
  const displayContent = isColloquium
    ? getLocalizedContent(reply.metadata?.translations, lang, reply.content)
    : reply.content;

  // Can edit/delete: own non-philosopher replies, before verdict
  const canModify = isOwner && !isPhilosopher && !hasVerdict;

  const handleStartEdit = () => {
    setEditText(reply.content);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === reply.content) {
      handleCancelEdit();
      return;
    }
    setSaving(true);
    const ok = await onEdit(reply.id, trimmed);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <div
      className={`debate-reply ${reply.parent_id ? 'debate-reply--nested' : ''}${isPhilosopher ? ' debate-reply--philosopher' : ''}`}
    >
      <div className="debate-reply__header">
        <span
          className={`debate-reply__author${isPhilosopher ? ' debate-reply__author--philosopher' : ''}`}
        >
          {isPhilosopher ? reply.philosopher_name : reply.author}
        </span>
        {isPhilosopher && (
          <span className="debate-reply__philosopher-badge">
            {t('community.debate.philosopherBadge')}
          </span>
        )}
        <span className="debate-reply__time">{formatTimeAgo(reply.created_at, t)}</span>
        {reply.edited_at && (
          <span className="debate-reply__edited">{t('community.debate.edited')}</span>
        )}
        {canModify && !editing && (
          <>
            <button
              className="debate-reply__edit"
              onClick={handleStartEdit}
              title={t('community.debate.editReply')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </button>
            <button
              className="debate-reply__delete"
              onClick={() => onDelete(reply.id)}
              title={t('community.debate.deleteReply')}
            >
              &times;
            </button>
          </>
        )}
      </div>
      {editing ? (
        <div className="debate-reply__edit-box">
          <textarea
            className="debate-reply__edit-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            maxLength={3000}
            disabled={saving}
          />
          <div className="debate-reply__edit-actions">
            <button
              className="debate-reply__edit-cancel"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              {t('community.debate.cancel')}
            </button>
            <button
              className="debate-reply__edit-save"
              onClick={handleSaveEdit}
              disabled={saving || !editText.trim()}
            >
              {saving ? '...' : t('community.debate.saveEdit')}
            </button>
          </div>
        </div>
      ) : (
        <div className="debate-reply__content">{displayContent}</div>
      )}
      {/* Only show translate button on user replies, not on pre-translated AI content */}
      {!editing && !(isColloquium && isPhilosopher) && <TranslateButton text={reply.content} />}
      <div className="debate-reply__actions">
        <button
          className={`debate-vote-btn ${reply.myVote === 'up' ? 'debate-vote-btn--active' : ''}`}
          onClick={() => onVote(reply.id, reply.myVote === 'up' ? null : 'up')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
          {reply.upvotes || 0}
        </button>
        <button
          className={`debate-vote-btn ${reply.myVote === 'down' ? 'debate-vote-btn--active-down' : ''}`}
          onClick={() => onVote(reply.id, reply.myVote === 'down' ? null : 'down')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 20l8-8h-5V4H9v8H4z" />
          </svg>
          {reply.downvotes || 0}
        </button>
      </div>
    </div>
  );
}

// ─── Wrapup Audio Player (for standard debates) ─────────────
const WRAPUP_SPEEDS = [0.8, 1, 1.2, 1.5, 1.8];

function WrapupAudioPlayer({
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
  // Ref mirror of speed — avoids re-creating togglePlay on speed changes,
  // which could orphan Audio objects and cause perceived acceleration.
  const speedRef = useRef(speed);
  const blobUrlRef = useRef(null);
  const prevAudioUrlRef = useRef(null);

  // Generation chronometer state
  const [genElapsed, setGenElapsed] = useState(0);
  const [genComplete, setGenComplete] = useState(false);
  const genTimerRef = useRef(null);
  const genStartRef = useRef(null);

  // Playback progress state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressBarRef = useRef(null);

  // Use direct URL if provided, otherwise proxy endpoint
  const audioUrl = directUrl || `${config.apiUrl}/api/forum/threads/${threadId}/wrapup-audio`;

  // Format time for playback (M:SS)
  const formatPlayTime = (secs) => {
    if (!secs || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // When canParticipate becomes true (after unlock), reset the gate
  useEffect(() => {
    if (canParticipate && participateRequired) {
      setParticipateRequired(false);
      setUnlockCost(null);
    }
  }, [canParticipate, participateRequired]);

  // Generation chronometer — runs while loading
  useEffect(() => {
    if (loading && !genComplete) {
      genStartRef.current = Date.now();
      setGenElapsed(0);
      const update = () => {
        if (genStartRef.current) {
          setGenElapsed(Date.now() - genStartRef.current);
        }
        genTimerRef.current = requestAnimationFrame(update);
      };
      genTimerRef.current = requestAnimationFrame(update);
    } else if (!loading && genStartRef.current) {
      if (genTimerRef.current) {
        cancelAnimationFrame(genTimerRef.current);
        genTimerRef.current = null;
      }
      setGenComplete(true);
    }
    return () => {
      if (genTimerRef.current) {
        cancelAnimationFrame(genTimerRef.current);
      }
    };
  }, [loading, genComplete]);

  // Stop and clean up old audio when audioUrl changes (e.g., language change)
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
      setGenElapsed(0);
      setGenComplete(false);
      genStartRef.current = null;
    }
    prevAudioUrlRef.current = audioUrl;
  }, [audioUrl]);

  // Helper: wire audio events for playback tracking
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

  // Helper: fully stop and reset audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
    setPlaying(false);
  }, []);

  // Seek handler for progress bar click
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
    setGenComplete(false);
    genStartRef.current = null;
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
          if (!blob || blob.size === 0) {
            throw new Error('Empty audio response');
          }
          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;
          // Clean up any stale Audio before creating a new one
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
          return; // success — exit loop and function
        } catch (e) {
          lastErr = e;
        }
      }
      // All attempts failed
      throw lastErr;
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [playing, audioUrl, directUrl, participateCost, wireAudioEvents]);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = WRAPUP_SPEEDS.indexOf(prev);
      return WRAPUP_SPEEDS[(idx + 1) % WRAPUP_SPEEDS.length];
    });
  }, []);

  // Sync speed changes to ref + live audio element (same pattern as ListenButton)
  useEffect(() => {
    speedRef.current = speed;
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
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
      if (genTimerRef.current) {
        cancelAnimationFrame(genTimerRef.current);
      }
    };
  }, []);

  // Participation gate
  if (participateRequired && !canParticipate) {
    const cost = unlockCost ?? participateCost ?? 1;
    return (
      <div className="debate-wrapup__audio debate-wrapup__audio--locked">
        <button
          className="debate-wrapup__unlock-audio-btn"
          onClick={onUnlockParticipation}
          title={t('community.colloquium.unlockAudio', { cost })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
          </svg>
          <span>{t('community.colloquium.unlockAudio', { cost })}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="debate-wrapup__audio">
      {/* Generation chronometer — shown during audio fetch/generation */}
      {(loading || (genComplete && !error)) && (
        <div className="debate-wrapup-timer debate-wrapup-timer--inline">
          <div className="debate-wrapup-timer__bar-container">
            <div
              className={`debate-wrapup-timer__bar ${loading ? 'active' : ''} ${genComplete ? 'debate-wrapup-timer__bar--complete' : ''}`}
            >
              <div className="debate-wrapup-timer__bar-fill"></div>
              <div className="debate-wrapup-timer__bar-glow"></div>
            </div>
            <div className="debate-wrapup-timer__marks">
              <span className="debate-wrapup-timer__mark" style={{ left: '0%' }}>
                0
              </span>
              <span className="debate-wrapup-timer__mark" style={{ left: '25%' }}>
                30
              </span>
              <span className="debate-wrapup-timer__mark" style={{ left: '50%' }}>
                60
              </span>
              <span className="debate-wrapup-timer__mark" style={{ left: '75%' }}>
                90
              </span>
              <span className="debate-wrapup-timer__mark" style={{ left: '100%' }}>
                120
              </span>
            </div>
          </div>
          <div className="debate-wrapup-timer__row">
            <div className="debate-wrapup-timer__icon">&#9201;</div>
            <div
              className={`debate-wrapup-timer__chrono ${loading ? 'active' : ''} ${genComplete ? 'debate-wrapup-timer__chrono--complete' : ''}`}
            >
              {formatTime(genElapsed)}
            </div>
          </div>
          <div
            className={`debate-wrapup-timer__label ${genComplete ? 'debate-wrapup-timer__label--complete' : ''}`}
          >
            {loading ? t('community.debate.loadingAudio') : t('listen.audioReady')}
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="debate-wrapup__controls">
        <button
          className={`debate-wrapup__play-btn ${playing ? 'debate-wrapup__play-btn--playing' : ''}`}
          onClick={togglePlay}
          disabled={loading}
          title={playing ? t('community.debate.pauseAudio') : t('community.debate.listenVerdict')}
        >
          {loading ? (
            <svg className="debate-wrapup__spinner" width="16" height="16" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          ) : playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          <span>
            {loading
              ? t('community.debate.loadingAudio')
              : playing
                ? t('community.debate.pauseAudio')
                : t('community.debate.listenVerdict')}
          </span>
        </button>
        {playing && (
          <button
            className="debate-wrapup__stop-btn"
            onClick={stopAudio}
            title={t('community.debate.stopAudio')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        )}
        {(playing || blobUrlRef.current) && (
          <button className="debate-wrapup__speed-btn" onClick={cycleSpeed}>
            {speed}x
          </button>
        )}
      </div>

      {/* Seekable playback progress bar */}
      {(playing || (blobUrlRef.current && duration > 0)) && (
        <div className="debate-wrapup__progress">
          <span className="debate-wrapup__progress-time">{formatPlayTime(currentTime)}</span>
          <div
            className="debate-wrapup__progress-bar"
            ref={progressBarRef}
            onClick={handleSeek}
            role="slider"
            aria-valuenow={Math.round(currentTime)}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            tabIndex={0}
          >
            <div
              className="debate-wrapup__progress-fill"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            <div
              className="debate-wrapup__progress-thumb"
              style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          <span className="debate-wrapup__progress-time">{formatPlayTime(duration)}</span>
        </div>
      )}

      {error && (
        <span className="debate-wrapup__audio-error">{t('community.debate.audioError')}</span>
      )}
    </div>
  );
}

// Format time as MM:SS.ms (same as analysis timer)
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

// ─── Philosopher Poll (vote for your preferred philosopher) ─────
function PhilosopherPoll({ philosophers, poll, onVote, threadId, t }) {
  if (!philosophers || philosophers.length === 0) return null;

  const tallies = poll?.tallies || {};
  const myVote = poll?.myVote || null;
  const totalVotes = poll?.totalVotes || 0;

  return (
    <div className="philosopher-poll">
      <div className="philosopher-poll__header">
        <svg
          className="philosopher-poll__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1z" />
        </svg>
        <span>{t('community.colloquium.pollTitle')}</span>
        <span className="philosopher-poll__total">
          {totalVotes}{' '}
          {totalVotes === 1
            ? t('community.colloquium.pollVote')
            : t('community.colloquium.pollVotes')}
        </span>
      </div>
      <div className="philosopher-poll__list">
        {philosophers.map((name) => {
          const count = tallies[name] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const isMyVote = myVote === name;
          return (
            <button
              key={name}
              className={`philosopher-poll__row${isMyVote ? ' philosopher-poll__row--voted' : ''}`}
              onClick={() => onVote(threadId, name)}
              type="button"
            >
              <span className="philosopher-poll__name">{name}</span>
              <div className="philosopher-poll__bar-container">
                <div className="philosopher-poll__bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="philosopher-poll__stats">
                {pct}% <span className="philosopher-poll__count">({count})</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Creation Chronometer (reused by propose + open debate modals) ─────
function CreationChronometer({ loading, label }) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (loading) {
      startRef.current = Date.now();
      setElapsed(0); // eslint-disable-line react-hooks/set-state-in-effect -- intentional reset
      const tick = () => {
        if (startRef.current) {
          setElapsed(Date.now() - startRef.current);
        }
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
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="debate-wrapup-timer">
      <div className="debate-wrapup-timer__bar-container">
        <div className="debate-wrapup-timer__bar active">
          <div className="debate-wrapup-timer__bar-fill"></div>
          <div className="debate-wrapup-timer__bar-glow"></div>
        </div>
        <div className="debate-wrapup-timer__marks">
          <span className="debate-wrapup-timer__mark" style={{ left: '0%' }}>
            0
          </span>
          <span className="debate-wrapup-timer__mark" style={{ left: '25%' }}>
            30
          </span>
          <span className="debate-wrapup-timer__mark" style={{ left: '50%' }}>
            60
          </span>
          <span className="debate-wrapup-timer__mark" style={{ left: '75%' }}>
            90
          </span>
          <span className="debate-wrapup-timer__mark" style={{ left: '100%' }}>
            120
          </span>
        </div>
      </div>
      <div className="debate-wrapup-timer__row">
        <div className="debate-wrapup-timer__icon">&#9201;</div>
        <div className="debate-wrapup-timer__chrono active">{formatTime(elapsed)}</div>
      </div>
      <div className="debate-wrapup-timer__label">{label}</div>
    </div>
  );
}

// ─── Propose Colloquium Modal ───────────────────────────────
function ProposeModal({ onClose, onSubmit, loading, error, t }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('open');

  const handleSubmit = () => {
    if (!title.trim() || title.trim().length < 3) return;
    if (!content.trim() || content.trim().length < 10) return;
    onSubmit(title.trim(), content.trim(), visibility);
  };

  return (
    <div className="colloquium-modal-overlay" onClick={onClose}>
      <div className="colloquium-modal" onClick={(e) => e.stopPropagation()}>
        <div className="colloquium-modal__header">
          <span className="colloquium-modal__title">{t('community.colloquium.proposeTitle')}</span>
          <button className="colloquium-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="colloquium-modal__body">
          {loading ? (
            <CreationChronometer
              loading={loading}
              label={t('community.colloquium.creatingColloquium')}
            />
          ) : (
            <>
              <p className="colloquium-modal__cost">{t('community.colloquium.proposeCost')}</p>
              <p className="colloquium-modal__hint">{t('community.colloquium.proposeHint')}</p>
              <input
                type="text"
                className="colloquium-modal__input"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                placeholder={t('community.colloquium.proposeTitlePlaceholder')}
                maxLength={200}
                autoFocus
              />
              <textarea
                className="colloquium-modal__textarea"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                placeholder={t('community.colloquium.proposeContentPlaceholder')}
                maxLength={5000}
                rows={4}
              />
              <div className="colloquium-modal__visibility">
                <label className="colloquium-modal__visibility-label">
                  {t('community.colloquium.visibility')}
                </label>
                <div className="colloquium-modal__visibility-options">
                  <button
                    type="button"
                    className={`colloquium-modal__visibility-btn${visibility === 'open' ? ' colloquium-modal__visibility-btn--active' : ''}`}
                    onClick={() => setVisibility('open')}
                  >
                    {t('community.colloquium.visibilityOpen')}
                  </button>
                  <button
                    type="button"
                    className={`colloquium-modal__visibility-btn${visibility === 'closed' ? ' colloquium-modal__visibility-btn--active' : ''}`}
                    onClick={() => setVisibility('closed')}
                  >
                    {t('community.colloquium.visibilityClosed')}
                  </button>
                </div>
                <p className="colloquium-modal__visibility-hint">
                  {visibility === 'open'
                    ? t('community.colloquium.visibilityOpenHint')
                    : t('community.colloquium.visibilityClosedHint')}
                </p>
              </div>
              {error && <div className="colloquium-modal__error">{error}</div>}
            </>
          )}
        </div>
        {!loading && (
          <div className="colloquium-modal__footer">
            <button className="colloquium-modal__cancel" onClick={onClose}>
              {t('community.debate.cancel')}
            </button>
            <button
              className="colloquium-modal__submit"
              onClick={handleSubmit}
              disabled={
                !title.trim() ||
                title.trim().length < 3 ||
                !content.trim() ||
                content.trim().length < 10
              }
            >
              {t('community.colloquium.proposeSubmit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Propose Open Debate Modal ──────────────────────────────
function OpenDebateModal({ onClose, onSubmit, loading, error, t }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || title.trim().length < 3) return;
    if (!content.trim() || content.trim().length < 10) return;
    onSubmit(title.trim(), content.trim());
  };

  return (
    <div className="colloquium-modal-overlay" onClick={onClose}>
      <div className="colloquium-modal" onClick={(e) => e.stopPropagation()}>
        <div className="colloquium-modal__header">
          <span className="colloquium-modal__title">
            {t('community.colloquium.openDebateTitle')}
          </span>
          <button className="colloquium-modal__close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="colloquium-modal__body">
          {loading ? (
            <CreationChronometer
              loading={loading}
              label={t('community.colloquium.creatingOpenDebate')}
            />
          ) : (
            <>
              <p className="colloquium-modal__cost">{t('community.colloquium.openDebateCost')}</p>
              <p className="colloquium-modal__hint">{t('community.colloquium.openDebateHint')}</p>
              <input
                type="text"
                className="colloquium-modal__input"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                placeholder={t('community.colloquium.proposeTitlePlaceholder')}
                maxLength={200}
                autoFocus
              />
              <textarea
                className="colloquium-modal__textarea"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 5000))}
                placeholder={t('community.colloquium.proposeContentPlaceholder')}
                maxLength={5000}
                rows={4}
              />
              {error && <div className="colloquium-modal__error">{error}</div>}
            </>
          )}
        </div>
        {!loading && (
          <div className="colloquium-modal__footer">
            <button className="colloquium-modal__cancel" onClick={onClose}>
              {t('community.debate.cancel')}
            </button>
            <button
              className="colloquium-modal__submit"
              onClick={handleSubmit}
              disabled={
                !title.trim() ||
                title.trim().length < 3 ||
                !content.trim() ||
                content.trim().length < 10
              }
            >
              {t('community.colloquium.openDebateSubmit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Philosopher Modal ──────────────────────────────────
function AddPhilosopherModal({
  roster,
  existingPhilosophers,
  onAdd,
  onClose,
  loading,
  error,
  t,
  lang,
}) {
  const available = roster.filter((p) => !existingPhilosophers.includes(p.name));
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  // Filter by search query (name, era, or school — also matches translated era/school)
  const filtered = search.trim()
    ? available.filter((p) => {
        const q = search.toLowerCase();
        const tEra = translateEra(p.era, lang).toLowerCase();
        const tSchool = translateSchool(p.school, lang).toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.era.toLowerCase().includes(q) ||
          p.school.toLowerCase().includes(q) ||
          tEra.includes(q) ||
          tSchool.includes(q)
        );
      })
    : available;

  return (
    <div className="colloquium-modal-overlay" onClick={loading ? undefined : onClose}>
      <div
        className="colloquium-modal colloquium-modal--roster"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="colloquium-modal__header">
          <span className="colloquium-modal__title">
            {t('community.colloquium.addPhilosopherTitle')}
          </span>
          <button className="colloquium-modal__close" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>
        {error && <div className="colloquium-modal__error">{error}</div>}
        <div className="colloquium-modal__body colloquium-roster-body">
          {available.length === 0 ? (
            <p className="colloquium-roster__empty">
              {t('community.colloquium.allPhilosophersAdded')}
            </p>
          ) : (
            <>
              <div className="colloquium-roster__search-wrap">
                <input
                  type="text"
                  className="colloquium-roster__search"
                  placeholder={t('community.colloquium.searchPhilosopher', {
                    defaultValue: 'Search by name, era, or school...',
                  })}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    className="colloquium-roster__search-clear"
                    onClick={() => setSearch('')}
                    type="button"
                  >
                    &times;
                  </button>
                )}
              </div>
              {filtered.length === 0 ? (
                <p className="colloquium-roster__empty">
                  {t('community.colloquium.noPhilosophersFound', {
                    defaultValue: 'No philosophers match your search',
                  })}
                </p>
              ) : (
                <div className="colloquium-roster__list">
                  {filtered.map((p) => (
                    <button
                      key={p.name}
                      className={`colloquium-roster__item${selected === p.name ? ' colloquium-roster__item--selected' : ''}`}
                      onClick={() => setSelected(p.name)}
                    >
                      <div className="colloquium-roster__info">
                        <span className="colloquium-roster__name">{p.name}</span>
                        <span className="colloquium-roster__meta">
                          {translateEra(p.era, lang)} &middot; {translateSchool(p.school, lang)}
                        </span>
                      </div>
                      <span
                        className={`colloquium-roster__price ${p.price === 3 ? 'colloquium-roster__price--premium' : ''}`}
                      >
                        {p.price} {t('community.colloquium.credits')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="colloquium-modal__footer">
          <button className="colloquium-modal__cancel" onClick={onClose}>
            {t('community.debate.cancel')}
          </button>
          <button
            className="colloquium-modal__submit"
            onClick={() => selected && onAdd(selected)}
            disabled={!selected || loading}
          >
            {loading
              ? '...'
              : selected
                ? t('community.colloquium.addPhilosopherConfirm', {
                    name: selected,
                    price: roster.find((p) => p.name === selected)?.price || 2,
                  })
                : t('community.colloquium.selectPhilosopher')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Access Paywall Overlay ─────────────────────────────────
function AccessPaywall({ onUnlock, loading, t }) {
  return (
    <div className="colloquium-paywall">
      <div className="colloquium-paywall__icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.6">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        </svg>
      </div>
      <p className="colloquium-paywall__text">{t('community.colloquium.accessRequired')}</p>
      <button className="colloquium-paywall__btn" onClick={onUnlock} disabled={loading}>
        {loading ? '...' : t('community.colloquium.unlockAccess')}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════
export function DebatePanel({ deepLinkDebateId, clearDeepLinkDebate }) {
  const { t, i18n } = useTranslation();
  const debate = useDebate();
  const coll = useColloquium();

  // Local UI state
  const [showCreate, setShowCreate] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [showOpenDebate, setShowOpenDebate] = useState(false);
  const [showAddPhilosopher, setShowAddPhilosopher] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [philosopherToast, setPhilosopherToast] = useState(null);
  const [creatingPendingProposal, setCreatingPendingProposal] = useState(false);
  const philosopherToastRef = useRef(null);
  const replyInputRef = useRef(null);

  // Colloquium countdown timer
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  // Wrapup timer state (for regular debates)
  const [wrapupElapsed, setWrapupElapsed] = useState(0);
  const [showFinalTime, setShowFinalTime] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const wrapupTimerRef = useRef(null);
  const wrapupStartRef = useRef(null);
  const wasLoadingRef = useRef(false);

  // Chronometer for wrap-up loading
  useEffect(() => {
    if (debate.wrapupLoading) {
      wasLoadingRef.current = true;
      wrapupStartRef.current = Date.now();
      setWrapupElapsed(0);
      setShowFinalTime(false);
      setFadingOut(false);
      const tick = () => {
        if (wrapupStartRef.current) {
          setWrapupElapsed(Date.now() - wrapupStartRef.current);
        }
        wrapupTimerRef.current = requestAnimationFrame(tick);
      };
      wrapupTimerRef.current = requestAnimationFrame(tick);
    } else {
      if (wrapupTimerRef.current) {
        cancelAnimationFrame(wrapupTimerRef.current);
        wrapupTimerRef.current = null;
      }
      wrapupStartRef.current = null;
      if (wasLoadingRef.current && debate.wrapup) {
        wasLoadingRef.current = false;
        setShowFinalTime(true);
        setFadingOut(false);
        const fadeTimer = setTimeout(() => setFadingOut(true), 2000);
        const hideTimer = setTimeout(() => {
          setShowFinalTime(false);
          setFadingOut(false);
        }, 3000);
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
        };
      }
    }
    return () => {
      if (wrapupTimerRef.current) cancelAnimationFrame(wrapupTimerRef.current);
    };
  }, [debate.wrapupLoading, debate.wrapup]);

  // Load both debates and colloquiums on mount
  useEffect(() => {
    debate.loadDebates();
    coll.loadColloquiums();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open a specific debate from deep link
  useEffect(() => {
    if (deepLinkDebateId && !debate.activeDebate && !coll.activeColloquium) {
      debate.openDebate(deepLinkDebateId);
      if (clearDeepLinkDebate) clearDeepLinkDebate();
    }
  }, [deepLinkDebateId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer for active Type 2 colloquium
  useEffect(() => {
    const verdictAt =
      coll.activeColloquium?.metadata?.auto_verdict_at ||
      coll.activeColloquium?.metadata?.verdict_at ||
      coll.activeColloquium?.verdict_at;
    if (!verdictAt || coll.activeColloquium?.wrapup || coll.activeColloquium?.has_verdict) {
      setCountdown(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    const update = () => {
      const cd = formatCountdown(verdictAt);
      setCountdown(cd);
      if (!cd && countdownRef.current) clearInterval(countdownRef.current);
    };
    update();
    countdownRef.current = setInterval(update, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [coll.activeColloquium]);

  // Cleanup philosopher toast timer on unmount
  useEffect(() => {
    return () => clearTimeout(philosopherToastRef.current);
  }, []);

  // Colloquium verdict chronometer
  const [collVerdictElapsed, setCollVerdictElapsed] = useState(0);
  const collVerdictTimerRef = useRef(null);
  const collVerdictStartRef = useRef(null);

  useEffect(() => {
    if (coll.verdictLoading) {
      collVerdictStartRef.current = Date.now();
      setCollVerdictElapsed(0);
      const tick = () => {
        if (collVerdictStartRef.current) {
          setCollVerdictElapsed(Date.now() - collVerdictStartRef.current);
        }
        collVerdictTimerRef.current = requestAnimationFrame(tick);
      };
      collVerdictTimerRef.current = requestAnimationFrame(tick);
    } else {
      if (collVerdictTimerRef.current) {
        cancelAnimationFrame(collVerdictTimerRef.current);
        collVerdictTimerRef.current = null;
      }
      collVerdictStartRef.current = null;
    }
    return () => {
      if (collVerdictTimerRef.current) cancelAnimationFrame(collVerdictTimerRef.current);
    };
  }, [coll.verdictLoading]);

  // ─── Debate handlers ──────────────────────────────────────
  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim() || newContent.trim().length < 10 || creating) return;
    setCreating(true);
    const created = await debate.createDebate(newTitle.trim(), newContent.trim());
    if (created) {
      setNewTitle('');
      setNewContent('');
      setShowCreate(false);
    }
    setCreating(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    const reply = await debate.addReply(replyText.trim());
    if (reply) setReplyText('');
    setReplying(false);
  };

  const handleColloquiumReply = async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    const reply = await coll.addReply(replyText.trim());
    if (reply) setReplyText('');
    setReplying(false);
  };

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (coll.activeColloquium) {
        handleColloquiumReply();
      } else {
        handleReply();
      }
    }
  };

  const handleInvite = useCallback(() => {
    if (!debate.activeDebate) return;
    setShowInviteModal(true);
  }, [debate.activeDebate]);

  // ─── Colloquium handlers ──────────────────────────────────
  const handleOpenColloquium = useCallback(
    async (threadId) => {
      await coll.openColloquium(threadId);
    },
    [coll]
  );

  const handleUnlockAccess = useCallback(async () => {
    if (!coll.activeColloquium) return;
    await coll.unlockAccess(coll.activeColloquium.id);
  }, [coll]);

  const handleUnlockParticipation = useCallback(async () => {
    if (!coll.activeColloquium) return;
    await coll.unlockParticipation(coll.activeColloquium.id);
  }, [coll]);

  const handleAddPhilosopher = useCallback(
    async (philosopherName) => {
      if (!coll.activeColloquium) return;
      const result = await coll.addPhilosopher(coll.activeColloquium.id, philosopherName);
      if (result?.success) {
        setShowAddPhilosopher(false);
        clearTimeout(philosopherToastRef.current);
        setPhilosopherToast(philosopherName);
        philosopherToastRef.current = setTimeout(() => setPhilosopherToast(null), 4000);
      } else if (result?.code === 'INSUFFICIENT_CREDITS') {
        // Close this modal so PaymentModal is visible
        setShowAddPhilosopher(false);
      }
    },
    [coll]
  );

  const handlePropose = useCallback(
    async (title, content, visibility) => {
      const result = await coll.propose(title, content, visibility);
      if (result?.success) {
        setShowPropose(false);
        // Open the newly created colloquium
        if (result.threadId) {
          await coll.openColloquium(result.threadId);
        }
      } else if (result?.code === 'INSUFFICIENT_CREDITS') {
        setShowPropose(false);
      }
    },
    [coll]
  );

  const handleProposeOpenDebate = useCallback(
    async (title, content) => {
      const result = await coll.proposeOpenDebate(title, content);
      if (result?.success) {
        setShowOpenDebate(false);
        if (result.threadId) {
          await coll.openColloquium(result.threadId);
        }
      } else if (result?.code === 'INSUFFICIENT_CREDITS') {
        setShowOpenDebate(false);
      }
    },
    [coll]
  );

  // Load roster when add-philosopher modal opens
  useEffect(() => {
    if (showAddPhilosopher && coll.roster.length === 0) {
      coll.loadRoster();
    }
  }, [showAddPhilosopher]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect colloquiums opened via the debate hook to the colloquium hook
  useEffect(() => {
    if (debate.activeDebate?.category === 'colloquium') {
      const id = debate.activeDebate.id;
      debate.closeDebate();
      handleOpenColloquium(id);
    }
  }, [debate.activeDebate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-retry pending credit action after purchase ──────
  const pendingRetryRef = useRef(false);

  // Actions that target a specific colloquium (need activeColloquium loaded)
  useEffect(() => {
    if (pendingRetryRef.current) return;
    if (!coll.activeColloquium || coll.actionLoading || coll.loading) return;
    const pending = getPendingAction();
    if (!pending) return;
    const threadId = coll.activeColloquium.id;
    if (pending.threadId !== threadId) return;

    if (pending.type === 'colloquium:access') {
      pendingRetryRef.current = true;
      clearPendingAction();
      logger.log('[DebatePanel] Auto-retrying: unlock access for', threadId);
      coll.unlockAccess(threadId);
    } else if (pending.type === 'colloquium:participate') {
      pendingRetryRef.current = true;
      clearPendingAction();
      logger.log('[DebatePanel] Auto-retrying: unlock participation for', threadId);
      coll.unlockParticipation(threadId);
    } else if (pending.type === 'colloquium:addPhilosopher') {
      pendingRetryRef.current = true;
      clearPendingAction();
      logger.log('[DebatePanel] Auto-retrying: add philosopher', pending.philosopher);
      handleAddPhilosopher(pending.philosopher);
    }
  }, [coll.activeColloquium?.id, coll.loading, coll.actionLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actions that don't need an active colloquium (propose creates a new one)
  useEffect(() => {
    if (pendingRetryRef.current) return;
    if (coll.activeColloquium || coll.loading) return; // Only fire on list view
    const pending = getPendingAction();
    if (!pending) return;

    if (pending.type === 'colloquium:propose') {
      pendingRetryRef.current = true;
      clearPendingAction();
      setCreatingPendingProposal(true);
      logger.log('[DebatePanel] Auto-retrying: propose colloquium');
      coll.propose(pending.title, pending.content, pending.visibility).then((result) => {
        setCreatingPendingProposal(false);
        if (result?.success && result.threadId) {
          coll.openColloquium(result.threadId);
        }
      });
    } else if (pending.type === 'colloquium:proposeOpenDebate') {
      pendingRetryRef.current = true;
      clearPendingAction();
      setCreatingPendingProposal(true);
      logger.log('[DebatePanel] Auto-retrying: propose open debate');
      coll.proposeOpenDebate(pending.title, pending.content).then((result) => {
        setCreatingPendingProposal(false);
        if (result?.success && result.threadId) {
          coll.openColloquium(result.threadId);
        }
      });
    }
  }, [coll.loading, coll.activeColloquium]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═════════════════════════════════════════════════════════
  // COLLOQUIUM DETAIL VIEW
  // ═════════════════════════════════════════════════════════
  if (coll.activeColloquium) {
    const ac = coll.activeColloquium;
    const needsAccess = ac._needsAccess;
    const hasAccess = coll.accessState?.hasAccess;
    const canParticipate = coll.accessState?.canParticipate;
    const isProposer = coll.accessState?.isProposer;
    const hasVerdict = !!ac.wrapup || ac.has_verdict;
    const collType = ac.metadata?.colloquium_type || ac.colloquium_type || 'daily';
    const isDaily = collType === 'daily';
    const isOpenDebate = collType === 'open_debate';
    // Generation state for user_proposed: detect stuck/failed generation
    const generationFailed = !!ac.metadata?.generation_failed;
    // Stale = next_philosopher_at is >10 min overdue (cron should have picked it up).
    // Falls back to created_at > 30 min if next_philosopher_at is absent.
    const nextPhilAt = ac.metadata?.next_philosopher_at;
    const staleRef = nextPhilAt
      ? new Date(nextPhilAt).getTime()
      : ac.created_at
        ? new Date(ac.created_at).getTime()
        : 0;
    const staleThreshold = nextPhilAt ? 10 * 60 * 1000 : 30 * 60 * 1000;
    const generationStale = staleRef > 0 && Date.now() - staleRef > staleThreshold; // eslint-disable-line react-hooks/purity -- one-time derived value
    // Verdict requires ALL philosophers to have spoken (one reply each).
    // Cron-based staggered generation: each philosopher speaks once sequentially,
    // seeing all prior arguments. No separate rebuttal round.
    const allPhilosOnPanel = ac.metadata?.philosophers || ac.philosophers || [];
    const philReplies = (coll.replies || []).filter((r) => r.is_philosopher);
    const allPhilosHaveSpoken =
      allPhilosOnPanel.length > 0 &&
      allPhilosOnPanel.every((name) =>
        philReplies.some(
          (r) =>
            r.philosopher_name === name &&
            (!r.metadata?.reply_type || r.metadata?.reply_type === 'initial')
        )
      );
    const generationReady = allPhilosHaveSpoken;
    const generationNeedsRetry = generationFailed || (generationStale && !allPhilosHaveSpoken);
    // Invite: open colloquiums — anyone with access; private — proposer only
    const isPrivate = (ac.metadata?.visibility || ac.visibility) === 'closed';
    const canInviteColloquium = isPrivate ? isProposer : hasAccess;
    // Philosopher picker: close 15 min before verdict
    const autoVerdictAt = ac.metadata?.auto_verdict_at || ac.metadata?.verdict_at || ac.verdict_at;
    const PICKER_CUTOFF_MS = 15 * 60 * 1000;
    const pickerDeadline = autoVerdictAt
      ? new Date(new Date(autoVerdictAt).getTime() - PICKER_CUTOFF_MS)
      : null;
    const pickerOpen = !hasVerdict && (!pickerDeadline || new Date() < pickerDeadline);
    const minutesUntilPickerClose = pickerDeadline
      ? Math.max(0, Math.ceil((pickerDeadline - Date.now()) / 60000))
      : null;
    const philosophers = ac.metadata?.philosophers || ac.philosophers || [];
    const prices = ac.metadata?.philosopher_prices || ac.philosopher_prices || {};
    const userAddedPhilosophers = new Set(ac.metadata?.user_added_philosophers || []);

    // Localized content
    const localizedTitle = getLocalizedContent(
      ac.metadata?.translations?.title || ac.translations?.title,
      coll.lang,
      ac.title
    );
    const localizedContent = getLocalizedContent(
      ac.metadata?.translations?.content || ac.translations?.content,
      coll.lang,
      ac.content
    );
    const localizedWrapup = getLocalizedContent(
      ac.metadata?.translations?.wrapup || ac.translations?.wrapup,
      coll.lang,
      ac.wrapup
    );

    // On-demand TTS: build endpoint URL for the user's language
    const verdictAudioEndpoint = ac.wrapup
      ? `${config.apiUrl}/api/colloquium/${ac.id}/verdict-audio?lang=${coll.lang?.split('-')[0] || 'en'}`
      : null;

    // Determine participation cost label: daily=1, open_debate=1, user_proposed=2
    const participateCost = isOpenDebate || isDaily ? 1 : 2;

    return (
      <div className="debate-panel">
        <div className="debate-detail debate-detail--colloquium">
          {/* Header */}
          <div className="debate-detail__header">
            <button className="debate-detail__back" onClick={coll.closeColloquium}>
              &larr;
            </button>
            <span className="debate-detail__title">{localizedTitle}</span>
            <span
              className={`debate-detail__colloquium-tag${isOpenDebate ? ' debate-detail__colloquium-tag--open-debate' : ''}`}
            >
              {isOpenDebate
                ? t('community.colloquium.openDebateBadge')
                : isDaily
                  ? t('community.colloquium.dailyBadge')
                  : t('community.colloquium.userBadge')}
            </span>
            {canInviteColloquium && (
              <button
                className="debate-detail__invite"
                onClick={() => setShowInviteModal(true)}
                title={t('community.debate.invite')}
              >
                {t('community.debate.invite')}
              </button>
            )}
            {(isProposer || sessionStorage.getItem('adminSecret')) && (
              <button
                className="debate-reply__delete"
                onClick={() =>
                  setConfirmDelete({ type: 'colloquium', id: ac.id, asAdmin: !isProposer })
                }
                title={t('community.colloquium.deleteColloquium')}
              >
                &times;
              </button>
            )}
          </div>

          {/* Countdown for Type 2 */}
          {countdown && (
            <div className="colloquium-countdown">
              <span className="colloquium-countdown__label">
                {t('community.colloquium.verdictIn')}
              </span>
              <span className="colloquium-countdown__time">{countdown}</span>
            </div>
          )}

          {/* Scrollable content */}
          <div className="debate-detail__scroll">
            {/* Access Paywall (skipped for open debates — they're free to read) */}
            {needsAccess && !hasAccess && !isOpenDebate && (
              <AccessPaywall onUnlock={handleUnlockAccess} loading={coll.actionLoading} t={t} />
            )}

            {/* Content (only shown if has access) */}
            {hasAccess && (
              <>
                {/* Original post */}
                <div className="debate-detail__post">
                  <div className="debate-detail__meta">
                    <span className="debate-detail__author">
                      {t('community.debate.colloquiumLabel')}
                    </span>
                    <span className="debate-detail__time">{formatTimeAgo(ac.created_at, t)}</span>
                    {isProposer && (
                      <span className="debate-detail__proposer-tag">
                        {t('community.colloquium.proposer')}
                      </span>
                    )}
                  </div>
                  <div className="debate-detail__content">{localizedContent}</div>
                  {/* No translate button — content is pre-translated */}
                </div>

                {/* Philosopher chips — below context, showing all panel members */}
                {philosophers.length > 0 && (
                  <div className="debate-detail__panel-chips">
                    {philosophers.map((name) => {
                      const isUserAdded = userAddedPhilosophers.has(name);
                      return (
                        <span
                          key={name}
                          className={`debate-item__philosopher-chip${isUserAdded ? ' philosopher-chip--user-added' : ''}`}
                        >
                          {isUserAdded && <span className="philosopher-chip__star">&#9733;</span>}
                          {name}
                          <span className="philosopher-chip__price">
                            {prices[name] || 2}
                            {t('community.colloquium.creditAbbr')}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Replies (philosopher arguments + user comments) */}
                <div className="debate-detail__replies">
                  {coll.loading && coll.replies.length === 0 && (
                    <div className="debate-panel__empty">{t('community.debate.loading')}</div>
                  )}
                  {!coll.loading && coll.replies.length === 0 && (
                    <div className="debate-panel__empty">{t('community.debate.noReplies')}</div>
                  )}
                  {coll.replies.map((reply) => (
                    <ReplyItem
                      key={reply.id}
                      reply={reply}
                      onVote={coll.voteReply}
                      onDelete={(replyId) =>
                        setConfirmDelete({ type: 'colloquium-reply', id: replyId })
                      }
                      onEdit={coll.editReply}
                      t={t}
                      isColloquium={true}
                      lang={coll.lang}
                      hasVerdict={hasVerdict}
                    />
                  ))}
                </div>

                {/* Verdict section — after all replies so user reads debate first */}
                {localizedWrapup ? (
                  <div className="debate-wrapup">
                    <div className="debate-wrapup__header">
                      <svg
                        className="debate-wrapup__icon"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      <span>{t('community.debate.wrapupTitle')}</span>
                    </div>
                    {/* Multi-language audio */}
                    {verdictAudioEndpoint && (
                      <WrapupAudioPlayer
                        audioUrl={verdictAudioEndpoint}
                        onUnlockParticipation={handleUnlockParticipation}
                        participateCost={participateCost}
                        canParticipate={canParticipate}
                      />
                    )}
                    <div className="debate-wrapup__content">{localizedWrapup}</div>
                    {/* No translate button — verdict is pre-translated */}
                  </div>
                ) : coll.verdictLoading ? (
                  <div className="debate-wrapup-timer">
                    <div className="debate-wrapup-timer__bar-container">
                      <div className="debate-wrapup-timer__bar active">
                        <div className="debate-wrapup-timer__bar-fill"></div>
                        <div className="debate-wrapup-timer__bar-glow"></div>
                      </div>
                      <div className="debate-wrapup-timer__marks">
                        <span className="debate-wrapup-timer__mark" style={{ left: '0%' }}>
                          0
                        </span>
                        <span className="debate-wrapup-timer__mark" style={{ left: '25%' }}>
                          30
                        </span>
                        <span className="debate-wrapup-timer__mark" style={{ left: '50%' }}>
                          60
                        </span>
                        <span className="debate-wrapup-timer__mark" style={{ left: '75%' }}>
                          90
                        </span>
                        <span className="debate-wrapup-timer__mark" style={{ left: '100%' }}>
                          120
                        </span>
                      </div>
                    </div>
                    <div className="debate-wrapup-timer__row">
                      <div className="debate-wrapup-timer__icon">&#9201;</div>
                      <div className="debate-wrapup-timer__chrono active">
                        {formatTime(collVerdictElapsed)}
                      </div>
                    </div>
                    <div className="debate-wrapup-timer__label">
                      {t('community.colloquium.generatingVerdict')}
                    </div>
                  </div>
                ) : null}

                {/* Philosopher Poll — after verdict, before action bar */}
                {hasVerdict && (
                  <PhilosopherPoll
                    philosophers={philosophers}
                    poll={coll.poll}
                    onVote={coll.castPollVote}
                    threadId={ac.id}
                    t={t}
                  />
                )}
              </>
            )}

            {/* Error - visible in both paywall and content states */}
            {coll.error && <div className="debate-panel__error">{coll.error}</div>}
          </div>
          {/* end scroll */}

          {/* Action bar at bottom */}
          {hasAccess && !hasVerdict && (
            <div className="colloquium-action-bar">
              {/* Participation gate */}
              {!canParticipate ? (
                <button
                  className="colloquium-action-bar__unlock"
                  onClick={handleUnlockParticipation}
                  disabled={coll.actionLoading}
                >
                  {coll.actionLoading
                    ? '...'
                    : t('community.colloquium.unlockParticipation', { cost: participateCost })}
                </button>
              ) : (
                <>
                  {/* Philosopher progress — staggered generation via cron */}
                  {(collType === 'user_proposed' || collType === 'open_debate') &&
                    !hasVerdict &&
                    !allPhilosHaveSpoken &&
                    allPhilosOnPanel.length > 0 && (
                      <div className="colloquium-action-bar__generation-timer">
                        <span className="colloquium-action-bar__progress-label">
                          {t('community.colloquium.philosopherProgress', {
                            current: Math.min(
                              philReplies
                                .filter(
                                  (r) =>
                                    !r.metadata?.reply_type || r.metadata?.reply_type === 'initial'
                                )
                                .map((r) => r.philosopher_name)
                                .filter((v, i, a) => a.indexOf(v) === i).length,
                              allPhilosOnPanel.length
                            ),
                            total: allPhilosOnPanel.length,
                          })}
                        </span>
                      </div>
                    )}
                  {/* Reply input */}
                  <textarea
                    ref={replyInputRef}
                    className="debate-detail__textarea"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value.slice(0, 3000))}
                    onKeyDown={handleReplyKeyDown}
                    placeholder={t('community.debate.writeArgument')}
                    maxLength={3000}
                    rows={2}
                    disabled={replying}
                  />
                  <div className="colloquium-action-bar__buttons">
                    <button
                      className="colloquium-action-bar__publish"
                      onClick={handleColloquiumReply}
                      disabled={!replyText.trim() || replying}
                    >
                      {replying ? '...' : t('community.debate.post')}
                    </button>
                    {pickerOpen ? (
                      <button
                        className="colloquium-action-bar__add-philosopher"
                        onClick={() => setShowAddPhilosopher(true)}
                        title={t('community.colloquium.addPhilosopherTitle')}
                      >
                        + {t('community.colloquium.addPhilosopher')}
                        {minutesUntilPickerClose != null && minutesUntilPickerClose <= 20 && (
                          <span className="colloquium-action-bar__picker-countdown">
                            {t('community.colloquium.addPhilosopherCountdown', {
                              minutes: minutesUntilPickerClose,
                            })}
                          </span>
                        )}
                      </button>
                    ) : !hasVerdict ? (
                      <span className="colloquium-action-bar__picker-closed">
                        {t('community.colloquium.addPhilosopherClosed')}
                      </span>
                    ) : null}
                    {/* Generation state for user_proposed colloquiums */}
                    {collType === 'user_proposed' &&
                      isProposer &&
                      !hasVerdict &&
                      generationReady && (
                        <button
                          className="colloquium-action-bar__verdict colloquium-action-bar__verdict--proposer"
                          onClick={() => coll.proposerVerdict(ac.id)}
                          disabled={coll.actionLoading}
                          title={t('community.colloquium.generateVerdict')}
                        >
                          {coll.actionLoading ? '...' : t('community.colloquium.generateVerdict')}
                        </button>
                      )}
                    {collType === 'user_proposed' &&
                      isProposer &&
                      !hasVerdict &&
                      !generationReady &&
                      generationNeedsRetry && (
                        <button
                          className="colloquium-action-bar__retry"
                          onClick={() => coll.retryGeneration(ac.id)}
                          disabled={coll.actionLoading}
                          title={t('community.colloquium.retryGeneration')}
                        >
                          {coll.actionLoading ? '...' : t('community.colloquium.retryGeneration')}
                        </button>
                      )}
                    {/* Proposer verdict button for open debates */}
                    {isOpenDebate && isProposer && !hasVerdict && allPhilosHaveSpoken && (
                      <button
                        className="colloquium-action-bar__verdict colloquium-action-bar__verdict--proposer"
                        onClick={() => coll.proposerVerdict(ac.id)}
                        disabled={coll.actionLoading}
                        title={t('community.colloquium.generateVerdict')}
                      >
                        {coll.actionLoading ? '...' : t('community.colloquium.generateVerdict')}
                      </button>
                    )}
                    {/* Admin verdict button for daily types */}
                    {isDaily && (
                      <button
                        className="colloquium-action-bar__verdict"
                        onClick={() => coll.triggerVerdict(ac.id)}
                        disabled={coll.actionLoading}
                        title={t('community.colloquium.generateVerdict')}
                      >
                        {coll.actionLoading ? '...' : t('community.colloquium.generateVerdict')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add Philosopher Modal */}
          {showAddPhilosopher && (
            <AddPhilosopherModal
              roster={coll.roster}
              existingPhilosophers={philosophers}
              onAdd={handleAddPhilosopher}
              onClose={() => setShowAddPhilosopher(false)}
              loading={coll.actionLoading}
              error={coll.error}
              t={t}
              lang={i18n.language}
            />
          )}

          {/* Philosopher added toast */}
          {philosopherToast && (
            <div className="philosopher-added-toast">
              {t('community.colloquium.philosopherAdded', { name: philosopherToast })}
            </div>
          )}

          {/* Colloquium delete confirmation modal */}
          {confirmDelete && confirmDelete.type === 'colloquium' && (
            <div className="debate-confirm-overlay" onClick={() => setConfirmDelete(null)}>
              <div className="debate-confirm" onClick={(e) => e.stopPropagation()}>
                <p className="debate-confirm__text">
                  {t('community.colloquium.confirmDeleteColloquium')}
                </p>
                <div className="debate-confirm__actions">
                  <button className="debate-confirm__cancel" onClick={() => setConfirmDelete(null)}>
                    {t('community.debate.cancel')}
                  </button>
                  <button
                    className="debate-confirm__delete"
                    onClick={async () => {
                      const { id, asAdmin } = confirmDelete;
                      setConfirmDelete(null);
                      await coll.deleteColloquium(id, { asAdmin });
                    }}
                  >
                    {t('community.debate.confirmDelete')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Colloquium reply delete confirmation modal */}
          {confirmDelete && confirmDelete.type === 'colloquium-reply' && (
            <div className="debate-confirm-overlay" onClick={() => setConfirmDelete(null)}>
              <div className="debate-confirm" onClick={(e) => e.stopPropagation()}>
                <p className="debate-confirm__text">{t('community.debate.confirmDeleteReply')}</p>
                <div className="debate-confirm__actions">
                  <button className="debate-confirm__cancel" onClick={() => setConfirmDelete(null)}>
                    {t('community.debate.cancel')}
                  </button>
                  <button
                    className="debate-confirm__delete"
                    onClick={async () => {
                      const { id } = confirmDelete;
                      setConfirmDelete(null);
                      await coll.deleteReply(id);
                    }}
                  >
                    {t('community.debate.confirmDelete')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Invite people modal (colloquium) */}
          {showInviteModal && (
            <InvitePeopleModal
              debateId={ac.id}
              debateTitle={localizedTitle}
              onClose={() => setShowInviteModal(false)}
              type="colloquium"
            />
          )}

          {/* Buy Credits Modal (opens on insufficient credits) */}
          <PaymentModal isOpen={coll.showBuyCredits} onClose={coll.dismissBuyCredits} />
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // DEBATE DETAIL VIEW (regular debates, unchanged logic)
  // ═════════════════════════════════════════════════════════
  if (debate.activeDebate && debate.activeDebate.category !== 'colloquium') {
    return (
      <div className="debate-panel">
        <div className="debate-detail">
          {/* Header with back button */}
          <div className="debate-detail__header">
            <button className="debate-detail__back" onClick={debate.closeDebate}>
              &larr;
            </button>
            <span className="debate-detail__title">{debate.activeDebate.title}</span>
          </div>

          {/* Scrollable content area */}
          <div className="debate-detail__scroll">
            {/* Original post */}
            <div className="debate-detail__post">
              <div className="debate-detail__meta">
                <span className="debate-detail__author">{debate.activeDebate.author}</span>
                <span className="debate-detail__time">
                  {formatTimeAgo(debate.activeDebate.created_at, t)}
                </span>
                <button
                  className="debate-detail__invite"
                  onClick={handleInvite}
                  title={t('community.debate.invite')}
                >
                  {t('community.debate.invite')}
                </button>
                {debate.activeDebate.isOwner && (
                  <button
                    className="debate-reply__delete"
                    onClick={() => setConfirmDelete({ type: 'debate', id: debate.activeDebate.id })}
                    title={t('community.debate.deleteDebate')}
                  >
                    &times;
                  </button>
                )}
              </div>
              {debate.activeDebate.content && (
                <div className="debate-detail__content">{debate.activeDebate.content}</div>
              )}
              <TranslateButton
                text={
                  (debate.activeDebate.title || '') +
                  (debate.activeDebate.content ? '\n\n' + debate.activeDebate.content : '')
                }
              />
            </div>

            {/* Replies */}
            <div className="debate-detail__replies">
              {debate.loading && debate.replies.length === 0 && (
                <div className="debate-panel__empty">{t('community.debate.loading')}</div>
              )}
              {!debate.loading && debate.replies.length === 0 && (
                <div className="debate-panel__empty">{t('community.debate.noReplies')}</div>
              )}
              {debate.replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  onVote={debate.voteReply}
                  onDelete={(replyId) => setConfirmDelete({ type: 'reply', id: replyId })}
                  onEdit={() => {}}
                  t={t}
                  isColloquium={false}
                  lang={coll.lang}
                  hasVerdict={!!debate.wrapup}
                />
              ))}
            </div>

            {/* Wrap-up section — after all replies so user reads debate first */}
            {debate.wrapup ? (
              <div className="debate-wrapup">
                {showFinalTime && (
                  <div
                    className={`debate-wrapup-timer debate-wrapup-timer--final${fadingOut ? ' debate-wrapup-timer--fade-out' : ''}`}
                  >
                    <div className="debate-wrapup-timer__row">
                      <div className="debate-wrapup-timer__icon">&#9201;</div>
                      <div className="debate-wrapup-timer__chrono">{formatTime(wrapupElapsed)}</div>
                    </div>
                  </div>
                )}
                <div className="debate-wrapup__header">
                  <svg
                    className="debate-wrapup__icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span>{t('community.debate.wrapupTitle')}</span>
                </div>
                {debate.wrapupAudioUrl && debate.activeDebate && (
                  <WrapupAudioPlayer threadId={debate.activeDebate.id} />
                )}
                {!debate.wrapupAudioUrl && debate.activeDebate?.isOwner && (
                  <button
                    className="debate-wrapup__retry-audio"
                    onClick={debate.requestWrapup}
                    disabled={debate.wrapupLoading}
                  >
                    {debate.wrapupLoading
                      ? t('community.debate.requestingWrapup')
                      : t('community.debate.retryAudio')}
                  </button>
                )}
                <div className="debate-wrapup__content">{debate.wrapup}</div>
                <TranslateButton text={debate.wrapup} />
              </div>
            ) : debate.wrapupLoading ? (
              <div className="debate-wrapup-timer">
                <div className="debate-wrapup-timer__bar-container">
                  <div className="debate-wrapup-timer__bar active">
                    <div className="debate-wrapup-timer__bar-fill"></div>
                    <div className="debate-wrapup-timer__bar-glow"></div>
                  </div>
                  <div className="debate-wrapup-timer__marks">
                    <span className="debate-wrapup-timer__mark" style={{ left: '0%' }}>
                      0
                    </span>
                    <span className="debate-wrapup-timer__mark" style={{ left: '25%' }}>
                      30
                    </span>
                    <span className="debate-wrapup-timer__mark" style={{ left: '50%' }}>
                      60
                    </span>
                    <span className="debate-wrapup-timer__mark" style={{ left: '75%' }}>
                      90
                    </span>
                    <span className="debate-wrapup-timer__mark" style={{ left: '100%' }}>
                      120
                    </span>
                  </div>
                </div>
                <div className="debate-wrapup-timer__row">
                  <div className="debate-wrapup-timer__icon">&#9201;</div>
                  <div className="debate-wrapup-timer__chrono active">
                    {formatTime(wrapupElapsed)}
                  </div>
                </div>
                <div className="debate-wrapup-timer__label">
                  {t('community.debate.requestingWrapup')}
                </div>
              </div>
            ) : (
              debate.activeDebate.isOwner && (
                <div className="debate-wrapup-action">
                  <button
                    className="debate-wrapup__btn"
                    onClick={debate.requestWrapup}
                    disabled={debate.wrapupLoading}
                  >
                    {t('community.debate.wrapUp')}
                  </button>
                  <span className="debate-wrapup__hint">
                    {t('community.debate.wrapupDescription')}
                  </span>
                </div>
              )
            )}

            {debate.error && <div className="debate-panel__error">{debate.error}</div>}
          </div>

          {/* Reply input */}
          {!debate.wrapup && (
            <div className="debate-detail__reply-box">
              <textarea
                ref={replyInputRef}
                className="debate-detail__textarea"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value.slice(0, 3000))}
                onKeyDown={handleReplyKeyDown}
                placeholder={t('community.debate.writeArgument')}
                maxLength={3000}
                rows={2}
                disabled={replying}
              />
              <button
                className="debate-detail__send"
                onClick={handleReply}
                disabled={!replyText.trim() || replying}
              >
                {replying ? '...' : t('community.debate.post')}
              </button>
            </div>
          )}

          {/* Invite people modal */}
          {showInviteModal && debate.activeDebate && (
            <InvitePeopleModal
              debateId={debate.activeDebate.id}
              debateTitle={debate.activeDebate.title}
              onClose={() => setShowInviteModal(false)}
            />
          )}

          {/* Delete confirmation modal */}
          {confirmDelete && (
            <div className="debate-confirm-overlay" onClick={() => setConfirmDelete(null)}>
              <div className="debate-confirm" onClick={(e) => e.stopPropagation()}>
                <p className="debate-confirm__text">
                  {confirmDelete.type === 'debate'
                    ? t('community.debate.confirmDeleteDebate')
                    : t('community.debate.confirmDeleteReply')}
                </p>
                <div className="debate-confirm__actions">
                  <button className="debate-confirm__cancel" onClick={() => setConfirmDelete(null)}>
                    {t('community.debate.cancel')}
                  </button>
                  <button
                    className="debate-confirm__delete"
                    onClick={async () => {
                      const { type, id } = confirmDelete;
                      setConfirmDelete(null);
                      if (type === 'debate') {
                        await debate.deleteDebate(id);
                      } else {
                        await debate.deleteReply(id);
                      }
                    }}
                  >
                    {t('community.debate.confirmDelete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // LOADING: creating colloquium after credit purchase
  // ═════════════════════════════════════════════════════════
  if (creatingPendingProposal) {
    return (
      <div className="debate-creating-overlay">
        <div className="debate-creating-overlay__spinner" />
        <div className="debate-creating-overlay__text">
          {t('community.colloquium.creatingProposal')}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════
  // LIST VIEW - Debates + Colloquium Storefront
  // ═════════════════════════════════════════════════════════

  // Merge and sort: colloquiums first (pinned), then debates by date
  const allItems = [];

  // Add colloquiums first
  for (const c of coll.colloquiums) {
    allItems.push({ ...c, _type: 'colloquium' });
  }
  // Add debates
  for (const d of debate.debates) {
    // Skip colloquiums loaded via debate hook (we have them from colloquium hook)
    if (d.category === 'colloquium') continue;
    allItems.push({ ...d, _type: 'debate' });
  }

  // Sort: today's daily colloquium first, then by last activity
  const isTodaysDailyColloquium = (item) => {
    if (item._type !== 'colloquium') return false;
    const collType = item.metadata?.colloquium_type || item.colloquium_type;
    if (collType !== 'daily') return false;
    const created = new Date(item.created_at);
    const today = new Date();
    return created.toDateString() === today.toDateString();
  };

  allItems.sort((a, b) => {
    const aIsToday = isTodaysDailyColloquium(a);
    const bIsToday = isTodaysDailyColloquium(b);
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    const aDate = a.last_reply_at || a.created_at;
    const bDate = b.last_reply_at || b.created_at;
    return new Date(bDate) - new Date(aDate);
  });

  return (
    <div className="debate-panel">
      <div className="debate-panel__header">
        <span className="debate-panel__title">{t('community.debate.title')}</span>
        <div className="debate-panel__header-buttons">
          <button className="debate-panel__open-debate-btn" onClick={() => setShowOpenDebate(true)}>
            {t('community.colloquium.openDebateBtn')}
          </button>
          <button className="debate-panel__propose-btn" onClick={() => setShowPropose(true)}>
            {t('community.colloquium.propose')}
          </button>
          <button className="debate-panel__new-btn" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? t('community.debate.cancel') : t('community.debate.startDebate')}
          </button>
        </div>
      </div>

      <p className="debate-panel__desc">{t('community.debate.description')}</p>

      {/* Create new debate form */}
      {showCreate && (
        <div className="debate-create">
          <input
            type="text"
            className="debate-create__title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value.slice(0, 200))}
            placeholder={t('community.debate.questionPlaceholder')}
            maxLength={200}
            autoFocus
          />
          <textarea
            className="debate-create__content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value.slice(0, 5000))}
            placeholder={t('community.debate.contextPlaceholder')}
            maxLength={5000}
            rows={3}
          />
          <button
            className="debate-create__submit"
            onClick={handleCreate}
            disabled={
              !newTitle.trim() || !newContent.trim() || newContent.trim().length < 10 || creating
            }
          >
            {creating ? '...' : t('community.debate.create')}
          </button>
          {debate.error && <div className="debate-panel__error">{debate.error}</div>}
        </div>
      )}

      {/* Merged list */}
      <div className="debate-panel__list">
        {(debate.loading || coll.loading) && allItems.length === 0 && (
          <div className="debate-panel__empty">{t('community.debate.loading')}</div>
        )}
        {!debate.loading && !coll.loading && allItems.length === 0 && (
          <div className="debate-panel__empty">{t('community.debate.noDebates')}</div>
        )}
        {allItems.map((item) =>
          item._type === 'colloquium' ? (
            <ColloquiumListItem
              key={`c-${item.id}`}
              item={item}
              onOpen={handleOpenColloquium}
              t={t}
              lang={coll.lang}
            />
          ) : (
            <DebateListItem key={`d-${item.id}`} debate={item} onOpen={debate.openDebate} t={t} />
          )
        )}
        {(debate.hasMore || coll.hasMore) && (
          <button
            className="debate-panel__load-more"
            onClick={() => {
              const lastDebate = debate.debates[debate.debates.length - 1];
              const lastColl = coll.colloquiums[coll.colloquiums.length - 1];
              if (lastDebate) debate.loadDebates(lastDebate.last_reply_at || lastDebate.created_at);
              if (lastColl) coll.loadColloquiums(lastColl.last_reply_at || lastColl.created_at);
            }}
            disabled={debate.loading || coll.loading}
          >
            {debate.loading || coll.loading
              ? t('community.debate.loading')
              : t('community.debate.loadMore')}
          </button>
        )}
      </div>

      {/* Propose Colloquium Modal */}
      {showPropose && (
        <ProposeModal
          onClose={() => setShowPropose(false)}
          onSubmit={handlePropose}
          loading={coll.actionLoading}
          error={coll.error}
          t={t}
        />
      )}

      {/* Open Debate Modal */}
      {showOpenDebate && (
        <OpenDebateModal
          onClose={() => setShowOpenDebate(false)}
          onSubmit={handleProposeOpenDebate}
          loading={coll.actionLoading}
          error={coll.error}
          t={t}
        />
      )}

      {/* Buy Credits Modal (opens on insufficient credits) */}
      <PaymentModal isOpen={coll.showBuyCredits} onClose={coll.dismissBuyCredits} />
    </div>
  );
}

export default DebatePanel;
