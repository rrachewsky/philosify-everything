// ============================================================
// GLOBE OF IDEAS - Geographic Visualization of Philosophy Through Time
// 3D interactive globe showing 2,600 years of philosophical thought
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useHistoryGraph } from '@hooks/useHistoryGraph';

// Year range
const MIN_YEAR = -600;
const MAX_YEAR = 2026;
const DEFAULT_PLAYBACK_SPEED = 50; // years per second during auto-play

const BATTLE_COLORS = {
  reality_vs_mysticism: '#FF6B35',
  reason_vs_faith: '#FF4444',
  individualism_vs_collectivism: '#D6158C',
  freedom_vs_coercion: '#FF8C00',
  value_creation_vs_nihilism: '#FFD700',
  free_market_vs_planning: '#89CFF0',
  beauty_vs_chaos: '#C084FC',
  good_vs_evil: '#FF0000',
  influenced: '#D6158C',
  caused: '#89CFF0',
  responded_to: '#F2F2F5',
  derived_from: '#F4C430',
  applied_in: '#FFFFFF',
  fulfills_legacy_of: '#00FF88',
  opposes_legacy_of: '#FF4444',
  transmitted: '#89CFF0',
  synthesized: '#C084FC',
  contradicted: '#FF0000',
};

const NODE_COLORS = {
  philosopher: '#D6158C',
  event: '#89CFF0',
  concept: '#F2F2F5',
  era: '#FAFAFB',
  content: '#F4C430',
  battle: '#FF4444',
};

