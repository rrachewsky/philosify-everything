// ============================================================
// CONSTELLATION OF IDEAS - API Handler
// 3D visualization of 2,600 years of philosophical thought
// Phase 2: Includes enrichment from analysis extraction
// ============================================================

import { jsonResponse } from '../utils/index.js';
import { getSecret } from '../utils/secrets.js';

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

// Tradition hemisphere base positions
const TRADITION_BASE_X = {
  western: -60,
  chinese: 60,
  indian: 40,
  islamic: 20,
};

// ============================================================
// 3D ORBITAL TETHER POSITIONING SYSTEM
// Ensures NO overlapping cards by assigning unique (x, y, z)
// 
// Coordinate System:
// - x_inclination: East/West tether angle (-15° to +15°)
// - y_inclination: North/South tether angle (-10° to +10°)  
// - z_altitude: Height above birthplace (60 to 150 km)
// ============================================================

// Position precision (rounded to this many decimals)
const POSITION_PRECISION = 1;

// Available space bounds
const BOUNDS = {
  x_min: -15, x_max: 15,   // East/West inclination degrees
  y_min: -10, y_max: 10,   // North/South inclination degrees
  z_min: 60,  z_max: 150,  // Altitude in km
};

// Round to precision
function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// Create position key for uniqueness check
function positionKey(x, y, z) {
  return `${roundTo(x, POSITION_PRECISION)},${roundTo(y, POSITION_PRECISION)},${roundTo(z, POSITION_PRECISION)}`;
}

// Calculate ideal position based on philosophical meaning
function calculateIdealPosition(node) {
  const battles = node.battles || {};
  
  // X: Based on tradition (Western left, Eastern right)
  const traditionX = {
    western: -8,
    chinese: 8,
    indian: 5,
    islamic: 2,
  };
  const idealX = traditionX[node.tradition] || 0;
  
  // Y: Based on battle scores (reason vs faith dominant axis)
  let battleScore = 0;
  Object.entries(BATTLE_WEIGHTS).forEach(([battle, weight]) => {
    const score = battles[battle] || 0;
    battleScore += score * weight;
  });
  const idealY = battleScore * 8; // Scale to ±8 degrees
  
  // Z: Based on era (ancient = lower, modern = higher)
  const eraProgress = (node.birth_year + 600) / 2626; // 0 to 1
  const idealZ = BOUNDS.z_min + eraProgress * (BOUNDS.z_max - BOUNDS.z_min);
  
  return { x: idealX, y: idealY, z: idealZ };
}

