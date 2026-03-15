// ============================================================
// NEWS TTS — One narrator reads the text. That's it.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSecret } from "../utils/secrets.js";

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

    // Clean markdown
    const clean = text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,4}\s*/g, "")
      .replace(/Philosify/gi, "Filosifai")
      .trim();

    // One API call. One voice. Plain text.
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: clean.substring(0, 4000) }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Puck" },
              },
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[NewsTTS]", res.status, err.substring(0, 200));
      return jsonResponse({ error: "TTS failed" }, 500, origin, env);
    }

    const data = await res.json();
    const b64 = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) return jsonResponse({ error: "No audio" }, 500, origin, env);

    // Base64 → PCM → WAV
    const bin = atob(b64);
    const pcm = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) pcm[i] = bin.charCodeAt(i);

    const sr = 24000;
    const wav = new ArrayBuffer(44 + pcm.byteLength);
    const v = new DataView(wav);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + pcm.byteLength, true);
    w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, "data"); v.setUint32(40, pcm.byteLength, true);
    new Uint8Array(wav).set(pcm, 44);

    console.log(`[NewsTTS] OK: ${wav.byteLength} bytes`);

    return new Response(wav, {
      status: 200,
      headers: { "Content-Type": "audio/wav", ...cors },
    });
  } catch (err) {
    console.error("[NewsTTS]", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}
