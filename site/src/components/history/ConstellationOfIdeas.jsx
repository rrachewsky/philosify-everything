// ============================================================
// CONSTELLATION OF IDEAS - Main Container Component
// 3D visualization of 2,600 years of philosophical thought
// ============================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConstellation, BATTLE_COLORS, ERAS } from '@hooks/useConstellation';
import { useAuth } from '../../hooks/useAuth.js';
import { ConstellationScene } from './ConstellationScene.jsx';
import { TimelineControls } from './TimelineControls.jsx';
import { ConstellationInfoPanel } from './ConstellationInfoPanel.jsx';
import { ConstellationSearch } from './ConstellationSearch.jsx';
import { HistoricalEventTicker } from './HistoricalEventTicker.jsx';
import { HistoricalEventInfoPanel } from './HistoricalEventInfoPanel.jsx';

// Loading state component
function LoadingState({ t }) {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner} />
      <div style={styles.loadingText}>{t('constellation.loading')}</div>
      <div style={styles.loadingSubtext}>{t('constellation.loadingSubtext')}</div>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry, t }) {
  return (
    <div style={styles.errorContainer}>
      <div style={styles.errorIcon}>⚠</div>
      <div style={styles.errorText}>{t('constellation.loadError')}</div>
      <div style={styles.errorSubtext}>{error?.message || t('constellation.unknownError')}</div>
      <button style={styles.retryButton} onClick={onRetry}>
        {t('constellation.retry')}
      </button>
    </div>
  );
}

