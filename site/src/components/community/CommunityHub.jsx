// ============================================================
// CommunityHub - Slide-out Sidebar for Philosify Community Spaces
// ============================================================
// Five tabs: People, Messages, Agora, Collective, Underground
// (Debates/Colloquiums moved to Ideas sidebar)
// Renders at Router level so it's accessible from every page.
// Initializes E2E encryption when user is authenticated.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CommunityTabs } from './CommunityTabs.jsx';
import { SpaceLock } from './SpaceLock.jsx';
import { AgoraChat } from '../chat/AgoraChat.jsx';
import { MessagesPanel } from '../messages/MessagesPanel.jsx';
import { CollectivePanel } from '../collective/CollectivePanel.jsx';
import { PeoplePanel } from './PeoplePanel.jsx';
import { UndergroundFeed } from '../underground/UndergroundFeed.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useCrypto } from '../../hooks/useCrypto.js';
import { useDMUnreadCount } from '../../hooks/useDMUnreadCount.js';
import { usePresence } from '../../hooks/usePresence.js';
import { useAutoSubscribePush } from '../../hooks/useAutoSubscribePush.js';
import '../../styles/community.css';

const REACTION_EMOJIS = {
  reason: '\u2696\uFE0F',
  dialectic: '\u2694\uFE0F',
  reflect: '\uD83E\uDDD8',
  provoke: '\u26A1',
  absurd: '\uD83C\uDF00',
  virtue: '\uD83C\uDFDB\uFE0F',
};

export function CommunityHub({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isSpaceLocked,
  refreshAccess,
}) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  // Lock body scroll when community hub is open (preserve scroll position)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
      }
    };
  }, [isOpen]);

  // Initialize E2E encryption when user is authenticated
  // This generates/retrieves keypair and registers public key with server
  // The hook runs its side effect regardless of whether we use the return values
  useCrypto();

  // Get DM unread count for badge display
  const { unreadCount: dmUnreadCount, refresh: refreshDMCount } = useDMUnreadCount();

  // Track online presence when hub is open
  const { isOnline, onlineCount } = usePresence(isOpen && isAuthenticated);

  // Auto-prompt for push when logged in (push is default ON)
  useAutoSubscribePush(isAuthenticated);

  // For DM: user to start conversation with (set from Agora click)
  const [dmTarget, setDmTarget] = useState(null);
  // Track if user came from Agora (for back navigation)
  const [cameFromAgora, setCameFromAgora] = useState(false);

  // Reaction toast
  const [reactionToast, setReactionToast] = useState(null);
  const reactionToastTimer = useRef(null);

  useEffect(() => {
    const handleReaction = (e) => {
      const { reactionType } = e.detail || {};
      if (!reactionType) return;
      const emoji = REACTION_EMOJIS[reactionType] || '';
      const label = t(`community.dm.reactions.${reactionType}`, reactionType);
      setReactionToast(`${emoji} ${label}`);
      clearTimeout(reactionToastTimer.current);
      reactionToastTimer.current = setTimeout(() => setReactionToast(null), 3000);
    };
    window.addEventListener('dm-reaction-received', handleReaction);
    return () => {
      window.removeEventListener('dm-reaction-received', handleReaction);
      clearTimeout(reactionToastTimer.current);
    };
  }, [t]);

  // Handler for clicking username in Agora/People to start DM
  // options.greeting: auto-send greeting when conversation is new (from People tab)
  const handleStartDM = useCallback(
    (userId, displayName, options = {}) => {
      setDmTarget({ id: userId, displayName, ...options });
      setCameFromAgora(true);
      onTabChange('messages');
    },
    [onTabChange]
  );

  // Handler for back button in Messages - returns to Agora if came from there
  const handleMessagesBack = useCallback(() => {
    if (cameFromAgora) {
      setCameFromAgora(false);
      setDmTarget(null);
      onTabChange('agora');
    }
  }, [cameFromAgora, onTabChange]);

  // Clear DM target when switching away from messages and refresh unread count
  useEffect(() => {
    if (activeTab !== 'messages') {
      /* eslint-disable react-hooks/set-state-in-effect -- intentional state reset on tab change */
      setDmTarget(null);
      setCameFromAgora(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      // Refresh unread count in case user read messages
      refreshDMCount();
    }
  }, [activeTab, refreshDMCount]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleUnlocked = useCallback(
    (space) => {
      refreshAccess?.(space);
    },
    [refreshAccess]
  );

  // Render tab content
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="community-auth-required">
          <div className="community-auth-required__text">{t('community.signInRequired')}</div>
        </div>
      );
    }

    // Underground has a lock gate
    if (activeTab === 'underground' && isSpaceLocked('underground')) {
      return <SpaceLock space="underground" onUnlocked={handleUnlocked} />;
    }

    switch (activeTab) {
      case 'agora':
        return <AgoraChat onUserClick={handleStartDM} />;
      case 'messages':
        return (
          <MessagesPanel
            startWithUser={dmTarget}
            onBackToAgora={cameFromAgora ? handleMessagesBack : null}
            isOnline={isOnline}
          />
        );
      case 'collective':
        return <CollectivePanel onStartDM={handleStartDM} />;
      case 'people':
        return (
          <PeoplePanel onStartDM={handleStartDM} isOnline={isOnline} onlineCount={onlineCount} />
        );
      case 'underground':
        return <UndergroundFeed />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`community-backdrop ${isOpen ? 'community-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
      />

      {/* Sidebar */}
      <div
        className={`community-hub ${isOpen ? 'community-hub--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('community.title')}
      >
        {/* Header */}
        <div className="community-hub__header">
          <span className="community-hub__title">{t('community.title')}</span>
          <button className="community-hub__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Tab Bar */}
        <CommunityTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          isSpaceLocked={isSpaceLocked}
          dmUnreadCount={dmUnreadCount}
        />

        {/* Subtitle */}
        <div className="community-hub__subtitle">{t(`community.subtitles.${activeTab}`)}</div>

        {/* Content */}
        <div className="community-hub__content">{renderContent()}</div>

        {/* Push notification opt-in banner (subtle, bottom of sidebar) */}

        {/* Reaction toast */}
        {reactionToast && <div className="dm-reaction-toast">{reactionToast}</div>}
      </div>
    </>
  );
}

export default CommunityHub;
