// ============================================================
// INTERNAL COST REFERENCE (informational only)
// ============================================================
// NOT used in the charging path — all services reserve flat credits.
// Estimated API cost per full analysis (~10k input / 4-5k output tokens),
// based on provider list prices as of July 2026:
//   grok-4.5:            $2.00/M in, $6.00/M out  → ~$0.05 per analysis
//   claude-opus-4-8:     $5.00/M in, $25.00/M out → ~$0.15 per analysis
//   claude-sonnet-5:     $3.00/M in, $15.00/M out → ~$0.09 per analysis
//   gpt-5.5:             $5.00/M in, $30.00/M out → ~$0.19 per analysis
//   gemini-3.5-flash:    $1.50/M in, $9.00/M out  → ~$0.05 per analysis
//   gemini-3.1-flash-lite: $0.25/M in, $1.50/M out → ~$0.01 per call

export const MODEL_COSTS = {
  grok: 0.05, // Grok 4.5 (default analysis model)
  claude: 0.15, // Claude Opus 4.8 (fallback analysis model)
  gpt4: 0.19, // GPT-5.5
  gemini: 0.05, // Gemini 3.5 Flash
};

// Estimated cost for a specific model key (informational)
export function getModelCost(model) {
  const cost = MODEL_COSTS[model];
  if (cost === undefined) {
    console.warn(`[Pricing] Unknown model: ${model}, defaulting to $0.10`);
    return 0.1;
  }
  return cost;
}
