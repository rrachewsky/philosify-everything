// ============================================================
// AI - BOOK ANALYSIS ORCHESTRATOR
// ============================================================
// Mirrors orchestrator.js but uses literature prompt template.
// Reuses the same model callers, parser, and normalization.
// ============================================================

import { buildBookAnalysisPrompt } from "./prompts/literature-template.js";
import { calculatePhilosophicalNote } from "./prompts/calculator.js";
import {
  callClaude,
  callOpenAI,
  callGemini,
  callGrok,
  callDeepSeek,
} from "./models/index.js";
import {
  extractJSON,
  normalizeResponse,
  splitTrailingSchoolsParagraph,
} from "./parser.js";

function normalizeSchoolsHtml(value) {
  if (!value) return "";
  const s = String(value);
  if (!s.includes("<") && s.includes("\n")) {
    return s
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("<br/>");
  }
  return s;
}

const LANG_NAMES = {
  en: "English", pt: "Portuguese", es: "Spanish", de: "German",
  fr: "French", it: "Italian", hu: "Hungarian", ru: "Russian",
  ja: "Japanese", zh: "Chinese", ko: "Korean", he: "Hebrew",
  ar: "Arabic", hi: "Hindi", fa: "Farsi", nl: "Dutch",
  pl: "Polish", tr: "Turkish",
};

function normalizeModelKey(model) {
  const m = String(model || "").toLowerCase();
  if (m.includes("claude") || m === "anthropic") return "claude";
  if (m === "gpt4" || m === "openai" || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("gpt-")) return "openai";
  if (m.includes("gemini")) return "gemini";
  if (m.includes("grok")) return "grok";
  if (m.includes("deepseek")) return "deepseek";
  throw new Error(`Unrecognized model key: "${model}"`);
}

function isCompleteNormalizedAnalysis(normalized) {
  const issues = [];
  const sc = normalized.scorecard;
  if (!sc) {
    issues.push("missing scorecard");
  } else {
    for (const branch of ["ethics", "metaphysics", "epistemology", "politics", "aesthetics"]) {
      if (!sc[branch]) issues.push(`missing scorecard.${branch}`);
      else {
        if (sc[branch].score === undefined || sc[branch].score === null) issues.push(`missing ${branch}.score`);
        if (!sc[branch].justification || sc[branch].justification.length < 20) issues.push(`${branch}.justification too short`);
      }
    }
    if (sc.final_score === undefined || sc.final_score === null) issues.push("missing final_score");
  }
  if (!normalized.philosophical_analysis || normalized.philosophical_analysis.length < 100) {
    issues.push("philosophical_analysis too short or missing");
  }
  if (!normalized.classification) issues.push("missing classification");
  return { ok: issues.length === 0, issues };
}

