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
// Cards from same geographic area stay CLOSE together
// Small inclination/altitude variations prevent overlap
// 
// Coordinate System:
// - x_inclination: East/West tether angle (small, ±5° max within region)
// - y_inclination: North/South tether angle (small, ±5° max within region)  
// - z_altitude: Height above birthplace (80 to 120 km)
// ============================================================

// Position precision (rounded to this many decimals)
const POSITION_PRECISION = 1;

// Geographic region base positions (clustered, not spread apart)
// All regions are close to center, differentiated by small offsets
const REGION_BASE = {
  // Ancient Greece (Athens area) - center of Western philosophy
  greece: { x: 0, y: 0, z: 90 },
  // Rome/Italy - close to Greece
  rome: { x: 0.5, y: -0.5, z: 92 },
  // Germany - Northern Europe cluster
  germany: { x: -1, y: 1.5, z: 96 },
  // France - Western Europe
  france: { x: -1.5, y: 0.5, z: 94 },
  // Britain - Northwestern Europe
  britain: { x: -2, y: 2, z: 95 },
  // USA - Modern West
  usa: { x: -2.5, y: 1, z: 110 },
  // Russia - Eastern Europe
  russia: { x: 1, y: 2, z: 98 },
  // China - East Asia
  china: { x: 3, y: 0, z: 88 },
  // India - South Asia
  india: { x: 2, y: -1.5, z: 86 },
  // Persia/Islamic - Middle East
  persia: { x: 1.5, y: -1, z: 89 },
  // Default (unknown region) - center
  default: { x: 0, y: 0, z: 100 },
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

// Round to precision
function roundTo(num, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// Create position key for uniqueness check
function positionKey(x, y, z) {
  return `${roundTo(x, POSITION_PRECISION)},${roundTo(y, POSITION_PRECISION)},${roundTo(z, POSITION_PRECISION)}`;
}

// Find nearest available position using tight spiral (stays close to base)
function findAvailablePosition(baseX, baseY, baseZ, occupiedPositions) {
  // Try base position first
  let key = positionKey(baseX, baseY, baseZ);
  if (!occupiedPositions.has(key)) {
    return { x: roundTo(baseX, POSITION_PRECISION), y: roundTo(baseY, POSITION_PRECISION), z: roundTo(baseZ, POSITION_PRECISION) };
  }
  
  // Tight spiral - small steps to stay close
  const step = 0.5; // Half degree steps
  
  for (let radius = 1; radius <= 20; radius++) {
    const offset = radius * step;
    
    // Try variations - prioritize Z (altitude) changes, then small x/y
    const variations = [
      // Altitude variations first (vertical separation)
      { x: baseX, y: baseY, z: baseZ + radius * 2 },
      { x: baseX, y: baseY, z: baseZ - radius * 2 },
      // Small X variations
      { x: baseX + offset, y: baseY, z: baseZ },
      { x: baseX - offset, y: baseY, z: baseZ },
      // Small Y variations
      { x: baseX, y: baseY + offset, z: baseZ },
      { x: baseX, y: baseY - offset, z: baseZ },
      // Diagonal + altitude
      { x: baseX + offset, y: baseY + offset, z: baseZ + radius },
      { x: baseX - offset, y: baseY + offset, z: baseZ + radius },
      { x: baseX + offset, y: baseY - offset, z: baseZ - radius },
      { x: baseX - offset, y: baseY - offset, z: baseZ - radius },
      // More altitude with small offset
      { x: baseX + offset * 0.5, y: baseY, z: baseZ + radius * 3 },
      { x: baseX - offset * 0.5, y: baseY, z: baseZ - radius * 3 },
      { x: baseX, y: baseY + offset * 0.5, z: baseZ + radius * 3 },
      { x: baseX, y: baseY - offset * 0.5, z: baseZ - radius * 3 },
    ];
    
    for (const v of variations) {
      // Check bounds (tight bounds to keep cards close)
      if (v.x < -10 || v.x > 10) continue;
      if (v.y < -8 || v.y > 8) continue;
      if (v.z < 60 || v.z > 140) continue;
      
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
  
  // Fallback with random small offset
  for (let attempt = 0; attempt < 100; attempt++) {
    const rx = roundTo(baseX + (Math.random() - 0.5) * 6, POSITION_PRECISION);
    const ry = roundTo(baseY + (Math.random() - 0.5) * 4, POSITION_PRECISION);
    const rz = roundTo(baseZ + (Math.random() - 0.5) * 40, POSITION_PRECISION);
    const rKey = positionKey(rx, ry, rz);
    if (!occupiedPositions.has(rKey)) {
      return { x: rx, y: ry, z: rz };
    }
  }
  
  // Last resort
  return { x: roundTo(baseX, POSITION_PRECISION), y: roundTo(baseY, POSITION_PRECISION), z: roundTo(baseZ + Math.random() * 20, POSITION_PRECISION) };
}

// Assign unique orbital positions to all nodes
// Cards from same region stay CLOSE together
function assignOrbitalPositions(nodes) {
  const occupiedPositions = new Set();
  const results = [];
  
  // Group nodes by region
  const regionGroups = {};
  for (const node of nodes) {
    const region = getRegion(node);
    if (!regionGroups[region]) regionGroups[region] = [];
    regionGroups[region].push(node);
  }
  
  // Process each region - sort by historical weight within region
  for (const [region, regionNodes] of Object.entries(regionGroups)) {
    const base = REGION_BASE[region] || REGION_BASE.default;
    
    // Sort by importance (most important gets base position)
    regionNodes.sort((a, b) => (b.historical_weight || 0.5) - (a.historical_weight || 0.5));
    
    for (const node of regionNodes) {
      const position = findAvailablePosition(base.x, base.y, base.z, occupiedPositions);
      
      // Mark position as occupied
      occupiedPositions.add(positionKey(position.x, position.y, position.z));
      
      results.push({
        nodeId: node.id,
        orbital_position: {
          x_inclination: position.x,
          y_inclination: position.y,
          z_altitude: position.z,
          // Legacy fields for visualization
          x: position.x * 8,   // Scale for 3D view
          y: position.y * 10,  // Scale for 3D view
          z: (position.z - 100) * 1.5,  // Center and scale
          altitude: position.z,
        }
      });
    }
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
