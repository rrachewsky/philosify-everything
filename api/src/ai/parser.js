// ============================================================
// AI - JSON EXTRACTION & RESPONSE NORMALIZATION
// ============================================================

import { calculateWeightedScore } from "../config/scoring.js";

// Standard classification values (English only) - Guide v2.7
const VALID_CLASSIFICATIONS = [
  "Extremely Revolutionary",
  "Revolutionary",
  "Moderately Revolutionary",
  "Constructive Critique",
  "Ambiguous, Leaning Realist",
  "Ambiguous, Leaning Evasion",
  "Soft Conformist",
  "Directly Conformist",
  "Strongly Conformist",
  "Doctrinally Conformist",
];

// Translation mappings for classification normalization - Guide v2.7
const CLASSIFICATION_MAPPINGS = {
  // English variations (case-insensitive handled separately)
  "extremely revolutionary": "Extremely Revolutionary",
  revolutionary: "Revolutionary",
  "moderately revolutionary": "Moderately Revolutionary",
  "constructive critique": "Constructive Critique",
  "constructive criticism": "Constructive Critique",
  "ambiguous, leaning realist": "Ambiguous, Leaning Realist",
  "ambiguous leaning realist": "Ambiguous, Leaning Realist",
  "ambiguous, leaning evasion": "Ambiguous, Leaning Evasion",
  "ambiguous leaning evasion": "Ambiguous, Leaning Evasion",
  "soft conformist": "Soft Conformist",
  "directly conformist": "Directly Conformist",
  "strongly conformist": "Strongly Conformist",
  "doctrinally conformist": "Doctrinally Conformist",
  // Legacy mappings (for backward compatibility with old analyses)
  "mildly conformist": "Soft Conformist",
  "ambivalent/mixed": "Ambiguous, Leaning Realist",
  ambivalent: "Ambiguous, Leaning Realist",
  mixed: "Ambiguous, Leaning Realist",

  // Portuguese
  "extremamente revolucionária": "Extremely Revolutionary",
  "extremamente revolucionario": "Extremely Revolutionary",
  revolucionário: "Revolutionary",
  revolucionária: "Revolutionary",
  revolucionario: "Revolutionary",
  "moderadamente revolucionário": "Moderately Revolutionary",
  "moderadamente revolucionária": "Moderately Revolutionary",
  "moderadamente revolucionario": "Moderately Revolutionary",
  "crítica construtiva": "Constructive Critique",
  "critica construtiva": "Constructive Critique",
  "ambígua inclinada ao realismo": "Ambiguous, Leaning Realist",
  "ambigua inclinada ao realismo": "Ambiguous, Leaning Realist",
  "ambígua inclinada à evasão": "Ambiguous, Leaning Evasion",
  "ambigua inclinada a evasao": "Ambiguous, Leaning Evasion",
  "conformista suave": "Soft Conformist",
  "diretamente conformista": "Directly Conformist",
  "fortemente conformista": "Strongly Conformist",
  "doutrinariamente conformista": "Doctrinally Conformist",
  "conformista doutrinária": "Doctrinally Conformist",
  // Legacy PT mappings
  "levemente conformista": "Soft Conformist",
  "ligeiramente conformista": "Soft Conformist",
  "ambivalente/misto": "Ambiguous, Leaning Realist",
  ambivalente: "Ambiguous, Leaning Realist",
  misto: "Ambiguous, Leaning Realist",

  // Spanish
  "extremadamente revolucionario": "Extremely Revolutionary",
  "extremadamente revolucionaria": "Extremely Revolutionary",
  "crítica constructiva": "Constructive Critique",
  "critica constructiva": "Constructive Critique",
  "ambiguo inclinado al realismo": "Ambiguous, Leaning Realist",
  "ambigua inclinada al realismo": "Ambiguous, Leaning Realist",
  "ambiguo inclinado a la evasión": "Ambiguous, Leaning Evasion",
  "ambigua inclinada a la evasion": "Ambiguous, Leaning Evasion",
  "directamente conformista": "Directly Conformist",
  "fuertemente conformista": "Strongly Conformist",
  "doctrinalmente conformista": "Doctrinally Conformist",
  // Legacy ES mappings
  "ligeramente conformista": "Soft Conformist",
  "ambivalente/mixto": "Ambiguous, Leaning Realist",
  mixto: "Ambiguous, Leaning Realist",

  // French
  "extrêmement révolutionnaire": "Extremely Revolutionary",
  "extremement revolutionnaire": "Extremely Revolutionary",
  révolutionnaire: "Revolutionary",
  "modérément révolutionnaire": "Moderately Revolutionary",
  "critique constructive": "Constructive Critique",
  "ambigu penché vers le réalisme": "Ambiguous, Leaning Realist",
  "ambigu penché vers l'évasion": "Ambiguous, Leaning Evasion",
  "conformiste modéré": "Soft Conformist",
  "directement conformiste": "Directly Conformist",
  "fortement conformiste": "Strongly Conformist",
  "doctrinalement conformiste": "Doctrinally Conformist",
  // Legacy FR mappings
  "légèrement conformiste": "Soft Conformist",
  "ambivalent/mixte": "Ambiguous, Leaning Realist",

  // German
  "extrem revolutionär": "Extremely Revolutionary",
  revolutionär: "Revolutionary",
  "mäßig revolutionär": "Moderately Revolutionary",
  "konstruktive kritik": "Constructive Critique",
  "ambivalent zum realismus neigend": "Ambiguous, Leaning Realist",
  "ambivalent zur evasion neigend": "Ambiguous, Leaning Evasion",
  "sanft konformistisch": "Soft Conformist",
  "direkt konformistisch": "Directly Conformist",
  "stark konformistisch": "Strongly Conformist",
  "doktrinär konformistisch": "Doctrinally Conformist",
  // Legacy DE mappings
  "leicht konformistisch": "Soft Conformist",
  "ambivalent/gemischt": "Ambiguous, Leaning Realist",
  gemischt: "Ambiguous, Leaning Realist",

  // Italian
  "estremamente rivoluzionario": "Extremely Revolutionary",
  rivoluzionario: "Revolutionary",
  "moderatamente rivoluzionario": "Moderately Revolutionary",
  "critica costruttiva": "Constructive Critique",
  "ambiguo incline al realismo": "Ambiguous, Leaning Realist",
  "ambiguo incline all'evasione": "Ambiguous, Leaning Evasion",
  "conformista moderato": "Soft Conformist",
  "direttamente conformista": "Directly Conformist",
  "dottrinalmente conformista": "Doctrinally Conformist",
  // Legacy IT mappings
  "lievemente conformista": "Soft Conformist",

  // Arabic
  "ثوري للغاية": "Extremely Revolutionary",
  ثوري: "Revolutionary",
  "ثوري بشكل معتدل": "Moderately Revolutionary",
  "نقد بناء": "Constructive Critique",
  "غامض يميل للواقعية": "Ambiguous, Leaning Realist",
  "غامض يميل للتهرب": "Ambiguous, Leaning Evasion",
  "محافظ معتدل": "Soft Conformist",
  "محافظ مباشرة": "Directly Conformist",
  "محافظ بشدة": "Strongly Conformist",
  "محافظ عقائدي": "Doctrinally Conformist",
  // Legacy AR mappings
  "محافظ قليلاً": "Soft Conformist",
  "متناقض/مختلط": "Ambiguous, Leaning Realist",
  متناقض: "Ambiguous, Leaning Realist",
  مختلط: "Ambiguous, Leaning Realist",

  // Hindi
  "अत्यंत क्रांतिकारी": "Extremely Revolutionary",
  क्रांतिकारी: "Revolutionary",
  "मध्यम क्रांतिकारी": "Moderately Revolutionary",
  "रचनात्मक आलोचना": "Constructive Critique",
  "यथार्थवाद की ओर झुकाव": "Ambiguous, Leaning Realist",
  "टालमटोल की ओर झुकाव": "Ambiguous, Leaning Evasion",
  "नरम अनुरूपवादी": "Soft Conformist",
  "सीधे अनुरूपवादी": "Directly Conformist",
  "दृढ़ अनुरूपवादी": "Strongly Conformist",
  "सिद्धांतवादी अनुरूपवादी": "Doctrinally Conformist",
  // Legacy HI mappings
  "हल्का अनुरूपवादी": "Soft Conformist",
  "द्विधाग्रस्त/मिश्रित": "Ambiguous, Leaning Realist",
  द्विधाग्रस्त: "Ambiguous, Leaning Realist",
  मिश्रित: "Ambiguous, Leaning Realist",

  // Persian (Farsi)
  "بسیار انقلابی": "Extremely Revolutionary",
  انقلابی: "Revolutionary",
  "نسبتاً انقلابی": "Moderately Revolutionary",
  "نقد سازنده": "Constructive Critique",
  "مبهم متمایل به واقع‌گرایی": "Ambiguous, Leaning Realist",
  "مبهم متمایل به فرار": "Ambiguous, Leaning Evasion",
  "محافظه‌کار ملایم": "Soft Conformist",
  "مستقیماً محافظه‌کار": "Directly Conformist",
  "شدیداً محافظه‌کار": "Strongly Conformist",
  "محافظه‌کار دگماتیک": "Doctrinally Conformist",
  // Legacy FA mappings
  "کمی محافظه‌کار": "Soft Conformist",
  "دوگانه/مختلط": "Ambiguous, Leaning Realist",
  دوگانه: "Ambiguous, Leaning Realist",
};

