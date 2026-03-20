// ============================================================
// AI - News Article Analysis Orchestrator
// ============================================================
// Calls AI models with the news analysis prompt, parses JSON response.
// Returns 4 fields: the_facts, source_analysis, hits_and_misses, philosify_opinion.
// No scorecard, no classification, no philosophical note.
// ============================================================

import { buildNewsAnalysisPrompt } from "./prompts/news-analysis-template.js";
import {
  callClaude,
  callOpenAI,
  callGemini,
  callGrok,
  callDeepSeek,
} from "./models/index.js";
import { extractJSON, normalizeResponse } from "./parser.js";

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
  if (!normalized.the_facts || normalized.the_facts.length < 80) {
    issues.push("the_facts too short or missing");
  }
  if (!normalized.source_analysis || normalized.source_analysis.length < 80) {
    issues.push("source_analysis too short or missing");
  }
  if (!normalized.hits_and_misses || normalized.hits_and_misses.length < 80) {
    issues.push("hits_and_misses too short or missing");
  }
  if (!normalized.philosify_opinion || normalized.philosify_opinion.length < 100) {
    issues.push("philosify_opinion too short or missing");
  }
  return { ok: issues.length === 0, issues };
}

export async function analyzeNewsPhilosophy(title, source, articleText, newsMetadata, guide, sourceOfTruth, model, lang, env) {
  const prompt = buildNewsAnalysisPrompt(title, source, articleText, newsMetadata, guide, sourceOfTruth, lang);
  const targetLanguage = LANG_NAMES[lang] || "English";

  console.log(`[NewsOrchestrator] Prompt: ${prompt.length} chars, Guide: ${guide?.length || 0} chars, SourceOfTruth: ${sourceOfTruth?.length || 0} chars`);

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

  const check = isComplete(normalized);
  if (!check.ok) console.warn(`[NewsOrchestrator] Incomplete: ${check.issues.join(", ")}`);

  normalized.model = usedModel;

  return normalized;
}
