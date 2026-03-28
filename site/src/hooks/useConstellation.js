// ============================================================
// useConstellation - Data fetching and state management for Constellation of Ideas
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SCHOOL_COLORS, PHILOSOPHER_PORTRAITS } from '@/data/constellationSeedData.js';

// Re-export for convenience
export { SCHOOL_COLORS, PHILOSOPHER_PORTRAITS };

const API_URL = import.meta.env.VITE_API_URL || 'https://api.philosify.org';

// Timeline constants
const MIN_YEAR = -600;
const MAX_YEAR = 2026;
const YEARS_PER_SECOND_1X = 2.5; // At 1x speed, ~17 minutes for full timeline

// Era definitions with year ranges
// Note: Some eras overlap historically (Counter-Enlightenment was a reaction during Enlightenment)
export const ERAS = [
  { id: 'presocratics', label: 'Pre-Socratics', startYear: -700, endYear: -450 },
  { id: 'classical', label: 'Classical', startYear: -450, endYear: -300 },
  { id: 'hellenistic', label: 'Hellenistic', startYear: -300, endYear: 200 },
  { id: 'medieval', label: 'Medieval', startYear: 200, endYear: 1400 },
  { id: 'renaissance', label: 'Renaissance', startYear: 1400, endYear: 1600 },
  { id: 'enlightenment', label: 'Enlightenment', startYear: 1600, endYear: 1800 },
  { id: 'counter_enlightenment', label: 'Counter-Enlightenment', startYear: 1750, endYear: 1900 },
  { id: 'modern', label: 'Modern', startYear: 1850, endYear: 1950 },
  { id: 'contemporary', label: 'Contemporary', startYear: 1950, endYear: 2030 },
];

// Get era for a philosopher based on birth year
function getPhilosopherEra(birthYear) {
  for (const era of ERAS) {
    if (birthYear >= era.startYear && birthYear < era.endYear) {
      return era.id;
    }
  }
  return 'contemporary'; // Default for edge cases
}

// Battle dimension weights for Y-position calculation
const BATTLE_WEIGHTS = {
  reason_faith: 0.20,
  reality_mysticism: 0.20,
  individual_collective: 0.15,
  freedom_coercion: 0.15,
  value_nihilism: 0.10,
  market_planning: 0.05,
  beauty_chaos: 0.10,
  good_evil: 0.05,
};

// Tradition hemisphere base positions (X coordinate)
const TRADITION_BASE_X = {
  western: -60,
  chinese: 60,
  indian: 40,
  islamic: 20,
};

// Battle dimension colors
export const BATTLE_COLORS = {
  reason_faith: '#FFD700',        // Gold
  reality_mysticism: '#00BFFF',   // Deep Sky Blue
  individual_collective: '#D6158C', // Magenta (Philosify brand)
  freedom_coercion: '#32CD32',    // Lime Green
  value_nihilism: '#FF6347',      // Tomato
  market_planning: '#9370DB',     // Medium Purple
  beauty_chaos: '#FF69B4',        // Hot Pink
  good_evil: '#20B2AA',           // Light Sea Green
};

// Tradition colors for satellites
export const TRADITION_COLORS = {
  western: '#FAFAFB',   // Cool white
  chinese: '#FFD700',   // Gold
  indian: '#FF8C00',    // Deep orange
  islamic: '#00CED1',   // Dark turquoise
};

