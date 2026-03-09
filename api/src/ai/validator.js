// ============================================================
// AI - ANALYSIS QUALITY VALIDATOR
// ============================================================
// Validates analysis quality to prevent bad/incomplete analyses
// from being served to users. Auto-deletes invalid cached data.

/**
 * Validates if an analysis meets quality standards
 * @param {Object} analysis - Analysis object from database
 * @returns {Object} { valid: boolean, reason: string, issues: string[] }
 */
export function validateAnalysisQuality(analysis) {
  const issues = [];

  if (!analysis) {
    return {
      valid: false,
      reason: "Analysis is null or undefined",
      issues: ["null_analysis"],
    };
  }

  // 1. Check required scorecard branches exist
  const requiredBranches = [
    "ethics",
    "metaphysics",
    "epistemology",
    "politics",
    "aesthetics",
  ];

  requiredBranches.forEach((branch) => {
    const scoreField = `${branch}_score`;
    const analysisField = `${branch}_analysis`;

    // Check score exists and is not 0 (default placeholder)
    const score = analysis[scoreField];
    if (score === undefined || score === null) {
      issues.push(`missing_${branch}_score`);
    }

    // Check analysis text exists and is not placeholder
    const analysisText = analysis[analysisField];
    if (!analysisText || analysisText.trim() === "") {
      issues.push(`empty_${branch}_analysis`);
    } else if (analysisText.includes("[Missing analysis")) {
      issues.push(`placeholder_${branch}_analysis`);
    }
  });

  // 2. Check if ALL scores are 0 (indicates incomplete analysis)
  const allScoresZero = requiredBranches.every((branch) => {
    const score = analysis[`${branch}_score`];
    return score === 0 || score === undefined || score === null;
  });

  if (allScoresZero) {
    issues.push("all_scores_zero");
  }

  // 3. Check for missing philosophical analysis (MUST be present)
  // NOTE: `summary` is not a replacement for the integrated essay; keep strict.
  if (
    !analysis.philosophical_analysis ||
    analysis.philosophical_analysis.trim() === ""
  ) {
    issues.push("missing_philosophical_analysis");
  }

  // 4. Check for placeholder text in philosophical analysis
  if (
    analysis.philosophical_analysis &&
    analysis.philosophical_analysis.includes("[Missing analysis")
  ) {
    issues.push("placeholder_philosophical_analysis");
  }
  if (
    analysis.philosophical_analysis &&
    analysis.philosophical_analysis.includes(
      "[Philosophical analysis not provided",
    )
  ) {
    issues.push("placeholder_philosophical_analysis");
  }

  // 4b. Check for missing mandatory context fields
  if (
    !analysis.historical_context ||
    analysis.historical_context.trim() === ""
  ) {
    issues.push("missing_historical_context");
  }
  if (!analysis.creative_process || analysis.creative_process.trim() === "") {
    issues.push("missing_creative_process");
  }

  // 5. Check for missing classification
  if (!analysis.classification || analysis.classification.trim() === "") {
    issues.push("missing_classification");
  }

  // 5b. School(s) of Thought container is mandatory (stored in metadata for older rows)
  const schoolsOfThought =
    (analysis.metadata && typeof analysis.metadata === "object"
      ? analysis.metadata.schools_of_thought
      : "") || "";
  if (!schoolsOfThought || String(schoolsOfThought).trim() === "") {
    issues.push("missing_schools_of_thought");
  }

  // 6. Check final score exists
  if (analysis.final_score === undefined || analysis.final_score === null) {
    issues.push("missing_final_score");
  }

  // Determine if valid
  const valid = issues.length === 0;

  let reason = "";
  if (!valid) {
    if (issues.includes("all_scores_zero")) {
      reason =
        "All scorecard branches have zero scores (incomplete AI response)";
    } else if (issues.some((i) => i.includes("placeholder"))) {
      reason = "Analysis contains placeholder text (incomplete AI response)";
    } else if (issues.some((i) => i.includes("missing"))) {
      reason = "Analysis is missing required fields";
    } else if (issues.some((i) => i.includes("empty"))) {
      reason = "Analysis has empty required fields";
    }
  }

  return { valid, reason, issues };
}

/**
 * Marks an invalid analysis as superseded in the database (preserves audit trail)
 * SECURITY: Never delete analyses -- mark as superseded to maintain immutability guarantee
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase service key
 * @param {string} analysisId - Analysis ID to mark as superseded
 * @returns {Promise<boolean>} Success status
 */
export async function deleteInvalidAnalysis(
  supabaseUrl,
  supabaseKey,
  analysisId,
) {
  try {
    console.warn(
      `[Validator] Marking invalid analysis as superseded: ${analysisId}`,
    );

    const patchUrl = `${supabaseUrl}/rest/v1/analyses?id=eq.${analysisId}`;
    const response = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ status: "superseded" }),
    });

    if (response.ok) {
      console.log(
        `[Validator] ✓ Successfully marked invalid analysis as superseded: ${analysisId}`,
      );
      return true;
    } else {
      console.error(
        `[Validator] Failed to mark analysis ${analysisId} as superseded: ${response.status}`,
      );
      return false;
    }
  } catch (error) {
    console.error(
      `[Validator] Error marking analysis ${analysisId} as superseded:`,
      error.message,
    );
    return false;
  }
}

/**
 * Validates and auto-deletes invalid cached analysis
 * @param {Object} analysis - Analysis from cache
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase service key
 * @returns {Promise<Object>} { valid: boolean, deleted: boolean, reason: string }
 */
export async function validateAndCleanCache(
  analysis,
  supabaseUrl,
  supabaseKey,
) {
  const validation = validateAnalysisQuality(analysis);

  if (!validation.valid) {
    console.warn(
      `[Validator] ❌ Invalid cached analysis detected (ID: ${analysis.id})`,
    );
    console.warn(`[Validator] Reason: ${validation.reason}`);
    console.warn(`[Validator] Issues: ${validation.issues.join(", ")}`);

    // Mark invalid analysis as superseded (preserves audit trail)
    const deleted = await deleteInvalidAnalysis(
      supabaseUrl,
      supabaseKey,
      analysis.id,
    );

    return {
      valid: false,
      deleted,
      reason: validation.reason,
      issues: validation.issues,
    };
  }

  return {
    valid: true,
    deleted: false,
    reason: "Analysis passes quality checks",
  };
}
