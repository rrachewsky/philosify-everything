// ============================================================
// AI - ANALYSIS ORCHESTRATOR
// ============================================================

import { buildAnalysisPrompt } from "./prompts/template.js";
import { calculatePhilosophicalNote } from "./prompts/calculator.js";
import {
  classifySchoolsOfThought,
  buildSchoolsOfThoughtParagraph,
} from "./containers/schoolsOfThought.js";
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
  // If it's plain text with newlines, convert to <br/> for UI rendering.
  if (!s.includes("<") && s.includes("\n")) {
    return s
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("<br/>");
  }
  return s;
}

// Valid model aliases: claude, anthropic, gpt4, openai, o1*, o3*, gpt-*, gemini*, grok*, deepseek*
function normalizeModelKey(model) {
  const m = String(model || "").toLowerCase();
  if (m.includes("claude") || m === "anthropic") return "claude";
  if (
    m === "gpt4" ||
    m === "openai" ||
    m.startsWith("o1") ||
    m.startsWith("o3") ||
    m.startsWith("gpt-")
  )
    return "openai";
  if (m.includes("gemini")) return "gemini";
  if (m.includes("grok")) return "grok";
  if (m.includes("deepseek")) return "deepseek";
  throw new Error(
    `Unrecognized model key: "${model}". Valid keys: claude, openai, gemini, grok, deepseek`,
  );
}

function isCompleteNormalizedAnalysis(normalized, lang = "en") {
  const issues = [];

  if (!normalized || typeof normalized !== "object") {
    return { ok: false, issues: ["normalized_not_object"] };
  }

  // Mandatory integrated analysis
  const pa = normalized.philosophical_analysis;
  if (
    !pa ||
    typeof pa !== "string" ||
    pa.trim() === "" ||
    pa.includes("[Philosophical analysis not provided")
  ) {
    issues.push("missing_philosophical_analysis");
  }

  // Mandatory context fields
  const hc = normalized.historical_context;
  if (
    !hc ||
    typeof hc !== "string" ||
    hc.trim() === "" ||
    hc.includes("[Historical context not provided")
  ) {
    issues.push("missing_historical_context");
  }
  const cp = normalized.creative_process;
  if (
    !cp ||
    typeof cp !== "string" ||
    cp.trim() === "" ||
    cp.includes("[Creative process not provided")
  ) {
    issues.push("missing_creative_process");
  }

  // Mandatory scorecard with 5 branches
  const scorecard = normalized.scorecard;
  if (!scorecard || typeof scorecard !== "object") {
    issues.push("missing_scorecard");
  } else {
    const required = [
      "ethics",
      "metaphysics",
      "epistemology",
      "politics",
      "aesthetics",
    ];
    for (const branch of required) {
      const b = scorecard[branch];
      if (!b) {
        issues.push(`missing_${branch}`);
        continue;
      }
      if (typeof b.score !== "number") issues.push(`missing_${branch}_score`);
      if (
        !b.justification ||
        typeof b.justification !== "string" ||
        b.justification.trim() === "" ||
        b.justification.includes("[Missing analysis")
      ) {
        issues.push(`missing_${branch}_justification`);
      }
    }
    if (typeof scorecard.final_score !== "number")
      issues.push("missing_final_score");
  }

  // Classification must exist (normalizer computes if absent, but keep strict)
  if (
    !normalized.classification ||
    typeof normalized.classification !== "string" ||
    normalized.classification.trim() === ""
  ) {
    issues.push("missing_classification");
  }

  return { ok: issues.length === 0, issues };
}

// Language code to name mapping (must match frontend i18n/config.js)
const LANG_NAMES = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  de: "German",
  fr: "French",
  it: "Italian",
  hu: "Hungarian",
  ru: "Russian",
  ja: "Japanese",
  zh: "Chinese",
  ko: "Korean",
  he: "Hebrew",
  ar: "Arabic",
  hi: "Hindi",
  fa: "Farsi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
};

