// ============================================================
// HOOK - useUnsafeZone
// Simple open/close state. Conversation state lives in the
// sidebar component (client-only, no Supabase storage).
// ============================================================

import { useState, useCallback } from 'react';

export function useUnsafeZone() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setPendingSessionId(null);
  }, []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Open and immediately resume a specific session from history
  const openWithSession = useCallback((sessionId) => {
    setPendingSessionId(sessionId);
    setIsOpen(true);
  }, []);

  const clearPendingSession = useCallback(() => {
    setPendingSessionId(null);
  }, []);

  return { isOpen, open, close, toggle, openWithSession, pendingSessionId, clearPendingSession };
}
