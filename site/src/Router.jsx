// Router - React Router v6 setup for Philosify with sidebar architecture
import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import App from './App';
import { Spinner } from './components/common';
import {
  LoginModal,
  SignupModal,
  ForgotPasswordModal,
  PaymentModal,
  AccountModal,
} from './components';
import { CommunityHub } from './components/community';
import { IdeasHub } from './components/ideas';
import { MusicSidebar } from './components/music/MusicSidebar';
import { ComingSoonSidebar } from './components/ComingSoonSidebar';
import { useModal, useAuth, useMusicSidebar, useIdeas } from './hooks';
import { useCommunity } from './hooks/useCommunity.js';
import { logger, getPendingAction, clearPendingAction } from './utils';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.philosify.org';

// Lazy load pages (code splitting - these are loaded on demand)
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const SharedAnalysis = lazy(() => import('./pages/SharedAnalysis'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));

// Home page wrapper with auth modals
function HomePageWrapper({
  onCommunity,
  onOpenMusic,
  onOpenCategory,
  onSignUp,
  onBuyCredits,
  onViewAnalysis,
  onViewDebate,
  anySidebarOpen,
}) {
  const { user, signOut } = useAuth();
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();
  const historyModal = useModal();

  const handleViewCachedAnalysis = async (analysisId) => {
    logger.log('[Router] Viewing cached analysis:', analysisId);
    try {
      const response = await fetch(`${API_URL}/api/analysis/${analysisId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      const formattedResult = { ...data, song_name: data.song_name || data.song, cached: true };
      historyModal.close();
      // Open MusicSidebar with the result instead of navigating
      if (onViewAnalysis) {
        onViewAnalysis(formattedResult);
      }
    } catch (err) {
      logger.error('[Router] Failed to load analysis:', err);
    }
  };

  const handleViewDebate = (threadId) => {
    logger.log('[Router] Viewing debate from history:', threadId);
    historyModal.close();
    if (onViewDebate) {
      onViewDebate(threadId);
    }
  };

  const handleSwitchToSignup = () => {
    loginModal.close();
    signupModal.open();
  };

  const handleSwitchToLogin = () => {
    signupModal.close();
    loginModal.open();
  };

  const handleSwitchToForgotPassword = () => {
    loginModal.close();
    forgotPasswordModal.open();
  };

  const handleBackToLogin = () => {
    forgotPasswordModal.close();
    loginModal.open();
  };

  return (
    <>
      <HomePage
        onSignIn={loginModal.open}
        onSignUp={onSignUp || signupModal.open}
        onLogout={signOut}
        onBuyCredits={onBuyCredits || paymentModal.open}
        onHistory={historyModal.open}
        onOpenMusic={onOpenMusic}
        onOpenCommunity={onCommunity}
        onOpenCategory={onOpenCategory}
        anySidebarOpen={anySidebarOpen}
      />
      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={loginModal.close}
        onSwitchToSignup={handleSwitchToSignup}
        onSwitchToForgotPassword={handleSwitchToForgotPassword}
      />
      <SignupModal
        isOpen={signupModal.isOpen}
        onClose={signupModal.close}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <ForgotPasswordModal
        isOpen={forgotPasswordModal.isOpen}
        onClose={forgotPasswordModal.close}
        onBackToLogin={handleBackToLogin}
      />
      <PaymentModal isOpen={paymentModal.isOpen} onClose={paymentModal.close} />
      <AccountModal
        isOpen={historyModal.isOpen}
        onClose={historyModal.close}
        user={user}
        onViewAnalysis={handleViewCachedAnalysis}
        onViewDebate={handleViewDebate}
      />
    </>
  );
}

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="page-center page-center--dark">
      <Spinner size={48} color="#4CAF50" />
    </div>
  );
}

// Listens for push-navigate events dispatched by pwa.js when the SW sends a PUSH_CLICK
// message (fallback path when client.navigate() is unavailable). Navigates in-app.
function PushNavigateListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (event) => {
      const url = event.detail?.url;
      if (url) {
        logger.log('[Router] Push navigate to:', url);
        navigate(url);
      }
    };
    window.addEventListener('push-navigate', handler);
    return () => window.removeEventListener('push-navigate', handler);
  }, [navigate]);
  return null;
}

// Handles return from PaymentSuccess — reads location.state and opens the correct sidebar
function PaymentReturnHandler({ onOpenMusic, onOpenCommunity, onOpenIdeas, onOpenDebate }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state;
    if (!state) return;

    logger.log('[PaymentReturnHandler] Detected state:', state);
    logger.log('[PaymentReturnHandler] Pending action in localStorage:', getPendingAction());

    // Open sidebar and clear state (delay ensures components are mounted)
    const timer = setTimeout(() => {
      if (state.openMusic) {
        logger.log('[PaymentReturnHandler] Opening music sidebar');
        onOpenMusic?.();
      } else if (state.openDebate) {
        onOpenDebate?.(state.openDebate);
      } else if (state.openIdeas) {
        onOpenIdeas?.();
      } else if (state.openCommunity) {
        onOpenCommunity?.(state.openCommunity);
      }
      // Clear state AFTER opening sidebar (must be inside timeout to avoid cleanup race)
      navigate(location.pathname, { replace: true, state: null });
    }, 50);

    return () => clearTimeout(timer);
  }, [location.state, navigate, location.pathname, onOpenMusic, onOpenCommunity, onOpenIdeas, onOpenDebate]);

  return null;
}

// Deep link handler for /debate/:debateId — redirects to home and opens Ideas sidebar
function DebateDeepLink({ onOpenDebate }) {
  const navigate = useNavigate();
  const { debateId } = useParams();

  useEffect(() => {
    if (debateId) {
      onOpenDebate(debateId);
      navigate('/', { replace: true });
    }
  }, [debateId, onOpenDebate, navigate]);

  return null;
}

export function Router() {
  const community = useCommunity();
  const ideas = useIdeas();
  const music = useMusicSidebar();
  const [comingSoonCategory, setComingSoonCategory] = useState(null);

  // NOTE: Modal Scoping Rule
  // - Modals triggered from SIDEBAR → render INSIDE sidebar (confined to 520px)
  // - Modals triggered from LANDING SCREEN → render at component level (full screen)
  // Each component (MusicSidebar, HomePageWrapper) manages its own modals internally.

  // Handle deep link to a debate - opens Ideas sidebar
  const handleOpenDebate = useCallback(
    (debateId) => {
      ideas.openWithDebate(debateId);
    },
    [ideas]
  );

  // Open category sidebar - Ideas has its own sidebar, others use ComingSoon
  const openCategory = useCallback(
    (category) => {
      if (category === 'ideas') {
        ideas.open();
      } else {
        setComingSoonCategory(category);
      }
    },
    [ideas]
  );

  // Close ComingSoon sidebar
  const closeComingSoon = useCallback(() => {
    setComingSoonCategory(null);
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Home Page - Interactive logo with sidebar navigation */}
          <Route
            path="/"
            element={
              <HomePageWrapper
                onCommunity={community.open}
                onOpenMusic={music.open}
                onOpenCategory={openCategory}
                onSignUp={music.isOpen ? null : undefined}
                onBuyCredits={music.isOpen ? null : undefined}
                onViewAnalysis={music.openWithResult}
                onViewDebate={ideas.openWithDebate}
                anySidebarOpen={music.isOpen || community.isOpen || ideas.isOpen || !!comingSoonCategory}
              />
            }
          />

          {/* Main App - Full analysis experience */}
          <Route path="/app" element={<App />} />

          {/* Deep link to a specific debate */}
          <Route
            path="/debate/:debateId"
            element={<DebateDeepLink onOpenDebate={handleOpenDebate} />}
          />

          {/* Payment routes */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* Public routes */}
          <Route path="/a/:slug" element={<SharedAnalysis />} />
          <Route path="/shared/:id" element={<SharedAnalysis />} />

          {/* Legal pages */}
          <Route path="/tos" element={<TermsOfService />} />
          <Route path="/pp" element={<PrivacyPolicy />} />

          {/* Reset password shows app behind the modal overlay */}
          <Route
            path="/reset-password"
            element={
              <>
                <App />
                <ResetPasswordPage />
              </>
            }
          />

          {/* Catch-all route - redirect unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Push notification in-app navigation listener */}
        <PushNavigateListener />

        {/* Payment return — opens correct sidebar after credit purchase */}
        <PaymentReturnHandler
          onOpenMusic={music.openWithPendingAction}
          onOpenCommunity={community.open}
          onOpenIdeas={ideas.open}
          onOpenDebate={ideas.openWithDebate}
        />

        {/* Community Hub Sidebar */}
        <CommunityHub
          isOpen={community.isOpen}
          onClose={community.close}
          activeTab={community.activeTab}
          onTabChange={community.switchTab}
          isSpaceLocked={community.isSpaceLocked}
          refreshAccess={community.refreshAccess}
        />

        {/* Ideas Hub Sidebar (Debates & Colloquiums) */}
        <IdeasHub
          isOpen={ideas.isOpen}
          onClose={ideas.close}
          deepLinkDebateId={ideas.deepLinkDebateId}
          clearDeepLinkDebate={ideas.clearDeepLinkDebate}
        />

        {/* Music Sidebar */}
        <MusicSidebar
          isOpen={music.isOpen}
          onClose={music.close}
          query={music.query}
          setQuery={music.setQuery}
          results={music.results}
          loading={music.loading}
          selectedTrack={music.selectedTrack}
          selectTrack={music.selectTrack}
          clearTrack={music.clearTrack}
          isAnalyzing={music.isAnalyzing}
          analysisResult={music.analysisResult}
          analysisError={music.analysisError}
          analyze={music.analyze}
          cancelAnalysis={music.cancelAnalysis}
          elapsedTime={music.elapsedTime}
          formatTime={music.formatTime}
          user={music.user}
          balance={music.balance}
        />

        {/* Coming Soon Sidebar (Books, Films, News, Ideas) */}
        <ComingSoonSidebar
          isOpen={!!comingSoonCategory}
          onClose={closeComingSoon}
          category={comingSoonCategory}
        />
      </Suspense>
    </BrowserRouter>
  );
}

export default Router;
