// ============================================================
// HISTORY GRAPH HANDLER
// 3D Philosophy-History Force Graph API
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getSecret } from "../utils/secrets.js";

// Node colors by type
const NODE_COLORS = {
  philosopher: '#D6158C',    // magenta
  event:       '#89CFF0',    // baby blue
  concept:     '#F2F2F5',    // warm gray
  era:         '#FAFAFB',    // cool white
  content:     '#F4C430',    // gold
  battle:      '#FF4444'     // red
};

// Battle dimension colors
const BATTLE_COLORS = {
  'reality_vs_mysticism':          '#FF6B35',
  'reason_vs_faith':               '#FF4444',
  'individualism_vs_collectivism': '#D6158C',
  'freedom_vs_coercion':           '#FF8C00',
  'value_creation_vs_nihilism':    '#FFD700',
  'free_market_vs_planning':       '#89CFF0',
  'beauty_vs_chaos':               '#C084FC',
  'good_vs_evil':                  '#FF0000',
  // Non-battle relation colors
  'influenced':                    'rgba(214,21,140,0.4)',
  'caused':                        'rgba(137,207,240,0.4)',
  'responded_to':                  'rgba(242,242,245,0.4)',
  'derived_from':                  'rgba(244,196,48,0.4)',
  'applied_in':                    'rgba(255,255,255,0.25)',
  'fulfills_legacy_of':            'rgba(0,255,136,0.25)',
  'opposes_legacy_of':             'rgba(255,68,68,0.25)',
  'transmitted':                   'rgba(137,207,240,0.55)',
  'synthesized':                   'rgba(192,132,252,0.4)',
  'contradicted':                  'rgba(255,0,0,0.6)'
};

/**
 * Convert year to Z coordinate for 3D graph
 * Maps year: -600 BC = -600, 2026 AD = 2026
 */
function yearToZ(year) {
  return year || 0;
}

/**
 * Calculate node value (visual size) based on type and weight
 */
function nodeVal(node) {
  if (node.type === 'era') return 12;
  if (node.type === 'battle') return 10;
  if (node.weight === 'maximum') return 8;
  if (node.weight === 'high') return 6;
  if (node.weight === 'minor') return 2;
  return 4; // standard
}

/**
 * Build graph data from Supabase tables
 */
async function buildGraphData(env) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };

  // Fetch nodes and edges in parallel
  const [nodesRes, edgesRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/graph_nodes?active=eq.true&select=*`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/graph_edges?select=*`, { headers }),
  ]);

  if (!nodesRes.ok) {
    const err = await nodesRes.text();
    throw new Error(`Failed to fetch graph_nodes: ${nodesRes.status} - ${err}`);
  }
  if (!edgesRes.ok) {
    const err = await edgesRes.text();
    throw new Error(`Failed to fetch graph_edges: ${edgesRes.status} - ${err}`);
  }

  const nodes = await nodesRes.json();
  const edges = await edgesRes.json();

  return {
    nodes: nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      era: n.era,
      years: n.years,
      description: n.description,
      tradition: n.tradition,
      weight: n.weight,
      val: nodeVal(n),
      color: NODE_COLORS[n.type] || '#FFFFFF',
      fx: null,
      fy: null,
      fz: yearToZ(n.year_numeric),
    })),
    links: edges.map(e => ({
      source: e.source_id,
      target: e.target_id,
      relation: e.relation,
      label: e.label,
      battle_dimension: e.battle_dimension,
      weight: e.weight,
      color: e.battle_dimension
        ? BATTLE_COLORS[e.battle_dimension]
        : BATTLE_COLORS[e.relation] || 'rgba(255,255,255,0.3)',
    })),
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Refresh graph cache in the background
 */
async function refreshGraphCache(env) {
  try {
    console.log('[HistoryGraph] Refreshing graph cache...');
    const data = await buildGraphData(env);
    await env.PHILOSIFY_KV.put('history:v1:graph', JSON.stringify(data), { expirationTtl: 7200 });
    console.log('[HistoryGraph] Graph cache refreshed successfully');
  } catch (err) {
    console.error('[HistoryGraph] Cache refresh failed:', err.message);
  }
}

/**
 * GET /api/history/graph
 * Returns the full graph data for visualization
 */
export async function handleHistoryGraph(request, env, origin, ctx) {
  try {
    // Check KV cache first
    const cached = await env.PHILOSIFY_KV.get('history:v1:graph', 'json');
    
    if (cached) {
      // Background refresh if older than 1 hour
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age > 3600000 && ctx?.waitUntil) {
        ctx.waitUntil(refreshGraphCache(env));
      }
      return jsonResponse(cached, 200, origin, env);
    }

    // Build from Supabase if not cached
    const data = await buildGraphData(env);
    await env.PHILOSIFY_KV.put('history:v1:graph', JSON.stringify(data), { expirationTtl: 7200 });
    
    return jsonResponse(data, 200, origin, env);
  } catch (error) {
    console.error('[HistoryGraph] Error:', error.message);
    return jsonResponse({ error: 'Failed to load graph data' }, 500, origin, env);
  }
}

/**
 * POST /api/history/graph/extract
 * Auto-extraction from analyses (internal use)
 * Silently extracts graph entities from completed analyses
 */