// Split trailing "Schools of Thought" paragraph from philosophical_analysis text
// Detects multilingual headers (EN, PT, ES, FR, DE, IT) with optional markdown bold and colons
export function splitTrailingSchoolsParagraph(philosophicalAnalysis) {
  const text = String(philosophicalAnalysis || "").trim();
  if (!text)
    return { philosophical_analysis: philosophicalAnalysis, extracted: "" };

  const schoolsRegex =
    /(?:\n\s*\n|^)\s*(?:\*\*)?\s*(?:School\(s\)\s+of\s+Thought|Escola\(s\)\s+de\s+Pensamento(?:\s+\(provável\))?|Escuela\(s\)\s+de\s+Pensamiento|École\(s\)\s+de\s+pensée|Denkschule|Scuola|Probable\s+School\s+of\s+Thought)\s*(?:\*\*)?\s*:?/im;

  const match = text.match(schoolsRegex);
  if (!match)
    return { philosophical_analysis: philosophicalAnalysis, extracted: "" };

  const splitIndex = match.index;
  const analysisPart = text.substring(0, splitIndex).trim();
  const schoolsPart = text.substring(splitIndex).trim();

  return {
    philosophical_analysis: analysisPart,
    extracted: schoolsPart,
  };
}

// Compute classification from final score - Guide v2.7 thresholds
function classificationFromScore(score) {
  if (score >= 8.1) return "Extremely Revolutionary";
  if (score >= 6.1) return "Revolutionary";
  if (score >= 4.1) return "Moderately Revolutionary";
  if (score >= 2.1) return "Constructive Critique";
  if (score >= 0.1) return "Ambiguous, Leaning Realist";
  if (score >= -2.0) return "Ambiguous, Leaning Evasion";
  if (score >= -4.0) return "Soft Conformist";
  if (score >= -6.0) return "Directly Conformist";
  if (score >= -8.0) return "Strongly Conformist";
  return "Doctrinally Conformist";
}

