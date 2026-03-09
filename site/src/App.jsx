// App.jsx - Results page component (receives analysis from Landing page)
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResultsContainer } from './components';
import { Toast } from './components/common';
import { useAnalysis, useToast } from './hooks';
import { logger } from './utils';

function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { result, setResult, error: analysisError, clear: clearResults } = useAnalysis();
  const { toast, hideToast } = useToast();

  // Ref for scrolling to results
  const techSpecsRef = useRef(null);

  // Check for analysis result from navigation state (from Landing page)
  useEffect(() => {
    if (location.state?.analysisResult) {
      logger.log('[App] Received analysis result from navigation state');
      setResult(location.state.analysisResult);

      // Clear the state to prevent re-setting on refresh
      window.history.replaceState({}, document.title);

      // Scroll to top
      window.scrollTo(0, 0);
    } else if (!result) {
      // No result and no incoming result - redirect to landing page
      logger.log('[App] No analysis result, redirecting to landing page');
      navigate('/', { replace: true });
    }
  }, [location.state, setResult, result, navigate]);

  // Auto-clear error after 10 seconds
  useEffect(() => {
    if (analysisError) {
      const timer = setTimeout(() => {
        clearResults();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [analysisError, clearResults]);

  // Dynamic page title and meta tags
  const pageTitle =
    result && !result.error
      ? `${result.song || result.song_name} - ${result.artist} | Philosify`
      : 'Philosify - Philosophical Music Analysis';

  const pageDescription =
    result && !result.error
      ? `Philosophical analysis of "${result.song || result.song_name}" by ${result.artist}. Score: ${result.overall_grade || result.final_score || 'N/A'}`
      : t('appDescription');

  // Update document title + basic meta tags
  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.title = pageTitle;

    const upsertMeta = ({ name, property, content }) => {
      const selector = name
        ? `meta[name="${CSS.escape(name)}"]`
        : `meta[property="${CSS.escape(property)}"]`;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (name) el.setAttribute('name', name);
        if (property) el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    upsertMeta({ name: 'description', content: pageDescription });
    upsertMeta({ property: 'og:title', content: pageTitle });
    upsertMeta({ property: 'og:description', content: pageDescription });
    upsertMeta({ property: 'twitter:title', content: pageTitle });
    upsertMeta({ property: 'twitter:description', content: pageDescription });
  }, [pageTitle, pageDescription]);

  // Handle back to landing page
  const handleBackToHome = () => {
    clearResults();
    navigate('/');
  };

  return (
    <>
      {/* Back to Home Button */}
      <div className="results-nav">
        <button className="results-back-btn" onClick={handleBackToHome}>
          ← {t('nav.backToHome')}
        </button>
      </div>

      {/* Error Display */}
      {analysisError && !result && (
        <div className="status-overlay">
          <div className="error-message-container">
            <div className="error-message-text">{analysisError}</div>
            <button className="error-message-close" onClick={clearResults} aria-label="Close">
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Results Section - only shown when there are results */}
      {result && (
        <div className="results">
          <ResultsContainer result={result} ref={techSpecsRef} />
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        {t('footer0')}
        <br />
        {t('footer1')}
        <br />
        {t('footer2')}
        <br />
        {t('footer3')}
        <br />
        {t('footer5')}
        <br />
        {t('footer4')}
        <br />
        <a href="/pp">{t('privacyLink')}</a> - <a href="/tos">{t('termsLink')}</a>
      </footer>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
        duration={toast.duration}
      />
    </>
  );
}

export default App;
