// CommunityPage - v2 COMMUNITY module page (WP3).
// Visual truth: new_design/philosify-community.html (module template
// chrome, "The Agora // Members" ticker, 18-languages silver stat).
// Functionality: everything CommunityHub implements — five spaces
// (People, Messages, The Agora, The Collective, The Underground),
// E2E crypto init, presence, DM unread badge, DM handoff from
// Agora/People, reaction toast, push auto-subscribe, and the
// credit-gated Underground unlock via the reused SpaceLock
// (POST /api/spaces/:space/unlock + pendingAction auto-retry).
// The five panels are REUSED as-is inside a v2 panel host; only the
// outer chrome is v2 (.tabs/.tab from v2-components.css).
// Supports ?tab=<tab> and location.state.tab (payment-resume for
// space unlocks lands here via PaymentReturnRedirect).
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell, ModuleHeader, Ticker, Button } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { CATALOG } from '../../config/catalog';
import { SpaceLock } from '../../components/community/SpaceLock.jsx';
import { PeoplePanel } from '../../components/community/PeoplePanel.jsx';
import { AgoraChat } from '../../components/chat/AgoraChat.jsx';
import { MessagesPanel } from '../../components/messages/MessagesPanel.jsx';
import { CollectivePanel } from '../../components/collective/CollectivePanel.jsx';
import { UndergroundFeed } from '../../components/underground/UndergroundFeed.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useCommunity } from '../../hooks/useCommunity.js';
import { useCrypto } from '../../hooks/useCrypto.js';
import { useDMUnreadCount } from '../../hooks/useDMUnreadCount.js';
import { usePresence } from '../../hooks/usePresence.js';
import { useAutoSubscribePush } from '../../hooks/useAutoSubscribePush.js';
import '../../styles/v2-pages/community.css';
import '../../styles/v2-pages/community-panels.css';
import '../../styles/v2-pages/underground.css';

const TABS = ['people', 'messages', 'agora', 'collective', 'underground'];

const TAB_DEFAULTS = {
  people: 'People',
  messages: 'Messages',
  agora: 'The Agora',
  collective: 'The Collective',
  underground: 'The Underground',
};

// Reaction toast emoji map (parity with CommunityHub)
const REACTION_EMOJIS = {
  reason: '⚖️',
  dialectic: '⚔️',
  reflect: '🧘',
  provoke: '⚡',
  absurd: '🌀',
  virtue: '🏛️',
};

export default function CommunityPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Space access (underground credit gate) — reuse the existing hook's
  // access checking; the page's tab state lives in the URL instead.
  const { isSpaceLocked, refreshAccess } = useCommunity();

  // Active tab: location.state.tab (payment-resume) > ?tab= > people
  const [activeTab, setActiveTab] = useState(() => {
    const fromState = location.state?.tab;
    if (fromState && TABS.includes(fromState)) return fromState;
    const fromQuery = searchParams.get('tab');
    if (fromQuery && TABS.includes(fromQuery)) return fromQuery;
    return 'people';
  });

  const switchTab = useCallback(
    (tab) => {
      if (!TABS.includes(tab)) return;
      setActiveTab(tab);
      setSearchParams(tab === 'people' ? {} : { tab }, { replace: true });
    },
    [setSearchParams]
  );

  // Follow external URL changes (push-navigate, back button)
  useEffect(() => {
    const fromQuery = searchParams.get('tab');
    if (fromQuery && TABS.includes(fromQuery) && fromQuery !== activeTab) {
      setActiveTab(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Follow router state arriving after mount (payment-resume)
  useEffect(() => {
    const fromState = location.state?.tab;
    if (fromState && TABS.includes(fromState) && fromState !== activeTab) {
      setActiveTab(fromState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Initialize E2E encryption when user is authenticated
  // (generates/retrieves keypair and registers public key with server)
  useCrypto();

  // DM unread count for the Messages tab badge
  const { unreadCount: dmUnreadCount, refresh: refreshDMCount } = useDMUnreadCount();

  // Online presence — the page is always "open"
  const { isOnline, onlineCount } = usePresence(isAuthenticated);

  // Auto-prompt for push when logged in (push is default ON)
  useAutoSubscribePush(isAuthenticated);

  // DM handoff: user to start conversation with (set from Agora/People)
  const [dmTarget, setDmTarget] = useState(null);
  const [cameFromAgora, setCameFromAgora] = useState(false);

  // Reaction toast (parity with CommunityHub)
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

  // Clicking a username in Agora/People starts a DM
  const handleStartDM = useCallback(
    (userId, displayName, options = {}) => {
      setDmTarget({ id: userId, displayName, ...options });
      setCameFromAgora(true);
      switchTab('messages');
    },
    [switchTab]
  );

  // Back button in Messages returns to Agora if the DM started there
  const handleMessagesBack = useCallback(() => {
    if (cameFromAgora) {
      setCameFromAgora(false);
      setDmTarget(null);
      switchTab('agora');
    }
  }, [cameFromAgora, switchTab]);

  // Clear DM target when leaving Messages + refresh the unread badge
  useEffect(() => {
    if (activeTab !== 'messages') {
      setDmTarget(null);
      setCameFromAgora(false);
      refreshDMCount();
    }
  }, [activeTab, refreshDMCount]);

  const handleUnlocked = useCallback(
    (space) => {
      refreshAccess?.(space);
    },
    [refreshAccess]
  );

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <div className="authgate">
          <p>{t('community.signInRequired', 'Sign in to join the community')}</p>
          <Button onClick={() => navigate('/signin')}>{t('v2.nav.signIn', 'Sign in')}</Button>
        </div>
      );
    }

    // The Underground has a credit-gated lock (3 credits, permanent).
    // SpaceLock is reused as-is: it POSTs /api/spaces/:space/unlock and
    // auto-retries a pending space:unlock action after payment-return.
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
    <PageShell status={t('v2.landing.status', 'Analysis Engine // Active')} nav={<NavAccount />}>
      <ModuleHeader title={t('v2.community.title', 'COMMUNITY')}>
        <Ticker stat={t('v2.community.tickerStat', '{{locales}} languages', { locales: CATALOG.locales })}>
          {t('v2.community.ticker', 'The Agora // Members')}
        </Ticker>
      </ModuleHeader>

      <section className="pg-community">
        <div className="tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`tab${activeTab === tab ? ' on' : ''}`}
              onClick={() => switchTab(tab)}
            >
              {t(`v2.community.tabs.${tab}`, t(`community.tabs.${tab}`, TAB_DEFAULTS[tab]))}
              {tab === 'messages' && dmUnreadCount > 0 && activeTab !== 'messages' && (
                <span className="tabbadge">{dmUnreadCount > 99 ? '99+' : dmUnreadCount}</span>
              )}
              {tab === 'underground' && isAuthenticated && isSpaceLocked('underground') && (
                <span className="tabnote">{t('v2.community.locked', 'Locked')}</span>
              )}
            </button>
          ))}
        </div>

        <div className="subline">{t(`community.subtitles.${activeTab}`, '')}</div>

        <div className="panelhost">
          {renderContent()}
          {reactionToast && <div className="dm-reaction-toast">{reactionToast}</div>}
        </div>
      </section>

      <V2ModalsHost />
    </PageShell>
  );
}
