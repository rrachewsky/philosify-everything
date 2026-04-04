// ============================================================
// UNSAFE ZONE — Socratic Dialogue Sidebar
// Session-based billing: 10 credits for 20 turns, 5 credits per 10 additional
// Conversations stored in Supabase with session tracking.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useModal } from '../../hooks';
import { LoginModal, SignupModal, ForgotPasswordModal, PaymentModal } from '../index';
import { setPendingAction } from '../../utils/pendingAction.js';
import { config } from '@/config';
import '../../styles/music-sidebar.css';

// Billing constants (match backend)
const INITIAL_COST = 10;
const EXTENSION_COST = 5;
const INITIAL_TURNS = 20;
const EXTENSION_TURNS = 10;

export function UnsafeZoneSidebar({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { user, sessionBalance: balance } = useAuth();

  // Session state
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [turn, setTurn] = useState(0);
  const [turnsRemaining, setTurnsRemaining] = useState(INITIAL_TURNS);
  const [warning, setWarning] = useState(null);
  
  // UI state
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Refs
  const sidebarRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Modals
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

  // ---- Load active session when sidebar opens ----
  useEffect(() => {
    if (!isOpen || !user || conversationLoaded) return;

    const loadSession = async () => {
      try {
        const resp = await fetch(`${config.apiUrl}/api/unsafe-zone/conversation`, {
          method: 'GET',
          credentials: 'include',
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.sessionId) {
            setSessionId(data.sessionId);
            setMessages(data.messages || []);
            setTurn(data.turn || 0);
            setTurnsRemaining(data.turnsRemaining ?? INITIAL_TURNS);
          }
        }
      } catch (e) {
        // Non-blocking
      }
      setConversationLoaded(true);
    };

    loadSession();
  }, [isOpen, user, conversationLoaded]);

  // ---- Body scroll lock ----
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
  }, [isOpen]);

  // ---- Auto-scroll to bottom ----
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // ---- Focus input ----
  useEffect(() => {
    if (isOpen && inputRef.current && messages.length > 0) {
      inputRef.current.focus();
    }
  }, [isOpen, messages.length]);

  // ---- Calculate required credits for next message ----
  const getRequiredCredits = useCallback(() => {
    if (!sessionId && turn === 0) {
      // New session - need initial cost
      return INITIAL_COST;
    }
    // Check if we need extension payment
    const nextTurn = turn + 1;
    if (nextTurn > INITIAL_TURNS && ((nextTurn - INITIAL_TURNS - 1) % EXTENSION_TURNS === 0)) {
      return EXTENSION_COST;
    }
    return 0; // No payment needed for this turn
  }, [sessionId, turn]);

  // ---- Send message ----
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (!user) {
      signupModal.open();
      return;
    }

    const requiredCredits = getRequiredCredits();
    if (requiredCredits > 0 && (!balance || balance.total < requiredCredits)) {
      setPendingAction({ type: 'unsafe-zone', credits: requiredCredits });
      paymentModal.open();
      return;
    }

    const userMessage = { role: 'user', content: trimmed };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInput('');
    setError(null);
    setWarning(null);
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/unsafe-zone`, {
        method: 'POST',
        credentials: 'include',
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
          setMessages(messages);
          loginModal.open();
          return;
        }
        if (response.status === 402) {
          const needed = data.requiredCredits || (data.isExtension ? EXTENSION_COST : INITIAL_COST);
          setPendingAction({ type: 'unsafe-zone', credits: needed });
          paymentModal.open();
          setMessages(messages);
          return;
        }
        throw new Error(data.error || 'Failed to get response');
      }

      // Update state with response
      setSessionId(data.sessionId);
      setTurn(data.turn);
      setTurnsRemaining(data.turnsRemaining);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Show warning if provided
      if (data.warning) {
        setWarning(data.warning);
      }

      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch (err) {
      setError(t('unsafeZone.error', 'Something went wrong. Please try again.'));
      setMessages(messages); // Restore on error
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, balance, messages, i18n, t, sessionId, getRequiredCredits, signupModal, paymentModal, loginModal]);

  // ---- Handle enter key ----
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ---- End session and start new ----
  const handleStartOver = useCallback(async () => {
    // End current session if exists
    if (sessionId) {
      try {
        await fetch(`${config.apiUrl}/api/unsafe-zone/end`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (e) {
        // Non-blocking
      }
    }
    
    // Reset state for new session
    setSessionId(null);
    setMessages([]);
    setTurn(0);
    setTurnsRemaining(INITIAL_TURNS);
    setWarning(null);
    setInput('');
    setError(null);
  }, [sessionId]);

  // ---- Load history ----
  const loadHistory = useCallback(async () => {
    if (loadingHistory) return;
    setLoadingHistory(true);
    
    try {
      const resp = await fetch(`${config.apiUrl}/api/unsafe-zone/history`, {
        method: 'GET',
        credentials: 'include',
      });
      if (resp.ok) {
        const data = await resp.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      // Non-blocking
    }
    setLoadingHistory(false);
  }, [loadingHistory]);

  // ---- Load history when opening history view ----
  useEffect(() => {
    if (showHistory && history.length === 0) {
      loadHistory();
    }
  }, [showHistory, history.length, loadHistory]);

  // ---- Resume a past session ----
  const resumeSession = useCallback(async (historySessionId) => {
    try {
      const resp = await fetch(`${config.apiUrl}/api/unsafe-zone/session/${historySessionId}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (resp.ok) {
        const data = await resp.json();
        setSessionId(data.id);
        setMessages(data.messages || []);
        setTurn(data.turnCount || 0);
        setTurnsRemaining(data.turnsRemaining || 0);
        setShowHistory(false);
      }
    } catch (e) {
      setError(t('unsafeZone.loadError', 'Failed to load session'));
    }
  }, [t]);

  // ---- Render ----
  const isIdle = messages.length === 0 && conversationLoaded && !showHistory;
  const isLoadingConversation = !conversationLoaded && isOpen && user;

  // Calculate cost display
  const getCostDisplay = () => {
    if (!sessionId && turn === 0) {
      return t('unsafeZone.costNew', '10 credits for 20 turns');
    }
    return t('unsafeZone.costExtend', '5 credits per 10 additional turns');
  };

  return (
    <>
      <div className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`} />
      <div
        ref={sidebarRef}
        className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="music-sidebar__header">
          <span className="music-sidebar__title">
            <span className="music-sidebar__icon">&#9888;&#65039;</span>
            {t('unsafeZone.title', 'Unsafe Zone')}
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* History button */}
            {user && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                title={t('unsafeZone.history', 'History')}
                style={{
                  background: showHistory ? 'rgba(137, 207, 240, 0.2)' : 'none',
                  border: 'none',
                  color: showHistory ? '#89CFF0' : 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                &#128218;
              </button>
            )}
            <button className="music-sidebar__close" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="music-sidebar__content" style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100dvh - 56px)',
          padding: 0,
        }}>
          {/* Turn counter and warning */}
          {messages.length > 0 && !showHistory && (
            <div style={{
              padding: '0.5rem 1rem',
              background: 'rgba(137, 207, 240, 0.05)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              fontFamily: 'Inter, sans-serif',
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {t('unsafeZone.turn', 'Turn')} {turn} • {turnsRemaining} {t('unsafeZone.remaining', 'remaining')}
              </span>
              {warning && (
                <span style={{ 
                  color: '#f59e0b',
                  fontWeight: 600,
                }}>
                  ⚠ {t('unsafeZone.warningExtend', '{{turns}} turns left. Extend: {{cost}} credits', {
                    turns: warning.turnsRemaining,
                    cost: warning.extensionCost,
                  })}
                </span>
              )}
            </div>
          )}

          {/* History view */}
          {showHistory ? (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
            }}>
              <h3 style={{
                color: '#89CFF0',
                fontSize: '1rem',
                margin: '0 0 1rem',
                fontFamily: 'Poppins, sans-serif',
              }}>
                {t('unsafeZone.pastSessions', 'Past Sessions')}
              </h3>
              
              {loadingHistory ? (
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {t('common.loading', 'Loading...')}
                </div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)' }}>
                  {t('unsafeZone.noHistory', 'No past sessions')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {history.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => resumeSession(session.id)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#FAFAFB',
                      }}
                    >
                      <div style={{
                        fontSize: '0.85rem',
                        marginBottom: '0.25rem',
                        color: 'rgba(255, 255, 255, 0.8)',
                      }}>
                        {session.preview || t('unsafeZone.untitled', 'Untitled session')}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        gap: '0.75rem',
                      }}>
                        <span>{session.turnCount} {t('unsafeZone.turns', 'turns')}</span>
                        <span style={{
                          color: session.status === 'active' ? '#89CFF0' : 'rgba(255, 255, 255, 0.4)',
                        }}>
                          {session.status === 'active' 
                            ? t('unsafeZone.active', 'Active')
                            : t('unsafeZone.completed', 'Completed')}
                        </span>
                        <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  marginTop: '1rem',
                  background: 'rgba(214, 21, 140, 0.15)',
                  border: '1px solid rgba(214, 21, 140, 0.3)',
                  borderRadius: '8px',
                  padding: '0.6rem 1rem',
                  color: '#D6158C',
                  cursor: 'pointer',
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                }}
              >
                {t('unsafeZone.backToChat', 'Back to conversation')}
              </button>
            </div>
          ) : isLoadingConversation ? (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#89CFF0',
                      animation: `unsafeZonePulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : isIdle ? (
            /* Entry screen with welcome message */
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              gap: '1rem',
            }}>
              <h2 style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: '#D6158C',
                margin: 0,
                textAlign: 'center',
                letterSpacing: '-0.02em',
              }}>
                {t('unsafeZone.title', 'Unsafe Zone')}
              </h2>

              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.88rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.7,
              }}>
                <p style={{ margin: '0 0 0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                  {t('unsafeZone.welcome1', 'Most spaces online offer you agreement, validation, or distraction.')}
                </p>
                <p style={{ margin: '0 0 0.8rem', fontWeight: 600, color: '#FAFAFB' }}>
                  {t('unsafeZone.welcome2', 'This is not one of them.')}
                </p>
                <p style={{ margin: '0 0 0.8rem' }}>
                  {t('unsafeZone.welcome3', 'Unsafe Zone exists because real questions deserve to be examined — not answered. Not comfort. Not a list of perspectives. Not someone telling you what to think.')}
                </p>
                <p style={{ margin: '0 0 0.8rem' }}>
                  {t('unsafeZone.welcome4', "You carry questions that don't fit in a search bar. Dilemmas that keep returning. Fears you haven't named. Decisions you've been circling for months or years without landing anywhere honest.")}
                </p>
                <p style={{ margin: '0 0 0.8rem', fontWeight: 600, color: '#D6158C' }}>
                  {t('unsafeZone.welcome5', 'This is where you bring those.')}
                </p>
                <p style={{ margin: '0 0 0.8rem' }}>
                  {t('unsafeZone.welcome6', 'What happens here is not therapy, not advice, and not judgment. It is rigorous, patient, philosophical dialogue — designed to surface what is actually inside the question you are carrying, strip away the evasions and borrowed beliefs, and leave you with something you can actually use: clarity about what you truly think, what you truly value, and what the honest answer actually is.')}
                </p>
                <p style={{ margin: '0 0 0.8rem' }}>
                  {t('unsafeZone.welcome7', 'You will be asked precise questions. You will be taken seriously. You will not be told what to do.')}
                </p>
                <p style={{ margin: '0 0 0.8rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                  {t('unsafeZone.welcome8', 'The last step is always yours.')}
                </p>
                <p style={{ margin: '0.8rem 0 0', fontWeight: 600, color: '#89CFF0', textAlign: 'center' }}>
                  {t('unsafeZone.welcome9', 'You are not here for comfort. You are here for clarity.')}
                </p>
              </div>

              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8rem',
                color: 'rgba(255, 255, 255, 0.35)',
                margin: 0,
                textAlign: 'center',
              }}>
                {getCostDisplay()}
              </p>
            </div>
          ) : (
            /* Chat messages */
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              {/* How it works link */}
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(137, 207, 240, 0.6)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'center',
                  fontFamily: 'Inter, sans-serif',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                {showHowItWorks ? t('unsafeZone.hideIntro', 'Hide introduction') : t('unsafeZone.howItWorks', 'How it works')}
              </button>

              {/* Collapsible intro */}
              {showHowItWorks && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: 'rgba(137, 207, 240, 0.06)',
                  border: '1px solid rgba(137, 207, 240, 0.12)',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.45)' }}>
                    {t('unsafeZone.welcome1', 'Most spaces online offer you agreement, validation, or distraction.')}
                  </p>
                  <p style={{ margin: 0, fontWeight: 600, color: '#FAFAFB' }}>
                    {t('unsafeZone.welcome2', 'This is not one of them.')}
                  </p>
                  <p style={{ margin: 0 }}>
                    {t('unsafeZone.welcome3', 'Unsafe Zone exists because real questions deserve to be examined — not answered.')}
                  </p>
                  <p style={{ margin: 0, fontWeight: 600, color: '#89CFF0', textAlign: 'center' }}>
                    {t('unsafeZone.welcome9', 'You are not here for comfort. You are here for clarity.')}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '0.75rem 1rem',
                    borderRadius: msg.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    background: msg.role === 'user'
                      ? 'rgba(214, 21, 140, 0.15)'
                      : 'rgba(137, 207, 240, 0.08)',
                    border: msg.role === 'user'
                      ? '1px solid rgba(214, 21, 140, 0.3)'
                      : '1px solid rgba(137, 207, 240, 0.15)',
                    color: '#FAFAFB',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div style={{
                  alignSelf: 'flex-start',
                  padding: '0.75rem 1rem',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'rgba(137, 207, 240, 0.08)',
                  border: '1px solid rgba(137, 207, 240, 0.15)',
                }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#89CFF0',
                          opacity: 0.6,
                          animation: `unsafeZonePulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '0.5rem 1rem',
              color: '#ef4444',
              fontSize: '0.8rem',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Input area */}
          {!showHistory && (
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-end',
              background: 'rgba(10, 4, 28, 0.5)',
            }}>
              {messages.length > 0 && (
                <button
                  onClick={handleStartOver}
                  title={t('unsafeZone.startOver', 'Start new session')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    fontSize: '1.1rem',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  &#8634;
                </button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('unsafeZone.placeholder', 'Bring your real question.')}
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  color: '#FAFAFB',
                  fontSize: '0.9rem',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.4,
                  outline: 'none',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg, #D6158C, #89CFF0)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAFAFB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Pulse animation */}
        <style>{`
          @keyframes unsafeZonePulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>

        {/* Internal modals */}
        {(loginModal.isOpen || signupModal.isOpen || forgotPasswordModal.isOpen || paymentModal.isOpen) && (
          <div className="music-sidebar__modals">
            {loginModal.isOpen && (
              <LoginModal
                isOpen={true}
                onClose={loginModal.close}
                onSwitchToSignup={() => { loginModal.close(); signupModal.open(); }}
                onSwitchToForgotPassword={() => { loginModal.close(); forgotPasswordModal.open(); }}
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
            {paymentModal.isOpen && (
              <PaymentModal isOpen={true} onClose={paymentModal.close} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default UnsafeZoneSidebar;
