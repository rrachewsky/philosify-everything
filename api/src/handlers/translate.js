// ============================================================
// Translate Handler - On-demand message translation via Gemini Flash
// ============================================================
// POST /api/translate
// Body: { text, targetLang }
// Returns: { translatedText }
// Uses Gemini Flash for fast, cheap translations of user messages.

import { getUserFromAuth } from "../auth/index.js";
import { jsonResponse } from "../utils/index.js";
import { getSecret } from "../utils/secrets.js";
import { checkRateLimit } from "../rate-limit/index.js";

// Language code -> full name for prompt clarity
const LANG_NAMES = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
  hi: "Hindi",
  ar: "Arabic",
  he: "Hebrew",
  fa: "Farsi",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  hu: "Hungarian",
};

const MAX_TEXT_LENGTH = 2000;

/**
 * Light prompt injection sanitizer for user-generated text.
 * Unlike sanitizeLyrics (designed for multi-thousand-word lyrics), this:
 * - Does NOT enforce a minimum length (chat messages can be short)
 * - Does NOT strip HTML tags (chat messages aren't HTML)
 * - Only removes the most dangerous prompt injection patterns
 * - Strips control characters that could manipulate model behavior
 */
function sanitizeForPrompt(text) {
  let cleaned = text;
  // Remove prompt injection patterns
  cleaned = cleaned.replace(
    /ignore\s+(all\s+)?previous\s+(instructions?|commands?|prompts?)/gi,
    "",
  );
  cleaned = cleaned.replace(/system\s*:/gi, "");
  cleaned = cleaned.replace(/assistant\s*:/gi, "");
  cleaned = cleaned.replace(/\[INST\]/gi, "");
  cleaned = cleaned.replace(/\[\/INST\]/gi, "");
  cleaned = cleaned.replace(
    /<\|(?:im_start|im_end|system|user|assistant)\|>/gi,
    "",
  );
  // Strip control characters (keep newlines and tabs)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.trim();
}

export async function handleTranslate(request, env, origin) {
  // Auth check
  const user = await getUserFromAuth(request, env);
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401, origin, env);
  }

  // Rate limit: 30 translations per minute per user
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitOk = await checkRateLimit(
    env,
    `translate:${user.userId}:${ip}`,
    true,
  );
  if (!rateLimitOk) {
    return jsonResponse({ error: "Too many requests" }, 429, origin, env);
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, origin, env);
  }

  const { text, targetLang } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return jsonResponse({ error: "Missing text" }, 400, origin, env);
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return jsonResponse(
      { error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` },
      400,
      origin,
      env,
    );
  }

  if (!targetLang || !LANG_NAMES[targetLang]) {
    return jsonResponse({ error: "Invalid targetLang" }, 400, origin, env);
  }

  const targetName = LANG_NAMES[targetLang];

  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Use Gemini Flash for fast translations
    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Translate the following text to ${targetName}. Return ONLY the translated text, nothing else. No quotes, no explanations, no prefixes.\n\n\`\`\`\n${sanitizeForPrompt(text)}\n\`\`\``,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        `[Translate] Gemini API error: ${response.status} - ${errText}`,
      );
      throw new Error("Translation service unavailable");
    }

    const data = await response.json();
    const translatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!translatedText) {
      throw new Error("Empty translation response");
    }

    return jsonResponse({ translatedText }, 200, origin, env);
  } catch (error) {
    console.error(`[Translate] Error: ${error.message}`);
    return jsonResponse(
      { error: "Translation failed. Please try again." },
      500,
      origin,
      env,
    );
  }
}
