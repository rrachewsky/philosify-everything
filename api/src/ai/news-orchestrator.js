// ============================================================
// AI - News Article Philosophical Analysis Orchestrator
// Mirrors book-orchestrator.js for news articles
// ============================================================

import { buildNewsAnalysisPrompt } from "./prompts/news-analysis-template.js";
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
import { calculateWeightedScore } from "../config/scoring.js";

function normalizeSchoolsHtml(value) {
  if (!value) return "";
  const s = String(value);
  if (!s.includes("<") && s.includes("\n")) {
    return s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).join("<br/>");
  }
  return s.replace(/\n/g, "<br/>").replace(/<br\/><br\/><br\/>/g, "<br/><br/>");
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

function isComplete(normalized) {
  const issues = [];
  const sc = normalized.scorecard;
  if (!sc) { issues.push("missing scorecard"); }
  else {
    for (const branch of ["ethics", "metaphysics", "epistemology", "politics", "aesthetics"]) {
      if (!sc[branch]) issues.push(`missing scorecard.${branch}`);
      else {
        if (sc[branch].score === undefined) issues.push(`missing ${branch}.score`);
        if (!sc[branch].justification || sc[branch].justification.length < 20) issues.push(`${branch}.justification too short`);
      }
    }
  }
  if (!normalized.philosophical_analysis || normalized.philosophical_analysis.length < 100) {
    issues.push("philosophical_analysis too short");
  }
  if (!normalized.classification) issues.push("missing classification");
  return { ok: issues.length === 0, issues };
}

export async function analyzeNewsPhilosophy(title, source, articleText, newsMetadata, guide, model, lang, env) {
  const prompt = buildNewsAnalysisPrompt(title, source, articleText, newsMetadata, guide, lang);
  const targetLanguage = LANG_NAMES[lang] || "English";

  console.log(`[NewsOrchestrator] Prompt: ${prompt.length} chars, Guide: ${guide?.length || 0} chars`);

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

  const modelChain = [requestedKey, ...(fallbacksByKey[requestedKey] || [])];
  let analysisText = null;
  let usedModel = requestedKey;

  for (const currentKey of modelChain) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[NewsOrchestrator] ${currentKey} attempt ${attempt}/2`);
        analysisText = await callByKey[currentKey]();
        usedModel = currentKey;
        if (analysisText) break;
      } catch (err) {
        console.error(`[NewsOrchestrator] ${currentKey} attempt ${attempt} failed: ${err.message}`);
        if (err.message?.includes("content_filtered")) break;
        if (attempt >= 2) break;
      }
    }
    if (analysisText) break;
  }

  if (!analysisText) throw new Error("All AI models failed to analyze this article");

  const parsed = extractJSON(analysisText);
  if (!parsed) throw new Error("Failed to parse AI response as JSON");

  const normalized = normalizeResponse(parsed);

  if (!normalized.schools_of_thought && normalized.philosophical_analysis) {
    const split = splitTrailingSchoolsParagraph(normalized.philosophical_analysis);
    if (split) {
      normalized.philosophical_analysis = split.analysis;
      normalized.schools_of_thought = split.schools;
    }
  }

  normalized.schools_of_thought = normalizeSchoolsHtml(normalized.schools_of_thought);

  const check = isComplete(normalized);
  if (!check.ok) console.warn(`[NewsOrchestrator] Incomplete: ${check.issues.join(", ")}`);

  const finalScore = calculateWeightedScore({
    ethics: normalized.scorecard?.ethics?.score || 0,
    metaphysics: normalized.scorecard?.metaphysics?.score || 0,
    epistemology: normalized.scorecard?.epistemology?.score || 0,
    politics: normalized.scorecard?.politics?.score || 0,
    aesthetics: normalized.scorecard?.aesthetics?.score || 0,
  });

  normalized.scorecard.final_score = finalScore;
  normalized.final_score = finalScore;
  normalized.philosophical_note = calculatePhilosophicalNote(finalScore);
  normalized.model = usedModel;

  return normalized;
}