// Calculate orbital position based on battle scores and tradition
export function calculateOrbitalPosition(node) {
  const battles = node.battles || {};
  
  // Y position: weighted average of battle scores (-1 to +1 range, scale to orbital space)
  let yScore = 0;
  Object.entries(BATTLE_WEIGHTS).forEach(([battle, weight]) => {
    const score = battles[battle] || 0;
    yScore += score * weight;
  });
  
  // Scale Y to orbital range (-80 to +80)
  const y = yScore * 80;
  
  // X position: based on tradition with jitter
  const baseX = TRADITION_BASE_X[node.tradition] || 0;
  const schoolJitter = (hashString(node.school_of_thought || '') % 30) - 15;
  const x = baseX + schoolJitter;
  
  // Z position: based on era with some clustering
  const eraDepth = ((node.birth_year + 600) / 2626) * 60 - 30; // -30 to +30
  const z = eraDepth + (hashString(node.name) % 20) - 10;
  
  // Altitude: base + bonus for historical weight
  // Increased bonus for clearer visual hierarchy (champions orbit higher)
  const BASE_ALTITUDE = 130;
  const ALTITUDE_BONUS = 60;
  const altitude = BASE_ALTITUDE + (node.historical_weight || 0.5) * ALTITUDE_BONUS;
  
  return { x, y, z, altitude };
}

