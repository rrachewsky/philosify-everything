// ============================================================
// TTS - TEXT-TO-SPEECH GENERATION & STORAGE (DEPRECATED)
// ============================================================
//
// DEPRECATED: This OpenAI-based TTS module is no longer used in production.
// TTS is now generated on-demand via /api/tts endpoint using Gemini 2.5 Flash
// with multi-speaker support (see api/src/tts/gemini.js).
//
// This file is kept for backward compatibility with debug scripts.
// Do NOT call generateAndStoreTTS from analyze.js - it's been removed.
//
// Old implementation: OpenAI TTS with single voice, stored in Supabase Storage
// New implementation: Gemini TTS with 2 speakers + interjections, stored in R2

import { getSecret } from "../utils/secrets.js";

// Voice mapping by language
const VOICE_BY_LANG = {
  en: "alloy",
  pt: "nova",
  es: "nova",
  fr: "nova",
  de: "onyx",
  it: "nova",
  ru: "onyx",
  ja: "nova",
  ko: "nova",
  zh: "nova",
  ar: "onyx",
  he: "onyx",
  hi: "nova",
  hu: "onyx",
  fa: "onyx",
};

// Labels by language for section headers (TTS narration)
const LABELS = {
  en: {
    technicalSpecs: "Technical Specifications",
    historicalContext: "Historical Context",
    creativeProcess: "Creative Process",
    integratedAnalysis: "Integrated Philosophical Analysis",
    classification: "Philosophical Classification",
  },
  pt: {
    technicalSpecs: "Especificações Técnicas",
    historicalContext: "Contexto Histórico",
    creativeProcess: "Processo Criativo",
    integratedAnalysis: "Análise Filosófica Integrada",
    classification: "Classificação Filosófica",
  },
  es: {
    technicalSpecs: "Especificaciones Técnicas",
    historicalContext: "Contexto Histórico",
    creativeProcess: "Proceso Creativo",
    integratedAnalysis: "Análisis Filosófico Integrado",
    classification: "Clasificación Filosófica",
  },
  fr: {
    technicalSpecs: "Spécifications Techniques",
    historicalContext: "Contexte Historique",
    creativeProcess: "Processus Créatif",
    integratedAnalysis: "Analyse Philosophique Intégrée",
    classification: "Classification Philosophique",
  },
  de: {
    technicalSpecs: "Technische Daten",
    historicalContext: "Historischer Kontext",
    creativeProcess: "Kreativer Prozess",
    integratedAnalysis: "Integrierte Philosophische Analyse",
    classification: "Philosophische Klassifizierung",
  },
  it: {
    technicalSpecs: "Specifiche Tecniche",
    historicalContext: "Contesto Storico",
    creativeProcess: "Processo Creativo",
    integratedAnalysis: "Analisi Filosofica Integrata",
    classification: "Classificazione Filosofica",
  },
  ru: {
    technicalSpecs: "Технические Характеристики",
    historicalContext: "Исторический Контекст",
    creativeProcess: "Творческий Процесс",
    integratedAnalysis: "Интегрированный Философский Анализ",
    classification: "Философская Классификация",
  },
  ja: {
    technicalSpecs: "技術仕様",
    historicalContext: "歴史的背景",
    creativeProcess: "創作プロセス",
    integratedAnalysis: "統合哲学分析",
    classification: "哲学的分類",
  },
  ko: {
    technicalSpecs: "기술 사양",
    historicalContext: "역사적 맥락",
    creativeProcess: "창작 과정",
    integratedAnalysis: "통합 철학 분석",
    classification: "철학적 분류",
  },
  zh: {
    technicalSpecs: "技术规格",
    historicalContext: "历史背景",
    creativeProcess: "创作过程",
    integratedAnalysis: "综合哲学分析",
    classification: "哲学分类",
  },
  ar: {
    technicalSpecs: "المواصفات الفنية",
    historicalContext: "السياق التاريخي",
    creativeProcess: "العملية الإبداعية",
    integratedAnalysis: "التحليل الفلسفي المتكامل",
    classification: "التصنيف الفلسفي",
  },
  he: {
    technicalSpecs: "מפרט טכני",
    historicalContext: "הקשר היסטורי",
    creativeProcess: "תהליך יצירתי",
    integratedAnalysis: "ניתוח פילוסופי משולב",
    classification: "סיווג פילוסופי",
  },
  hi: {
    technicalSpecs: "तकनीकी विनिर्देश",
    historicalContext: "ऐतिहासिक संदर्भ",
    creativeProcess: "रचनात्मक प्रक्रिया",
    integratedAnalysis: "एकीकृत दार्शनिक विश्लेषण",
    classification: "दार्शनिक वर्गीकरण",
  },
  hu: {
    technicalSpecs: "Műszaki Adatok",
    historicalContext: "Történelmi Kontextus",
    creativeProcess: "Kreatív Folyamat",
    integratedAnalysis: "Integrált Filozófiai Elemzés",
    classification: "Filozófiai Osztályozás",
  },
  fa: {
    technicalSpecs: "مشخصات فنی",
    historicalContext: "زمینه تاریخی",
    creativeProcess: "فرآیند خلاقانه",
    integratedAnalysis: "تحلیل فلسفی یکپارچه",
    classification: "طبقه بندی فلسفی",
  },
};

