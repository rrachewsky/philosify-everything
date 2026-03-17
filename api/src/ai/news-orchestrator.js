// ============================================================
// AI - News Article Philosophical Analysis Orchestrator
// Mirrors book-orchestrator.js for news articles
// ============================================================

import { buildNewsAnalysisPrompt } from "./prompts/news-analysis-template.js";
import { callModel, validateModel, validateLanguage } from "./models/index.js";
import { extractJSON, normalizeResponse, normalizeClassification } from "./parser.js";
import { calculateWeightedScore, AXIS_WEIGHTS } from "../config/scoring.js";
import { getPhilosophicalNote } from "./prompts/calculator.js";

const BRANCHES = ["ethics", "metaphysics", "epistemology", "politics", "aesthetics"];

export async function analyzeNewsPhilosophy(title, source, articleText, newsMetadata, guide, model, lang, env) {
  const validModel = validateModel(model);
  const validLang = validateLanguage(lang);

  const prompt = buildNewsAnalysisPrompt(title, source, articleText, newsMetadata, guide, validLang);

  // Model fallback chain
  const modelOrder = [validModel, "claude", "openai", "gemini", "grok", "deepseek"]
    .filter((v, i, a) => a.indexOf(v) === i);

  let analysisText = null;
  let usedModel = validModel;

  for (const currentModel of modelOrder) {
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        console.log(`[NewsOrchestrator] Trying ${currentModel} (attempt ${attempts}/${maxAttempts})`);

        analysisText = await callModel(currentModel, prompt, env, validLang);
        usedModel = currentModel;

        if (analysisText) break;
      } catch (err) {
        console.error(`[NewsOrchestrator] ${currentModel} attempt ${attempts} failed:`, err.message);

        if (err.message?.includes("content_filtered")) {
          break;
        }

        if (attempts >= maxAttempts) {
          console.log(`[NewsOrchestrator] ${currentModel} exhausted, trying next model`);
        }
      }
    }

    if (analysisText) break;
  }

  if (!analysisText) {
    throw new Error("All AI models failed to analyze this article");
  }

  const parsed = extractJSON(analysisText);
  if (!parsed) {
    throw new Error("Failed to parse AI response as JSON");
  }

  const normalized = normalizeResponse(parsed);

  // Extract schools_of_thought
  if (!normalized.schools_of_thought && normalized.philosophical_analysis) {
    const sotMatch = normalized.philosophical_analysis.match(
      /(?:<strong>.*?School.*?<\/strong>|School\(s\) of Thought)[\s\S]{10,500}/i
    );
    if (sotMatch) {
      normalized.schools_of_thought = sotMatch[0];
    }
  }

  if (normalized.schools_of_thought) {
    normalized.schools_of_thought = normalized.schools_of_thought
      .replace(/\n/g, "<br/>")
      .replace(/<br\/><br\/><br\/>/g, "<br/><br/>");
  }

  // Validate
  const missing = [];
  for (const branch of BRANCHES) {
    if (!normalized.scorecard?.[branch]?.justification || normalized.scorecard[branch].justification.length < 20) {
      missing.push(branch);
    }
  }
  if (!normalized.philosophical_analysis || normalized.philosophical_analysis.length < 100) {
    missing.push("philosophical_analysis");
  }

  if (missing.length > 0) {
    console.warn(`[NewsOrchestrator] Missing fields: ${missing.join(", ")}`);
  }

  // Recalculate weighted score
  const finalScore = calculateWeightedScore({
    ethics: normalized.scorecard?.ethics?.score || 0,
    metaphysics: normalized.scorecard?.metaphysics?.score || 0,
    epistemology: normalized.scorecard?.epistemology?.score || 0,
    politics: normalized.scorecard?.politics?.score || 0,
    aesthetics: normalized.scorecard?.aesthetics?.score || 0,
  });

  normalized.scorecard.final_score = finalScore;
  normalized.final_score = finalScore;
  normalized.classification = normalizeClassification(finalScore);
  normalized.philosophical_note = getPhilosophicalNote(finalScore);
  normalized.model = usedModel;

  return normalized;
}
