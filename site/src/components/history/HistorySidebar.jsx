// ============================================================
// HISTORY SIDEBAR - Container for the 3D Philosophy Visualizations
// Free module - no credits required
// Supports two views: Ideas Graph (force-directed) and Globe of Ideas (geographic)
// ============================================================

import React, { useState } from 'react';
import { HistoryGraph } from './HistoryGraph';
import { GlobeOfIdeas } from './GlobeOfIdeas';

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

const contentStyle = {
  flex: 1,
  position: 'relative',
  overflow: 'hidden',
};

const VIEW_MODES = {
  GRAPH: 'graph',
  GLOBE: 'globe',
};

const viewToggleContainerStyle = {
  display: 'flex',
  gap: 4,
  background: 'rgba(34, 34, 34, 0.9)',
  borderRadius: 6,
  padding: 3,
  border: '1px solid #333',
};

const viewToggleButtonStyle = (isActive) => ({
  background: isActive ? '#D6158C' : 'transparent',
  border: 'none',
  borderRadius: 4,
  color: isActive ? '#FAFAFB' : '#89CFF0',
  padding: '6px 12px',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
  letterSpacing: 0.5,
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

export function HistorySidebar({ isOpen, onClose }) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRAPH);

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

          {/* View Toggle - Center */}
          <div style={viewToggleContainerStyle}>
            <button
              style={viewToggleButtonStyle(viewMode === VIEW_MODES.GRAPH)}
              onClick={() => setViewMode(VIEW_MODES.GRAPH)}
              title="Ideas Graph - Force-directed 3D visualization"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="12" r="2" />
                <circle cx="19" cy="6" r="2" />
                <circle cx="19" cy="18" r="2" />
                <path d="M7 12h8M17 7l-8 4M17 17l-8-4" />
              </svg>
              Ideas Graph
            </button>
            <button
              style={viewToggleButtonStyle(viewMode === VIEW_MODES.GLOBE)}
              onClick={() => setViewMode(VIEW_MODES.GLOBE)}
              title="Globe of Ideas - Geographic spread through time"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Globe of Ideas
            </button>
          </div>

          <div style={{ width: 36 }} /> {/* Spacer for alignment */}
        </div>

        {/* Graph/Globe Container */}
        <div style={contentStyle}>
          <HistoryErrorBoundary onClose={onClose}>
            {viewMode === VIEW_MODES.GRAPH ? <HistoryGraph /> : <GlobeOfIdeas />}
          </HistoryErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default HistorySidebar;
