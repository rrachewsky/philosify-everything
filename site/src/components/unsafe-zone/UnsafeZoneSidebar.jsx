// ============================================================
// UNSAFE ZONE — Socratic Dialogue Sidebar
// Conversational philosophical analysis of real dilemmas.
// Client-side history only. No Supabase storage during session.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useModal } from '../../hooks';
import { LoginModal, SignupModal, ForgotPasswordModal, PaymentModal } from '../index';
import { setPendingAction } from '../../utils/pendingAction.js';
import { config } from '@/config';
import '../../styles/music-sidebar.css';

export function UnsafeZoneSidebar({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { user, sessionBalance: balance } = useAuth();

  // Conversation state (client-only)
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const sidebarRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Modals
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

  // ---- Body scroll lock (same as all sidebars) ----
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

  // ---- Auto-scroll to bottom on new message ----
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // ---- Focus input when sidebar opens ----
  useEffect(() => {
    if (isOpen && inputRef.current && messages.length > 0) {
      inputRef.current.focus();
    }
  }, [isOpen, messages.length]);

  // ---- Send message ----
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Auth check
    if (!user) {
      signupModal.open();
      return;
    }

    // Credit check
    if (!balance || balance.total < 1) {
      setPendingAction({ type: 'unsafe-zone' });
      paymentModal.open();
      return;
    }

    const userMessage = { role: 'user', content: trimmed };
    const updatedHistory = [...messages, userMessage];

    setMessages(updatedHistory);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/unsafe-zone`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          lang: i18n.resolvedLanguage || i18n.language || 'en',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setPendingAction({ type: 'unsafe-zone' });
          paymentModal.open();
          // Remove the user message we optimistically added
          setMessages(messages);
          return;
        }
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch (err) {
      setError(t('unsafeZone.error', 'Something went wrong. Please try again.'));
      // Keep messages as-is so user can retry
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, balance, messages, i18n, t, signupModal, paymentModal]);

  // ---- Handle enter key ----
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // ---- Start over ----
  const handleStartOver = useCallback(() => {
    setMessages([]);
    setInput('');
    setError(null);
  }, []);

  // ---- Render ----
  const isIdle = messages.length === 0;

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
          <button className="music-sidebar__close" onClick={onClose}>&times;</button>
        </div>

        <div className="music-sidebar__content" style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100dvh - 56px)',
          padding: 0,
        }}>
          {/* Entry screen */}
          {isIdle ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              gap: '1rem',
            }}>
              <h2 style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 700,
                fontSize: '1.75rem',
                color: '#D6158C',
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                {t('unsafeZone.title', 'Unsafe Zone')}
              </h2>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.95rem',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                maxWidth: '320px',
                lineHeight: 1.5,
              }}>
                {t('unsafeZone.subtitle', 'No dogmas. No fallacies. No fantasy.')}
              </p>
              <p style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.4)',
                margin: '0.5rem 0 0',
              }}>
                {t('unsafeZone.cost', '1 credit per message')}
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
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}>
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
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end',
            background: 'rgba(10, 4, 28, 0.5)',
          }}>
            {!isIdle && (
              <button
                onClick={handleStartOver}
                title={t('unsafeZone.startOver', 'Start over')}
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
