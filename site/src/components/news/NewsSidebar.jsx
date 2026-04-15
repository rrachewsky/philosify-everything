// ============================================================
// NewsSidebar — Search-based News module
// ============================================================
// STATE 1: Search home (breaking ticker + search field + results)
// STATE 2: Article selected (headline, summary, Analyze button)
// STATE 3: Analyzing (timer, loading)
// STATE 4: Analysis result (ResultsContainer with 4 cards)
// ============================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNewsPreferences } from '../../hooks/useNewsPreferences.js';
import { useModal, useAuth } from '../../hooks';
import { translateArticle } from '../../services/api/newsApi.js';
import { NewsSourcePicker } from './NewsSourcePicker.jsx';
import { LoginModal, SignupModal, ForgotPasswordModal, PaymentModal } from '../index';
import InlineAdSlot from '../ads/InlineAdSlot.jsx';
import ResultsContainer from '../results/ResultsContainer.jsx';
import { PhilosopherPicker } from '../common/PhilosopherPicker';
import { setPendingAction } from '../../utils/pendingAction.js';
import '../../styles/music-sidebar.css';

// ============================================================
// Breaking News Ticker — uses EXACT same classes as Music TopTenTicker
// Only differences: label text + item content
// ============================================================
function BreakingTicker({ articles, onSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const trackRef = useRef(null);

  if (articles.length === 0) return null;

  const duplicated = [...articles, ...articles, ...articles];
  const count = articles.length;
  const animationDuration = count * 16; // 16 seconds per item — double Music's 8s for readable headlines

  const handleMouseDown = (e) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeftState(trackRef.current.scrollLeft);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeftState - (x - startX) * 2;
  };

  return (
    <div className="top-ten-ticker" style={{ direction: 'ltr', position: 'relative', borderRadius: '6px' }}>
      <div className="ticker-label">
        <span className="ticker-icon">&#9889;</span>
        <span>BREAKING</span>
      </div>
      <div
        className="ticker-track"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div
          className={`ticker-content ${isDragging ? 'paused' : ''}`}
          style={{ animationDuration: `${animationDuration}s` }}
        >
          {duplicated.map((a, i) => (
            <button
              key={`${a.url || ''}-${i}`}
              className="ticker-item"
              onClick={() => onSelect(a)}
              style={{ direction: 'ltr' }}
            >
              <span className="ticker-rank">{a.source}</span>
              <span className="ticker-separator">—</span>
              <span className="ticker-song">{a.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Search Result Card
// ============================================================
function SearchResultCard({ article, onSelect, userLang, timeAgo }) {
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(null);
  const needsTranslation = article.lang && article.lang !== 'eng' &&
    article.lang !== (userLang === 'en' ? 'eng' : userLang);

  const handleTranslate = async (e) => {
    e.stopPropagation();
    setTranslating(true);
    try {
      const result = await translateArticle(article.title, article.description, userLang);
      setTranslated(result);
    } catch (err) {
      console.error('Translation failed:', err.message);
    } finally {
      setTranslating(false);
    }
  };

  const displayTitle = translated?.title || article.title;
  const displayDesc = translated?.summary || article.description;

  return (
    <button
      className="news-search-result"
      onClick={() => onSelect({
        ...article,
        title: displayTitle,
        description: displayDesc,
        aiSummary: displayDesc,
      })}
    >
      {article.imageUrl && (
        <img className="news-search-result__image" src={article.imageUrl} alt="" loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }} />
      )}
      <div className="news-search-result__content">
        <span className="news-search-result__source">
          {article.source}
          {article.publishedAt && (
            <> &middot; {timeAgo(article.publishedAt)}</>
          )}
        </span>
        <span className="news-search-result__title">{displayTitle}</span>
        {displayDesc && (
          <span className="news-search-result__desc">
            {displayDesc.substring(0, 150)}{displayDesc.length > 150 ? '...' : ''}
          </span>
        )}
        {needsTranslation && !translated && (
          <button
            className="news-search-result__translate"
            onClick={handleTranslate}
            disabled={translating}
          >
            {translating ? '...' : '🌐 Translate'}
          </button>
        )}
      </div>
    </button>
  );
}

// ============================================================
// Main NewsSidebar Component
// ============================================================
export default function NewsSidebar({
  isOpen,
  onClose,
  news,
  balance,
  onAdLoaded,
}) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const userLang = i18n.language || 'en';
  const contentRef = useRef(null);
  const searchInputRef = useRef(null);

  // Internal modals (rendered inside sidebar)
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

  // Source picker state
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showPhilosopherPicker, setShowPhilosopherPicker] = useState(false);

  // News source preferences
  const {
    unlocked: sourcesUnlocked,
    unlocking: sourcesUnlocking,
    saving: sourcesSaving,
    availableSources,
    enabledSources,
    defaultSources,
    unlock: unlockSources,
    updateSources,
    refreshPreferences,
  } = useNewsPreferences();

  const {
    searchInput,
    setSearchInput,
    breakingNews,
    breakingLoading,
    searchResults,
    searchLoading,
    searchError,
    lastQuery,
    searchFiltered,
    search,
    searchAllSources,
    selectedArticle,
    selectArticle,
    clearArticle,
    isAnalyzing,
    analysisResult,
    analysisError,
    analyzeArticle,
    panelLoading,
    panelResult,
    panelError,
    analyzeWithPanel,
    elapsedTime,
    formatTime,
  } = news;

  // Handle analyze with auth/balance check (same pattern as Music)
  const handleAnalyze = async () => {
    if (!selectedArticle) return;
    if (!user) {
      signupModal.open();
      return;
    }
    // Wait for balance to load
    if (balance === null) return;
    
    if (balance.total === undefined || balance.total < 1) {
      setPendingAction({ type: 'news-analysis', article: selectedArticle });
      paymentModal.open();
      return;
    }
    try {
      await analyzeArticle(userLang, 'grok');
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setPendingAction({ type: 'news-analysis', article: selectedArticle });
        paymentModal.open();
      }
    }
  };

  // Handle philosopher panel with auth/balance check
  const handleOpenPanel = () => {
    if (!user) {
      signupModal.open();
      return;
    }
    // Wait for balance to load
    if (balance === null) return;
    
    if (balance.total === undefined || balance.total < 3) {
      if (selectedArticle) {
        setPendingAction({ type: 'news-panel', article: selectedArticle });
      }
      paymentModal.open();
      return;
    }
    setShowPhilosopherPicker(true);
  };

  // Handle panel confirm with error handling
  const handlePanelConfirm = async (philosophers) => {
    setShowPhilosopherPicker(false);
    try {
      await analyzeWithPanel(philosophers, userLang);
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setPendingAction({ type: 'news-panel', article: selectedArticle });
        paymentModal.open();
      }
    }
  };

  // Scroll to top when state changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [selectedArticle, analysisResult, panelResult]);

  // Focus search input when sidebar opens
  useEffect(() => {
    if (isOpen && !selectedArticle && !analysisResult && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [isOpen, selectedArticle, analysisResult]);

  // Debounced real-time search — same as Music/Literature/Cinema
  const debounceRef = useRef(null);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = val.trim();
    if (trimmed.length >= 3) {
      debounceRef.current = setTimeout(() => {
        search(trimmed);
      }, 600);
    }
  }, [search, setSearchInput]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Date formatter: dd/mm/yyyy hh:mm (TZ)
  const userTZ = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
        .formatToParts(new Date())
        .find((p) => p.type === 'timeZoneName')?.value || '';
    } catch { return ''; }
  }, []);

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}${userTZ ? ` (${userTZ})` : ''}`;
  }, [userTZ]);

  // Available sources as flat list for picker
  const availableSourcesList = useMemo(() => availableSources || {}, [availableSources]);
  const enabledSourcesList = useMemo(
    () => (enabledSources && enabledSources.length > 0 ? enabledSources : []),
    [enabledSources],
  );
  const defaultSourcesList = useMemo(() => defaultSources || [], [defaultSources]);

  // Lock body scroll when sidebar is open (same as MusicSidebar)
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

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`}
        onClick={onClose}
      />
      <div className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}>
      {/* Header */}
      <div className="music-sidebar__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="music-sidebar__title">
            <span className="music-sidebar__icon">&#128240;</span>
            {t('home.categories.news.title', 'News')}
          </span>
          <button
            className={`news-filter-btn ${sourcesUnlocked ? 'news-filter-btn--unlocked' : ''}`}
            onClick={() => {
              refreshPreferences();
              setShowSourcePicker(true);
            }}
            title={t('news.sources', 'Sources')}
          >
            <span style={{ fontSize: '13px', marginRight: '4px' }}>&#9881;</span>
            <span style={{ fontSize: '11px' }}>{t('news.sources', 'Sources')}</span>
          </button>
        </div>
        <button className="music-sidebar__close" onClick={onClose}>&times;</button>
      </div>

      {/* Ticker — between header and content, same as Music's TopTenTicker position */}
      {!selectedArticle && !analysisResult && !panelResult && breakingNews.length > 0 && (
        <div className="music-sidebar__ticker">
          <BreakingTicker
            articles={breakingNews}
            onSelect={selectArticle}
          />
        </div>
      )}

      <div ref={contentRef} className="music-sidebar__content">
        {/* Ad at top of sidebar - always visible */}
        <InlineAdSlot
          key="news-sidebar-top"
          userId={user?.id}
          placement="sidebar"
          layout="card"
          refreshKey="news-sidebar-top"
          className="sidebar-top-ad"
          onAdLoaded={onAdLoaded}
        />

        {/* ── STATE 1: Search home (no article selected, no result) ── */}
        {!selectedArticle && !panelResult && !panelLoading && !analysisResult && (
          <>
            {/* Search Field — same structure as Music's search */}
            <div className="music-search">
              <div className="music-search__input-wrapper">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="music-search__input"
                  placeholder={t('home.categories.news.searchPlaceholder', 'Search a topic, event, or theme...')}
                  value={searchInput}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
                {searchLoading && (
                  <div className="music-search__spinner">
                    <div className="music-search__loading">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Search Error */}
            {searchError && (
              <div className="music-error" style={{ marginBottom: '12px' }}>
                {searchError}
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="news-search-results">
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', paddingLeft: '4px' }}>
                  {searchResults.length} {t('news.results', { defaultValue: 'results' })}
                  {searchFiltered && ` (${t('news.filteredSources', { defaultValue: 'from your sources' })})`}
                </div>
                {searchResults.map((article, i) => (
                  <SearchResultCard
                    key={`${article.url || i}`}
                    article={article}
                    onSelect={selectArticle}
                    userLang={userLang}
                    timeAgo={formatDate}
                  />
                ))}
              </div>
            )}

            {/* Empty filtered result */}
            {lastQuery && !searchLoading && searchResults.length === 0 && !searchError && searchFiltered && (
              <div className="news-headlines__empty" style={{ textAlign: 'center', padding: '30px 20px' }}>
                <p>{t('news.noFilteredResults', { defaultValue: 'No results from your selected sources.' })}</p>
                <button
                  className="music-analyze__button"
                  onClick={searchAllSources}
                  style={{ marginTop: '12px' }}
                >
                  {t('news.searchAllSources', { defaultValue: 'Search all sources' })}
                </button>
              </div>
            )}

            {/* Empty unfiltered result */}
            {lastQuery && !searchLoading && searchResults.length === 0 && !searchError && !searchFiltered && (
              <div className="news-headlines__empty">
                {t('news.noResults', { defaultValue: 'No articles found for this search.' })}
              </div>
            )}
          </>
        )}

        {/* ── STATE 2: Article selected (not yet analyzed) ── */}
        {selectedArticle && !analysisResult && !isAnalyzing && !panelResult && !panelLoading && (
          <div>
            {/* Selected article — same pattern as Music, white title, no truncation */}
            <div className="music-selected news-selected-title">
              <div className="music-selected__info">
                <div className="music-selected__song">{selectedArticle.title}</div>
                <div className="music-selected__artist">
                  {selectedArticle.source}
                  {selectedArticle.publishedAt && (
                    <> &middot; {formatDate(selectedArticle.publishedAt)}</>
                  )}
                </div>
              </div>
              <button className="music-selected__clear" onClick={clearArticle}>
                &times;
              </button>
            </div>

            {(selectedArticle.description || selectedArticle.aiSummary) && (
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', margin: '12px 0' }}>
                {selectedArticle.aiSummary || selectedArticle.description}
              </p>
            )}

            {/* Buttons — identical layout to Music/Cinema/Literature */}
            <div className="music-analyze__buttons-row">
              <button
                className="music-analyze__button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || panelLoading}
              >
                {t('home.categories.news.analyzeButton', 'Analyze Article')}
                <span className="music-analyze__cost">1 {t('philosopherPanel.credit', 'credit')}</span>
              </button>
              <button
                className="music-analyze__button music-analyze__button--panel"
                onClick={handleOpenPanel}
                disabled={isAnalyzing || panelLoading}
              >
                {t('philosopherPanel.button', 'Philosopher Panel')}
                <span className="music-analyze__cost">3 {t('philosopherPanel.credits', 'credits')}</span>
              </button>
            </div>

            {(analysisError || panelError) && (
              <div className="music-error">{analysisError || panelError}</div>
            )}
          </div>
        )}

        {/* ── STATE 3: Analyzing or Panel loading — same timer as Music ── */}
        {(isAnalyzing || panelLoading) && (
          <>
            <div className="music-timer">
              <div className="music-timer__bar">
                <div className="music-timer__fill"></div>
              </div>
              <div className="music-timer__time">
                <span>&#9201;</span> {formatTime(elapsedTime)}
              </div>
              <div className="music-timer__label">
                {panelLoading
                  ? t('philosopherPanel.generating', 'Philosophers are analyzing...')
                  : t('news.analyzing', { defaultValue: 'Analyzing article...' })}
              </div>
            </div>
          </>
        )}

        {/* ── STATE 4a: Analysis result — same layout as Music ── */}
        {analysisResult && !panelResult && (
          <div className="music-analysis">
            <div className="music-analysis__header">
              <span className="music-analysis__complete-icon">&#10003;</span>
              {t('landing.analysisComplete', 'Analysis Complete')}
            </div>
            <div className="music-analysis__results-wrapper">
              <ResultsContainer result={analysisResult} mediaType="news" showShareActions={true} />
            </div>
            <div className="music-analyze__buttons-row" style={{ marginTop: '1rem' }}>
              <button
                className="music-analyze__button music-analyze__button--panel"
                onClick={handleOpenPanel}
              >
                {t('philosopherPanel.button', 'Philosopher Panel')}
                <span className="music-analyze__cost">3 {t('philosopherPanel.credits', 'credits')}</span>
              </button>
              <button
                className="music-analyze__button music-analyze__button--another"
                onClick={clearArticle}
              >
                {t('news.analyzeAnother', 'Analyze Another Story')}
              </button>
            </div>
          </div>
        )}

        {/* ── STATE 4b: Philosopher Panel result ── */}
        {panelResult && (
          <div className="music-analysis">
            <div className="music-analysis__header">
              <span className="music-analysis__complete-icon">&#10003;</span>
              {t('philosopherPanel.complete', 'Panel Analysis Complete')}
            </div>
            <div className="music-analysis__results-wrapper">
              <ResultsContainer
                result={{
                  song_name: selectedArticle?.title,
                  artist: selectedArticle?.source,
                  philosophical_analysis: panelResult,
                  media_type: 'news',
                  lang: userLang,
                  id: `panel-${Date.now()}`,
                }}
                mediaType="news"
              />
            </div>
            <div className="music-analyze__buttons-row" style={{ marginTop: '1rem' }}>
              <button
                className="music-analyze__button music-analyze__button--another"
                onClick={clearArticle}
              >
                {t('news.analyzeAnother', 'Analyze Another Story')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Source Picker Modal */}
      <NewsSourcePicker
        isOpen={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        unlocked={sourcesUnlocked}
        unlocking={sourcesUnlocking}
        saving={sourcesSaving}
        availableSources={availableSourcesList}
        enabledSources={enabledSourcesList}
        defaultSources={defaultSourcesList}
        onUnlock={unlockSources}
        onSave={async (sources) => {
          try {
            await updateSources(sources);
            setShowSourcePicker(false);
          } catch (err) {
            console.error('[NewsSidebar] Save error:', err);
            setShowSourcePicker(false);
          }
        }}
        balance={balance}
      />

      {/* Philosopher Picker Modal */}
      {showPhilosopherPicker && (
        <PhilosopherPicker
          onClose={() => setShowPhilosopherPicker(false)}
          onConfirm={handlePanelConfirm}
        />
      )}

      {/* Auth/Payment Modals */}
      {(loginModal.isOpen || signupModal.isOpen || forgotPasswordModal.isOpen || paymentModal.isOpen) && (
        <div className="music-sidebar__modals">
          {loginModal.isOpen && (
            <LoginModal
              isOpen={true}
              onClose={loginModal.close}
              onSwitchToSignup={() => {
                loginModal.close();
                signupModal.open();
              }}
              onSwitchToForgotPassword={() => {
                loginModal.close();
                forgotPasswordModal.open();
              }}
            />
          )}
          {signupModal.isOpen && (
            <SignupModal
              isOpen={true}
              onClose={signupModal.close}
              onSwitchToLogin={() => {
                signupModal.close();
                loginModal.open();
              }}
            />
          )}
          {forgotPasswordModal.isOpen && (
            <ForgotPasswordModal
              isOpen={true}
              onClose={forgotPasswordModal.close}
              onSwitchToLogin={() => {
                forgotPasswordModal.close();
                loginModal.open();
              }}
            />
          )}
          {paymentModal.isOpen && (
            <PaymentModal isOpen={true} onClose={paymentModal.close} />
          )}
        </div>
      )}
    </div>
    </>
  );
}
