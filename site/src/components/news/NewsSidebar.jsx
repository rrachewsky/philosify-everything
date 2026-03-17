// NewsSidebar - Slide-out Sidebar for Philosophical News Analysis
// Users browse a slow auto-scrolling ticker of headlines.
// Click a headline → new page with headline, summary, Panel button.
// Same pattern as music/literature sidebars.

import { useState, useEffect, useRef, useCallback } from 'react';
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

// Auto-scrolling vertical news ticker
function NewsTicker({ highlights, headlines, onSelect, timeAgo }) {
  const tickerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  const allItems = [
    ...highlights.map((a) => ({ ...a, isHighlight: true })),
    ...headlines,
  ];

  // Single animation loop — runs forever, only moves when not paused
  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker || allItems.length === 0) return;

    let subPixel = 0;
    let frameId;

    const scroll = () => {
      if (!pausedRef.current && ticker) {
        subPixel += 0.15;
        if (subPixel >= 1) {
          ticker.scrollTop += 1;
          subPixel -= 1;
          const halfHeight = ticker.scrollHeight / 2;
          if (halfHeight > 0 && ticker.scrollTop >= halfHeight) {
            ticker.scrollTop -= halfHeight;
          }
        }
      }
      frameId = requestAnimationFrame(scroll);
    };

    frameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frameId);
  }, [allItems.length]);

  // User manual scroll: pause, resume after 8s idle
  const handleUserInteraction = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 8000);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  return (
    <div
      className="news-ticker"
      ref={tickerRef}
      onWheel={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onPointerDown={handleUserInteraction}
    >
      <div className="news-ticker__track">
        {allItems.map((a, i) => (
          <button
            key={`a-${i}`}
            className={`news-headline__item ${a.isHighlight ? 'news-headline__item--highlight' : ''}`}
            onClick={() => onSelect(a)}
          >
            {a.imageUrl && (
              <img className="news-headline__image" src={a.imageUrl} alt="" loading="lazy" />
            )}
            <div className="news-headline__content">
              {a.isHighlight && <span className="news-headline__star">&#9733;</span>}
              <span className="news-headline__title">{a.title}</span>
              <span className="news-headline__meta">
                {a.source} &middot; {timeAgo(a.publishedAt)}
                {a.topic && <span className="news-headline__topic"> &middot; {a.topic}</span>}
              </span>
            </div>
          </button>
        ))}
        {allItems.map((a, i) => (
          <button
            key={`b-${i}`}
            className={`news-headline__item ${a.isHighlight ? 'news-headline__item--highlight' : ''}`}
            onClick={() => onSelect(a)}
          >
            {a.imageUrl && (
              <img className="news-headline__image" src={a.imageUrl} alt="" loading="lazy" />
            )}
            <div className="news-headline__content">
              {a.isHighlight && <span className="news-headline__star">&#9733;</span>}
              <span className="news-headline__title">{a.title}</span>
              <span className="news-headline__meta">
                {a.source} &middot; {timeAgo(a.publishedAt)}
                {a.topic && <span className="news-headline__topic"> &middot; {a.topic}</span>}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function NewsSidebar({
  isOpen,
  onClose,
  headlines,
  highlights,
  headlinesLoading,
  headlinesError,
  selectedArticle,
  selectArticle,
  clearArticle,
  panelLoading,
  panelResult,
  panelError,
  elapsedTime,
  formatTime,
  analyzeWithPanel,
  user,
  balance,
  lang,
}) {
  const { t, i18n } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

  // Lock body scroll when sidebar is open
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleOpenPanel = () => {
    if (!user) {
      signupModal.open();
      return;
    }
    if (!balance || balance.total === undefined || balance.total < 3) {
      if (selectedArticle) {
        setPendingAction({ type: 'news-analysis', article: selectedArticle });
      }
      paymentModal.open();
      return;
    }
    setShowPicker(true);
  };

  const handlePanelConfirm = async (chosenPhilosophers) => {
    setShowPicker(false);
    try {
      await analyzeWithPanel(chosenPhilosophers, lang || i18n.language || 'en');
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        paymentModal.open();
      }
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return t('news.justNow', { defaultValue: 'Just now' });
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

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
            <span className="music-sidebar__icon">&#128240;</span>
            {t('home.categories.news.title', 'News')}
          </span>
          <button className="music-sidebar__close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div ref={contentRef} className="music-sidebar__content">

          {/* ── STATE 1: Headlines ticker (no article selected, no result) ── */}
          {!selectedArticle && !panelResult && !panelLoading && (
            <div className="news-headlines">
              {headlinesLoading && (
                <div className="news-headlines__loading">
                  <div className="music-search__loading">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              {headlinesError && (
                <div className="music-error">{headlinesError}</div>
              )}
              {!headlinesLoading && headlines.length === 0 && highlights.length === 0 && !headlinesError && (
                <div className="news-headlines__empty">
                  {t('news.noHeadlines', { defaultValue: 'No headlines available at the moment' })}
                </div>
              )}
              {(highlights.length > 0 || headlines.length > 0) && (
                <NewsTicker
                  highlights={highlights}
                  headlines={headlines}
                  onSelect={selectArticle}
                  timeAgo={timeAgo}
                />
              )}
            </div>
          )}

          {/* ── STATE 2: Article selected — headline + summary + Panel button ── */}
          {selectedArticle && !panelResult && (
            <>
              <div className="music-selected">
                <div className="music-selected__info">
                  <div className="music-selected__song">{selectedArticle.title}</div>
                  <div className="music-selected__artist">
                    {selectedArticle.source} &middot; {timeAgo(selectedArticle.publishedAt)}
                  </div>
                </div>
                <button className="music-selected__clear" onClick={clearArticle}>
                  &times;
                </button>
              </div>

              {/* AI Summary */}
              {(selectedArticle.aiSummary || selectedArticle.description) && (
                <div className="news-summary-card">
                  <p className="news-summary-card__text">
                    {selectedArticle.aiSummary || selectedArticle.description}
                  </p>
                </div>
              )}

              {/* Panel button / loading */}
              <div className="music-analyze">
                {!panelLoading ? (
                  <button
                    className="music-analyze__button music-analyze__button--panel"
                    onClick={handleOpenPanel}
                    disabled={panelLoading}
                    style={{ width: '100%' }}
                  >
                    {t('philosopherPanel.button', { defaultValue: "Philosopher's Panel" })}
                    <span className="music-analyze__cost">
                      3 {t('philosopherPanel.credits', { defaultValue: 'credits' })}
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
                      {t('philosopherPanel.generating', { defaultValue: 'Philosophers are analyzing...' })}
                    </div>
                  </div>
                )}
                {panelError && <div className="music-error">{panelError}</div>}
              </div>
            </>
          )}

          {/* ── STATE 3: Panel result ── */}
          {panelResult && (
            <div className="music-analysis">
              <div className="music-analysis__header">
                <span className="music-analysis__complete-icon">&#10003;</span>
                {t('philosopherPanel.complete', { defaultValue: 'Philosopher Panel Complete' })}
              </div>
              <div className="listen-section">
                <ListenButton result={{
                  song_name: panelResult.title,
                  artist: panelResult.artist || selectedArticle?.source || 'News',
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
                    shareUrl={`${config.apiUrl}/api/share-preview/panel/${panelResult.id}?lang=${i18n.resolvedLanguage || i18n.language}`}
                    shareText={t('share.shareNewsText', { title: panelResult.title })}
                    songName={panelResult.title}
                    artist={selectedArticle?.source || 'News'}
                  />
                  <ShareToDMButton
                    analysisId={panelResult.id}
                    songName={panelResult.title}
                    artist={selectedArticle?.source || 'News'}
                  />
                  <ShareToCommunityButton
                    analysisId={panelResult.id}
                    songName={panelResult.title}
                    artist={selectedArticle?.source || 'News'}
                  />
                </div>
              )}
              <button
                className="music-analyze__button music-analyze__button--another"
                onClick={clearArticle}
              >
                {t('news.analyzeAnother', { defaultValue: 'Analyze Another Story' })}
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
        {(loginModal.isOpen ||
          signupModal.isOpen ||
          forgotPasswordModal.isOpen ||
          paymentModal.isOpen) && (
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
