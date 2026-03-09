// Translate API service - on-demand message translation
import { config } from '@/config';

/**
 * Translate text to the target language via backend Gemini Flash API.
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g. 'pt', 'en', 'es')
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang) {
  const res = await fetch(`${config.apiUrl}/api/translate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Translation failed');
  }

  const data = await res.json();
  return data.translatedText;
}
