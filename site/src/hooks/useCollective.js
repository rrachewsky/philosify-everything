// ============================================================
// useCollective Hook - Collective Detail with Supabase Realtime
// ============================================================
// Uses shared Realtime client singleton for instant message/member updates.
// Token management handled by useAuth + realtime.js centrally.

import { useState, useEffect, useCallback, useRef } from 'react';
import { collectiveService } from '../services/api/collective.js';
import { useAuth } from './useAuth.js';
import { getRealtimeClient, waitForAuth } from '../services/realtime.js';

export function useCollective(groupId) {
  const { user, isAuthenticated } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const chatChannelRef = useRef(null);
  const clientRef = useRef(null);
  const initedRef = useRef(false);

  // Initialize Realtime broadcast subscriptions (private, authenticated)
  // waitForAuth() gates on token. Token refresh handled by setRealtimeAuth().
  useEffect(() => {
    if (!isAuthenticated || !groupId) return;
    if (initedRef.current) return;

    let cancelled = false;
    initedRef.current = true;

    async function initRealtime() {
      try {
        await waitForAuth(); // Ensure token is set before subscribing to private channel
        if (cancelled) return;

        const sb = await getRealtimeClient();
        if (cancelled) return;
        clientRef.current = sb;

        // Single channel for both messages and member changes (private)
        const channel = sb
          .channel(`collective:${groupId}`, { config: { private: true } })
          .on('broadcast', { event: 'new-message' }, ({ payload }) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              return [...prev, payload];
            });
          })
          .on('broadcast', { event: 'member-joined' }, ({ payload }) => {
            setMembers((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              return [...prev, payload];
            });
          })
          .on('broadcast', { event: 'member-left' }, ({ payload }) => {
            setMembers((prev) => prev.filter((m) => m.id !== payload.id));
          })
          .on('broadcast', { event: 'comment-deleted' }, ({ payload }) => {
            console.log('[useCollective] Comment deleted broadcast:', payload?.id);
            setMessages((prev) => prev.filter((m) => m.id !== payload.id));
          })
          .subscribe((status, err) => {
            console.log(
              '[useCollective] Subscription status:',
              status,
              err ? `error: ${err.message}` : ''
            );
          });

        chatChannelRef.current = channel;
      } catch (err) {
        console.error('[useCollective] Realtime init error:', err);
        initedRef.current = false;
      }
    }

    initRealtime();

    return () => {
      cancelled = true;
      if (chatChannelRef.current && clientRef.current) {
        clientRef.current.removeChannel(chatChannelRef.current);
      }
      chatChannelRef.current = null;
      initedRef.current = false;
    };
  }, [isAuthenticated, groupId]);

  // Load group detail
  const loadDetail = useCallback(async () => {
    if (!isAuthenticated || !groupId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await collectiveService.getCollectiveDetail(groupId);
      setGroup(data.group);
      setMembers(data.members || []);
      setMessages(data.messages || []);
      setUserRole(data.userRole);
      setHasMore((data.messages || []).length >= 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, groupId]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || messages.length === 0) return;

    const oldestTimestamp = messages[0]?.created_at;
    if (!oldestTimestamp) return;

    setLoading(true);
    try {
      const { messages: older } = await collectiveService.getCollectiveChat(
        groupId,
        oldestTimestamp
      );
      const reversed = (older || []).reverse();
      setMessages((prev) => [...reversed, ...prev]);
      setHasMore((older || []).length >= 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, messages, groupId]);

  // Send message
  const sendMessage = useCallback(
    async (text, analysisId) => {
      if (!isAuthenticated || sending) return;
      setSending(true);
      setError(null);

      try {
        await collectiveService.sendCollectiveMessage(groupId, text, analysisId);
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [isAuthenticated, sending, groupId]
  );

  // Leave group
  const leaveGroup = useCallback(async () => {
    try {
      await collectiveService.leaveCollective(groupId);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [groupId]);

  // Kick member
  const kickMember = useCallback(
    async (targetUserId) => {
      try {
        await collectiveService.kickMember(groupId, targetUserId);
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [groupId]
  );

  // Auto-load on mount
  useEffect(() => {
    if (isAuthenticated && groupId) {
      loadDetail();
    }
  }, [isAuthenticated, groupId, loadDetail]);

  return {
    group,
    members,
    messages,
    userRole,
    loading,
    error,
    sending,
    hasMore,
    sendMessage,
    loadMore,
    leaveGroup,
    kickMember,
    userId: user?.id,
  };
}

export default useCollective;
