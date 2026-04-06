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
// Philosophers from same region are positioned using a directional pattern:
// 1st: 0° (center), 2nd: 5° East, 3rd: 5° West, 4th: 5° North, 5th: 5° South
// Then diagonals (NE, NW, SE, SW), then increase to 10° and repeat...
// 
// Coordinate System:
// - x_inclination: East/West tether angle (degrees)
// - y_inclination: North/South tether angle (degrees)  
// - z_altitude: Height above birthplace (80 to 120 km)
// - Max total inclination: 20° (sqrt(x² + y²) ≤ 20)
// ============================================================

// Inclination step size (degrees)
const INCLINATION_STEP = 5;

// Maximum total inclination (degrees) - sqrt(x² + y²) must not exceed this
const MAX_INCLINATION = 20;

// Base altitude for all philosophers (km above Earth surface)
const BASE_ALTITUDE = 100;

// Directional pattern for positioning within a region
// Each ring adds positions at increasing distances from center
// Pattern: Center → Cardinal directions → Diagonals → Next ring
function getDirectionalPattern() {
  const pattern = [];
  
  // Center (0°)
  pattern.push({ x: 0, y: 0 });
  
  // Generate rings at 5°, 10°, 15°, 20° distances
  for (let ring = 1; ring <= 4; ring++) {
    const distance = ring * INCLINATION_STEP;
    
    // Skip if this ring would exceed max inclination
    if (distance > MAX_INCLINATION) break;
    
    // Cardinal directions: E, W, N, S
    pattern.push({ x: distance, y: 0 });           // East
    pattern.push({ x: -distance, y: 0 });          // West
    pattern.push({ x: 0, y: distance });           // North
    pattern.push({ x: 0, y: -distance });          // South
    
    // Diagonal directions: NE, NW, SE, SW (at 45° angles)
    // For diagonals, we use distance/sqrt(2) to keep total inclination = distance
    const diag = Math.round((distance / Math.sqrt(2)) * 10) / 10;
    
    // Only add diagonals if they don't exceed max inclination
    if (Math.sqrt(diag * diag + diag * diag) <= MAX_INCLINATION) {
      pattern.push({ x: diag, y: diag });          // NE
      pattern.push({ x: -diag, y: diag });         // NW
      pattern.push({ x: diag, y: -diag });         // SE
      pattern.push({ x: -diag, y: -diag });        // SW
    }
  }
  
  return pattern;
}

// Pre-compute the directional pattern
const DIRECTIONAL_PATTERN = getDirectionalPattern();

// Geographic region base altitudes (subtle variation by region)
const REGION_ALTITUDE = {
  greece: 100,
  rome: 101,
  germany: 102,
  france: 101,
  britain: 102,
  usa: 105,
  russia: 103,
  china: 99,
  india: 98,
  persia: 100,
  default: 100,
};