// Find nearest available position using spiral search
function findAvailablePosition(idealX, idealY, idealZ, occupiedPositions) {
  // Try ideal position first
  let key = positionKey(idealX, idealY, idealZ);
  if (!occupiedPositions.has(key)) {
    return { x: roundTo(idealX, POSITION_PRECISION), y: roundTo(idealY, POSITION_PRECISION), z: roundTo(idealZ, POSITION_PRECISION) };
  }
  
  // Spiral search outward from ideal position
  const step = Math.pow(10, -POSITION_PRECISION); // 0.1 for precision=1
  
  for (let radius = 1; radius <= 50; radius++) {
    const offset = radius * step;
    
    // Try variations in x, y, z
    const variations = [
      // Vary X
      { x: idealX + offset, y: idealY, z: idealZ },
      { x: idealX - offset, y: idealY, z: idealZ },
      // Vary Y
      { x: idealX, y: idealY + offset, z: idealZ },
      { x: idealX, y: idealY - offset, z: idealZ },
      // Vary Z (larger steps for altitude)
      { x: idealX, y: idealY, z: idealZ + radius * 2 },
      { x: idealX, y: idealY, z: idealZ - radius * 2 },
      // Diagonal variations
      { x: idealX + offset, y: idealY + offset, z: idealZ },
      { x: idealX - offset, y: idealY + offset, z: idealZ },
      { x: idealX + offset, y: idealY - offset, z: idealZ },
      { x: idealX - offset, y: idealY - offset, z: idealZ },
      // 3D diagonals
      { x: idealX + offset, y: idealY, z: idealZ + radius * 2 },
      { x: idealX - offset, y: idealY, z: idealZ + radius * 2 },
      { x: idealX, y: idealY + offset, z: idealZ + radius * 2 },
      { x: idealX, y: idealY - offset, z: idealZ + radius * 2 },
    ];
    
    for (const v of variations) {
      // Check bounds
      if (v.x < BOUNDS.x_min || v.x > BOUNDS.x_max) continue;
      if (v.y < BOUNDS.y_min || v.y > BOUNDS.y_max) continue;
      if (v.z < BOUNDS.z_min || v.z > BOUNDS.z_max) continue;
      
      const vKey = positionKey(v.x, v.y, v.z);
      if (!occupiedPositions.has(vKey)) {
        return { 
          x: roundTo(v.x, POSITION_PRECISION), 
          y: roundTo(v.y, POSITION_PRECISION), 
          z: roundTo(v.z, POSITION_PRECISION) 
        };
      }
    }
  }
  
  // Fallback: random position within bounds (should never happen with enough space)
  console.warn('[Constellation] Spiral search exhausted, using random fallback');
  for (let attempt = 0; attempt < 1000; attempt++) {
    const rx = roundTo(BOUNDS.x_min + Math.random() * (BOUNDS.x_max - BOUNDS.x_min), POSITION_PRECISION);
    const ry = roundTo(BOUNDS.y_min + Math.random() * (BOUNDS.y_max - BOUNDS.y_min), POSITION_PRECISION);
    const rz = roundTo(BOUNDS.z_min + Math.random() * (BOUNDS.z_max - BOUNDS.z_min), POSITION_PRECISION);
    const rKey = positionKey(rx, ry, rz);
    if (!occupiedPositions.has(rKey)) {
      return { x: rx, y: ry, z: rz };
    }
  }
  
  // Last resort: return ideal position anyway
  return { x: roundTo(idealX, POSITION_PRECISION), y: roundTo(idealY, POSITION_PRECISION), z: roundTo(idealZ, POSITION_PRECISION) };
}

// Assign unique orbital positions to all nodes
function assignOrbitalPositions(nodes) {
  const occupiedPositions = new Set();
  const results = [];
  
  // Sort nodes by historical weight (most important get ideal positions first)
  const sortedNodes = [...nodes].sort((a, b) => (b.historical_weight || 0.5) - (a.historical_weight || 0.5));
  
  for (const node of sortedNodes) {
    const ideal = calculateIdealPosition(node);
    const position = findAvailablePosition(ideal.x, ideal.y, ideal.z, occupiedPositions);
    
    // Mark position as occupied
    occupiedPositions.add(positionKey(position.x, position.y, position.z));
    
    results.push({
      nodeId: node.id,
      orbital_position: {
        x_inclination: position.x,
        y_inclination: position.y,
        z_altitude: position.z,
        // Legacy fields for compatibility
        x: position.x * 5,  // Scale for visualization
        y: position.y * 8,  // Scale for visualization
        z: (position.z - 100) / 2,  // Center around 0
        altitude: position.z,
      }
    });
  }
  
  return results;
}

/**
 * Fetch enrichment data from Supabase (mention counts, merged edges)
 */
