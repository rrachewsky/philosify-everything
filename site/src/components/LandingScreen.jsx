import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSpotifySearch, useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';
import { setPendingAction, getPendingAction, clearPendingAction } from '@utils/pendingAction.js';
import { InstallButton } from './pwa/InstallButton';
import TopTenTicker from './TopTenTicker';
import '@/styles/landing.css';

// Language icons for landing page (18 languages in 2 columns x 9 rows)
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

/**
 * LandingScreen - Full-Screen Vertical (9:16) Landing Page
 * Uses the "Spotify Canvas" effect with a 1:1 video
 *
 * Strategy:
 * 1. Background Layer: Blurred, darkened video as ambient texture
 * 2. Main Content Layer: Sharp 1:1 video with neon glass border
 * 3. UI Overlay: Search field + Scan Music button
 */
export function LandingScreen({
  onSignIn,
  onSignUp,
  onLogout,
  onBuyCredits,
  onHistory,
  onViewAnalysis,
}) {
  // CRITICAL: Start with video "loaded" state to prevent infinite loading on mobile
  // The video will play if available, but we don't block the UI waiting for it
  const [isVideoLoaded, setIsVideoLoaded] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedModel] = useState('grok');
  const bgVideoRef = useRef(null);
  const mainVideoRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const abortControllerRef = useRef(null);

  const { user, signOut } = useAuth();
  const { balance, setBalance } = useCreditsContext();
  const { t, i18n } = useTranslation();

  // Get display name from user
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const { query, results, loading, setQuery, selectTrack, clearAll } = useSpotifySearch();

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [, setIsFocused] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');

  // Handle language change - update i18n and local state
  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    i18n.changeLanguage(langCode);
  };
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Restore track selection after returning from Stripe payment
  useEffect(() => {
    const pending = getPendingAction();
    if (pending?.type === 'analysis' && pending.track && user && !selectedTrack) {
      const track = pending.track;
      selectTrack(track);
      setSelectedTrack(track);
      clearPendingAction();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chronometer effect - uses Date.now() for accurate timing
  useEffect(() => {
    if (isAnalyzing) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);

      const updateTimer = () => {
        if (startTimeRef.current) {
          setElapsedTime(Date.now() - startTimeRef.current);
        }
        timerRef.current = requestAnimationFrame(updateTimer);
      };

      timerRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [isAnalyzing]);

  // Format time as MM:SS.ms
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Start both videos together - no continuous sync needed for looping videos
  // Sync on initial load only to avoid stuttering from constant currentTime adjustments
  useEffect(() => {
    const startVideos = async () => {
      if (bgVideoRef.current && mainVideoRef.current) {
        // Reset both to start
        bgVideoRef.current.currentTime = 0;
        mainVideoRef.current.currentTime = 0;

        // Play both simultaneously
        try {
          await Promise.all([bgVideoRef.current.play(), mainVideoRef.current.play()]);
        } catch (e) {
          // Autoplay blocked, that's ok - videos will play on user interaction
          console.log('[LandingScreen] Autoplay blocked:', e.message);
        }
      }
    };

    startVideos();
  }, []);

  // Handle search results dropdown
  useEffect(() => {
    if (loading) {
      setShowDropdown(false);
      return;
    }
    const shouldShow = results.length > 0 && query.trim().length > 0;
    setShowDropdown(shouldShow);
    if (results.length > 0) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
    }
  }, [results, query, loading]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideInput = inputRef.current && !inputRef.current.contains(target);

      if (isOutsideDropdown && isOutsideInput) {
        setTimeout(() => {
          setShowDropdown(false);
        }, 100);
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    // If video fails to load, show UI anyway (graceful degradation)
    console.log('[LandingScreen] Video failed to load - showing UI anyway');
    setIsVideoLoaded(true);
  };

  const handleSelect = (track) => {
    selectTrack(track);
    setSelectedTrack(track);
    setShowDropdown(false);

    // If user is not logged in, open sign up modal
    if (!user) {
      onSignUp?.();
      return;
    }

    // If user is logged in but has no credits, open buy credits modal
    if (balance !== null && balance <= 0) {
      setPendingAction({
        type: 'analysis',
        track: { song: track.song, artist: track.artist, spotify_id: track.spotify_id },
        model: selectedModel,
        lang: selectedLang,
      });
      onBuyCredits?.();
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < results.length) {
          handleSelect(results[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    clearAll();
    setSelectedTrack(null);
    inputRef.current?.focus();
  };

  const handleScanMusic = async () => {
    if (!selectedTrack || !user) {
      if (!user) onSignUp?.();
      return;
    }

    // Check if user has credits
    if (balance !== null && balance <= 0) {
      setPendingAction({
        type: 'analysis',
        track: {
          song: selectedTrack.song,
          artist: selectedTrack.artist,
          spotify_id: selectedTrack.spotify_id,
        },
        model: selectedModel,
        lang: selectedLang,
      });
      onBuyCredits?.();
      return;
    }

    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    setElapsedTime(0);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const { config } = await import('@/config');

      const response = await fetch(`${config.apiUrl}/api/analyze`, {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookie for auth
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          song: selectedTrack.song,
          artist: selectedTrack.artist,
          spotify_id: selectedTrack.spotify_id,
          model: selectedModel,
          lang: selectedLang,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data);
      setAnalysisComplete(true);

      // Update balance immediately from response (no extra API call needed)
      if (data.balance && typeof data.balance.total !== 'undefined') {
        setBalance({
          total: data.balance.total,
          credits: data.balance.credits,
          freeRemaining: data.balance.freeRemaining,
        });
      }

      // Auto-navigate to results page when analysis completes
      if (onViewAnalysis) {
        onViewAnalysis(data);
      }
    } catch (error) {
      // Don't show error if it was a cancellation
      if (error.name === 'AbortError') {
        console.log('Analysis cancelled by user');
        return;
      }
      console.error('Analysis error:', error);
      setAnalysisError(error.message);
      setAnalysisComplete(false);
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setElapsedTime(0);
    setAnalysisError(null); // Clear any existing error message
  };

  const isButtonDisabled = !selectedTrack || (!user && !analysisComplete);

  return (
    <>
      <div className="landing-screen">
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

        {/* LAYER 0: Top Auth Bar */}
        <motion.div
          className="landing-auth-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isVideoLoaded ? 1 : 0, y: isVideoLoaded ? 0 : -10 }}
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

        {/* LAYER 1: Background Video (Blurred Atmosphere) */}
        <div className="bg-video-layer">
          <video
            ref={bgVideoRef}
            className="bg-video"
            src="/logovideo.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            loading="eager"
            onLoadedData={handleVideoLoaded}
            onError={handleVideoError}
            onCanPlay={() => {
              // Ensure video plays smoothly
              if (bgVideoRef.current) {
                bgVideoRef.current.play().catch(() => {
                  // Autoplay blocked, that's ok
                });
              }
            }}
          />
          <div className="bg-overlay" />
        </div>

        {/* LAYER 2: Main Video Card */}
        <motion.div
          className="main-video-layer"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isVideoLoaded ? 1 : 0, scale: isVideoLoaded ? 1 : 0.9 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="video-card">
            <div className="video-card-inner">
              <video
                ref={mainVideoRef}
                className="main-video"
                src="/logovideo.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                loading="eager"
                onCanPlay={() => {
                  // Ensure video plays smoothly
                  if (mainVideoRef.current) {
                    mainVideoRef.current.play().catch(() => {
                      // Autoplay blocked, that's ok
                    });
                  }
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* LAYER 2.5: Language Icons (all users - mobile: top row, desktop: left columns) */}
        <motion.div
          className="landing-language-icons"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Column 1 - first 9 languages (Western/Central Europe) */}
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
          {/* Column 2 - last 9 languages (Eastern Europe/Asia/Middle East) */}
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

        {/* LAYER 3: UI Overlay */}
        <div className="ui-layer">
          <div className="landing-search-section">
            {/* Top 50 Ticker — outside animation to prevent desktop fade-in/slide glitch */}
            <div className="landing-ticker-wrapper">
              <TopTenTicker
                onSongSelect={(track) => {
                  setSelectedTrack(track);
                  setQuery('');
                  clearAll();
                }}
              />
            </div>

            <motion.div
              className="landing-search-animated"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVideoLoaded ? 1 : 0, y: isVideoLoaded ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* Search Input */}
              {!selectedTrack && (
                <div className="landing-search-container">
                  <input
                    ref={inputRef}
                    id="songInputMobile"
                    className="landing-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={t('landing.searchPlaceholder')}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />

                  {/* Clear button */}
                  {query && !loading && (
                    <button type="button" className="landing-search-clear" onClick={handleClear}>
                      ×
                    </button>
                  )}

                  {/* Loading dots */}
                  {loading && query.trim().length > 0 && (
                    <div className="landing-search-loading">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}

                  {/* Dropdown */}
                  {!loading && showDropdown && results.length > 0 && focusedIndex >= 0 && (
                    <div ref={dropdownRef} className="landing-flip-window">
                      <div
                        className="landing-flip-content"
                        onClick={() => handleSelect(results[focusedIndex])}
                      >
                        <span className="landing-flip-song">{results[focusedIndex].song}</span>
                        <span className="landing-flip-separator"> - </span>
                        <span className="landing-flip-artist">{results[focusedIndex].artist}</span>
                      </div>
                      <div className="landing-flip-footer">
                        <button
                          className="landing-nav-arrow"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedIndex((prev) => Math.max(prev - 1, 0));
                          }}
                          disabled={focusedIndex === 0}
                        >
                          &lt;
                        </button>
                        <div className="landing-flip-counter">
                          {focusedIndex + 1} / {results.length}
                        </div>
                        <button
                          className="landing-nav-arrow"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedIndex((prev) => Math.min(prev + 1, results.length - 1));
                          }}
                          disabled={focusedIndex === results.length - 1}
                        >
                          &gt;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Track Display */}
              {selectedTrack && (
                <div className="landing-selected-track">
                  <div className="landing-selected-info">
                    <div className="landing-selected-song">{selectedTrack.song}</div>
                    <div className="landing-selected-artist">{selectedTrack.artist}</div>
                  </div>
                  <button type="button" className="landing-selected-clear" onClick={handleClear}>
                    ×
                  </button>
                </div>
              )}

              {/* Scan Music Button / Cancel Button */}
              {!isAnalyzing ? (
                <motion.button
                  className="cta-button"
                  onClick={handleScanMusic}
                  disabled={isButtonDisabled}
                  whileHover={!isButtonDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isButtonDisabled ? { scale: 0.98 } : {}}
                >
                  {t('landing.scanMusic')}
                </motion.button>
              ) : (
                <motion.button
                  className="cta-button cta-button--cancel"
                  onClick={handleCancelAnalysis}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('listen.cancel')}
                </motion.button>
              )}

              {/* Error message */}
              {analysisError && <div className="landing-error-message">{analysisError}</div>}

              {/* Timer & Chronometer */}
              <div className="landing-timer-section">
                {/* Progress Bar with marks */}
                <div className="landing-timer-bar-container">
                  <div
                    className={`landing-timer-bar ${isAnalyzing ? 'active' : ''} ${analysisComplete ? 'complete' : ''}`}
                  >
                    <div className="landing-timer-bar-fill"></div>
                    <div className="landing-timer-bar-glow"></div>
                  </div>
                  {/* Time marks: 0, 30, 60, 90, 120, 150, 180 */}
                  <div className="landing-timer-marks">
                    <span className="landing-timer-mark" style={{ left: '0%' }}>
                      0
                    </span>
                    <span className="landing-timer-mark" style={{ left: '16.67%' }}>
                      30
                    </span>
                    <span className="landing-timer-mark" style={{ left: '33.33%' }}>
                      60
                    </span>
                    <span className="landing-timer-mark" style={{ left: '50%' }}>
                      90
                    </span>
                    <span className="landing-timer-mark" style={{ left: '66.67%' }}>
                      120
                    </span>
                    <span className="landing-timer-mark" style={{ left: '83.33%' }}>
                      150
                    </span>
                    <span className="landing-timer-mark" style={{ left: '100%' }}>
                      180
                    </span>
                  </div>
                </div>

                <div className="landing-timer-row">
                  <div className="landing-timer-icon">⏱</div>
                  <div
                    className={`landing-chronometer ${isAnalyzing ? 'active' : ''} ${analysisComplete ? 'complete' : ''}`}
                  >
                    {formatTime(elapsedTime)}
                  </div>
                </div>
                {isAnalyzing && (
                  <div className="landing-timer-label">{t('landing.analyzingContent')}</div>
                )}
                {analysisComplete && (
                  <div className="landing-timer-label landing-timer-label--complete">
                    {t('landing.analysisComplete')}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Community Hub is now rendered globally via Router.jsx (CommunityHub sidebar + FAB) */}
        </div>
      </div>

      {/* Footer Section - scrollable area below landing screen (desktop only) */}
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

export default LandingScreen;
