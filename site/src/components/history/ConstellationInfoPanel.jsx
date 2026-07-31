// ============================================================
// CONSTELLATION INFO PANEL - Philosopher/connection detail panel
// ============================================================

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BATTLE_COLORS, TRADITION_COLORS, SCHOOL_COLORS } from '@hooks/useConstellation';
import InlineAdSlot from '../ads/InlineAdSlot.jsx';

// Battle dimension keys for translation lookup
// Format: [positiveKey, negativeKey, descriptionKey]
// Score +1 = positive (left), Score -1 = negative (right)
// Labels always show positive first: "Individual vs Collective" (not swapped based on score)
const BATTLE_KEYS = {
  reason_faith: ['reason', 'faith', 'reason_faith'],
  reality_mysticism: ['reality', 'mysticism', 'reality_mysticism'],
  individual_collective: ['individual', 'collective', 'individual_collective'],
  freedom_coercion: ['freedom', 'coercion', 'freedom_coercion'],
  value_nihilism: ['value', 'nihilism', 'value_nihilism'],
  market_planning: ['market', 'planning', 'market_planning'],
  beauty_chaos: ['beauty', 'chaos', 'beauty_chaos'],
  good_evil: ['good', 'evil', 'good_evil'],
};

// Connection type colors — DATA, not UI (they mirror the tether colors in the
// 3D scene; ruling 30 Jul 2026). They appear only in the data dots, never on chrome.
const CONNECTION_COLORS = {
  influence: '#4CAF50',
  opposition: '#F44336',
  student: '#2196F3',
  founder: '#FFD700',
  synthesis: '#9C27B0',
  contemporary: '#FF9800',
};

// Influence direction colors — DATA (magenta = received, cyan = given), dots only
const INFLUENCE_RECEIVED_COLOR = '#D6158C'; // Magenta - philosophers who influenced this one
const INFLUENCE_GIVEN_COLOR = '#3AAFCF';    // Cyan - philosophers this one influenced

// Helper to get edge type (handles both API format 'type' and seed data format 'relationship_type')
const getEdgeType = (edge) => edge.type || edge.relationship_type || '';

function BattleBar({ battle, score, t }) {
  const [positiveKey, negativeKey] = BATTLE_KEYS[battle] || ['left', 'right'];
  const positiveLabel = t(`constellation.battles.${positiveKey}`);
  const negativeLabel = t(`constellation.battles.${negativeKey}`);
  const color = BATTLE_COLORS[battle] || 'var(--ink-low)'; // battle color = DATA
  
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
    if (val >= 0.9) return t('constellation.intensity.strongly');
    if (val >= 0.7) return t('constellation.intensity.clearly');
    if (val >= 0.5) return t('constellation.intensity.moderately');
    if (val >= 0.3) return t('constellation.intensity.somewhat');
    return t('constellation.intensity.slightly');
  };

  return (
    <div style={styles.battleRow}>
      <div style={styles.battleHeader}>
        {/* Negative label on left, positive on right (matches bar direction).
            Dominant side carries the battle DATA color; the other is chrome. */}
        <span style={{ ...styles.battleLabelLeft, color: !isPositive ? color : 'var(--ink-low)' }}>
          {negativeLabel}
        </span>
        <span style={styles.battleScore}>
          {displayScore > 0 ? '+' : ''}{displayScore}
        </span>
        <span style={{ ...styles.battleLabelRight, color: isPositive ? color : 'var(--ink-low)' }}>
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
            borderRadius: 0,
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
        {getIntensityWord(intensity)} {dominantLabel.toLowerCase()}-{t('constellation.oriented')}
      </div>
    </div>
  );
}

// Helper to get translated philosopher name
const getTranslatedName = (node, t) => {
  if (!node?.id) return node?.name || '';
  const translatedName = t(`constellation.names.${node.id}`, { defaultValue: '' });
  return translatedName || node.name;
};