export async function analyzeBookPhilosophy(
  title,
  author,
  synopsis,
  metadata,
  guide,
  model,
  lang,
  env,
) {
  const analysisStartTime = Date.now();

  const prompt = buildBookAnalysisPrompt(
    title,
    author,
    synopsis,
    metadata,
    guide,
    lang,
  );
  const targetLanguage = LANG_NAMES[lang] || "English";

  const promptLength = prompt.length;
  const estimatedTokens = Math.ceil(promptLength / 4);
  console.log(
    `[BookOrchestrator] Prompt length: ${promptLength} chars (~${estimatedTokens} tokens), Guide length: ${guide?.length || 0} chars`,
  );

  const requestedKey = normalizeModelKey(model);

  const callByKey = {
    claude: () => callClaude(prompt, targetLanguage, env),
    openai: () => callOpenAI(prompt, targetLanguage, env),
    gemini: () => callGemini(prompt, targetLanguage, env),
    grok: () => callGrok(prompt, targetLanguage, env),
    deepseek: () => callDeepSeek(prompt, targetLanguage, env),
  };

  const fallbacksByKey = {
    claude: ["openai", "gemini", "grok", "deepseek"],
    openai: ["claude", "gemini", "grok", "deepseek"],
    gemini: ["claude", "openai", "grok", "deepseek"],
    grok: ["claude", "openai", "gemini", "deepseek"],
    deepseek: ["claude", "openai", "gemini", "grok"],
  };

  const candidates = [
    requestedKey,
    ...(fallbacksByKey[requestedKey] || []),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  const maxAttemptsPerModel = 2;
  let normalized = null;
  let lastError = null;

  for (const key of candidates) {
    const caller = callByKey[key];
    if (!caller) continue;

    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        console.log(
          `[BookOrchestrator] Attempt ${attempt}/${maxAttemptsPerModel} with model: ${key}`,
        );

        const analysisText = await caller();
        const parsed = extractJSON(analysisText);
        const candidateNormalized = normalizeResponse(parsed);

        // Extract schools_of_thought from philosophical_analysis if not standalone
        if (
          (!candidateNormalized.schools_of_thought ||
            candidateNormalized.schools_of_thought.includes("[Schools of Thought not provided")) &&
          typeof candidateNormalized.philosophical_analysis === "string"
        ) {
          const split = splitTrailingSchoolsParagraph(candidateNormalized.philosophical_analysis);
          if (split.extracted) {
            candidateNormalized.philosophical_analysis = split.philosophical_analysis;
            candidateNormalized.schools_of_thought = normalizeSchoolsHtml(split.extracted);
          }
        } else if (typeof candidateNormalized.schools_of_thought === "string") {
          candidateNormalized.schools_of_thought = normalizeSchoolsHtml(candidateNormalized.schools_of_thought);
        }

        // Clean trailing schools from philosophical_analysis
        if (
          typeof candidateNormalized.philosophical_analysis === "string" &&
          typeof candidateNormalized.schools_of_thought === "string"
        ) {
          const split2 = splitTrailingSchoolsParagraph(candidateNormalized.philosophical_analysis);
          if (split2.extracted) {
            candidateNormalized.philosophical_analysis = split2.philosophical_analysis;
          }
        }

        const completeness = isCompleteNormalizedAnalysis(candidateNormalized);
        if (!completeness.ok) {
          console.warn(
            `[BookOrchestrator] Incomplete analysis from ${key} (attempt ${attempt}): ${completeness.issues.join(", ")}`,
          );
          lastError = new Error(`Incomplete analysis: ${completeness.issues.join(", ")}`);
          continue;
        }

        normalized = candidateNormalized;
        break;
      } catch (error) {
        if (key === "claude" && error?.type === "content_filtered") {
          console.warn(`[BookOrchestrator] Claude blocked content; trying fallback models.`);
          lastError = error;
          break;
        }
        console.warn(`[BookOrchestrator] Model ${key} attempt ${attempt} failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    if (normalized) break;
  }

  if (!normalized) {
    throw new Error(
      `All AI models failed to produce a COMPLETE book analysis. Last error: ${lastError?.message || "unknown"}`,
    );
  }

  // Calculate correct philosophical note
  const correctPhilosophicalNote = calculatePhilosophicalNote(
    normalized.scorecard?.final_score,
  );

  const analysisDurationMs = Date.now() - analysisStartTime;
  console.log(
    `[BookOrchestrator] Analysis completed in ${analysisDurationMs}ms (${(analysisDurationMs / 1000).toFixed(1)}s)`,
  );

  // Return enriched result
  return {
    ...normalized,
    philosophical_note: correctPhilosophicalNote,
    title,
    author,
    google_books_id: metadata?.google_books_id || null,
    release_year: metadata?.release_year || normalized.year || null,
    country: normalized.country || "",
    genre: normalized.genre || "Literature",
    context: normalized.historical_context || "",
    model_used: model,
    analyzed_at: new Date().toISOString(),
    analysis_duration_ms: analysisDurationMs,
  };
}