async function fetchEnrichmentData(env) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  
  if (!supabaseUrl || !supabaseKey) {
    return { mentionCounts: {}, mergedEdges: [], stats: null };
  }
  
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  
  try {
    // Fetch mention counts per node
    const mentionRes = await fetch(
      `${supabaseUrl}/rest/v1/constellation_analysis_links?select=node_id&limit=5000`,
      { headers }
    );
    
    const mentionCounts = {};
    if (mentionRes.ok) {
      const mentions = await mentionRes.json();
      for (const m of mentions) {
        mentionCounts[m.node_id] = (mentionCounts[m.node_id] || 0) + 1;
      }
    }
    
    // Fetch merged edge candidates (these are auto-discovered connections)
    const edgesRes = await fetch(
      `${supabaseUrl}/rest/v1/constellation_edge_candidates?status=eq.merged&select=source_node_id,target_node_id,relationship_type,primary_battle,weight,description,evidence_text,confidence&limit=500`,
      { headers }
    );
    
    let mergedEdges = [];
    if (edgesRes.ok) {
      const edges = await edgesRes.json();
      mergedEdges = edges.map(e => ({
        source_id: e.source_node_id,
        target_id: e.target_node_id,
        type: e.relationship_type,
        primary_battle: e.primary_battle,
        weight: e.weight || 0.5,
        description: e.description,
        evidence_text: e.evidence_text,
        confidence: e.confidence || 0.7,
        source_type: 'auto_discovered',
      }));
    }
    
    // Fetch stats
    const statsRes = await fetch(
      `${supabaseUrl}/rest/v1/constellation_extraction_log?select=analysis_type,extraction_tier&limit=10000`,
      { headers }
    );
    
    let stats = {
      total_analysis_links: Object.values(mentionCounts).reduce((a, b) => a + b, 0),
      auto_discovered_edges: mergedEdges.length,
      analyses_processed: {
        music: 0,
        literature: 0,
        cinema: 0,
        news: 0,
      },
    };
    
    if (statsRes.ok) {
      const logs = await statsRes.json();
      for (const log of logs) {
        if (log.extraction_tier === 'rule_based') {
          stats.analyses_processed[log.analysis_type] = 
            (stats.analyses_processed[log.analysis_type] || 0) + 1;
        }
      }
    }
    
    return { mentionCounts, mergedEdges, stats };
  } catch (error) {
    console.error('[Constellation] Enrichment fetch error:', error.message);
    return { mentionCounts: {}, mergedEdges: [], stats: null };
  }
}

/**
 * GET /api/history/constellation
 * Returns the full constellation data for visualization
 * Includes enrichment from analysis extraction
 */
export async function handleConstellation(request, env, origin) {
  try {
    // Check KV cache first (short TTL for enriched data)
    const cacheKey = 'constellation:v2:enriched';
    const cached = await env.PHILOSIFY_KV.get(cacheKey, 'json');
    
    if (cached) {
      return jsonResponse(cached, 200, origin, env);
    }

    // Import seed data
    const { SEED_NODES, SEED_EDGES } = await import('../data/constellationSeedData.js');

    // Fetch enrichment data from database
    const { mentionCounts, mergedEdges, stats } = await fetchEnrichmentData(env);

    // Boost historical weights based on mention counts
    const nodesWithWeights = SEED_NODES.map(node => {
      const mentionCount = mentionCounts[node.id] || 0;
      const boostedWeight = Math.min(1.0, (node.historical_weight || 0.5) + mentionCount * 0.01);
      return { ...node, historical_weight: boostedWeight, mention_count: mentionCount };
    });
    
    // Assign unique orbital positions (NO OVERLAPPING)
    const orbitalPositions = assignOrbitalPositions(nodesWithWeights);
    const positionMap = new Map(orbitalPositions.map(p => [p.nodeId, p.orbital_position]));
    
    // Build final nodes with positions
    const nodesWithPositions = nodesWithWeights.map(node => ({
      ...node,
      orbital_position: positionMap.get(node.id),
      auto_enriched: node.mention_count > 0,
      source_type: 'seed',
    }));

    // Combine seed edges with auto-discovered edges
    const seedEdges = SEED_EDGES.map(e => ({
      ...e,
      source_type: 'seed',
      confidence: 1.0,
    }));
    
    const allEdges = [...seedEdges, ...mergedEdges];

    const data = {
      nodes: nodesWithPositions,
      edges: allEdges,
      meta: {
        total_nodes: nodesWithPositions.length,
        total_edges: allEdges.length,
        seed_edges: seedEdges.length,
        auto_discovered_edges: mergedEdges.length,
        year_range: [-600, 2026],
        traditions: ['western', 'chinese', 'indian', 'islamic'],
        enrichment: stats ? {
          total_analysis_links: stats.total_analysis_links,
          analyses_processed: stats.analyses_processed,
          last_updated: new Date().toISOString(),
        } : null,
      },
    };

    // Cache for 5 minutes (shorter TTL for enriched data to show updates)
    await env.PHILOSIFY_KV.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 300,
    });

    return jsonResponse(data, 200, origin, env);
  } catch (error) {
    console.error('[Constellation] Error:', error.message);
    return jsonResponse({ error: 'Failed to load constellation data' }, 500, origin, env);
  }
}

