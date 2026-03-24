// ============================================================
// CONSTELLATION OF IDEAS - Main Container Component
// 3D visualization of 2,600 years of philosophical thought
// ============================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useConstellation, BATTLE_COLORS, TRADITION_COLORS } from '@hooks/useConstellation';
import { ConstellationScene } from './ConstellationScene.jsx';
import { TimelineControls } from './TimelineControls.jsx';
import { ConstellationInfoPanel } from './ConstellationInfoPanel.jsx';
import { ConstellationSearch } from './ConstellationSearch.jsx';

// Loading state component
function LoadingState() {
  return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner} />
      <div style={styles.loadingText}>Loading the Constellation...</div>
      <div style={styles.loadingSubtext}>2,600 years of human thought</div>
    </div>
  );
}

// Error state component
function ErrorState({ error, onRetry }) {
  return (
    <div style={styles.errorContainer}>
      <div style={styles.errorIcon}>⚠</div>
      <div style={styles.errorText}>Failed to load constellation data</div>
      <div style={styles.errorSubtext}>{error?.message || 'Unknown error'}</div>
      <button style={styles.retryButton} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export function ConstellationOfIdeas() {
  const sceneRef = useRef(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  // Detect mobile on resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
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
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    hoveredNode,
    setHoveredNode,
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
    setShowSearch(false);
    // Jump timeline to show this philosopher
    if (node.birth_year > currentYear) {
      setCurrentYear(node.birth_year + 50);
    }
    // Camera will fly to node via scene ref
    if (sceneRef.current?.flyToNode) {
      sceneRef.current.flyToNode(node);
    }
  }, [currentYear, setCurrentYear, setSelectedNode]);

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
    return <LoadingState />;
  }

  // Render error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  const visibleNodes = getVisibleNodes();
  const visibleEdges = getVisibleEdges();

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

      {/* Year Display */}
      <div style={styles.yearDisplay}>
        <span style={{ ...styles.yearText, fontSize: isMobile ? 24 : 32 }}>{formatYear(currentYear)}</span>
        <span style={styles.nodeCount}>{visibleNodes.length} philosophers</span>
      </div>

      {/* Search Button */}
      <button
        style={styles.searchButton}
        onClick={() => setShowSearch(true)}
        aria-label="Search philosophers"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>

      {/* Legend - positioned below year on mobile */}
      <div style={{ 
        ...styles.legend, 
        top: isMobile ? 75 : 16,
        padding: isMobile ? '8px 12px' : '12px 16px',
      }}>
        <div style={styles.legendTitle}>Traditions</div>
        {Object.entries(TRADITION_COLORS).map(([tradition, color]) => (
          <div key={tradition} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: color }} />
            <span style={styles.legendLabel}>{tradition.charAt(0).toUpperCase() + tradition.slice(1)}</span>
          </div>
        ))}
      </div>

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
          }}
          onNodeSelect={handleNodeSelect}
          formatYear={formatYear}
        />
      )}

      {/* Search Panel */}
      {showSearch && (
        <ConstellationSearch
          searchPhilosopher={searchPhilosopher}
          onSelect={handleSearchSelect}
          onClose={() => setShowSearch(false)}
          formatYear={formatYear}
        />
      )}

      {/* Hover tooltip */}
      {hoveredNode && !selectedNode && (
        <div style={styles.tooltip}>
          <div style={styles.tooltipName}>{hoveredNode.name}</div>
          <div style={styles.tooltipDates}>
            {formatYear(hoveredNode.birth_year)} – {formatYear(hoveredNode.death_year)}
          </div>
          <div style={styles.tooltipSchool}>{hoveredNode.school_of_thought}</div>
        </div>
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

  // Year display - positioned to avoid legend on mobile
  yearDisplay: {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    zIndex: 101, // Above legend
    pointerEvents: 'none',
  },
  yearText: {
    display: 'block',
    fontFamily: "'Orbitron', monospace",
    fontSize: 32, // Overridden inline for mobile
    fontWeight: 700,
    color: '#F2F2F5',
    textShadow: '0 2px 20px rgba(214, 21, 140, 0.5), 0 0 10px rgba(0, 0, 0, 0.8)',
  },
  nodeCount: {
    display: 'block',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },

  // Search button
  searchButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    background: 'rgba(30, 30, 40, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    color: '#F2F2F5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
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

  // Tooltip
  tooltip: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(20, 20, 30, 0.95)',
    borderRadius: 8,
    padding: '12px 16px',
    textAlign: 'center',
    zIndex: 100,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
  },
  tooltipName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F2F2F5',
  },
  tooltipDates: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  tooltipSchool: {
    fontSize: 11,
    color: '#D6158C',
    marginTop: 2,
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
