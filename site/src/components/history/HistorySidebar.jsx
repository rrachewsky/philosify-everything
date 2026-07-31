// ============================================================
// HISTORY SIDEBAR - Container for the Constellation of Ideas
// Free module - no credits required
// v2 shell skin (WP6.3, ruling 30 Jul 2026): .hist-shell classes
// in v2-pages/history-ui.css replace the legacy music-sidebar
// skin — mechanics (backdrop, slide-in, scroll lock, error
// boundary) are unchanged.
// ============================================================

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ConstellationOfIdeas } from './ConstellationOfIdeas.jsx';
import '../../styles/v2-pages/history-ui.css';

// Error boundary to catch 3D rendering crashes
class HistoryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[HistoryErrorBoundary] Caught error:', error);
    console.error('[HistoryErrorBoundary] Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // v2 error state — --warn functional-only; kit primary/secondary buttons
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            color: 'var(--ink-hi)',
          }}
        >
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div
              style={{
                font: '500 12px/1.4 var(--f-ui)',
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--warn)',
                marginBottom: 8,
              }}
            >
              3D Graph Failed to Load
            </div>
            <div style={{ font: '400 12px/1.5 var(--f-ui)', color: 'var(--ink-mid)', marginBottom: 18 }}>
              Your browser may not support WebGL
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '14px 26px',
                background: 'var(--ink-hi)',
                border: 0,
                borderRadius: 0,
                color: 'var(--ink-inv)',
                font: '500 13px/1 var(--f-ui)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginRight: 10,
              }}
            >
              Retry
            </button>
            <button
              onClick={this.props.onClose}
              style={{
                padding: '13px 25px',
                background: 'none',
                border: '1px solid var(--line-strong)',
                borderRadius: 0,
                color: 'var(--ink-hi)',
                font: '500 13px/1 var(--f-ui)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function HistorySidebar({ isOpen, onClose, initialSchool = null }) {
  const { t } = useTranslation();

  // Lock body scroll and restore position on close (same pattern as other sidebars)
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

  // Portaled to document.body: .v2 .page (z-index:1) is a stacking context
  // below the fixed .hdr (z-index:4), so mounted inline the header paints
  // over the shell's top band and swallows the close button. history-ui.css
  // selectors are unscoped and tokens live on :root / body.t-white, so the
  // shell renders identically outside the .v2 subtree.
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`hist-shell-backdrop ${isOpen ? 'hist-shell-backdrop--open' : ''}`}
        onClick={onClose}
      />

      {/* Fullscreen Panel */}
      <div
        className={`hist-shell ${isOpen ? 'hist-shell--open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header — Michroma title, kit exit instrument; no bottom hairline (Law §4) */}
        <div className="hist-shell__header">
          <span className="hist-shell__title">
            {t('nav.historyShort', 'HISTORY')}
          </span>
          <button
            className="hist-shell__close"
            onClick={onClose}
            aria-label={t('constellation.close')}
          >
            ✕
          </button>
        </div>

        {/* Constellation Container - takes remaining space */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <HistoryErrorBoundary onClose={onClose}>
            <ConstellationOfIdeas initialSchool={initialSchool} />
          </HistoryErrorBoundary>
        </div>
      </div>
    </>,
    document.body
  );
}

export default HistorySidebar;
