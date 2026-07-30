// Router - v2 page architecture (WP3). Modules are PAGES (Design Law §4
// navigation law); the sidebar architecture is retired on this branch.
// The three formerly sidebar-targeting threads now target URLs (Addendum 1):
//   1. Payment resume: PaymentSuccess still navigates '/' with legacy state
//      flags; PaymentReturnRedirect translates them to module URLs.
//   2. Push: PushNavigateListener navigates the payload URL (now real routes).
//   3. History replay: V2ModalsHost history rows navigate /module?analysis=id.
import { Suspense, lazy, useEffect } from 'react';
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
import { logger } from './utils';

// Lazy-loaded pages (code splitting)
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const SharedAnalysis = lazy(() => import('./pages/SharedAnalysis'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

// v2 pages
const LandingPage = lazy(() => import('./pages/v2/LandingPage'));
const MusicPage = lazy(() => import('./pages/v2/MusicPage'));
const NewsPage = lazy(() => import('./pages/v2/NewsPage'));
const CinemaPage = lazy(() => import('./pages/v2/CinemaPage'));
const LiteraturePage = lazy(() => import('./pages/v2/LiteraturePage'));
const IdeasPage = lazy(() => import('./pages/v2/IdeasPage'));
const HistoryPage = lazy(() => import('./pages/v2/HistoryPage'));
const QuizPage = lazy(() => import('./pages/v2/QuizPage'));
const CommunityPage = lazy(() => import('./pages/v2/CommunityPage'));
const UnsafeZonePage = lazy(() => import('./pages/v2/UnsafeZonePage'));
const SignInPage = lazy(() => import('./pages/v2/SignInPage'));
const SignUpPage = lazy(() => import('./pages/v2/SignUpPage'));
const LegalPage = lazy(() => import('./pages/v2/LegalPage'));

// Dev-only v2 component gallery (WP2 acceptance surface; absent from builds)
const V2Gallery = import.meta.env.DEV ? lazy(() => import('./pages/V2Gallery')) : null;

function PageLoader() {
  return (
    <div className="page-center page-center--dark">
      <Spinner size={48} color="#5E5E65" />
    </div>
  );
}

// Push notifications: pwa.js dispatches push-navigate on SW PUSH_CLICK.
// Payload URLs are real routes in the page architecture.
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

// Payment-resume thread (Addendum 1): PaymentSuccess/PaymentCancel navigate
// '/' with the legacy state flags; translate them to URL targets so each
// module page resumes its own pending action on mount.
function PaymentReturnRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state;
    if (!state || location.pathname !== '/') return;
    logger.log('[PaymentReturnRedirect] state:', state);

    const go = (to, extra) => navigate(to, { replace: true, state: { resume: true, ...extra } });
    if (state.openMusic) go('/music');
    else if (state.openBooks) go('/literature');
    else if (state.openDebate) navigate(`/ideas?debate=${state.openDebate}`, { replace: true, state: { resume: true } });
    else if (state.openIdeas) go('/ideas');
    else if (state.openCommunity) go('/community', { tab: state.openCommunity });
    else if (state.openUnsafeZone) go('/unsafe-zone');
    else if (state.openQuiz) go('/quiz');
    else if (state.openCinema) go('/cinema');
    else if (state.openNews) go('/news');
    else if (state.openPaymentModal) {
      navigate('/', { replace: true, state: null });
      setTimeout(() => window.dispatchEvent(new CustomEvent('v2-open-buy-credits')), 100);
    }
  }, [location.state, location.pathname, navigate]);

  return null;
}

// Deep link /debate/:debateId → Ideas page with the debate open
function DebateDeepLink() {
  const { debateId } = useParams();
  return <Navigate to={`/ideas?debate=${debateId}`} replace />;
}

export function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Module pages */}
          <Route path="/music" element={<MusicPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/cinema" element={<CinemaPage />} />
          <Route path="/literature" element={<LiteraturePage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/unsafe-zone" element={<UnsafeZonePage />} />

          {/* Auth pages (existing auth logic underneath) */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Legacy results view (kept for /reset-password backdrop + shares) */}
          <Route path="/app" element={<App />} />

          {/* Deep link to a specific debate */}
          <Route path="/debate/:debateId" element={<DebateDeepLink />} />

          {/* Payment routes */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* Public share routes */}
          <Route path="/a/:slug" element={<SharedAnalysis />} />
          <Route path="/shared/:id" element={<SharedAnalysis />} />

          {/* Legal pages (v2, real ToS/PP text via i18n) */}
          <Route path="/tos" element={<LegalPage doc="terms" />} />
          <Route path="/pp" element={<LegalPage doc="privacy" />} />

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

          {V2Gallery && <Route path="/dev/v2" element={<V2Gallery />} />}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <PushNavigateListener />
        <PaymentReturnRedirect />
      </Suspense>
    </BrowserRouter>
  );
}

export default Router;
