// ============================================================
// HOOK - useUnsafeZone
// Simple open/close state. Conversation state lives in the
// sidebar component (client-only, no Supabase storage).
// ============================================================

import { useState, useCallback } from 'react';

export function useUnsafeZone() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle };
}
