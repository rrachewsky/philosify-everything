// LiteraturePage - v2 Literature module (new_design/philosify-literature.html:
// analysis mode chooser — AI SCAN 1 credit / PHILOSOPHER PANEL 3 credits —
// "otherwise the Music template"). Behavior parity with
// components/literature/LiteratureSidebar.jsx + hooks/useLiteratureSidebar.js:
// POST /api/book-search (debounced, keyboard nav, manual-entry fallback),
// POST /api/book-analyze (409 retry ×3 + 401 refresh-retry inside the hook),
// POST /api/cancel-book-analysis on cancel, POST /api/philosopher-panel
// (3 credits, PhilosopherPicker on GET /api/colloquium/roster — panel logic
// lived in the sidebar component, copied here), GET /api/books/top ticker,
// elapsed timers, TTS bar, share actions, InlineAdSlot +
// waitForMinimumAnalysisWindow gate (inside the hook), pendingAction shapes
// 'book-analysis' / 'panel-analysis' + v2-open-buy-credits, payment-resume
// on mount, history replay ?analysis= / ?panel=.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PageShell,
  ModuleHeader,
  Ticker,
  Cell,
  Button,
  Telemetry,
  analysisProgress,
  Field,
  ActionsRow,
  TrackCard,
  useMarqueeDuration,
} from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { PhilosopherPicker } from '../../components/common/PhilosopherPicker';
import { ShareButton } from '../../components/sharing/ShareButton';
import { ShareToDMButton } from '../../components/sharing/ShareToDMButton';
import { ShareToCommunityButton } from '../../components/sharing/ShareToCommunityButton';
import InlineAdSlot from '../../components/ads/InlineAdSlot.jsx';
import PanelAnalysisCards from '../../components/results/PanelAnalysisCards.jsx';
import { useLiteratureSidebar } from '../../hooks/useLiteratureSidebar.js';
import { useAuth } from '../../hooks/useAuth';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { requestPhilosopherPanel } from '../../services/api/philosopherPanel.js';
import { setPendingAction, getPendingAction, clearPendingAction } from '../../utils/pendingAction.js';
import { config } from '../../config';
import { authService } from '../../services/auth';
import { AnalysisSections } from './literature/AnalysisSections.jsx';
import { V2AudioBar } from './literature/V2AudioBar.jsx';
import '../../styles/v2-pages/literature.css';

const openBuyCredits = () => window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));

