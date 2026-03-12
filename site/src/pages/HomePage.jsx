// HomePage - Landing page with interactive logo
// Sidebar-based architecture: clicking symbols opens sidebars, not pages
// Hover effect: line extends outward with label (PowerPoint diagram style)
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { changeLanguageWithPreload } from '@/i18n/config';
import { useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';
import { InstallButton } from '@/components/pwa/InstallButton';
import '@/styles/landing.css';
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

// 6 hotspots clockwise from top: ideas, films, news, community, books, music
// Each has position (%), line direction, and label position
const HOTSPOTS = [
  {
    id: 'ideas',
    top: 11,
    left: 39,
    width: 20,
    height: 18,
    lineDirection: 'up',
  },
  {
    id: 'films',
    top: 22,
    left: 61,
    width: 22,
    height: 22,
    lineDirection: 'right',
  },
  {
    id: 'news',
    top: 59,
    left: 68,
    width: 20,
    height: 20,
    lineDirection: 'right',
  },
  {
    id: 'community',
    top: 70,
    left: 35,
    width: 25,
    height: 25,
    lineDirection: 'down',
  },
  {
    id: 'books',
    top: 55,
    left: 9,
    width: 20,
    height: 22,
    lineDirection: 'left',
  },
  {
    id: 'music',
    top: 19,
    left: 14,
    width: 18,
    height: 25,
    lineDirection: 'left',
  },
];

// Hotspot component with line and label
function Hotspot({ hotspot, onClick, label }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`logo-hotspot logo-hotspot--${hotspot.lineDirection}`}
      style={{
        top: `${hotspot.top}%`,
        left: `${hotspot.left}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
      }}
      onClick={() => onClick(hotspot.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(hotspot.id)}
    >
      {/* Line and label that appear on hover */}
      <div className={`hotspot-line ${isHovered ? 'hotspot-line--visible' : ''}`}>
        <div className="hotspot-line__bar" />
        <div className="hotspot-line__label">{label}</div>
      </div>
    </div>
  );
}

export function HomePage({
  onSignIn,
  onSignUp,
  onLogout,
  onBuyCredits,
  onHistory,
  onOpenMusic,
  onOpenCommunity,
  onOpenCategory,
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [visibleLabels, setVisibleLabels] = useState([]);
  const { user, signOut } = useAuth();
  const { balance } = useCreditsContext();
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const handleLanguageChange = async (langCode) => {
    setSelectedLang(langCode);
    await changeLanguageWithPreload(langCode);
  };

  // Handle hotspot clicks - dispatch to appropriate sidebar
  const handleHotspotClick = (categoryId) => {
    switch (categoryId) {
      case 'music':
        onOpenMusic?.();
        break;
      case 'community':
        onOpenCommunity?.();
        break;
      default:
        // books, films, news, ideas -> ComingSoonSidebar
        onOpenCategory?.(categoryId);
        break;
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = '/logo-everything.png';
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(true);
  }, []);

  // Mobile: stagger category labels 1 by 1, starting 4s after video autoplay
  const MOBILE_LABEL_ORDER = ['music', 'ideas', 'films', 'books', 'community', 'news'];
  const LABEL_START_DELAY = 4000; // 4s after video starts
  const LABEL_STAGGER = 400; // 400ms between each label
  const isAuthenticated = !!user;
  useEffect(() => {
    if (!isAuthenticated) return;
    setVideoEnded(false);
    setVisibleLabels([]);
    const timers = MOBILE_LABEL_ORDER.map((id, i) =>
      setTimeout(() => {
        setVisibleLabels((prev) => [...prev, id]);
      }, LABEL_START_DELAY + i * LABEL_STAGGER)
    );
    // Fallback: ensure all labels show if video ends or after 10s
    const fallback = setTimeout(() => {
      setVideoEnded(true);
      setVisibleLabels(MOBILE_LABEL_ORDER);
    }, 10000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(fallback);
    };
  }, [isAuthenticated]);

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

        {/* Auth Bar */}
        <motion.div
          className="landing-auth-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -10 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {!user ? (
            <div className="landing-auth-buttons">
              <button className="landing-auth-link" onClick={onSignUp}>
                {t('auth.signUp')}
              </button>
              <button className="landing-auth-link" onClick={onSignIn}>
                {t('auth.signIn')}
              </button>
              <InstallButton />
            </div>
          ) : (
            <div className="landing-user-profile">
              <span className="landing-username">{displayName}</span>
              <span className="landing-balance">
                {balance?.total ?? '...'} {t('userProfile.credits')}
              </span>
              <button className="landing-auth-link" onClick={onHistory}>
                {t('account.history')}
              </button>
              <button className="landing-auth-link" onClick={onBuyCredits}>
                {t('userProfile.buyCredits')}
              </button>
              <button className="landing-auth-link" onClick={onLogout || signOut}>
                {t('userProfile.logout')}
              </button>
            </div>
          )}
        </motion.div>

        {/* Background */}
        <div className="bg-video-layer">
          <div className="bg-overlay" style={{ background: '#0a0020' }} />
        </div>

        {/* Logo with Hotspots */}
        <motion.div
          className="main-video-layer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.9 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className={`logo-container ${user ? 'logo-authenticated' : ''}`}>
            <div className="logo-container-inner">
              <img
                src="/logo-everything.png"
                alt="Philosify Everything"
                className="logo-image"
                onLoad={() => setIsLoaded(true)}
              />
              {/* Mobile: video replaces static logo after sign-in (CSS hides on desktop) */}
              {user && (
                <video
                  className="logo-video"
                  src="/philosify-everything video.mp4"
                  autoPlay
                  muted
                  playsInline
                  poster=""
                  onEnded={() => {
                    setVideoEnded(true);
                    setVisibleLabels(MOBILE_LABEL_ORDER);
                  }}
                  onError={() => {
                    setVideoEnded(true);
                    setVisibleLabels(MOBILE_LABEL_ORDER);
                  }}
                />
              )}
              {/* Hotspots with line+label hover effect */}
              {HOTSPOTS.map((hotspot) => (
                <Hotspot
                  key={hotspot.id}
                  hotspot={hotspot}
                  onClick={handleHotspotClick}
                  label={t(`home.categories.${hotspot.id}.title`, hotspot.id)}
                />
              ))}
            </div>
          </div>
          {/* Mobile: category labels below logo in 2 rows (CSS hides on desktop) */}
          {user && (
            <div className="mobile-category-labels">
              <div className="mobile-label-row">
                {['music', 'ideas', 'films'].map((id) => (
                  <button
                    key={`mobile-${id}`}
                    className={`mobile-label ${visibleLabels.includes(id) ? 'mobile-label--visible' : ''}`}
                    onClick={() => handleHotspotClick(id)}
                  >
                    {t(`home.categories.${id}.title`, id)}
                  </button>
                ))}
              </div>
              <div className="mobile-label-row">
                {['books', 'community', 'news'].map((id) => (
                  <button
                    key={`mobile-${id}`}
                    className={`mobile-label ${visibleLabels.includes(id) ? 'mobile-label--visible' : ''}`}
                    onClick={() => handleHotspotClick(id)}
                  >
                    {t(`home.categories.${id}.title`, id)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Language Icons */}
        <motion.div
          className="landing-language-icons"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
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
      </div>

      {/* Footer */}
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
