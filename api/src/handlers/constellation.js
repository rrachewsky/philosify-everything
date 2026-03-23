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

// Calculate orbital position based on battle scores and tradition
function calculateOrbitalPosition(node) {
  const battles = node.battles || {};
  
  // Y position: weighted average of battle scores
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
  const eraDepth = ((node.birth_year + 600) / 2626) * 60 - 30;
  const z = eraDepth + (hashString(node.name) % 20) - 10;
  
  // Altitude: base + bonus for historical weight
  const BASE_ALTITUDE = 130;
  const ALTITUDE_BONUS = 40;
  const altitude = BASE_ALTITUDE + (node.historical_weight || 0.5) * ALTITUDE_BONUS;
  
  return { x, y, z, altitude };
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

    // Calculate orbital positions and add enrichment metadata
    const nodesWithPositions = SEED_NODES.map(node => {
      const mentionCount = mentionCounts[node.id] || 0;
      
      // Boost historical weight based on mention count
      const boostedWeight = Math.min(1.0, (node.historical_weight || 0.5) + mentionCount * 0.01);
      
      return {
        ...node,
        orbital_position: calculateOrbitalPosition({ ...node, historical_weight: boostedWeight }),
        mention_count: mentionCount,
        auto_enriched: mentionCount > 0,
        source_type: 'seed',
      };
    });

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