export async function handleHistoryExtract(request, env, origin) {
  try {
    const { analysisId, title, source, content, mediaType } = await request.json();

    if (!analysisId || !content) {
      return jsonResponse({ error: 'Missing required fields' }, 400, origin, env);
    }

    const prompt = `
You are extracting structured graph data from a philosophical analysis for a knowledge graph spanning 2,600 years of intellectual history.

ANALYSIS: "${title}" by ${source}
CONTENT: ${content.substring(0, 3000)}

Extract ONLY entities explicitly mentioned. Return JSON:
{
  "nodes": [
    {
      "id": "type_name_slug",
      "label": "Display Name",
      "type": "philosopher|event|concept|era",
      "tradition": "western|chinese|indian|islamic|universal",
      "era": "time period name",
      "years": "year or range e.g. 384-322 BC",
      "year_numeric": -384,
      "weight": "maximum|high|standard|minor",
      "description": "2-3 sentence historically accurate description"
    }
  ],
  "links": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "relation": "influenced|caused|responded_to|derived_from|applied_in|fulfills_legacy_of|opposes_legacy_of|transmitted|synthesized",
      "battle_dimension": "reality_vs_mysticism|reason_vs_faith|individualism_vs_collectivism|freedom_vs_coercion|value_creation_vs_nihilism|free_market_vs_planning|beauty_vs_chaos|good_vs_evil|null",
      "label": "2-3 sentence explanation of this connection and its battle dimension if applicable",
      "weight": 0.1-1.0
    }
  ]
}

CHRONOLOGICAL RULE — CRITICAL: edges must only flow forward in time. source.year must be earlier than or equal to target.year. Never create an edge where a later thinker influences an earlier one.

WEIGHT RULE: assign weight proportional to actual historical importance. Aristotle, Kant, Confucius, Buddha = maximum. Most others = standard.

BATTLE RULE: only assign a battle_dimension when the connection is genuinely a philosophical opposition or defense on that dimension. Not every edge is a battle.

Ayn Rand and Objectivism are valid nodes — include them when mentioned.

Maximum 5 nodes and 6 links. Return valid JSON only, no markdown.
`;

    // Call Claude Haiku for fast extraction
    const anthropicKey = await getSecret(env.ANTHROPIC_API_KEY);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[HistoryGraph] Claude extraction failed:', err);
      return jsonResponse({ success: true, extracted: 0 }, 200, origin, env); // Fail silently
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '';
    
    // Parse JSON from response
    let extracted;
    try {
      // Find JSON in response (may be wrapped in markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      extracted = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('[HistoryGraph] JSON parse failed:', parseErr.message);
      return jsonResponse({ success: true, extracted: 0 }, 200, origin, env); // Fail silently
    }

    // Add content node for the analysis itself
    const contentNode = {
      id: `content_${analysisId}`,
      label: title.substring(0, 60),
      type: 'content',
      tradition: 'universal',
      era: 'Contemporary',
      years: new Date().getFullYear().toString(),
      year_numeric: new Date().getFullYear(),
      weight: 'minor',
      description: `Philosify ${mediaType} analysis: ${title}`,
      active: true,
      is_seed: false,
    };

    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
    
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    };

    // Upsert nodes
    const allNodes = [...(extracted.nodes || []), contentNode];
    let nodesUpserted = 0;
    
    for (const node of allNodes) {
      try {
        const nodeData = {
          id: node.id,
          label: node.label,
          type: node.type,
          tradition: node.tradition || 'universal',
          era: node.era,
          years: node.years,
          year_numeric: node.year_numeric,
          weight: node.weight || 'standard',
          description: node.description,
          active: true,
          is_seed: false,
        };
        
        const res = await fetch(`${supabaseUrl}/rest/v1/graph_nodes`, {
          method: 'POST',
          headers,
          body: JSON.stringify(nodeData),
        });
        
        if (res.ok || res.status === 409) nodesUpserted++;
      } catch (e) {
        console.error(`[HistoryGraph] Node upsert failed for ${node.id}:`, e.message);
      }
    }

    // Build node map for chronology validation
    const nodeMap = {};
    allNodes.forEach(n => { nodeMap[n.id] = n; });

    // Upsert edges (with chronology validation)
    let edgesUpserted = 0;
    
    for (const link of (extracted.links || [])) {
      try {
        const src = nodeMap[link.source];
        const tgt = nodeMap[link.target];
        
        // Skip anachronistic edges (later source influencing earlier target)
        if (src && tgt && src.year_numeric > tgt.year_numeric) {
          console.log(`[HistoryGraph] Skipping anachronistic edge: ${link.source} -> ${link.target}`);
          continue;
        }
        
        const edgeData = {
          source_id: link.source,
          target_id: link.target,
          relation: link.relation,
          battle_dimension: link.battle_dimension || null,
          label: link.label,
          weight: link.weight || 1.0,
          analysis_id: analysisId,
          is_seed: false,
        };
        
        const res = await fetch(`${supabaseUrl}/rest/v1/graph_edges`, {
          method: 'POST',
          headers,
          body: JSON.stringify(edgeData),
        });
        
        if (res.ok || res.status === 409) edgesUpserted++;
      } catch (e) {
        console.error(`[HistoryGraph] Edge upsert failed:`, e.message);
      }
    }

    // Invalidate cache so next request gets fresh data
    await env.PHILOSIFY_KV.delete('history:v1:graph');

    console.log(`[HistoryGraph] Extracted ${nodesUpserted} nodes, ${edgesUpserted} edges from analysis ${analysisId}`);
    
    return jsonResponse({ success: true, nodesUpserted, edgesUpserted }, 200, origin, env);
  } catch (error) {
    // NEVER throw — extraction failure must never block analysis delivery
    console.error('[HistoryGraph] Extraction failed silently:', error.message);
    return jsonResponse({ success: true, extracted: 0 }, 200, origin, env);
  }
}

/**
 * Refresh graph cache (called by cron)
 */
export { refreshGraphCache };
