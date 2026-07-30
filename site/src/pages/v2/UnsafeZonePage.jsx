// UnsafeZonePage - v2 UNSAFE ZONE (mockup: new_design/philosify-unsafezone.html).
// Multi-turn Socratic dialogue console. Session billing: 10 credits for
// 20 turns, +5 credits per 10 additional (matches backend).
// Preserved sidebar behaviors (components/unsafe-zone/UnsafeZoneSidebar.jsx):
// conversation restore on mount, send turn with balance gate + pendingAction,
// turn counter telemetry, extension warning, end session, history + resume
// (also via ?session=<id>), credits-changed dispatch, payment-resume on
// mount, conversation state keyed by user id.
// Law §2.1: the AI voice is the inverted block; the user is right-aligned.
// Spec §10: this page carries NO ads, ever.
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell, MarkerLine, Ticker, Pill, Button } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { setPendingAction, getPendingAction, clearPendingAction } from '../../utils/pendingAction.js';
import { logger } from '../../utils';
import { getApiUrl } from '../../config';
import '../../styles/v2-pages/unsafe-zone.css';

// Billing constants (match backend)
const INITIAL_COST = 10;
const EXTENSION_COST = 5;
const INITIAL_TURNS = 20;
const EXTENSION_TURNS = 10;

// Draft survives auth navigation and the Stripe round-trip (the sidebar kept
// the draft under its modals; pages must persist it across navigations).
const DRAFT_KEY = 'v2-unsafe-zone-draft';

const shortCode = (id, len = 4) =>
  String(id || '')
    .replace(/[^0-9a-zA-Z]/g, '')
    .slice(0, len)
    .toUpperCase();

// 401 pattern (WP3 contract): refresh the cookie session once, then retry.
async function fetchWithSessionRetry(url, options = {}) {
  let resp = await fetch(url, { credentials: 'include', ...options });
  if (resp.status === 401) {
    try {
      await fetch(`${getApiUrl().replace(/\/$/, '')}/auth/session`, { credentials: 'include' });
    } catch {
      // non-blocking
    }
    resp = await fetch(url, { credentials: 'include', ...options });
  }
  return resp;
}

// Idle entry screen — the full welcome manifesto (sidebar copy, verbatim).
function Manifesto({ t }) {
  return (
    <div className="manifesto">
      <p className="quiet">{t('v2.unsafe-zone.welcome1', 'Most spaces online offer you agreement, validation, or distraction.')}</p>
      <p className="em">{t('v2.unsafe-zone.welcome2', 'This is not one of them.')}</p>
      <p>{t('v2.unsafe-zone.welcome3', 'Unsafe Zone exists because real questions deserve to be examined — not answered. Not comfort. Not a list of perspectives. Not someone telling you what to think.')}</p>
      <p>{t('v2.unsafe-zone.welcome4', "You carry questions that don't fit in a search bar. Dilemmas that keep returning. Fears you haven't named. Decisions you've been circling for months or years without landing anywhere honest.")}</p>
      <p className="em">{t('v2.unsafe-zone.welcome5', 'This is where you bring those.')}</p>
      <p>{t('v2.unsafe-zone.welcome6', 'What happens here is not therapy, not advice, and not judgment. It is rigorous, patient, philosophical dialogue — designed to surface what is actually inside the question you are carrying, strip away the evasions and borrowed beliefs, and leave you with something you can actually use: clarity about what you truly think, what you truly value, and what the honest answer actually is.')}</p>
      <p>{t('v2.unsafe-zone.welcome7', 'You will be asked precise questions. You will be taken seriously. You will not be told what to do.')}</p>
      <p className="quiet">{t('v2.unsafe-zone.welcome8', 'The last step is always yours.')}</p>
      <p className="close">{t('v2.unsafe-zone.welcome9', 'You are not here for comfort. You are here for clarity.')}</p>
    </div>
  );
}

