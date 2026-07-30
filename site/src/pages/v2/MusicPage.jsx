// MusicPage - v2 MUSIC module page (WP3).
// Visual truth: new_design/philosify-music.html; behavior parity with the
// retired MusicSidebar + useMusicSidebar (analysis logic copied here per the
// WP3 contract — the hook stays untouched because it is sidebar-coupled).
// Flows: Spotify search → track select → Scan (1 credit, POST /api/analyze
// with 409/401 retries, ad-window time gate) or Philosopher Panel (3 credits,
// roster picker → POST /api/philosopher-panel); cancel; Top-50 ticker;
// TTS audio bar; share actions; payment-resume; ?analysis= / ?panel= replay.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import {
  PageShell,
  ModuleHeader,
  Ticker,
  Cell,
  Telemetry,
  Field,
  Verdict,
  ActionsRow,
  TrackCard,
  formatSignedScore,
  verdictRationale,
} from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { CATALOG } from '../../config/catalog';
import { PhilosopherPicker } from '../../components/common/PhilosopherPicker';
import { ShareButton } from '../../components/sharing/ShareButton';
import { ShareToDMButton } from '../../components/sharing/ShareToDMButton';
import { ShareToCommunityButton } from '../../components/sharing/ShareToCommunityButton';
import InlineAdSlot from '../../components/ads/InlineAdSlot.jsx';
import PanelAnalysisCards from '../../components/results/PanelAnalysisCards.jsx';
import { V2AudioBar } from './music/V2AudioBar.jsx';
import { useSpotifySearch, useAuth } from '../../hooks';
import { useCreditsContext } from '../../contexts';
import { config } from '../../config';
import { authService } from '../../services/auth';
import { requestPhilosopherPanel } from '../../services/api/philosopherPanel.js';
import { getPendingAction, setPendingAction, clearPendingAction } from '../../utils/pendingAction.js';
import { waitForMinimumAnalysisWindow, MIN_ANALYSIS_AD_WINDOW_MS } from '../../utils/analysisDelay.js';
import '../../styles/v2-pages/music.css';

// ---- helpers copied from the current results view (field parity) ----

const stripTrailingWordCount = (value) => {
  if (!value) return value;
  return String(value)
    .replace(/\s*\(\s*\d+\s*(palavras|words)\s*\)\s*$/i, '')
    .trim();
};

const normalizeSpotifyTrackId = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined') return null;
  if (raw.startsWith('spotify:')) {
    const parts = raw.split(':');
    return parts[parts.length - 1] || null;
  }
  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      const url = new URL(raw);
      const match = url.pathname.match(/\/track\/([^/]+)/i);
      if (match?.[1]) return match[1];
    }
  } catch {
    // ignore
  }
  return raw;
};

