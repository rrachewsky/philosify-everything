// CinemaSidebar — Slide-out sidebar for philosophical film analysis
// Same pattern as LiteratureSidebar: search -> select -> Philosopher's Panel
// Reuses music-sidebar.css classes

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ListenButton } from '../results/ListenButton';
import { LoginModal, SignupModal, ForgotPasswordModal, PaymentModal } from '../index';
import { PhilosopherPicker } from '../common/PhilosopherPicker';
import { ShareButton } from '../sharing/ShareButton';
import { ShareToDMButton } from '../sharing/ShareToDMButton';
import { ShareToCommunityButton } from '../sharing/ShareToCommunityButton';
import { useModal } from '../../hooks';
import { setPendingAction } from '../../utils/pendingAction.js';
import { config } from '@/config';
import '../../styles/music-sidebar.css';

export function CinemaSidebar({
  isOpen,
  onClose,
  query,
  setQuery,
  results,
  searchLoading,
  hasSearched,
  searchError,
  selectedFilm,
  selectFilm,
  clearFilm,
  panelLoading,
  panelResult,
  panelError,
  elapsedTime,
  formatTime,
  analyzeWithPanel,
  user,
  balance,
}) {
  const { t, i18n } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const inputRef = useRef(null);

  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

  // Lock body scroll
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

  // Focus search on open
  useEffect(() => {
    if (isOpen && !selectedFilm && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, selectedFilm]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleOpenPanel = () => {
    if (!user) {
      signupModal.open();
      return;
    }
    if (!balance || balance.total === undefined || balance.total < 3) {
      if (selectedFilm) {
        setPendingAction({ type: 'film-panel', film: selectedFilm });
      }
      paymentModal.open();
      return;
    }
    setShowPicker(true);
  };

  const handlePanelConfirm = async (chosenPhilosophers) => {
    setShowPicker(false);
    try {
      await analyzeWithPanel(chosenPhilosophers, i18n.resolvedLanguage || i18n.language || 'en');
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        paymentModal.open();
      }
    }
  };

  const lang = i18n.resolvedLanguage || i18n.language || 'en';

  return (
    <>
      <div
        className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
      />
      <div
        ref={sidebarRef}
        className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="music-sidebar__header">
          <span className="music-sidebar__title">
            <span className="music-sidebar__icon">&#127909;</span>
            {t('home.categories.films.title', 'Cinema')}
          </span>
          <button className="music-sidebar__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div ref={contentRef} className="music-sidebar__content">
          {/* Search input — hidden once a film is selected */}
          {!panelResult && !selectedFilm && (
            <div className="music-search">
              <div className="music-search__input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="music-search__input"
                  placeholder={t('home.categories.films.searchPlaceholder', 'Search for a film...')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={!!selectedFilm}
                />
                {searchLoading && (
                  <div className="music-search__loading">
                    <span></span><span></span><span></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search results */}
          {!selectedFilm && !panelResult && results.length > 0 && (
            <div className="music-results">
              <div className="music-results__list">
                {results.map((film) => (
                  <button
                    key={film.tmdb_id}
                    className="music-results__item"
                    onClick={() => selectFilm(film)}
                  >
                    <span className="music-results__song">{film.title} {film.year ? `(${film.year})` : ''} {film.countries?.length ? `[${film.countries.join('/')}]` : ''}</span>
                    <span className="music-results__artist">
                      {[film.director, ...(film.cast || [])].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {!selectedFilm && !panelResult && hasSearched && results.length === 0 && !searchLoading && (
            <div className="music-no-results">
              {t('home.categories.films.noResults', 'No films found for your search.')}
            </div>
          )}

          {/* Selected film */}
          {selectedFilm && !panelResult && (
            <>
              <div className="music-selected">
                {selectedFilm.poster_url && (
                  <img
                    className="music-selected__cover"
                    src={selectedFilm.poster_url}
                    alt=""
                  />
                )}
                <div className="music-selected__info">
                  <div className="music-selected__song">{selectedFilm.title}</div>
                  <div className="music-selected__artist">
                    {selectedFilm.director && `${selectedFilm.director} · `}{selectedFilm.year || ''}
                  </div>
                </div>
                <button className="music-selected__clear" onClick={clearFilm}>
                  &times;
                </button>
              </div>

              {/* Film overview */}
              {selectedFilm.overview && (
                <div className="news-summary-card">
                  <p className="news-summary-card__text">
                    {selectedFilm.overview.length > 200
                      ? selectedFilm.overview.slice(0, 200) + '...'
                      : selectedFilm.overview}
                  </p>
                </div>
              )}

              {/* Panel button / loading */}
              <div className="music-analyze">
                {!panelLoading ? (
                  <button
                    className="music-analyze__button music-analyze__button--panel"
                    onClick={handleOpenPanel}
                    style={{ width: '100%' }}
                  >
                    {t('philosopherPanel.button', "Philosopher's Panel")}
                    <span className="music-analyze__cost">
                      3 {t('philosopherPanel.credits', 'credits')}
                    </span>
                  </button>
                ) : null}
                {panelLoading && (
                  <div className="music-timer">
                    <div className="music-timer__bar">
                      <div className="music-timer__fill"></div>
                    </div>
                    <div className="music-timer__time">
                      <span>&#9201;</span> {formatTime(elapsedTime)}
                    </div>
                    <div className="music-timer__label">
                      {t('philosopherPanel.generating', 'Philosophers are analyzing...')}
                    </div>
                  </div>
                )}
                {panelError && <div className="music-error">{panelError}</div>}
              </div>
            </>
          )}

          {/* Panel result */}
          {panelResult && (
            <div className="music-analysis">
              <div className="music-analysis__header">
                <span className="music-analysis__complete-icon">&#10003;</span>
                {t('philosopherPanel.complete', 'Philosopher Panel Complete')}
              </div>

              {/* Film title + synopsis */}
              {selectedFilm && (
                <div className="music-selected" style={{ marginBottom: 0 }}>
                  {selectedFilm.poster_url && (
                    <img className="music-selected__cover" src={selectedFilm.poster_url} alt="" />
                  )}
                  <div className="music-selected__info">
                    <div className="music-selected__song">{selectedFilm.title}</div>
                    <div className="music-selected__artist">
                      {[selectedFilm.director, selectedFilm.year, ...(selectedFilm.countries || [])].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              )}
              {selectedFilm?.overview && (
                <div className="news-summary-card">
                  <p className="news-summary-card__text">{selectedFilm.overview}</p>
                </div>
              )}

              <div className="listen-section">
                <ListenButton result={{
                  song_name: panelResult.title,
                  artist: panelResult.artist || selectedFilm?.director || 'Cinema',
                  philosophical_analysis: panelResult.analysis,
                  lang: panelResult.lang,
                  id: panelResult.id,
                }} />
              </div>
              <div className="music-analysis__results-wrapper">
                <div className="panel-analysis" dangerouslySetInnerHTML={{
                  __html: panelResult.analysis
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n\n/g, '</p><p>')
                    .replace(/\n/g, '<br/>')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                }} />
              </div>
              {panelResult.id && (
                <div className="result-card flex-center p-6" style={{ gap: '12px', flexWrap: 'wrap' }}>
                  <ShareButton
                    shareUrl={`${config.apiUrl}/api/share-preview/panel/${panelResult.id}?lang=${lang}`}
                    shareText={t('share.shareFilmText', {
                      title: panelResult.title,
                      artist: panelResult.artist || selectedFilm?.director || '',
                      defaultValue: `🎬 Check out the philosophical analysis of ${panelResult.title} | Philosify`,
                    })}
                    songName={panelResult.title}
                    artist={panelResult.artist || selectedFilm?.director || 'Cinema'}
                  />
                  <ShareToDMButton
                    analysisId={panelResult.id}
                    songName={panelResult.title}
                    artist={panelResult.artist || selectedFilm?.director || 'Cinema'}
                  />
                  <ShareToCommunityButton
                    analysisId={panelResult.id}
                    songName={panelResult.title}
                    artist={panelResult.artist || selectedFilm?.director || 'Cinema'}
                  />
                </div>
              )}
              <button
                className="music-analyze__button music-analyze__button--another"
                onClick={clearFilm}
              >
                {t('home.categories.films.analyzeAnother', 'Analyze Another Film')}
              </button>
            </div>
          )}
        </div>

        {/* Philosopher Picker */}
        {showPicker && (
          <PhilosopherPicker
            onConfirm={handlePanelConfirm}
            onClose={() => setShowPicker(false)}
            loading={panelLoading}
          />
        )}

        {/* Internal modals */}
        {(loginModal.isOpen || signupModal.isOpen || forgotPasswordModal.isOpen || paymentModal.isOpen) && (
          <div className="music-sidebar__modals">
            {loginModal.isOpen && (
              <LoginModal
                isOpen={true}
                onClose={loginModal.close}
                onSwitchToSignup={() => { loginModal.close(); signupModal.open(); }}
                onSwitchToForgot={() => { loginModal.close(); forgotPasswordModal.open(); }}
              />
            )}
            {signupModal.isOpen && (
              <SignupModal
                isOpen={true}
                onClose={signupModal.close}
                onSwitchToLogin={() => { signupModal.close(); loginModal.open(); }}
              />
            )}
            {forgotPasswordModal.isOpen && (
              <ForgotPasswordModal
                isOpen={true}
                onClose={forgotPasswordModal.close}
                onSwitchToLogin={() => { forgotPasswordModal.close(); loginModal.open(); }}
              />
            )}
            {paymentModal.isOpen && <PaymentModal isOpen={true} onClose={paymentModal.close} />}
          </div>
        )}
      </div>
    </>
  );
}
