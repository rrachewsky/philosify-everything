// ============================================================
// TIER 1: RULE-BASED EXTRACTOR
// Runs synchronously on every new analysis at write time.
// Zero API calls. Pure pattern matching. Graph grows immediately.
// ============================================================

import {
  buildPhilosopherRegex,
  findPhilosopherByVariant,
  canonicalizeName,
  PROPER_NAME_STOPWORDS,
} from './philosopher-dictionary.js';
import { getSecret } from '../utils/secrets.js';

// Historical event patterns
const HISTORICAL_EVENT_PATTERNS = [
  { re: /\b(French Revolution|Industrial Revolution|Russian Revolution|American Revolution|Renaissance|Enlightenment|Reformation|Dark Ages|Golden Age|Axial Age|World War [I1]|World War [II2]|Cold War|Scientific Revolution)\b/gi, type: 'historical_event' },
  { re: /\b(\d{1,2}(?:st|nd|rd|th)\s+century)\b/gi, type: 'time_period' },
  { re: /\bin\s+(\d{3,4})\s*(?:BC|AD|CE|BCE)?\b/gi, type: 'date_reference' },
];

// Causal language patterns (for edge candidates)
const CAUSAL_PATTERNS = [
  // "X influenced Y", "X was influenced by Y"
  { re: /(\w[\w\s'-]{2,40})\s+(?:influenced|inspired|shaped|affected)\s+(?:by\s+)?(\w[\w\s'-]{2,40})/gi, type: 'influence' },
  // "X built on Y's ideas", "X extended Y"  
  { re: /(\w[\w\s'-]{2,40})\s+(?:built on|extended|developed|expanded|continued)\s+(\w[\w\s'-]{2,40})(?:'s)?/gi, type: 'influence' },
  // "X opposed Y", "X rejected Y", "X contradicted Y"
  { re: /(\w[\w\s'-]{2,40})\s+(?:opposed|rejected|contradicted|challenged|refuted|attacked|criticized|critiqued)\s+(\w[\w\s'-]{2,40})/gi, type: 'opposition' },
  // "X led to Y", "X resulted in Y", "X caused Y"
  { re: /(\w[\w\s'-]{2,40})\s+(?:led to|resulted in|caused|produced|gave rise to)\s+(\w[\w\s'-]{2,40})/gi, type: 'influence' },
  // "from X to Y" (intellectual lineage)
  { re: /from\s+(\w[\w\s'-]{2,40})\s+to\s+(\w[\w\s'-]{2,40})/gi, type: 'influence' },
  // "following X" / "preceded by X"
  { re: /(\w[\w\s'-]{2,40})\s+(?:followed|preceded|came after|came before)\s+(\w[\w\s'-]{2,40})/gi, type: 'influence' },
];

// Context window size for evidence extraction
const CONTEXT_WINDOW = 200;

/**
 * Extract surrounding context for evidence.
 * @param {string} text - Full text
 * @param {number} matchIndex - Start index of match
 * @param {number} matchLength - Length of match
 * @returns {string} - Context snippet
 */
function extractContext(text, matchIndex, matchLength) {
  const start = Math.max(0, matchIndex - CONTEXT_WINDOW);
  const end = Math.min(text.length, matchIndex + matchLength + CONTEXT_WINDOW);
  let context = text.substring(start, end).trim();
  
  // Add ellipsis if truncated
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';
  
  return context;
}

/**
 * Get analysis text fields based on analysis type.
 * @param {Object} analysis - The analysis record
 * @param {string} analysisType - Type of analysis
 * @returns {string} - Concatenated text
 */
function getAnalysisText(analysis, analysisType) {
  // Different analysis types store text in different fields
  const textFields = [];
  
  // Common fields across all types
  if (analysis.philosophical_analysis) textFields.push(analysis.philosophical_analysis);
  if (analysis.summary) textFields.push(analysis.summary);
  if (analysis.historical_context) textFields.push(analysis.historical_context);
  if (analysis.schools_of_thought) textFields.push(analysis.schools_of_thought);
  
  // News-specific fields (stored in metadata)
  if (analysis.metadata) {
    if (analysis.metadata.the_facts) textFields.push(analysis.metadata.the_facts);
    if (analysis.metadata.source_analysis) textFields.push(analysis.metadata.source_analysis);
    if (analysis.metadata.hits_and_misses) textFields.push(analysis.metadata.hits_and_misses);
    if (analysis.metadata.philosify_opinion) textFields.push(analysis.metadata.philosify_opinion);
  }
  
  // Direct fields for news (if not in metadata)
  if (analysis.the_facts) textFields.push(analysis.the_facts);
  if (analysis.source_analysis) textFields.push(analysis.source_analysis);
  if (analysis.hits_and_misses) textFields.push(analysis.hits_and_misses);
  if (analysis.philosify_opinion) textFields.push(analysis.philosify_opinion);
  
  // Cinema/literature specific
  if (analysis.creative_process) textFields.push(analysis.creative_process);
  
  // Scorecard justifications
  if (analysis.ethics_analysis) textFields.push(analysis.ethics_analysis);
  if (analysis.metaphysics_analysis) textFields.push(analysis.metaphysics_analysis);
  if (analysis.epistemology_analysis) textFields.push(analysis.epistemology_analysis);
  if (analysis.politics_analysis) textFields.push(analysis.politics_analysis);
  if (analysis.aesthetics_analysis) textFields.push(analysis.aesthetics_analysis);
  
  return textFields.filter(Boolean).join('\n\n');
}

/**
 * Tier 1: Rule-based extraction from a completed Philosify analysis.
 * Runs synchronously at analysis write time. Zero API calls.
 * 
 * @param {Object} analysis - The completed analysis record (must have `id`)
 * @param {string} analysisType - 'music' | 'literature' | 'cinema' | 'news'
 * @param {Object} env - Cloudflare environment bindings
 * @returns {Object} { conceptLinks: number, edgeCandidates: number, nodeCandidates: number }
 */
export async function extractRuleBased(analysis, analysisType, env) {
  const results = { conceptLinks: 0, edgeCandidates: 0, nodeCandidates: 0 };
  
  if (!analysis?.id) {
    console.warn('[ConstellationExtract] No analysis ID provided');
    return results;
  }
  
  const philosopherRegex = buildPhilosopherRegex();
  const fullText = getAnalysisText(analysis, analysisType);
  
  if (!fullText || fullText.length < 50) {
    console.log('[ConstellationExtract] Text too short for extraction');
    return results;
  }
  
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[ConstellationExtract] Supabase credentials not available');
    return results;
  }

  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  try {
    // 1. Find philosopher mentions
    const mentions = new Map(); // node_id → { evidences: string[] }
    let match;
    
    // Reset regex lastIndex
    philosopherRegex.lastIndex = 0;
    
    while ((match = philosopherRegex.exec(fullText)) !== null) {
      const variant = match[1];
      const entry = findPhilosopherByVariant(variant);
      
      if (!entry) continue;
      
      // Extract surrounding context as evidence
      const evidence = extractContext(fullText, match.index, match[1].length);
      
      if (!mentions.has(entry.node_id)) {
        mentions.set(entry.node_id, { evidences: [] });
      }
      mentions.get(entry.node_id).evidences.push(evidence);
    }

    // 2. Write concept links to constellation_analysis_links
    for (const [nodeId, data] of mentions) {
      const bestEvidence = data.evidences[0]; // use first mention as primary evidence
      
      const linkRes = await fetch(`${supabaseUrl}/rest/v1/constellation_analysis_links`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          analysis_id: analysis.id,
          analysis_type: analysisType,
          node_id: nodeId,
          mention_type: 'direct_reference',
          evidence_text: bestEvidence.substring(0, 2000), // Limit size
          confidence: 0.9,
          extraction_tier: 'rule_based',
        }),
      });
      
      if (linkRes.ok || linkRes.status === 409) {
        results.conceptLinks++;
      } else {
        console.warn(`[ConstellationExtract] Failed to insert link: ${linkRes.status}`);
      }
    }

    // 3. Find causal language → edge candidates
    for (const pattern of CAUSAL_PATTERNS) {
      pattern.re.lastIndex = 0;
      
      while ((match = pattern.re.exec(fullText)) !== null) {
        const sourceName = match[1].trim();
        const targetName = match[2].trim();
        
        const sourcePhilosopher = findPhilosopherByVariant(sourceName);
        const targetPhilosopher = findPhilosopherByVariant(targetName);
        
        if (sourcePhilosopher && targetPhilosopher && sourcePhilosopher.node_id !== targetPhilosopher.node_id) {
          const evidence = extractContext(fullText, match.index, match[0].length);
          
          const edgeRes = await fetch(`${supabaseUrl}/rest/v1/constellation_edge_candidates`, {
            method: 'POST',
            headers: { ...headers, Prefer: 'return=minimal' },
            body: JSON.stringify({
              source_node_id: sourcePhilosopher.node_id,
              target_node_id: targetPhilosopher.node_id,
              relationship_type: pattern.type,
              weight: 0.5,
              description: match[0].substring(0, 100),
              evidence_text: evidence.substring(0, 2000),
              analysis_id: analysis.id,
              analysis_type: analysisType,
              extraction_tier: 'rule_based',
              confidence: 0.7,
              status: 'pending',
            }),
          });
          
          if (edgeRes.ok) {
            results.edgeCandidates++;
          }
        }
      }
    }

    // 4. Find philosopher names NOT in dictionary → node candidates
    // Look for proper names in philosophical context
    const unknownNameRe = /\b([A-Z][a-z]+(?:\s+(?:de|von|van|al-|ibn|el-|ben)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
    const knownVariants = new Set();
    
    // Build set of known variants
    for (const [_, entry] of Object.entries(mentions)) {
      // entry is { evidences: [] }, we need to check philosopher dict
    }
    
    // Get all known name variants from the dictionary
    const philosopherDict = await import('./philosopher-dictionary.js');
    const allIds = philosopherDict.getAllPhilosopherIds();
    for (const id of allIds) {
      const philo = philosopherDict.getPhilosopherById(id);
      if (philo?.variants) {
        philo.variants.forEach(v => knownVariants.add(v.toLowerCase()));
      }
    }
    
    unknownNameRe.lastIndex = 0;
    const seenCandidates = new Set();
    
    while ((match = unknownNameRe.exec(fullText)) !== null) {
      const name = match[1].trim();
      const canonical = canonicalizeName(name);
      
      // Skip if known philosopher or common false positive
      if (knownVariants.has(canonical) || PROPER_NAME_STOPWORDS.has(canonical)) continue;
      if (seenCandidates.has(canonical)) continue;
      
      // Check if this name appears in a philosophical context
      const context = extractContext(fullText, match.index, name.length);
      const philosophicalContextWords = /\b(philosophy|philosopher|thought|theory|argued|believed|school|doctrine|ethic|metaphysic|epistemolog|aesthetic|moral|reason|virtue|liberty|rights|justice|dialectic|idealism|materialism|empiricism|rationalism)\b/i;
      
      if (philosophicalContextWords.test(context)) {
        seenCandidates.add(canonical);
        
        const candidateRes = await fetch(`${supabaseUrl}/rest/v1/constellation_node_candidates`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify({
            name: name,
            canonical_name: canonical,
            evidence_text: context.substring(0, 2000),
            analysis_id: analysis.id,
            analysis_type: analysisType,
            extraction_tier: 'rule_based',
            confidence: 0.5,
            status: 'pending',
          }),
        });
        
        if (candidateRes.ok) {
          results.nodeCandidates++;
        } else if (candidateRes.status === 409) {
          // Already exists — increment mention count
          await fetch(`${supabaseUrl}/rest/v1/rpc/increment_node_candidate_mentions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ p_canonical_name: canonical }),
          }).catch(() => {}); // Ignore if RPC doesn't exist
        }
      }
    }

    // 5. Log extraction
    await fetch(`${supabaseUrl}/rest/v1/constellation_extraction_log`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        analysis_id: analysis.id,
        analysis_type: analysisType,
        extraction_tier: 'rule_based',
        status: 'completed',
        concepts_found: results.conceptLinks,
        edges_found: results.edgeCandidates,
      }),
    });

    console.log(`[ConstellationExtract] Tier 1 complete: ${results.conceptLinks} links, ${results.edgeCandidates} edges, ${results.nodeCandidates} candidates`);
    
  } catch (error) {
    console.error('[ConstellationExtract] Tier 1 extraction error:', error.message);
    
    // Log failure
    try {
      await fetch(`${supabaseUrl}/rest/v1/constellation_extraction_log`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          analysis_id: analysis.id,
          analysis_type: analysisType,
          extraction_tier: 'rule_based',
          status: 'failed',
          error_message: error.message.substring(0, 500),
        }),
      });
    } catch (logErr) {
      console.error('[ConstellationExtract] Failed to log extraction error:', logErr.message);
    }
  }

  return results;
}

export default extractRuleBased;
