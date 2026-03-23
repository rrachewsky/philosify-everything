// ============================================================
// TIER 2: LLM EXTRACTOR (GEMINI FREE TIER)
// Runs as async background sweep via Cloudflare Cron Trigger.
// Does NOT run on the analysis write path.
// ============================================================

import { getSecret } from '../utils/secrets.js';
import { findPhilosopherByVariant, canonicalizeName } from './philosopher-dictionary.js';

// The extraction prompt
const EXTRACTION_PROMPT = `You are a philosophical knowledge extraction system for Philosify, a platform that analyzes cultural content through the lens of philosophical principles.

Given the following analysis text, extract structured philosophical knowledge.

Return a JSON object with these fields:

{
  "philosopher_mentions": [
    {
      "name": "Philosopher's name",
      "context": "How they are referenced — what idea of theirs is invoked",
      "relevance": "direct_reference | concept_invocation | historical_parallel | opposition_cited",
      "confidence": 0.0-1.0
    }
  ],
  "philosophical_concepts": [
    {
      "concept": "Name of the concept (e.g., 'categorical imperative', 'tabula rasa', 'dialectical materialism')",
      "philosopher": "Which philosopher originated it (if identifiable)",
      "how_used": "How the analysis applies this concept",
      "confidence": 0.0-1.0
    }
  ],
  "causal_chains": [
    {
      "chain": ["Philosopher A", "Event/Idea B", "Philosopher C", "Modern Consequence D"],
      "description": "One sentence describing the causal flow",
      "primary_battle": "reason_faith | reality_mysticism | individual_collective | freedom_coercion | value_nihilism | market_planning | beauty_chaos | good_evil"
    }
  ],
  "historical_events": [
    {
      "event": "Name of the event",
      "year": approximate year (negative for BC),
      "relevance": "How this event connects to the analysis"
    }
  ],
  "new_thinkers": [
    {
      "name": "Name of a philosopher/thinker not in the standard Western/Eastern canon but mentioned in the analysis",
      "birth_year": approximate,
      "tradition": "western | chinese | indian | islamic | other",
      "significance": "Why they matter to this analysis"
    }
  ]
}

RULES:
- Extract ONLY what is actually present or strongly implied in the text. Do not invent connections.
- For philosopher_mentions, only include philosophers who are actually referenced or whose ideas are clearly invoked.
- For causal_chains, only include chains where the analysis explicitly or clearly implies the causal flow.
- Confidence: 0.9+ for explicit mentions, 0.6-0.8 for implied references, below 0.6 for speculative.
- Return valid JSON only. No markdown, no preamble, no explanation outside the JSON.`;

/**
 * Get analysis text from different table types.
 */
function getAnalysisTextFromRecord(record, analysisType) {
  const textFields = [];
  
  if (record.philosophical_analysis) textFields.push(record.philosophical_analysis);
  if (record.summary) textFields.push(record.summary);
  if (record.historical_context) textFields.push(record.historical_context);
  if (record.schools_of_thought) textFields.push(record.schools_of_thought);
  if (record.creative_process) textFields.push(record.creative_process);
  
  // Handle metadata fields (news stores content here)
  if (record.metadata) {
    if (record.metadata.the_facts) textFields.push(record.metadata.the_facts);
    if (record.metadata.source_analysis) textFields.push(record.metadata.source_analysis);
    if (record.metadata.hits_and_misses) textFields.push(record.metadata.hits_and_misses);
    if (record.metadata.philosify_opinion) textFields.push(record.metadata.philosify_opinion);
  }
  
  return textFields.filter(Boolean).join('\n\n');
}

/**
 * Fetch analysis record from appropriate table.
 */