// Normalize classification to standard English value
export function normalizeClassification(rawClassification, finalScore) {
  const expected = classificationFromScore(finalScore);

  if (!rawClassification) {
    console.log(
      "[Parser] No classification provided, computing from score:",
      finalScore,
    );
    return expected;
  }

  // Normalize punctuation/spacing to improve matching (e.g. "Ambígua, inclinada ao realismo")
  const normalized = rawClassification
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?"'()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Check exact match in mappings
  if (CLASSIFICATION_MAPPINGS[normalized]) {
    const mapped = CLASSIFICATION_MAPPINGS[normalized];
    if (mapped !== rawClassification) {
      console.log(
        `[Parser] Normalized classification: "${rawClassification}" → "${mapped}"`,
      );
    }
    if (mapped !== expected) {
      console.log(
        `[Parser] Overriding classification to match final_score: "${mapped}" → "${expected}" (final_score: ${finalScore})`,
      );
      return expected;
    }
    return mapped;
  }

  // Check if already a valid classification (case-insensitive)
  const validMatch = VALID_CLASSIFICATIONS.find(
    (v) => v.toLowerCase() === normalized,
  );
  if (validMatch) {
    if (validMatch !== expected) {
      console.log(
        `[Parser] Overriding classification to match final_score: "${validMatch}" → "${expected}" (final_score: ${finalScore})`,
      );
      return expected;
    }
    return validMatch;
  }

  // Fuzzy match: check if any valid classification is contained in the input
  for (const valid of VALID_CLASSIFICATIONS) {
    if (normalized.includes(valid.toLowerCase())) {
      console.log(
        `[Parser] Fuzzy matched classification: "${rawClassification}" → "${valid}"`,
      );
      if (valid !== expected) {
        console.log(
          `[Parser] Overriding classification to match final_score: "${valid}" → "${expected}" (final_score: ${finalScore})`,
        );
        return expected;
      }
      return valid;
    }
  }

  // Fallback: compute from score
  console.log(
    `[Parser] Unknown classification "${rawClassification}", computing from score: ${finalScore}`,
  );
  return expected;
}

