// ============================================================
// CONSTELLATION INFO PANEL - Philosopher/connection detail panel
// ============================================================

import React from 'react';
import { BATTLE_COLORS, TRADITION_COLORS } from '@hooks/useConstellation';

// Battle dimension labels
const BATTLE_LABELS = {
  reason_faith: ['Reason', 'Faith'],
  reality_mysticism: ['Reality', 'Mysticism'],
  individual_collective: ['Individual', 'Collective'],
  freedom_coercion: ['Freedom', 'Coercion'],
  value_nihilism: ['Value', 'Nihilism'],
  market_planning: ['Market', 'Planning'],
  beauty_chaos: ['Beauty', 'Chaos'],
  good_evil: ['Good', 'Evil'],
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

function BattleBar({ battle, score }) {
  const [leftLabel, rightLabel] = BATTLE_LABELS[battle] || ['Left', 'Right'];
  const color = BATTLE_COLORS[battle] || '#888';
  // Score: -1 to +1, center is 0
  const percent = ((score + 1) / 2) * 100;

  return (
    <div style={styles.battleRow}>
      <span style={styles.battleLabel}>{leftLabel}</span>
      <div style={styles.battleTrack}>
        <div style={styles.battleCenter} />
        <div
          style={{
            ...styles.battleFill,
            left: score < 0 ? `${percent}%` : '50%',
            width: `${Math.abs(score) * 50}%`,
            background: color,
          }}
        />
        <div
          style={{
            ...styles.battleMarker,
            left: `${percent}%`,
            background: color,
          }}
        />
      </div>
      <span style={styles.battleLabel}>{rightLabel}</span>
    </div>
  );
}

function NodeDetails({ node, getNodeConnections, findPhilosopher, onNodeSelect, formatYear }) {
  const connections = getNodeConnections(node.id);
  const traditionColor = TRADITION_COLORS[node.tradition] || '#fff';

  return (
    <div style={styles.content}>
      {/* Header */}
      <div style={styles.header}>
        <div
          style={{
            ...styles.traditionIndicator,
            background: traditionColor,
          }}
        />
        <div>
          <h2 style={styles.name}>{node.name}</h2>
          <div style={styles.dates}>
            {formatYear(node.birth_year)} – {formatYear(node.death_year)}
          </div>
        </div>
      </div>

      {/* Location */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Birthplace</div>
        <div style={styles.location}>
          {node.birth_city}, {node.birth_country_modern}
        </div>
        {node.residence_city && (
          <>
            <div style={{ ...styles.sectionLabel, marginTop: '8px' }}>Residence</div>
            <div style={styles.location}>
              {node.residence_city}, {node.residence_country}
            </div>
          </>
        )}
      </div>

      {/* School */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>School of Thought</div>
        <div style={styles.school}>{node.school_of_thought}</div>
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

      {/* Connections */}
      {connections.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            Connections ({connections.length})
          </div>
          <div style={styles.connectionsList}>
            {connections.map((edge, i) => {
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
                      background: CONNECTION_COLORS[edge.type] || '#888',
                    }}
                  />
                  <span style={styles.connectionName}>{other.name}</span>
                  <span style={styles.connectionType}>{edge.type}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EdgeDetails({ edge, findPhilosopher, onNodeSelect, formatYear }) {
  const source = findPhilosopher(edge.source_id);
  const target = findPhilosopher(edge.target_id);
  const typeColor = CONNECTION_COLORS[edge.type] || '#888';

  if (!source || !target) return null;

  return (
    <div style={styles.content}>
      <div style={styles.edgeHeader}>
        <div style={styles.edgeType}>
          <span
            style={{
              ...styles.edgeTypeDot,
              background: typeColor,
            }}
          />
          {edge.type.charAt(0).toUpperCase() + edge.type.slice(1)}
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
          {edge.type === 'opposition' ? '↔' : '→'}
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
}) {
  return (
    <div style={styles.container}>
      {/* Close button */}
      <button style={styles.closeButton} onClick={onClose} aria-label="Close">
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
  container: {
    position: 'absolute',
    top: 70,
    right: 16,
    width: 320,
    maxHeight: 'calc(100vh - 200px)',
    background: 'rgba(15, 15, 25, 0.95)',
    borderRadius: 12,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    overflow: 'hidden',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
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

  content: {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  },

  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingRight: 32,
  },

  traditionIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    flexShrink: 0,
  },

  name: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F2F2F5',
    margin: 0,
    lineHeight: 1.2,
  },

  dates: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },

  section: {
    marginBottom: 16,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
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
    gap: 8,
  },

  battleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  battleLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    width: 55,
    textAlign: 'center',
  },

  battleTrack: {
    flex: 1,
    height: 6,
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    position: 'relative',
  },

  battleCenter: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    background: 'rgba(255, 255, 255, 0.3)',
  },

  battleFill: {
    position: 'absolute',
    top: 0,
    height: '100%',
    borderRadius: 3,
    opacity: 0.6,
  },

  battleMarker: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 10,
    height: 10,
    borderRadius: '50%',
  },

  connectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  connectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  connectionName: {
    fontSize: 13,
    color: '#F2F2F5',
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
