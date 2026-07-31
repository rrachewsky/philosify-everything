// ============================================================
// CONSTELLATION OF IDEAS - Main Container Component
// 3D visualization of 2,600 years of philosophical thought
// ============================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConstellation, ERAS } from '@hooks/useConstellation';
import { useAuth } from '../../hooks/useAuth.js';
import { ConstellationScene } from './ConstellationScene.jsx';
import { TimelineControls } from './TimelineControls.jsx';
import { ConstellationInfoPanel } from './ConstellationInfoPanel.jsx';
import { ConstellationSearch } from './ConstellationSearch.jsx';
import { HistoricalEventTicker } from './HistoricalEventTicker.jsx';
import { HistoricalEventInfoPanel } from './HistoricalEventInfoPanel.jsx';
import '../../styles/v2-pages/history-ui.css';

// Loading state component
function LoadingState({ t }) {
  return (
    <div style={styles.loadingContainer}>
      <div className="hist-spinner" />
      <div style={styles.loadingText}>{t('constellation.loading')}</div>
      <div style={styles.loadingSubtext}>{t('constellation.loadingSubtext')}</div>
    </div>
  );
}

// Error state component — functional error tone only (Law: --warn, states only)
function ErrorState({ error, onRetry, t }) {
  return (
    <div style={styles.errorContainer}>
      <div style={styles.errorText}>{t('constellation.loadError')}</div>
      <div style={styles.errorSubtext}>{error?.message || t('constellation.unknownError')}</div>
      <button style={styles.retryButton} onClick={onRetry}>
        {t('constellation.retry')}
      </button>
    </div>
  );
}

export function ConstellationOfIdeas({ initialSchool = null }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const sceneRef = useRef(null);
  const appliedSchoolRef = useRef(null);
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

  // Handle influence click from info panel — same behavior as search select
  const handleInfluenceSelect = useCallback((nodeId) => {
    if (!nodeId) return;
    const node = findPhilosopher(nodeId);
    if (!node) return;
    setSelectedNode(node);
    setSoloNode(node);
    setSelectedEdge(null);
    // Always jump timeline to philosopher's birth year
    setCurrentYear(node.birth_year + 50);
    setTimeout(() => {
      if (sceneRef.current?.flyToNode) {
        sceneRef.current.flyToNode(node);
      }
    }, 50);
  }, [findPhilosopher, setCurrentYear, setSelectedNode, setSoloNode, setSelectedEdge]);

  // Handle search result selection
  const handleSearchSelect = useCallback((node) => {
    setSelectedNode(node);
    setSoloNode(node); // Show only this philosopher on the globe
    setShowSearch(false);
    // Always jump timeline to philosopher's birth year
    setCurrentYear(node.birth_year + 50);
    // Wait for state update before flying to node (same as era/school filters)
    setTimeout(() => {
      if (sceneRef.current?.flyToNode) {
        sceneRef.current.flyToNode(node);
      }
    }, 50);
  }, [setCurrentYear, setSelectedNode, setSoloNode]);

  // Handle era filter with camera fly-to
  const handleEraFilter = useCallback((eraId) => {
    toggleEraFilter(eraId);
    // After filter toggle, fly to a representative philosopher
    // Use setTimeout to let the state update first
    setTimeout(() => {
      if (eraId && data?.nodes) {
        const era = ERAS.find(e => e.id === eraId);
        if (era) {
          // Find philosophers in this era
          let eraNodes;
          if (era.filterByMovement) {
            eraNodes = data.nodes.filter(n => era.movements?.includes(n.school));
          } else {
            eraNodes = data.nodes.filter(n => 
              n.birth_year >= era.startYear && n.birth_year <= era.endYear
            );
          }
          if (eraNodes.length > 0) {
            // Fly to a philosopher near the middle of the era (by birth year)
            const sorted = [...eraNodes].sort((a, b) => a.birth_year - b.birth_year);
            const midNode = sorted[Math.floor(sorted.length / 2)];
            if (sceneRef.current?.flyToNode) {
              sceneRef.current.flyToNode(midNode);
            }
            // Also jump timeline to show them
            setCurrentYear(midNode.birth_year + 20);
          }
        }
      } else {
        // Filter cleared - reset view
        sceneRef.current?.resetView?.();
      }
    }, 50);
  }, [toggleEraFilter, data, setCurrentYear]);

  // Handle school filter with camera fly-to
  const handleSchoolFilter = useCallback((schoolName) => {
    toggleSchoolFilter(schoolName);
    // After filter toggle, fly to a representative philosopher
    setTimeout(() => {
      if (schoolName && data?.nodes) {
        const schoolNodes = data.nodes.filter(n => n.school === schoolName);
        if (schoolNodes.length > 0) {
          // Fly to a philosopher near the middle (by birth year)
          const sorted = [...schoolNodes].sort((a, b) => a.birth_year - b.birth_year);
          const midNode = sorted[Math.floor(sorted.length / 2)];
          if (sceneRef.current?.flyToNode) {
            sceneRef.current.flyToNode(midNode);
          }
          // Also jump timeline to show them
          setCurrentYear(midNode.birth_year + 20);
        }
      } else {
        // Filter cleared - reset view
        sceneRef.current?.resetView?.();
      }
    }, 50);
  }, [toggleSchoolFilter, data, setCurrentYear]);

  // Handle retry
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Apply the school preselected on HistoryPage (pill deep-link) once nodes
  // are loaded — the fly-to needs data. One-shot per school value via ref;
  // the component remounts on every shell open, so reopening from another
  // pill starts clean and applies the new school.
  useEffect(() => {
    if (loading || error || !initialSchool) return;
    if (appliedSchoolRef.current === initialSchool) return;
    appliedSchoolRef.current = initialSchool;
    handleSchoolFilter(initialSchool);
  }, [loading, error, initialSchool, handleSchoolFilter]);

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
        isPlaying={isPlaying}
      />

      {/* Year Display - Centered above globe */}
      <div style={styles.yearDisplay}>
        <span style={styles.yearText}>{formatYear(currentYear)}</span>
      </div>

      {/* Left Control Bar */}
      <div style={styles.controlBar}>
        {/* Search Row - Button and Field side by side */}
        <div style={styles.searchRow}>
          <button
            style={{
              ...styles.controlButton,
              ...(showSearch ? { borderColor: 'var(--ink-hi)' } : {}),
            }}
            onClick={() => setShowSearch(!showSearch)}
            title={t('constellation.search')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Inline Search Field - side by side with button */}
          <ConstellationSearch
            searchPhilosopher={searchPhilosopher}
            onSelect={handleSearchSelect}
            onClose={() => setShowSearch(false)}
            formatYear={formatYear}
            isOpen={showSearch}
          />
        </div>

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
        setCurrentYear={setCurrentYear}
        formatYear={formatYear}
        onEventClick={setSelectedEvent}
        isPlaying={isPlaying}
        minYear={MIN_YEAR}
        maxYear={MAX_YEAR}
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
        toggleEraFilter={handleEraFilter}
        selectedSchool={selectedSchool}
        toggleSchoolFilter={handleSchoolFilter}
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
          onNodeSelect={handleInfluenceSelect}
          formatYear={formatYear}
          isMobile={isMobile}
          userId={user?.id}
        />
      )}

    </div>
  );
}

