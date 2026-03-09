// ============================================================
// useColloquium - Hook for Academic Colloquium marketplace
// ============================================================
// Manages storefront listing, credit-gated access/participate,
// propose flow, add-philosopher, and language-aware rendering.

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as colloquiumService from '../services/api/colloquium.js';
import * as forumService from '../services/api/forum.js';
import { getRealtimeClient } from '../services/realtime.js';
import { logger, setPendingAction } from '../utils';

/**
 * Get localized content from metadata translations.
 * Falls back to English then to raw content.
 * @param {Object} translations - { en: "...", pt: "...", ... }
 * @param {string} lang - Current language code
 * @param {string} fallback - Raw content to fall back to
 * @returns {string}
 */
export function getLocalizedContent(translations, lang, fallback) {
  if (!translations) return fallback || '';
  // Try exact match, then base lang (e.g., "pt" from "pt-BR"), then fallback
  const baseLang = lang?.split('-')[0] || 'en';
  return translations[lang] || translations[baseLang] || translations.en || fallback || '';
}

export function useColloquium() {
  const { i18n } = useTranslation();
  const [colloquiums, setColloquiums] = useState([]);
  const [activeColloquium, setActiveColloquium] = useState(null);
  const [replies, setReplies] = useState([]);
  const [accessState, setAccessState] = useState(null); // { hasAccess, canParticipate, isProposer }
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // For credit actions
  const [verdictLoading, setVerdictLoading] = useState(false); // Verdict generation in progress
  const [error, setError] = useState(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false); // Opens purchase modal
  const [hasMore, setHasMore] = useState(false);
  const [poll, setPoll] = useState(null); // { tallies, myVote, totalVotes }

  // Current language for translation lookups
  const lang = i18n.language || 'en';

  // ─── Realtime subscription for live updates ───────────────
  const channelRef = useRef(null);
  const clientRef = useRef(null);
  const debounceRef = useRef(null);

  // Stable ref for openColloquium so the broadcast handler always has latest
  const openColloquiumRef = useRef(null);

  useEffect(() => {
    const threadId = activeColloquium?.id;
    if (!threadId || activeColloquium?._needsAccess) return;

    let cancelled = false;

    async function initRealtimeSubscription() {
      try {
        const sb = await getRealtimeClient();
        if (cancelled) return;
        clientRef.current = sb;

        const channelName = `colloquium:${threadId}`;
        logger.log(`[useColloquium] Subscribing to ${channelName}...`);

        const channel = sb
          .channel(channelName)
          .on('broadcast', { event: 'new-reply' }, () => {
            logger.log(`[useColloquium] Broadcast: new-reply for ${threadId}`);
            // Debounce refetch — multiple replies may arrive in quick succession
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (!cancelled && openColloquiumRef.current) {
                openColloquiumRef.current(threadId, { silent: true });
              }
            }, 3000);
          })
          .on('broadcast', { event: 'thread-updated' }, () => {
            logger.log(`[useColloquium] Broadcast: thread-updated for ${threadId}`);
            clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              if (!cancelled && openColloquiumRef.current) {
                openColloquiumRef.current(threadId, { silent: true });
              }
            }, 2000);
          })
          .on('broadcast', { event: 'poll-updated' }, (msg) => {
            logger.log(`[useColloquium] Broadcast: poll-updated for ${threadId}`);
            const { tallies, totalVotes } = msg.payload || {};
            if (tallies != null) {
              setPoll((prev) => ({ ...prev, tallies, totalVotes }));
            }
          })
          .subscribe((status, err) => {
            logger.log(
              `[useColloquium] Subscription status: ${status}`,
              err ? `error: ${err.message}` : ''
            );
          });

        channelRef.current = channel;
      } catch (err) {
        logger.error('[useColloquium] Realtime init error:', err.message);
      }
    }

    initRealtimeSubscription();

    return () => {
      cancelled = true;
      clearTimeout(debounceRef.current);
      if (channelRef.current && clientRef.current) {
        clientRef.current.removeChannel(channelRef.current);
      }
      channelRef.current = null;
    };
  }, [activeColloquium?.id, activeColloquium?._needsAccess]);

  // ─── iOS: Refresh data after reconnection ──────────────────
  // When WebSocket reconnects (e.g., after iOS background), refetch
  // the active colloquium to catch any missed updates.
  useEffect(() => {
    const handleReconnect = () => {
      const threadId = activeColloquium?.id;
      if (threadId && !activeColloquium?._needsAccess && openColloquiumRef.current) {
        logger.log(`[useColloquium] Reconnect detected, refreshing thread ${threadId}`);
        openColloquiumRef.current(threadId, { silent: true });
      }
    };

    window.addEventListener('realtime-reconnected', handleReconnect);
    return () => window.removeEventListener('realtime-reconnected', handleReconnect);
  }, [activeColloquium?.id, activeColloquium?._needsAccess]);

  // ─── Storefront ───────────────────────────────────────────
  const loadColloquiums = useCallback(async (before) => {
    setLoading(true);
    setError(null);
    try {
      const data = await colloquiumService.getColloquiums({ before });
      const items = data.colloquiums || [];
      if (before) {
        setColloquiums((prev) => [...prev, ...items]);
      } else {
        setColloquiums(items);
      }
      setHasMore(items.length >= 20);
    } catch (err) {
      logger.error('[Colloquium] Load error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Open colloquium detail (requires access) ─────────────
  const openColloquium = useCallback(
    async (threadId, { silent = false } = {}) => {
      setLoading(true);
      setError(null);
      if (!silent) {
        // Full open: clear previous state (shows loading skeleton)
        setReplies([]);
        setActiveColloquium(null);
        setAccessState(null);
        setPoll(null);
      }
      try {
        const data = await colloquiumService.getColloquium(threadId, lang);
        setActiveColloquium(data.thread || null);
        setReplies(data.replies || []);
        setAccessState(data.access || null);
        setPoll(data.poll || null);
      } catch (err) {
        if (err.code === 'ACCESS_REQUIRED') {
          // User doesn't have access yet — use storefront data or a minimal placeholder
          const storefrontItem = colloquiums.find((c) => c.id === threadId);
          setActiveColloquium({
            ...(storefrontItem || { id: threadId }),
            _needsAccess: true,
          });
          setAccessState({ hasAccess: false, canParticipate: false, isProposer: false });
        } else {
          logger.error('[Colloquium] Open error:', err.message);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [colloquiums, lang]
  );

  // Keep ref in sync so broadcast handler always calls the latest openColloquium
  useEffect(() => {
    openColloquiumRef.current = openColloquium;
  }, [openColloquium]);

  // ─── Close detail ─────────────────────────────────────────
  const closeColloquium = useCallback(() => {
    setActiveColloquium(null);
    setReplies([]);
    setAccessState(null);
    setPoll(null);
    setError(null);
  }, []);

  // ─── Delete colloquium (proposer or admin) ────────────────
  const deleteColloquium = useCallback(async (threadId, { asAdmin = false } = {}) => {
    setActionLoading(true);
    setError(null);
    try {
      let secret = null;
      if (asAdmin) {
        secret = sessionStorage.getItem('adminSecret') || window.prompt('Admin secret:');
        if (!secret) return { success: false };
        sessionStorage.setItem('adminSecret', secret);
      }

      await colloquiumService.deleteColloquium(threadId, secret);

      // Remove from local list and close detail
      setColloquiums((prev) => prev.filter((c) => c.id !== threadId));
      setActiveColloquium(null);
      setReplies([]);
      setAccessState(null);
      return { success: true };
    } catch (err) {
      logger.error('[Colloquium] Delete error:', err.message);
      if (asAdmin && err.message?.includes('Forbidden')) {
        sessionStorage.removeItem('adminSecret');
      }
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ─── Pay 1 credit for access ──────────────────────────────
  const unlockAccess = useCallback(
    async (threadId) => {
      setActionLoading(true);
      setError(null);
      try {
        const data = await colloquiumService.accessColloquium(threadId);
        if (data.success) {
          // Notify credit system
          window.dispatchEvent(new CustomEvent('credits-changed'));
          // Reload the full thread now that we have access
          await openColloquium(threadId, { silent: true });
        } else if (data.error) {
          setError(data.error);
        }
        return data;
      } catch (err) {
        logger.error('[Colloquium] Access error:', err.message);
        if (err.code === 'INSUFFICIENT_CREDITS') {
          setPendingAction({ type: 'colloquium:access', threadId });
          setShowBuyCredits(true);
        } else {
          setError(err.message);
        }
        return { success: false, error: err.message, code: err.code };
      } finally {
        setActionLoading(false);
      }
    },
    [openColloquium]
  );

  // ─── Pay 1-2 credits for participation ────────────────────
  const unlockParticipation = useCallback(async (threadId) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await colloquiumService.participateColloquium(threadId);
      if (data.success) {
        window.dispatchEvent(new CustomEvent('credits-changed'));
        setAccessState((prev) => (prev ? { ...prev, canParticipate: true } : prev));
      } else if (data.error) {
        setError(data.error);
      }
      return data;
    } catch (err) {
      logger.error('[Colloquium] Participate error:', err.message);
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setPendingAction({ type: 'colloquium:participate', threadId });
        setShowBuyCredits(true);
      } else {
        setError(err.message);
      }
      return { success: false, error: err.message, code: err.code };
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ─── Add a philosopher (2-3 credits) ──────────────────────
  const addPhilosopher = useCallback(async (threadId, philosopherName) => {
    setActionLoading(true);
    setError(null);
    try {
      const data = await colloquiumService.addPhilosopher(threadId, philosopherName);
      if (data.success) {
        window.dispatchEvent(new CustomEvent('credits-changed'));
        // Optimistically add philosopher to local state so chip appears immediately.
        // The background job updates the DB; broadcast will confirm on completion.
        setActiveColloquium((prev) => {
          if (!prev) return prev;
          const currentList = prev.metadata?.philosophers || prev.philosophers || [];
          if (currentList.includes(philosopherName)) return prev;
          const currentPrices = prev.metadata?.philosopher_prices || prev.philosopher_prices || {};
          const newPrices = { ...currentPrices, [philosopherName]: data.price || 2 };
          return {
            ...prev,
            metadata: {
              ...(prev.metadata || {}),
              philosophers: [...currentList, philosopherName],
              philosopher_prices: newPrices,
            },
          };
        });
      } else if (data.error) {
        setError(data.error);
      }
      return data;
    } catch (err) {
      logger.error('[Colloquium] Add philosopher error:', err.message);
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setPendingAction({
          type: 'colloquium:addPhilosopher',
          threadId,
          philosopher: philosopherName,
        });
        setShowBuyCredits(true);
      } else if (err.code === 'CREATION_TIMEOUT') {
        // Credits were confirmed before background work — treat as success
        logger.log(
          '[Colloquium] Add philosopher timeout, credits confirmed. Waiting for broadcast...'
        );
        window.dispatchEvent(new CustomEvent('credits-changed'));
        return { success: true, timeout: true };
      } else {
        setError(err.message);
      }
      return { success: false, error: err.message, code: err.code };
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ─── Propose a new colloquium (5 credits) ─────────────────
  const propose = useCallback(
    async (title, content, visibility) => {
      setActionLoading(true);
      setError(null);
      try {
        const lang = i18n.language?.split('-')[0] || 'en';
        const data = await colloquiumService.proposeColloquium(title, content, visibility, lang);
        if (data.success) {
          window.dispatchEvent(new CustomEvent('credits-changed'));
          // Reload the storefront to show the new colloquium
          await loadColloquiums();
        }
        return data;
      } catch (err) {
        logger.error('[Colloquium] Propose error:', err.message);
        if (err.code === 'INSUFFICIENT_CREDITS') {
          setPendingAction({ type: 'colloquium:propose', title, content, visibility });
          setShowBuyCredits(true);
        } else if (err.code === 'CREATION_TIMEOUT') {
          // Thread was likely created despite timeout — wait then reload
          logger.log('[Colloquium] Timeout detected, waiting 5s then reloading...');
          await new Promise((r) => setTimeout(r, 5000));
          window.dispatchEvent(new CustomEvent('credits-changed'));
          await loadColloquiums();
          return { success: true, timeout: true };
        } else {
          setError(err.message);
        }
        return { success: false, error: err.message, code: err.code };
      } finally {
        setActionLoading(false);
      }
    },
    [loadColloquiums, i18n.language]
  );

  // ─── Propose an Open Debate (3 credits) ────────────────────
  const proposeOpenDebate = useCallback(
    async (title, content) => {
      setActionLoading(true);
      setError(null);
      try {
        const lang = i18n.language?.split('-')[0] || 'en';
        const data = await colloquiumService.proposeOpenDebate(title, content, lang);
        if (data.success) {
          window.dispatchEvent(new CustomEvent('credits-changed'));
          await loadColloquiums();
        }
        return data;
      } catch (err) {
        logger.error('[Colloquium] Open debate propose error:', err.message);
        if (err.code === 'INSUFFICIENT_CREDITS') {
          setPendingAction({ type: 'colloquium:proposeOpenDebate', title, content });
          setShowBuyCredits(true);
        } else if (err.code === 'CREATION_TIMEOUT') {
          logger.log('[Colloquium] Timeout detected, waiting 5s then reloading...');
          await new Promise((r) => setTimeout(r, 5000));
          window.dispatchEvent(new CustomEvent('credits-changed'));
          await loadColloquiums();
          return { success: true, timeout: true };
        } else {
          setError(err.message);
        }
        return { success: false, error: err.message, code: err.code };
      } finally {
        setActionLoading(false);
      }
    },
    [loadColloquiums, i18n.language]
  );

  // ─── Proposer: trigger verdict for open debate ────────────
  const proposerVerdict = useCallback(
    async (threadId) => {
      setActionLoading(true);
      setVerdictLoading(true);
      setError(null);
      try {
        const data = await colloquiumService.triggerProposerVerdict(threadId, lang);
        if (data.success) {
          await openColloquium(threadId, { silent: true });
        }
        return data;
      } catch (err) {
        logger.error('[Colloquium] Proposer verdict error:', err.message);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setActionLoading(false);
        setVerdictLoading(false);
      }
    },
    [openColloquium, lang]
  );

  // ─── Invite a user (proposer only, free) ──────────────────
  const inviteUser = useCallback(async (threadId, userId) => {
    setError(null);
    try {
      const data = await colloquiumService.inviteToColloquium(threadId, userId);
      return data;
    } catch (err) {
      logger.error('[Colloquium] Invite error:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ─── Reply to active colloquium (uses forum service) ──────
  const addReply = useCallback(
    async (content) => {
      if (!activeColloquium) return null;
      setError(null);
      try {
        const data = await forumService.createForumReply(activeColloquium.id, { content });
        if (data.reply) {
          setReplies((prev) => [...prev, data.reply]);
          setActiveColloquium((prev) =>
            prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : prev
          );
        }
        return data.reply;
      } catch (err) {
        logger.error('[Colloquium] Reply error:', err.message);
        setError(err.message);
        return null;
      }
    },
    [activeColloquium]
  );

  // ─── Vote on a reply ──────────────────────────────────────
  const voteReply = useCallback(async (replyId, voteType) => {
    try {
      const data = await forumService.voteForumReply(replyId, voteType);
      setReplies((prev) =>
        prev.map((r) => {
          if (r.id !== replyId) return r;
          return {
            ...r,
            upvotes: data.upvotes ?? r.upvotes,
            downvotes: data.downvotes ?? r.downvotes,
            myVote: voteType,
          };
        })
      );
      return true;
    } catch (err) {
      logger.warn('[Colloquium] Vote error:', err.message);
      return false;
    }
  }, []);

  // ─── Cast a philosopher poll vote ──────────────────────────
  const castPollVote = useCallback(async (threadId, philosopherName) => {
    try {
      const data = await colloquiumService.castPollVote(threadId, philosopherName);
      if (data.poll) {
        setPoll(data.poll);
      }
      return true;
    } catch (err) {
      logger.warn('[Colloquium] Poll vote error:', err.message);
      return false;
    }
  }, []);

  // ─── Edit a reply (before verdict) ─────────────────────────
  const editReply = useCallback(async (replyId, content) => {
    try {
      const data = await forumService.editForumReply(replyId, content);
      if (data.reply) {
        setReplies((prev) =>
          prev.map((r) => {
            if (r.id !== replyId) return r;
            return { ...r, content: data.reply.content, edited_at: data.reply.edited_at };
          })
        );
      }
      return true;
    } catch (err) {
      logger.warn('[Colloquium] Edit reply error:', err.message);
      setError(err.message);
      return false;
    }
  }, []);

  // ─── Delete a reply (before verdict) ──────────────────────
  const deleteReply = useCallback(async (replyId) => {
    try {
      await forumService.deleteForumReply(replyId);
      setReplies((prev) => prev.filter((r) => r.id !== replyId));
      setActiveColloquium((prev) =>
        prev ? { ...prev, reply_count: Math.max(0, (prev.reply_count || 1) - 1) } : prev
      );
      return true;
    } catch (err) {
      logger.warn('[Colloquium] Delete reply error:', err.message);
      setError(err.message);
      return false;
    }
  }, []);

  // ─── Dismiss buy-credits modal ─────────────────────────────
  const dismissBuyCredits = useCallback(() => {
    setShowBuyCredits(false);
  }, []);

  // ─── Admin: trigger verdict ─────────────────────────────────
  const triggerVerdict = useCallback(
    async (threadId) => {
      const secret = sessionStorage.getItem('adminSecret') || window.prompt('Admin secret:');
      if (!secret) return { success: false };
      sessionStorage.setItem('adminSecret', secret);

      setActionLoading(true);
      setVerdictLoading(true);
      setError(null);
      try {
        const data = await colloquiumService.triggerVerdict(threadId, secret);
        if (data.success) {
          await openColloquium(threadId, { silent: true });
        }
        return data;
      } catch (err) {
        logger.error('[Colloquium] Verdict error:', err.message);
        if (err.status === 403) {
          sessionStorage.removeItem('adminSecret');
        }
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setActionLoading(false);
        setVerdictLoading(false);
      }
    },
    [openColloquium]
  );

  // ─── Retry failed generation (proposer only, no credits) ───
  const retryGeneration = useCallback(
    async (threadId) => {
      setActionLoading(true);
      setError(null);
      try {
        const data = await colloquiumService.retryGeneration(threadId);
        if (data.success) {
          // Refetch to clear generation_failed flag in UI
          await openColloquium(threadId, { silent: true });
        }
        return data;
      } catch (err) {
        logger.error('[Colloquium] Retry generation error:', err.message);
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setActionLoading(false);
      }
    },
    [openColloquium]
  );

  // ─── Load philosopher roster ──────────────────────────────
  const loadRoster = useCallback(async () => {
    try {
      const data = await colloquiumService.getPhilosopherRoster();
      setRoster(data.roster || []);
      return data.roster || [];
    } catch (err) {
      logger.error('[Colloquium] Roster error:', err.message);
      return [];
    }
  }, []);

  return {
    // State
    colloquiums,
    activeColloquium,
    replies,
    accessState,
    roster,
    poll,
    loading,
    actionLoading,
    verdictLoading,
    error,
    hasMore,
    lang,
    showBuyCredits,
    // Actions
    loadColloquiums,
    openColloquium,
    closeColloquium,
    deleteColloquium,
    unlockAccess,
    unlockParticipation,
    addPhilosopher,
    propose,
    proposeOpenDebate,
    inviteUser,
    addReply,
    editReply,
    deleteReply,
    voteReply,
    castPollVote,
    loadRoster,
    dismissBuyCredits,
    triggerVerdict,
    proposerVerdict,
    retryGeneration,
  };
}

export default useColloquium;