// Main analysis orchestrator
export async function analyzePhilosophy(
  song,
  artist,
  lyrics,
  metadata,
  guide,
  model,
  lang,
  env,
) {
  const analysisStartTime = Date.now();

  const prompt = buildAnalysisPrompt(
    song,
    artist,
    lyrics,
    metadata,
    guide,
    lang,
  );
  const targetLanguage = LANG_NAMES[lang] || "English";

  // Log prompt length for debugging (rough token estimate: ~4 chars per token)
  const promptLength = prompt.length;
  const estimatedTokens = Math.ceil(promptLength / 4);
  console.log(
    `[Orchestrator] Prompt length: ${promptLength} chars (~${estimatedTokens} tokens), Guide length: ${guide?.length || 0} chars`,
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

  const maxAttemptsPerModel = 2; // retry once before fallback

  let normalized = null;
  let lastError = null;

  for (const key of candidates) {
    const caller = callByKey[key];
    if (!caller) continue;

    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
      try {
        console.log(
          `[Orchestrator] Attempt ${attempt}/${maxAttemptsPerModel} with model: ${key}`,
        );

        const analysisText = await caller();
        const parsed = extractJSON(analysisText);
        const candidateNormalized = normalizeResponse(parsed);

        // Backward compatibility: if model still appended Schools paragraph to philosophical_analysis,
        // extract it into schools_of_thought and remove from the integrated essay.
        if (
          (!candidateNormalized.schools_of_thought ||
            candidateNormalized.schools_of_thought.includes(
              "[Schools of Thought not provided",
            )) &&
          typeof candidateNormalized.philosophical_analysis === "string"
        ) {
          const split = splitTrailingSchoolsParagraph(
            candidateNormalized.philosophical_analysis,
          );
          if (split.extracted) {
            candidateNormalized.philosophical_analysis =
              split.philosophical_analysis;
            candidateNormalized.schools_of_thought = normalizeSchoolsHtml(
              split.extracted,
            );
          }
        } else if (typeof candidateNormalized.schools_of_thought === "string") {
          candidateNormalized.schools_of_thought = normalizeSchoolsHtml(
            candidateNormalized.schools_of_thought,
          );
        }

        // If both exist, ensure the integrated essay doesn't still contain a trailing schools paragraph.
        if (
          typeof candidateNormalized.philosophical_analysis === "string" &&
          typeof candidateNormalized.schools_of_thought === "string"
        ) {
          const split2 = splitTrailingSchoolsParagraph(
            candidateNormalized.philosophical_analysis,
          );
          if (split2.extracted) {
            candidateNormalized.philosophical_analysis =
              split2.philosophical_analysis;
          }
        }
        const completeness = isCompleteNormalizedAnalysis(
          candidateNormalized,
          lang,
        );

        if (!completeness.ok) {
          console.warn(
            `[Orchestrator] Incomplete analysis from ${key} (attempt ${attempt}): ${completeness.issues.join(", ")}`,
          );
          // Retry same model once; then fall back
          lastError = new Error(
            `Incomplete analysis: ${completeness.issues.join(", ")}`,
          );
          continue;
        }

        normalized = candidateNormalized;
        break;
      } catch (error) {
        // Claude content filtering → immediately try fallbacks
        if (key === "claude" && error?.type === "content_filtered") {
          console.warn(
            `[Orchestrator] Claude blocked content; will try fallback models.`,
          );
          lastError = error;
          break;
        }

        console.warn(
          `[Orchestrator] Model ${key} attempt ${attempt} failed: ${error.message}`,
        );
        lastError = error;
        continue;
      }
    }

    if (normalized) break;
  }

  if (!normalized) {
    throw new Error(
      `All AI models failed to produce a COMPLETE analysis. Last error: ${lastError?.message || "unknown"}`,
    );
  }

  // Schools of Thought injection REMOVED per user request
  /*
  try {
    const schoolsJson = await classifySchoolsOfThought({
      song,
      artist,
      lang,
      lyrics,
      guideText: guide,
      env
    });

    const sotParagraph = buildSchoolsOfThoughtParagraph(schoolsJson, lang);
    if (typeof normalized.philosophical_analysis === 'string' && sotParagraph) {
        // ... (manual injection code)
    }
  } catch (e) {
    console.warn('[Orchestrator] Schools-of-thought container failed; continuing without injection:', e?.message || e);
  }
  */

  // Calculate correct philosophical note based on final_score
  const correctPhilosophicalNote = calculatePhilosophicalNote(
    normalized.scorecard?.final_score,
  );

  // Calculate analysis duration
  const analysisDurationMs = Date.now() - analysisStartTime;
  console.log(
    `[Orchestrator] Analysis completed in ${analysisDurationMs}ms (${(analysisDurationMs / 1000).toFixed(1)}s)`,
  );

  // Enrich with metadata
  return {
    ...normalized,
    philosophical_note: correctPhilosophicalNote, // Override with calculated note
    song,
    artist,
    author: normalized.author || artist, // Author = artist by default
    spotify_id: metadata?.spotify_id || null,
    release_year: metadata?.release_year || normalized.year || null,
    country: metadata?.country || normalized.country || "",
    genre: normalized.genre || metadata?.genre || "Unknown",
    context: normalized.historical_context || "", // Rename for frontend
    lyrics_snippet: lyrics.substring(0, 500) + "...",
    model_used: model,
    analyzed_at: new Date().toISOString(),
    analysis_duration_ms: analysisDurationMs,
  };
}
