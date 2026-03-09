// ============================================================
// useChat Hook - Global Chat with Supabase Realtime
// ============================================================
// Uses private database broadcast via shared Realtime client singleton.
// Token management handled by useAuth + realtime.js centrally.
import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService } from '../services/api/chat.js';
import { useAuth } from './useAuth.js';
import { getRealtimeClient, waitForAuth } from '../services/realtime.js';
import { logger } from '../utils';

export function useChat() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const channelRef = useRef(null);
  const clientRef = useRef(null);
  const initedRef = useRef(false);

  // Initialize Supabase Realtime broadcast listener for Agora.
  // PUBLIC channel (no RLS check) — Agora is open to all authenticated users.
  // Token auth is still applied for connection-level auth, but channel-level
  // RLS is skipped. The DB trigger uses private=FALSE for Agora.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (initedRef.current) return;

    let cancelled = false;
    initedRef.current = true;

    async function initRealtime() {
      try {
        // Wait for auth so the WS connection itself is authenticated
        await waitForAuth();
        if (cancelled) return;

        const sb = await getRealtimeClient();
        if (cancelled) return;
        clientRef.current = sb;

        logger.log('[useChat] Subscribing to agora channel (public broadcast)...');

        // PUBLIC broadcast — no private:true, no per-subscriber RLS check.
        // Trigger sends with private=FALSE, all connected clients receive.
        const channel = sb
          .channel('agora')
          .on('broadcast', { event: 'new-message' }, ({ payload }) => {
            logger.log('[useChat] Broadcast received:', payload?.id);
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.id)) return prev;
              return [...prev, payload];
            });
          })
          .on('broadcast', { event: 'message-deleted' }, ({ payload }) => {
            logger.log('[useChat] Message deleted broadcast:', payload?.id);
            setMessages((prev) => prev.filter((m) => m.id !== payload.id));
          })
          .on('broadcast', { event: 'message-edited' }, ({ payload }) => {
            logger.log('[useChat] Message edited broadcast:', payload?.id);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === payload.id
                  ? { ...m, message: payload.message, edited_at: payload.edited_at }
                  : m
              )
            );
          })
          .subscribe((status, err) => {
            logger.log(
              '[useChat] Subscription status:',
              status,
              err ? `error: ${err.message}` : ''
            );
          });

        channelRef.current = channel;
      } catch (err) {
        console.error('[useChat] Realtime init error:', err);
        initedRef.current = false; // Allow retry
      }
    }

    initRealtime();

    return () => {
      cancelled = true;
      // removeChannel() unsubscribes AND removes from client's internal list,
      // preventing stale channel reuse on re-mount.
      if (channelRef.current && clientRef.current) {
        clientRef.current.removeChannel(channelRef.current);
      }
      channelRef.current = null;
      initedRef.current = false;
    };
  }, [isAuthenticated]);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);

    try {
      const { messages: data } = await chatService.getMessages();
      // API returns newest-first; reverse for display (oldest first)
      setMessages((data || []).reverse());
      setHasMore((data || []).length >= 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load more (older messages)
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || messages.length === 0) return;

    const oldestTimestamp = messages[0]?.created_at;
    if (!oldestTimestamp) return;

    setLoading(true);
    try {
      const { messages: older } = await chatService.getMessages(oldestTimestamp);
      const reversed = (older || []).reverse();
      setMessages((prev) => [...reversed, ...prev]);
      setHasMore((older || []).length >= 50);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, messages]);

  // Send message with optimistic UI
  const sendMessage = useCallback(
    async (text, options = {}) => {
      if (!isAuthenticated || sending) return;
      setSending(true);
      setError(null);

      const replyToId = options.replyToId || null;

      // Optimistic: show message immediately with a temp ID
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg = {
        id: tempId,
        message: text,
        user_id: user?.id,
        display_name: user?.user_metadata?.display_name || user?.email || 'You',
        created_at: new Date().toISOString(),
        reply_to_id: replyToId,
        reply_preview: replyingTo
          ? {
              id: replyingTo.id,
              senderName: replyingTo.display_name,
              message: replyingTo.message?.slice(0, 100) || '',
            }
          : null,
        _optimistic: true,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Clear reply state
      if (replyingTo) setReplyingTo(null);

      try {
        const result = await chatService.sendMessage(text, { replyToId });
        // Replace optimistic message with real one from server
        if (result?.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...result.message, _optimistic: false } : m))
          );
        }
      } catch (err) {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(err.message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [isAuthenticated, sending, user, replyingTo]
  );

  // Edit own message
  const editMessage = useCallback(
    async (messageId, newText) => {
      if (!isAuthenticated) return;
      setError(null);

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, message: newText, edited_at: new Date().toISOString() } : m
        )
      );
      setEditingMessage(null);

      try {
        const result = await chatService.editMessage(messageId, newText);
        // Update with server response
        if (result?.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, ...result.message } : m))
          );
        }
      } catch (err) {
        // Revert on failure — reload from server
        setError(err.message);
        loadMessages();
      }
    },
    [isAuthenticated, loadMessages]
  );

  // Delete own message (hard delete)
  const deleteMessage = useCallback(
    async (messageId) => {
      if (!isAuthenticated) return;
      setError(null);

      // Optimistic removal
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        await chatService.deleteMessage(messageId);
      } catch (err) {
        // Revert on failure — reload from server
        setError(err.message);
        loadMessages();
      }
    },
    [isAuthenticated, loadMessages]
  );

  // Auto-load on auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [isAuthenticated, loadMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
    loadMore,
    refresh: loadMessages,
    userId: user?.id,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
  };
}

export default useChat;
