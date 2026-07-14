// ============================================================
// AI MODEL - OpenAI GPT-5.5 (SDK)
// ============================================================
// Using official OpenAI SDK for better reliability and features
// Default: gpt-5.5 (reasoning). Also: gpt-5.5-mini, gpt-4.1, o-series.

import OpenAI from 'openai';
import { getSecret } from '../../utils/secrets.js';

export async function callOpenAI(prompt, targetLanguage, env) {
  const apiKey = await getSecret(env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const model = env.OPENAI_MODEL || 'gpt-5.5';
  const isReasoningModel = model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3');

  console.log(`[OpenAI] Using model: ${model}, reasoning: ${isReasoningModel}`);

  // All models get 120s timeout to match progress bar
  const timeoutMs = 120000;

  const client = new OpenAI({
    apiKey,
    timeout: timeoutMs,
    maxRetries: 0
  });

  const systemPrompt = `You are a philosophical analyst specialized in Objectivist philosophy.

🚨 CRITICAL INSTRUCTION - LANGUAGE 🚨
You MUST write your ENTIRE response in ${targetLanguage}.
EVERY SINGLE WORD must be in ${targetLanguage}.
ALL justifications, analysis, context, classifications - EVERYTHING in ${targetLanguage}.

Use the natural, traditional register of ${targetLanguage} — no politically-charged neologisms or activist "language reforms".
United States demonym: in Portuguese ALWAYS "americano" or "norte-americano", NEVER "estadunidense" (ideological corruption of the language).
No invented gender-neutral forms ("todes", "amigues", "elu", "Latinx", "x"/"@" endings).

This is MANDATORY. If you write even ONE word in another language, you FAIL.
The user is paying for analysis in ${targetLanguage} and cannot read other languages.

WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.

REASONING INSTRUCTION:
Think deeply about philosophical nuances, contradictions, and context BEFORE scoring.
Consider the artist's intent, historical context, and symbolic meaning.
Distinguish between artistic critique and philosophical messaging.`;

  try {
    if (isReasoningModel) {
      // GPT-5.x, o1, o3 reasoning models. These reject `temperature` and use
      // `max_completion_tokens`; keep a bounded cap and force JSON output.
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${prompt}`
          }
        ],
        reasoning_effort: 'medium',
        response_format: { type: 'json_object' },
        max_completion_tokens: 16000
      });

      const u = response.usage;
      console.log(`[OpenAI] ✓ ${u.total_tokens} tokens (${u.prompt_tokens} in, ${u.completion_tokens} out)`);
      return response.choices[0].message.content;
    }

    // gpt-4o, gpt-4o-mini, gpt-4.1, etc.
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    });

    const u2 = response.usage;
    console.log(`[OpenAI] ✓ ${u2.total_tokens} tokens (${u2.prompt_tokens} in, ${u2.completion_tokens} out)`);
    return response.choices[0].message.content;

  } catch (error) {
    // SECURITY: Log detailed error server-side, return generic message to client
    console.error(`[OpenAI] API error:`, error.message);

    if (error.message?.includes('timeout') || error.message?.includes('Timeout') || error.name === 'AbortError') {
      console.error(`[OpenAI] ⚠️ Request timeout after ${timeoutMs}ms`);
      throw new Error(`Analysis service timeout. Your credit has been refunded.`);
    }

    throw new Error(`Analysis service temporarily unavailable. Please try again.`);
  }
}
