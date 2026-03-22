// ============================================================
// HISTORY GRAPH - 3D Philosophy-History Force Graph
// Interactive visualization of 2,600 years of philosophical thought
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { useHistoryGraph } from '@hooks/useHistoryGraph';

const NODE_COLORS = {
  philosopher: '#D6158C',
  event: '#89CFF0',
  concept: '#F2F2F5',
  era: '#FAFAFB',
  content: '#F4C430',
  battle: '#FF4444',
};

const TRADITION_RING = {
  western: null,
  chinese: '#FFD700',
  indian: '#FF8C00',
  islamic: '#00CC66',
  universal: null,
};

const BATTLE_COLORS = {
  reality_vs_mysticism: '#FF6B35',
  reason_vs_faith: '#FF4444',
  individualism_vs_collectivism: '#D6158C',
  freedom_vs_coercion: '#FF8C00',
  value_creation_vs_nihilism: '#FFD700',
  free_market_vs_planning: '#89CFF0',
  beauty_vs_chaos: '#C084FC',
  good_vs_evil: '#FF0000',
  influenced: 'rgba(214,21,140,0.4)',
  caused: 'rgba(137,207,240,0.4)',
  responded_to: 'rgba(242,242,245,0.4)',
  derived_from: 'rgba(244,196,48,0.4)',
  applied_in: 'rgba(255,255,255,0.25)',
  fulfills_legacy_of: 'rgba(0,255,136,0.25)',
  opposes_legacy_of: 'rgba(255,68,68,0.25)',
  transmitted: 'rgba(137,207,240,0.55)',
  synthesized: 'rgba(192,132,252,0.4)',
  contradicted: 'rgba(255,0,0,0.6)',
};

const BATTLE_LABELS = {
  reality_vs_mysticism: 'Reality vs Mysticism',
  reason_vs_faith: 'Reason vs Faith',
  individualism_vs_collectivism: 'Individual vs Collective',
  freedom_vs_coercion: 'Freedom vs Coercion',
  value_creation_vs_nihilism: 'Value Creation vs Nihilism',
  free_market_vs_planning: 'Free Market vs Planning',
  beauty_vs_chaos: 'Beauty vs Chaos',
  good_vs_evil: 'Good vs Evil',
};

export function HistoryGraph() {
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const rotationRef = useRef(null);
  const idleRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const { graphData, loading, error } = useHistoryGraph();

  const startRotation = useCallback((Graph) => {
    let angle = 0;
    rotationRef.current = setInterval(() => {
      const g = Graph || graphRef.current;
      if (!g) return;
      g.cameraPosition({
        x: 500 * Math.sin(angle),
        z: 500 * Math.cos(angle),
      });
      angle += Math.PI / 900;
    }, 50);
  }, []);

  const stopRotation = useCallback(() => {
    if (rotationRef.current) {
      clearInterval(rotationRef.current);
      rotationRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleRef.current) {
      clearTimeout(idleRef.current);
    }
    idleRef.current = setTimeout(() => {
      if (graphRef.current) startRotation(graphRef.current);
    }, 10000);
  }, [startRotation]);

  const handleNodeClick = useCallback(
    (node) => {
      setSelected(node);
      setSelectedType('node');
      stopRotation();
      resetIdleTimer();
    },
    [stopRotation, resetIdleTimer]
  );

  const handleLinkClick = useCallback(
    (link) => {
      setSelected(link);
      setSelectedType('edge');
 stopRotation();
      resetIdleTimer();
    },
    [stopRotation, resetIdleTimer]
  );

  const handleBackgroundClick = useCallback(() => {
    setSelected(null);
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    // Dynamically import 3d-force-graph (ES module)
    import('3d-force-graph')
      .then(({ default: ForceGraph3D }) => {
        if (graphRef.current) {
          graphRef.current._destructor?.();
        }

        const Graph = ForceGraph3D()(containerRef.current)
          .graphData(graphData)
          .backgroundColor('#222222')
          .nodeLabel((node) => `${node.label} (${node.years || node.era || ''})`)
          .nodeColor((node) => NODE_COLORS[node.type] || '#FFFFFF')
          .nodeVal((node) => {
            if (node.type === 'era') return 12;
            if (node.type === 'battle') return 10;
            if (node.weight === 'maximum') return 8;
            if (node.weight === 'high') return 6;
            if (node.weight === 'minor') return 2;
            return 4;
          })
          .nodeOpacity(0.9)
          .linkColor((link) =>
            link.battle_dimension
              ? BATTLE_COLORS[link.battle_dimension]
              : BATTLE_COLORS[link.relation] || 'rgba(255,255,255,0.3)'
          )
          .linkWidth((link) => (link.weight || 0.5) * 2)
          .linkOpacity(0.7)
          .linkDirectionalArrowLength(3)
          .linkDirectionalArrowRelPos(1)
          .onNodeClick(handleNodeClick)
          .onLinkClick(handleLinkClick)
          .onBackgroundClick(handleBackgroundClick);

        graphRef.current = Graph;
        startRotation(Graph);
      })
      .catch((err) => {
        console.error('[HistoryGraph] Failed to load 3d-force-graph:', err);
      });

    return () => {
      stopRotation();
      if (idleRef.current) clearTimeout(idleRef.current);
      graphRef.current?._destructor?.();
    };
  }, [graphData, startRotation, stopRotation, handleNodeClick, handleLinkClick, handleBackgroundClick]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {loading && <LoadingState />}
      {error && <ErrorState />}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend toggle */}
      <button
        onClick={() => setShowLegend((v) => !v)}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(34,34,34,0.9)',
          border: '1px solid #D6158C',
          color: '#F2F2F5',
          padding: '6px 14px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 12,
          letterSpacing: 1,
        }}
      >
        {showLegend ? 'HIDE LEGEND' : 'SHOW LEGEND'}
      </button>

      {showLegend && <Legend />}
      {selected && <InfoPanel item={selected} type={selectedType} onClose={() => setSelected(null)} />}
    </div>
  );
}