// Simple string hash for consistent jitter
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function useConstellation() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timeline state - start at MIN_YEAR (600 BC) to begin at the dawn of philosophy
  const [currentYear, setCurrentYear] = useState(MIN_YEAR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Selection state
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Era filter state (null = show all based on timeline, string = filter by era)
  const [selectedEra, setSelectedEra] = useState(null);
  
  // School filter state (null = show all, string = filter by school)
  const [selectedSchool, setSelectedSchool] = useState(null);
  
  // Refs for animation
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Fetch constellation data
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/history/constellation`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        // Calculate orbital positions and add portraits for each node
        const nodesWithPositions = json.nodes.map(node => ({
          ...node,
          orbital_position: node.orbital_position || calculateOrbitalPosition(node),
          portrait: PHILOSOPHER_PORTRAITS[node.id] || null,
        }));

        if (!cancelled) {
          setData({
            ...json,
            nodes: nodesWithPositions,
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('[useConstellation] Fetch error:', err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Timeline playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const animate = (timestamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Calculate years to advance
      const yearsToAdvance = (deltaMs / 1000) * YEARS_PER_SECOND_1X * playbackSpeed;

      setCurrentYear(prev => {
        const next = prev + yearsToAdvance;
        if (next >= MAX_YEAR) {
          setIsPlaying(false);
          return MAX_YEAR;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed]);

  // Get visible nodes based on current year OR selected era/school filter
  const getVisibleNodes = useCallback(() => {
    if (!data?.nodes) return [];
    
    let filteredNodes = data.nodes;
    
    // If a school is selected, filter by school first
    if (selectedSchool) {
      filteredNodes = filteredNodes.filter(node => node.school === selectedSchool);
      // When filtering by school, show all members regardless of timeline
      return filteredNodes;
    }
    
    // If an era is selected, filter by era (ignoring timeline)
    if (selectedEra) {
      const era = ERAS.find(e => e.id === selectedEra);
      if (era) {
        // Movement-based filtering (Enlightenment, Counter-Enlightenment, Renaissance)
        // Supports both string and array movement fields
        if (era.filterByMovement) {
          return filteredNodes.filter(node => {
            if (Array.isArray(node.movement)) {
              return node.movement.includes(selectedEra);
            }
            return node.movement === selectedEra;
          });
        }
        // Time-based filtering
        return filteredNodes.filter(node => 
          node.birth_year >= era.startYear && node.birth_year < era.endYear
        );
      }
    }
    
    // Otherwise, filter by timeline (show all philosophers born before currentYear)
    return filteredNodes.filter(node => node.birth_year <= currentYear);
  }, [data, currentYear, selectedEra, selectedSchool]);

  // Get visible edges (both nodes must be visible, with 1.8s delay)
  const getVisibleEdges = useCallback(() => {
    if (!data?.edges || !data?.nodes) return [];
    
    const visibleNodeIds = new Set(getVisibleNodes().map(n => n.id));
    
    return data.edges.filter(edge => {
      const sourceNode = data.nodes.find(n => n.id === edge.source_id);
      const targetNode = data.nodes.find(n => n.id === edge.target_id);
      
      if (!sourceNode || !targetNode) return false;
      if (!visibleNodeIds.has(edge.source_id) || !visibleNodeIds.has(edge.target_id)) return false;
      
      // Edge appears 1.8 seconds (real time) after the later node
      // At 1x speed, 1.8 seconds = ~4.5 years
      const laterBirthYear = Math.max(sourceNode.birth_year, targetNode.birth_year);
      const delayYears = (1.8 * YEARS_PER_SECOND_1X * playbackSpeed);
      
      return currentYear >= laterBirthYear + delayYears;
    });
  }, [data, currentYear, playbackSpeed, getVisibleNodes]);

  // Jump to era (for timeline scrubbing)
  const jumpToEra = useCallback((year) => {
    setCurrentYear(year);
    setIsPlaying(false);
  }, []);

  // Toggle era filter (click = select, click again = deselect)
  const toggleEraFilter = useCallback((eraId) => {
    setSelectedEra(prev => prev === eraId ? null : eraId);
    setSelectedSchool(null); // Clear school filter when era changes
    setIsPlaying(false);
  }, []);

  // Toggle school filter (click = select, click again = deselect)
  const toggleSchoolFilter = useCallback((schoolName) => {
    setSelectedSchool(prev => prev === schoolName ? null : schoolName);
    setSelectedEra(null); // Clear era filter when school changes
    setIsPlaying(false);
  }, []);

  // Get unique schools from data, sorted chronologically by earliest philosopher birth year
  const getSchools = useCallback(() => {
    if (!data?.nodes) return [];
    
    // Build a map of school -> earliest birth year
    const schoolEarliestYear = {};
    data.nodes.forEach(n => {
      if (n.school && n.birth_year != null) {
        if (!(n.school in schoolEarliestYear) || n.birth_year < schoolEarliestYear[n.school]) {
          schoolEarliestYear[n.school] = n.birth_year;
        }
      }
    });
    
    // Get unique schools and sort by earliest birth year (chronological order)
    const schoolSet = new Set(data.nodes.map(n => n.school).filter(Boolean));
    return Array.from(schoolSet).sort((a, b) => {
      const yearA = schoolEarliestYear[a] ?? 9999;
      const yearB = schoolEarliestYear[b] ?? 9999;
      return yearA - yearB;
    });
  }, [data]);

  // Toggle playback
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  // Search for philosopher
  const searchPhilosopher = useCallback((query) => {
    if (!data?.nodes || !query) return [];
    const lowerQuery = query.toLowerCase();
    return data.nodes.filter(node => 
      node.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  }, [data]);

  // Find philosopher by ID
  const findPhilosopher = useCallback((id) => {
    return data?.nodes?.find(n => n.id === id) || null;
  }, [data]);

  // Get connections for a node
  const getNodeConnections = useCallback((nodeId) => {
    if (!data?.edges) return [];
    return data.edges.filter(e => 
      e.source_id === nodeId || e.target_id === nodeId
    );
  }, [data]);

  // Format year for display
  const formatYear = useCallback((year) => {
    // Guard against NaN/undefined
    if (year == null || Number.isNaN(year)) return '';
    if (year < 0) return `${Math.abs(Math.round(year))} ${t('constellation.bc')}`;
    return `${Math.round(year)} ${t('constellation.ad')}`;
  }, [t]);

  return {
    // Data
    data,
    loading,
    error,
    
    // Timeline
    currentYear,
    setCurrentYear,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    togglePlay,
    jumpToEra,
    formatYear,
    MIN_YEAR,
    MAX_YEAR,
    
    // Visibility
    getVisibleNodes,
    getVisibleEdges,
    
    // Era filter
    selectedEra,
    setSelectedEra,
    toggleEraFilter,
    
    // School filter
    selectedSchool,
    setSelectedSchool,
    toggleSchoolFilter,
    getSchools,
    
    // Selection
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    hoveredNode,
    setHoveredNode,
    
    // Search
    searchPhilosopher,
    findPhilosopher,
    getNodeConnections,
  };
}

export default useConstellation;
