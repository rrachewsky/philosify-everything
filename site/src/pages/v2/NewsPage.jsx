// NewsPage - v2 NEWS module (module-template STANDARD).
// Mockup: new_design/philosify-news.html (visual truth); functionality lifted
// from components/news/NewsSidebar.jsx + hooks/useNews.js + useNewsPreferences.
// Endpoints: GET /api/news/breaking, GET /api/news/search, POST /api/news-analyze
// (1 credit, 401 refresh-retry), POST /api/philosopher-panel (3 credits),
// POST /api/news/translate, POST /api/news/tts (via ttsCache), GET/PUT
// /api/user/news-preferences (+ /unlock, 1 credit), GET /api/analysis/:id and
// GET /api/panel/:id for history replay (Addendum 1).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { PageShell, ModuleHeader, Ticker, Telemetry, Button, Pill } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import InlineAdSlot from '../../components/ads/InlineAdSlot.jsx';
import { useNews } from '../../hooks/useNews.js';
import { useNewsPreferences } from '../../hooks/useNewsPreferences.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { translateArticle } from '../../services/api/newsApi.js';
import { setPendingAction, getPendingAction, clearPendingAction } from '../../utils/pendingAction.js';
import { waitForMinimumAnalysisWindow } from '../../utils/analysisDelay.js';
import { config } from '../../config';
import { SourcePickerModal } from './news/SourcePickerModal.jsx';
import { PhilosopherPickerModal } from './news/PhilosopherPickerModal.jsx';
import { TTSBar } from './news/TTSBar.jsx';
import '../../styles/v2-pages/news.css';

// Analysis fields arrive as sanitized-on-render HTML (same treatment as
// ResultsContainer: DOMPurify + dangerouslySetInnerHTML). Plain text gets
// wrapped into paragraphs.
function Prose({ text, className = 'prose' }) {
  const html = useMemo(() => {
    if (!text) return '';
    const s = String(text);
    const isHtml = /<\/?[a-z][^>]*>/i.test(s);
    const raw = isHtml
      ? s
      : s
          .split(/\n{2,}/)
          .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
    return DOMPurify.sanitize(raw);
  }, [text]);
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Search result / selected-article row (v2 compact cell).
// Preserves the sidebar's on-demand translation (POST /api/news/translate).
function ResultRow({ article, selected, onSelect, onClear, userLang, formatDate, t }) {
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(null);
  const needsTranslation =
    article.lang && article.lang !== 'eng' && article.lang !== (userLang === 'en' ? 'eng' : userLang);

  const displayTitle = translated?.title || article.title;
  const displayDesc = translated?.summary || article.description;

  const handleTranslate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (translating) return;
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

  return (
    <a
      className={`cell row${selected ? ' sel' : ''}`}
      href="#article"
      onClick={(e) => {
        e.preventDefault();
        if (selected) {
          onClear();
        } else {
          onSelect({ ...article, title: displayTitle, description: displayDesc, aiSummary: displayDesc });
        }
      }}
    >
      <h2>{displayTitle}</h2>
      <p>
        {article.source}
        {article.publishedAt && (
          <>
            {' · '}
            {selected ? <span className="hl">{formatDate(article.publishedAt)}</span> : formatDate(article.publishedAt)}
          </>
        )}
        {selected && <> · {t('v2.news.selectedTag', 'selected')}</>}
        {needsTranslation && !translated && (
          <>
            {' · '}
            <span
              className="trl"
              role="button"
              tabIndex={0}
              onClick={handleTranslate}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslate(e)}
            >
              {translating ? t('v2.news.translating', 'Translating…') : t('v2.news.translate', 'Translate')}
            </span>
          </>
        )}
      </p>
    </a>
  );
}

