// ============================================================
// HISTORY SIDEBAR - Container for the 3D Philosophy Graph
// Free module - no credits required
// ============================================================

import React from 'react';
import { HistoryGraph } from './HistoryGraph';

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
            background: '#222222',
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

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.85)',
  zIndex: 200000,
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'stretch',
};

const panelStyle = {
  position: 'relative',
  width: '100vw',
  height: '100vh',
  background: '#222222',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: '#222222',
  borderBottom: '1px solid #333',
  flexShrink: 0,
};

const backButtonStyle = {
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 6,
  color: '#F2F2F5',
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const titleStyle = {
  fontFamily: "'Orbitron', sans-serif",
  fontSize: 14,
  fontWeight: 700,
  color: '#F2F2F5',
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const contentStyle = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
};

export function HistorySidebar({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <button style={backButtonStyle} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div style={titleStyle}>
            <span style={{ color: '#D6158C' }}>&#9678;</span>
            History of Philosophy
          </div>
          <div style={{ width: 36 }} /> {/* Spacer for alignment */}
        </div>

        {/* Graph Container */}
        <div style={contentStyle}>
          <HistoryErrorBoundary onClose={onClose}>
            <HistoryGraph />
          </HistoryErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default HistorySidebar;
