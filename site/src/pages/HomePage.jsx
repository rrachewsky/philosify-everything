// HomePage - Landing page with interactive logo
// Same layout as LandingScreen but with clickable symbol hotspots instead of video + search
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';
import { InstallButton } from '@/components/pwa/InstallButton';
import '@/styles/landing.css';
import '@/styles/homepage.css';

// Language icons (same as LandingScreen)
const LANDING_LANGUAGES = [
  // Column 1 - Western/Central Europe (9 languages)
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'nl', label: 'NL', name: 'Nederlands' },
  { code: 'pl', label: 'PL', name: 'Polski' },
  { code: 'hu', label: 'HU', name: 'Magyar' },
  // Column 2 - Eastern Europe/Asia/Middle East (9 languages)
  { code: 'tr', label: 'TR', name: 'Türkçe' },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'ja', label: 'JP', name: '日本語' },
  { code: 'ko', label: 'KR', name: '한국어' },
  { code: 'zh', label: 'ZH', name: '中文' },
  { code: 'hi', label: 'HI', name: 'हिन्दी' },
  { code: 'ar', label: 'AR', name: 'العربية' },
  { code: 'he', label: 'HE', name: 'עברית' },
  { code: 'fa', label: 'FA', name: 'فارسی' },
];

// Hotspot definitions - positioned as % of image dimensions
const HOTSPOTS = [
  { id: 'ideas', route: '/ideas', top: 3, left: 38, width: 18, height: 18 },
  { id: 'music', route: '/music', top: 28, left: 2, width: 18, height: 22 },
  { id: 'films', route: '/films', top: 15, left: 68, width: 20, height: 22 },
  { id: 'books', route: '/books', top: 52, left: 5, width: 18, height: 18 },
  { id: 'news', route: '/news', top: 45, left: 75, width: 18, height: 20 },
];

export function HomePage({ onSignIn, onSignUp, onLogout, onBuyCredits, onHistory }) {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, signOut } = useAuth();
  const { balance } = useCreditsContext();
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');

  // Get display name from user
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  // Handle language change
  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    i18n.changeLanguage(langCode);
  };

  // Handle hotspot click
  const handleHotspotClick = (route) => {
    navigate(route);
  };

  // Image loaded
  useEffect(() => {
    const img = new Image();
    img.src = '/logo-everything.png';
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(true); // Show anyway on error
  }, []);

  return (
    <>
      <div className="landing-screen">
        {/* Loading Overlay */}
        <AnimatePresence>
          {!isLoaded && (
            <motion.div
              className="loading-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="loading-spinner" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* LAYER 0: Top Auth Bar */}
        <motion.div
          className="landing-auth-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -10 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <InstallButton />
          {!user ? (
            /* Logged out: Sign Up / Sign In */
            <>
              <button className="landing-auth-link" onClick={onSignUp}>
                {t('auth.signUp')}
              </button>
              <button className="landing-auth-link" onClick={onSignIn}>
                {t('auth.signIn')}
              </button>
            </>
          ) : (
            /* Logged in: Profile info */
            <div className="landing-user-profile">
              <div className="landing-user-top">
                <span className="landing-username">{displayName}</span>
              </div>
              <div className="landing-user-middle">
                <span className="landing-balance">
                  {balance?.total ?? '...'} {t('userProfile.credits')}
                </span>
                <button className="landing-auth-link landing-buy-link" onClick={onBuyCredits}>
                  {t('userProfile.buyCredits')}
                </button>
              </div>
              <div className="landing-user-bottom">
                <button className="landing-auth-link" onClick={onHistory}>
                  {t('account.history')}
                </button>
                <button className="landing-auth-link" onClick={onLogout || signOut}>
                  {t('userProfile.logout')}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* LAYER 1: Background (dark gradient) */}
        <div className="bg-video-layer">
          <div className="bg-overlay" style={{ background: '#0a0020' }} />
        </div>

        {/* LAYER 2: Main Logo Image with Hotspots */}
        <motion.div
          className="main-video-layer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.9 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="logo-container">
            <img
              src="/logo-everything.png"
              alt="Philosify Everything"
              className="logo-image"
              onLoad={() => setIsLoaded(true)}
            />
            {/* Clickable hotspots */}
            {HOTSPOTS.map((hotspot) => (
              <div
                key={hotspot.id}
                className="logo-hotspot"
                style={{
                  top: `${hotspot.top}%`,
                  left: `${hotspot.left}%`,
                  width: `${hotspot.width}%`,
                  height: `${hotspot.height}%`,
                }}
                onClick={() => handleHotspotClick(hotspot.route)}
                title={t(`home.categories.${hotspot.id}.title`, hotspot.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleHotspotClick(hotspot.route)}
              />
            ))}
          </div>
        </motion.div>

        {/* LAYER 2.5: Language Icons */}
        <motion.div
          className="landing-language-icons"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Column 1 - first 9 languages */}
          <div className="landing-language-row">
            {LANDING_LANGUAGES.slice(0, 9).map((lang) => (
              <button
                key={lang.code}
                className={`landing-language-icon ${selectedLang === lang.code ? 'selected' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
                title={lang.name}
                aria-label={lang.name}
              >
                {lang.label}
              </button>
            ))}
          </div>
          {/* Column 2 - last 9 languages */}
          <div className="landing-language-row">
            {LANDING_LANGUAGES.slice(9, 18).map((lang) => (
              <button
                key={lang.code}
                className={`landing-language-icon ${selectedLang === lang.code ? 'selected' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
                title={lang.name}
                aria-label={lang.name}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Community Hub is rendered globally via Router.jsx */}
      </div>

      {/* Footer Section */}
      <div className="landing-footer-section">
        <footer className="landing-footer">
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
      </div>
    </>
  );
}

export default HomePage;