async function fetchAnalysis(supabaseUrl, supabaseKey, analysisId, analysisType) {
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  
  let table = 'analyses';
  if (analysisType === 'literature') table = 'book_analyses';
  else if (analysisType === 'cinema') table = 'film_analyses';
  // music and news both use 'analyses' table
  
  const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${analysisId}&select=*`;
  const res = await fetch(url, { headers });
  
  if (!res.ok) return null;
  
  const data = await res.json();
  return data[0] || null;
}

/**
 * Call Gemini for extraction.
 */
async function callGeminiExtraction(env, text) {
  const apiKey = await getSecret(env.GEMINI_API_KEY);
  if (!apiKey) {
    console.error('[ConstellationLLM] No Gemini API key');
    return null;
  }
  
  // Truncate to stay within free-tier TPM limits (~30K tokens)
  const truncated = text.substring(0, 100000);
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${EXTRACTION_PROMPT}\n\n---\n\nANALYSIS TEXT:\n\n${truncated}`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,   // low temperature for factual extraction
          maxOutputTokens: 4096,
        }
      })
    }
  );
  
  if (response.status === 429) {
    console.warn('[ConstellationLLM] Gemini rate limited, will retry on next sweep');
    return null;
  }
  
  if (!response.ok) {
    console.error(`[ConstellationLLM] Gemini error: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!textResponse) {
    console.error('[ConstellationLLM] Empty Gemini response');
    return null;
  }
  
  try {
    // Clean up common issues
    const cleaned = textResponse
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('[ConstellationLLM] Failed to parse Gemini response:', e.message);
    console.log('[ConstellationLLM] Raw response:', textResponse.substring(0, 500));
    return null;
  }
}

/**
 * Process LLM extraction results into database.
 */
async function processLLMExtraction(supabaseUrl, supabaseKey, extraction, record) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  
  let concepts = 0, edges = 0;
  
  // 1. Process philosopher mentions → analysis links
  if (extraction.philosopher_mentions && Array.isArray(extraction.philosopher_mentions)) {
    for (const mention of extraction.philosopher_mentions) {
      const node = findPhilosopherByVariant(mention.name);
      if (!node) continue;
      
      const linkRes = await fetch(`${supabaseUrl}/rest/v1/constellation_analysis_links`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          analysis_id: record.analysis_id,
          analysis_type: record.analysis_type,
          node_id: node.node_id,
          mention_type: mention.relevance || 'direct_reference',
          evidence_text: (mention.context || '').substring(0, 2000),
          confidence: mention.confidence || 0.7,
          extraction_tier: 'llm',
        }),
      });
      
      if (linkRes.ok || linkRes.status === 409) {
        concepts++;
      }
    }
  }
  
  // 2. Process causal chains → edge candidates
  if (extraction.causal_chains && Array.isArray(extraction.causal_chains)) {
    for (const chain of extraction.causal_chains) {
      if (!chain.chain || chain.chain.length < 2) continue;
      
      for (let i = 0; i < chain.chain.length - 1; i++) {
        const sourceNode = findPhilosopherByVariant(chain.chain[i]);
        const targetNode = findPhilosopherByVariant(chain.chain[i + 1]);
        
        if (sourceNode && targetNode && sourceNode.node_id !== targetNode.node_id) {
          const edgeRes = await fetch(`${supabaseUrl}/rest/v1/constellation_edge_candidates`, {
            method: 'POST',
            headers: { ...headers, Prefer: 'return=minimal' },
            body: JSON.stringify({
              source_node_id: sourceNode.node_id,
              target_node_id: targetNode.node_id,
              relationship_type: 'influence',
              primary_battle: chain.primary_battle || null,
              weight: 0.6,
              description: (chain.description || '').substring(0, 200),
              evidence_text: (chain.description || '').substring(0, 2000),
              analysis_id: record.analysis_id,
              analysis_type: record.analysis_type,
              extraction_tier: 'llm',
              confidence: 0.8,
              status: 'pending',
            }),
          });
          
          if (edgeRes.ok) edges++;
        }
      }
    }
  }
  
  // 3. Process new thinkers → node candidates
  if (extraction.new_thinkers && Array.isArray(extraction.new_thinkers)) {
    for (const thinker of extraction.new_thinkers) {
      if (!thinker.name) continue;
      
      const canonical = canonicalizeName(thinker.name);
      
      // Check if already known
      if (findPhilosopherByVariant(thinker.name)) continue;
      
      await fetch(`${supabaseUrl}/rest/v1/constellation_node_candidates`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          name: thinker.name,
          canonical_name: canonical,
          birth_year: thinker.birth_year || null,
          tradition: thinker.tradition || null,
          evidence_text: (thinker.significance || '').substring(0, 2000),
          analysis_id: record.analysis_id,
          analysis_type: record.analysis_type,
          extraction_tier: 'llm',
          confidence: 0.7,
          status: 'pending',
        }),
      }).catch(() => {}); // Ignore conflicts
    }
  }
  
  return { concepts, edges };
}

/**
 * Log extraction result.
 */
async function logExtraction(supabaseUrl, supabaseKey, record, status, concepts, edges, errorMsg = null) {
  await fetch(`${supabaseUrl}/rest/v1/constellation_extraction_log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      analysis_id: record.analysis_id,
      analysis_type: record.analysis_type,
      extraction_tier: 'llm',
      status,
      concepts_found: concepts || 0,
      edges_found: edges || 0,
      error_message: errorMsg ? errorMsg.substring(0, 500) : null,
    }),
  }).catch(e => console.error('[ConstellationLLM] Log error:', e.message));
}

