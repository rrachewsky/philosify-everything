// ============================================================
// HANDLER - TEXT-TO-SPEECH (OpenAI TTS)
// ============================================================

import { getSecret } from '../utils/secrets.js';
import { getCorsHeaders } from '../utils/cors.js';

// Voice mapping by language
const VOICE_BY_LANG = {
  en: 'alloy',
  pt: 'nova',
  es: 'nova',
  fr: 'nova',
  de: 'onyx',
  it: 'nova',
  ru: 'onyx',
  ja: 'nova',
  ko: 'nova',
  zh: 'nova',
  ar: 'onyx',
  he: 'onyx',
  hi: 'nova',
  hu: 'onyx',
  fa: 'onyx'
};

// Labels by language for section headers
const LABELS = {
  en: {
    integratedAnalysis: 'Integrated Philosophical Analysis',
    historicalContext: 'Historical Context',
    creativeProcess: 'Creative Process',
    schoolsOfThought: 'Schools of Thought',
    scorecard: 'Philosophical Scorecard',
    ethics: 'Ethics',
    metaphysics: 'Metaphysics',
    epistemology: 'Epistemology',
    politics: 'Politics',
    aesthetics: 'Aesthetics',
    finalScore: 'Final Score',
    classification: 'Classification'
  },
  pt: {
    integratedAnalysis: 'Análise Filosófica Integrada',
    historicalContext: 'Contexto Histórico',
    creativeProcess: 'Processo Criativo',
    schoolsOfThought: 'Escolas de Pensamento',
    scorecard: 'Pontuação Filosófica',
    ethics: 'Ética',
    metaphysics: 'Metafísica',
    epistemology: 'Epistemologia',
    politics: 'Política',
    aesthetics: 'Estética',
    finalScore: 'Pontuação Final',
    classification: 'Classificação'
  },
  es: {
    integratedAnalysis: 'Análisis Filosófico Integrado',
    historicalContext: 'Contexto Histórico',
    creativeProcess: 'Proceso Creativo',
    schoolsOfThought: 'Escuelas de Pensamiento',
    scorecard: 'Puntuación Filosófica',
    ethics: 'Ética',
    metaphysics: 'Metafísica',
    epistemology: 'Epistemología',
    politics: 'Política',
    aesthetics: 'Estética',
    finalScore: 'Puntuación Final',
    classification: 'Clasificación'
  }
};

// Get labels for language (fallback to English)
function getLabels(lang) {
  return LABELS[lang] || LABELS.en;
}

// Strip HTML tags for TTS
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

// ============================================================
// R2 CACHE UTILITIES
// ============================================================

/**
 * Generate a cache key for R2 storage
 * Uses SHA-256 hash of song+artist to create a unique, safe filename
 */
async function getCacheKey(result, lang) {
  const song = result?.song || result?.song_name || '';
  const artist = result?.artist || '';
  const spotifyId = result?.spotify_id || '';

  // If we have spotify_id, use it directly (most reliable)
  if (spotifyId) {
    return `${spotifyId}_${lang}.mp3`;
  }

  // Otherwise, create hash from song+artist
  const identifier = `${song}|${artist}`.toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(identifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${hashHex.substring(0, 32)}_${lang}.mp3`;
}

/**
 * Try to get audio from R2 cache
 * @returns {ArrayBuffer|null} Audio buffer if found, null otherwise
 */
async function getFromR2Cache(env, cacheKey) {
  if (!env.TTS_CACHE) {
    console.log('[TTS Cache] R2 bucket not configured');
    return null;
  }

  try {
    const object = await env.TTS_CACHE.get(cacheKey);
    if (object) {
      console.log(`[TTS Cache] ✓ HIT: ${cacheKey}`);
      return await object.arrayBuffer();
    }
    console.log(`[TTS Cache] MISS: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error('[TTS Cache] Error reading from R2:', error.message);
    return null;
  }
}

/**
 * Save audio to R2 cache
 */
async function saveToR2Cache(env, cacheKey, audioBuffer) {
  if (!env.TTS_CACHE) {
    console.log('[TTS Cache] R2 bucket not configured, skipping save');
    return false;
  }

  try {
    await env.TTS_CACHE.put(cacheKey, audioBuffer, {
      httpMetadata: {
        contentType: 'audio/mpeg',
        cacheControl: 'public, max-age=31536000' // 1 year
      }
    });
    console.log(`[TTS Cache] ✓ SAVED: ${cacheKey} (${audioBuffer.byteLength} bytes)`);
    return true;
  } catch (error) {
    console.error('[TTS Cache] Error saving to R2:', error.message);
    return false;
  }
}

// Split text into chunks that fit within OpenAI's limit
// Tries to split at sentence boundaries for natural speech
function splitTextIntoChunks(text, maxLength = 4000) {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Find a good split point (end of sentence) within the limit
    let splitPoint = maxLength;

    // Look for sentence endings: . ! ? followed by space
    const searchArea = remaining.substring(0, maxLength);
    const lastPeriod = searchArea.lastIndexOf('. ');
    const lastExclaim = searchArea.lastIndexOf('! ');
    const lastQuestion = searchArea.lastIndexOf('? ');

    // Find the latest sentence boundary
    const bestSplit = Math.max(lastPeriod, lastExclaim, lastQuestion);

    if (bestSplit > maxLength * 0.5) {
      // Good split point found (at least halfway through)
      splitPoint = bestSplit + 2; // Include the punctuation and space
    } else {
      // No good sentence boundary, try to split at a space
      const lastSpace = searchArea.lastIndexOf(' ');
      if (lastSpace > maxLength * 0.7) {
        splitPoint = lastSpace + 1;
      }
      // Otherwise just split at maxLength
    }

    chunks.push(remaining.substring(0, splitPoint).trim());
    remaining = remaining.substring(splitPoint).trim();
  }

  return chunks;
}

