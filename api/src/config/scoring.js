// ============================================================
// SCORING CONFIGURATION
// ============================================================
// Philosophical scoring weights based on Objectivist philosophy (Guide v2.6)
//
// Ethics receives highest weight (40%) because:
// - Core of Objectivism: rational self-interest vs altruism/sacrifice
// - Determines hero vs martyr distinction
// - Most directly impacts song's philosophical value
//
// Metaphysics & Epistemology (20% each):
// - Benevolent vs malevolent universe premise
// - Reason vs faith/mysticism
// - Foundational but expressed through ethics
//
// Politics & Aesthetics (10% each):
// - Individual rights vs collectivism
// - Romantic realism vs naturalism
// - Important but derivative of core principles

export const SCORING_WEIGHTS = {
  ethics: 0.4,        // 40% - Rational self-interest, virtue, egoism vs altruism
  metaphysics: 0.2,   // 20% - Benevolent universe, reality, free will
  epistemology: 0.2,  // 20% - Reason, logic, objectivity vs faith/mysticism
  politics: 0.1,      // 10% - Individual rights, capitalism vs collectivism
  aesthetics: 0.1     // 10% - Romantic realism, heroic portrayal
};

// Validate weights sum to 1.0
const totalWeight = Object.values(SCORING_WEIGHTS).reduce((sum, w) => sum + w, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  throw new Error(`Scoring weights must sum to 1.0, got ${totalWeight}`);
}

// Calculate weighted final score from scorecard
export function calculateWeightedScore(scorecard) {
  let weightedSum = 0;

  for (const [branch, weight] of Object.entries(SCORING_WEIGHTS)) {
    const score = scorecard[branch]?.score || 0;
    weightedSum += score * weight;
  }

  // Round to 1 decimal place
  return Math.round(weightedSum * 10) / 10;
}