// Map philosopher birthplaces to regions
function getRegion(node) {
  const country = (node.birth_country_modern || '').toLowerCase();
  const city = (node.birth_city || '').toLowerCase();
  const birthplace = (node.birthplace || '').toLowerCase();
  const combined = `${country} ${city} ${birthplace}`;
  
  // Ancient Greece (includes Turkey/Ionia - ancient Greek colonies)
  if (country === 'greece' || 
      combined.includes('athens') || combined.includes('stagira') || 
      combined.includes('samos') || combined.includes('abdera') ||
      combined.includes('miletus') || combined.includes('ephesus') ||
      combined.includes('elea') || combined.includes('ionia') ||
      combined.includes('cyprus') ||
      // Ancient Greek cities in modern Turkey
      (country === 'turkey' && (city.includes('miletus') || city.includes('ephesus') || 
       city.includes('colophon') || city.includes('clazomenae') || city.includes('halicarnassus')))) {
    return 'greece';
  }
  // Rome/Italy
  if (country === 'italy' || combined.includes('rome') || 
      combined.includes('naples') || combined.includes('aquino') ||
      combined.includes('sicily') || combined.includes('agrigentum')) {
    return 'rome';
  }
  // Germany
  if (country === 'germany' || combined.includes('prussia') ||
      combined.includes('königsberg') || combined.includes('frankfurt') ||
      combined.includes('danzig') || combined.includes('röcken') ||
      combined.includes('trier') || combined.includes('breslau')) {
    return 'germany';
  }
  // France
  if (country === 'france' || combined.includes('paris') ||
      combined.includes('lyon') || combined.includes('la haye') ||
      combined.includes('bordeaux') || combined.includes('touraine')) {
    return 'france';
  }
  // Britain
  if (country === 'england' || country === 'uk' || country === 'scotland' ||
      country === 'united kingdom' || combined.includes('britain') ||
      combined.includes('london') || combined.includes('edinburgh') ||
      combined.includes('malmesbury') || combined.includes('wrington')) {
    return 'britain';
  }
  // USA
  if (country === 'usa' || country === 'united states' ||
      combined.includes('new york') || combined.includes('cambridge') ||
      combined.includes('boston') || combined.includes('chicago')) {
    return 'usa';
  }
  // China
  if (country === 'china' || combined.includes('qufu') ||
      node.tradition === 'chinese') {
    return 'china';
  }
  // India  
  if (country === 'india' || country === 'nepal' || 
      combined.includes('lumbini') || combined.includes('vaishali') ||
      node.tradition === 'indian') {
    return 'india';
  }
  // Persia/Islamic
  if (country === 'iran' || country === 'iraq' || country === 'spain' ||
      combined.includes('persia') || combined.includes('baghdad') || 
      combined.includes('cordoba') || combined.includes('bukhara') ||
      node.tradition === 'islamic') {
    return 'persia';
  }
  // Russia
  if (country === 'russia' || combined.includes('moscow') ||
      combined.includes('petersburg')) {
    return 'russia';
  }
  
  // Fallback: use tradition
  if (node.tradition === 'western') return 'greece';
  if (node.tradition === 'chinese') return 'china';
  if (node.tradition === 'indian') return 'india';
  if (node.tradition === 'islamic') return 'persia';
  
  return 'default';
}

// Assign position to a philosopher based on their index within their region
// Uses the directional pattern: center, E, W, N, S, NE, NW, SE, SW, then next ring
function getPositionForIndex(index, baseAltitude) {
  // Get position from pattern (wraps around if we have more philosophers than pattern slots)
  const patternIndex = index % DIRECTIONAL_PATTERN.length;
  const ringMultiplier = Math.floor(index / DIRECTIONAL_PATTERN.length);
  
  const basePosition = DIRECTIONAL_PATTERN[patternIndex];
  
  // For overflow (more philosophers than pattern slots), add altitude variation
  const altitudeOffset = ringMultiplier * 2; // 2km per overflow ring
  
  let x = basePosition.x;
  let y = basePosition.y;
  let z = baseAltitude + altitudeOffset;
  
  // Ensure total inclination doesn't exceed max
  const totalInclination = Math.sqrt(x * x + y * y);
  if (totalInclination > MAX_INCLINATION) {
    const scale = MAX_INCLINATION / totalInclination;
    x = Math.round(x * scale * 10) / 10;
    y = Math.round(y * scale * 10) / 10;
  }
  
  return { x, y, z };
}

// Assign unique orbital positions to all nodes
// Uses directional pattern: 1st=center, 2nd=E, 3rd=W, 4th=N, 5th=S, then diagonals...
function assignOrbitalPositions(nodes) {
  const results = [];
  
  // Group nodes by region
  const regionGroups = {};
  for (const node of nodes) {
    const region = getRegion(node);
    if (!regionGroups[region]) regionGroups[region] = [];
    regionGroups[region].push(node);
  }
  
  // Process each region
  for (const [region, regionNodes] of Object.entries(regionGroups)) {
    const baseAltitude = REGION_ALTITUDE[region] || REGION_ALTITUDE.default;
    
    // Sort by importance (most important gets center position at 0°)
    regionNodes.sort((a, b) => (b.historical_weight || 0.5) - (a.historical_weight || 0.5));
    
    // Assign positions using directional pattern
    regionNodes.forEach((node, index) => {
      const position = getPositionForIndex(index, baseAltitude);
      
      results.push({
        nodeId: node.id,
        orbital_position: {
          x_inclination: position.x,
          y_inclination: position.y,
          z_altitude: position.z,
          // Total inclination for reference
          total_inclination: Math.round(Math.sqrt(position.x * position.x + position.y * position.y) * 10) / 10,
          // Region for debugging
          region: region,
          // Index within region (0 = most important)
          region_rank: index,
        }
      });
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
