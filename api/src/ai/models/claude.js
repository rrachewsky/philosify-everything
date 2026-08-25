// ============================================================
// AI MODEL - CLAUDE OPUS 4.8 (Anthropic SDK)
// ============================================================
// Using official Anthropic SDK for better reliability and features
// Default: Opus 4.8 with adaptive thinking (medium effort)
// Alternative: Fable 5 / Haiku 4.5 (set CLAUDE_MODEL env var)
// NOTE: Opus 4.7+ and Fable 5 removed `temperature` and `budget_tokens`
//       (both now return HTTP 400). Use adaptive thinking + output_config.effort.

import Anthropic from '@anthropic-ai/sdk';
import { getSecret } from '../../utils/secrets.js';

export async function callClaude(prompt, targetLanguage, env, options = {}) {
  const apiKey = await getSecret(env.ANTHROPIC_API_KEY);
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Model configuration (Opus 4.8 default, Fable 5 / Haiku 4.5 as alternatives)
  const model = env.CLAUDE_MODEL || 'claude-opus-4-8';
  const effort = env.CLAUDE_EFFORT || 'medium';
  const maxTokens = 16000;

  // Explicit timeout so callers fall back to the next model instead of
  // waiting on the SDK default (10 minutes) — the Cloudflare edge kills the
  // client connection at ~100s anyway, so anything past ~75s is wasted wall
  // time. Healthy Opus panel/analysis calls land in 40-60s; this only fires
  // on genuinely bad provider days. maxRetries 0: the SDK would otherwise
  // retry timeouts internally, stacking 2-3 full windows before we ever see
  // the error. Tunable via CLAUDE_TIMEOUT_MS without a code change.
  const timeoutMs = Number(env.CLAUDE_TIMEOUT_MS) || 75000;

  console.log(`[Claude] Using model: ${model}, effort: ${effort}, max: ${maxTokens}, timeout: ${timeoutMs}ms`);

  const client = new Anthropic({ apiKey, timeout: timeoutMs, maxRetries: 0 });

  const systemPrompt = `You are a philosophical analyst specialized in Objectivist philosophy, providing EDUCATIONAL analysis of cultural works (music, films, literature, news).

IMPORTANT CONTEXT:
This is a legitimate philosophical education platform (Philosify.org) that analyzes cultural works through philosophical lenses. You will be asked to analyze:
- Films depicting historical atrocities (Holocaust, wars, genocide) — these require THOUGHTFUL analysis, not refusal
- Works exploring dark themes (violence, oppression, suffering) — analyze the PHILOSOPHICAL MESSAGE, not graphic content
- Biographical and documentary films about real historical events — treat with scholarly respect

Your role is EDUCATIONAL ANALYSIS, not content moderation. Films like "Schindler's List", "The Pianist", "12 Years a Slave" deserve serious philosophical examination. Refusing to analyze them would be a disservice to education and historical memory.

🚨 CRITICAL INSTRUCTION - LANGUAGE 🚨
You MUST write your ENTIRE response in ${targetLanguage}.
EVERY SINGLE WORD must be in ${targetLanguage}.
ALL justifications, analysis, context, classifications - EVERYTHING in ${targetLanguage}.

SPELLING AND TRANSLATION REQUIREMENTS:
- Use CORRECT spelling in ${targetLanguage} — proofread carefully
- Translate ALL philosophical terms (e.g., "sense of life" → "senso de vida", "benevolent universe" → "universo benevolente")
- Common Portuguese mistakes to AVOID:
  * "recreação" (recreation/play) vs "recriação" (re-creation) — use the correct one based on context
  * "autointeresse" NOT "auto-interesse" or "auto interesse"
  * "metafísica", "epistemologia", "estética" — correct accents required
  * "americano" or "norte-americano" NOT "estadunidense" — "estadunidense" is FORBIDDEN (ideological corruption of the language)
- Use the natural, traditional register of ${targetLanguage} — no politically-charged neologisms or activist "language reforms", no invented gender-neutral forms ("todes", "amigues", "elu", "Latinx", "x"/"@" endings)
- Do NOT leave English words untranslated unless they are proper nouns (names, titles)

This is MANDATORY. If you write even ONE word in another language, you FAIL.
The user is paying for analysis in ${targetLanguage} and cannot read other languages.

WRITE EVERYTHING IN ${targetLanguage}. NO EXCEPTIONS.

GUIDE ADHERENCE (BINDING):
The philosophical guide included in the prompt is the authoritative evaluation framework. Apply its definitions EXACTLY:
- "Sacrifice" = trading a GREATER value for a LESSER one. A trade up, or effort spent on something you value more, is NOT sacrifice.
- Hero vs. martyr: reason and self-interest define the hero; faith and self-immolation define the martyr. NEVER conflate them.
- Terminology: "virtuous self-interest" (never "rational egoism"); in Portuguese "autointeresse virtuoso" (never "egoísmo racional").
- Content determines aesthetic value: beautiful execution of a destructive philosophy must be judged by its philosophy.
State every verdict plainly as the guide's conclusion. Never hedge with "some may argue", "it could be seen as", or both-sides framing — evaluate, don't equivocate. Keep the tone cool, direct, and educational.`;

  // Prompt caching: the analysis prompt opens with a static preamble + the
  // philosophical guide (stable per language), followed by volatile content
  // (song/lyrics). When the caller passes the guide text, split the prompt at
  // the end of the guide and mark the stable prefix with cache_control, so
  // back-to-back analyses in the same language read the guide from cache
  // (~90% cheaper) instead of paying full input price every call.
  // Guard: only worth it when the guide is large enough to exceed the model's
  // minimum cacheable prefix (~4k tokens on Opus).
  let userContent = prompt;
  const guide = options.cacheableGuide;
  if (typeof guide === 'string' && guide.length > 8000) {
    const guideStart = prompt.indexOf(guide);
    if (guideStart >= 0) {
      const splitAt = guideStart + guide.length;
      userContent = [
        {
          type: 'text',
          text: prompt.slice(0, splitAt),
          cache_control: { type: 'ephemeral' },
        },
        { type: 'text', text: prompt.slice(splitAt) },
      ];
    }
  }

  try {
    const response = await client.messages.create({
      model: model,
      max_tokens: maxTokens,
      thinking: { type: 'adaptive' },
      output_config: { effort },
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userContent
      }]
    });

    // Extract the text content (skip thinking blocks)
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    const u = response.usage;
    console.log(
      `[Claude] ✓ ${u.input_tokens + u.output_tokens} tokens (${u.input_tokens} in, ${u.output_tokens} out, ` +
      `cache: ${u.cache_read_input_tokens || 0} read / ${u.cache_creation_input_tokens || 0} written)`
    );
    return textContent.text;

  } catch (error) {
    console.error(`[Claude] API error:`, error);

    // Check if it's a content filtering error
    // Claude returns errors in format: {type: "error", error: {type: "invalid_request_error", message: "..."}}
    const errorMessage = error.message || error.error?.message || JSON.stringify(error);
    const errorType = error.type || error.error?.type || '';

    // Timeout must be classified BEFORE the content-filter check — callers
    // (orchestrator, panel chain) route timeouts straight to the next model.
    if (
      error?.name === 'APIConnectionTimeoutError' ||
      /timed\s*out|timeout/i.test(errorMessage)
    ) {
      console.error(`[Claude] ⚠️ Request timeout after ${timeoutMs}ms`);
      const timeoutError = new Error(`Claude API timeout after ${timeoutMs}ms`);
      timeoutError.isTimeout = true;
      throw timeoutError;
    }

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
