// ============================================================
// usePresence - Track online users via Supabase Realtime Presence
// ============================================================
// Subscribes to a shared presence channel when the Community Hub is open.
// Provides a Set of currently online user IDs.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth.js';
import { getRealtimeClient, waitForAuth } from '../services/realtime.js';
import { logger } from '../utils';

export function usePresence(isActive = false) {
  const { user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const channelRef = useRef(null);
  const clientRef = useRef(null);
  const initedRef = useRef(false);

  useEffect(() => {
    // Only track presence when authenticated and hub is active
    if (!isAuthenticated || !user?.id || !isActive) {
      // Clean up if we were tracking
      if (channelRef.current && clientRef.current) {
        clientRef.current.removeChannel(channelRef.current);
        channelRef.current = null;
        initedRef.current = false;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional state reset when deactivating
      setOnlineUsers(new Set());
      return;
    }

    if (initedRef.current) return;

    let cancelled = false;
    initedRef.current = true;

    async function initPresence() {
      try {
        await waitForAuth();
        if (cancelled) return;

        const sb = await getRealtimeClient();
        if (cancelled) return;
        clientRef.current = sb;

        const channel = sb.channel('presence:online', {
          config: { presence: { key: user.id } },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const ids = new Set(Object.keys(state));
            setOnlineUsers(ids);
            logger.log(`[Presence] Sync: ${ids.size} user(s) online`);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Track our presence
              await channel.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              });
              logger.log('[Presence] Tracking active');
            }
          });

        channelRef.current = channel;
      } catch (err) {
        logger.warn('[Presence] Init failed:', err.message);
        initedRef.current = false;
      }
    }

    initPresence();

    return () => {
      cancelled = true;
      if (channelRef.current && clientRef.current) {
        clientRef.current.removeChannel(channelRef.current);
      }
      channelRef.current = null;
      initedRef.current = false;
    };
  }, [isAuthenticated, user?.id, isActive]);

  // Check if a specific user is online
  const isOnline = useCallback((userId) => onlineUsers.has(userId), [onlineUsers]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.size,
    isOnline,
  };
}

export default usePresence;
