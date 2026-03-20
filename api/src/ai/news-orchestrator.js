// ============================================================
// AI - News Article Analysis Orchestrator
// ============================================================
// Calls Grok (primary) or Claude (fallback) with the news analysis prompt.
// Returns 4 fields: the_facts, source_analysis, hits_and_misses, philosify_opinion.
// No scorecard, no classification, no normalizeResponse.
// ============================================================

import { buildNewsAnalysisPrompt } from "./prompts/news-analysis-template.js";
import { callGrok, callClaude } from "./models/index.js";
import { extractJSON } from "./parser.js";

const LANG_NAMES = {
  en: "English", pt: "Portuguese", es: "Spanish", de: "German",
  fr: "French", it: "Italian", hu: "Hungarian", ru: "Russian",
  ja: "Japanese", zh: "Chinese", ko: "Korean", he: "Hebrew",
  ar: "Arabic", hi: "Hindi", fa: "Farsi", nl: "Dutch",
  pl: "Polish", tr: "Turkish",
};

function isComplete(result) {
  const issues = [];
  if (!result.the_facts || result.the_facts.length < 80) {
    issues.push("the_facts too short or missing");
  }
  if (!result.source_analysis || result.source_analysis.length < 80) {
    issues.push("source_analysis too short or missing");
  }
  if (!result.hits_and_misses || result.hits_and_misses.length < 80) {
    issues.push("hits_and_misses too short or missing");
  }
  if (!result.philosify_opinion || result.philosify_opinion.length < 100) {
    issues.push("philosify_opinion too short or missing");
  }
  return { ok: issues.length === 0, issues };
}

export async function analyzeNewsPhilosophy(title, source, articleText, newsMetadata, guide, sourceOfTruth, model, lang, env) {
  const prompt = buildNewsAnalysisPrompt(title, source, articleText, newsMetadata, guide, sourceOfTruth, lang);
  const targetLanguage = LANG_NAMES[lang] || "English";

  console.log(`[NewsOrchestrator] Prompt: ${prompt.length} chars, Guide: ${guide?.length || 0} chars, SourceOfTruth: ${sourceOfTruth?.length || 0} chars`);

  // Grok is primary for news analysis. Claude is the only fallback.
  const modelChain = [
    { key: "grok", call: () => callGrok(prompt, targetLanguage, env) },
    { key: "claude", call: () => callClaude(prompt, targetLanguage, env) },
  ];

  let analysisText = null;
  let usedModel = "grok";

  for (const { key, call } of modelChain) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[NewsOrchestrator] ${key} attempt ${attempt}/2`);
        analysisText = await call();
        usedModel = key;
        if (analysisText) break;
      } catch (err) {
        console.error(`[NewsOrchestrator] ${key} attempt ${attempt} failed: ${err.message}`);
        if (err.message?.includes("content_filtered")) break;
        if (attempt >= 2) break;
      }
    }
    if (analysisText) break;
  }

  if (!analysisText) throw new Error("All AI models failed to analyze this article");

  const parsed = extractJSON(analysisText);
  if (!parsed) throw new Error("Failed to parse AI response as JSON");

  const result = {
    the_facts: parsed.the_facts || "",
    source_analysis: parsed.source_analysis || "",
    hits_and_misses: parsed.hits_and_misses || "",
    philosify_opinion: parsed.philosify_opinion || "",
    country: parsed.country || "",
    genre: parsed.genre || "",
    model: usedModel,
  };

  const check = isComplete(result);
  if (!check.ok) console.warn(`[NewsOrchestrator] Incomplete: ${check.issues.join(", ")}`);

  return result;
}
