// Router - React Router v6 setup for Philosify with code splitting
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
import { useModal, useAuth } from './hooks';
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
const MusicAnalysis = lazy(() => import('./pages/MusicAnalysis'));
const LandingScreen = lazy(() => import('./components/LandingScreen'));
const HomePage = lazy(() => import('./pages/HomePage'));
const BooksAnalysis = lazy(() =>
  import('./pages/ComingSoon').then((m) => ({ default: m.BooksAnalysis }))
);
const FilmsAnalysis = lazy(() =>
  import('./pages/ComingSoon').then((m) => ({ default: m.FilmsAnalysis }))
);
const NewsAnalysis = lazy(() =>
  import('./pages/ComingSoon').then((m) => ({ default: m.NewsAnalysis }))
);

// Home page wrapper (4-category grid) with auth modals
function HomePageWrapper({ onCommunity }) {
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
        onSignUp={signupModal.open}
        onLogout={signOut}
        onBuyCredits={paymentModal.open}
        onHistory={historyModal.open}
        onCommunity={onCommunity}
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

// Landing page wrapper with navigation and auth modals (Music analysis)
function LandingPage({ onCommunity, onOpenDebate, onViewDebate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();
  const historyModal = useModal();

  // Open payment modal when navigated from PaymentCancel "Try Again"
  // Open community hub when navigated from PaymentSuccess with pending action
  useEffect(() => {
    if (location.state?.openPaymentModal) {
      paymentModal.open();
      navigate(location.pathname, { replace: true, state: {} });
    }
    if (location.state?.openColloquiumId) {
      onOpenDebate?.(location.state.openColloquiumId);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (location.state?.openCommunity) {
      onCommunity?.(location.state.openCommunity);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to location.state changes; adding navigate/paymentModal/pathname would cause loops
  }, [location.state]);

  const handleAnalyze = ({ track, model, analysisResult }) => {
    // If we have analysis result, navigate to app with it
    navigate('/app', {
      state: {
        analyzeTrack: track,
        analyzeModel: model,
        analysisResult: analysisResult,
      },
    });
  };

  const handleViewAnalysis = (analysisResult) => {
    // Navigate to app with pre-loaded analysis result
    navigate('/app', {
      state: {
        analysisResult: analysisResult,
      },
    });
  };

  // Handle viewing cached analysis from History modal (receives analysisId)
  const handleViewCachedAnalysis = async (analysisId) => {
    logger.log('[Router] Viewing cached analysis:', analysisId);

    try {
      // Fetch analysis via authenticated API endpoint
      const response = await fetch(`${API_URL}/api/analysis/${analysisId}`, {
        method: 'GET',
        credentials: 'include', // Send HttpOnly cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // API returns the analysis in the same shape as analyze.js cache hit
      // Just pass it through directly
      const formattedResult = {
        ...data,
        // Ensure backward compatibility fields are present
        song_name: data.song_name || data.song,
        cached: true,
      };

      // Close modal and navigate to results
      historyModal.close();
      navigate('/app', {
        state: {
          analysisResult: formattedResult,
        },
      });

      logger.log('[Router] Loaded cached analysis:', formattedResult.song);
    } catch (err) {
      logger.error('[Router] Failed to load analysis:', err);
    }
  };

  const handleSignIn = () => {
    loginModal.open();
  };

  const handleSignUp = () => {
    signupModal.open();
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleBuyCredits = () => {
    paymentModal.open();
  };

  const handleHistory = () => {
    historyModal.open();
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
      <LandingScreen
        onAnalyze={handleAnalyze}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onLogout={handleLogout}
        onBuyCredits={handleBuyCredits}
        onHistory={handleHistory}
        onViewAnalysis={handleViewAnalysis}
        onCommunity={onCommunity}
      />

      {/* Auth Modals */}
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
        onViewDebate={(threadId) => {
          historyModal.close();
          onViewDebate?.(threadId);
        }}
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

// Deep link handler for /debate/:debateId — opens community sidebar to debates tab
function DebateDeepLink({ onOpenDebate }) {
  const { debateId } = useParams();
  useEffect(() => {
    if (debateId) {
      onOpenDebate(debateId);
    }
  }, [debateId, onOpenDebate]);
  return <LandingScreen />;
}

export function Router() {
  const community = useCommunity();
  const [deepLinkDebateId, setDeepLinkDebateId] = useState(null);

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

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Home Page - 4 category grid (Music, Books, Films, News) */}
          <Route path="/" element={<HomePageWrapper onCommunity={community.open} />} />

          {/* Music Analysis - Original landing screen */}
          <Route
            path="/music"
            element={
              <LandingPage
                onCommunity={community.open}
                onOpenDebate={handleOpenDebate}
                onViewDebate={handleOpenDebate}
              />
            }
          />

          {/* Coming Soon pages */}
          <Route path="/books" element={<BooksAnalysis />} />
          <Route path="/films" element={<FilmsAnalysis />} />
          <Route path="/news" element={<NewsAnalysis />} />

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
          <Route path="/analysis" element={<MusicAnalysis />} />

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

        {/* Community Hub Sidebar - global, available on all pages */}
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

        {/* Community FAB - floating button to open sidebar */}
        <button
          className={`community-fab ${community.isOpen ? 'community-fab--open' : ''}`}
          onClick={community.toggle}
          title="Community Hub"
          aria-label="Open Community Hub"
        >
          <span className="community-fab__icon">&#9776;</span>
          <span className="community-fab__label">Community</span>
        </button>
      </Suspense>
    </BrowserRouter>
  );
}

export default Router;
