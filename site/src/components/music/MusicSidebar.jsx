// MusicSidebar - Slide-out Sidebar for Music Analysis
// Uses ResultsContainer for analysis display (correct API field mapping)

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ResultsContainer } from '../results/ResultsContainer';
import { LoginModal, SignupModal, ForgotPasswordModal, PaymentModal } from '../index';
import TopTenTicker from '../TopTenTicker';
import { useModal } from '../../hooks';
import '../../styles/music-sidebar.css';

export function MusicSidebar({
  isOpen,
  onClose,
  query,
  setQuery,
  results,
  loading,
  selectedTrack,
  selectTrack,
  clearTrack,
  isAnalyzing,
  analysisResult,
  analysisError,
  analyze,
  cancelAnalysis,
  elapsedTime,
  formatTime,
  user,
  balance,
  lang,
}) {
  const { t, i18n } = useTranslation();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);

  // Internal modals (rendered inside sidebar)
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && inputRef.current && !selectedTrack) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, selectedTrack]);

  useEffect(() => {
    setFocusedIndex(results.length > 0 ? 0 : -1);
  }, [results]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleSelect = (track) => {
    selectTrack(track);
    setFocusedIndex(-1);
    if (!user) {
      signupModal.open();
      return;
    }
    if (balance?.total !== undefined && balance.total <= 0) paymentModal.open();
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((p) => Math.min(p + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) handleSelect(results[focusedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleAnalyze = async () => {
    if (!user) {
      signupModal.open();
      return;
    }
    // Check if balance is not loaded yet or has zero credits
    if (!balance || balance.total === undefined || balance.total <= 0) {
      paymentModal.open();
      return;
    }
    await analyze(lang || i18n.language || 'en');
  };

  // Button enabled when track selected and not analyzing (auth/balance checked in handleAnalyze)
  const canAnalyze = selectedTrack && !isAnalyzing;

  // Handle song selection from Top 50 ticker
  const handleTickerSelect = useCallback(
    (track) => {
      selectTrack(track);
      if (!user) {
        signupModal.open();
        return;
      }
      if (balance?.total !== undefined && balance.total <= 0) {
        paymentModal.open();
      }
    },
    [selectTrack, user, balance, signupModal, paymentModal]
  );

  return (
    <>
      <div
        className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
      />
      <div
        className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="music-sidebar__header">
          <span className="music-sidebar__title">
            <span className="music-sidebar__icon">&#9835;</span>
            {t('home.categories.music.title')}
          </span>
          <button className="music-sidebar__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Top 50 Ticker - between header and search */}
        {!selectedTrack && !analysisResult && (
          <div className="music-sidebar__ticker">
            <TopTenTicker onSongSelect={handleTickerSelect} />
          </div>
        )}

        <div className="music-sidebar__content">
          <div className="music-search">
            <div className="music-search__input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="music-search__input"
                placeholder={t('landing.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!!selectedTrack}
                autoComplete="off"
              />
              {loading && (
                <div className="music-search__loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              {query && !loading && !selectedTrack && (
                <button className="music-search__clear" onClick={() => setQuery('')}>
                  &times;
                </button>
              )}
            </div>
            {selectedTrack && (
              <div className="music-selected">
                <div className="music-selected__info">
                  <div className="music-selected__song">{selectedTrack.song}</div>
                  <div className="music-selected__artist">{selectedTrack.artist}</div>
                </div>
                <button className="music-selected__clear" onClick={clearTrack}>
                  &times;
                </button>
              </div>
            )}
          </div>

          {!selectedTrack && results.length > 0 && (
            <div className="music-results">
              <div className="music-results__header">
                {t('landing.results', 'Results')} ({results.length})
              </div>
              <div className="music-results__list">
                {results.map((track, i) => (
                  <button
                    key={track.spotify_id || i}
                    className={`music-results__item ${i === focusedIndex ? 'music-results__item--focused' : ''}`}
                    onClick={() => handleSelect(track)}
                    onMouseEnter={() => setFocusedIndex(i)}
                  >
                    <span className="music-results__song">{track.song}</span>
                    <span className="music-results__artist">{track.artist}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTrack && !analysisResult && (
            <div className="music-analyze">
              {!isAnalyzing ? (
                <button
                  className="music-analyze__button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                >
                  {t('landing.scanMusic')}
                </button>
              ) : (
                <button
                  className="music-analyze__button music-analyze__button--cancel"
                  onClick={cancelAnalysis}
                >
                  {t('listen.cancel')}
                </button>
              )}
              {isAnalyzing && (
                <div className="music-timer">
                  <div className="music-timer__bar">
                    <div className="music-timer__fill"></div>
                  </div>
                  <div className="music-timer__time">
                    <span>&#9201;</span> {formatTime(elapsedTime)}
                  </div>
                  <div className="music-timer__label">{t('landing.analyzingContent')}</div>
                </div>
              )}
              {analysisError && <div className="music-error">{analysisError}</div>}
            </div>
          )}

          {analysisResult && (
            <div className="music-analysis">
              <div className="music-analysis__header">
                <span className="music-analysis__complete-icon">&#10003;</span>
                {t('landing.analysisComplete')}
              </div>
              <div className="music-analysis__results-wrapper">
                <ResultsContainer result={analysisResult} showShareActions={true} />
              </div>
              <button
                className="music-analyze__button music-analyze__button--another"
                onClick={clearTrack}
              >
                {t('landing.analyzeAnother', 'Analyze Another Song')}
              </button>
            </div>
          )}
        </div>

        {/* Internal modals - render inside sidebar for proper scoping */}
        <div className="music-sidebar__modals">
          {loginModal.isOpen && (
            <LoginModal
              onClose={loginModal.close}
              onSwitchToSignup={() => {
                loginModal.close();
                signupModal.open();
              }}
              onSwitchToForgot={() => {
                loginModal.close();
                forgotPasswordModal.open();
              }}
            />
          )}
          {signupModal.isOpen && (
            <SignupModal
              onClose={signupModal.close}
              onSwitchToLogin={() => {
                signupModal.close();
                loginModal.open();
              }}
            />
          )}
          {forgotPasswordModal.isOpen && (
            <ForgotPasswordModal
              onClose={forgotPasswordModal.close}
              onSwitchToLogin={() => {
                forgotPasswordModal.close();
                loginModal.open();
              }}
            />
          )}
          {paymentModal.isOpen && <PaymentModal onClose={paymentModal.close} />}
        </div>
      </div>
    </>
  );
}

export default MusicSidebar;
