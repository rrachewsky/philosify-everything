// ============================================================
// PRICING CONFIGURATION
// ============================================================
// Model-specific pricing for philosophical analysis

export const MODEL_PRICES = {
  'claude': 0.80,   // Claude (Anthropic) - $0.80 per analysis
  'gpt4': 0.60,     // GPT-4 (OpenAI) - $0.60 per analysis
  'gemini': 0.60,   // Gemini (Google) - $0.60 per analysis
  'grok': 0.80,     // Grok (xAI) - $0.80 per analysis
};

// Get price for a specific model
export function getModelPrice(model) {
  const price = MODEL_PRICES[model];
  if (price === undefined) {
    console.warn(`[Pricing] Unknown model: ${model}, defaulting to $0.60`);
    return 0.60; // Default fallback
  }
  return price;
}

// Calculate how many credits remain based on balance and model
export function calculateCredits(balance, model) {
  const price = getModelPrice(model);
  return Math.floor(balance / price);
}
