// ============================================================
// AI MODEL - DEEPSEEK V3.2 REASONER (OpenAI-compatible SDK)
// ============================================================
// Using OpenAI SDK with DeepSeek base URL for better reliability
// Default: DeepSeek V3.2 Reasoner (best value reasoning model)
// Pricing: $0.55/M input, $2.19/M output (10x cheaper than OpenAI)
// Performance: Comparable to GPT-5.1 on reasoning tasks

import OpenAI from 'openai';
import { getSecret } from '../../utils/secrets.js';

export async function callDeepSeek(prompt, targetLanguage, env) {
  const apiKey = await getSecret(env.DEEPSEEK_API_KEY);
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const model = env.DEEPSEEK_MODEL || 'deepseek-reasoner';

  console.log(`[DeepSeek] Using model: ${model}`);

  // DeepSeek API is OpenAI-compatible
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com/v1'
  });

  const systemPrompt = `You are a philosophical analyst specialized in Objectivist philosophy.

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

  try {
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
      max_tokens: 16000
    });

    const u = response.usage;
    console.log(`[DeepSeek] ✓ ${u.total_tokens} tokens (${u.prompt_tokens} in, ${u.completion_tokens} out)`);
    return response.choices[0].message.content;

  } catch (error) {
    console.error(`[DeepSeek] API error:`, error.message);
    console.error(`[DeepSeek] Error details:`, error);
    if (error.response) {
      console.error(`[DeepSeek] Response status:`, error.response.status);
      console.error(`[DeepSeek] Response data:`, error.response.data);
    }
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}