// Collapsed intro shown inside an active conversation (sidebar behavior).
function HowItWorks({ t }) {
  return (
    <div className="uz-intro">
      <p className="quiet">{t('v2.unsafe-zone.welcome1', 'Most spaces online offer you agreement, validation, or distraction.')}</p>
      <p className="em">{t('v2.unsafe-zone.welcome2', 'This is not one of them.')}</p>
      <p>{t('v2.unsafe-zone.welcome3Short', 'Unsafe Zone exists because real questions deserve to be examined — not answered.')}</p>
      <p className="close">{t('v2.unsafe-zone.welcome9', 'You are not here for comfort. You are here for clarity.')}</p>
    </div>
  );
}

function UnsafeZoneConsole({ user }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { balance } = useCreditsContext();

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [turn, setTurn] = useState(0);
  const [turnsRemaining, setTurnsRemaining] = useState(INITIAL_TURNS);
  const [warning, setWarning] = useState(null);

  // UI state
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const userId = user?.id;

  // ---- Payment-resume (Addendum 1) + draft restore, on mount ----
  useEffect(() => {
    const pending = getPendingAction();
    if (location.state?.resume || pending?.type === 'unsafe-zone') {
      logger.log('[UnsafeZone] Resume on mount:', { state: location.state, pending });
      // The unsafe-zone pending action carries only {credits}; resuming means
      // reloading the conversation (done below) with the draft restored.
      if (pending?.type === 'unsafe-zone') clearPendingAction();
      if (location.state?.resume) {
        navigate(location.pathname + location.search, { replace: true, state: null });
      }
    }
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) {
        setInput(draft);
        sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // sessionStorage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Restore active conversation on mount (GET /conversation) ----
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setConversationLoaded(true);
      return undefined;
    }
    (async () => {
      try {
        const resp = await fetchWithSessionRetry(`${getApiUrl()}/api/unsafe-zone/conversation`, {
          method: 'GET',
        });
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled && data.sessionId) {
            setSessionId(data.sessionId);
            setMessages(data.messages || []);
            setTurn(data.turn || 0);
            setTurnsRemaining(data.turnsRemaining ?? INITIAL_TURNS);
          }
        }
      } catch {
        // Non-blocking
      }
      if (!cancelled) setConversationLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // ---- Resume a past session ----
  const resumeSession = useCallback(
    async (historySessionId) => {
      try {
        const resp = await fetchWithSessionRetry(
          `${getApiUrl()}/api/unsafe-zone/session/${historySessionId}`,
          { method: 'GET' }
        );
        if (resp.ok) {
          const data = await resp.json();
          setSessionId(data.id);
          setMessages(data.messages || []);
          setTurn(data.turnCount || 0);
          setTurnsRemaining(data.turnsRemaining || 0);
          setWarning(null);
          setError(null);
          setAuthError(false);
          setShowHistory(false);
        } else {
          setError(t('v2.unsafe-zone.loadError', 'Failed to load session'));
        }
      } catch {
        setError(t('v2.unsafe-zone.loadError', 'Failed to load session'));
      }
    },
    [t]
  );

  // ---- ?session=<id> — history-replay target (Addendum 1) ----
  const sessionParam = searchParams.get('session');
  useEffect(() => {
    if (sessionParam && conversationLoaded) {
      logger.log('[UnsafeZone] Resuming session from URL:', sessionParam);
      resumeSession(sessionParam);
      const next = new URLSearchParams(searchParams);
      next.delete('session');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionParam, conversationLoaded, resumeSession]);

  // ---- Auto-scroll to the latest turn ----
  useEffect(() => {
    if (!chatEndRef.current) return;
    if (messages.length === 0 && !sending) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    chatEndRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'end' });
  }, [messages, sending]);

  // ---- Focus the entry once a conversation is on screen ----
  useEffect(() => {
    if (inputRef.current && messages.length > 0 && !showHistory) {
      inputRef.current.focus();
    }
  }, [messages.length, showHistory]);

  // ---- Required credits for the next message (matches backend) ----
  const getRequiredCredits = useCallback(() => {
    if (!sessionId && turn === 0) return INITIAL_COST; // new session
    const nextTurn = turn + 1;
    if (nextTurn > INITIAL_TURNS && (nextTurn - INITIAL_TURNS - 1) % EXTENSION_TURNS === 0) {
      return EXTENSION_COST; // extension boundary
    }
    return 0;
  }, [sessionId, turn]);

  // ---- Send a turn (POST /api/unsafe-zone) ----
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    if (!user) {
      try {
        sessionStorage.setItem(DRAFT_KEY, trimmed);
      } catch { /* ignore */ }
      navigate('/signup');
      return;
    }

    const requiredCredits = getRequiredCredits();
    logger.log('[UnsafeZone] Balance check:', { balance, requiredCredits, total: balance?.total });

    // Wait for balance to load before proceeding
    if (requiredCredits > 0 && balance === null) {
      logger.log('[UnsafeZone] Balance still loading, please wait');
      return;
    }

    // Insufficient credits: store the pending action, open Buy Credits
    if (requiredCredits > 0 && (balance.total === undefined || balance.total < requiredCredits)) {
      logger.log('[UnsafeZone] Insufficient credits, opening Buy Credits');
      setPendingAction({ type: 'unsafe-zone', credits: requiredCredits });
      try {
        sessionStorage.setItem(DRAFT_KEY, trimmed);
      } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
      return;
    }

    const userMessage = { role: 'user', content: trimmed };
    const updatedHistory = [...messages, userMessage];
    const savedInput = trimmed;

    setMessages(updatedHistory);
    setInput('');
    setError(null);
    setAuthError(false);
    setWarning(null);
    setSending(true);

    try {
      const response = await fetchWithSessionRetry(`${getApiUrl()}/api/unsafe-zone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          lang: i18n.resolvedLanguage || i18n.language || 'en',
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Session refresh + retry already attempted; keep the draft on screen
          setMessages(messages);
          setInput(savedInput);
          setAuthError(true);
          setError(t('v2.unsafe-zone.sessionExpired', 'Your session expired. Sign in and send again.'));
          return;
        }
        if (response.status === 402) {
          const needed = data.requiredCredits || (data.isExtension ? EXTENSION_COST : INITIAL_COST);
          setPendingAction({ type: 'unsafe-zone', credits: needed });
          setMessages(messages);
          setInput(savedInput);
          try {
            sessionStorage.setItem(DRAFT_KEY, savedInput);
          } catch { /* ignore */ }
          window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
          return;
        }
        if (response.status === 400 && data.error?.includes('no longer active')) {
          // Session expired or ended — reset to start fresh, keep the draft
          setSessionId(null);
          setMessages([]);
          setTurn(0);
          setTurnsRemaining(INITIAL_TURNS);
          setInput(savedInput);
          setError(null);
          return;
        }
        if (response.status === 429) {
          setMessages(messages);
          setInput(savedInput);
          throw new Error(data.message || 'Too many requests. Please wait a moment.');
        }
        throw new Error(data.error || 'Failed to get response');
      }

      setSessionId(data.sessionId);
      setTurn(data.turn);
      setTurnsRemaining(data.turnsRemaining);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.warning) setWarning(data.warning);

      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch {
      setError(t('v2.unsafe-zone.error', 'Something went wrong. Please try again.'));
      setMessages(messages);
      setInput(savedInput);
    } finally {
      setSending(false);
    }
  }, [input, sending, user, balance, messages, i18n, t, sessionId, getRequiredCredits, navigate]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // ---- End session and start over (POST /api/unsafe-zone/end) ----
  const handleStartOver = useCallback(async () => {
    if (sessionId) {
      try {
        await fetchWithSessionRetry(`${getApiUrl()}/api/unsafe-zone/end`, { method: 'POST' });
      } catch {
        // Non-blocking
      }
    }
    setSessionId(null);
    setMessages([]);
    setTurn(0);
    setTurnsRemaining(INITIAL_TURNS);
    setWarning(null);
    setInput('');
    setError(null);
    setAuthError(false);
    setShowHowItWorks(false);
  }, [sessionId]);

  // ---- History (GET /api/unsafe-zone/history) ----
  const loadHistory = useCallback(async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    try {
      const resp = await fetchWithSessionRetry(`${getApiUrl()}/api/unsafe-zone/history`, {
        method: 'GET',
      });
      if (resp.ok) {
        const data = await resp.json();
        setHistory(data.history || []);
      }
    } catch {
      // Non-blocking
    }
    setLoadingHistory(false);
  }, [loadingHistory]);

  useEffect(() => {
    if (showHistory && history.length === 0) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  // ---- Derived display state ----
  const inConversation = messages.length > 0;
  const isLoadingConversation = !conversationLoaded && !!user;
  const requiredCredits = getRequiredCredits();
  const costDisplay =
    !sessionId && turn === 0
      ? `${t('v2.unsafe-zone.costNew', '10 credits for 20 turns')} · ${t('v2.unsafe-zone.costExtend', '5 credits per 10 additional turns')}`
      : t('v2.unsafe-zone.costExtend', '5 credits per 10 additional turns');

  return (
    <div className="pg-unsafe-zone">
      {/* Header: title + turn-counter pill (mockup .uhead), marker, ticker */}
      <div className="uhead">
        <h1>{t('v2.unsafe-zone.title', 'UNSAFE ZONE')}</h1>
        {inConversation && !showHistory && (
          <Pill>
            {t('v2.unsafe-zone.turnPill', 'Turn {{turn}} / {{remaining}} remaining', {
              turn,
              remaining: turnsRemaining,
            })}
          </Pill>
        )}
      </div>
      <MarkerLine draw />
      <Ticker
        stat={t('v2.unsafe-zone.tickerStat', 'No dogmas. No fallacies. No fantasy. No evasions.')}
      >
        {sessionId
          ? t('v2.unsafe-zone.sessionActive', 'Session {{id}} // Active', {
              id: shortCode(sessionId),
            })
          : t('v2.unsafe-zone.sessionStandby', 'New session // Standby')}
      </Ticker>

      <div className="uwell">
        {showHistory ? (
          /* -------- Past sessions -------- */
          <div className="uz-history">
            <label className="f">{t('v2.unsafe-zone.pastSessions', 'Past sessions')}</label>
            {loadingHistory ? (
              <div className="mnote">{t('v2.unsafe-zone.loading', 'Loading…')}</div>
            ) : history.length === 0 ? (
              <div className="mnote">{t('v2.unsafe-zone.noHistory', 'No past sessions')}</div>
            ) : (
              history.map((session) => (
                <a
                  key={session.id}
                  className="hrow"
                  href="#session"
                  onClick={(e) => {
                    e.preventDefault();
                    resumeSession(session.id);
                  }}
                >
                  <span className="id">{shortCode(session.id, 6)}</span>
                  <span className="t">
                    {session.preview || t('v2.unsafe-zone.untitled', 'Untitled session')}
                  </span>
                  <span className="m">
                    {session.turnCount} {t('v2.unsafe-zone.turns', 'turns')}
                  </span>
                  <span className="d">{new Date(session.updatedAt).toLocaleDateString()}</span>
                  <Pill>
                    {session.status === 'active'
                      ? t('v2.unsafe-zone.active', 'Active')
                      : t('v2.unsafe-zone.completed', 'Completed')}
                  </Pill>
                </a>
              ))
            )}
            {error && <div className="uz-err">{error}</div>}
            <div className="actions">
              <a
                href="#back"
                onClick={(e) => {
                  e.preventDefault();
                  setError(null);
                  setShowHistory(false);
                }}
              >
                {t('v2.unsafe-zone.backToChat', 'Back to conversation')}
              </a>
            </div>
          </div>
        ) : (
          <>
            {isLoadingConversation ? (
              <div className="mnote" style={{ textAlign: 'center' }}>
                {t('v2.unsafe-zone.loading', 'Loading…')}
              </div>
            ) : !inConversation ? (
              /* -------- Idle entry screen: the manifesto -------- */
              <Manifesto t={t} />
            ) : (
              /* -------- Dialogue -------- */
              <>
                <button
                  type="button"
                  className="uz-link"
                  onClick={() => setShowHowItWorks((v) => !v)}
                >
                  {showHowItWorks
                    ? t('v2.unsafe-zone.hideIntro', 'Hide introduction')
                    : t('v2.unsafe-zone.howItWorks', 'How it works')}
                </button>
                {showHowItWorks && <HowItWorks t={t} />}
                <div className="uz-log" role="log" aria-live="polite">
                {messages.map((msg, i) => (
                  <div key={i} className={`msg ${msg.role === 'user' ? 'you' : 'ai'}`}>
                    <div className="who">
                      {msg.role === 'user'
                        ? t('v2.unsafe-zone.you', 'You')
                        : t('v2.unsafe-zone.philosify', 'Philosify')}
                    </div>
                    <div className="b">{msg.content}</div>
                  </div>
                ))}
                {sending && (
                  <div className="msg ai">
                    <div className="who">{t('v2.unsafe-zone.philosify', 'Philosify')}</div>
                    <div className="b">
                      <span className="uz-dots" aria-label={t('v2.unsafe-zone.loading', 'Loading…')}>
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
                </div>
              </>
            )}

            {/* Extension warning (turn counter telemetry) */}
            {warning && (
              <div className="uz-warn">
                {t('v2.unsafe-zone.warningExtend', '{{turns}} turns left. Extend: {{cost}} credits', {
                  turns: warning.turnsRemaining,
                  cost: warning.extensionCost,
                })}
              </div>
            )}

            {/* Errors (401 keeps the draft and offers sign-in) */}
            {error && (
              <div className="uz-err">
                {error}{' '}
                {authError && (
                  <a
                    href="/signin"
                    onClick={(e) => {
                      e.preventDefault();
                      try {
                        sessionStorage.setItem(DRAFT_KEY, input);
                      } catch { /* ignore */ }
                      navigate('/signin');
                    }}
                  >
                    {t('v2.unsafe-zone.signIn', 'Sign in')}
                  </a>
                )}
              </div>
            )}

            {/* Entry (mockup .entry): textarea + the one primary action */}
            <div className="entry">
              <textarea
                ref={inputRef}
                className="f"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('v2.unsafe-zone.placeholder', 'Bring your real question.')}
              />
              <div className="uz-sendcol">
                <Button onClick={sendMessage} disabled={!input.trim() || sending}>
                  {t('v2.unsafe-zone.send', 'Send')}
                </Button>
                {requiredCredits > 0 && (
                  <span className="uz-credit">
                    {t('v2.unsafe-zone.creditCost', '{{n}} credits', { n: requiredCredits })}
                  </span>
                )}
              </div>
            </div>

            {/* Cost transparency BEFORE the click */}
            <div className="uz-cost">{costDisplay}</div>
            <div className="unote">
              {t(
                'v2.unsafe-zone.unote',
                'Multi-turn Socratic dialogue. No scores. No verdicts. The final word is always yours.'
              )}
            </div>

            <div className="actions">
              {inConversation && (
                <a
                  href="#new"
                  onClick={(e) => {
                    e.preventDefault();
                    handleStartOver();
                  }}
                >
                  {t('v2.unsafe-zone.startOver', 'Start new session')}
                </a>
              )}
              {user && (
                <a
                  href="#history"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowHistory(true);
                  }}
                >
                  {t('v2.unsafe-zone.pastSessions', 'Past sessions')}
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UnsafeZonePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <PageShell
      status={t('v2.unsafe-zone.status', 'Analysis Engine // Active')}
      nav={<NavAccount />}
    >
      {/* Conversation state is keyed by user id: user change remounts it */}
      <UnsafeZoneConsole key={user?.id || 'guest'} user={user} />
      <V2ModalsHost />
    </PageShell>
  );
}
