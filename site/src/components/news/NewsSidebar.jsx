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
import { translateArticle } from '../../services/api/newsApi.js';
import { NewsSourcePicker } from './NewsSourcePicker.jsx';
import ResultsContainer from '../results/ResultsContainer.jsx';
import { PhilosopherPicker } from '../common/PhilosopherPicker';
import '../../styles/music-sidebar.css';

// ============================================================
// Breaking News Ticker — same scroll mechanics as original
// ============================================================
function BreakingTicker({ articles, onSelect, timeAgo }) {
  const tickerRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  const shuffled = useMemo(() => {
    if (articles.length <= 3) return articles;
    const copy = [...articles];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [articles]);

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker || articles.length === 0) return;
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
  }, [articles.length]);

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

  if (articles.length === 0) return null;

  const renderItem = (a, keyPrefix, i) => (
    <button
      key={`${keyPrefix}-${i}`}
      className="news-headline__item news-headline__item--highlight"
      onClick={() => onSelect(a)}
    >
      {a.imageUrl && (
        <img className="news-headline__image" src={a.imageUrl} alt="" loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }} />
      )}
      <div className="news-headline__content">
        <span className="news-headline__star">&#9889;</span>
        <span className="news-headline__title">{a.title}</span>
        <span className="news-headline__meta">
          {a.source} &middot; {timeAgo(a.publishedAt)}
        </span>
      </div>
    </button>
  );

  return (
    <div
      className="news-ticker"
      ref={tickerRef}
      onWheel={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onPointerDown={handleUserInteraction}
      style={{ maxHeight: '140px' }}
    >
      <div className="news-ticker__track">
        {articles.map((a, i) => renderItem(a, 'a', i))}
        {shuffled.map((a, i) => renderItem(a, 'b', i))}
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
  onCreditsExhausted,
}) {
  const { t, i18n } = useTranslation();
  const userLang = i18n.language || 'en';
  const contentRef = useRef(null);
  const searchInputRef = useRef(null);

  // Source picker state
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showPhilosopherPicker, setShowPhilosopherPicker] = useState(false);

  // Local search input
  const [searchInput, setSearchInput] = useState('');

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      search(searchInput.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  // Time ago formatter
  const timeAgo = useCallback((dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('news.justNow', { defaultValue: 'just now' });
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }, [t]);

  // Available sources as flat list for picker
  const availableSourcesList = useMemo(() => availableSources || {}, [availableSources]);
  const enabledSourcesList = useMemo(
    () => (enabledSources && enabledSources.length > 0 ? enabledSources : []),
    [enabledSources],
  );
  const defaultSourcesList = useMemo(() => defaultSources || [], [defaultSources]);

  if (!isOpen) return null;

  return (
    <div className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}>
      {/* Header */}
      <div className="music-sidebar__header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 className="music-sidebar__title">{t('home.categories.news.title', 'News')}</h2>
          <button
            className={`news-filter-btn ${sourcesUnlocked ? 'news-filter-btn--unlocked' : ''}`}
            onClick={() => {
              refreshPreferences();
              setShowSourcePicker(true);
            }}
            title={t('news.sources', 'Sources')}
          >
            &#9881;
          </button>
        </div>
        <button className="music-sidebar__close" onClick={onClose}>&times;</button>
      </div>

      <div ref={contentRef} className="music-sidebar__content">

        {/* ── STATE 1: Search home (no article selected, no result) ── */}
        {!selectedArticle && !panelResult && !panelLoading && !analysisResult && (
          <>
            {/* Breaking News Ticker */}
            {breakingNews.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', paddingLeft: '4px' }}>
                  {t('news.highlights', 'Breaking News')}
                </div>
                <BreakingTicker
                  articles={breakingNews}
                  onSelect={selectArticle}
                  timeAgo={timeAgo}
                />
              </div>
            )}

            {/* Search Field */}
            <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
              <div className="music-search">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="music-search__input"
                  placeholder={t('home.categories.news.searchPlaceholder', 'Search a topic, event, or theme...')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="submit"
                  className="music-search__button"
                  disabled={searchLoading || searchInput.trim().length < 2}
                >
                  {searchLoading ? (
                    <div className="music-search__loading">
                      <span></span><span></span><span></span>
                    </div>
                  ) : (
                    <span>&#128269;</span>
                  )}
                </button>
              </div>
            </form>

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
                    timeAgo={timeAgo}
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
          <div className="news-headline__expanded-wrapper">
            <button
              className="music-sidebar__back"
              onClick={clearArticle}
            >
              &larr; {t('news.backToSearch', { defaultValue: 'Back' })}
            </button>

            <div className="news-headline__expanded">
              <h3 className="news-headline__title" style={{ fontSize: '16px', marginBottom: '8px' }}>
                {selectedArticle.title}
              </h3>
              <div className="news-headline__meta" style={{ marginBottom: '12px' }}>
                {selectedArticle.source}
                {selectedArticle.publishedAt && (
                  <> &middot; {timeAgo(selectedArticle.publishedAt)}</>
                )}
              </div>
              {(selectedArticle.description || selectedArticle.aiSummary) && (
                <p className="news-headline__summary">
                  {selectedArticle.aiSummary || selectedArticle.description}
                </p>
              )}
            </div>

            {/* Analyze button (1 credit) */}
            <button
              className="music-analyze__button"
              onClick={() => analyzeArticle(userLang, 'grok')}
              disabled={isAnalyzing}
            >
              {t('home.categories.news.analyzeButton', 'Analyze Article')}
              <span className="music-analyze__cost">1 {t('philosopherPanel.credit', 'credit')}</span>
            </button>

            {/* Philosopher Panel button (3 credits) */}
            <button
              className="news-headline__panel-btn"
              onClick={() => setShowPhilosopherPicker(true)}
              disabled={panelLoading}
            >
              {t('philosopherPanel.title', 'Philosopher Panel')}
              <span className="news-headline__panel-cost">3 {t('philosopherPanel.credits', 'credits')}</span>
            </button>

            {analysisError && (
              <div className="music-error" style={{ marginTop: '12px' }}>
                {analysisError}
              </div>
            )}
          </div>
        )}

        {/* ── STATE 3: Analyzing or Panel loading ── */}
        {(isAnalyzing || panelLoading) && (
          <div className="music-sidebar__analyzing">
            <div className="music-search__loading" style={{ marginBottom: '16px' }}>
              <span></span><span></span><span></span>
            </div>
            <div className="music-sidebar__timer">
              {formatTime(elapsedTime)}
            </div>
            <p className="music-sidebar__analyzing-text">
              {panelLoading
                ? t('philosopherPanel.analyzing', 'Philosophers debating...')
                : t('news.analyzing', { defaultValue: 'Analyzing article...' })}
            </p>
          </div>
        )}

        {/* ── STATE 4a: Analysis result ── */}
        {analysisResult && !panelResult && (
          <div>
            <button
              className="music-sidebar__back"
              onClick={clearArticle}
            >
              &larr; {t('news.backToSearch', { defaultValue: 'Back' })}
            </button>
            <ResultsContainer
              result={analysisResult}
              mediaType="news"
            />
          </div>
        )}

        {/* ── STATE 4b: Philosopher Panel result ── */}
        {panelResult && (
          <div>
            <button
              className="music-sidebar__back"
              onClick={clearArticle}
            >
              &larr; {t('news.backToSearch', { defaultValue: 'Back' })}
            </button>
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
        )}

        {panelError && (
          <div className="music-error" style={{ marginTop: '12px' }}>
            {panelError}
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
          onConfirm={async (philosophers) => {
            setShowPhilosopherPicker(false);
            try {
              await analyzeWithPanel(philosophers, userLang);
            } catch (err) {
              if (err.code === 'INSUFFICIENT_CREDITS' && onCreditsExhausted) {
                onCreditsExhausted();
              }
            }
          }}
        />
      )}
    </div>
  );
}