function NodeDetails({ node, getNodeConnections, findPhilosopher, onNodeSelect, formatYear, t, userId }) {
  const connections = getNodeConnections(node.id);
  const schoolColor = SCHOOL_COLORS[node.school] || TRADITION_COLORS[node.tradition] || 'var(--ink-low)';
  const [imageError, setImageError] = React.useState(false);
  const contentRef = React.useRef(null);
  const translatedName = getTranslatedName(node, t);

  // Reset image error and scroll to top when node changes
  React.useEffect(() => {
    setImageError(false);
    // Scroll to top when philosopher changes
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [node.id]);

  // Scroll to top when constellation video ends
  const handleVideoEnded = React.useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div ref={contentRef} style={styles.content}>
      {/* Ad positioned at top - video only, 6cm × 8cm, centered, 1cm from top */}
      <div style={styles.topAd}>
        <InlineAdSlot
          key={`constellation-panel-${node.id}`}
          userId={userId}
          placement="constellation"
          layout="video"
          refreshKey={`constellation-panel-${node.id}`}
          className="constellation-top-ad"
          onVideoEnded={handleVideoEnded}
        />
      </div>
      
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
              {translatedName.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Name, dates, birthplace, era, school - all compact */}
        <div style={styles.headerText}>
          <h2 style={styles.name}>{translatedName}</h2>
          <div style={styles.dates}>
            {formatYear(node.birth_year)} – {formatYear(node.death_year)}
          </div>
          <div style={styles.birthplace}>
            {node.birth_city && node.birth_city.toLowerCase() !== 'unknown' 
              ? `${node.birth_city}, ${node.birth_country_modern}`
              : node.birth_country_modern}
          </div>
          <div style={styles.era}>{t(`constellation.schools.${node.school_of_thought}`, node.school_of_thought)}</div>
          <div style={{ ...styles.schoolBadge, background: schoolColor }}>
            {t(`constellation.schools.${node.school}`, node.school)}
          </div>
        </div>
      </div>

      {/* Key Ideas */}
      {node.key_ideas && node.key_ideas.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>{t('constellation.keyIdeas')}</div>
          <ul style={styles.ideasList}>
            {node.key_ideas.map((idea, i) => {
              // Try to get translated description, fall back to original English
              const translatedIdea = t(`constellation.descriptions.${node.id}`, { defaultValue: '' });
              return (
                <li key={i} style={styles.ideaItem}>{translatedIdea || idea}</li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Battle Scores */}
      {node.battles && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>{t('constellation.positions')}</div>
          <div style={styles.battles}>
            {Object.entries(node.battles).map(([battle, score]) => (
              <BattleBar key={battle} battle={battle} score={score} t={t} />
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
            {/* Influenced By — label is chrome; magenta lives in the data dots */}
            {influencedBy.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  {t('constellation.influencedBy')} ({influencedBy.length})
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
                        <span style={styles.connectionName}>{getTranslatedName(other, t)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Influenced — label is chrome; cyan lives in the data dots */}
            {influenced.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>
                  {t('constellation.influenced')} ({influenced.length})
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
                        <span style={styles.connectionName}>{getTranslatedName(other, t)}</span>
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
                  {t('constellation.otherConnections')} ({otherConnections.length})
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
                            background: CONNECTION_COLORS[getEdgeType(edge)] || 'var(--ink-low)',
                          }}
                        />
                        <span style={styles.connectionName}>{getTranslatedName(other, t)}</span>
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

function EdgeDetails({ edge, findPhilosopher, onNodeSelect, formatYear, t }) {
  const source = findPhilosopher(edge.source_id);
  const target = findPhilosopher(edge.target_id);
  const edgeType = getEdgeType(edge);
  const typeColor = CONNECTION_COLORS[edgeType] || 'var(--ink-low)';
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
          <span style={styles.edgeNodeName}>{getTranslatedName(source, t)}</span>
          <span style={styles.edgeNodeDates}>{formatYear(source.birth_year)}</span>
        </button>

        <div style={styles.edgeArrow}>
          {edgeType === 'opposition' ? '↔' : '→'}
        </div>

        <button
          style={styles.edgeNodeButton}
          onClick={() => onNodeSelect(target.id)}
        >
          <span style={styles.edgeNodeName}>{getTranslatedName(target, t)}</span>
          <span style={styles.edgeNodeDates}>{formatYear(target.birth_year)}</span>
        </button>
      </div>

      {edge.description && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>{t('constellation.relationship')}</div>
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
  userId,
}) {
  const { t } = useTranslation();
  
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
      
      {/* Close button — kit .mhead .x text glyph */}
      <button style={closeButtonStyle} onClick={onClose} aria-label={t('constellation.close')}>
        ✕
      </button>

      {/* Content */}
      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          getNodeConnections={getNodeConnections}
          findPhilosopher={findPhilosopher}
          onNodeSelect={onNodeSelect}
          formatYear={formatYear}
          t={t}
          userId={userId}
        />
      )}

      {selectedEdge && (
        <EdgeDetails
          edge={selectedEdge}
          findPhilosopher={findPhilosopher}
          onNodeSelect={onNodeSelect}
          formatYear={formatYear}
          t={t}
        />
      )}


    </div>
  );
}

// v2 tokens only (WP6.3) — square-cornered instrument panel over the globe.
const styles = {
  // Desktop: right sidebar - positioned at top right
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 320,
    maxHeight: 'calc(100vh - 180px)',
    background: 'var(--bg)',
    borderRadius: 0,
    border: '1px solid var(--line-strong)',
    overflow: 'hidden',
    zIndex: 150,
    display: 'flex',
    flexDirection: 'column',
  },

  // Mobile: bottom sheet floating ABOVE the timeline controls stack, so the
  // ERAS/SCHOOLS row and the scrubber stay reachable while a node is open.
  containerMobile: {
    position: 'fixed',
    bottom: 138,
    left: 0,
    right: 0,
    height: 'min(62vh, calc(100dvh - 190px))',
    maxHeight: 'calc(100dvh - 190px)',
    background: 'var(--bg)',
    borderRadius: 0,
    border: '1px solid var(--line-strong)',
    overflowX: 'hidden',
    overflowY: 'auto',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    WebkitOverflowScrolling: 'touch',
  },

  // Drag handle indicator for mobile
  dragHandle: {
    width: 40,
    height: 3,
    background: 'var(--line-strong)',
    borderRadius: 0,
    margin: '12px auto 8px',
    flexShrink: 0,
  },

  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    font: '400 14px/1 var(--f-ui)',
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
    background: 'var(--bg)',
    border: '1px solid var(--line-strong)',
    borderRadius: 0,
    color: 'var(--ink-hi)',
    font: '400 16px/1 var(--f-ui)',
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

  topAd: {
    width: 227, // 6cm
    height: 302, // 8cm
    margin: '38px auto 20px', // 1cm from top, centered horizontally
    flexShrink: 0,
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
    borderRadius: 0,
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid var(--line-strong)',
    background: 'var(--bg-inset)',
  },

  portrait: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },

  portraitPlaceholder: {
    width: 64,
    height: 80,
    borderRadius: 0,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--line-strong)',
  },

  portraitInitial: {
    fontFamily: 'var(--f-disp)',
    fontSize: 26,
    fontWeight: 400,
    color: 'var(--ink-inv)',
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  // School chip keeps its DATA color as ground; ink inverts for contrast
  schoolBadge: {
    display: 'inline-block',
    font: '500 9px/1 var(--f-ui)',
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: 'var(--ink-inv)',
    padding: '4px 9px',
    borderRadius: 'var(--radius-pill)',
    marginTop: 4,
  },

  traditionIndicator: {
    width: 4,
    height: 40,
    borderRadius: 0,
    flexShrink: 0,
  },

  name: {
    fontFamily: 'var(--f-disp)',
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: '.08em',
    color: 'var(--ink-hi)',
    margin: 0,
    lineHeight: 1.35,
  },

  dates: {
    font: '400 11px/1.4 var(--f-ui)',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ink-mid)',
    marginTop: 3,
  },

  birthplace: {
    font: '400 10.5px/1.4 var(--f-ui)',
    color: 'var(--ink-low)',
    marginTop: 2,
  },

  era: {
    font: '500 10px/1.4 var(--f-ui)',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-mid)',
    marginTop: 6,
  },

  section: {
    marginBottom: 14,
  },

  sectionLabel: {
    font: '500 10px/1.4 var(--f-ui)',
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    color: 'var(--ink-low)',
    marginBottom: 6,
  },

  location: {
    font: '400 13px/1.5 var(--f-ui)',
    color: 'var(--ink-hi)',
  },

  school: {
    font: '500 10px/1.4 var(--f-ui)',
    letterSpacing: '.14em',
    textTransform: 'uppercase',
    color: 'var(--ink-mid)',
  },

  ideasList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },

  // Reading tier — WHITE (Law §2.1, 30 Jul)
  ideaItem: {
    font: '400 13.5px/1.7 var(--f-prose)',
    color: 'var(--ink-text)',
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
    font: '500 10px/1.4 var(--f-ui)',
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'left',
  },

  battleScore: {
    font: '500 11px/1.4 var(--f-ui)',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ink-hi)',
    minWidth: 28,
    textAlign: 'center',
  },

  battleLabelRight: {
    font: '500 10px/1.4 var(--f-ui)',
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'right',
  },

  battleTrack: {
    width: '100%',
    height: 6,
    background: 'var(--line)',
    borderRadius: 0,
    position: 'relative',
    overflow: 'hidden',
  },

  battleCenterLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 1,
    height: '100%',
    background: 'var(--line-strong)',
    transform: 'translateX(-50%)',
    zIndex: 1,
  },

  battleIntensity: {
    font: '400 9.5px/1.4 var(--f-ui)',
    letterSpacing: '.04em',
    color: 'var(--ink-low)',
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
    background: 'var(--bg-cell)',
    border: '1px solid var(--line)',
    borderRadius: 0,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.16s ease',
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },

  connectionName: {
    font: '400 12.5px/1.4 var(--f-ui)',
    color: 'var(--ink-hi)',
    flex: 1,
  },

  connectionType: {
    font: '500 9px/1.4 var(--f-ui)',
    letterSpacing: '.14em',
    color: 'var(--ink-low)',
    textTransform: 'uppercase',
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
    fontFamily: 'var(--f-disp)',
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: '.12em',
    color: 'var(--ink-hi)',
  },

  edgeTypeDot: {
    width: 10,
    height: 10,
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
    background: 'var(--bg-cell)',
    border: '1px solid var(--line)',
    borderRadius: 0,
    cursor: 'pointer',
    textAlign: 'center',
  },

  edgeNodeName: {
    display: 'block',
    font: '400 13px/1.4 var(--f-ui)',
    color: 'var(--ink-hi)',
  },

  edgeNodeDates: {
    display: 'block',
    font: '400 11px/1.4 var(--f-ui)',
    fontVariantNumeric: 'tabular-nums',
    color: 'var(--ink-low)',
    marginTop: 4,
  },

  edgeArrow: {
    fontSize: 18,
    color: 'var(--ink-low)',
  },

  // Reading tier — WHITE, justified (Law §3, 30 Jul)
  edgeDescription: {
    font: '400 13.5px/1.7 var(--f-prose)',
    color: 'var(--ink-text)',
    textAlign: 'justify',
    margin: 0,
  },
};

export default ConstellationInfoPanel;
