import { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from './Router';
import { LanguageProvider, CreditsProvider } from './contexts';
import { ErrorBoundary } from './components/common';
import { logger } from './utils';
import { initPWA } from './utils/pwa';
import { initSentry } from './utils/sentry';
import { initI18nLanguage } from './i18n'; // Initialize i18n language (awaitable)
import './styles/global.css';

// Initialize Sentry (production only)
initSentry();

// Cleanup stale localStorage key from old crypto implementation (added 2026-03-07)
// The old E2E encryption stored private keys in localStorage; current implementation uses IndexedDB.
// This cleanup can be removed after 2026-05-01 when all active users have migrated.
try {
  localStorage.removeItem('philosify:e2e:keypair:v1');
} catch {
  // Ignore - localStorage may be unavailable in some contexts
}

// App wrapper that initializes i18n and PWA
// Note: Auth is handled via HttpOnly cookies - no client-side initialization needed
function AppWithInitialization() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        logger.log('[Main] Initializing i18n...');
        await initI18nLanguage();
        logger.log('[Main] i18n initialized successfully');

        // Initialize PWA (service worker, install prompt, etc.)
        if (mounted) {
          await initPWA();
        }

        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        logger.error('[Main] Initialization failed:', err);
        if (mounted) {
          setError(err.message);
          // Still render app - it will work without some features
          // Still try to initialize PWA
          await initPWA();
          setIsReady(true);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Loading state - splash screen only in standalone PWA (installed app), not in browser
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (!isReady) {
    if (isStandalone) {
      return (
        <div className="splash-screen">
          <img src="/logo-everything.png" alt="Philosify" className="splash-logo" />
          <div className="splash-spinner" />
        </div>
      );
    }
    return null;
  }

  // Error state (still render app, but show warning)
  if (error) {
    logger.warn('[Main] App loaded with initialization error:', error);
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <CreditsProvider>
          <Router />
        </CreditsProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWithInitialization />
  </StrictMode>
);
