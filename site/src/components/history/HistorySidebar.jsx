// ============================================================
// HISTORY SIDEBAR - Container for the 3D Philosophy Graph
// Free module - no credits required
// ============================================================

import { HistoryGraph } from './HistoryGraph';

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
          <HistoryGraph />
        </div>
      </div>
    </div>
  );
}

export default HistorySidebar;
