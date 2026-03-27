// ============================================================
// CONSTELLATION INFO PANEL - Philosopher/connection detail panel
// ============================================================

import React from 'react';
import { BATTLE_COLORS, TRADITION_COLORS, SCHOOL_COLORS } from '@hooks/useConstellation';

// Battle dimension labels with descriptions
// Format: [positiveLabel, negativeLabel, description]
// Score +1 = positive (left), Score -1 = negative (right)
// Labels always show positive first: "Individual vs Collective" (not swapped based on score)
const BATTLE_LABELS = {
  reason_faith: ['Reason', 'Faith', 'Source of knowledge'],
  reality_mysticism: ['Reality', 'Mysticism', 'Nature of existence'],
  individual_collective: ['Individual', 'Collective', 'Moral focus'],
  freedom_coercion: ['Freedom', 'Coercion', 'Political stance'],
  value_nihilism: ['Value', 'Nihilism', 'Meaning & purpose'],
  market_planning: ['Market', 'Planning', 'Economic system'],
  beauty_chaos: ['Beauty', 'Chaos', 'Aesthetic view'],
  good_evil: ['Good', 'Evil', 'Moral realism'],
};

// Connection type labels and colors
const CONNECTION_COLORS = {
  influence: '#4CAF50',
  opposition: '#F44336',
  student: '#2196F3',
  founder: '#FFD700',
  synthesis: '#9C27B0',
  contemporary: '#FF9800',
};

// Influence direction colors
const INFLUENCE_RECEIVED_COLOR = '#D6158C'; // Magenta - philosophers who influenced this one
const INFLUENCE_GIVEN_COLOR = '#3AAFCF';    // Cyan - philosophers this one influenced

// Helper to get edge type (handles both API format 'type' and seed data format 'relationship_type')
const getEdgeType = (edge) => edge.type || edge.relationship_type || '';

function BattleBar({ battle, score }) {
  const [positiveLabel, negativeLabel, description] = BATTLE_LABELS[battle] || ['Left', 'Right', ''];
  const color = BATTLE_COLORS[battle] || '#888';
  
  // Score: -1 to +1 (normalized from -10 to +10)
  // +1 = fully positive (Reason, Reality, Individual, etc.) - extends RIGHT
  // -1 = fully negative (Faith, Mysticism, Collective, etc.) - extends LEFT
  const isPositive = score >= 0;
  const intensity = Math.abs(score);
  
  // Convert to display score (-10 to +10)
  const displayScore = Math.round(score * 10);
  
  // Calculate bar position: center is at 50%
  // Positive scores: fill from 50% to (50% + intensity*50%)
  // Negative scores: fill from (50% - intensity*50%) to 50%
  const fillWidth = intensity * 50; // max 50% on each side
  
  // Determine which label is dominant (for description)
  const dominantLabel = isPositive ? positiveLabel : negativeLabel;
  
  // Intensity description
  const getIntensityWord = (val) => {
    if (val >= 0.9) return 'Strongly';
    if (val >= 0.7) return 'Clearly';
    if (val >= 0.5) return 'Moderately';
    if (val >= 0.3) return 'Somewhat';
    return 'Slightly';
  };

  return (
    <div style={styles.battleRow}>
      <div style={styles.battleHeader}>
        {/* Negative label on left, positive on right (matches bar direction) */}
        <span style={{ ...styles.battleLabelLeft, color: !isPositive ? color : 'rgba(255, 255, 255, 0.5)' }}>
          {negativeLabel}
        </span>
        <span style={styles.battleScore}>
          {displayScore > 0 ? '+' : ''}{displayScore}
        </span>
        <span style={{ ...styles.battleLabelRight, color: isPositive ? color : 'rgba(255, 255, 255, 0.5)' }}>
          {positiveLabel}
        </span>
      </div>
      <div style={styles.battleTrack}>
        {/* Center line marker */}
        <div style={styles.battleCenterLine} />
        {/* Fill bar - starts from center */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            borderRadius: 3,
            background: color,
            // For positive: start at center (50%), extend right
            // For negative: end at center (50%), extend left
            ...(isPositive
              ? { left: '50%', width: `${fillWidth}%` }
              : { left: `${50 - fillWidth}%`, width: `${fillWidth}%` }
            ),
          }}
        />
      </div>
      <div style={styles.battleIntensity}>
        {getIntensityWord(intensity)} {dominantLabel.toLowerCase()}-oriented
      </div>
    </div>
  );
}

