// ============================================================
// AI - PHILOSOPHICAL NOTE CALCULATOR
// ============================================================

// Calculate philosophical note (1-10) based on final score (-10 to +10)
// Mapping aligned with Guide v2.7 classification ranges:
// +8.1 to +10.0: Extremely Revolutionary → Note 10
// +6.1 to +8.0: Revolutionary → Note 9
// +4.1 to +6.0: Moderately Revolutionary → Note 8
// +2.1 to +4.0: Constructive Critique → Note 7
// +0.1 to +2.0: Ambiguous, Leaning Realist → Note 6
// -2.0 to 0.0: Ambiguous, Leaning Evasion → Note 5
// -4.0 to -2.1: Soft Conformist → Note 4
// -6.0 to -4.1: Directly Conformist → Note 3
// -8.0 to -6.1: Strongly Conformist → Note 2
// -10.0 to -8.1: Doctrinally Conformist → Note 1
export function calculatePhilosophicalNote(finalScore) {
  if (finalScore === undefined || finalScore === null) {
    return null; // If no final_score, return null
  }

  // Mapping according to Guide v2.7 classification ranges
  // Note 10: Extremely Revolutionary (+8.1 to +10.0)
  if (finalScore >= 8.1) return 10;
  // Note 9: Revolutionary (+6.1 to +8.0)
  if (finalScore >= 6.1) return 9;
  // Note 8: Moderately Revolutionary (+4.1 to +6.0)
  if (finalScore >= 4.1) return 8;
  // Note 7: Constructive Critique (+2.1 to +4.0)
  if (finalScore >= 2.1) return 7;
  // Note 6: Ambiguous, Leaning Realist (+0.1 to +2.0)
  if (finalScore >= 0.1) return 6;
  // Note 5: Ambiguous, Leaning Evasion (-2.0 to 0.0)
  if (finalScore >= -2.0) return 5;
  // Note 4: Soft Conformist (-4.0 to -2.1)
  if (finalScore >= -4.0) return 4;
  // Note 3: Directly Conformist (-6.0 to -4.1)
  if (finalScore >= -6.0) return 3;
  // Note 2: Strongly Conformist (-8.0 to -6.1)
  if (finalScore >= -8.0) return 2;
  // Note 1: Doctrinally Conformist (-10.0 to -8.1)
  return 1;
}
