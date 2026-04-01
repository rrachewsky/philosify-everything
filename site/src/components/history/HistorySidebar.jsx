// ============================================================
// HISTORY SIDEBAR - Container for the Constellation of Ideas
// Free module - no credits required
// Uses same styling as Music/Cinema sidebars
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ConstellationOfIdeas } from './ConstellationOfIdeas.jsx';
import '../../styles/music-sidebar.css';

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
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
            color: '#F2F2F5',
          }}
        >
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9888;</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>3D Graph Failed to Load</div>
            <div style={{ fontSize: 12, color: '#89CFF0', marginBottom: 16 }}>
              Your browser may not support WebGL
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                padding: '8px 16px',
                background: '#D6158C',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
                marginRight: 8,
              }}
            >
              Retry
            </button>
            <button
              onClick={this.props.onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid #444',
                borderRadius: 6,
                color: '#F2F2F5',
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

export function HistorySidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`}
        onClick={onClose}
      />
      
      {/* Fullscreen Panel */}
      <div 
        className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}
        style={{
          width: '100vw',
          maxWidth: '100vw',
          background: '#0a0a0f',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Header - same pattern as Music/Cinema */}
        <div className="music-sidebar__header" style={{ background: '#0a0a0f', borderBottom: '1px solid rgba(214, 21, 140, 0.2)' }}>
          <span className="music-sidebar__title" style={{ color: '#D6158C' }}>
            <span className="music-sidebar__icon">&#127760;</span>
            {t('nav.history', 'History of Philosophy')}
          </span>
          <button className="music-sidebar__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Constellation Container - takes remaining space */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <HistoryErrorBoundary onClose={onClose}>
            <ConstellationOfIdeas />
          </HistoryErrorBoundary>
        </div>
      </div>
    </>
  );
}

export default HistorySidebar;