export function ConstellationOfIdeas() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const sceneRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detect mobile/tablet on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const {
    data,
    loading,
    error,
    currentYear,
    setCurrentYear,
    isPlaying,
    togglePlay,
    playbackSpeed,
    setPlaybackSpeed,
    jumpToEra,
    formatYear,
    MIN_YEAR,
    MAX_YEAR,
    getVisibleNodes,
    getVisibleEdges,
    selectedEra,
    toggleEraFilter,
    selectedSchool,
    toggleSchoolFilter,
    getSchools,
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    hoveredNode,
    setHoveredNode,
    soloNode,
    setSoloNode,
    searchPhilosopher,
    findPhilosopher,
    getNodeConnections,
  } = useConstellation();

  // Handle node selection from scene
  const handleNodeSelect = useCallback((nodeId) => {
    if (!nodeId) {
      setSelectedNode(null);
      return;
    }
    const node = findPhilosopher(nodeId);
    if (node) {
      setSelectedNode(node);
      setSelectedEdge(null);
    }
  }, [findPhilosopher, setSelectedNode, setSelectedEdge]);

  // Handle edge selection from scene
  const handleEdgeSelect = useCallback((edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, [setSelectedEdge, setSelectedNode]);

  // Handle search result selection
  const handleSearchSelect = useCallback((node) => {
    setSelectedNode(node);
    setSoloNode(node); // Show only this philosopher on the globe
    setShowSearch(false);
    // Jump timeline to show this philosopher
    if (node.birth_year > currentYear) {
      setCurrentYear(node.birth_year + 50);
    }
    // Camera will fly to node via scene ref
    if (sceneRef.current?.flyToNode) {
      sceneRef.current.flyToNode(node);
    }
  }, [currentYear, setCurrentYear, setSelectedNode, setSoloNode]);

  // Handle retry
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Space to toggle play (if not in search)
      if (e.code === 'Space' && !showSearch) {
        e.preventDefault();
        togglePlay();
      }
      // Escape to close panels
      if (e.code === 'Escape') {
        if (showSearch) setShowSearch(false);
        else if (selectedNode) setSelectedNode(null);
        else if (selectedEdge) setSelectedEdge(null);
      }
      // Ctrl/Cmd + F for search
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch, selectedNode, selectedEdge, togglePlay, setSelectedNode, setSelectedEdge]);

  // Render loading state
  if (loading) {
    return <LoadingState t={t} />;
  }

  // Render error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} t={t} />;
  }

  const visibleNodes = getVisibleNodes();
  const visibleEdges = getVisibleEdges();

  // Get date range text for active filter
  const getFilterDateRange = () => {
    if (selectedEra) {
      const era = ERAS.find(e => e.id === selectedEra);
      if (era) {
        if (era.filterByMovement) {
          // For movement-based eras, calculate from visible nodes
          if (visibleNodes.length > 0) {
            const years = visibleNodes.map(n => n.birth_year).filter(y => y != null);
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            return `${formatYear(minYear)} – ${formatYear(maxYear)}`;
          }
          return era.label;
        }
        return `${formatYear(era.startYear)} – ${formatYear(era.endYear)}`;
      }
    }
    if (selectedSchool && visibleNodes.length > 0) {
      const years = visibleNodes.map(n => n.birth_year).filter(y => y != null);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      return `${formatYear(minYear)} – ${formatYear(maxYear)}`;
    }
    return null;
  };

  const filterDateRange = getFilterDateRange();

  return (
    <div style={styles.container}>
      {/* 3D Scene */}
      <ConstellationScene
        ref={sceneRef}
        nodes={visibleNodes}
        edges={visibleEdges}
        allNodes={data?.nodes || []}
        selectedNode={selectedNode}
        hoveredNode={hoveredNode}
        onNodeSelect={handleNodeSelect}
        onNodeHover={setHoveredNode}
        onEdgeSelect={handleEdgeSelect}
        currentYear={currentYear}
      />

      {/* Year Display - Centered above globe */}
      <div style={styles.yearDisplay}>
        <span style={styles.yearText}>{formatYear(currentYear)}</span>
      </div>

      {/* Left Control Bar */}
      <div style={styles.controlBar}>
        {/* Search */}
        <button
          style={{
            ...styles.controlButton,
            ...(showSearch ? { background: 'rgba(214, 21, 140, 0.3)', borderColor: 'rgba(214, 21, 140, 0.5)' } : {}),
          }}
          onClick={() => setShowSearch(!showSearch)}
          title={t('constellation.search')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>

        {/* Inline Search Field */}
        <ConstellationSearch
          searchPhilosopher={searchPhilosopher}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
          formatYear={formatYear}
          isOpen={showSearch}
        />

        {/* Zoom In */}
        <button
          style={styles.controlButton}
          onClick={() => sceneRef.current?.zoomIn?.()}
          title={t('constellation.zoomIn')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        </button>
        {/* Zoom Out */}
        <button
          style={styles.controlButton}
          onClick={() => sceneRef.current?.zoomOut?.()}
          title={t('constellation.zoomOut')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
        </button>
        {/* Reset View */}
        <button
          style={styles.controlButton}
          onClick={() => sceneRef.current?.resetView?.()}
          title={t('constellation.resetView')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>

      {/* Historical Event Ticker */}
      <HistoricalEventTicker
        currentYear={currentYear}
        formatYear={formatYear}
        onEventClick={setSelectedEvent}
        isPlaying={isPlaying}
      />

      {/* Historical Event Info Panel */}
      {selectedEvent && (
        <HistoricalEventInfoPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          formatYear={formatYear}
          isMobile={isMobile}
        />
      )}

      {/* Timeline Controls */}
      <TimelineControls
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
        jumpToEra={jumpToEra}
        formatYear={formatYear}
        minYear={MIN_YEAR}
        maxYear={MAX_YEAR}
        selectedEra={selectedEra}
        toggleEraFilter={toggleEraFilter}
        selectedSchool={selectedSchool}
        toggleSchoolFilter={toggleSchoolFilter}
        schools={getSchools()}
      />

      {/* Info Panel (selected node/edge) */}
      {(selectedNode || selectedEdge) && (
        <ConstellationInfoPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          allNodes={data?.nodes || []}
          getNodeConnections={getNodeConnections}
          findPhilosopher={findPhilosopher}
          onClose={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
            setSoloNode(null); // Exit solo mode, return to normal view
          }}
          onNodeSelect={handleNodeSelect}
          formatYear={formatYear}
          isMobile={isMobile}
          userId={user?.id}
        />
      )}

    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: '#0a0a0f',
    overflow: 'hidden',
  },

  // Left control bar
  controlBar: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 100,
  },

  controlButton: {
    width: 40,
    height: 40,
    background: 'rgba(20, 20, 30, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    color: '#F2F2F5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    backdropFilter: 'blur(8px)',
  },

  // Year display - centered above globe
  yearDisplay: {
    position: 'absolute',
    top: 50,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    pointerEvents: 'none',
  },

  yearText: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 32,
    fontWeight: 700,
    color: '#D6158C',
    textShadow: '0 0 20px rgba(214, 21, 140, 0.5), 0 2px 10px rgba(0, 0, 0, 0.8)',
    letterSpacing: 2,
  },
  
  // Loading
  loadingContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0f',
    color: '#F2F2F5',
  },
  loadingSpinner: {
    width: 48,
    height: 48,
    border: '3px solid rgba(214, 21, 140, 0.2)',
    borderTop: '3px solid #D6158C',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Error
  errorContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0f',
    color: '#F2F2F5',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 16,
  },
  retryButton: {
    padding: '10px 24px',
    background: '#D6158C',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },

  // Legend - position overridden inline for mobile
  legend: {
    position: 'absolute',
    top: 16,
    left: 16,
    background: 'rgba(20, 20, 30, 0.85)',
    borderRadius: 8,
    padding: '12px 16px',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  legendLabel: {
    fontSize: 11,
    color: '#F2F2F5',
  },
};

// Add keyframes for spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default ConstellationOfIdeas;
