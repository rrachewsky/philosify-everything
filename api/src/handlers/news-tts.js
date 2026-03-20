// ============================================================
// NEWS/PANEL TTS — Parallel chunk generation with voice rotation.
// Splits long texts into chunks, generates in parallel with
// different voices per chunk, adds silence gaps, concatenates.
// ============================================================

import { jsonResponse } from "../utils/index.js";
import { getUserFromAuth } from "../auth/index.js";
import { getSecret } from "../utils/secrets.js";

const TTS_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

// ============================================================
// Acronym handling for TTS — first occurrence: full name + abbreviation
// Subsequent occurrences: phonetic pronunciation of the abbreviation
// Example (PT): first "EUA" → "Estados Unidos, EUA" / then "EUA" → "eh-oo-ah"
// ============================================================

// Each entry: { full: "full name", spoken: "how TTS should say the abbreviation" }
const ACRONYMS = {
  en: {
    "USA": { full: "United States", spoken: "U.S.A." },
    "US": { full: "United States", spoken: "U.S." },
    "U.S.": { full: "United States", spoken: "U.S." },
    "UK": { full: "United Kingdom", spoken: "U.K." },
    "U.K.": { full: "United Kingdom", spoken: "U.K." },
    "EU": { full: "European Union", spoken: "E.U." },
    "UN": { full: "United Nations", spoken: "U.N." },
    "NATO": { full: "NATO, the North Atlantic Treaty Organization", spoken: "NATO" },
    "FBI": { full: "FBI, the Federal Bureau of Investigation", spoken: "F.B.I." },
    "CIA": { full: "CIA, the Central Intelligence Agency", spoken: "C.I.A." },
    "GDP": { full: "GDP, Gross Domestic Product", spoken: "G.D.P." },
    "IMF": { full: "IMF, the International Monetary Fund", spoken: "I.M.F." },
    "WHO": { full: "WHO, the World Health Organization", spoken: "W.H.O." },
    "WTO": { full: "WTO, the World Trade Organization", spoken: "W.T.O." },
    "AI": { full: "Artificial Intelligence", spoken: "A.I." },
    "CEO": { full: "CEO, Chief Executive Officer", spoken: "C.E.O." },
    "IPO": { full: "IPO, Initial Public Offering", spoken: "I.P.O." },
    "NYSE": { full: "the New York Stock Exchange", spoken: "N.Y.S.E." },
    "SEC": { full: "SEC, the Securities and Exchange Commission", spoken: "S.E.C." },
    "FED": { full: "the Federal Reserve", spoken: "the Fed" },
    "GOP": { full: "the Republican Party", spoken: "G.O.P." },
    "SCOTUS": { full: "the Supreme Court", spoken: "the Supreme Court" },
    "OPEC": { full: "OPEC, the Organization of Petroleum Exporting Countries", spoken: "OPEC" },
    "BRICS": { full: "BRICS, Brazil, Russia, India, China and South Africa", spoken: "BRICS" },
    "ICC": { full: "ICC, the International Criminal Court", spoken: "I.C.C." },
    "NGO": { full: "NGO, a non-governmental organization", spoken: "N.G.O." },
    "DOJ": { full: "the Department of Justice", spoken: "D.O.J." },
    "PM": { full: "Prime Minister", spoken: "Prime Minister" },
    "VP": { full: "Vice President", spoken: "Vice President" },
  },
  pt: {
    // EUA/USA — always spoken in full, never abbreviated in speech
    "EUA": { full: "Estados Unidos", spoken: "Estados Unidos" },
    "E.U.A.": { full: "Estados Unidos", spoken: "Estados Unidos" },
    "USA": { full: "Estados Unidos", spoken: "Estados Unidos" },
    "US": { full: "Estados Unidos", spoken: "Estados Unidos" },
    "ONU": { full: "Organização das Nações Unidas, ONU", spoken: "onu" },
    "UN": { full: "Nações Unidas", spoken: "onu" },
    "OTAN": { full: "OTAN, Organização do Tratado do Atlântico Norte", spoken: "otã" },
    "NATO": { full: "OTAN, Organização do Tratado do Atlântico Norte", spoken: "otã" },
    "PIB": { full: "Produto Interno Bruto, PIB", spoken: "píbi" },
    "GDP": { full: "Produto Interno Bruto", spoken: "píbi" },
    "OMS": { full: "Organização Mundial da Saúde, OMS", spoken: "óms" },
    "WHO": { full: "Organização Mundial da Saúde", spoken: "óms" },
    "OMC": { full: "Organização Mundial do Comércio, OMC", spoken: "ómc" },
    "WTO": { full: "Organização Mundial do Comércio", spoken: "ómc" },
    "ONG": { full: "ONG, organização não governamental", spoken: "óngue" },
    "NGO": { full: "organização não governamental", spoken: "óngue" },
    "BRICS": { full: "BRICS, Brasil, Rússia, Índia, China e África do Sul", spoken: "brícs" },
    "OPEC": { full: "OPEP, Organização dos Países Exportadores de Petróleo", spoken: "opépi" },
    // Acronyms SPELLED OUT letter by letter in Brazilian Portuguese
    "UE": { full: "União Europeia, UE", spoken: "ú-é" },
    "EU": { full: "União Europeia", spoken: "ú-é" },
    "FMI": { full: "Fundo Monetário Internacional, FMI", spoken: "éfi-êmi-í" },
    "IMF": { full: "Fundo Monetário Internacional", spoken: "éfi-êmi-í" },
    "IA": { full: "Inteligência Artificial, IA", spoken: "i-á" },
    "AI": { full: "Inteligência Artificial", spoken: "i-á" },
    "STF": { full: "Supremo Tribunal Federal, STF", spoken: "éssi-tê-éfi" },
    "TSE": { full: "Tribunal Superior Eleitoral, TSE", spoken: "tê-éssi-ê" },
    "PF": { full: "Polícia Federal, PF", spoken: "pê-éfi" },
    "FBI": { full: "FBI, a Polícia Federal americana", spoken: "éfi-bê-í" },
    "CIA": { full: "CIA, a Agência Central de Inteligência americana", spoken: "cía" },
    "BC": { full: "Banco Central, BC", spoken: "bê-cê" },
    "FED": { full: "Federal Reserve, o banco central americano", spoken: "féd" },
    "IBGE": { full: "IBGE, Instituto Brasileiro de Geografia e Estatística", spoken: "i-bê-gê-ê" },
    "BNDES": { full: "BNDES, Banco Nacional de Desenvolvimento", spoken: "bê-êne-dê-éssi" },
    "UK": { full: "Reino Unido", spoken: "Reino Unido" },
    "ICC": { full: "Tribunal Penal Internacional", spoken: "Tribunal Penal Internacional" },
    "CEO": { full: "CEO, diretor executivo", spoken: "cê-ê-ô" },
    "PM": { full: "Primeiro Ministro", spoken: "Primeiro Ministro" },
    "VP": { full: "Vice Presidente", spoken: "Vice Presidente" },
  },
  es: {
    "EE.UU.": { full: "Estados Unidos", spoken: "eh-eh oo-oo" },
    "EEUU": { full: "Estados Unidos", spoken: "eh-eh oo-oo" },
    "EUA": { full: "Estados Unidos", spoken: "eh-oo-ah" },
    "USA": { full: "Estados Unidos", spoken: "eh-oo-ah" },
    "US": { full: "Estados Unidos", spoken: "eh-oo-ah" },
    "UE": { full: "Unión Europea, UE", spoken: "oo-eh" },
    "EU": { full: "Unión Europea", spoken: "oo-eh" },
    "ONU": { full: "Organización de las Naciones Unidas, ONU", spoken: "ô-ene-oo" },
    "UN": { full: "Naciones Unidas", spoken: "ô-ene-oo" },
    "OTAN": { full: "OTAN, Organización del Tratado del Atlántico Norte", spoken: "ô-tán" },
    "NATO": { full: "OTAN", spoken: "ô-tán" },
    "PIB": { full: "Producto Interno Bruto, PIB", spoken: "pê-i-bê" },
    "GDP": { full: "Producto Interno Bruto", spoken: "pê-i-bê" },
    "FMI": { full: "Fondo Monetario Internacional, FMI", spoken: "éfe-eme-i" },
    "IMF": { full: "Fondo Monetario Internacional", spoken: "éfe-eme-i" },
    "OMS": { full: "Organización Mundial de la Salud, OMS", spoken: "ô-eme-ésse" },
    "WHO": { full: "Organización Mundial de la Salud", spoken: "ô-eme-ésse" },
    "IA": { full: "Inteligencia Artificial, IA", spoken: "i-á" },
    "AI": { full: "Inteligencia Artificial", spoken: "i-á" },
    "ONG": { full: "ONG, organización no gubernamental", spoken: "ô-ene-gê" },
    "NGO": { full: "organización no gubernamental", spoken: "ô-ene-gê" },
    "UK": { full: "Reino Unido", spoken: "Reino Unido" },
    "BRICS": { full: "BRICS, Brasil, Rusia, India, China y Sudáfrica", spoken: "brícs" },
    "CEO": { full: "CEO, director ejecutivo", spoken: "cê-ê-ô" },
    "PM": { full: "Primer Ministro", spoken: "Primer Ministro" },
    "OPEC": { full: "OPEP, Organización de Países Exportadores de Petróleo", spoken: "ô-pép" },
  },
};

