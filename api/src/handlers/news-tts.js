// ============================================================
// NEWS TTS — Standalone, reliable TTS for panel analyses
// ============================================================
// Uses SINGLE VOICE mode (simplest Gemini TTS call).
// Short chunks (800 chars). Server-side retry (2 attempts).
// Built to never fail.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSecret } from "../utils/secrets.js";

const GEMINI_TTS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

/**
 * Single-voice Gemini TTS call. Simplest possible API shape.
 * Retries once on failure.
 */
async function callTTS(text, voiceName, apiKey) {
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${GEMINI_TTS_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[NewsTTS] Attempt ${attempt} failed: ${res.status} ${errText.substring(0, 150)}`);
        if (attempt === 2) throw new Error(`TTS API ${res.status}`);
        await new Promise((r) => setTimeout(r, 1000)); // wait 1s before retry
        continue;
      }

      const data = await res.json();
      const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!b64) {
        if (attempt === 2) throw new Error("No audio in response");
        continue;
      }

      const bin = atob(b64);
      const pcm = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);
      return pcm;
    } catch (err) {
      if (attempt === 2) throw err;
      console.warn(`[NewsTTS] Attempt ${attempt} error: ${err.message}, retrying...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

/**
 * PCM → WAV
 */
function toWav(pcmArrays) {
  let totalLen = 0;
  for (const a of pcmArrays) totalLen += a.byteLength;

  const sampleRate = 24000;
  const headerSize = 44;
  const wav = new ArrayBuffer(headerSize + totalLen);
  const v = new DataView(wav);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

  w(0, "RIFF");
  v.setUint32(4, headerSize + totalLen - 8, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, totalLen, true);

  const bytes = new Uint8Array(wav);
  let offset = headerSize;
  for (const a of pcmArrays) {
    bytes.set(a, offset);
    offset += a.byteLength;
  }
  return wav;
}

/**
 * Clean text for TTS
 */
function clean(text) {
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

    // R2 cache check
    const safeTitle = (title || "untitled").replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const cacheKey = `news_tts_${safeTitle}_${lang || "en"}.wav`;
    try {
      const cached = await env.TTS_CACHE.get(cacheKey);
      if (cached) {
        console.log(`[NewsTTS] Cache HIT`);
        const buf = await cached.arrayBuffer();
        return new Response(buf, {
          status: 200,
          headers: { "Content-Type": "audio/wav", ...corsHeaders },
        });
      }
    } catch (_) {}

    const cleaned = clean(text);
    console.log(`[NewsTTS] Generating: ${cleaned.length} chars, ${title}`);

    // Split into small chunks (800 chars max for reliability)
    const CHUNK = 800;
    const parts = [];
    for (let i = 0; i < cleaned.length; i += CHUNK) {
      parts.push(cleaned.substring(i, i + CHUNK));
    }

    console.log(`[NewsTTS] ${parts.length} chunks of ~${CHUNK} chars`);

    // Generate each chunk sequentially with single voice (most reliable)
    // Sequential avoids rate limiting. Single voice avoids multi-speaker complexity.
    const pcmArrays = [];
    for (let i = 0; i < parts.length; i++) {
      console.log(`[NewsTTS] Chunk ${i + 1}/${parts.length} (${parts[i].length} chars)`);
      const pcm = await callTTS(parts[i], "Puck", apiKey);
      pcmArrays.push(pcm);
    }

    const wav = toWav(pcmArrays);
    console.log(`[NewsTTS] Done: ${wav.byteLength} bytes WAV`);

    // Cache in R2
    try {
      await env.TTS_CACHE.put(cacheKey, wav);
    } catch (_) {}

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