/**
 * GET /api/history/constellation/stats
 * Returns enrichment statistics
 */
export async function handleConstellationStats(request, env, origin) {
  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
    
    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: 'Database not configured' }, 500, origin, env);
    }
    
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };
    
    // Parallel fetch all stats
    const [
      linksRes,
      pendingEdgesRes,
      mergedEdgesRes,
      pendingNodesRes,
      extractionLogsRes,
      topMentionedRes,
    ] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/constellation_analysis_links?select=id&limit=1`, { headers, method: 'HEAD' }),
      fetch(`${supabaseUrl}/rest/v1/constellation_edge_candidates?status=eq.pending&select=id`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/constellation_edge_candidates?status=eq.merged&select=id`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/constellation_node_candidates?status=eq.pending&select=id`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/constellation_extraction_log?select=analysis_type,extraction_tier,status`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/constellation_analysis_links?select=node_id&limit=5000`, { headers }),
    ]);
    
    const { SEED_NODES, SEED_EDGES } = await import('../data/constellationSeedData.js');
    
    // Count extraction logs by type
    const logs = extractionLogsRes.ok ? await extractionLogsRes.json() : [];
    const analysesProcessed = { music: 0, literature: 0, cinema: 0, news: 0 };
    let tier1Count = 0, tier2Count = 0;
    
    for (const log of logs) {
      if (log.status === 'completed') {
        if (log.extraction_tier === 'rule_based') {
          tier1Count++;
          analysesProcessed[log.analysis_type] = (analysesProcessed[log.analysis_type] || 0) + 1;
        } else if (log.extraction_tier === 'llm') {
          tier2Count++;
        }
      }
    }
    
    // Calculate top mentioned philosophers
    const mentions = topMentionedRes.ok ? await topMentionedRes.json() : [];
    const mentionCounts = {};
    for (const m of mentions) {
      mentionCounts[m.node_id] = (mentionCounts[m.node_id] || 0) + 1;
    }
    
    const topMentioned = Object.entries(mentionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nodeId, count]) => {
        const node = SEED_NODES.find(n => n.id === nodeId);
        return { name: node?.name || nodeId, mention_count: count };
      });
    
    const pendingEdges = pendingEdgesRes.ok ? (await pendingEdgesRes.json()).length : 0;
    const mergedEdges = mergedEdgesRes.ok ? (await mergedEdgesRes.json()).length : 0;
    const pendingNodes = pendingNodesRes.ok ? (await pendingNodesRes.json()).length : 0;
    
    return jsonResponse({
      seed_nodes: SEED_NODES.length,
      auto_promoted_nodes: 0, // TODO: track promoted nodes
      total_nodes: SEED_NODES.length,
      seed_edges: SEED_EDGES.length,
      auto_discovered_edges: mergedEdges,
      total_edges: SEED_EDGES.length + mergedEdges,
      total_analysis_links: mentions.length,
      pending_edge_candidates: pendingEdges,
      pending_node_candidates: pendingNodes,
      tier1_extractions: tier1Count,
      tier2_extractions: tier2Count,
      analyses_processed: analysesProcessed,
      most_referenced_philosophers: topMentioned,
      last_updated: new Date().toISOString(),
    }, 200, origin, env);
  } catch (error) {
    console.error('[Constellation] Stats error:', error.message);
    return jsonResponse({ error: 'Failed to fetch stats' }, 500, origin, env);
  }
}

/**
 * Clear constellation cache (admin only)
 */
export async function handleConstellationCacheClear(request, env, origin) {
  try {
    await env.PHILOSIFY_KV.delete('constellation:v1');
    await env.PHILOSIFY_KV.delete('constellation:v2:enriched');
    return jsonResponse({ success: true, message: 'Cache cleared' }, 200, origin, env);
  } catch (error) {
    console.error('[Constellation] Cache clear error:', error.message);
    return jsonResponse({ error: 'Failed to clear cache' }, 500, origin, env);
  }
}
