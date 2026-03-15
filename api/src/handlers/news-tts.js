// ============================================================
// NEWS TTS — Standalone, independent TTS for panel analyses
// ============================================================
// Built from scratch. Does NOT use the existing TTS pipeline.
// Takes plain text, calls Gemini TTS API, returns WAV audio.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSecret } from "../utils/secrets.js";

const GEMINI_TTS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

/**
 * Call Gemini TTS API with a script. Returns raw PCM ArrayBuffer.
 */
async function callGeminiTTS(script, voices, apiKey) {
  const body = {
    contents: [{ parts: [{ text: script }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: voices,
        },
      },
    },
  };

  const res = await fetch(`${GEMINI_TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini TTS ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("No audio data in Gemini response");

  // Decode base64 → Uint8Array
  const bin = atob(b64);
  const pcm = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);
  return pcm.buffer;
}

/**
 * Convert PCM to WAV
 */
function toWav(pcmBuffer) {
  const pcm = new Uint8Array(pcmBuffer);
  const sampleRate = 24000;
  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcm.byteLength;
  const headerSize = 44;

  const wav = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(wav);

  // RIFF header
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, headerSize + dataSize - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  new Uint8Array(wav).set(pcm, headerSize);
  return wav;
}

/**
 * Strip markdown from text for TTS
 */
function cleanForTTS(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,4}\s*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/Philosify/gi, "Filosifai")
    .replace(/\bPeikoff\b/g, "Peekoff")
    .replace(/\bAyn\b/g, "Ine")
    .trim();
}

/**
 * POST /api/news/tts
 * Body: { text, title, lang }
 * Returns: WAV audio
 */
export async function handleNewsTTS(request, env, origin) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    // Auth
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return jsonResponse({ error: "Auth required" }, 401, origin, env);
    }

    const { text, title, lang } = await request.json();
    if (!text || text.length < 50) {
      return jsonResponse({ error: "Text too short" }, 400, origin, env);
    }

    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) {
      return jsonResponse({ error: "TTS not configured" }, 500, origin, env);
    }

    // Clean text
    const clean = cleanForTTS(text);
    console.log(`[NewsTTS] ${clean.length} chars, title: "${title}", lang: ${lang}`);

    // R2 cache check
    const cacheKey = `news_tts_${btoa(title || "").substring(0, 40)}_${lang || "en"}.wav`;
    try {
      const cached = await env.TTS_CACHE.get(cacheKey);
      if (cached) {
        console.log(`[NewsTTS] Cache HIT: ${cacheKey}`);
        const buf = await cached.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: { "Content-Type": "audio/wav", ...corsHeaders },
        });
      }
    } catch (_) { /* cache miss, continue */ }

    // Voices
    const voices = [
      { speaker: "Kore", voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
      { speaker: "Puck", voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } },
      { speaker: "Charon", voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } } },
    ];

    // Split text into chunks of ~1200 chars max
    const LIMIT = 1200;
    const chunks = [];
    for (let i = 0; i < clean.length; i += LIMIT) {
      chunks.push(clean.substring(i, i + LIMIT));
    }

    console.log(`[NewsTTS] Split into ${chunks.length} chunks`);

    // Build one script per chunk, alternating philosopher voices
    const langLabel = lang === "pt" ? "Portuguese" : lang === "es" ? "Spanish" : lang === "fr" ? "French" : lang === "de" ? "German" : lang === "it" ? "Italian" : "English";

    const scripts = chunks.map((chunk, i) => {
      const philoVoice = i % 2 === 0 ? "Puck" : "Charon";
      let s = `Voices: Kore (female host), Puck (male analyst 1), Charon (male analyst 2).\nSpeak in ${langLabel}.\n\n`;

      if (i === 0) {
        s += `Kore: Filosifai. Philosophical panel analysis for ${title || "this story"}.\n\n`;
      }

      s += `${philoVoice}: ${chunk}\n\n`;

      if (i === chunks.length - 1) {
        s += `Kore: That concludes our Filosifai philosopher panel.\n`;
      }

      return s;
    });

    // Generate all chunks in parallel
    const pcmBuffers = await Promise.all(
      scripts.map((script, i) => {
        console.log(`[NewsTTS] Chunk ${i + 1}: ${script.length} chars`);
        return callGeminiTTS(script, voices, apiKey);
      })
    );

    // Concatenate PCM
    let totalLen = 0;
    for (const buf of pcmBuffers) totalLen += buf.byteLength;
    const combined = new Uint8Array(totalLen);
    let offset = 0;
    for (const buf of pcmBuffers) {
      combined.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    const wav = toWav(combined.buffer);
    console.log(`[NewsTTS] Done: ${wav.byteLength} bytes WAV`);

    // Cache in R2 (background)
    try {
      await env.TTS_CACHE.put(cacheKey, wav, {
        customMetadata: { type: "news-panel", lang: lang || "en" },
      });
    } catch (_) { /* R2 save failed, ok */ }

    return new Response(wav, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": wav.byteLength.toString(),
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error(`[NewsTTS] Error:`, err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
