// ============================================================
// useIdeas Hook - Ideas Sidebar State Management
// ============================================================
// Manages the Ideas sidebar for Debates and Colloquiums.
// Same pattern as useCommunity but single-purpose for Ideas category.

import { useState, useCallback } from 'react';

/**
 * Ideas sidebar state management hook.
 * Handles sidebar visibility and deep link debate IDs.
 */
export function useIdeas() {
  const [isOpen, setIsOpen] = useState(false);
  const [deepLinkDebateId, setDeepLinkDebateId] = useState(null);

  // Open the sidebar (optionally with a specific debate ID)
  const open = useCallback((debateId = null) => {
    if (debateId) {
      setDeepLinkDebateId(debateId);
    }
    setIsOpen(true);
  }, []);

  // Close the sidebar
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Toggle sidebar
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Clear deep link after it's been consumed
  const clearDeepLinkDebate = useCallback(() => {
    setDeepLinkDebateId(null);
  }, []);

  // Open with a specific debate (for history navigation)
  const openWithDebate = useCallback((debateId) => {
    setDeepLinkDebateId(debateId);
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    deepLinkDebateId,
    clearDeepLinkDebate,
    openWithDebate,
  };
}

export default useIdeas;
