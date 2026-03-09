// ============================================================
// useDebate - Hook for Debate Mode (wraps forum service)
// ============================================================
// Debates are forum threads with category='debate'.
// Each debate has a question, context, and threaded replies with voting.

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as forumService from '../services/api/forum.js';
import { logger } from '../utils';

export function useDebate() {
  const { i18n } = useTranslation();
  const [debates, setDebates] = useState([]);
  const [activeDebate, setActiveDebate] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [wrapup, setWrapup] = useState(null);
  const [wrapupAudioUrl, setWrapupAudioUrl] = useState(null);
  const [wrapupLoading, setWrapupLoading] = useState(false);

  // Load debates only (colloquiums are now handled by useColloquium)
  const loadDebates = useCallback(async (before) => {
    setLoading(true);
    setError(null);
    try {
      const debateData = await forumService.getForumThreads({ category: 'debate', before });
      const debateThreads = debateData.threads || [];
      if (before) {
        setDebates((prev) => [...prev, ...debateThreads]);
      } else {
        setDebates(debateThreads);
      }
      setHasMore(debateThreads.length >= 20);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load a single debate with its replies
  const openDebate = useCallback(async (debateId) => {
    setLoading(true);
    setError(null);
    setReplies([]);
    setWrapup(null);
    setWrapupAudioUrl(null);
    try {
      const data = await forumService.getForumThread(debateId);
      setActiveDebate(data.thread || null);
      setReplies(data.replies || []);
      // Load cached wrap-up if it exists on the thread
      if (data.thread?.wrapup) {
        setWrapup(data.thread.wrapup);
      }
      if (data.thread?.wrapup_audio_url) {
        setWrapupAudioUrl(data.thread.wrapup_audio_url);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Close active debate
  const closeDebate = useCallback(() => {
    setActiveDebate(null);
    setReplies([]);
    setWrapup(null);
    setWrapupAudioUrl(null);
  }, []);

  // Create a new debate
  const createDebate = useCallback(async (title, content) => {
    setError(null);
    try {
      const data = await forumService.createForumThread({
        title,
        content,
        category: 'debate',
      });
      if (data.thread) {
        setDebates((prev) => [data.thread, ...prev]);
      }
      return data.thread;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Delete a debate (own only)
  const deleteDebate = useCallback(
    async (debateId) => {
      try {
        await forumService.deleteForumThread(debateId);
        setDebates((prev) => prev.filter((d) => d.id !== debateId));
        if (activeDebate?.id === debateId) {
          setActiveDebate(null);
          setReplies([]);
        }
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      }
    },
    [activeDebate]
  );

  // Add a reply to the active debate
  const addReply = useCallback(
    async (content, parentId) => {
      if (!activeDebate) return null;
      setError(null);
      try {
        const data = await forumService.createForumReply(activeDebate.id, {
          content,
          parent_id: parentId || null,
        });
        if (data.reply) {
          setReplies((prev) => [...prev, data.reply]);
          // Update local reply_count on activeDebate and in debates list
          setActiveDebate((prev) =>
            prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : prev
          );
          setDebates((prev) =>
            prev.map((d) =>
              d.id === activeDebate.id ? { ...d, reply_count: (d.reply_count || 0) + 1 } : d
            )
          );
        }
        return data.reply;
      } catch (err) {
        setError(err.message);
        return null;
      }
    },
    [activeDebate]
  );

  // Delete a reply (own only)
  const deleteReply = useCallback(
    async (replyId) => {
      try {
        await forumService.deleteForumReply(replyId);
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
        // Update local reply_count on activeDebate and in debates list
        setActiveDebate((prev) =>
          prev ? { ...prev, reply_count: Math.max((prev.reply_count || 1) - 1, 0) } : prev
        );
        setDebates((prev) =>
          prev.map((d) =>
            d.id === activeDebate?.id
              ? { ...d, reply_count: Math.max((d.reply_count || 1) - 1, 0) }
              : d
          )
        );
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      }
    },
    [activeDebate]
  );

  // Vote on a reply
  const voteReply = useCallback(async (replyId, voteType) => {
    try {
      const data = await forumService.voteForumReply(replyId, voteType);
      // Update reply counts locally
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
      logger.warn('[Debate] Vote error:', err.message);
      return false;
    }
  }, []);

  // Request AI wrap-up (owner only)
  const requestWrapup = useCallback(async () => {
    if (!activeDebate) return null;
    setWrapupLoading(true);
    setError(null);
    try {
      const data = await forumService.wrapupDebate(activeDebate.id, i18n.language);
      if (data.wrapup) {
        setWrapup(data.wrapup);
      }
      if (data.wrapup_audio_url) {
        setWrapupAudioUrl(data.wrapup_audio_url);
      }
      return data.wrapup;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setWrapupLoading(false);
    }
  }, [activeDebate, i18n.language]);

  return {
    debates,
    activeDebate,
    replies,
    loading,
    error,
    hasMore,
    wrapup,
    wrapupAudioUrl,
    wrapupLoading,
    loadDebates,
    openDebate,
    closeDebate,
    createDebate,
    deleteDebate,
    addReply,
    deleteReply,
    voteReply,
    requestWrapup,
  };
}

export default useDebate;
