// ============================================================
// Philosopher Panel Ordering — Internal Pedagogical Sorting
// ============================================================
// Sorts philosophers for panel presentation order.
// Implementation detail — not exposed to users.
// ============================================================

// Internal alignment scoring based on school of thought.
// Higher score = appears later in the panel.
const SCHOOL_SCORES = {
  // Collectivism, irrationalism, mysticism, altruism — appear first
  "marxism": 1,
  "communism": 1,
  "revolutionary socialism": 1,
  "critical theory": 2,
  "frankfurt school": 2,
  "postmodernism": 2,
  "post-structuralism": 2,
  "deconstruction": 2,
  "nihilism": 3,
  "existentialism": 3,
  "absurdism": 3,
  "psychoanalysis": 3,
  "structuralism": 3,
  "phenomenology": 4,
  "christian mysticism": 3,
  "mysticism": 3,
  "buddhism": 4,
  "madhyamaka": 4,
  "vedanta": 4,
  "confucianism": 4,
  "taoism": 4,
  "daoism": 4,
  "neoplatonism": 4,
  "platonism": 4,
  "idealism": 4,
  "german idealism": 3,
  "absolute idealism": 3,
  "kantianism": 4,
  "deontology": 4,
  "utilitarianism": 5,
  "consequentialism": 5,
  "pragmatism": 5,
  "social contract": 5,
  "political liberalism": 5,
  "anti-totalitarianism": 6,
  "behavioral economics": 5,
  "cognitive psychology": 5,
  "analytical psychology": 4,
  "virtue ethics": 6,
  "analytic philosophy": 6,
  "aristotelianism": 6,
  "thomism": 5,
  "scholasticism": 5,
  "renaissance humanism": 6,
  "christian humanism": 5,
  "empiricism": 7,
  "rationalism": 7,
  "scientific revolution": 7,
  "natural philosophy": 7,
  "political realism": 6,
  "republicanism": 7,
  "stoicism": 7,
  "cynicism": 6,
  // Individual rights, reason, liberty — appear last
  "natural law": 8,
  "international law": 7,
  "natural rights": 8,
  "abolitionism": 8,
  "anti-tyranny": 8,
  "transcendentalism": 7,
  "individualism": 8,
  "classical liberalism": 9,
  "french liberal school": 9,
  "peace economics": 9,
  "liberalism": 8,
  "feminism": 6,
  "scottish enlightenment": 8,
  "austrian economics": 9,
  "monetarism": 9,
  "voluntaryism": 10,
  "individualist liberalism": 10,
  "individualist anarchism": 10,
  "anarcho-capitalism": 10,
  "objectivism": 10,
};

/**
 * Get the internal ordering score for a philosopher based on their school.
 * Handles compound schools like "Austrian Economics / Classical Liberalism"
 * by taking the highest (most reason-aligned) score.
 */
function getPhilosopherScore(philosopher) {
  const school = (philosopher.school || "").toLowerCase();
  // Split compound schools (e.g. "Austrian Economics / Classical Liberalism")
  const parts = school.split(/\s*[\/|,]\s*/);
  let maxScore = 5; // default: middle
  for (const part of parts) {
    const trimmed = part.trim();
    for (const [key, score] of Object.entries(SCHOOL_SCORES)) {
      if (trimmed.includes(key) || key.includes(trimmed)) {
        if (score > maxScore) maxScore = score;
      }
    }
  }
  return maxScore;
}

/**
 * Sort philosophers for panel presentation.
 * Returns a new sorted array (does not mutate input).
 * @param {Array} philosophers - Array of philosopher profile objects
 * @returns {Array} Sorted array
 */
export function sortPhilosophersForPanel(philosophers) {
  if (!philosophers || philosophers.length <= 1) return philosophers;
  return [...philosophers].sort((a, b) => getPhilosopherScore(a) - getPhilosopherScore(b));
}

/**
 * Sort philosopher names using the PHILOSOPHERS roster for scoring.
 * Used when only names (strings) are available, not full profiles.
 * @param {Array} names - Array of philosopher name strings
 * @param {Function} findFn - Function to look up a philosopher profile by name
 * @returns {Array} Sorted array of names
 */
export function sortPhilosopherNamesForPanel(names, findFn) {
  if (!names || names.length <= 1) return names;
  return [...names].sort((a, b) => {
    const profileA = findFn(a) || { school: "" };
    const profileB = findFn(b) || { school: "" };
    return getPhilosopherScore(profileA) - getPhilosopherScore(profileB);
  });
}
