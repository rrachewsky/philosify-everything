// ============================================================
// AI MODEL - GROK 4.1 FAST (OpenAI-compatible SDK)
// ============================================================
// Using OpenAI SDK with xAI base URL for better reliability
// Default: Grok 4.1 Fast with reasoning (95% cheaper than Grok 3)
// Alternative: grok-3, grok-beta (set GROK_MODEL env var)

import OpenAI from "openai";
import { getSecret } from "../../utils/secrets.js";

export async function callGrok(prompt, targetLanguage, env, options = {}) {
  const apiKey = await getSecret(env.GROK_API_KEY);
  if (!apiKey) {
    throw new Error("GROK_API_KEY not configured");
  }

  const model = env.GROK_MODEL || "grok-4-1-fast-reasoning";
  const isReasoningModel =
    model.includes("reasoning") || model.includes("grok-4");

  console.log(`[Grok] Using model: ${model}, reasoning: ${isReasoningModel}`);

  // Configure timeout: reasoning models need more time (up to 90s), others use 55s
  const timeoutMs = isReasoningModel ? 90000 : 55000;

  // xAI API is OpenAI-compatible
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.x.ai/v1",
    timeout: timeoutMs, // SDK timeout (in milliseconds)
    maxRetries: 0, // Disable retries to fail fast on timeout
  });

  console.log(`[Grok] Using timeout: ${timeoutMs}ms`);

  // Allow callers to override system prompt (e.g. colloquium philosopher voices)
  const systemPrompt =
    options.systemPrompt ||
    `You are a philosophical analyst specialized in Objectivist philosophy.

🚨 CRITICAL INSTRUCTION - LANGUAGE 🚨
You MUST write your ENTIRE response in ${targetLanguage}.
EVERY SINGLE WORD must be in ${targetLanguage}.
ALL justifications, analysis, context, classifications - EVERYTHING in ${targetLanguage}.

This is MANDATORY. If you write even ONE word in another language, you FAIL.
The user is paying for analysis in ${targetLanguage} and cannot read other languages.

WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.

REASONING INSTRUCTION:
Think deeply about philosophical nuances, contradictions, and context BEFORE scoring.
Consider the artist's intent, historical context, and symbolic meaning.
Distinguish between artistic critique and philosophical messaging.`;

  // Allow callers to override temperature (e.g. 0.65 for distinct philosopher voices)
  const temperature = options.temperature ?? 0.1;

  try {
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature,
      max_tokens: 8000,
    });

    const u = response.usage;
    console.log(
      `[Grok] ✓ ${u.total_tokens} tokens (${u.prompt_tokens} in, ${u.completion_tokens} out)`,
    );
    return response.choices[0].message.content;
  } catch (error) {
    console.error(`[Grok] API error:`, error.message);
    console.error(`[Grok] Error details:`, error);
    if (error.response) {
      console.error(`[Grok] Response status:`, error.response.status);
      console.error(`[Grok] Response data:`, error.response.data);
    }

    // Check if it's a timeout error
    if (
      error.message?.includes("timeout") ||
      error.message?.includes("Timeout") ||
      error.name === "AbortError"
    ) {
      console.error(`[Grok] ⚠️ Request timeout after ${timeoutMs}ms`);
      throw new Error(
        `Grok API timeout: Analysis took too long (${timeoutMs}ms). Your credit has been refunded.`,
      );
    }

    throw new Error(`Grok API error: ${error.message}`);
  }
}