export default function NewsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { balance } = useCreditsContext();
  const userLang = i18n.language || 'en';

  const news = useNews();
  const prefs = useNewsPreferences();

  // ── Page-local scan state (logic copied from useNews.analyzeArticle,
  //    which is sidebar-coupled; +401 refresh-retry per WP3 contract) ──
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  const adDurationRef = useRef(null);
  const [adMediaType, setAdMediaType] = useState(null);

  const [showSources, setShowSources] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [replay, setReplay] = useState(null); // { type: 'analysis' | 'panel', data }
  const [replayError, setReplayError] = useState(null);

  const searchRef = useRef(null);
  const resultRef = useRef(null);
  const debounceRef = useRef(null);

  const handleAdLoaded = useCallback(({ duration, mediaType }) => {
    adDurationRef.current = duration;
    if (mediaType) setAdMediaType(mediaType);
  }, []);

  // ── Mount: payment-resume (Addendum 1, same as sidebar openWithPendingAction)
  //    + breaking ticker load + search focus ──
  useEffect(() => {
    const action = getPendingAction();
    if ((action?.type === 'news-analysis' || action?.type === 'news-panel') && action.article) {
      news.selectArticle(action.article);
      clearPendingAction();
    } else if (!location.state?.resume) {
      setTimeout(() => searchRef.current?.focus(), 300);
    }
    news.loadBreaking();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── History replay (Addendum 1): ?analysis=<id> via GET /api/analysis/:id
  //    (news analyses live in the analyses table; the 4 news fields ride in
  //    metadata), ?panel=<id> via GET /api/panel/:id. 401 → refresh, retry once. ──
  useEffect(() => {
    const analysisId = searchParams.get('analysis');
    const panelId = searchParams.get('panel');
    if (!analysisId && !panelId) return undefined;
    let cancelled = false;

    const fetchRetry = async (url) => {
      let res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) {
        await fetch(`${config.apiUrl.replace(/\/$/, '')}/auth/session`, { credentials: 'include' });
        res = await fetch(url, { credentials: 'include' });
      }
      return res;
    };

    (async () => {
      try {
        if (panelId) {
          const res = await fetchRetry(`${config.apiUrl}/api/panel/${panelId}`);
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json();
          if (cancelled) return;
          const panel = data.panel || data;
          news.selectArticle({ title: panel.title, source: panel.artist || panel.source || '' });
          setReplay({ type: 'panel', data: panel });
        } else {
          const res = await fetchRetry(`${config.apiUrl}/api/analysis/${analysisId}`);
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json();
          if (cancelled) return;
          const meta = data.metadata || {};
          const mapped = {
            ...data,
            media_type: 'news',
            title: data.song_name || data.song || data.title,
            source: data.artist || '',
            the_facts: meta.the_facts || '',
            source_analysis: meta.source_analysis || '',
            hits_and_misses: meta.hits_and_misses || '',
            philosify_opinion: meta.philosify_opinion || '',
          };
          news.selectArticle({
            title: mapped.title,
            source: mapped.source,
            publishedAt: meta.publishedAt || null,
            description: data.summary || '',
          });
          setReplay({ type: 'analysis', data: mapped });
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[NewsPage] History replay failed:', err.message);
          setReplayError(t('v2.news.replayError', 'Could not load that analysis from history.'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Debounced live search (same tuning as the sidebar: ≥3 chars, 600ms) ──
  const handleInputChange = useCallback(
    (e) => {
      const val = e.target.value;
      news.setSearchInput(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const trimmed = val.trim();
      if (trimmed.length >= 3) {
        debounceRef.current = setTimeout(() => {
          news.search(trimmed);
        }, 600);
      }
    },
    [news]
  );

  // Newest-first per the mockup's declared contract
  const sortedResults = useMemo(
    () =>
      [...news.searchResults].sort(
        (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
      ),
    [news.searchResults]
  );

  const formatDate = useCallback(
    (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      try {
        return new Intl.DateTimeFormat(userLang, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
      } catch {
        return d.toDateString();
      }
    },
    [userLang]
  );

  // ── Selection wrappers: clear page-local results alongside hook state ──
  const selectArticle = useCallback(
    (article) => {
      setAnalysisResult(null);
      setAnalysisError(null);
      setReplay(null);
      setReplayError(null);
      news.selectArticle(article);
    },
    [news]
  );

  const clearAll = useCallback(() => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setReplay(null);
    setReplayError(null);
    news.clearArticle();
    if (searchParams.get('analysis') || searchParams.get('panel')) {
      navigate('/news', { replace: true });
    }
  }, [news, navigate, searchParams]);

  // ── Scan (1 credit): POST /api/news-analyze with 401 refresh-retry;
  //    result reveal time-gated by waitForMinimumAnalysisWindow (Addendum 2) ──
  const runScan = useCallback(
    async (article, lang, model = 'grok') => {
      setIsAnalyzing(true);
      setAnalysisError(null);
      setElapsedTime(0);
      const startTime = Date.now();
      timerRef.current = setInterval(() => setElapsedTime(Date.now() - startTime), 100);

      try {
        const body = JSON.stringify({
          title: article.title,
          source: article.source || '',
          description: article.description || article.aiSummary || '',
          topic: article.topic || '',
          publishedAt: article.publishedAt || null,
          aiSummary: article.aiSummary || '',
          model,
          lang,
        });
        const doPost = () =>
          fetch(`${config.apiUrl}/api/news-analyze`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body,
          });

        let response = await doPost();
        if (response.status === 401) {
          await fetch(`${config.apiUrl.replace(/\/$/, '')}/auth/session`, { credentials: 'include' });
          response = await doPost();
        }

        const data = await response.json();
        if (!response.ok) {
          if (response.status === 402) {
            throw Object.assign(new Error(data.error || 'Insufficient credits'), {
              code: 'INSUFFICIENT_CREDITS',
            });
          }
          throw new Error(data.error || `Analysis failed: ${response.status}`);
        }

        await waitForMinimumAnalysisWindow(startTime, adDurationRef.current);
        setAnalysisResult(data);
        window.dispatchEvent(new CustomEvent('credits-changed'));
      } catch (err) {
        setAnalysisError(err.message || 'Analysis failed');
        throw err;
      } finally {
        setIsAnalyzing(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    },
    []
  );

  const cancelScan = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisError(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Credit-gated actions (same shapes as the sidebar) ──
  const handleScan = async () => {
    const article = news.selectedArticle;
    if (!article || isAnalyzing || news.panelLoading) return;
    if (!user) {
      navigate('/signup');
      return;
    }
    if (balance === null) return; // wait for balance to load
    if (balance.total === undefined || balance.total < 1) {
      setPendingAction({ type: 'news-analysis', article });
      window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
      return;
    }
    try {
      await runScan(article, userLang, 'grok');
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setPendingAction({ type: 'news-analysis', article });
        window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
      }
    }
  };

  const handleOpenPanel = () => {
    if (!news.selectedArticle || isAnalyzing || news.panelLoading) return;
    if (!user) {
      navigate('/signup');
      return;
    }
    if (balance === null) return;
    if (balance.total === undefined || balance.total < 3) {
      setPendingAction({ type: 'news-panel', article: news.selectedArticle });
      window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
      return;
    }
    setShowPicker(true);
  };

  const handlePanelConfirm = async (philosophers) => {
    setShowPicker(false);
    setReplay(null);
    try {
      await news.analyzeWithPanel(philosophers, userLang);
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        setPendingAction({ type: 'news-panel', article: news.selectedArticle });
        window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
      }
    }
  };

  // ── Derived render state ──
  const selected = news.selectedArticle;
  const activePanel = news.panelResult || (replay?.type === 'panel' ? replay.data : null);
  const activeScan =
    !activePanel && (analysisResult || (replay?.type === 'analysis' ? replay.data : null));
  const busy = isAnalyzing || news.panelLoading;
  const selectedInResults =
    selected &&
    sortedResults.some((a) => (a.url && selected.url ? a.url === selected.url : a.title === selected.title));

  // Bring the result stack into view when it lands (sidebar scrolled to top)
  useEffect(() => {
    if ((activeScan || activePanel) && resultRef.current) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      resultRef.current.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }
  }, [activeScan, activePanel]);

  const adKeyBase = selected?.url || selected?.title || 'unknown';

  return (
    <PageShell status={t('v2.news.status', 'Analysis Engine // Active')} nav={<NavAccount />}>
      <div className="pg-news">
        <section className="mod-section">
          <ModuleHeader title={t('v2.news.title', 'NEWS')}>
            <Ticker stat={t('v2.news.tickerStat', 'Read the news, armed')}>
              {t('v2.news.breaking', 'Breaking')} //{' '}
              {news.breakingLoading && news.breakingNews.length === 0 ? (
                t('v2.news.breakingLoading', 'Loading breaking news…')
              ) : news.breakingNews.length === 0 ? (
                t('v2.news.breakingEmpty', 'No breaking headlines right now')
              ) : (
                news.breakingNews.map((a, i) => (
                  <span key={a.url || i}>
                    {i > 0 && ' · '}
                    <button type="button" className="bk-item" onClick={() => selectArticle(a)}>
                      {a.title}
                    </button>
                  </span>
                ))
              )}
            </Ticker>
          </ModuleHeader>

          <div className="body">
            {/* Search — GET /api/news/search, results newest to oldest */}
            <input
              ref={searchRef}
              type="text"
              className="f"
              placeholder={t('v2.news.searchPlaceholder', 'Search an issue — results from newest to oldest')}
              value={news.searchInput}
              onChange={handleInputChange}
              autoComplete="off"
            />
            <div className="meta-row">
              <span>
                {news.searchLoading
                  ? t('v2.news.searching', 'Searching…')
                  : news.searchResults.length > 0
                  ? `${news.searchResults.length} ${t('v2.news.results', 'results')}${
                      news.searchFiltered ? ` (${t('v2.news.fromYourSources', 'from your sources')})` : ''
                    }`
                  : ''}
              </span>
              <a
                href="#sources"
                onClick={(e) => {
                  e.preventDefault();
                  setShowSources(true);
                }}
              >
                {t('v2.news.sources', 'Sources')}
              </a>
            </div>

            {news.searchError && <div className="err">{news.searchError}</div>}
            {replayError && <div className="err">{replayError}</div>}

            {/* Result rows */}
            {sortedResults.length > 0 && (
              <div className="rows">
                {sortedResults.map((article, i) => (
                  <ResultRow
                    key={article.url || `${article.title}-${i}`}
                    article={article}
                    selected={
                      !!selected &&
                      (article.url && selected.url
                        ? article.url === selected.url
                        : article.title === selected.title)
                    }
                    onSelect={selectArticle}
                    onClear={clearAll}
                    userLang={userLang}
                    formatDate={formatDate}
                    t={t}
                  />
                ))}
              </div>
            )}

            {/* Empty states (filtered / unfiltered), preserving "Search all sources" */}
            {news.lastQuery &&
              !news.searchLoading &&
              news.searchResults.length === 0 &&
              !news.searchError &&
              news.searchFiltered && (
                <div className="empty">
                  <p>{t('v2.news.noFilteredResults', 'No results from your selected sources.')}</p>
                  <Button variant="secondary" onClick={news.searchAllSources}>
                    {t('v2.news.searchAllSources', 'Search all sources')}
                  </Button>
                </div>
              )}
            {news.lastQuery &&
              !news.searchLoading &&
              news.searchResults.length === 0 &&
              !news.searchError &&
              !news.searchFiltered && (
                <div className="mnote">{t('v2.news.noResults', 'No articles found for this search.')}</div>
              )}

            {/* Selection made outside the result list (ticker / history replay) */}
            {selected && !selectedInResults && (
              <div className="rows">
                <a
                  className="cell row sel"
                  href="#selected"
                  onClick={(e) => {
                    e.preventDefault();
                    clearAll();
                  }}
                >
                  <h2>{selected.title}</h2>
                  <p>
                    {selected.source}
                    {selected.publishedAt && (
                      <>
                        {' · '}
                        <span className="hl">{formatDate(selected.publishedAt)}</span>
                      </>
                    )}
                    {' · '}
                    {t('v2.news.selectedTag', 'selected')}
                  </p>
                </a>
              </div>
            )}

            {/* Selected article summary (shown before spending a credit) */}
            {selected && !activeScan && !activePanel && !busy && (selected.aiSummary || selected.description) && (
              <p className="selsum">{selected.aiSummary || selected.description}</p>
            )}

            {/* Action cells — cost shown before the click (Law) */}
            <div className="acts">
              <a
                className={`cell${!selected || busy ? ' inactive' : ''}`}
                href="#scan"
                aria-disabled={!selected || busy}
                onClick={(e) => {
                  e.preventDefault();
                  handleScan();
                }}
              >
                <h2>{t('v2.news.scanTitle', 'SCAN NEWS')}</h2>
                <p>
                  {t(
                    'v2.news.scanDesc',
                    "Source and its bias, where it errs and where it is right, and Philosify's opinion."
                  )}
                </p>
                <span className="credit">{t('v2.news.scanCost', '1 CREDIT')}</span>
              </a>
              <a
                className={`cell${!selected || busy ? ' inactive' : ''}`}
                href="#panel"
                aria-disabled={!selected || busy}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenPanel();
                }}
              >
                <h2>{t('v2.news.panelTitle', 'PHILOSOPHER PANEL')}</h2>
                <p>
                  {t(
                    'v2.news.panelDesc',
                    'After the scan: call three philosophers to analyze the same story in character.'
                  )}
                </p>
                <span className="credit">{t('v2.news.panelCost', '3 CREDITS')}</span>
              </a>
            </div>

            {(analysisError || news.panelError) && <div className="err">{analysisError || news.panelError}</div>}

            {/* Analyzing telemetry + InlineAdSlot (Addendum 2: mounted exactly as
                the sidebar does; the reveal stays gated in runScan) */}
            {isAnalyzing && (
              <>
                <Telemetry
                  label={t('v2.news.analyzing', 'Analyzing')}
                  time={news.formatTime(elapsedTime)}
                  progress={Math.min(96, (elapsedTime / 45000) * 100)}
                  onCancel={cancelScan}
                  cancelLabel={t('v2.news.cancel', 'Cancel')}
                />
                <InlineAdSlot
                  key={`news-analysis-${adKeyBase}`}
                  userId={user?.id}
                  placement="sidebar"
                  layout="card"
                  refreshKey={`news-analysis-${adKeyBase}`}
                  className="analysis-ad-slot"
                  onAdLoaded={handleAdLoaded}
                />
              </>
            )}
            {news.panelLoading && (
              <>
                <Telemetry
                  label={t('v2.news.panelGenerating', 'Philosophers are analyzing…')}
                  time={news.formatTime(news.panelElapsed)}
                  progress={Math.min(96, (news.panelElapsed / 60000) * 100)}
                />
                <InlineAdSlot
                  key={`news-panel-${adKeyBase}`}
                  userId={user?.id}
                  placement="sidebar"
                  layout="card"
                  refreshKey={`news-panel-${adKeyBase}`}
                  className="analysis-ad-slot"
                  onAdLoaded={handleAdLoaded}
                  mediaType={adMediaType}
                />
              </>
            )}

            {/* Scan output — mockup regions mapped to the real response:
                EXCERPT ← the_facts · FRAMING ← source_analysis ·
                RELIABILITY ← hits_and_misses · PHILOSIFY OPINION ← philosify_opinion */}
            {activeScan && !busy && (
              <div ref={resultRef}>
                <div className="scan">
                  <div className="cell static">
                    <h2>{t('v2.news.excerptTitle', 'SCAN OUTPUT // EXCERPT')}</h2>
                    <Prose text={activeScan.the_facts || activeScan.philosophical_analysis} />
                  </div>
                  {(activeScan.source_analysis || activeScan.hits_and_misses) && (
                    <div className="side">
                      {activeScan.source_analysis && (
                        <div className="cell static">
                          <h2>{t('v2.news.framingTitle', 'FRAMING')}</h2>
                          <Prose className="prose sm" text={activeScan.source_analysis} />
                        </div>
                      )}
                      {activeScan.hits_and_misses && (
                        <div className="cell static">
                          <h2>{t('v2.news.reliabilityTitle', 'RELIABILITY')}</h2>
                          <Prose className="prose sm" text={activeScan.hits_and_misses} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {activeScan.philosify_opinion && (
                  <div className="cell static opinion">
                    <h2>{t('v2.news.opinionTitle', 'PHILOSIFY OPINION')}</h2>
                    <Prose text={activeScan.philosify_opinion} />
                  </div>
                )}
                <TTSBar result={activeScan} lang={userLang} t={t} />
                <div className="actions">
                  {!activePanel && (
                    <button className="btns panelbtn" onClick={handleOpenPanel}>
                      {t('v2.news.panelTitle', 'PHILOSOPHER PANEL')}
                      <span className="pill">{t('v2.news.panelCost', '3 CREDITS')}</span>
                    </button>
                  )}
                  <a
                    href="#another"
                    onClick={(e) => {
                      e.preventDefault();
                      clearAll();
                    }}
                  >
                    {t('v2.news.analyzeAnother', 'Analyze another story')}
                  </a>
                </div>
              </div>
            )}

            {/* Philosopher Panel output */}
            {activePanel && !busy && (
              <div ref={activeScan ? undefined : resultRef}>
                <div className="cell static panelout">
                  <h2>{t('v2.news.panelOutTitle', 'PHILOSOPHER PANEL')}</h2>
                  {Array.isArray(activePanel.philosophers) && activePanel.philosophers.length > 0 && (
                    <span className="phl-row">
                      {activePanel.philosophers.map((name) => (
                        <Pill key={name}>{name}</Pill>
                      ))}
                    </span>
                  )}
                  <Prose text={activePanel.analysis || activePanel.philosophical_analysis} />
                </div>
                <TTSBar
                  result={{
                    id: activePanel.id,
                    title: activePanel.title,
                    song_name: activePanel.title,
                    artist: activePanel.artist,
                    philosophical_analysis: activePanel.analysis || activePanel.philosophical_analysis,
                    lang: activePanel.lang || userLang,
                  }}
                  lang={userLang}
                  t={t}
                />
                <div className="actions">
                  <a
                    href="#another"
                    onClick={(e) => {
                      e.preventDefault();
                      clearAll();
                    }}
                  >
                    {t('v2.news.analyzeAnother', 'Analyze another story')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Transaction modals */}
        <SourcePickerModal
          open={showSources}
          onClose={() => setShowSources(false)}
          prefs={prefs}
          balance={balance}
          t={t}
        />
        <PhilosopherPickerModal
          open={showPicker}
          onClose={() => setShowPicker(false)}
          onConfirm={handlePanelConfirm}
          loading={news.panelLoading}
          t={t}
        />
      </div>
      <V2ModalsHost />
    </PageShell>
  );
}
