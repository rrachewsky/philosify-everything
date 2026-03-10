// ============================================================
// useCommunity Hook - Community Hub State Management
// ============================================================
// Manages the sidebar open/close, active tab, and space access.
//
// Spaces:
//   - people       (free)    Browse users online
//   - messages     (free)    Direct messages (peer-to-peer)
//   - agora        (free)    Global open chat (click username to DM)
//   - collective   (free*)   Artist fan groups (*creating costs 1 credit)
//   - underground  (gated)   Anonymous confessions (3 credits to unlock)
//
// Note: Debates/Colloquiums moved to Ideas sidebar

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth.js';
import { config } from '@/config';

const TABS = ['people', 'messages', 'agora', 'collective', 'underground'];

// Tab labels and subtitles are now handled via i18n in CommunityTabs.jsx and CommunityHub.jsx
// Keys: community.tabs.agora, community.subtitles.agora, etc.

/**
 * Check if the user has unlocked a gated space.
 */
async function checkSpaceAccess(space) {
  try {
    const response = await fetch(`${config.apiUrl}/api/spaces/${space}/status`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) return { hasAccess: false };
    const data = await response.json();
    return { hasAccess: !!data.hasAccess };
  } catch {
    return { hasAccess: false };
  }
}

export function useCommunity() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('people');
  const [spaceAccess, setSpaceAccess] = useState({
    people: true,
    messages: true,
    agora: true,
    collective: true,
    underground: false,
  });
  const [accessLoading, setAccessLoading] = useState(false);

  // Open the sidebar (optionally to a specific tab)
  const open = useCallback((tab) => {
    if (tab && TABS.includes(tab)) {
      setActiveTab(tab);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Switch active tab
  const switchTab = useCallback((tab) => {
    if (TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Check access for gated spaces on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional state reset on auth change
      setSpaceAccess((prev) => ({ ...prev, underground: false }));
      return;
    }

    let cancelled = false;
    setAccessLoading(true);

    async function loadAccess() {
      const underground = await checkSpaceAccess('underground');
      if (!cancelled) {
        setSpaceAccess((prev) => ({ ...prev, underground: underground.hasAccess }));
        setAccessLoading(false);
      }
    }

    loadAccess();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Refresh access after an unlock
  const refreshAccess = useCallback(async (space) => {
    const result = await checkSpaceAccess(space);
    setSpaceAccess((prev) => ({ ...prev, [space]: result.hasAccess }));
  }, []);

  // Check if a space requires a credit-gated unlock
  const isSpaceLocked = useCallback(
    (space) => {
      if (space !== 'underground') return false;
      return !spaceAccess.underground;
    },
    [spaceAccess]
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    activeTab,
    switchTab,
    tabs: TABS,
    spaceAccess,
    accessLoading,
    isSpaceLocked,
    refreshAccess,
  };
}

export default useCommunity;
