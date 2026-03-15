// ============================================================
// NEWS/PANEL TTS — One narrator reads the full text.
// Splits long texts into chunks, generates sequentially, concatenates.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSecret } from "../utils/secrets.js";

const TTS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

async function ttsCall(text, apiKey) {
  const res = await fetch(`${TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS ${res.status}: ${err.substring(0, 150)}`);
  }

  const data = await res.json();
  const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) throw new Error("No audio data");

  const bin = atob(b64);
  const pcm = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);
  return pcm;
}

function buildWav(pcmArrays) {
  let total = 0;
  for (const a of pcmArrays) total += a.byteLength;

  const wav = new ArrayBuffer(44 + total);
  const v = new DataView(wav);
  const s = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };

  s(0, "RIFF"); v.setUint32(4, 36 + total, true);
  s(8, "WAVE"); s(12, "fmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 24000, true); v.setUint32(28, 48000, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  s(36, "data"); v.setUint32(40, total, true);

  const bytes = new Uint8Array(wav);
  let off = 44;
  for (const a of pcmArrays) { bytes.set(a, off); off += a.byteLength; }
  return wav;
}

export async function handleNewsTTS(request, env, origin) {
  const cors = {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return jsonResponse({ error: "Auth" }, 401, origin, env);

    const { text, title, lang } = await request.json();
    if (!text) return jsonResponse({ error: "No text" }, 400, origin, env);

    const apiKey = await getSecret(env.GEMINI_API_KEY);

    // Clean markdown + pronunciation
    const clean = text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,4}\s*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/Philosify/gi, "Filosifai")
      .replace(/\bPeikoff\b/g, "Peekoff")
      .replace(/\bAyn\b/g, "Ine")
      .trim();

    console.log(`[NewsTTS] ${clean.length} chars`);

    // Split into chunks of ~3000 chars at paragraph boundaries
    const LIMIT = 3000;
    const chunks = [];
    let remaining = clean;

    while (remaining.length > 0) {
      if (remaining.length <= LIMIT) {
        chunks.push(remaining);
        break;
      }
      // Find last paragraph break before limit
      let splitAt = remaining.lastIndexOf("\n\n", LIMIT);
      if (splitAt < LIMIT * 0.3) splitAt = remaining.lastIndexOf(". ", LIMIT);
      if (splitAt < LIMIT * 0.3) splitAt = LIMIT;
      chunks.push(remaining.substring(0, splitAt + 1));
      remaining = remaining.substring(splitAt + 1).trim();
    }

    console.log(`[NewsTTS] ${chunks.length} chunks`);

    // Generate each chunk sequentially (avoids rate limits)
    const pcmArrays = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[NewsTTS] Chunk ${i + 1}/${chunks.length}: ${chunks[i].length} chars`);
      const pcm = await ttsCall(chunks[i], apiKey);
      pcmArrays.push(pcm);
    }

    const wav = buildWav(pcmArrays);
    console.log(`[NewsTTS] Done: ${wav.byteLength} bytes`);

    return new Response(wav, {
      status: 200,
      headers: { "Content-Type": "audio/wav", ...cors },
    });
  } catch (err) {
    console.error("[NewsTTS]", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}