// Get labels for language (fallback to English)
function getLabels(lang) {
  return LABELS[lang] || LABELS.en;
}

// Strip HTML tags for TTS
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

// Build full text from analysis result
// Order:
// 1. Technical Specs
// 2. Historical Context
// 3. Creative Process
// 4. Integrated Philosophical Analysis
// 5. Classification
export function buildTTSText(analysis, song, artist, lang = "en") {
  const L = getLabels(lang);
  const parts = [];

  // Song title and artist
  if (song && artist) {
    parts.push(`${song} - ${artist}`);
    parts.push("");
  }

  // 1. Technical Specs
  // Construct a readable sentence or list
  const specs = [];
  if (analysis.release_year) specs.push(analysis.release_year);
  if (analysis.genre) specs.push(analysis.genre);
  if (analysis.country) specs.push(analysis.country);

  if (specs.length > 0 || analysis.key || analysis.tempo) {
    parts.push(L.technicalSpecs);
    let specsText = specs.join(", ");
    if (analysis.key) specsText += `. Key: ${analysis.key}`;
    if (analysis.tempo) specsText += `. Tempo: ${analysis.tempo} BPM`;
    parts.push(specsText + ".");
    parts.push("");
  }

  // 2. Historical Context
  const context = analysis.historical_context || "";
  if (context) {
    parts.push(L.historicalContext);
    parts.push(stripHtml(context));
    parts.push("");
  }

  // 3. Creative Process
  const process = analysis.creative_process || "";
  if (process) {
    parts.push(L.creativeProcess);
    parts.push(stripHtml(process));
    parts.push("");
  }

  // 4. Integrated Philosophical Analysis
  const philosophicalAnalysis = analysis.philosophical_analysis || "";
  if (philosophicalAnalysis) {
    parts.push(L.integratedAnalysis);
    parts.push(stripHtml(philosophicalAnalysis));
    parts.push("");
  }

  // 5. Classification
  const classification =
    analysis.classification_localized || analysis.classification || "";
  if (classification) {
    parts.push(L.classification);
    parts.push(classification + ".");

    // Optional: Add score if available
    if (analysis.final_score || analysis.overall_grade) {
      const score = analysis.final_score || analysis.overall_grade;
      // Simple heuristic for "Score" translation or just use English/number
      parts.push(`Score: ${score} / 10.`);
    }
    parts.push("");
  }

  return parts.join("\n").trim();
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
    const lastPeriod = searchArea.lastIndexOf(". ");
    const lastExclaim = searchArea.lastIndexOf("! ");
    const lastQuestion = searchArea.lastIndexOf("? ");

    // Find the latest sentence boundary
    const bestSplit = Math.max(lastPeriod, lastExclaim, lastQuestion);

    if (bestSplit > maxLength * 0.5) {
      // Good split point found (at least halfway through)
      splitPoint = bestSplit + 2; // Include the punctuation and space
    } else {
      // No good sentence boundary, try to split at a space
      const lastSpace = searchArea.lastIndexOf(" ");
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
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: voice,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TTS] OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI TTS API error: ${response.status}`);
  }

  return await response.arrayBuffer();
}

// Concatenate multiple MP3 buffers
// Note: Simple concatenation works for MP3 files
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

// Generate TTS audio using OpenAI API
// Handles long text by splitting into chunks and concatenating
export async function generateTTSAudio(text, lang, env) {
  const apiKey = await getSecret(env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Clean text for TTS
  const cleanedText = text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  if (!cleanedText || cleanedText.length < 10) {
    throw new Error("Text too short for TTS");
  }

  const voice = VOICE_BY_LANG[lang] || "alloy";

  // Split text into chunks (OpenAI TTS has a 4096 character limit per request)
  const chunks = splitTextIntoChunks(cleanedText, 4000);

  console.log(
    `[TTS] Generating audio: ${cleanedText.length} chars in ${chunks.length} chunk(s), voice: ${voice}, lang: ${lang}`,
  );

  if (chunks.length === 1) {
    // Single chunk - simple case
    const audioBuffer = await generateChunkAudio(chunks[0], voice, apiKey);
    console.log(`[TTS] ✓ Generated ${audioBuffer.byteLength} bytes of audio`);
    return audioBuffer;
  }

  // Multiple chunks - generate each and concatenate
  // PARALLEL EXECUTION: Generate all chunks simultaneously to reduce total wait time
  const audioBuffers = await Promise.all(
    chunks.map(async (chunk, i) => {
      console.log(
        `[TTS] Generating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`,
      );
      return await generateChunkAudio(chunk, voice, apiKey);
    }),
  );

  // Concatenate all audio buffers
  const combinedBuffer = concatenateAudioBuffers(audioBuffers);
  console.log(
    `[TTS] ✓ Generated ${combinedBuffer.byteLength} bytes of audio (${chunks.length} chunks combined)`,
  );

  return combinedBuffer;
}

// Upload audio to Supabase Storage and return public URL
export async function uploadTTSToStorage(audioBuffer, analysisId, lang, env) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured");
  }

  // File path: tts-audio/{analysisId}_{lang}.mp3
  const fileName = `${analysisId}_${lang}.mp3`;
  const bucketName = "tts-audio";

  console.log(`[TTS] Uploading to Supabase Storage: ${bucketName}/${fileName}`);

  // Upload to Supabase Storage
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${fileName}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "audio/mpeg",
      "x-upsert": "true", // Overwrite if exists
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TTS] Storage upload error:", response.status, errorText);
    throw new Error(`Storage upload failed: ${response.status}`);
  }

  // Construct public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
  console.log(`[TTS] ✓ Uploaded to: ${publicUrl}`);

  return publicUrl;
}

// Update analysis record with audio URL
export async function updateAnalysisAudioUrl(analysisId, audioUrl, env) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/analyses?id=eq.${analysisId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ audio_url: audioUrl }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "[TTS] Failed to update audio_url:",
      response.status,
      errorText,
    );
    throw new Error(`Failed to update audio_url: ${response.status}`);
  }

  console.log(`[TTS] ✓ Updated analysis ${analysisId} with audio_url`);
}

// Main function: Generate TTS and store for an analysis
// Call this after saving analysis to Supabase
export async function generateAndStoreTTS(
  analysis,
  song,
  artist,
  lang,
  analysisId,
  env,
) {
  try {
    console.log(`[TTS] Starting TTS generation for analysis ${analysisId}`);

    // 1. Build text from analysis
    const text = buildTTSText(analysis, song, artist, lang);

    if (!text || text.length < 50) {
      console.warn("[TTS] Text too short, skipping TTS generation");
      return null;
    }

    // 2. Generate audio
    const audioBuffer = await generateTTSAudio(text, lang, env);

    // 3. Upload to storage
    const audioUrl = await uploadTTSToStorage(
      audioBuffer,
      analysisId,
      lang,
      env,
    );

    // 4. Update analysis record
    await updateAnalysisAudioUrl(analysisId, audioUrl, env);

    console.log(`[TTS] ✓ TTS complete for analysis ${analysisId}: ${audioUrl}`);
    return audioUrl;
  } catch (error) {
    // TTS failure should not break the analysis flow
    console.error(
      `[TTS] Error generating TTS for analysis ${analysisId}:`,
      error,
    );
    if (error.response) {
      console.error(`[TTS] API Response Status:`, error.response.status);
    }
    return null;
  }
}
