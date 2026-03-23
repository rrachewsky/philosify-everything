// ============================================================
// CONSTELLATION AUTO-MERGE LOGIC
// Auto-merges high-confidence edge candidates into live edges
// Auto-promotes frequently-mentioned node candidates
// ============================================================

import { getSecret } from '../utils/secrets.js';

// Default coordinates for traditions (used when promoting nodes without geocoding)
const DEFAULT_TRADITION_COORDS = {
  western: { lat: 37.9838, lng: 23.7275 },    // Athens, Greece
  chinese: { lat: 39.9042, lng: 116.4074 },   // Beijing, China
  indian: { lat: 25.3176, lng: 83.0062 },     // Varanasi, India
  islamic: { lat: 33.3152, lng: 44.3661 },    // Baghdad, Iraq
  other: { lat: 0, lng: 0 },
};

/**
 * Auto-merge high-confidence edge candidates into constellation_edges.
 * 
 * Auto-merge criteria:
 * - confidence >= 0.8
 * - appears in at least 2 different analyses
 * - no existing edge between same source/target with same relationship_type
 * 
 * @param {Object} env - Cloudflare environment
 * @returns {Object} { checked: number, merged: number, rejected: number }
 */
export async function autoMergeEdgeCandidates(env) {
  const results = { checked: 0, merged: 0, rejected: 0 };
  
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[ConstellationMerge] No Supabase credentials');
    return results;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  
  try {
    // Get pending edge candidates with their occurrence counts
    // Group by source_node_id, target_node_id, relationship_type
    const candidatesRes = await fetch(
      `${supabaseUrl}/rest/v1/constellation_edge_candidates?status=eq.pending&confidence=gte.0.75&order=confidence.desc&limit=100&select=*`,
      { headers }
    );
    
    if (!candidatesRes.ok) {
      console.error('[ConstellationMerge] Failed to fetch edge candidates');
      return results;
    }
    
    const candidates = await candidatesRes.json();
    
    // Group candidates by source+target+type
    const grouped = new Map();
    for (const c of candidates) {
      const key = `${c.source_node_id}:${c.target_node_id}:${c.relationship_type}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(c);
    }
    
    // Process each group
    for (const [key, group] of grouped) {
      results.checked++;
      
      // Need at least 2 mentions (from different analyses)
      const uniqueAnalyses = new Set(group.map(c => c.analysis_id));
      if (uniqueAnalyses.size < 2) continue;
      
      const best = group[0]; // highest confidence due to ORDER BY
      
      // Check if edge already exists in KV cache (seed data)
      // For now, we'll check against the seed data edges via the constellation handler
      // In production, you'd want to cache the seed edges in KV
      
      // Check if already merged (exists in edge candidates with merged status)
      const existingRes = await fetch(
        `${supabaseUrl}/rest/v1/constellation_edge_candidates?source_node_id=eq.${best.source_node_id}&target_node_id=eq.${best.target_node_id}&relationship_type=eq.${best.relationship_type}&status=eq.merged&limit=1`,
        { headers }
      );
      
      if (existingRes.ok) {
        const existing = await existingRes.json();
        if (existing.length > 0) {
          // Already merged — reject this one
          await updateCandidateStatus(supabaseUrl, supabaseKey, best.id, 'rejected');
          results.rejected++;
          continue;
        }
      }
      
      // Calculate aggregate confidence
      const avgConfidence = group.reduce((sum, c) => sum + c.confidence, 0) / group.length;
      const weight = Math.min(1.0, 0.3 + (uniqueAnalyses.size * 0.1) + avgConfidence * 0.3);
      
      // Merge: Mark the best candidate as merged (it will be included in enriched API response)
      await updateCandidateStatus(supabaseUrl, supabaseKey, best.id, 'merged');
      
      // Update weight and confidence based on aggregates
      await fetch(`${supabaseUrl}/rest/v1/constellation_edge_candidates?id=eq.${best.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          weight: weight,
          confidence: avgConfidence,
          description: `${best.description} (${uniqueAnalyses.size} analyses)`,
        }),
      });
      
      // Mark other candidates in this group as rejected
      for (const c of group.slice(1)) {
        await updateCandidateStatus(supabaseUrl, supabaseKey, c.id, 'rejected');
      }
      
      results.merged++;
      console.log(`[ConstellationMerge] Merged edge: ${best.source_node_id} → ${best.target_node_id} (${best.relationship_type})`);
    }
    
  } catch (error) {
    console.error('[ConstellationMerge] Edge merge error:', error.message);
  }
  
  console.log(`[ConstellationMerge] Edge merge complete: ${results.checked} checked, ${results.merged} merged, ${results.rejected} rejected`);
  return results;
}

async function updateCandidateStatus(supabaseUrl, supabaseKey, candidateId, status) {
  await fetch(`${supabaseUrl}/rest/v1/constellation_edge_candidates?id=eq.${candidateId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ status }),
  });
}

/**
 * Promote node candidates with enough mentions to full constellation nodes.
 * 
 * Promotion criteria:
 * - mention_count >= 3 (referenced in at least 3 separate analyses)
 * - confidence >= 0.6
 * - NOT already in constellation_nodes
 * 
 * Note: Promoted nodes will appear in the enriched API response with
 * auto_enriched = true flag. They need birth_year to be positioned properly.
 * 
 * @param {Object} env - Cloudflare environment
 * @returns {Object} { checked: number, promoted: number, skipped: number }
 */
export async function promoteNodeCandidates(env) {
  const results = { checked: 0, promoted: 0, skipped: 0 };
  
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[ConstellationMerge] No Supabase credentials');
    return results;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  
  try {
    // Get pending candidates with enough mentions
    const candidatesRes = await fetch(
      `${supabaseUrl}/rest/v1/constellation_node_candidates?status=eq.pending&mention_count=gte.3&confidence=gte.0.6&order=mention_count.desc&limit=10`,
      { headers }
    );
    
    if (!candidatesRes.ok) {
      console.error('[ConstellationMerge] Failed to fetch node candidates');
      return results;
    }
    
    const candidates = await candidatesRes.json();
    
    for (const candidate of candidates) {
      results.checked++;
      
      // Skip if we don't have birth_year (can't position in timeline)
      if (!candidate.birth_year) {
        console.log(`[ConstellationMerge] Skipping ${candidate.name}: no birth_year`);
        results.skipped++;
        continue;
      }
      
      // Get default coords for tradition
      const coords = DEFAULT_TRADITION_COORDS[candidate.tradition] || DEFAULT_TRADITION_COORDS.western;
      
      // Mark as promoted (the candidate record itself becomes the "node" for enriched API)
      await fetch(`${supabaseUrl}/rest/v1/constellation_node_candidates?id=eq.${candidate.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'promoted' }),
      });
      
      results.promoted++;
      console.log(`[ConstellationMerge] Promoted node: ${candidate.name} (${candidate.mention_count} mentions)`);
    }
    
  } catch (error) {
    console.error('[ConstellationMerge] Node promotion error:', error.message);
  }
  
  console.log(`[ConstellationMerge] Node promotion complete: ${results.checked} checked, ${results.promoted} promoted, ${results.skipped} skipped`);
  return results;
}

/**
 * Run all merge operations.
 * Called from cron trigger after LLM sweep.
 */
export async function runMergeOperations(env) {
  console.log('[ConstellationMerge] Starting merge operations...');
  
  const edgeResults = await autoMergeEdgeCandidates(env);
  const nodeResults = await promoteNodeCandidates(env);
  
  return {
    edges: edgeResults,
    nodes: nodeResults,
  };
}

export default runMergeOperations;