// v2 tokens only (WP6.3) — the UI layer over the untouched engine.
const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: 'var(--bg)',
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

  // Search row - button and field side by side
  searchRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Square instrument buttons (monochrome stroke icons, not emojis)
  controlButton: {
    width: 40,
    height: 40,
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.16s',
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

  // Year readout is CHROME, not engine content — silver Michroma per the Law
  // (Roberto's ruling, 30 Jul 2026; the sole authorized change in the engine).
  // Flat silver, no glow; the black shadow stays for legibility over the globe.
  yearText: {
    fontFamily: 'var(--f-disp)',
    fontSize: 32,
    fontWeight: 400,
    color: 'var(--silver)',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
    letterSpacing: 2,
  },
  
  // Loading (spinner class lives in v2-pages/history-ui.css)
  loadingContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    color: 'var(--ink-hi)',
  },
  loadingText: {
    font: '500 12px/1.4 var(--f-ui)',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: 'var(--ink-hi)',
    marginBottom: 6,
  },
  loadingSubtext: {
    font: '500 10.5px/1.4 var(--f-ui)',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: 'var(--ink-low)',
  },

  // Error — --warn is functional-only (states, never decoration)
  errorContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    color: 'var(--ink-hi)',
  },
  errorText: {
    font: '500 12px/1.4 var(--f-ui)',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: 'var(--warn)',
    marginBottom: 6,
  },
  errorSubtext: {
    font: '400 12px/1.5 var(--f-ui)',
    color: 'var(--ink-mid)',
    marginBottom: 18,
  },
  // Kit secondary button (.btns)
  retryButton: {
    padding: '13px 25px',
    background: 'none',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    font: '500 13px/1 var(--f-ui)',
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
};

export default ConstellationOfIdeas;