function NodeDetails({ node, getNodeConnections, findPhilosopher, onNodeSelect, formatYear }) {
  const connections = getNodeConnections(node.id);
  const schoolColor = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || '#fff';
  const [imageError, setImageError] = React.useState(false);
  const contentRef = React.useRef(null);

  // Reset image error and scroll to top when node changes
  React.useEffect(() => {
    setImageError(false);
    // Scroll to top when philosopher changes
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [node.id]);

  return (
    <div ref={contentRef} style={styles.content}>
      {/* Portrait + Header (compact layout) */}
      <div style={styles.headerWithPortrait}>
        {/* Portrait */}
        {node.portrait && !imageError ? (
          <div style={styles.portraitContainer}>
            <img
              src={node.portrait}
              alt={node.name}
              style={styles.portrait}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div style={{ ...styles.portraitPlaceholder, background: schoolColor }}>
            <span style={styles.portraitInitial}>
              {node.name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Name, dates, birthplace, era, school - all compact */}
        <div style={styles.headerText}>
          <h2 style={styles.name}>{node.name}</h2>
          <div style={styles.dates}>
            {formatYear(node.birth_year)} – {formatYear(node.death_year)}
          </div>
          <div style={styles.birthplace}>
            {node.birth_city && node.birth_city.toLowerCase() !== 'unknown' 
              ? `${node.birth_city}, ${node.birth_country_modern}`
              : node.birth_country_modern}
          </div>
          <div style={styles.era}>{node.school_of_thought}</div>
          <div style={{ ...styles.schoolBadge, background: schoolColor }}>
            {node.school}
          </div>
        </div>
      </div>

      {/* Key Ideas */}
      {node.key_ideas && node.key_ideas.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Key Ideas</div>
          <ul style={styles.ideasList}>
            {node.key_ideas.map((idea, i) => (
              <li key={i} style={styles.ideaItem}>{idea}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Battle Scores */}
      {node.battles && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Philosophical Positions</div>
          <div style={styles.battles}>
            {Object.entries(node.battles).map(([battle, score]) => (
              <BattleBar key={battle} battle={battle} score={score} />
            ))}
          </div>
        </div>
      )}

      {/* Connections - Split by influence direction */}
      {connections.length > 0 && (() => {
        // Separate influences received vs given
        const influencedBy = connections.filter(
          edge => (getEdgeType(edge) === 'influence' || getEdgeType(edge) === 'influenced') && edge.target_id === node.id
        );
        const influenced = connections.filter(
          edge => (getEdgeType(edge) === 'influence' || getEdgeType(edge) === 'influenced') && edge.source_id === node.id
        );
        const otherConnections = connections.filter(
          edge => getEdgeType(edge) !== 'influence' && getEdgeType(edge) !== 'influenced'
        );

        return (
          <>
            {/* Influenced By - Magenta */}
            {influencedBy.length > 0 && (
              <div style={styles.section}>
                <div style={{ ...styles.sectionLabel, color: INFLUENCE_RECEIVED_COLOR }}>
                  Influenced By ({influencedBy.length})
                </div>
                <div style={styles.connectionsList}>
                  {influencedBy.map((edge, i) => {
                    const other = findPhilosopher(edge.source_id);
                    if (!other) return null;
                    return (
                      <button
                        key={i}
                        style={styles.connectionItem}
                        onClick={() => onNodeSelect(edge.source_id)}
                      >
                        <span style={{ ...styles.connectionDot, background: INFLUENCE_RECEIVED_COLOR }} />
                        <span style={styles.connectionName}>{other.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Influenced - Cyan */}
            {influenced.length > 0 && (
              <div style={styles.section}>
                <div style={{ ...styles.sectionLabel, color: INFLUENCE_GIVEN_COLOR }}>
                  Influenced ({influenced.length})
                </div>
                <div style={styles.connectionsList}>
                  {influenced.map((edge, i) => {
                    const other = findPhilosopher(edge.target_id);
                    if (!other) return null;
                    return (
                      <button
                        key={i}
                        style={styles.connectionItem}
                        onClick={() => onNodeSelect(edge.target_id)}
                      >
                        <span style={{ ...styles.connectionDot, background: INFLUENCE_GIVEN_COLOR }} />
                        <span style={styles.connectionName}>{other.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Other Connections */}
            {otherConnections.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  Other Connections ({otherConnections.length})
                </div>
                <div style={styles.connectionsList}>
                  {otherConnections.map((edge, i) => {
                    const otherId = edge.source_id === node.id ? edge.target_id : edge.source_id;
                    const other = findPhilosopher(otherId);
                    if (!other) return null;
                    return (
                      <button
                        key={i}
                        style={styles.connectionItem}
                        onClick={() => onNodeSelect(otherId)}
                      >
                        <span
                          style={{
                            ...styles.connectionDot,
                            background: CONNECTION_COLORS[getEdgeType(edge)] || '#888',
                          }}
                        />
                        <span style={styles.connectionName}>{other.name}</span>
                        <span style={styles.connectionType}>{getEdgeType(edge)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

function EdgeDetails({ edge, findPhilosopher, onNodeSelect, formatYear }) {
  const source = findPhilosopher(edge.source_id);
  const target = findPhilosopher(edge.target_id);
  const edgeType = getEdgeType(edge);
  const typeColor = CONNECTION_COLORS[edgeType] || '#888';
  const contentRef = React.useRef(null);

  // Scroll to top when edge changes
  React.useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [edge.source_id, edge.target_id]);

  if (!source || !target) return null;

  return (
    <div ref={contentRef} style={styles.content}>
      <div style={styles.edgeHeader}>
        <div style={styles.edgeType}>
          <span
            style={{
              ...styles.edgeTypeDot,
              background: typeColor,
            }}
          />
          {edgeType.charAt(0).toUpperCase() + edgeType.slice(1)}
        </div>
      </div>

      <div style={styles.edgeNodes}>
        <button
          style={styles.edgeNodeButton}
          onClick={() => onNodeSelect(source.id)}
        >
          <span style={styles.edgeNodeName}>{source.name}</span>
          <span style={styles.edgeNodeDates}>{formatYear(source.birth_year)}</span>
        </button>

        <div style={styles.edgeArrow}>
          {edgeType === 'opposition' ? '↔' : '→'}
        </div>

        <button
          style={styles.edgeNodeButton}
          onClick={() => onNodeSelect(target.id)}
        >
          <span style={styles.edgeNodeName}>{target.name}</span>
          <span style={styles.edgeNodeDates}>{formatYear(target.birth_year)}</span>
        </button>
      </div>

      {edge.description && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Relationship</div>
          <p style={styles.edgeDescription}>{edge.description}</p>
        </div>
      )}
    </div>
  );
}

export function ConstellationInfoPanel({
  selectedNode,
  selectedEdge,
  allNodes,
  getNodeConnections,
  findPhilosopher,
  onClose,
  onNodeSelect,
  formatYear,
  isMobile = false,
}) {
  // Mobile: bottom sheet covering 80% of screen
  // Desktop: right sidebar
  const containerStyle = isMobile
    ? styles.containerMobile
    : styles.container;

  const closeButtonStyle = isMobile
    ? styles.closeButtonMobile
    : styles.closeButton;

  return (
    <div style={containerStyle}>
      {/* Drag handle for mobile */}
      {isMobile && <div style={styles.dragHandle} />}
      
      {/* Close button */}
      <button style={closeButtonStyle} onClick={onClose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Content */}
      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          getNodeConnections={getNodeConnections}
          findPhilosopher={findPhilosopher}
          onNodeSelect={onNodeSelect}
          formatYear={formatYear}
        />
      )}

      {selectedEdge && (
        <EdgeDetails
          edge={selectedEdge}
          findPhilosopher={findPhilosopher}
          onNodeSelect={onNodeSelect}
          formatYear={formatYear}
        />
      )}
    </div>
  );
}

const styles = {
  // Desktop: right sidebar - overlaps controls at bottom
  container: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 320,
    maxHeight: 'calc(100vh - 90px)',
    background: 'rgba(15, 15, 25, 0.95)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
  },

  // Mobile: bottom sheet covering 80% of screen
  containerMobile: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80vh',
    maxHeight: '80vh',
    background: 'rgba(15, 15, 25, 0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderBottom: 'none',
    backdropFilter: 'blur(16px)',
    overflowX: 'hidden',
    overflowY: 'auto',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5), 0 -2px 8px rgba(0, 0, 0, 0.3)',
    WebkitOverflowScrolling: 'touch',
  },

  // Drag handle indicator for mobile
  dragHandle: {
    width: 40,
    height: 4,
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    margin: '12px auto 8px',
    flexShrink: 0,
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    borderRadius: 6,
    color: '#F2F2F5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  // Mobile close button - larger tap target
  closeButtonMobile: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 40,
    height: 40,
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    borderRadius: 20,
    color: '#F2F2F5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  content: {
    padding: '16px 16px 32px 16px',
    overflowY: 'auto',
    flex: 1,
    WebkitOverflowScrolling: 'touch',
  },

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingRight: 32,
  },

  headerWithPortrait: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    paddingRight: 32,
  },

  portraitContainer: {
    width: 64,
    height: 80,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    border: '2px solid rgba(255, 255, 255, 0.15)',
    background: 'rgba(0, 0, 0, 0.3)',
  },

  portrait: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  portraitPlaceholder: {
    width: 64,
    height: 80,
    borderRadius: 6,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid rgba(255, 255, 255, 0.15)',
  },

  portraitInitial: {
    fontSize: 28,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  schoolBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    color: '#000',
    padding: '3px 8px',
    borderRadius: 4,
    marginTop: 4,
  },

  traditionIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    flexShrink: 0,
  },

  name: {
    fontSize: 17,
    fontWeight: 700,
    color: '#F2F2F5',
    margin: 0,
    lineHeight: 1.2,
  },

  dates: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
  },

  birthplace: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },

  era: {
    fontSize: 12,
    color: '#D6158C',
    fontWeight: 600,
    marginTop: 6,
  },

  section: {
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },

  location: {
    fontSize: 13,
    color: '#F2F2F5',
  },

  school: {
    fontSize: 14,
    color: '#D6158C',
    fontWeight: 600,
  },

  ideasList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },

  ideaItem: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    paddingLeft: 12,
    position: 'relative',
  },

  battles: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  battleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  battleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },

  battleLabelLeft: {
    fontSize: 11,
    fontWeight: 600,
    flex: 1,
    textAlign: 'left',
  },

  battleScore: {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.9)',
    minWidth: 28,
    textAlign: 'center',
  },

  battleLabelRight: {
    fontSize: 11,
    fontWeight: 600,
    flex: 1,
    textAlign: 'right',
  },

  battleTrack: {
    width: '100%',
    height: 8,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },

  battleCenterLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    background: 'rgba(255, 255, 255, 0.3)',
    transform: 'translateX(-50%)',
    zIndex: 1,
  },

  battleIntensity: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  connectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  connectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },

  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    boxShadow: '0 0 6px currentColor',
  },

  connectionName: {
    fontSize: 13,
    color: '#FFFFFF',
    flex: 1,
  },

  connectionType: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'capitalize',
  },

  // Edge details
  edgeHeader: {
    marginBottom: 16,
    paddingRight: 32,
  },

  edgeType: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    color: '#F2F2F5',
  },

  edgeTypeDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },

  edgeNodes: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  edgeNodeButton: {
    flex: 1,
    padding: 12,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'center',
  },

  edgeNodeName: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#F2F2F5',
  },

  edgeNodeDates: {
    display: 'block',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },

  edgeArrow: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.3)',
  },

  edgeDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 1.5,
    margin: 0,
  },
};

export default ConstellationInfoPanel;