// Generate TTS audio for a single chunk
async function generateChunkAudio(text, voice, apiKey) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[TTS] OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI TTS API error: ${response.status}`);
  }

  return await response.arrayBuffer();
}

// Concatenate multiple MP3 buffers
function concatenateAudioBuffers(buffers) {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return result.buffer;
}

// Build full text from analysis result
// Order: Song title → Historical Context → Creative Process → Integrated Philosophical Analysis
// Excludes: Technical Specs, Scorecard details
function buildFullText(result, lang = 'en') {
  const L = getLabels(lang);
  const parts = [];

  // Song title and artist
  const song = result.song || result.song_name || result.title || '';
  const artist = result.artist || '';
  if (song && artist) {
    parts.push(`${song} - ${artist}`);
    parts.push('');
  }

  // 1. Historical Context
  const context = result.historical_context || result.context || '';
  if (context) {
    parts.push(L.historicalContext);
    parts.push(stripHtml(context));
    parts.push('');
  }

  // 2. Creative Process
  const process = result.creative_process || '';
  if (process) {
    parts.push(L.creativeProcess);
    parts.push(stripHtml(process));
    parts.push('');
  }

  // 3. Integrated Philosophical Analysis
  const analysis = result.philosophical_analysis || result.integrated_analysis || '';
  if (analysis) {
    parts.push(L.integratedAnalysis);
    parts.push(stripHtml(analysis));
    parts.push('');
  }

  return parts.join('\n').trim();
}

export async function handleTTS(request, env, origin) {
  // Helper to return JSON with CORS headers
  const corsHeaders = getCorsHeaders(origin, env);
  const jsonResponse = (data, status) => new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    }
  });

  console.log('[TTS] Handler started');

  try {
    let body;
    try {
      body = await request.json();
      console.log('[TTS] Body parsed successfully');
    } catch (parseError) {
      console.error('[TTS] Failed to parse request body:', parseError.message);
      return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
    }

    const { result, lang = 'en' } = body || {};

    console.log('[TTS] Request received, lang:', lang, 'result keys:', result ? Object.keys(result) : 'null');
    console.log('[TTS] Result type:', typeof result);

    if (!result || typeof result !== 'object') {
      console.error('[TTS] Missing or invalid result in request body');
      return jsonResponse({ error: 'Missing analysis result' }, 400);
    }

    // Build full text
    const text = buildFullText(result, lang);
    console.log('[TTS] Built text length:', text?.length, 'first 100 chars:', text?.substring(0, 100));

    if (!text || text.length < 50) {
      return jsonResponse({ error: 'Text too short for TTS' }, 400);
    }

    // Clean text for TTS - remove any problematic characters
    const cleanedText = text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanedText || cleanedText.length < 10) {
      console.error('[TTS] Text too short after cleaning:', cleanedText?.length);
      return jsonResponse({ error: 'Text too short for TTS after cleaning' }, 400);
    }

    console.log(`[TTS] Generating audio for ${cleanedText.length} characters, lang: ${lang}`);

    // ============================================================
    // R2 CACHE CHECK - Try to get cached audio first
    // ============================================================
    const cacheKey = await getCacheKey(result, lang);
    console.log(`[TTS] Cache key: ${cacheKey}`);

    const cachedAudio = await getFromR2Cache(env, cacheKey);
    if (cachedAudio) {
      console.log(`[TTS] ✓ Returning cached audio (${cachedAudio.byteLength} bytes)`);
      return new Response(cachedAudio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': cachedAudio.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000', // 1 year (from R2)
          'X-TTS-Cache': 'HIT',
          ...getCorsHeaders(origin, env),
        }
      });
    }

    // ============================================================
    // GENERATE NEW AUDIO - Cache miss, generate via OpenAI
    // ============================================================

    // Get OpenAI API key
    const apiKey = await getSecret(env.OPENAI_API_KEY);
    if (!apiKey) {
      console.error('[TTS] OPENAI_API_KEY not found in env');
      return jsonResponse({ error: 'TTS service not configured' }, 500);
    }

    // Select voice based on language
    const voice = VOICE_BY_LANG[lang] || 'alloy';

    // Split text into chunks if needed (OpenAI TTS has 4096 char limit)
    const chunks = splitTextIntoChunks(cleanedText, 4000);
    console.log(`[TTS] Text split into ${chunks.length} chunk(s)`);

    let audioBuffer;

    if (chunks.length === 1) {
      // Single chunk - simple case
      audioBuffer = await generateChunkAudio(chunks[0], voice, apiKey);
    } else {
      // Multiple chunks - generate each and concatenate
      const audioBuffers = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`[TTS] Generating chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
        const buffer = await generateChunkAudio(chunks[i], voice, apiKey);
        audioBuffers.push(buffer);
      }
      audioBuffer = concatenateAudioBuffers(audioBuffers);
    }

    console.log(`[TTS] ✓ Generated ${audioBuffer.byteLength} bytes of audio`);

    // ============================================================
    // SAVE TO R2 CACHE - For future requests
    // ============================================================
    // Don't await - save in background to not delay response
    saveToR2Cache(env, cacheKey, audioBuffer).catch(err => {
      console.error('[TTS Cache] Background save failed:', err.message);
    });

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'X-TTS-Cache': 'MISS',
        ...getCorsHeaders(origin, env),
      }
    });

  } catch (error) {
    console.error('[TTS] Error:', error);
    return jsonResponse({ error: "TTS processing failed" }, 500);
  }
}