/**
 * Tier 2: LLM-based extraction sweep.
 * Runs as a Cloudflare Cron Trigger.
 * Processes analyses that have Tier 1 but not Tier 2 extraction.
 * 
 * @param {Object} env - Cloudflare environment
 * @returns {Object} { processed: number, success: number, failed: number }
 */
export async function sweepLLMExtraction(env) {
  const results = { processed: 0, success: 0, failed: 0 };
  
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[ConstellationLLM] No Supabase credentials');
    return results;
  }
  
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  
  // Find analyses that have Tier 1 but not Tier 2 extraction
  // Using a JOIN via REST API is tricky, so we'll do two queries
  const tier1Res = await fetch(
    `${supabaseUrl}/rest/v1/constellation_extraction_log?extraction_tier=eq.rule_based&status=eq.completed&order=extracted_at.asc&limit=50&select=analysis_id,analysis_type`,
    { headers }
  );
  
  if (!tier1Res.ok) {
    console.error('[ConstellationLLM] Failed to fetch Tier 1 logs');
    return results;
  }
  
  const tier1Records = await tier1Res.json();
  
  // Find which ones already have Tier 2
  const tier2Res = await fetch(
    `${supabaseUrl}/rest/v1/constellation_extraction_log?extraction_tier=eq.llm&select=analysis_id,analysis_type`,
    { headers }
  );
  
  const tier2Records = tier2Res.ok ? await tier2Res.json() : [];
  const tier2Set = new Set(tier2Records.map(r => `${r.analysis_id}:${r.analysis_type}`));
  
  // Filter to only unprocessed
  const unprocessed = tier1Records.filter(r => !tier2Set.has(`${r.analysis_id}:${r.analysis_type}`));
  
  console.log(`[ConstellationLLM] Found ${unprocessed.length} analyses for Tier 2 extraction`);
  
  // Process up to 10 per sweep (free tier rate limits)
  const toProcess = unprocessed.slice(0, 10);
  
  for (const record of toProcess) {
    results.processed++;
    
    try {
      // Fetch the full analysis
      const analysis = await fetchAnalysis(supabaseUrl, supabaseKey, record.analysis_id, record.analysis_type);
      
      if (!analysis) {
        await logExtraction(supabaseUrl, supabaseKey, record, 'failed', 0, 0, 'Analysis not found');
        results.failed++;
        continue;
      }
      
      const fullText = getAnalysisTextFromRecord(analysis, record.analysis_type);
      
      // Skip if text is too short
      if (fullText.length < 200) {
        await logExtraction(supabaseUrl, supabaseKey, record, 'skipped', 0, 0, 'Text too short');
        continue;
      }
      
      // Call Gemini
      const extraction = await callGeminiExtraction(env, fullText);
      
      if (!extraction) {
        await logExtraction(supabaseUrl, supabaseKey, record, 'failed', 0, 0, 'Gemini returned no result');
        results.failed++;
        continue;
      }
      
      // Process results
      const stats = await processLLMExtraction(supabaseUrl, supabaseKey, extraction, record);
      await logExtraction(supabaseUrl, supabaseKey, record, 'completed', stats.concepts, stats.edges);
      
      results.success++;
      console.log(`[ConstellationLLM] Processed ${record.analysis_id}: ${stats.concepts} concepts, ${stats.edges} edges`);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`[ConstellationLLM] Error processing ${record.analysis_id}:`, error.message);
      await logExtraction(supabaseUrl, supabaseKey, record, 'failed', 0, 0, error.message);
      results.failed++;
    }
  }
  
  console.log(`[ConstellationLLM] Sweep complete: ${results.processed} processed, ${results.success} success, ${results.failed} failed`);
  return results;
}

export default sweepLLMExtraction;