function InfoPanel({ item, type, onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 320,
        maxHeight: '80vh',
        overflowY: 'auto',
        background: 'rgba(22,22,22,0.97)',
        border: `1px solid ${type === 'node' ? '#D6158C' : '#89CFF0'}`,
        borderRadius: 8,
        padding: 20,
        color: '#F2F2F5',
        zIndex: 100,
      }}
    >
      <button
        onClick={onClose}
        style={{
          float: 'right',
          background: 'none',
          border: 'none',
          color: '#F2F2F5',
          cursor: 'pointer',
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        x
      </button>

      {type === 'node' ? (
        <>
          <div
            style={{
              fontSize: 10,
              color: '#D6158C',
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            {item.type} · {item.tradition}
          </div>
          <h3 style={{ margin: '0 0 4px', color: '#FAFAFB', fontSize: 18 }}>{item.label}</h3>
          {item.years && <div style={{ fontSize: 12, color: '#89CFF0', marginBottom: 12 }}>{item.years}</div>}
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: '#F2F2F5' }}>{item.description}</p>
        </>
      ) : (
        <>
          {item.battle_dimension && (
            <div
              style={{
                fontSize: 10,
                color: BATTLE_COLORS[item.battle_dimension] || '#89CFF0',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4,
              }}
            >
              {BATTLE_LABELS[item.battle_dimension]}
            </div>
          )}
          <div
            style={{
              fontSize: 10,
              color: '#89CFF0',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            {item.relation?.replace(/_/g, ' ')}
          </div>
          <h3 style={{ margin: '0 0 12px', color: '#FAFAFB', fontSize: 14, lineHeight: 1.4 }}>
            {item.source?.label || item.source} → {item.target?.label || item.target}
          </h3>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: '#F2F2F5' }}>{item.label}</p>
        </>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 20,
        background: 'rgba(22,22,22,0.97)',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 16,
        color: '#F2F2F5',
        zIndex: 100,
        width: 280,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#D6158C',
          letterSpacing: 2,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}
      >
        Legend
      </div>

      <div style={{ fontSize: 11, color: '#89CFF0', marginBottom: 6 }}>NODES</div>
      {Object.entries(NODE_COLORS).map(([type, color]) => (
        <div key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: color,
              marginRight: 8,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
        </div>
      ))}

      <div style={{ fontSize: 11, color: '#89CFF0', marginTop: 12, marginBottom: 6 }}>THE 8 BATTLES</div>
      {Object.entries(BATTLE_LABELS).map(([key, label]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: 24,
              height: 2,
              background: BATTLE_COLORS[key],
              marginRight: 8,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11 }}>{label}</span>
        </div>
      ))}

      <div style={{ fontSize: 11, color: '#89CFF0', marginTop: 12, marginBottom: 6 }}>TRADITIONS</div>
      {[
        ['Chinese', '#FFD700'],
        ['Indian', '#FF8C00'],
        ['Islamic', '#00CC66'],
        ['Western', '#888'],
      ].map(([t, c]) => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              border: `2px solid ${c}`,
              marginRight: 8,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12 }}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F2F2F5',
        zIndex: 10,
        background: '#222222',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#9678;</div>
        <div style={{ fontSize: 14, color: '#89CFF0', letterSpacing: 2 }}>MAPPING 2,600 YEARS OF IDEAS</div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F2F2F5',
        zIndex: 10,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#FF4444' }}>Graph temporarily unavailable</div>
      </div>
    </div>
  );
}

export default HistoryGraph;
