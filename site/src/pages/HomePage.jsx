// HomePage - Main landing page with 4 category boxes
// Music, Books, Films, News - each leading to their respective analysis pages
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';
import { InstallButton } from '@/components/pwa/InstallButton';
import '@/styles/homepage.css';

// Language icons (same as LandingScreen)
const LANDING_LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'nl', label: 'NL', name: 'Nederlands' },
  { code: 'pl', label: 'PL', name: 'Polski' },
  { code: 'hu', label: 'HU', name: 'Magyar' },
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

// Category definitions with icons (SVG paths)
const CATEGORIES = [
  {
    id: 'music',
    route: '/music',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    available: true,
  },
  {
    id: 'books',
    route: '/books',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8M8 11h6" />
      </svg>
    ),
    available: false,
  },
  {
    id: 'films',
    route: '/films',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
      </svg>
    ),
    available: false,
  },
  {
    id: 'news',
    route: '/news',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
        <path d="M7 10h6M7 14h3" />
      </svg>
    ),
    available: false,
  },
];

export function HomePage({ onSignIn, onSignUp, onLogout, onBuyCredits, onHistory }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { balance } = useCreditsContext();
  const { t, i18n } = useTranslation();
  const [isVideoLoaded, setIsVideoLoaded] = useState(true);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const bgVideoRef = useRef(null);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    i18n.changeLanguage(langCode);
  };

  const handleCategoryClick = (category) => {
    if (category.available) {
      navigate(category.route);
    }
    // Coming soon categories don't navigate
  };

  // Start video on load
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.play().catch(() => {
        // Autoplay blocked
      });
    }
  }, []);

  return (
    <>
      <div className="home-screen">
        {/* Loading Overlay */}
        <AnimatePresence>
          {!isVideoLoaded && (
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

        {/* Auth Bar */}
        <motion.div
          className="home-auth-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <InstallButton />
          {!user ? (
            <>
              <button className="home-auth-link" onClick={onSignUp}>
                {t('auth.signUp')}
              </button>
              <button className="home-auth-link" onClick={onSignIn}>
                {t('auth.signIn')}
              </button>
            </>
          ) : (
            <div className="home-user-profile">
              <div className="home-user-top">
                <span className="home-username">{displayName}</span>
              </div>
              <div className="home-user-middle">
                <span className="home-balance">
                  {balance?.total ?? '...'} {t('userProfile.credits')}
                </span>
                <button className="home-auth-link home-buy-link" onClick={onBuyCredits}>
                  {t('userProfile.buyCredits')}
                </button>
              </div>
              <div className="home-user-bottom">
                <button className="home-auth-link" onClick={onHistory}>
                  {t('account.history')}
                </button>
                <button className="home-auth-link" onClick={onLogout || signOut}>
                  {t('userProfile.logout')}
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Background Video */}
        <div className="home-bg-video-layer">
          <video
            ref={bgVideoRef}
            className="home-bg-video"
            src="/logovideo.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setIsVideoLoaded(true)}
            onError={() => setIsVideoLoaded(true)}
          />
          <div className="home-bg-overlay" />
        </div>

        {/* Language Selector */}
        <motion.div
          className="home-language-icons"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="home-language-row">
            {LANDING_LANGUAGES.slice(0, 9).map((lang) => (
              <button
                key={lang.code}
                className={`home-language-icon ${selectedLang === lang.code ? 'selected' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
                title={lang.name}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <div className="home-language-row">
            {LANDING_LANGUAGES.slice(9, 18).map((lang) => (
              <button
                key={lang.code}
                className={`home-language-icon ${selectedLang === lang.code ? 'selected' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
                title={lang.name}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="home-content">
          {/* Logo/Title */}
          <motion.div
            className="home-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="home-title">PHILOSIFY</h1>
            <p className="home-subtitle">
              {t('home.subtitle', 'Philosophical Analysis of Everything')}
            </p>
          </motion.div>

          {/* Category Grid */}
          <motion.div
            className="home-categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                className={`home-category-card ${!category.available ? 'home-category-card--disabled' : ''}`}
                onClick={() => handleCategoryClick(category)}
                whileHover={category.available ? { scale: 1.03, y: -5 } : {}}
                whileTap={category.available ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              >
                <div className="home-category-icon">{category.icon}</div>
                <h2 className="home-category-title">
                  {t(`home.categories.${category.id}.title`, category.id)}
                </h2>
                <p className="home-category-desc">
                  {t(`home.categories.${category.id}.description`, '')}
                </p>
                {!category.available && (
                  <span className="home-category-badge">{t('home.comingSoon', 'Coming Soon')}</span>
                )}
                {category.available && (
                  <span className="home-category-cta">
                    {t('home.startAnalysis', 'Start Analysis')} &rarr;
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="home-footer-section">
        <footer className="home-footer">
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