/**
 * Process acronyms for TTS:
 * - First occurrence: "Full Name, ACRONYM" (introduces the term)
 * - Subsequent occurrences: phonetic pronunciation (natural speech)
 */
function expandAcronyms(text, lang) {
  // Only expand for languages where we have verified native pronunciations
  // Other languages: let Gemini TTS handle acronyms natively
  if (!ACRONYMS[lang]) return text;

  const langAcronyms = ACRONYMS[lang];
  const enAcronyms = ACRONYMS.en || {};
  const merged = { ...enAcronyms, ...langAcronyms };

  const seen = new Set();
  let result = text;

  // Sort by length descending so longer acronyms match first
  const sorted = Object.entries(merged).sort((a, b) => b[0].length - a[0].length);

  for (const [acronym, { full, spoken }] of sorted) {
    const escaped = acronym.replace(/\./g, "\\.").replace(/\$/g, "\\$");
    const regex = new RegExp(`\\b${escaped}\\b`, "g");

    // Track the canonical key (e.g. "USA" and "US" both map to "United States")
    const canonicalKey = full.substring(0, 30).toLowerCase();

    result = result.replace(regex, (match) => {
      if (!seen.has(canonicalKey)) {
        seen.add(canonicalKey);
        return full; // First occurrence: full name (may include the acronym)
      }
      return spoken; // Subsequent: phonetic pronunciation
    });
  }

  return result;
}

