// HomePage - Main landing page with 4 category mini-landings
// Each box has: Logo + Search field + Analyze button
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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

// Category configurations
const CATEGORIES = [
  { id: 'music', available: true },
  { id: 'books', available: false },
  { id: 'films', available: false },
  { id: 'news', available: false },
];

// Mini Landing Box Component
function CategoryBox({ category, t, onAnalyze, isAuthenticated }) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);

  const handleAnalyze = () => {
    if (!category.available) return;
    onAnalyze(category.id, searchQuery);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleAnalyze();
    }
  };

  const placeholderKey = `home.categories.${category.id}.searchPlaceholder`;
  const placeholder = t(placeholderKey, t('home.searchDefault', 'Search...'));
  const buttonText = t(
    `home.categories.${category.id}.analyzeButton`,
    t('home.analyze', 'Analyze')
  );

  return (
    <motion.div
      className={`category-box ${!category.available ? 'category-box--disabled' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Coming Soon Overlay */}
      {!category.available && (
        <div className="category-box__overlay">
          <span className="category-box__badge">{t('home.comingSoon', 'Coming Soon')}</span>
        </div>
      )}

      {/* Logo/Video */}
      <div className="category-box__logo">
        <video
          className="category-box__video"
          src="/logovideo.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>

      {/* Category Title */}
      <h2 className="category-box__title">
        {t(`home.categories.${category.id}.title`, category.id)}
      </h2>

      {/* Search Field */}
      <div className="category-box__search">
        <input
          ref={inputRef}
          type="text"
          className="category-box__input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={!category.available}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
        />
      </div>

      {/* Analyze Button */}
      <motion.button
        className="category-box__button"
        onClick={handleAnalyze}
        disabled={!category.available || !searchQuery.trim()}
        whileHover={category.available && searchQuery.trim() ? { scale: 1.02 } : {}}
        whileTap={category.available && searchQuery.trim() ? { scale: 0.98 } : {}}
      >
        {buttonText}
      </motion.button>
    </motion.div>
  );
}

export function HomePage({ onSignIn, onSignUp, onLogout, onBuyCredits, onHistory }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { balance } = useCreditsContext();
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const bgVideoRef = useRef(null);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    i18n.changeLanguage(langCode);
  };

  const handleAnalyze = (categoryId, query) => {
    if (categoryId === 'music') {
      // Navigate to music page with the search query
      navigate('/music', { state: { initialQuery: query } });
    }
    // Other categories will be handled when implemented
  };

  // Start background video
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="home-page">
      {/* Background */}
      <div className="home-page__bg">
        <video
          ref={bgVideoRef}
          className="home-page__bg-video"
          src="/logovideo.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="home-page__bg-overlay" />
      </div>

      {/* Auth Bar */}
      <header className="home-page__header">
        <div className="home-page__header-left">
          <InstallButton />
        </div>
        <div className="home-page__header-right">
          {!user ? (
            <>
              <button className="home-page__auth-link" onClick={onSignUp}>
                {t('auth.signUp')}
              </button>
              <button className="home-page__auth-link" onClick={onSignIn}>
                {t('auth.signIn')}
              </button>
            </>
          ) : (
            <div className="home-page__user">
              <span className="home-page__username">{displayName}</span>
              <span className="home-page__balance">
                {balance?.total ?? '...'} {t('userProfile.credits')}
              </span>
              <button
                className="home-page__auth-link home-page__auth-link--buy"
                onClick={onBuyCredits}
              >
                {t('userProfile.buyCredits')}
              </button>
              <button className="home-page__auth-link" onClick={onHistory}>
                {t('account.history')}
              </button>
              <button className="home-page__auth-link" onClick={onLogout || signOut}>
                {t('userProfile.logout')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Language Selector */}
      <div className="home-page__languages">
        <div className="home-page__lang-row">
          {LANDING_LANGUAGES.slice(0, 9).map((lang) => (
            <button
              key={lang.code}
              className={`home-page__lang-btn ${selectedLang === lang.code ? 'home-page__lang-btn--active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              title={lang.name}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <div className="home-page__lang-row">
          {LANDING_LANGUAGES.slice(9, 18).map((lang) => (
            <button
              key={lang.code}
              className={`home-page__lang-btn ${selectedLang === lang.code ? 'home-page__lang-btn--active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
              title={lang.name}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Title */}
      <div className="home-page__title-section">
        <h1 className="home-page__title">PHILOSIFY</h1>
        <p className="home-page__subtitle">
          {t('home.subtitle', 'Philosophical Analysis of Everything')}
        </p>
      </div>

      {/* Category Grid */}
      <main className="home-page__grid">
        {CATEGORIES.map((category) => (
          <CategoryBox
            key={category.id}
            category={category}
            t={t}
            onAnalyze={handleAnalyze}
            isAuthenticated={!!user}
          />
        ))}
      </main>

      {/* Footer */}
      <footer className="home-page__footer">
        <div className="home-page__footer-content">
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
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
