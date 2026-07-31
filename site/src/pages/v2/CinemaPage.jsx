// CinemaPage - v2 Cinema module (new_design/philosify-cinema.html: "same
// template as Music" — search TMDb → poster + specs card → Scan /
// Philosopher Panel → verdict stack → actions → post-analysis slot).
// Behavior parity with components/cinema/CinemaSidebar.jsx +
// hooks/useCinemaSidebar.js: POST /api/film-search, POST /api/cinema-analyze
// (401 refresh-retry inside the hook; cancel is client-side abort only —
// cinema has no backend cancel endpoint), POST /api/philosopher-panel
// (3 credits, PhilosopherPicker on GET /api/colloquium/roster),
// GET /api/cinema/top ticker, elapsed timers, TTS bar, share actions,
// InlineAdSlot + waitForMinimumAnalysisWindow gate (inside the hook),
// pendingAction shapes 'cinema-analysis' / 'film-panel' + v2-open-buy-credits,
// payment-resume on mount, history replay ?analysis= / ?panel=.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PageShell,
  ModuleHeader,
  Ticker,
  Cell,
  Telemetry,
  Field,
  ActionsRow,
  TrackCard,
} from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { PhilosopherPicker } from '../../components/common/PhilosopherPicker';
import { ShareButton } from '../../components/sharing/ShareButton';
import { ShareToDMButton } from '../../components/sharing/ShareToDMButton';
import { ShareToCommunityButton } from '../../components/sharing/ShareToCommunityButton';
import InlineAdSlot from '../../components/ads/InlineAdSlot.jsx';
import PanelAnalysisCards from '../../components/results/PanelAnalysisCards.jsx';
import { useCinemaSidebar } from '../../hooks/useCinemaSidebar.js';
import { useAuth } from '../../hooks/useAuth';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { setPendingAction, getPendingAction, clearPendingAction } from '../../utils/pendingAction.js';
import { config } from '../../config';
import { authService } from '../../services/auth';
import { AnalysisSections } from './cinema/AnalysisSections.jsx';
import { V2AudioBar } from './cinema/V2AudioBar.jsx';
import '../../styles/v2-pages/cinema.css';

const openBuyCredits = () => window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));

