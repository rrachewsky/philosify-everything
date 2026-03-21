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

  // For seamless loop: need enough items so the scroll doesn't jump visibly.
  // If very few articles, repeat them more times.
  const repeatCount = articles.length < 5 ? 4 : 2;
  const allItems = [];
  for (let r = 0; r < repeatCount; r++) {
    const source = r === 0 ? articles : shuffled;
    source.forEach((a, i) => {
      allItems.push({ ...a, _key: `${r}-${i}` });
    });
  }

  return (
    <div
      className="news-ticker--breaking"
      ref={tickerRef}
      onWheel={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onPointerDown={handleUserInteraction}
    >
      <div className="news-ticker__track">
        {allItems.map((a) => (
          <button
            key={a._key}
            className="news-search-result"
            onClick={() => onSelect(a)}
          >
            {a.imageUrl && (
              <img className="news-search-result__image" src={a.imageUrl} alt="" loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <div className="news-search-result__content">
              <span className="news-search-result__source">
                {a.source}
                {a.publishedAt && <> &middot; {timeAgo(a.publishedAt)}</>}
              </span>
              <span className="news-search-result__title">{a.title}</span>
            </div>
          </button>
        ))}
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
            <span style={{ fontSize: '13px', marginRight: '4px' }}>&#9881;</span>
            <span style={{ fontSize: '11px' }}>{t('news.sources', 'Sources')}</span>
          </button>
        </div>
        <button className="music-sidebar__close" onClick={onClose}>&times;</button>
      </div>

      <div ref={contentRef} className="music-sidebar__content">

        {/* ── STATE 1: Search home (no article selected, no result) ── */}
        {!selectedArticle && !panelResult && !panelLoading && !analysisResult && (
          <>
            {/* Breaking News Ticker — no loading state, appears when data arrives */}
            {breakingNews.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#ff00ff', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', paddingLeft: '4px', fontFamily: "'Orbitron', sans-serif" }}>
                  {t('news.breakingNews', 'Breaking News')}
                </div>
                <BreakingTicker
                  articles={breakingNews}
                  onSelect={selectArticle}
                  timeAgo={formatDate}
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
                  <> &middot; {formatDate(selectedArticle.publishedAt)}</>
                )}
              </div>
              {(selectedArticle.description || selectedArticle.aiSummary) && (
                <p className="news-headline__summary">
                  {selectedArticle.aiSummary || selectedArticle.description}
                </p>
              )}
            </div>

            {/* Buttons — identical layout to Music/Cinema/Literature */}
            <div className="music-analyze__buttons-row">
              <button
                className="music-analyze__button"
                onClick={() => analyzeArticle(userLang, 'grok')}
                disabled={isAnalyzing || panelLoading}
              >
                {t('home.categories.news.analyzeButton', 'Analyze Article')}
                <span className="music-analyze__cost">1 {t('philosopherPanel.credit', 'credit')}</span>
              </button>
              <button
                className="music-analyze__button music-analyze__button--panel"
                onClick={() => setShowPhilosopherPicker(true)}
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
                onClick={() => setShowPhilosopherPicker(true)}
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