const NODE_SIZES = {
  maximum: 1.2,
  high: 0.8,
  standard: 0.5,
  minor: 0.3,
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

const ERA_JUMPS = [
  { year: -550, label: 'Axial Age', emoji: '🌅' },
  { year: -399, label: 'Socrates', emoji: '⚖️' },
  { year: 900, label: 'Islamic Golden Age', emoji: '📚' },
  { year: 1440, label: 'Printing Press', emoji: '📖' },
  { year: 1789, label: 'French Rev.', emoji: '🏴' },
  { year: 1848, label: '1848', emoji: '✊' },
  { year: 1917, label: 'Russian Rev.', emoji: '⭐' },
  { year: 1945, label: 'Post-WWII', emoji: '🕊️' },
  { year: 1989, label: 'Berlin Wall', emoji: '🧱' },
  { year: 2022, label: 'AI Revolution', emoji: '🤖' },
];

export function GlobeOfIdeas() {
  const containerRef = useRef(null);
  const globeRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const playRef = useRef(null);
  const cleanupRef = useRef(null);

  const [currentYear, setCurrentYear] = useState(MIN_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(DEFAULT_PLAYBACK_SPEED);
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [initError, setInitError] = useState(null);

  const { graphData, loading, error: fetchError } = useHistoryGraph();

  // Show error state
  const displayError = initError || fetchError;

  // Filter nodes/links visible at current year
  const getVisibleData = useCallback(
    (year, data) => {
      if (!data) return { nodes: [], links: [] };

      const visibleNodes = data.nodes.filter((n) => {
        const nodeYear = n.year_numeric || MIN_YEAR;
        return nodeYear <= year;
      });

      const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

      const visibleLinks = data.links.filter((l) => {
        const srcId = l.source?.id || l.source;
        const tgtId = l.target?.id || l.target;
        const src = data.nodes.find((n) => n.id === srcId);
        const tgt = data.nodes.find((n) => n.id === tgtId);
        if (!src || !tgt) return false;
        const linkYear = Math.max(src.year_numeric || MIN_YEAR, tgt.year_numeric || MIN_YEAR);
        return linkYear <= year && visibleNodeIds.has(src.id) && visibleNodeIds.has(tgt.id);
      });

      return { nodes: visibleNodes, links: visibleLinks };
    },
    []
  );

  // Initialize Three.js globe
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    let isMounted = true;
    cleanupRef.current = null;

    import('three-globe')
      .then(({ default: ThreeGlobe }) => {
        // Check if component is still mounted
        if (!isMounted || !containerRef.current) return;

        try {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;

          // Scene
          const scene = new THREE.Scene();
          sceneRef.current = scene;

          // Camera
          const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
          camera.position.z = 250;
          cameraRef.current = camera;

          // Renderer
          const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
          renderer.setSize(width, height);
          renderer.setClearColor(0x222222, 1);
          containerRef.current.appendChild(renderer.domElement);
          rendererRef.current = renderer;

          // Lighting
          scene.add(new THREE.AmbientLight(0xffffff, 0.6));
          const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
          dirLight.position.set(1, 1, 1);
          scene.add(dirLight);

          // Globe
          const globe = new ThreeGlobe()
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
            .atmosphereColor('#89CFF0')
            .atmosphereAltitude(0.15);

          scene.add(globe);
          globeRef.current = globe;

          // Slow auto-rotation
          let rotAngle = 0;

          // Animation loop
          const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            rotAngle += 0.0008;
            globe.rotation.y = rotAngle;
            renderer.render(scene, camera);
          };
          animate();

          // Resize handler
          const handleResize = () => {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          };
          window.addEventListener('resize', handleResize);

          // Store cleanup function
          cleanupRef.current = () => {
            window.removeEventListener('resize', handleResize);
            if (frameRef.current) {
              cancelAnimationFrame(frameRef.current);
              frameRef.current = null;
            }
            if (rendererRef.current) {
              try {
                rendererRef.current.dispose();
              } catch (e) {
                console.warn('[GlobeOfIdeas] Renderer dispose error:', e);
              }
              try {
                if (containerRef.current && rendererRef.current.domElement?.parentNode === containerRef.current) {
                  containerRef.current.removeChild(rendererRef.current.domElement);
                }
              } catch (e) {
                console.warn('[GlobeOfIdeas] DOM cleanup error:', e);
              }
              rendererRef.current = null;
            }
            globeRef.current = null;
            sceneRef.current = null;
            cameraRef.current = null;
          };
        } catch (err) {
          console.error('[GlobeOfIdeas] Three.js initialization error:', err);
          if (isMounted) {
            setInitError('Failed to initialize 3D globe');
          }
        }
      })
      .catch((err) => {
        console.error('[GlobeOfIdeas] Failed to load three-globe:', err);
        if (isMounted) {
          setInitError('Failed to load 3D library');
        }
      });

    return () => {
      isMounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [graphData]);

  // Update globe data when year changes
  useEffect(() => {
    if (!globeRef.current || !graphData) return;

    const { nodes, links } = getVisibleData(currentYear, graphData);

    // Points (nodes)
    globeRef.current
      .pointsData(nodes.filter((n) => n.latitude && n.longitude))
      .pointLat('latitude')
      .pointLng('longitude')
      .pointColor((n) => NODE_COLORS[n.type] || '#FFFFFF')
      .pointAltitude((n) => {
        const size = NODE_SIZES[n.weight] || 0.5;
        return size * 0.02;
      })
      .pointRadius((n) => {
        const size = NODE_SIZES[n.weight] || 0.5;
        return size * 0.6;
      })
      .pointLabel(
        (n) => `
        <div style="
          background: rgba(22,22,22,0.95);
          border: 1px solid ${NODE_COLORS[n.type] || '#fff'};
          padding: 8px 12px; border-radius: 6px;
          color: #F2F2F5; font-size: 12px; max-width: 200px;
        ">
          <div style="color: ${NODE_COLORS[n.type]}; font-size: 10px; text-transform: uppercase; letter-spacing: 1px">${n.type}</div>
          <div style="font-weight: bold; margin: 2px 0">${n.label}</div>
          ${n.years ? `<div style="color: #89CFF0; font-size: 11px">${n.years}</div>` : ''}
        </div>
      `
      )
      .onPointClick((node) => {
        setSelected(node);
        setSelectedType('node');
        setIsPlaying(false);
      });

    // Arcs (links)
    const arcLinks = links
      .filter((l) => {
        const srcId = l.source?.id || l.source;
        const tgtId = l.target?.id || l.target;
        const src = graphData.nodes.find((n) => n.id === srcId);
        const tgt = graphData.nodes.find((n) => n.id === tgtId);
        return src?.latitude && src?.longitude && tgt?.latitude && tgt?.longitude;
      })
      .map((l) => {
        const srcId = l.source?.id || l.source;
        const tgtId = l.target?.id || l.target;
        const src = graphData.nodes.find((n) => n.id === srcId);
        const tgt = graphData.nodes.find((n) => n.id === tgtId);
        return {
          ...l,
          startLat: src.latitude,
          startLng: src.longitude,
          endLat: tgt.latitude,
          endLng: tgt.longitude,
          color: l.battle_dimension
            ? BATTLE_COLORS[l.battle_dimension]
            : BATTLE_COLORS[l.relation] || '#FFFFFF',
        };
      });

    globeRef.current
      .arcsData(arcLinks)
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcAltitude(0.15)
      .arcStroke((l) => (l.weight || 0.5) * 0.8)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2000)
      .arcLabel(
        (l) => `
        <div style="
          background: rgba(22,22,22,0.95);
          border: 1px solid ${l.color};
          padding: 8px 12px; border-radius: 6px;
          color: #F2F2F5; font-size: 12px; max-width: 240px;
        ">
          ${l.battle_dimension ? `<div style="color: ${l.color}; font-size: 10px; text-transform: uppercase">⚔ ${l.battle_dimension.replace(/_/g, ' ')}</div>` : ''}
          <div style="font-size: 11px; margin-top: 4px; line-height: 1.5">${l.label?.substring(0, 120) || ''}...</div>
        </div>
      `
      )
      .onArcClick((arc) => {
        setSelected(arc);
        setSelectedType('edge');
        setIsPlaying(false);
      });

    // Rings for recently appeared nodes (last 50 years)
    const recentNodes = nodes.filter((n) => {
      const nodeYear = n.year_numeric || MIN_YEAR;
      return nodeYear > currentYear - 50 && n.latitude && n.longitude;
    });

    globeRef.current
      .ringsData(recentNodes)
      .ringLat('latitude')
      .ringLng('longitude')
      .ringColor((n) => NODE_COLORS[n.type] || '#FFFFFF')
      .ringMaxRadius(3)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1000);
  }, [currentYear, graphData, getVisibleData]);

  // Playback
  useEffect(() => {
    if (isPlaying) {
      const interval = 100; // ms
      const yearsPerTick = playbackSpeed * (interval / 1000);
      playRef.current = setInterval(() => {
        setCurrentYear((y) => {
          if (y >= MAX_YEAR) {
            setIsPlaying(false);
            return MAX_YEAR;
          }
          return Math.min(y + yearsPerTick, MAX_YEAR);
        });
      }, interval);
    }
    return () => clearInterval(playRef.current);
  }, [isPlaying, playbackSpeed]);

  const formatYear = (y) => {
    if (y < 0) return `${Math.abs(Math.round(y))} BC`;
    return `${Math.round(y)} AD`;
  };

  const sliderValue = ((currentYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;

  const visibleCount = graphData ? getVisibleData(currentYear, graphData).nodes.length : 0;

  // Show error state
  if (displayError) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#222222',
          color: '#F2F2F5',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#9888;</div>
          <div style={{ fontSize: 14, color: '#FF4444' }}>
            {initError || 'Failed to load globe data'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#D6158C',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#222222' }}>
      {loading && <GlobeLoadingState />}

      {/* Globe container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Node count */}
      {graphData && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 16,
            background: 'rgba(22,22,22,0.8)',
            border: '1px solid #333',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#89CFF0',
            fontSize: 11,
            letterSpacing: 1,
          }}
        >
          {visibleCount} ideas active
        </div>
      )}

      {/* Era jump buttons */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          maxWidth: 200,
          justifyContent: 'flex-end',
        }}
      >
        {ERA_JUMPS.map(({ year, label, emoji }) => (
          <button
            key={year}
            onClick={() => {
              setCurrentYear(year);
              setIsPlaying(false);
            }}
            style={{
              background: currentYear >= year - 25 && currentYear <= year + 25 
                ? 'rgba(214,21,140,0.8)' 
                : 'rgba(34,34,34,0.8)',
              border: '1px solid #444',
              borderRadius: 4,
              padding: '3px 6px',
              color: '#F2F2F5',
              fontSize: 10,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title={label}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Timeline control */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px 20px',
          background: 'linear-gradient(transparent, rgba(22,22,22,0.95))',
        }}
      >
        {/* Year display */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 8,
            fontSize: 28,
            fontWeight: 700,
            color: '#FAFAFB',
            letterSpacing: 2,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {formatYear(currentYear)}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Play/pause */}
          <button
            onClick={() => setIsPlaying((v) => !v)}
            style={{
              background: '#D6158C',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              cursor: 'pointer',
              color: '#FAFAFB',
              fontSize: 14,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Year label left */}
          <span
            style={{ color: '#89CFF0', fontSize: 11, flexShrink: 0, width: 50, textAlign: 'right' }}
          >
            600 BC
          </span>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={sliderValue}
            onChange={(e) => {
              const pct = parseFloat(e.target.value) / 100;
              setCurrentYear(MIN_YEAR + pct * (MAX_YEAR - MIN_YEAR));
              setIsPlaying(false);
            }}
            style={{
              flex: 1,
              accentColor: '#D6158C',
              cursor: 'pointer',
              height: 4,
            }}
          />

          {/* Year label right */}
          <span style={{ color: '#89CFF0', fontSize: 11, flexShrink: 0, width: 40 }}>2026</span>

          {/* Speed control */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{
              background: 'rgba(34,34,34,0.9)',
              border: '1px solid #444',
              color: '#F2F2F5',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <option value={25}>½×</option>
            <option value={50}>1×</option>
            <option value={150}>3×</option>
            <option value={500}>10×</option>
          </select>
        </div>

        {/* Era markers on timeline */}
        <div
          style={{
            position: 'relative',
            height: 16,
            marginTop: 6,
            marginLeft: 98,
            marginRight: 90,
          }}
        >
          {[
            { year: -450, label: 'Axial Age' },
            { year: 900, label: 'Islamic Golden Age' },
            { year: 1500, label: 'Renaissance' },
            { year: 1725, label: 'Enlightenment' },
            { year: 1848, label: '1848' },
            { year: 1917, label: 'Russian Rev.' },
            { year: 1945, label: 'WWII' },
            { year: 1989, label: '1989' },
          ].map(({ year, label }) => {
            const pct = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
            return (
              <div
                key={year}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: 0,
                  fontSize: 9,
                  color: '#89CFF0',
                  opacity: 0.7,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setCurrentYear(year);
                  setIsPlaying(false);
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info panel */}
      {selected && (
        <GlobeInfoPanel item={selected} type={selectedType} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function GlobeInfoPanel({ item, type, onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 16,
        width: 300,
        maxHeight: 'calc(100vh - 250px)',
        overflowY: 'auto',
        background: 'rgba(22,22,22,0.97)',
        border: `1px solid ${type === 'node' ? '#D6158C' : '#89CFF0'}`,
        borderRadius: 8,
        padding: 16,
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
          fontSize: 18,
        }}
      >
        ×
      </button>

      {type === 'node' ? (
        <>
          <div
            style={{
              fontSize: 10,
              color: '#D6158C',
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {item.type} · {item.tradition}
          </div>
          <h3 style={{ margin: '4px 0', color: '#FAFAFB', fontSize: 16 }}>{item.label}</h3>
          {item.years && (
            <div style={{ fontSize: 12, color: '#89CFF0', marginBottom: 10 }}>{item.years}</div>
          )}
          <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>{item.description}</p>
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
              ⚔ {BATTLE_LABELS[item.battle_dimension]}
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
          <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0 }}>{item.label}</p>
        </>
      )}
    </div>
  );
}

function GlobeLoadingState() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#222222',
        zIndex: 10,
        color: '#F2F2F5',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
        <div style={{ fontSize: 14, color: '#89CFF0', letterSpacing: 2 }}>
          PREPARING THE GLOBE OF IDEAS
        </div>
      </div>
    </div>
  );
}

export default GlobeOfIdeas;
