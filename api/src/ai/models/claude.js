// ============================================================
// AI MODEL - CLAUDE OPUS 4.5 (Anthropic SDK)
// ============================================================
// Using official Anthropic SDK for better reliability and features
// Default: Opus 4.5 with extended thinking (32K budget)
// Alternative: Sonnet 4.5 (set CLAUDE_MODEL env var)

import Anthropic from '@anthropic-ai/sdk';
import { getSecret } from '../../utils/secrets.js';

export async function callClaude(prompt, targetLanguage, env) {
  const apiKey = await getSecret(env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Model configuration (Opus 4.5 default, Sonnet 4.5 as alternative)
  const model = env.CLAUDE_MODEL || 'claude-opus-4-5-20251101';
  const thinkingBudget = 4000;
  const maxTokens = 16000;

  console.log(`[Claude] Using model: ${model}, thinking: ${thinkingBudget}, max: ${maxTokens}`);

  const client = new Anthropic({ apiKey });

  const systemPrompt = `You are a philosophical analyst specialized in Objectivist philosophy.

🚨 CRITICAL INSTRUCTION - LANGUAGE 🚨
You MUST write your ENTIRE response in ${targetLanguage}.
EVERY SINGLE WORD must be in ${targetLanguage}.
ALL justifications, analysis, context, classifications - EVERYTHING in ${targetLanguage}.

This is MANDATORY. If you write even ONE word in another language, you FAIL.
The user is paying for analysis in ${targetLanguage} and cannot read other languages.

WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.`;

  try {
    const response = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: 1,  // Required for extended thinking
      thinking: {
        type: 'enabled',
        budget_tokens: thinkingBudget
      },
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Extract the text content (skip thinking blocks)
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    const u = response.usage;
    console.log(`[Claude] ✓ ${u.input_tokens + u.output_tokens} tokens (${u.input_tokens} in, ${u.output_tokens} out)`);
    return textContent.text;

  } catch (error) {
    console.error(`[Claude] API error:`, error);
    
    // Check if it's a content filtering error
    // Claude returns errors in format: {type: "error", error: {type: "invalid_request_error", message: "..."}}
    const errorMessage = error.message || error.error?.message || JSON.stringify(error);
    const errorType = error.type || error.error?.type || '';
    
    if (
      errorMessage.includes('content filtering') ||
      errorMessage.includes('Output blocked') ||
      errorMessage.includes('invalid_request_error') ||
      errorType === 'invalid_request_error'
    ) {
      const errorObj = {
        type: 'content_filtered',
        message: 'Content blocked by Claude safety filters',
        originalError: errorMessage,
        suggestion: 'Try using a different AI model (GPT-4, Gemini, or Grok)'
      };
      throw errorObj;
    }
    
    throw new Error(`Claude API error: ${errorMessage}`);
  }
}