// Rotate through Gemini TTS voices for each chunk
const VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"];

async function ttsCall(text, apiKey, voiceName = "Puck") {
  const res = await fetch(`${TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
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

// 0.3s silence at 24000 Hz, 16-bit mono = 14400 bytes
function silenceGap() {
  return new Uint8Array(14400);
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

// R2 cache helpers for TTS audio
async function hashForCache(str) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}

async function getFromR2(env, key) {
  if (!env.TTS_CACHE) return null;
  try {
    const obj = await env.TTS_CACHE.get(key);
    if (obj) {
      console.log(`[NewsTTS] R2 cache HIT: ${key}`);
      return await obj.arrayBuffer();
    }
    console.log(`[NewsTTS] R2 cache MISS: ${key}`);
    return null;
  } catch (e) {
    console.error(`[NewsTTS] R2 read error: ${e.message}`);
    return null;
  }
}

async function saveToR2(env, key, buffer) {
  if (!env.TTS_CACHE) return;
  try {
    await env.TTS_CACHE.put(key, buffer, {
      httpMetadata: { contentType: "audio/wav", cacheControl: "public, max-age=31536000" },
    });
    console.log(`[NewsTTS] R2 cache SAVED: ${key} (${buffer.byteLength} bytes)`);
  } catch (e) {
    console.error(`[NewsTTS] R2 save error: ${e.message}`);
  }
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

    // Check R2 cache first (deterministic key from text content + lang)
    const textHash = await hashForCache(`${text}:${lang || "en"}`);
    const r2Key = `news-tts/${lang || "en"}/${textHash}.wav`;
    const cached = await getFromR2(env, r2Key);
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: { "Content-Type": "audio/wav", ...cors },
      });
    }

    const apiKey = await getSecret(env.GEMINI_API_KEY);

    // Clean markdown + pronunciation + expand acronyms
    const clean = expandAcronyms(
      text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/#{1,4}\s*/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/Philosify/gi, "Filosifai")
        .replace(/\bPeikoff\b/g, "Peekoff")
        .replace(/\bAyn\b/g, "Ine")
        .trim(),
      lang || "en",
    );

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
      let splitAt = remaining.lastIndexOf("\n\n", LIMIT);
      if (splitAt < LIMIT * 0.3) splitAt = remaining.lastIndexOf(". ", LIMIT);
      if (splitAt < LIMIT * 0.3) splitAt = LIMIT;
      chunks.push(remaining.substring(0, splitAt + 1));
      remaining = remaining.substring(splitAt + 1).trim();
    }

    console.log(`[NewsTTS] ${chunks.length} chunks, generating in parallel with voice rotation...`);

    // Generate all chunks in parallel, each with a different voice
    const pcmResults = await Promise.all(
      chunks.map((chunk, i) => {
        const voice = VOICES[i % VOICES.length];
        console.log(`[NewsTTS] Chunk ${i + 1}/${chunks.length}: ${chunk.length} chars, voice: ${voice}`);
        return ttsCall(chunk, apiKey, voice);
      })
    );

    // Interleave PCM arrays with silence gaps between chunks
    const allPcm = [];
    const gap = silenceGap();
    for (let i = 0; i < pcmResults.length; i++) {
      allPcm.push(pcmResults[i]);
      if (i < pcmResults.length - 1) {
        allPcm.push(gap);
      }
    }

    const wav = buildWav(allPcm);
    console.log(`[NewsTTS] Done: ${wav.byteLength} bytes`);

    // Save to R2 for future requests
    await saveToR2(env, r2Key, wav);

    return new Response(wav, {
      status: 200,
      headers: { "Content-Type": "audio/wav", ...cors },
    });
  } catch (err) {
    console.error("[NewsTTS]", err.message);
    return jsonResponse({ error: err.message }, 500, origin, env);
  }
}
