// NewsSidebar - Slide-out Sidebar for Philosophical News Analysis
// Users browse a slow auto-scrolling ticker of headlines.
// Click a headline to expand it inline: summary + Philosopher's Panel button.
// All headlines and summaries are in the user's chosen language (fetched natively).
// Reuses music-sidebar.css classes + news-specific additions.

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
import '../../styles/music-sidebar.css';

// Auto-scrolling vertical news ticker with inline expansion
// Slow speed for comfortable reading; user can scroll freely.
// Clicking a headline expands it inline (summary + panel button).
function NewsTicker({ highlights, headlines, expandedArticle, onExpand, onPanelClick, timeAgo, t }) {
  const tickerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  // Merge: highlights first (marked), then headlines
  const allItems = [
    ...highlights.map((a) => ({ ...a, isHighlight: true })),
    ...headlines,
  ];

  // Single animation loop — runs forever, only moves when not paused
  // Uses sub-pixel accumulator so scrollTop always gets whole-pixel increments
  // (mobile browsers round fractional scrollTop to 0)
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

  // Pause when expanded, resume instantly when collapsed
  useEffect(() => {
    if (expandedArticle) {
      pausedRef.current = true;
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    } else {
      pausedRef.current = false;
    }
  }, [expandedArticle]);

  // User manual scroll: pause, resume after 8s idle
  const handleUserInteraction = useCallback(() => {
    if (expandedArticle) return;
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 8000);
  }, [expandedArticle]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const isExpanded = (article) => {
    return expandedArticle && expandedArticle.title === article.title;
  };

  const handleItemClick = (article) => {
    if (isExpanded(article)) {
      onExpand(null); // collapse
    } else {
      onExpand(article); // expand this one
    }
  };

  const renderItem = (article, i, prefix) => {
    const expanded = isExpanded(article);
    return (
      <div
        key={`${prefix}-${i}`}
        className={`news-headline__item ${article.isHighlight ? 'news-headline__item--highlight' : ''} ${expanded ? 'news-headline__item--expanded' : ''}`}
        onClick={() => handleItemClick(article)}
        role="button"
        tabIndex={0}
      >
        {article.imageUrl && (
          <img className="news-headline__image" src={article.imageUrl} alt="" loading="lazy" />
        )}
        <div className="news-headline__content">
          {article.isHighlight && <span className="news-headline__star">&#9733;</span>}
          <span className="news-headline__title">{article.title}</span>
          <span className="news-headline__meta">
            {article.source} &middot; {timeAgo(article.publishedAt)}
            {article.topic && <span className="news-headline__topic"> &middot; {article.topic}</span>}
          </span>
          {/* Expanded section: summary + Philosopher's Panel button */}
          <div className="news-headline__expanded-wrapper">
            <div className="news-headline__expanded">
              {article.description && (
                <p className="news-headline__summary">{article.description}</p>
              )}
              {!article.description && expanded && (
                <p className="news-headline__summary news-headline__summary--empty">
                  {t('news.noSummary', { defaultValue: 'No summary available for this article.' })}
                </p>
              )}
              <button
                className="news-headline__panel-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onPanelClick(article);
                }}
              >
                {t('philosopherPanel.button', { defaultValue: "Philosopher's Panel" })}
                <span className="news-headline__panel-cost">
                  3 {t('philosopherPanel.credits', { defaultValue: 'credits' })}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="news-ticker"
      ref={tickerRef}
      onWheel={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onPointerDown={handleUserInteraction}
    >
      <div className="news-ticker__track">
        {allItems.map((a, i) => renderItem(a, i, 'a'))}
        {allItems.map((a, i) => renderItem(a, i, 'b'))}
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
  const [expandedArticle, setExpandedArticle] = useState(null);
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  // Internal modals
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

  // Reset expanded article when sidebar closes
  useEffect(() => {
    if (!isOpen) {
      setExpandedArticle(null);
    }
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle panel button click from inline headline expansion
  const handleOpenPanel = (article) => {
    if (!user) {
      signupModal.open();
      return;
    }
    if (!balance || balance.total === undefined || balance.total < 3) {
      if (article) {
        setPendingAction({ type: 'news-analysis', article });
      }
      paymentModal.open();
      return;
    }
    selectArticle(article); // Set as selected for analysis
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

  // Reset everything and go back to ticker
  const handleAnalyzeAnother = () => {
    clearArticle();
    setExpandedArticle(null);
  };

  // Time since article was published
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return t('news.justNow', { defaultValue: 'Just now' });
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
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
          {/* Loading indicator during panel analysis */}
          {panelLoading && (
            <div className="music-analyze">
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
              {panelError && <div className="music-error">{panelError}</div>}
            </div>
          )}

          {/* Auto-scrolling headlines ticker — visible until analysis starts */}
          {!panelLoading && !panelResult && (
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
                  expandedArticle={expandedArticle}
                  onExpand={setExpandedArticle}
                  onPanelClick={handleOpenPanel}
                  timeAgo={timeAgo}
                  t={t}
                />
              )}
            </div>
          )}

          {/* Panel result */}
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
                    analysisId={panelResult.id}
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
                onClick={handleAnalyzeAnother}
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