// Top 50 films strip inside the module ticker (GET /api/cinema/top,
// refreshed every 5 minutes; items select the film — same as the sidebar's
// TopCinemaTicker).
function TopFilmsStrip({ onSelect }) {
  const { t } = useTranslation();
  const [films, setFilms] = useState([]);

  useEffect(() => {
    let alive = true;
    const fetchFilms = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/cinema/top`);
        if (response.ok && alive) {
          const data = await response.json();
          setFilms(data.films || []);
        }
      } catch {
        // ticker is decorative-functional; stay silent on failure
      }
    };
    fetchFilms();
    const interval = setInterval(fetchFilms, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  if (films.length === 0) {
    return <>{t('v2.cinema.tickerFallback', 'TMDb catalog')}</>;
  }

  const doubled = [...films, ...films];
  return (
    <span className="t50">
      <span className="lbl">{t('v2.cinema.top50', 'Top 50 >>>')}</span>
      <span className="t50-strip">
        <span className="t50-run" style={{ animationDuration: `${films.length * 8}s` }}>
          {doubled.map((film, i) => (
            <a
              key={`${film.id}-${i}`}
              href="#top50"
              onClick={(e) => {
                e.preventDefault();
                onSelect(film);
              }}
            >
              #{(i % films.length) + 1} {film.title}
              {film.star ? ` — ${film.star}` : film.year ? ` — ${film.year}` : ''}
            </a>
          ))}
        </span>
      </span>
    </span>
  );
}

export default function CinemaPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { balance } = useCreditsContext();
  const cs = useCinemaSidebar();
  const lang = i18n.resolvedLanguage || i18n.language || 'en';

  const [showPicker, setShowPicker] = useState(false);
  const [shareOpen, setShareOpen] = useState(null); // 'analysis' | 'panel' | null
  const [adRun, setAdRun] = useState(null); // { kind: 'analysis'|'panel', key }
  const [adLoaded, setAdLoaded] = useState(false);
  const [replayPanel, setReplayPanel] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);
  const replayedRef = useRef(false);
  const [resumeRun, setResumeRun] = useState(null); // 'cinema-analysis' | 'film-panel'

  const {
    selectedFilm,
    analysisResult,
    handleAdLoaded,
    selectFilm,
    clearFilm,
    openWithResult,
  } = cs;
  const panel = cs.panelResult || replayPanel;
  const result = analysisResult;
  const panelArtist = panel?.artist || selectedFilm?.director || 'Cinema';

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
    if (!cs.isAnalyzing && !cs.panelLoading && !result && !panel) {
      setAdRun(null);
      setAdLoaded(false);
    }
  }, [cs.isAnalyzing, cs.panelLoading, result, panel]);

  // Refresh the nav balance after paid runs complete
  useEffect(() => {
    if (result || cs.panelResult) {
      window.dispatchEvent(new CustomEvent('credits-changed'));
    }
  }, [result, cs.panelResult]);

  // Mount thread (Addendum 1): history replay ?analysis= / ?panel=, then
  // payment-resume from the stored pending action (shapes the sidebar used).
  useEffect(() => {
    if (replayedRef.current) return;
    replayedRef.current = true;

    const analysisId = searchParams.get('analysis');
    const panelId = searchParams.get('panel');

    const fetchDetail = async (retried) => {
      const res = await fetch(`${config.apiUrl}/api/cinema-analysis/${analysisId}`, {
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
        .catch(() => setReplayError(t('v2.cinema.replayError', 'Could not load this analysis.')))
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
          selectFilm({ title: p.title, director: p.artist });
          setReplayPanel(p);
        })
        .catch(() => setReplayError(t('v2.cinema.replayError', 'Could not load this analysis.')))
        .finally(() => setReplayLoading(false));
      return;
    }

    const pending = getPendingAction();
    if (pending?.film && (pending.type === 'cinema-analysis' || pending.type === 'film-panel')) {
      selectFilm(pending.film);
      clearPendingAction();
      // WP7: arm the auto-run — executed below once user + balance load
      setResumeRun(pending.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Payment-resume execution (WP7): with the restored film, the user and the
  // balance all in, fire the SAME handler the user would click. The flag
  // clears first, so the handler's own credit gate can re-open Buy Credits
  // without looping.
  useEffect(() => {
    if (!resumeRun || !selectedFilm || !isAuthenticated || balance === null) return;
    const run = resumeRun;
    setResumeRun(null);
    if (run === 'cinema-analysis') handleScan();
    else handleOpenPanel(); // philosophers are not stored — the picker IS the restore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeRun, selectedFilm, isAuthenticated, balance]);

  const clearReplayParams = () => {
    if (searchParams.get('analysis') || searchParams.get('panel')) {
      setSearchParams({}, { replace: true });
    }
  };

  // The header ticker persists on the page (the sidebar hid it after
  // selection), so selecting mid-run/mid-result must reset the prior run.
  const handleSelect = (film) => {
    if (cs.panelLoading) return;
    if (cs.isAnalyzing) cs.cancelAnalysis();
    setShareOpen(null);
    setReplayPanel(null);
    setReplayError(null);
    clearReplayParams();
    clearFilm();
    selectFilm(film);
  };

  const handleClear = () => {
    setShareOpen(null);
    setReplayPanel(null);
    setReplayError(null);
    clearReplayParams();
    clearFilm();
  };

  // Scan film — 1 credit (POST /api/cinema-analyze via the hook)
  const handleScan = async () => {
    if (!selectedFilm || cs.isAnalyzing || cs.panelLoading) return;
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    if (balance === null) return; // wait for balance to load (sidebar behavior)
    if (balance.total === undefined || balance.total < 1) {
      setPendingAction({ type: 'cinema-analysis', film: selectedFilm });
      openBuyCredits();
      return;
    }
    setShareOpen(null);
    setAdLoaded(false);
    setAdRun({ kind: 'analysis', key: `cinema-analysis-${selectedFilm?.id || 'unknown'}` });
    try {
      await cs.analyze(lang);
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') openBuyCredits();
    }
  };

  // Philosopher panel — 3 credits (picker first, then POST /api/philosopher-panel)
  const handleOpenPanel = () => {
    if (!selectedFilm || cs.isAnalyzing || cs.panelLoading) return;
    if (!isAuthenticated) {
      navigate('/signup');
      return;
    }
    if (balance === null) return;
    if (balance.total === undefined || balance.total < 3) {
      setPendingAction({ type: 'film-panel', film: selectedFilm });
      openBuyCredits();
      return;
    }
    setShowPicker(true);
  };

  const handlePanelConfirm = async (chosenPhilosophers) => {
    setShowPicker(false);
    setShareOpen(null);
    setReplayPanel(null);
    setAdLoaded(false);
    setAdRun({ kind: 'panel', key: `cinema-panel-${selectedFilm?.id || 'unknown'}` });
    try {
      await cs.analyzeWithPanel(chosenPhilosophers, lang);
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') openBuyCredits();
    }
  };

  const handleCancel = () => {
    cs.cancelAnalysis();
    setAdRun(null);
    setAdLoaded(false);
  };

  const goCollective = (tab, groupId) =>
    navigate('/community', { state: { tab: 'collective', groupId } });

  const filmMeta = selectedFilm
    ? [
        selectedFilm.director,
        (selectedFilm.countries || []).join('/'),
        selectedFilm.year,
        (selectedFilm.genres || []).join(', '),
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const posterUrl = selectedFilm?.poster_url || selectedFilm?.poster || selectedFilm?.cover_url;

  const analysisArtist = result?.artist || result?.director || selectedFilm?.director || '';
  const analysisTitle = result?.title || result?.song_name || selectedFilm?.title || '';

  const showSearch = !selectedFilm && !panel && !replayLoading;
  const showModes =
    selectedFilm && !result && !panel && !cs.isAnalyzing && !cs.panelLoading && !replayLoading;

  return (
    <PageShell status={t('v2.cinema.status', 'Analysis Engine // Active')} nav={<NavAccount />}>
      <section className="pg-cinema">
        <ModuleHeader title={t('v2.cinema.title', 'CINEMA')}>
          <Ticker>
            <TopFilmsStrip onSelect={handleSelect} />
          </Ticker>
        </ModuleHeader>

        <div className="mod-body">
          {replayLoading && (
            <div className="loadnote">{t('v2.cinema.replayLoading', 'Loading analysis…')}</div>
          )}
          {replayError && <div className="errline">{replayError}</div>}

          {/* Search (hidden once a film is selected — sidebar behavior) */}
          {showSearch && (
            <>
              <div className="fieldwrap">
                <Field
                  placeholder={t('v2.cinema.searchPlaceholder', 'Search for a film...')}
                  value={cs.query}
                  onChange={(e) => cs.setQuery(e.target.value)}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              {cs.searchLoading && (
                <div className="srload">{t('v2.cinema.searching', 'Searching…')}</div>
              )}
              {cs.searchError && <div className="errline">{cs.searchError}</div>}
              {cs.results.length > 0 && (
                <div className="srlist">
                  {cs.results.map((film) => (
                    <button
                      key={film.tmdb_id}
                      className="srrow"
                      onClick={() => handleSelect(film)}
                    >
                      <span className="s">
                        {film.title} {film.year ? `(${film.year})` : ''}{' '}
                        {film.countries?.length ? `[${film.countries.join('/')}]` : ''}
                      </span>
                      <span className="a">
                        {[film.director, ...(film.cast || [])].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {cs.hasSearched && cs.results.length === 0 && !cs.searchLoading && (
                <div className="noresults">
                  {t('v2.cinema.noResults', 'No films found for your search.')}
                </div>
              )}
            </>
          )}

          {/* Selected film — poster + specs card (persists through the stack) */}
          {selectedFilm && (
            <div className="selwrap">
              <TrackCard
                cover={posterUrl ? <img src={posterUrl} alt="" loading="lazy" /> : '▸'}
                title={selectedFilm.title}
                meta={filmMeta}
              />
              {!result && !panel && !cs.isAnalyzing && !cs.panelLoading && (
                <button
                  className="tclear"
                  onClick={handleClear}
                  aria-label={t('v2.cinema.clear', 'Clear selection')}
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {selectedFilm?.overview && !result && !panel && (
            <p className="synopsis">{selectedFilm.overview}</p>
          )}

          {/* Mode chooser — cost shown before the click (Law) */}
          {showModes && (
            <div className="modes">
              <Cell
                href="#scan"
                title={t('v2.cinema.scanTitle', 'SCAN FILM')}
                credit={t('v2.cinema.scanCredit', '1 CREDIT')}
                onClick={(e) => {
                  e.preventDefault();
                  handleScan();
                }}
              >
                {t(
                  'v2.cinema.scanDesc',
                  "Deep semantic analysis of the film's themes, characters and ideas against the philosophical framework."
                )}
              </Cell>
              <Cell
                href="#panel"
                title={t('v2.cinema.panelTitle', 'PHILOSOPHER PANEL')}
                credit={t('v2.cinema.panelCredit', '3 CREDITS')}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenPanel();
                }}
              >
                {t(
                  'v2.cinema.panelDesc',
                  "Simulated discourse between historical thinkers on the film's premises."
                )}
              </Cell>
            </div>
          )}

          {/* Telemetry state line + elapsed timer */}
          {cs.isAnalyzing && (
            <Telemetry
              label={t('v2.cinema.analyzing', 'Analyzing')}
              time={cs.formatTime(cs.elapsedTime)}
              progress={Math.min(96, (cs.elapsedTime / 30000) * 100)}
              onCancel={handleCancel}
              cancelLabel={t('v2.cinema.cancel', 'Cancel')}
            />
          )}
          {cs.panelLoading && !result && (
            <Telemetry
              label={t('v2.cinema.panelAnalyzing', 'Philosophers are analyzing…')}
              time={cs.formatTime(cs.panelElapsed)}
              progress={Math.min(96, (cs.panelElapsed / 90000) * 100)}
            />
          )}
          {(cs.analysisError || cs.panelError) && (
            <div className="errline">{cs.analysisError || cs.panelError}</div>
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
                    {t('v2.cinema.share', 'Share')}
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
                {!panel && !cs.panelLoading && (
                  <button className="btns panelbtn" onClick={handleOpenPanel}>
                    {t('v2.cinema.panelTitle', 'PHILOSOPHER PANEL')}
                    <span className="pill">{t('v2.cinema.panelCredit', '3 CREDITS')}</span>
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
                    {t('v2.cinema.analyzeAnother', 'Analyze another')}
                  </a>
                )}
              </ActionsRow>

              {/* Panel running post-scan: same ANALYZING block, in view */}
              {cs.panelLoading && (
                <Telemetry
                  label={t('v2.cinema.panelAnalyzing', 'Philosophers are analyzing…')}
                  time={cs.formatTime(cs.panelElapsed)}
                  progress={Math.min(96, (cs.panelElapsed / 90000) * 100)}
                />
              )}
              {shareOpen === 'analysis' && result.id && (
                <div className="sharetray">
                  <ShareButton
                    analysisId={result.id}
                    songName={analysisTitle}
                    artist={analysisArtist}
                    shareText={t('share.shareMusicText', {
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
                  {t('v2.cinema.panelVerdictLabel', 'Philosopher panel')}
                </span>
                <div className="vgrid">
                  <span className="classif">{(panel.philosophers || []).join(' · ')}</span>
                </div>
              </div>
              <V2AudioBar
                result={{
                  title: panel.title,
                  artist: panelArtist,
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
                    {t('v2.cinema.share', 'Share')}
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
                    {t('v2.cinema.scanAction', 'Scan film — 1 credit')}
                  </a>
                )}
                <a
                  href="#another"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClear();
                  }}
                >
                  {t('v2.cinema.analyzeAnother', 'Analyze another')}
                </a>
              </ActionsRow>
              {shareOpen === 'panel' && panel.id && (
                <div className="sharetray">
                  <ShareButton
                    shareUrl={`${config.apiUrl}/api/share-preview/panel/${panel.id}?lang=${lang}`}
                    shareText={t('share.shareFilmText', {
                      title: panel.title,
                      artist: panelArtist,
                      defaultValue: `🎬 Check out the philosophical analysis of ${panel.title} | Philosify`,
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
                mediaType={adRun.kind === 'panel' ? cs.currentAdMediaType : null}
              />
            </div>
          )}
        </div>

        {/* Philosopher picker (transaction modal; cost on the confirm button) */}
        {showPicker && (
          <PhilosopherPicker
            onConfirm={handlePanelConfirm}
            onClose={() => setShowPicker(false)}
            loading={cs.panelLoading}
          />
        )}
      </section>

      <V2ModalsHost />
    </PageShell>
  );
}