// Top 50 books strip inside the module ticker (GET /api/books/top,
// refreshed every 5 minutes; items select the book — same as the sidebar's
// TopBooksTicker).
function TopBooksStrip({ onSelect }) {
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [runRef, duration] = useMarqueeDuration([books]);

  useEffect(() => {
    let alive = true;
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/books/top`);
        if (response.ok && alive) {
          const data = await response.json();
          setBooks(data.books || []);
        }
      } catch {
        // ticker is decorative-functional; stay silent on failure
      }
    };
    fetchBooks();
    const interval = setInterval(fetchBooks, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  if (books.length === 0) {
    return <>{t('v2.literature.tickerFallback', 'Google Books catalog')}</>;
  }

  const doubled = [...books, ...books];
  return (
    <span className="t50">
      <span className="lbl">{t('v2.literature.top50', 'Top 50 >>>')}</span>
      <span className="t50-strip">
        <span
          className="t50-run"
          ref={runRef}
          style={{ animationDuration: `${duration ?? books.length * 8}s` }}
        >
          {doubled.map((book, i) => (
            <a
              key={`${book.id}-${i}`}
              href="#top50"
              onClick={(e) => {
                e.preventDefault();
                onSelect(book);
              }}
            >
              #{(i % books.length) + 1} {book.title}
              {book.author ? ` — ${book.author}` : ''}
            </a>
          ))}
        </span>
      </span>
    </span>
  );
}

export default function LiteraturePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const { balance } = useCreditsContext();
  const ls = useLiteratureSidebar();
  const lang = i18n.resolvedLanguage || i18n.language || 'en';

  // Panel state (lived in LiteratureSidebar.jsx, not the hook — copied here)
  const [showPicker, setShowPicker] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState(null);
  const [panelError, setPanelError] = useState(null);
  const [panelElapsed, setPanelElapsed] = useState(0);
  const panelTimerRef = useRef(null);

  // Search UX state (copied from the sidebar component)
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');

  const [shareOpen, setShareOpen] = useState(null); // 'analysis' | 'panel' | null
  const [adRun, setAdRun] = useState(null); // { kind: 'analysis'|'panel', key }
  const [adLoaded, setAdLoaded] = useState(false);
  const [replayPanel, setReplayPanel] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);
  const replayedRef = useRef(false);
  const [resumeRun, setResumeRun] = useState(null); // 'book-analysis' | 'panel-analysis'

  const {
    selectedBook,
    analysisResult,
    handleAdLoaded,
    selectBook,
    clearBook,
    openWithResult,
    user,
  } = ls;
  const panel = panelResult || replayPanel;
  const result = analysisResult;
  const panelArtist = panel?.artist || selectedBook?.author || '';

  // Ad callback must be referentially stable (InlineAdSlot re-serves on change)
  const onAdLoaded = useCallback(
    (info) => {
      handleAdLoaded(info);
      setAdLoaded(true);
    },
    [handleAdLoaded]
  );

  // Ad slot lifecycle mirrors the sidebar: mounts when a run starts,
  // survives into the post-analysis slot (mockup), unmounts when the run
  // ends with nothing to show (cancel / error / clear).
  useEffect(() => {
    if (!ls.isAnalyzing && !panelLoading && !result && !panel) {
      setAdRun(null);
      setAdLoaded(false);
    }
  }, [ls.isAnalyzing, panelLoading, result, panel]);

  // Reset keyboard focus when results change (sidebar behavior)
  useEffect(() => {
    setFocusedIndex(ls.results.length > 0 ? 0 : -1);
  }, [ls.results]);

  // Panel timer cleanup on unmount
  useEffect(
    () => () => {
      if (panelTimerRef.current) clearInterval(panelTimerRef.current);
    },
    []
  );

  // Mount thread (Addendum 1): history replay ?analysis= / ?panel=, then
  // payment-resume from the stored pending action (shapes the sidebar used).
  useEffect(() => {
    if (replayedRef.current) return;
    replayedRef.current = true;

    const analysisId = searchParams.get('analysis');
    const panelId = searchParams.get('panel');

    const fetchDetail = async (retried) => {
      const res = await fetch(`${config.apiUrl}/api/book-analysis/${analysisId}`, {
        credentials: 'include',
      });
      if (res.status === 401 && !retried) {
        await authService.getSession(); // backend auto-refresh, retry once
        return fetchDetail(true);
      }
      if (!res.ok) throw new Error(`detail ${res.status}`);
      return res.json();
    };

    if (analysisId) {
      setReplayLoading(true);
      fetchDetail(false)
        .then((data) => openWithResult(data))
        .catch(() =>
          setReplayError(t('v2.literature.replayError', 'Could not load this analysis.'))
        )
        .finally(() => setReplayLoading(false));
      return;
    }

    if (panelId) {
      setReplayLoading(true);
      fetch(`${config.apiUrl}/api/panel/${panelId}`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data) => {
          const p = data.panel;
          if (!p) throw new Error('no panel');
          selectBook({ title: p.title, author: p.artist, google_books_id: null, cover_url: null });
          setReplayPanel(p);
        })
        .catch(() =>
          setReplayError(t('v2.literature.replayError', 'Could not load this analysis.'))
        )
        .finally(() => setReplayLoading(false));
      return;
    }

    const pending = getPendingAction();
    if (pending?.book && (pending.type === 'book-analysis' || pending.type === 'panel-analysis')) {
      selectBook(pending.book);
      clearPendingAction();
      // WP7: arm the auto-run — executed below once user + balance load
      setResumeRun(pending.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Payment-resume execution (WP7): with the restored book, the user and the
  // balance all in, fire the SAME handler the user would click. The flag
  // clears first, so the handler's own credit gate can re-open Buy Credits
  // without looping.
  useEffect(() => {
    if (!resumeRun || !selectedBook || !isAuthenticated || balance === null) return;
    const run = resumeRun;
    setResumeRun(null);
    if (run === 'book-analysis') handleScan();
    else handleOpenPanel(); // philosophers are not stored — the picker IS the restore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeRun, selectedBook, isAuthenticated, balance]);

  const clearReplayParams = () => {
    if (searchParams.get('analysis') || searchParams.get('panel')) {
      setSearchParams({}, { replace: true });
    }
  };

  // The header ticker persists on the page (the sidebar hid it after
  // selection), so selecting mid-run/mid-result must reset the prior run.
  const handleSelect = (book) => {
    if (panelLoading) return;
    if (ls.isAnalyzing) ls.cancelAnalysis(); // aborts + releases the book lock
    setShareOpen(null);
    setPanelResult(null);
    setReplayPanel(null);
    setReplayError(null);
    setFocusedIndex(-1);
    clearReplayParams();
    selectBook(book);
  };

  const handleClear = () => {
    setShareOpen(null);
    setPanelResult(null);
    setReplayPanel(null);
    setReplayError(null);
    clearReplayParams();
    clearBook();
  };

  const handleKeyDown = (e) => {
    if (ls.results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((p) => Math.min(p + 1, ls.results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) handleSelect(ls.results[focusedIndex]);
    }
  };

  // AI scan — 1 credit (POST /api/book-analyze via the hook)
  const handleScan = async () => {
    if (!selectedBook || ls.isAnalyzing || panelLoading) return;
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    if (balance === null) return; // wait for balance to load (sidebar behavior)
    // No free analyses for books — always require credits (sidebar rule)
    if (balance.total === undefined || balance.total <= 0) {
      setPendingAction({ type: 'book-analysis', book: selectedBook });
      openBuyCredits();
      return;
    }
    setShareOpen(null);
    setAdLoaded(false);
    setAdRun({
      kind: 'analysis',
      key: `literature-analysis-${selectedBook?.google_books_id || selectedBook?.title || 'unknown'}`,
    });
    await ls.analyze(lang);
  };

  // Philosopher panel — 3 credits (picker first, then POST /api/philosopher-panel)
  const handleOpenPanel = () => {
    if (!selectedBook || ls.isAnalyzing || panelLoading) return;
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    if (balance === null) return;
    if (balance.total === undefined || balance.total < 3) {
      setPendingAction({ type: 'panel-analysis', book: selectedBook });
      openBuyCredits();
      return;
    }
    setShowPicker(true);
  };

  const handlePanelConfirm = async (chosenPhilosophers) => {
    // Close picker immediately so the timer is visible (sidebar behavior)
    setShowPicker(false);
    setShareOpen(null);
    setReplayPanel(null);
    setPanelLoading(true);
    setPanelError(null);
    setPanelElapsed(0);
    setAdLoaded(false);
    setAdRun({
      kind: 'panel',
      key: `literature-panel-${selectedBook?.google_books_id || selectedBook?.title || 'unknown'}`,
    });
    const startTime = Date.now();
    panelTimerRef.current = setInterval(() => setPanelElapsed(Date.now() - startTime), 100);
    try {
      const response = await requestPhilosopherPanel({
        mediaType: 'literature',
        title: selectedBook.title,
        artist: selectedBook.author,
        description: selectedBook.description || null,
        categories: selectedBook.categories ? selectedBook.categories.join(', ') : null,
        philosophers: chosenPhilosophers,
        lang,
      });
      setPanelResult(response.panel);
      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        openBuyCredits();
      } else {
        setPanelError(err.message);
      }
    } finally {
      setPanelLoading(false);
      if (panelTimerRef.current) {
        clearInterval(panelTimerRef.current);
        panelTimerRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    ls.cancelAnalysis(); // aborts + POST /api/cancel-book-analysis (lock release)
    setAdRun(null);
    setAdLoaded(false);
  };

  // Manual entry fallback (sidebar behavior)
  const handleShowManualEntry = () => {
    setShowManualEntry(true);
    setManualTitle(ls.query || '');
    setManualAuthor('');
  };
  const handleManualSubmit = () => {
    const title = manualTitle.trim();
    const author = manualAuthor.trim();
    if (!title) return;
    setShowManualEntry(false);
    setManualTitle('');
    setManualAuthor('');
    handleSelect({
      title,
      author: author || t('v2.literature.unknownAuthor', 'Unknown Author'),
      google_books_id: null,
      cover_url: null,
      year: null,
      manual: true,
    });
  };
  const handleCancelManual = () => {
    setShowManualEntry(false);
    setManualTitle('');
    setManualAuthor('');
  };

  const goCollective = (tab, groupId) =>
    navigate('/community', { state: { tab: 'collective', groupId } });

  const bookMeta = selectedBook
    ? [selectedBook.author, selectedBook.year].filter(Boolean).join(' · ')
    : '';
  const coverUrl = selectedBook?.cover_url || selectedBook?.cover;

  const analysisTitle = result?.title || result?.song_name || selectedBook?.title || '';
  const analysisArtist = result?.author || result?.artist || selectedBook?.author || '';

  const showNoResults =
    !selectedBook &&
    !ls.loading &&
    ls.hasSearched &&
    ls.results.length === 0 &&
    ls.query.length >= 2;
  const showModes =
    selectedBook && !result && !panel && !ls.isAnalyzing && !panelLoading && !replayLoading;

  return (
    <PageShell status={t('v2.literature.status', 'Analysis Engine // Active')} nav={<NavAccount />}>
      <section className="pg-literature">
        <ModuleHeader title={t('v2.literature.title', 'LITERATURE')}>
          <Ticker>
            <TopBooksStrip onSelect={handleSelect} />
          </Ticker>
        </ModuleHeader>

        <div className="mod-body">
          {replayLoading && (
            <div className="loadnote">{t('v2.literature.replayLoading', 'Loading analysis…')}</div>
          )}
          {replayError && <div className="errline">{replayError}</div>}

          {/* Search — input keeps the selection text, disabled (sidebar behavior) */}
          {!panel && !result && !replayLoading && (
            <div className="fieldwrap">
              <Field
                placeholder={t('v2.literature.searchPlaceholder', 'Search for a book...')}
                value={ls.query}
                onChange={(e) => ls.setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!!selectedBook}
                autoComplete="off"
                autoFocus={!selectedBook}
              />
              {ls.query && !ls.loading && !selectedBook && (
                <button
                  className="fclear"
                  onClick={() => ls.setQuery('')}
                  aria-label={t('v2.literature.clearSearch', 'Clear search')}
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {!selectedBook && ls.loading && (
            <div className="srload">{t('v2.literature.searching', 'Searching…')}</div>
          )}

          {!selectedBook && ls.results.length > 0 && (
            <>
              <div className="srhead">
                {t('v2.literature.results', 'Results')} ({ls.results.length})
              </div>
              <div className="srlist">
                {ls.results.map((book, i) => (
                  <button
                    key={book.google_books_id || i}
                    className={`srrow${i === focusedIndex ? ' focused' : ''}`}
                    onClick={() => handleSelect(book)}
                    onMouseEnter={() => setFocusedIndex(i)}
                  >
                    <span className="s">{book.title}</span>
                    <span className="a">
                      {book.author}
                      {book.year ? ` (${book.year})` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* No results + manual-entry fallback */}
          {showNoResults && !showManualEntry && (
            <div className="noresults">
              {t('v2.literature.noResults', 'No books found for your search.')}
              <div>
                <button className="manualbtn" onClick={handleShowManualEntry}>
                  {t('v2.literature.enterManually', "Can't find your book? Enter it manually")}
                </button>
              </div>
            </div>
          )}

          {showManualEntry && !selectedBook && (
            <div className="manual">
              <div className="mhead2">{t('v2.literature.manualEntry', 'Enter book details')}</div>
              <Field
                label={t('v2.literature.titleLabel', 'Book title *')}
                placeholder={t('v2.literature.titlePlaceholder', 'Book title *')}
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                  if (e.key === 'Escape') handleCancelManual();
                }}
                autoComplete="off"
                autoFocus
              />
              <Field
                label={t('v2.literature.authorLabel', 'Author (optional)')}
                placeholder={t('v2.literature.authorPlaceholder', 'Author (optional)')}
                value={manualAuthor}
                onChange={(e) => setManualAuthor(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                  if (e.key === 'Escape') handleCancelManual();
                }}
                autoComplete="off"
              />
              <div className="mactions">
                <Button onClick={handleManualSubmit} disabled={!manualTitle.trim()}>
                  {t('v2.literature.useThisBook', 'Use this book')}
                </Button>
                <Button variant="secondary" onClick={handleCancelManual}>
                  {t('v2.literature.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          )}

          {/* Selected book — cover + specs card (persists through the stack) */}
          {selectedBook && (
            <div className="selwrap">
              <TrackCard
                cover={coverUrl ? <img src={coverUrl} alt="" loading="lazy" /> : '¶'}
                title={selectedBook.title}
                meta={bookMeta}
              />
              {!result && !panel && !ls.isAnalyzing && !panelLoading && (
                <button
                  className="tclear"
                  onClick={handleClear}
                  aria-label={t('v2.literature.clear', 'Clear selection')}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Mode chooser (literature mockup copy) — cost before the click */}
          {showModes && (
            <div className="modes">
              <Cell
                href="#scan"
                title={t('v2.literature.scanTitle', 'AI SCAN')}
                credit={t('v2.literature.scanCredit', '1 CREDIT')}
                onClick={(e) => {
                  e.preventDefault();
                  handleScan();
                }}
              >
                {t(
                  'v2.literature.scanDesc',
                  "Deep semantic mapping of the text's philosophical tenets."
                )}
              </Cell>
              <Cell
                href="#panel"
                title={t('v2.literature.panelTitle', 'PHILOSOPHER PANEL')}
                credit={t('v2.literature.panelCredit', '3 CREDITS')}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenPanel();
                }}
              >
                {t(
                  'v2.literature.panelDesc',
                  "Simulated discourse between historical thinkers on the book's premises."
                )}
              </Cell>
            </div>
          )}

          {/* Telemetry state line + elapsed timer */}
          {ls.isAnalyzing && (
            <Telemetry
              label={t('v2.literature.analyzing', 'Analyzing')}
              time={ls.formatTime(ls.elapsedTime)}
              progress={analysisProgress(ls.elapsedTime, 30000)}
              onCancel={handleCancel}
              cancelLabel={t('v2.literature.cancel', 'Cancel')}
            />
          )}
          {panelLoading && !result && (
            <Telemetry
              label={t('v2.literature.panelAnalyzing', 'Philosophers are analyzing…')}
              time={ls.formatTime(panelElapsed)}
              progress={analysisProgress(panelElapsed, 90000)}
            />
          )}
          {(ls.analysisError || panelError) && (
            <div className="errline">{ls.analysisError || panelError}</div>
          )}

          {/* Scan result stack */}
          {result && (
            <>
              <AnalysisSections result={result} />
              <ActionsRow>
                {result.id && (
                  <a
                    href="#share"
                    onClick={(e) => {
                      e.preventDefault();
                      setShareOpen(shareOpen === 'analysis' ? null : 'analysis');
                    }}
                  >
                    {t('v2.literature.share', 'Share')}
                  </a>
                )}
                {result.id && (
                  <ShareToDMButton
                    analysisId={result.id}
                    songName={analysisTitle}
                    artist={analysisArtist}
                    philosophicalNote={result.philosophical_note}
                    classification={result.classification}
                  />
                )}
                {result.id && (
                  <ShareToCommunityButton
                    analysisId={result.id}
                    artist={analysisArtist}
                    onOpenCommunity={goCollective}
                  />
                )}
                {!panel && !panelLoading && (
                  <button className="btns panelbtn" onClick={handleOpenPanel}>
                    {t('v2.literature.panelTitle', 'PHILOSOPHER PANEL')}
                    <span className="pill">{t('v2.literature.panelCredit', '3 CREDITS')}</span>
                  </button>
                )}
                {!panel && (
                  <a
                    href="#another"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClear();
                    }}
                  >
                    {t('v2.literature.analyzeAnother', 'Analyze another')}
                  </a>
                )}
              </ActionsRow>

              {/* Panel running post-scan: same ANALYZING block, in view */}
              {panelLoading && (
                <Telemetry
                  label={t('v2.literature.panelAnalyzing', 'Philosophers are analyzing…')}
                  time={ls.formatTime(panelElapsed)}
                  progress={analysisProgress(panelElapsed, 90000)}
                />
              )}
              {shareOpen === 'analysis' && result.id && (
                <div className="sharetray">
                  <ShareButton
                    analysisId={result.id}
                    songName={analysisTitle}
                    artist={analysisArtist}
                    shareText={t('share.shareLiteratureText', {
                      title: analysisTitle,
                      artist: analysisArtist,
                    })}
                  />
                </div>
              )}
            </>
          )}

          {/* Philosopher panel stack */}
          {panel && (
            <>
              <div className="verdict">
                <span className="vlabel">
                  {t('v2.literature.panelVerdictLabel', 'Philosopher panel')}
                </span>
                <div className="vgrid">
                  <span className="classif">{(panel.philosophers || []).join(' · ')}</span>
                </div>
              </div>
              <V2AudioBar
                result={{
                  title: panel.title,
                  author: panelArtist,
                  philosophical_analysis: panel.analysis,
                  lang: panel.lang,
                  id: panel.id,
                }}
              />
              <PanelAnalysisCards analysis={panel.analysis} />
              <ActionsRow>
                {panel.id && (
                  <a
                    href="#share"
                    onClick={(e) => {
                      e.preventDefault();
                      setShareOpen(shareOpen === 'panel' ? null : 'panel');
                    }}
                  >
                    {t('v2.literature.share', 'Share')}
                  </a>
                )}
                {panel.id && (
                  <ShareToDMButton
                    analysisId={panel.id}
                    songName={panel.title}
                    artist={panelArtist}
                  />
                )}
                {panel.id && (
                  <ShareToCommunityButton
                    analysisId={panel.id}
                    artist={panelArtist}
                    onOpenCommunity={goCollective}
                  />
                )}
                {!result && (
                  <a
                    href="#scan"
                    onClick={(e) => {
                      e.preventDefault();
                      handleScan();
                    }}
                  >
                    {t('v2.literature.scanAction', 'AI scan — 1 credit')}
                  </a>
                )}
                <a
                  href="#another"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                >
                  {t('v2.literature.analyzeAnother', 'Analyze another')}
                </a>
              </ActionsRow>
              {shareOpen === 'panel' && panel.id && (
                <div className="sharetray">
                  <ShareButton
                    shareUrl={`${config.apiUrl}/api/share-preview/panel/${panel.id}?lang=${i18n.language}`}
                    shareText={t('share.shareLiteratureText', {
                      title: panel.title,
                      artist: panelArtist,
                    })}
                    songName={panel.title}
                    artist={panelArtist}
                  />
                </div>
              )}
            </>
          )}

          {/* Ad slot (Addendum 2): sidebar mount, post-analysis position.
              Internals untouched; dashed .slot frame only once an ad loads. */}
          {adRun && (
            <div className={adLoaded ? 'adwrap' : undefined}>
              <InlineAdSlot
                key={adRun.key}
                userId={user?.id}
                placement="sidebar"
                layout="card"
                refreshKey={adRun.key}
                className="analysis-ad-slot"
                onAdLoaded={onAdLoaded}
                mediaType={adRun.kind === 'panel' ? ls.currentAdMediaType : null}
              />
            </div>
          )}
        </div>

        {/* Philosopher picker (transaction modal; cost on the confirm button) */}
        {showPicker && (
          <PhilosopherPicker
            onConfirm={handlePanelConfirm}
            onClose={() => setShowPicker(false)}
            loading={panelLoading}
          />
        )}
      </section>

      <V2ModalsHost />
    </PageShell>
  );
}