// Extract JSON from AI response (handles markdown, text wrapper, etc.)
export function extractJSON(text) {
  // Strategy 1: Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");

  // Strategy 2: If has "Here's the analysis:" or similar, skip
  const jsonStartMarkers = ["```json", "{", "Here is", "Here's"];
  for (const marker of jsonStartMarkers) {
    const idx = cleaned.indexOf(marker);
    if (idx !== -1 && marker !== "{") {
      cleaned = cleaned.substring(idx + marker.length);
    }
  }

  // Strategy 3: Find JSON with balanced braces
  let depth = 0;
  let startIdx = -1;
  let endIdx = -1;

  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === "{") {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        endIdx = i;
        break;
      }
    }
  }

  if (startIdx === -1 || endIdx === -1) {
    console.error("[ExtractJSON] No balanced JSON found");
    console.error("[ExtractJSON] Full text:", text.substring(0, 500));
    throw new Error("No valid JSON found in response");
  }

  let jsonStr = cleaned.substring(startIdx, endIdx + 1);

  // Strategy 4: Clean up common JSON issues
  // Remove + prefix from numbers (Claude sometimes returns "+6" instead of "6")
  jsonStr = jsonStr.replace(/:\s*\+(\d)/g, ": $1");

  // Remove trailing commas before closing braces/brackets
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, "$1");

  try {
    const parsed = JSON.parse(jsonStr);
    console.log(
      `[Parser] ✓ Extracted JSON (${text.length} → ${jsonStr.length} chars)`,
    );
    return parsed;
  } catch (error) {
    console.error("[ExtractJSON] Parse error:", error.message);
    console.error(
      "[ExtractJSON] JSON string (first 500):",
      jsonStr.substring(0, 500),
    );
    console.error(
      "[ExtractJSON] JSON string (last 500):",
      jsonStr.substring(Math.max(0, jsonStr.length - 500)),
    );
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

// Calculate weighted final score according to Guide v2.6
// Weights defined in config/scoring.js:
// Ethics (40%) + Metaphysics (20%) + Epistemology (20%) + Politics (10%) + Aesthetics (10%)
function calculateWeightedFinalScore(scorecard) {
  return calculateWeightedScore(scorecard);
}

// Normalize response (GPT-4 returns inconsistent structures)
export function normalizeResponse(data) {
  // Map scorecard (can come as "scorecard" or "philosophical_scorecard")
  const scorecard = data.scorecard || data.philosophical_scorecard || {};

  // Validate that all required scorecard branches exist with scores and justifications
  const requiredBranches = [
    "ethics",
    "metaphysics",
    "epistemology",
    "politics",
    "aesthetics",
  ];
  const missingBranches = requiredBranches.filter(
    (branch) => !scorecard[branch],
  );
  const invalidBranches = requiredBranches.filter((branch) => {
    const branchData = scorecard[branch];
    return (
      branchData &&
      (branchData.score === undefined ||
        branchData.score === null ||
        typeof branchData.score !== "number" ||
        !branchData.justification ||
        branchData.justification.trim() === "" ||
        branchData.justification.includes("[Missing analysis"))
    );
  });

  if (missingBranches.length > 0 || invalidBranches.length > 0) {
    const allIssues = [...missingBranches, ...invalidBranches];
    console.error(
      `[Parser] ⚠️ CRITICAL: Missing or invalid scorecard branches: ${allIssues.join(", ")}`,
    );
    console.error(
      `[Parser] This indicates the AI response did not include proper scorecard data.`,
    );
    console.error(`[Parser] Response data keys:`, Object.keys(data));
    console.error(`[Parser] Scorecard keys:`, Object.keys(scorecard));

    // Log detailed info about what's missing
    requiredBranches.forEach((branch) => {
      const branchData = scorecard[branch];
      if (!branchData) {
        console.error(`[Parser]   - ${branch}: COMPLETELY MISSING`);
      } else {
        if (branchData.score === undefined || branchData.score === null) {
          console.error(`[Parser]   - ${branch}: MISSING SCORE`);
        }
        if (
          !branchData.justification ||
          branchData.justification.trim() === ""
        ) {
          console.error(`[Parser]   - ${branch}: MISSING JUSTIFICATION`);
        }
      }
    });

    // Initialize missing/invalid branches with default values (but log as error)
    allIssues.forEach((branch) => {
      scorecard[branch] = {
        score: 0,
        justification: `[Missing analysis for ${branch}]`,
      };
    });
  }

  // CRITICAL: Recalculate final_score using weighted formula (Guide v2.6)
  // AI models often calculate simple averages instead of weighted averages
  const correctFinalScore = calculateWeightedFinalScore(scorecard);

  // Override AI's final_score with the correct weighted calculation
  if (scorecard.final_score !== correctFinalScore) {
    console.log(
      `[Parser] Correcting final_score: ${scorecard.final_score} → ${correctFinalScore}`,
    );
    scorecard.final_score = correctFinalScore;
  }

  // Map and normalize classification to standard English values
  const rawClassification =
    data.classification || data.philosophical_classification || "";
  const classification = normalizeClassification(
    rawClassification,
    scorecard.final_score,
  );

  // Map philosophical_analysis (can be string or object with integrated_analysis)
  // CRITICAL: This field is MANDATORY - validate strictly
  let philosophical_analysis = data.philosophical_analysis;
  if (philosophical_analysis && typeof philosophical_analysis === "object") {
    philosophical_analysis = philosophical_analysis.integrated_analysis || "";
  }
  if (
    !philosophical_analysis ||
    philosophical_analysis.trim() === "" ||
    philosophical_analysis.trim() === "[Philosophical analysis not provided]"
  ) {
    console.error(
      "[Parser] ⚠️ CRITICAL: Missing MANDATORY philosophical_analysis field",
    );
    console.error("[Parser] This field is required and cannot be omitted");
    // Still provide placeholder but log as error (not just warning)
    philosophical_analysis =
      "[Philosophical analysis not provided - MANDATORY FIELD MISSING]";
  }

  // Map philosophical_note (can come as "philosophical_note" or "philosophical_score")
  const philosophical_note =
    data.philosophical_note !== undefined
      ? data.philosophical_note
      : data.philosophical_score;

  // Map schools_of_thought (new standalone container)
  let schools_of_thought = data.schools_of_thought;
  if (schools_of_thought && typeof schools_of_thought === "object") {
    // Avoid object types; expect string field
    schools_of_thought =
      schools_of_thought.html || schools_of_thought.text || "";
  }
  if (
    !schools_of_thought ||
    typeof schools_of_thought !== "string" ||
    schools_of_thought.trim() === ""
  ) {
    console.error(
      "[Parser] ⚠️ CRITICAL: Missing MANDATORY schools_of_thought field",
    );
    schools_of_thought =
      "[Schools of Thought not provided - MANDATORY FIELD MISSING]";
  }

  // Validate and warn about missing critical fields (MANDATORY FIELDS)
  const historical_context = data.historical_context || "";
  const creative_process = data.creative_process || "";

  if (
    !historical_context ||
    historical_context.trim() === "" ||
    historical_context.trim() === "[Historical context not provided]"
  ) {
    console.error(
      "[Parser] ⚠️ CRITICAL: Missing MANDATORY historical_context field",
    );
    console.error("[Parser] This field is required and cannot be omitted");
  }
  if (
    !creative_process ||
    creative_process.trim() === "" ||
    creative_process.trim() === "[Creative process not provided]"
  ) {
    console.error(
      "[Parser] ⚠️ CRITICAL: Missing MANDATORY creative_process field",
    );
    console.error("[Parser] This field is required and cannot be omitted");
  }

  // Return normalized structure
  return {
    scorecard,
    classification,
    philosophical_analysis:
      philosophical_analysis || "[Philosophical analysis not provided]",
    schools_of_thought:
      schools_of_thought || "[Schools of Thought not provided]",
    philosophical_note,
    historical_context:
      historical_context || "[Historical context not provided]",
    creative_process: creative_process || "[Creative process not provided]",
    year: data.year || data.release_year || null,
    genre: data.genre || "Unknown",
    country: data.country || "",
  };
}
