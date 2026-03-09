// ============================================================
// useDMUnreadCount - Lightweight hook for DM unread badge count
// ============================================================
// Fetches unread count on mount and listens for 'dm-received' custom
// events dispatched by useDM when a realtime message arrives.
// No independent Realtime subscription — avoids channel conflict with useDM.

import { useState, useEffect, useCallback } from 'react';
import { dmService } from '../services/api/dm.js';
import { useAuth } from './useAuth.js';

export function useDMUnreadCount() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const data = await dmService.getConversations();
      const total = (data.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(total);
    } catch (err) {
      console.warn('[useDMUnreadCount] Failed to fetch:', err.message);
    }
  }, [isAuthenticated]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchUnreadCount sets state internally; intentional data fetch on mount
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Listen for 'dm-received' events dispatched by useDM on incoming messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleDMReceived = () => {
      setUnreadCount((prev) => prev + 1);
    };

    window.addEventListener('dm-received', handleDMReceived);
    return () => window.removeEventListener('dm-received', handleDMReceived);
  }, [isAuthenticated]);

  const refresh = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const clearCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return { unreadCount, refresh, clearCount };
}

export default useDMUnreadCount;