const MODEL_DISPLAY_NAMES = {
  claude: 'Claude Opus 4.8',
  'claude-sonnet': 'Claude Opus 4.8',
  openai: 'GPT-5.5',
  gpt4: 'GPT-5.5',
  'gpt-4': 'GPT-5.5',
  gemini: 'Gemini 3.5 Flash',
  grok: 'Grok 4.5',
};
const formatModelName = (model) => {
  if (!model) return '';
  return (
    MODEL_DISPLAY_NAMES[model.toLowerCase()] ||
    model
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
};

const sanitize = (html) => DOMPurify.sanitize(stripTrailingWordCount(html));

// Top-50 marquee rendered inside the v2 ticker line (mockup .tick anatomy)
function Top50Line({ tracks, label, onSelect }) {
  if (!tracks.length) return <span className="t50"><span className="lbl">{label}</span></span>;
  const items = tracks.map((tr, i) => ({ ...tr, rank: i + 1 }));
  const doubled = [...items, ...items];
  return (
    <span className="t50">
      <span className="lbl">{label} //</span>
      <span className="t50-strip">
        <span className="t50-run" style={{ animationDuration: `${tracks.length * 8}s` }}>
          {doubled.map((tr, i) => (
            <a
              key={`${tr.spotify_id || tr.rank}-${i}`}
              onClick={() =>
                onSelect({
                  song: tr.song_title,
                  artist: tr.artist,
                  spotify_id: tr.spotify_id,
                  isFree: !!tr.is_free,
                })
              }
            >
              #{tr.rank} {tr.song_title} — {tr.artist}
              {tr.is_free ? ' · FREE' : ''}
            </a>
          ))}
        </span>
      </span>
    </span>
  );
}

export default function MusicPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { user } = useAuth();
  const { balance, setBalance } = useCreditsContext();
  const spotify = useSpotifySearch();

  // ---- analysis state (copied from useMusicSidebar, minus open/close) ----
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastAnalysisParamsRef = useRef(null);
  const activeAnalysisRunRef = useRef(0);
  const adDurationRef = useRef(null);
  const adMediaTypeRef = useRef(null);

  // ---- panel state (copied from MusicSidebar) ----
  const [showPicker, setShowPicker] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelResult, setPanelResult] = useState(null);
  const [panelError, setPanelError] = useState(null);
  const [panelElapsed, setPanelElapsed] = useState(0);
  const panelTimerRef = useRef(null);

  // ---- page-local state ----
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [top50, setTop50] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [panelShareOpen, setPanelShareOpen] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);
  // Ad run: which paid run mounted the InlineAdSlot ('analysis' | 'panel').
  // The slot stays mounted after the reveal — mockup: the only ad below the verdict.
  const [adRun, setAdRun] = useState(null);
  const [adMediaType, setAdMediaType] = useState(null);

  const lang = i18n.language || 'en';

  // Called by InlineAdSlot when an ad loads (contracted duration gates the reveal)
  const handleAdLoaded = useCallback(({ duration, mediaType }) => {
    adDurationRef.current = duration;
    adMediaTypeRef.current = mediaType;
    setAdMediaType(mediaType);
  }, []);

  // ---- timer (copied from useMusicSidebar) ----
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    const updateTimer = () => {
      if (startTimeRef.current) setElapsedTime(Date.now() - startTimeRef.current);
      timerRef.current = requestAnimationFrame(updateTimer);
    };
    timerRef.current = requestAnimationFrame(updateTimer);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  const formatTime = useCallback((ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // ---- analyze (copied verbatim from useMusicSidebar.analyze) ----
  const analyze = useCallback(
    async (langArg = 'en', model = 'grok', track = null) => {
      const trackToUse = track || selectedTrack;
      const runId = activeAnalysisRunRef.current + 1;
      activeAnalysisRunRef.current = runId;
      const startedAt = Date.now();

      if (!trackToUse || !user) {
        return { success: false, error: 'No track or user' };
      }

      if (balance !== null && balance.total !== undefined && balance.total <= 0) {
        return { success: false, error: 'noCredits', needsCredits: true };
      }

      setIsAnalyzing(true);
      setAnalysisResult(null);
      setAnalysisError(null);
      startTimer();

      abortControllerRef.current = new AbortController();
      lastAnalysisParamsRef.current = {
        song: trackToUse.song,
        artist: trackToUse.artist,
        model,
        lang: langArg,
      };

      try {
        // Retry logic for 409 (lock still held from cancelled request)
        const maxRetries = 3;
        const retryDelay = 2000;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          const response = await fetch(`${config.apiUrl}/api/analyze`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              song: trackToUse.song,
              artist: trackToUse.artist,
              spotify_id: trackToUse.spotify_id,
              model,
              lang: langArg,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (response.status === 409 && attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue;
          }

          // 401 — token expired, refresh session and retry once
          if (response.status === 401 && attempt === 0) {
            try {
              await authService.getSession();
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            } catch {
              throw new Error(t('v2.music.sessionExpired', 'Session expired — please sign out and sign back in.'));
            }
          }

          if (response.status === 401) {
            throw new Error(t('v2.music.sessionExpired', 'Session expired — please sign out and sign back in.'));
          }

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || t('v2.music.analysisFailed', 'Analysis failed — please try again'));
          }

          // Time-gate the reveal to the sponsored slot's contracted window
          await waitForMinimumAnalysisWindow(startedAt, adDurationRef.current);

          if (activeAnalysisRunRef.current !== runId || abortControllerRef.current?.signal?.aborted) {
            return { success: false, error: 'cancelled' };
          }

          setAnalysisResult(data);

          if (data.balance && typeof data.balance.total !== 'undefined') {
            setBalance({
              total: data.balance.total,
              credits: data.balance.credits,
              freeRemaining: data.balance.freeRemaining,
            });
          }

          return { success: true, data };
        }

        setAnalysisError(t('v2.music.analysisFailed', 'Analysis failed — please try again'));
        return { success: false, error: 'Analysis failed after retries' };
      } catch (error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'cancelled' };
        }
        setAnalysisError(error.message);
        return { success: false, error: error.message };
      } finally {
        if (activeAnalysisRunRef.current === runId) {
          setIsAnalyzing(false);
          stopTimer();
          abortControllerRef.current = null;
        }
      }
    },
    [selectedTrack, user, balance, setBalance, startTimer, stopTimer, t]
  );

  // ---- cancel (copied from useMusicSidebar.cancelAnalysis) ----
  const cancelAnalysis = useCallback(() => {
    activeAnalysisRunRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    stopTimer();
    setAnalysisError(null);
    setAdRun(null);

    // Release the analysis lock server-side so the user can retry immediately
    const params = lastAnalysisParamsRef.current;
    if (params) {
      lastAnalysisParamsRef.current = null;
      fetch(`${config.apiUrl}/api/cancel-analysis`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).catch(() => {});
    }
  }, [stopTimer]);

  // ---- track selection ----
  const handleSelect = useCallback(
    (track) => {
      spotify.selectTrack(track);
      setSelectedTrack(track);
      setAnalysisResult(null);
      setAnalysisError(null);
      setPanelResult(null);
      setPanelError(null);
      setShareOpen(false);
      setPanelShareOpen(false);
      setAdRun(null);
      setFocusedIndex(-1);
    },
    [spotify]
  );

  const clearAll = useCallback(() => {
    spotify.clearAll();
    setSelectedTrack(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setPanelResult(null);
    setPanelError(null);
    setShareOpen(false);
    setPanelShareOpen(false);
    setAdRun(null);
    window.dispatchEvent(new Event('stopAllAudio'));
  }, [spotify]);

  const canAnalyze = selectedTrack && !isAnalyzing && !panelLoading;

  // ---- scan (1 credit) ----
  const handleAnalyze = useCallback(async () => {
    if (!selectedTrack || isAnalyzing || panelLoading) return;
    if (!user) {
      navigate('/signup');
      return;
    }
    if (balance === null) return; // balance still loading
    if (balance.total === undefined || balance.total <= 0) {
      setPendingAction({ type: 'analysis', track: selectedTrack });
      window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
      return;
    }
    setShareOpen(false);
    setAdRun({ kind: 'analysis', key: selectedTrack.spotify_id || selectedTrack.song || 'unknown' });
    const result = await analyze(lang, 'grok', selectedTrack);
    if (result && !result.success) {
      if (result.error !== 'cancelled') setAdRun(null);
    }
  }, [selectedTrack, isAnalyzing, panelLoading, user, balance, navigate, analyze, lang]);

  // ---- philosopher panel (3 credits) ----
  const handleOpenPanel = useCallback(() => {
    if (isAnalyzing || panelLoading) return;
    if (!user) {
      navigate('/signup');
      return;
    }
    if (balance === null) return;
    if (balance.total === undefined || balance.total < 3) {
      if (selectedTrack) setPendingAction({ type: 'panel-analysis', track: selectedTrack });
      window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
      return;
    }
    setShowPicker(true);
  }, [isAnalyzing, panelLoading, user, balance, selectedTrack, navigate]);

  const handlePanelConfirm = useCallback(
    async (chosenPhilosophers) => {
      // Close picker immediately so the timer is visible
      setShowPicker(false);
      setPanelLoading(true);
      setPanelError(null);
      setPanelElapsed(0);
      setPanelShareOpen(false);
      setAdRun({
        kind: 'panel',
        key: selectedTrack?.spotify_id || selectedTrack?.song || 'unknown',
      });
      const startTime = Date.now();
      panelTimerRef.current = setInterval(() => {
        setPanelElapsed(Date.now() - startTime);
      }, 100);
      try {
        const result = await requestPhilosopherPanel({
          mediaType: 'music',
          title: selectedTrack.song || selectedTrack.title,
          artist: selectedTrack.artist,
          lyrics: selectedTrack.lyrics || null,
          philosophers: chosenPhilosophers,
          lang,
        });
        setPanelResult(result.panel);
        window.dispatchEvent(new CustomEvent('credits-changed'));
      } catch (err) {
        setAdRun(null);
        if (err.code === 'INSUFFICIENT_CREDITS') {
          if (selectedTrack) setPendingAction({ type: 'panel-analysis', track: selectedTrack });
          window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
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
    },
    [selectedTrack, lang]
  );

  // ---- keyboard navigation on the search field ----
  const handleKeyDown = (e) => {
    if (spotify.results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((p) => Math.min(p + 1, spotify.results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) handleSelect(spotify.results[focusedIndex]);
    }
  };

  useEffect(() => {
    setFocusedIndex(spotify.results.length > 0 ? 0 : -1);
  }, [spotify.results]);

  // ---- Top 50 ticker feed (GET /api/top10, refresh every 5 minutes) ----
  useEffect(() => {
    let active = true;
    const fetchTop50 = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/top10`);
        if (response.ok) {
          const data = await response.json();
          if (active) setTop50(data.tracks || []);
        }
      } catch {
        // feed is decorative-plus-shortcut; ignore failures
      }
    };
    fetchTop50();
    const interval = setInterval(fetchTop50, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // ---- history replay: ?analysis=<id> / ?panel=<id> (Addendum 1) ----
  const loadAnalysisReplay = useCallback(
    async (id, retried = false) => {
      setReplayLoading(true);
      setAnalysisError(null);
      try {
        const res = await fetch(`${config.apiUrl}/api/analysis/${id}`, { credentials: 'include' });
        if (res.status === 401 && !retried) {
          try {
            await authService.getSession();
          } catch {
            // fall through to retry — backend decides
          }
          return await loadAnalysisReplay(id, true);
        }
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          throw new Error(data?.error || t('v2.music.replayFailed', 'Could not load this analysis'));
        }
        const track = {
          song: data.song || data.song_name || data.title,
          artist: data.artist,
          spotify_id: data.spotify_id,
        };
        spotify.selectTrack(track);
        setSelectedTrack(track);
        setAnalysisResult(data);
      } catch (e) {
        setAnalysisError(e.message);
      } finally {
        setReplayLoading(false);
      }
    },
    [spotify, t]
  );

  const loadPanelReplay = useCallback(
    async (id) => {
      setReplayLoading(true);
      setPanelError(null);
      try {
        const res = await fetch(`${config.apiUrl}/api/panel/${id}`, { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.panel) {
          throw new Error(data?.error || t('v2.music.replayFailed', 'Could not load this analysis'));
        }
        const panel = data.panel;
        const track = {
          song: panel.title,
          artist: panel.artist,
          spotify_id: panel.spotify_id || null,
        };
        spotify.selectTrack(track);
        setSelectedTrack(track);
        setPanelResult(panel);
      } catch (e) {
        setPanelError(e.message);
      } finally {
        setReplayLoading(false);
      }
    },
    [spotify, t]
  );

  const replayHandledRef = useRef(false);
  useEffect(() => {
    if (replayHandledRef.current) return;
    const analysisId = searchParams.get('analysis');
    const panelId = searchParams.get('panel');
    if (analysisId || panelId) {
      replayHandledRef.current = true;
      if (analysisId) loadAnalysisReplay(analysisId);
      if (panelId) loadPanelReplay(panelId);
    }
  }, [searchParams, loadAnalysisReplay, loadPanelReplay]);

  // ---- payment-resume on mount (Addendum 1) ----
  const resumeHandledRef = useRef(false);
  useEffect(() => {
    if (resumeHandledRef.current) return;
    resumeHandledRef.current = true;
    if (searchParams.get('analysis') || searchParams.get('panel')) return; // replay wins
    const pending = getPendingAction();
    const hasPending =
      pending?.track && (pending.type === 'analysis' || pending.type === 'panel-analysis');
    if (location.state?.resume || hasPending) {
      if (hasPending) {
        // Same restore the old openWithPendingAction performed
        spotify.selectTrack(pending.track);
        setSelectedTrack(pending.track);
        setAnalysisResult(null);
        setAnalysisError(null);
        clearPendingAction();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- unmount cleanup (parity with sidebar close()) ----
  useEffect(
    () => () => {
      activeAnalysisRunRef.current += 1;
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      if (panelTimerRef.current) clearInterval(panelTimerRef.current);
      window.dispatchEvent(new Event('stopAllAudio'));
    },
    []
  );

  // ---- derived render data ----

  const spotifyEmbedSrc = useMemo(() => {
    if (!analysisResult) return null;
    const trackId = normalizeSpotifyTrackId(
      analysisResult.spotify_id || selectedTrack?.spotify_id
    );
    if (trackId) return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
    const query = `${analysisResult.song || analysisResult.song_name || ''} ${
      analysisResult.artist || ''
    }`.trim();
    return query ? `https://open.spotify.com/embed/search/${encodeURIComponent(query)}` : null;
  }, [analysisResult, selectedTrack]);

  const trackMeta = useMemo(() => {
    if (!selectedTrack) return '';
    const src = analysisResult || {};
    const parts = [selectedTrack.artist, src.country, src.release_year, src.genre].filter(Boolean);
    if (spotifyEmbedSrc) parts.push(t('v2.music.spotifyPreview', 'Spotify preview'));
    return parts.join(' · ');
  }, [selectedTrack, analysisResult, spotifyEmbedSrc, t]);

  const sections = useMemo(() => {
    const r = analysisResult;
    if (!r) return [];
    const list = [];
    if (r.historical_context) {
      list.push({
        key: 'historical',
        title: t('v2.music.historicalContext', 'HISTORICAL CONTEXT'),
        html: r.historical_context,
        open: true,
      });
    }
    if (r.creative_process) {
      list.push({
        key: 'creative',
        title: t('v2.music.creativeProcess', 'CREATIVE PROCESS'),
        html: r.creative_process,
      });
    }
    const branches = [
      ['metaphysics', t('v2.music.metaphysics', 'METAPHYSICS')],
      ['ethics', t('v2.music.ethics', 'ETHICS')],
      ['epistemology', t('v2.music.epistemology', 'EPISTEMOLOGY')],
      ['politics', t('v2.music.politics', 'POLITICS')],
      ['aesthetics', t('v2.music.aesthetics', 'AESTHETICS')],
    ];
    for (const [key, title] of branches) {
      const cell = r.scorecard?.[key];
      const body = cell?.justification || r[`${key}_analysis`];
      if (body) {
        const score = cell?.score ?? r[`${key}_score`];
        list.push({ key, title, html: body, score });
      }
    }
    const integrated = r.philosophical_analysis || r.summary || r.integrated_analysis;
    if (integrated) {
      list.push({
        key: 'integrated',
        title: t('v2.music.integrated', 'INTEGRATED PHILOSOPHICAL ANALYSIS'),
        html: integrated,
      });
    }
    if (r.schools_of_thought) {
      list.push({
        key: 'schools',
        title: t('v2.music.schools', 'SCHOOLS OF THOUGHT'),
        html: r.schools_of_thought,
      });
    }
    return list;
  }, [analysisResult, t]);

  const guideProof = useMemo(() => {
    const r = analysisResult;
    if (!r) return null;
    const version = r.guide_proof?.version || r.metadata?.guide_version;
    const model =
      r.guide_proof?.modelo ||
      r.metadata?.guide_modelo ||
      formatModelName(r.generated_by || r.model || r.model_used);
    const sha = r.guide_proof?.sha256 || r.metadata?.guide_sha256;
    const signature = r.guide_proof?.signature || r.metadata?.guide_signature;
    const duration = r.analysis_duration_ms || r.metadata?.analysis_duration_ms;
    if (!version && !sha && !signature && !model) return null;
    return { version, model, sha, signature, duration };
  }, [analysisResult]);

  const scanProgress = Math.min(96, (elapsedTime / MIN_ANALYSIS_AD_WINDOW_MS) * 100);
  const panelProgress = Math.min(96, (panelElapsed / 90000) * 100);

  const showModeCells =
    selectedTrack && !analysisResult && !panelResult && !isAnalyzing && !panelLoading;
  const adMounted = isAnalyzing || panelLoading || (adRun && (analysisResult || panelResult));

  const panelShareUrl = panelResult?.id
    ? `${config.apiUrl}/api/share-preview/panel/${panelResult.id}?lang=${
        i18n.resolvedLanguage || i18n.language
      }`
    : undefined;

  const panelTtsResult = panelResult
    ? {
        song_name: panelResult.title,
        artist: panelResult.artist,
        philosophical_analysis: panelResult.analysis,
        lang: panelResult.lang,
        id: panelResult.id,
      }
    : null;

  const classification = analysisResult
    ? analysisResult.classification_localized || analysisResult.classification || ''
    : '';

  // Verdict anatomy (WP4.1): "Final score −X.X · Note N of 10" when both
  // figures exist; weighted-score fallback otherwise.
  const verdictScoreLine =
    analysisResult && analysisResult.final_score !== undefined && analysisResult.final_score !== null
      ? analysisResult.philosophical_note != null
        ? t('v2.verdict.scoreLine', 'Final score {{score}} · Note {{n}} of 10', {
            score: formatSignedScore(analysisResult.final_score),
            n: analysisResult.philosophical_note,
          })
        : `${t('v2.music.weightedScore', 'Weighted score')} ${formatSignedScore(analysisResult.final_score)}`
      : undefined;

  return (
    <PageShell status={t('v2.music.status', 'Analysis Engine // Active')} nav={<NavAccount />}>
      <div className="pg-music">
        <ModuleHeader title={t('v2.music.title', 'MUSIC')}>
          <Ticker stat={t('v2.music.tickerStat', '{{songs}} songs // Spotify + Genius', { songs: CATALOG.songs })}>
            <Top50Line
              tracks={top50}
              label={t('v2.music.top50', 'Top 50')}
              onSelect={handleSelect}
            />
          </Ticker>
        </ModuleHeader>

        <div className="mus-body">
          {/* Search */}
          <div className="fieldwrap">
            <Field
              placeholder={t('v2.music.searchPlaceholder', 'Search for a song...')}
              value={spotify.query}
              onChange={(e) => spotify.setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!selectedTrack}
              autoComplete="off"
            />
            {spotify.query && !spotify.loading && !selectedTrack && (
              <button
                className="fclear"
                onClick={() => spotify.setQuery('')}
                aria-label={t('v2.music.clearSearch', 'Clear search')}
              >
                ✕
              </button>
            )}
          </div>
          {spotify.loading && !selectedTrack && (
            <div className="srload">{t('v2.music.searching', 'Searching…')}</div>
          )}

          {/* Search results */}
          {!selectedTrack && spotify.results.length > 0 && (
            <>
              <div className="srhead">
                {t('v2.music.results', 'Results')} ({spotify.results.length})
              </div>
              <div className="srlist">
                {spotify.results.map((track, i) => (
                  <button
                    key={track.spotify_id || i}
                    className={`srrow${i === focusedIndex ? ' focused' : ''}`}
                    onClick={() => handleSelect(track)}
                    onMouseEnter={() => setFocusedIndex(i)}
                  >
                    <span className="s">{track.song}</span>
                    <span className="a">{track.artist}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Selected track */}
          {selectedTrack && (
            <div className="selwrap">
              <TrackCard title={selectedTrack.song} meta={trackMeta} />
              {!isAnalyzing && !panelLoading && (
                <button
                  className="tclear"
                  onClick={clearAll}
                  aria-label={t('v2.music.clearTrack', 'Clear selection')}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Mode chooser — cost shown before the click */}
          {showModeCells && (
            <div className="modes">
              <Cell
                href="#scan"
                title={t('v2.music.scanTitle', 'SCAN MUSIC')}
                credit={t('v2.music.scanCredit', '1 CREDIT')}
                className={canAnalyze ? '' : 'off'}
                onClick={(e) => {
                  e.preventDefault();
                  handleAnalyze();
                }}
              >
                {t(
                  'v2.music.scanDesc',
                  'Deep semantic analysis of the lyrics against the philosophical framework.'
                )}
              </Cell>
              <Cell
                href="#panel"
                title={t('v2.music.panelTitle', 'PHILOSOPHER PANEL')}
                credit={t('v2.music.panelCredit', '3 CREDITS')}
                className={canAnalyze ? '' : 'off'}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenPanel();
                }}
              >
                {t(
                  'v2.music.panelDesc',
                  "Simulated discourse between historical thinkers on the song's premises."
                )}
              </Cell>
            </div>
          )}

          {/* Telemetry — scan */}
          {isAnalyzing && (
            <Telemetry
              label={t('v2.music.analyzing', 'Analyzing')}
              time={formatTime(elapsedTime)}
              progress={scanProgress}
              onCancel={cancelAnalysis}
              cancelLabel={t('v2.music.cancel', 'Cancel')}
            />
          )}

          {/* Telemetry — panel (pre-scan position; post-scan renders below
              the verdict actions where the user just clicked) */}
          {panelLoading && !analysisResult && (
            <Telemetry
              label={t('v2.music.panelAnalyzing', 'Philosophers are analyzing')}
              time={formatTime(panelElapsed)}
              progress={panelProgress}
            />
          )}

          {replayLoading && (
            <div className="loadnote">{t('v2.music.loadingReplay', 'Loading analysis…')}</div>
          )}

          {(analysisError || panelError) && (
            <div className="errline">{analysisError || panelError}</div>
          )}

          {/* ---- Scan result stack (mockup anatomy) ---- */}
          {analysisResult && (
            <>
              {spotifyEmbedSrc && (
                <div className="embedwrap">
                  <iframe
                    key={spotifyEmbedSrc}
                    height="352"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    src={spotifyEmbedSrc}
                    title={t('v2.music.spotifyPlayer', 'Spotify player')}
                  />
                </div>
              )}

              <Verdict
                label={t('v2.music.verdictLabel', 'Philosify Verdict')}
                note={analysisResult.philosophical_note}
                classification={classification}
                scoreLine={verdictScoreLine}
                rationale={verdictRationale(analysisResult)}
              />

              <V2AudioBar key={`tts-${analysisResult.id || 'scan'}`} result={analysisResult} />

              {sections.map((s) => (
                <ExpandableSectionHtml
                  key={`${analysisResult.id || 'r'}-${s.key}`}
                  title={s.title}
                  score={s.score}
                  html={s.html}
                  defaultOpen={!!s.open}
                />
              ))}

              {guideProof && (
                <div className="proof">
                  {guideProof.version && (
                    <span>
                      {t('v2.music.guideVersion', 'Guide')} <b>{guideProof.version}</b>
                    </span>
                  )}
                  {guideProof.model && (
                    <span>
                      {t('v2.music.aiModel', 'Model')} <b>{guideProof.model}</b>
                    </span>
                  )}
                  {guideProof.sha && (
                    <span>
                      {t('v2.music.sha256', 'SHA-256')} <b>{guideProof.sha}</b>
                    </span>
                  )}
                  {guideProof.signature && (
                    <span>
                      {t('v2.music.signature', 'Signature')} <b>{guideProof.signature}</b>
                    </span>
                  )}
                  {guideProof.duration && (
                    <span>
                      {t('v2.music.analysisTime', 'Time')}{' '}
                      <b>{(guideProof.duration / 1000).toFixed(1)}s</b>
                    </span>
                  )}
                </div>
              )}

              <ActionsRow>
                {analysisResult.id && (
                  <a onClick={() => setShareOpen((s) => !s)}>{t('v2.music.share', 'Share')}</a>
                )}
                {analysisResult.id && (
                  <ShareToDMButton
                    analysisId={analysisResult.id}
                    songName={analysisResult.song || analysisResult.song_name}
                    artist={analysisResult.artist}
                    philosophicalNote={analysisResult.philosophical_note}
                    classification={analysisResult.classification}
                  />
                )}
                {analysisResult.id && (
                  <ShareToCommunityButton
                    analysisId={analysisResult.id}
                    artist={analysisResult.artist}
                    onOpenCommunity={(tab) => navigate('/community', { state: { tab } })}
                  />
                )}
                {!panelResult && !panelLoading && (
                  <button className="btns panelbtn" onClick={handleOpenPanel}>
                    {t('v2.music.panelTitle', 'PHILOSOPHER PANEL')}
                    <span className="pill">{t('v2.music.panelCredit', '3 CREDITS')}</span>
                  </button>
                )}
                <a onClick={clearAll}>{t('v2.music.analyzeAnother', 'Analyze another')}</a>
              </ActionsRow>

              {/* Panel running post-scan: same ANALYZING block, in view */}
              {panelLoading && (
                <Telemetry
                  label={t('v2.music.panelAnalyzing', 'Philosophers are analyzing')}
                  time={formatTime(panelElapsed)}
                  progress={panelProgress}
                />
              )}

              {shareOpen && analysisResult.id && (
                <div className="sharetray">
                  <ShareButton
                    analysisId={analysisResult.id}
                    songName={analysisResult.song || analysisResult.song_name}
                    artist={analysisResult.artist}
                    shareText={t('share.shareMusicText', {
                      title: analysisResult.song || analysisResult.song_name,
                      artist: analysisResult.artist,
                    })}
                  />
                </div>
              )}
            </>
          )}

          {/* ---- Philosopher Panel result stack ---- */}
          {panelResult && (
            <>
              <div className="panelhead">
                {t('v2.music.panelComplete', 'Philosopher Panel // Complete')}
              </div>
              {panelTtsResult && (
                <V2AudioBar key={`tts-panel-${panelResult.id || 'panel'}`} result={panelTtsResult} />
              )}
              <PanelAnalysisCards analysis={panelResult.analysis} />
              <ActionsRow>
                {panelResult.id && (
                  <a onClick={() => setPanelShareOpen((s) => !s)}>
                    {t('v2.music.share', 'Share')}
                  </a>
                )}
                {panelResult.id && (
                  <ShareToDMButton
                    analysisId={panelResult.id}
                    songName={panelResult.title}
                    artist={panelResult.artist}
                  />
                )}
                {panelResult.id && (
                  <ShareToCommunityButton
                    analysisId={panelResult.id}
                    artist={panelResult.artist}
                    onOpenCommunity={(tab) => navigate('/community', { state: { tab } })}
                  />
                )}
                {!analysisResult && selectedTrack && !isAnalyzing && (
                  <a onClick={handleAnalyze}>
                    {t('v2.music.scanAction', 'Scan music — 1 credit')}
                  </a>
                )}
                <a onClick={clearAll}>{t('v2.music.analyzeAnother', 'Analyze another')}</a>
              </ActionsRow>
              {panelShareOpen && panelResult.id && (
                <div className="sharetray">
                  <ShareButton
                    analysisId={panelResult.id}
                    songName={panelResult.title}
                    artist={panelResult.artist}
                    shareUrl={panelShareUrl}
                    shareText={t('share.shareMusicText', {
                      title: panelResult.title,
                      artist: panelResult.artist,
                    })}
                  />
                </div>
              )}
            </>
          )}

          {/* Sponsored slot — mounts when a paid run starts (billing-relevant:
              onAdLoaded feeds waitForMinimumAnalysisWindow); after the reveal it
              is the only ad below the verdict (mockup). Internals untouched. */}
          {adMounted && adRun && (
            <div className="adwrap">
              <InlineAdSlot
                key={`music-${adRun.kind}-${adRun.key}`}
                userId={user?.id}
                placement="sidebar"
                layout="card"
                refreshKey={`music-${adRun.kind}-${adRun.key}`}
                className="analysis-ad-slot"
                onAdLoaded={handleAdLoaded}
                mediaType={adRun.kind === 'panel' ? adMediaType : null}
              />
            </div>
          )}
        </div>

        {/* Philosopher picker (transaction modal) */}
        {showPicker && (
          <PhilosopherPicker
            onConfirm={handlePanelConfirm}
            onClose={() => setShowPicker(false)}
            loading={panelLoading}
          />
        )}

        <V2ModalsHost />
      </div>
    </PageShell>
  );
}

// Expandable section with sanitized HTML body + optional branch score
// (uses the v2 .xcard anatomy; body clicks don't collapse the card).
function ExpandableSectionHtml({ title, score, html, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const { t } = useTranslation();
  const scoreLabel =
    score === undefined || score === null ? null : score > 0 ? `+${score}` : `${score}`;
  return (
    <div className={`xcard${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="head">
        <h4>
          {title}
          {scoreLabel !== null && <span className="xscore">{scoreLabel}</span>}
        </h4>
        <span className="chev">
          {open ? t('v2.music.collapse', '— collapse') : t('v2.music.expand', '+ expand')}
        </span>
      </div>
      <div
        className="body"
        onClick={(e) => e.stopPropagation()}
        dangerouslySetInnerHTML={{ __html: sanitize(html) }}
      />
    </div>
  );
}
