// Router - React Router v6 setup for Philosify with sidebar architecture
import { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
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
import { MusicSidebar } from './components/music/MusicSidebar';
import { ComingSoonSidebar } from './components/ComingSoonSidebar';
import { useModal, useAuth, useMusicSidebar } from './hooks';
import { useCommunity } from './hooks/useCommunity.js';
import { logger } from './utils';

const API_URL = import.meta.env.VITE_API_URL || 'https://api-everything.philosify.org';

// Lazy load pages (code splitting - these are loaded on demand)
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const SharedAnalysis = lazy(() => import('./pages/SharedAnalysis'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));

// Home page wrapper with auth modals
function HomePageWrapper({ onCommunity, onOpenMusic, onOpenCategory, onSignUp, onBuyCredits }) {
  const navigate = useNavigate();
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
      navigate('/app', { state: { analysisResult: formattedResult } });
    } catch (err) {
      logger.error('[Router] Failed to load analysis:', err);
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

// Deep link handler for /debate/:debateId — redirects to home and opens community sidebar
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
  const music = useMusicSidebar();
  const [deepLinkDebateId, setDeepLinkDebateId] = useState(null);
  const [comingSoonCategory, setComingSoonCategory] = useState(null);

  // Global modals for sidebars (signup/payment triggered from MusicSidebar)
  const signupModal = useModal();
  const paymentModal = useModal();
  const loginModal = useModal();
  const forgotPasswordModal = useModal();

  const handleOpenDebate = useCallback(
    (debateId) => {
      setDeepLinkDebateId(debateId);
      community.open('debates');
    },
    [community]
  );

  // Clear deep link after DebatePanel consumes it
  const clearDeepLinkDebate = useCallback(() => {
    setDeepLinkDebateId(null);
  }, []);

  // Open ComingSoon sidebar for a category (books, films, news, ideas)
  const openComingSoon = useCallback((category) => {
    setComingSoonCategory(category);
  }, []);

  // Close ComingSoon sidebar
  const closeComingSoon = useCallback(() => {
    setComingSoonCategory(null);
  }, []);

  // Modal switch handlers
  const handleSwitchToSignup = useCallback(() => {
    loginModal.close();
    signupModal.open();
  }, [loginModal, signupModal]);

  const handleSwitchToLogin = useCallback(() => {
    signupModal.close();
    loginModal.open();
  }, [signupModal, loginModal]);

  const handleSwitchToForgotPassword = useCallback(() => {
    loginModal.close();
    forgotPasswordModal.open();
  }, [loginModal, forgotPasswordModal]);

  const handleBackToLogin = useCallback(() => {
    forgotPasswordModal.close();
    loginModal.open();
  }, [forgotPasswordModal, loginModal]);

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
                onOpenCategory={openComingSoon}
                onSignUp={music.isOpen ? null : undefined}
                onBuyCredits={music.isOpen ? null : undefined}
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

        {/* Community Hub Sidebar */}
        <CommunityHub
          isOpen={community.isOpen}
          onClose={community.close}
          activeTab={community.activeTab}
          onTabChange={community.switchTab}
          isSpaceLocked={community.isSpaceLocked}
          refreshAccess={community.refreshAccess}
          deepLinkDebateId={deepLinkDebateId}
          clearDeepLinkDebate={clearDeepLinkDebate}
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
          onSignUp={signupModal.open}
          onBuyCredits={paymentModal.open}
        />

        {/* Coming Soon Sidebar (Books, Films, News, Ideas) */}
        <ComingSoonSidebar
          isOpen={!!comingSoonCategory}
          onClose={closeComingSoon}
          category={comingSoonCategory}
        />

        {/* Global Auth Modals (triggered from MusicSidebar) */}
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
      </Suspense>
    </BrowserRouter>
  );
}

export default Router;
