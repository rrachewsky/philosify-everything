// ============================================================
// AI MODEL - GEMINI 2.0 FLASH
// ============================================================
// Using raw fetch (Gemini SDK has Workers compatibility issues)
// Default: Gemini 2.0 Flash (gemini-2.0-flash)
// Alternative: gemini-2.5-pro, gemini-1.5-pro (set GEMINI_MODEL env var)

import { fetchWithTimeout } from "../../utils/timeout.js";
import { getSecret } from "../../utils/secrets.js";

// Map legacy/invalid model IDs to the current default
const LEGACY_MODEL_MAP = {
  "gemini-2.0-flash-thinking-exp-01-21": "gemini-2.0-flash",
  "gemini-2.0-flash-exp-01-21": "gemini-2.0-flash",
  "gemini-2.5-flash-thinking-exp-01-21": "gemini-2.0-flash",
  "gemini-3-pro-preview-11-2025-thinking": "gemini-2.0-flash",
  "gemini-3.0-flash": "gemini-2.0-flash",
  "gemini-3-flash": "gemini-2.0-flash",
  "gemini-3-flash-preview": "gemini-2.0-flash",
  "gemini-3.1-flash": "gemini-2.0-flash",
  "gemini-2.5-flash": "gemini-2.0-flash",
};

// Supported models for generateContent (v1beta)
const SUPPORTED_MODELS = new Set([
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-exp",
]);

function resolveModel(envModel) {
  const requested = envModel || "gemini-2.0-flash";
  const mapped = LEGACY_MODEL_MAP[requested] || requested;
  if (SUPPORTED_MODELS.has(mapped)) {
    return mapped;
  }
  console.warn(
    `[Gemini] Model "${requested}" not supported for generateContent v1beta. Falling back to gemini-1.5-pro.`,
  );
  return "gemini-1.5-pro";
}

export async function callGemini(prompt, targetLanguage, env) {
  const apiKey = await getSecret(env.GEMINI_API_KEY);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Resolve model (maps legacy IDs and validates)
  const model = resolveModel(env.GEMINI_MODEL);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`[Gemini] Using model: ${model}`);
  console.log(
    `[Gemini] Prompt length: ${prompt.length} chars (~${Math.ceil(prompt.length / 4)} tokens)`,
  );

  // Gemini doesn't have separate system message, so add at beginning of prompt
  const enhancedPrompt = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨🚨🚨 CRITICAL SYSTEM INSTRUCTION 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOU ARE A PHILOSOPHICAL ANALYST SPECIALIZED IN OBJECTIVIST PHILOSOPHY.

REASONING INSTRUCTION:
Think deeply about philosophical nuances, contradictions, and context BEFORE scoring.
Consider the artist's intent, historical context, and symbolic meaning.
Distinguish between artistic critique and philosophical messaging.

YOU MUST WRITE YOUR ENTIRE RESPONSE IN ${targetLanguage.toUpperCase()}

EVERY SINGLE WORD must be in ${targetLanguage}.
ALL justifications, analysis, context, classifications - EVERYTHING in ${targetLanguage}.

This is MANDATORY. If you write even ONE word in another language, you FAIL.
The user is paying for analysis in ${targetLanguage} and cannot read other languages.

WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${prompt}`;

  // Build request body - only include thinkingConfig if model supports it
  const requestBody = {
    contents: [
      {
        parts: [{ text: enhancedPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192, // Gemini 3 Flash Preview max limit
      // Note: If responses are truncated, consider using gemini-1.5-pro which supports 8192 tokens
    },
  };

  // Only add thinkingConfig for models that support it (gemini-2.5-pro, gemini-2.0-flash-exp)
  // Note: Gemini 3 Flash Preview does not support thinkingConfig
  // Check if model name suggests it supports thinking
  // Note: thinkingConfig may cause errors if not supported, so we make it optional
  if (
    model.includes("2.5-pro") ||
    model.includes("2.0-flash-exp") ||
    model.includes("thinking")
  ) {
    try {
      requestBody.generationConfig.thinkingConfig = {
        thinkingBudget: 8192, // Deep Think mode with 8K thinking tokens (max supported)
      };
      console.log("[Gemini] Using thinkingConfig with 8K budget");
    } catch (e) {
      console.warn(
        "[Gemini] Could not add thinkingConfig, continuing without it",
      );
    }
  }

  // Gemini models with thinking can take longer - use extended timeout
  // Declare timeout before try block so it's available in catch
  // Gemini 3 Flash Preview is faster, so use shorter timeout
  const isThinkingModel =
    model.includes("2.5-pro") ||
    model.includes("thinking") ||
    (model.includes("pro") && !model.includes("flash"));
  const timeoutMs = isThinkingModel ? 90000 : 55000; // 90s for thinking models, 55s for others

  console.log(`[Gemini] Using timeout: ${timeoutMs}ms (model: ${model})`);

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
      timeoutMs,
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      console.error(`[Gemini] API error ${response.status}:`, errorData);

      // Check for timeout (504 Gateway Timeout)
      if (response.status === 504 || response.status === 524) {
        console.error(`[Gemini] ⚠️ Request timeout after ${timeoutMs}ms`);
        throw new Error(
          `Gemini API timeout: Analysis took too long (${timeoutMs}ms). Your credit has been refunded.`,
        );
      }

      // Provide more specific error messages
      if (errorData.error?.message) {
        throw new Error(`Gemini API error: ${errorData.error.message}`);
      }
      if (errorData.error?.status) {
        throw new Error(
          `Gemini API error: ${errorData.error.status} - ${errorData.error.message || errorText}`,
        );
      }
      throw new Error(
        `Gemini API error: ${response.status} - ${errorText.substring(0, 200)}`,
      );
    }

    const data = await response.json();

    // Better error handling for response structure
    if (!data.candidates || !data.candidates.length) {
      console.error(
        "[Gemini] No candidates in response:",
        JSON.stringify(data, null, 2),
      );

      // Check for safety ratings or blocked content
      if (data.promptFeedback?.blockReason) {
        throw new Error(
          `Gemini blocked content: ${data.promptFeedback.blockReason}`,
        );
      }

      throw new Error("Gemini returned no candidates in response");
    }

    const candidate = data.candidates[0];

    // Check for finish reason
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      console.warn(`[Gemini] Finish reason: ${candidate.finishReason}`);
      if (candidate.finishReason === "SAFETY") {
        throw new Error("Gemini blocked content due to safety filters");
      }
      if (candidate.finishReason === "MAX_TOKENS") {
        console.error(
          "[Gemini] ⚠️ Response truncated due to max tokens - analysis may be incomplete!",
        );
        console.error(
          "[Gemini] Consider increasing maxOutputTokens or using a model with higher limits",
        );
        // Don't throw error, but log warning - parser will handle missing fields
      }
    }

    if (!candidate.content || !candidate.content.parts) {
      console.error(
        "[Gemini] Invalid candidate structure:",
        JSON.stringify(candidate, null, 2),
      );
      throw new Error("Gemini returned invalid candidate structure");
    }

    // Extract text parts (skip thinking parts if present)
    const textParts = candidate.content.parts.filter(
      (p) => p.text && !p.thought,
    );
    if (!textParts.length) {
      // Fallback to any text part
      const anyText = candidate.content.parts.find((p) => p.text);
      if (anyText) {
        console.log("[Gemini] Using fallback text part");
        return anyText.text;
      }
      console.error(
        "[Gemini] No text content found in parts:",
        JSON.stringify(candidate.content.parts, null, 2),
      );
      throw new Error("No text content in Gemini response");
    }

    console.log(
      `[Gemini] ✓ Response received (${textParts[0].text.length} chars)`,
    );
    return textParts[0].text;
  } catch (error) {
    // Check if it's a timeout error
    if (
      error.message?.includes("timeout") ||
      error.message?.includes("Timeout") ||
      error.name === "AbortError"
    ) {
      console.error(`[Gemini] ⚠️ Request timeout after ${timeoutMs}ms`);
      throw new Error(
        `Gemini API timeout: Analysis took too long (${timeoutMs}ms). Your credit has been refunded.`,
      );
    }

    // Re-throw other errors
    throw error;
  }
}
