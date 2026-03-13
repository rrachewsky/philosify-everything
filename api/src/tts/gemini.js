// ============================================================
// GEMINI TTS - TEXT-TO-SPEECH USING GEMINI 2.5 FLASH TTS
// ============================================================
// v3.0 - 4-Voice Parallel TTS for ~65% faster generation
//
// Architecture:
// - Host (Female) appears in ALL 4 chunks (intro, questions, transitions)
// - Each chunk has a different Expert voice answering:
//   Chunk 1: Historical Context → Historian (Male)
//   Chunk 2: Creative Process → Music Critic (Male)
//   Chunk 3: Analysis Part 1 → Philosopher (Male)
//   Chunk 4: Analysis Part 2 + Verdict → Philosopher (Male)
//
// Performance: ~25-35 seconds (down from 100-120 seconds)
// Interjections: 2-3 per chunk, 1 question per 2 interjections
//
// ============================================================
// ⚠️  PHILOSIFY PRONUNCIATION LOCK - DO NOT MODIFY  ⚠️
// ============================================================
//
// MANDATORY PRONUNCIATION: /fəˈlɒsɪfaɪ/ (phi-LOS-i-fy)
//
// The word "Philosify" must ALWAYS be pronounced with:
// - Stress on 2nd syllable (phi-LOS-i-fy)
// - Ending "-sify" like Spotify/Classify/Diversify
// - NEVER as "Philosofy" or "Philosophy"
//
// This is enforced via:
// 1. Phonetic spelling "Filosifai" in PODCAST_PHRASES (18 languages)
// 2. Phonetic spelling "Filosifai" in script headers
//
// DO NOT REMOVE OR MODIFY pronunciation logic without approval.
// See: docs/PRONUNCIATION.md for full 24-language reference.
// ============================================================

import { getSecret } from "../utils/secrets.js";
import { safeEq } from "../payments/crypto.js";
import { getCorsHeaders } from "../utils/cors.js";

// ============================================================
// R2 CACHE UTILITIES FOR TTS AUDIO
// ============================================================

/**
 * Generate a cache key for R2 storage
 * Includes model to differentiate audio for different analysis versions
 */
async function getCacheKey(result, lang) {
  const song = result?.song || result?.song_name || result?.title || "";
  const artist = result?.artist || result?.author || "";
  const spotifyId = result?.spotify_id || "";
  const model = result?.model || "unknown";

  // If we have spotify_id, use it directly (most reliable)
  if (spotifyId) {
    return `tts_${spotifyId}_${lang}_${model}.wav`;
  }

  // Otherwise, create hash from song+artist
  const identifier = `${song}|${artist}`.toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(identifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `tts_${hashHex.substring(0, 32)}_${lang}_${model}.wav`;
}

/**
 * Get R2 public URL for a cache key
 */
export function getR2PublicUrl(env, cacheKey) {
  const baseUrl =
    env.R2_PUBLIC_URL || "https://pub-2485a0b8727445bbb7148e85a0db3edf.r2.dev";
  return `${baseUrl}/${cacheKey}`;
}

/**
 * Try to get audio from R2 cache
 */
export async function getFromR2Cache(env, cacheKey) {
  if (!env.TTS_CACHE) {
    console.log("[TTS] R2 bucket not configured");
    return null;
  }

  try {
    const object = await env.TTS_CACHE.get(cacheKey);
    if (object) {
      console.log(`[TTS] ✓ R2 HIT: ${cacheKey}`);
      return await object.arrayBuffer();
    }
    console.log(`[TTS] R2 MISS: ${cacheKey}`);
    return null;
  } catch (error) {
    console.error("[TTS] R2 read error:", error.message);
    return null;
  }
}

/**
 * Save audio to R2 cache with metadata
 * @param {Object} metadata - { song, artist, language, model }
 */
export async function saveToR2Cache(env, cacheKey, audioBuffer, metadata = {}) {
  if (!env.TTS_CACHE) {
    console.log("[TTS] R2 bucket not configured, skipping save");
    return false;
  }

  try {
    await env.TTS_CACHE.put(cacheKey, audioBuffer, {
      httpMetadata: {
        contentType: "audio/wav",
        cacheControl: "public, max-age=31536000", // 1 year
      },
      customMetadata: {
        song: metadata.song || "unknown",
        artist: metadata.artist || "unknown",
        language: metadata.language || "en",
        model: metadata.model || "unknown",
        createdAt: new Date().toISOString(),
      },
    });
    console.log(
      `[TTS] ✓ R2 SAVED: ${cacheKey} (${audioBuffer.byteLength} bytes) - ${metadata.song} by ${metadata.artist} [${metadata.language}]`,
    );
    return true;
  } catch (error) {
    console.error("[TTS] R2 save error:", error.message);
    return false;
  }
}

/**
 * Update analysis record with audio URL
 */
async function updateAnalysisAudioUrl(env, analysisId, audioUrl) {
  if (!analysisId) {
    console.log("[TTS] No analysisId provided, skipping audio_url update");
    return false;
  }

  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    if (!supabaseKey) {
      console.log("[TTS] No Supabase key, skipping audio_url update");
      return false;
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

    if (response.ok) {
      console.log(`[TTS] ✓ Updated analysis ${analysisId} with audio_url`);
      return true;
    } else {
      console.error(`[TTS] Failed to update audio_url: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("[TTS] Error updating audio_url:", error.message);
    return false;
  }
}

// ============================================================
// LANGUAGE CONFIGURATION
// ============================================================

const LANGUAGE_NAMES = {
  en: "English",
  pt: "Brazilian Portuguese",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  hi: "Hindi",
  ar: "Arabic",
  he: "Hebrew",
  nl: "Dutch",
  pl: "Polish",
  tr: "Turkish",
  hu: "Hungarian",
  zh: "Chinese",
  fa: "Persian",
};

// ============================================================
// 4-VOICE CONFIGURATION
// ============================================================

const VOICE_CONFIG = {
  host: { role: "Host", gender: "Female", geminiVoice: "Kore" },
  historian: { role: "Historian", gender: "Male", geminiVoice: "Charon" },
  critic: { role: "Music Critic", gender: "Male", geminiVoice: "Fenrir" },
  philosopher: { role: "Philosopher", gender: "Male", geminiVoice: "Puck" },
};

// Character names by language (18 languages × 4 roles)
const NAMES_BY_LANGUAGE = {
  en: {
    host: "Emma",
    historian: "James",
    critic: "David",
    philosopher: "Michael",
  },
  pt: {
    host: "Cláudia",
    historian: "João",
    critic: "Lucas",
    philosopher: "Pedro",
  },
  es: {
    host: "María",
    historian: "Carlos",
    critic: "Rafael",
    philosopher: "Miguel",
  },
  fr: {
    host: "Marie",
    historian: "Pierre",
    critic: "Antoine",
    philosopher: "Jean",
  },
  de: {
    host: "Anna",
    historian: "Thomas",
    critic: "Felix",
    philosopher: "Michael",
  },
  it: {
    host: "Giulia",
    historian: "Marco",
    critic: "Andrea",
    philosopher: "Luca",
  },
  ru: {
    host: "Мария",
    historian: "Александр",
    critic: "Иван",
    philosopher: "Дмитрий",
  },
  ja: { host: "美咲", historian: "健太", critic: "大輝", philosopher: "翔太" },
  ko: { host: "서연", historian: "민준", critic: "현우", philosopher: "준호" },
  zh: { host: "芳", historian: "伟", critic: "浩", philosopher: "明" },
  ar: { host: "فاطمة", historian: "محمد", critic: "عمر", philosopher: "أحمد" },
  he: { host: "שרה", historian: "דוד", critic: "יונתן", philosopher: "יוסי" },
  hi: {
    host: "प्रिया",
    historian: "राहुल",
    critic: "विकास",
    philosopher: "अमित",
  },
  fa: { host: "مریم", historian: "علی", critic: "رضا", philosopher: "محمد" },
  tr: {
    host: "Zeynep",
    historian: "Mehmet",
    critic: "Emre",
    philosopher: "Ahmet",
  },
  hu: {
    host: "Anna",
    historian: "László",
    critic: "Gábor",
    philosopher: "Péter",
  },
  pl: {
    host: "Anna",
    historian: "Jan",
    critic: "Tomasz",
    philosopher: "Piotr",
  },
  nl: { host: "Emma", historian: "Jan", critic: "Daan", philosopher: "Thomas" },
};

/**
 * Get character names for a language, falling back to English
 */
function getNames(lang) {
  return NAMES_BY_LANGUAGE[lang] || NAMES_BY_LANGUAGE.en;
}

// ============================================================
// PODCAST PHRASES - Fixed transitions and reactions per language
// ============================================================

const PODCAST_PHRASES = {
  en: {
    welcome: "Welcome! This is Filosifai. Today we're diving into",
    byArtist: "by",
    fascinating: "This is a fascinating one.",
    interesting:
      "Yes, this song has some really interesting philosophical dimensions worth exploring.",
    hostGreeting: "Well, {name},",
    historianHandoff: "{name}, tell us about the history behind this song.",
    background:
      "Let's start with some background. What's the story behind this song?",
    criticHandoff:
      "Thanks! {name}, what can you tell us about the creative process?",
    creativeIntro:
      "That's fascinating context. And what about the creative process?",
    philosopherHandoff:
      "Excellent insights! {name}, let's dive into the philosophical analysis.",
    analysisIntro:
      "Now let's get to the heart of it - the philosophical analysis.",
    verdictHandoff: "{name}, what's your final verdict on this song?",
    verdictIntro: "So, what's the final verdict?",
    scoreIs: "The philosophical score is",
    outOf10: "out of 10.",
    classification: "This places it in the",
    category: "category.",
    thanks: "Another great analysis. Thanks for listening to Filosifai!",
    reactions: [
      "That's really fascinating.",
      "Interesting point.",
      "I hadn't thought about it that way.",
      "That really resonates.",
      "Quite profound.",
      "That's a compelling perspective.",
      "Absolutely.",
      "That makes a lot of sense.",
    ],
  },
  pt: {
    welcome: "Bem-vindos! Aqui é o Filosifai. Hoje vamos mergulhar em",
    byArtist: "de",
    fascinating: "Esta é uma música fascinante.",
    interesting:
      "Sim, esta música tem dimensões filosóficas realmente interessantes para explorar.",
    hostGreeting: "Bem, {name},",
    historianHandoff:
      "{name}, conte-nos sobre a história por trás dessa música.",
    background:
      "Vamos começar com um pouco de contexto. Qual é a história por trás desta música?",
    criticHandoff:
      "Obrigada! {name}, o que você pode nos contar sobre o processo criativo?",
    creativeIntro: "Que contexto fascinante. E sobre o processo criativo?",
    philosopherHandoff:
      "Excelentes insights! {name}, vamos mergulhar na análise filosófica.",
    analysisIntro: "Agora vamos ao que interessa - a análise filosófica.",
    verdictHandoff: "{name}, qual é o seu veredito final sobre essa música?",
    verdictIntro: "Então, qual é o veredito final?",
    scoreIs: "A nota filosófica é",
    outOf10: "de 10.",
    classification: "Isso a coloca na categoria",
    category: ".",
    thanks: "Mais uma grande análise. Obrigado por ouvir o Filosifai!",
    reactions: [
      "Isso é realmente fascinante.",
      "Ponto interessante.",
      "Eu não tinha pensado dessa forma.",
      "Isso faz muito sentido.",
      "Bastante profundo.",
      "Uma perspectiva convincente.",
      "Com certeza.",
      "Faz muito sentido.",
    ],
  },
  es: {
    welcome: "¡Bienvenidos! Esto es Filosifai. Hoy nos sumergimos en",
    byArtist: "de",
    fascinating: "Esta es una canción fascinante.",
    interesting:
      "Sí, esta canción tiene dimensiones filosóficas realmente interesantes para explorar.",
    hostGreeting: "Bueno, {name},",
    historianHandoff:
      "{name}, cuéntanos sobre la historia detrás de esta canción.",
    background:
      "Empecemos con algo de contexto. ¿Cuál es la historia detrás de esta canción?",
    criticHandoff:
      "¡Gracias! {name}, ¿qué puedes contarnos sobre el proceso creativo?",
    creativeIntro: "Qué contexto fascinante. ¿Y sobre el proceso creativo?",
    philosopherHandoff:
      "¡Excelentes ideas! {name}, profundicemos en el análisis filosófico.",
    analysisIntro:
      "Ahora vamos al corazón del asunto - el análisis filosófico.",
    verdictHandoff: "{name}, ¿cuál es tu veredicto final sobre esta canción?",
    verdictIntro: "Entonces, ¿cuál es el veredicto final?",
    scoreIs: "La puntuación filosófica es",
    outOf10: "de 10.",
    classification: "Esto la coloca en la categoría",
    category: ".",
    thanks: "¡Otro gran análisis. Gracias por escuchar Filosifai!",
    reactions: [
      "Eso es realmente fascinante.",
      "Punto interesante.",
      "No lo había pensado de esa manera.",
      "Eso resuena mucho.",
      "Bastante profundo.",
      "Una perspectiva convincente.",
      "Absolutamente.",
      "Tiene mucho sentido.",
    ],
  },
  fr: {
    welcome: "Bienvenue ! C'est Filosifaï. Aujourd'hui nous plongeons dans",
    byArtist: "de",
    fascinating: "C'est une chanson fascinante.",
    interesting:
      "Oui, cette chanson a des dimensions philosophiques vraiment intéressantes à explorer.",
    hostGreeting: "Eh bien, {name},",
    historianHandoff:
      "{name}, parlez-nous de l'histoire derrière cette chanson.",
    background:
      "Commençons par le contexte. Quelle est l'histoire derrière cette chanson ?",
    criticHandoff:
      "Merci ! {name}, que pouvez-vous nous dire sur le processus créatif ?",
    creativeIntro: "Quel contexte fascinant. Et le processus créatif ?",
    philosopherHandoff:
      "Excellentes idées ! {name}, plongeons dans l'analyse philosophique.",
    analysisIntro:
      "Maintenant, allons au cœur du sujet - l'analyse philosophique.",
    verdictHandoff: "{name}, quel est votre verdict final sur cette chanson ?",
    verdictIntro: "Alors, quel est le verdict final ?",
    scoreIs: "Le score philosophique est",
    outOf10: "sur 10.",
    classification: "Cela la place dans la catégorie",
    category: ".",
    thanks: "Une autre grande analyse. Merci d'écouter Filosifaï !",
    reactions: [
      "C'est vraiment fascinant.",
      "Point intéressant.",
      "Je n'y avais pas pensé de cette façon.",
      "Cela résonne vraiment.",
      "Assez profond.",
      "Une perspective convaincante.",
      "Absolument.",
      "Cela a beaucoup de sens.",
    ],
  },
  de: {
    welcome: "Willkommen! Hier ist Filosifai. Heute tauchen wir ein in",
    byArtist: "von",
    fascinating: "Das ist ein faszinierendes Stück.",
    interesting:
      "Ja, dieses Lied hat wirklich interessante philosophische Dimensionen zu erkunden.",
    hostGreeting: "Nun, {name},",
    historianHandoff:
      "{name}, erzählen Sie uns von der Geschichte hinter diesem Lied.",
    background:
      "Beginnen wir mit dem Hintergrund. Was ist die Geschichte hinter diesem Lied?",
    criticHandoff:
      "Danke! {name}, was können Sie uns über den kreativen Prozess erzählen?",
    creativeIntro:
      "Was für ein faszinierender Kontext. Und der kreative Prozess?",
    philosopherHandoff:
      "Ausgezeichnete Einblicke! {name}, tauchen wir in die philosophische Analyse ein.",
    analysisIntro: "Jetzt kommen wir zum Kern - die philosophische Analyse.",
    verdictHandoff:
      "{name}, wie lautet Ihr endgültiges Urteil über dieses Lied?",
    verdictIntro: "Also, wie lautet das endgültige Urteil?",
    scoreIs: "Die philosophische Punktzahl ist",
    outOf10: "von 10.",
    classification: "Das ordnet es in die Kategorie",
    category: "ein.",
    thanks:
      "Eine weitere großartige Analyse. Danke fürs Zuhören bei Filosifai!",
    reactions: [
      "Das ist wirklich faszinierend.",
      "Interessanter Punkt.",
      "So hatte ich das noch nicht betrachtet.",
      "Das macht sehr viel Sinn.",
      "Ziemlich tiefgründig.",
      "Eine überzeugende Perspektive.",
      "Absolut.",
      "Das ergibt viel Sinn.",
    ],
  },
  it: {
    welcome: "Benvenuti! Questo è Filosifai. Oggi ci immergiamo in",
    byArtist: "di",
    fascinating: "Questa è una canzone affascinante.",
    interesting:
      "Sì, questa canzone ha dimensioni filosofiche davvero interessanti da esplorare.",
    hostGreeting: "Bene, {name},",
    historianHandoff: "{name}, raccontaci la storia dietro questa canzone.",
    background:
      "Iniziamo con un po' di contesto. Qual è la storia dietro questa canzone?",
    criticHandoff: "Grazie! {name}, cosa puoi dirci sul processo creativo?",
    creativeIntro: "Che contesto affascinante. E il processo creativo?",
    philosopherHandoff:
      "Ottimi spunti! {name}, immergiamoci nell'analisi filosofica.",
    analysisIntro:
      "Ora arriviamo al cuore della questione - l'analisi filosofica.",
    verdictHandoff: "{name}, qual è il tuo verdetto finale su questa canzone?",
    verdictIntro: "Allora, qual è il verdetto finale?",
    scoreIs: "Il punteggio filosofico è",
    outOf10: "su 10.",
    classification: "Questo la colloca nella categoria",
    category: ".",
    thanks: "Un'altra grande analisi. Grazie per aver ascoltato Filosifai!",
    reactions: [
      "È davvero affascinante.",
      "Punto interessante.",
      "Non ci avevo pensato in quel modo.",
      "Questo risuona davvero.",
      "Piuttosto profondo.",
      "Una prospettiva convincente.",
      "Assolutamente.",
      "Ha molto senso.",
    ],
  },
  ja: {
    welcome: "ようこそ！こちらはフィロシファイです。今日は",
    byArtist: "の",
    fascinating: "を分析します。これは魅力的な曲です。",
    interesting:
      "はい、この曲には探求すべき本当に興味深い哲学的な側面があります。",
    hostGreeting: "さて、{name}さん、",
    historianHandoff: "{name}さん、この曲の背景について教えてください。",
    background: "まず背景から始めましょう。この曲の物語は何ですか？",
    criticHandoff:
      "ありがとうございます！{name}さん、創作過程について教えていただけますか？",
    creativeIntro: "魅力的な背景ですね。創作過程についてはどうですか？",
    philosopherHandoff:
      "素晴らしい洞察です！{name}さん、哲学的分析に入りましょう。",
    analysisIntro: "では本題に入りましょう - 哲学的分析です。",
    verdictHandoff: "{name}さん、この曲に対する最終評価は何ですか？",
    verdictIntro: "では、最終的な評価は？",
    scoreIs: "哲学的スコアは",
    outOf10: "点（10点満点）です。",
    classification: "これは",
    category: "カテゴリーに分類されます。",
    thanks:
      "また素晴らしい分析でした。フィロシファイをお聴きいただきありがとうございます！",
    reactions: [
      "それは本当に魅力的ですね。",
      "興味深いポイントです。",
      "そういう視点は考えていませんでした。",
      "とても共感できます。",
      "かなり深いですね。",
      "説得力のある視点ですね。",
      "その通りです。",
      "とても納得できます。",
    ],
  },
  ko: {
    welcome: "환영합니다! 여기는 필로시파이입니다. 오늘은",
    byArtist: "의",
    fascinating: "를 분석합니다. 이것은 매력적인 곡입니다.",
    interesting:
      "네, 이 노래에는 탐구할 가치가 있는 정말 흥미로운 철학적 차원이 있습니다.",
    hostGreeting: "자, {name}님,",
    historianHandoff: "{name}님, 이 노래의 역사적 배경에 대해 말씀해 주세요.",
    background: "배경부터 시작해 볼까요? 이 노래의 이야기는 무엇인가요?",
    criticHandoff: "감사합니다! {name}님, 창작 과정에 대해 알려주시겠어요?",
    creativeIntro: "매력적인 맥락이네요. 창작 과정은 어떤가요?",
    philosopherHandoff:
      "훌륭한 통찰입니다! {name}님, 철학적 분석을 시작해 볼까요.",
    analysisIntro: "이제 본론으로 들어가겠습니다 - 철학적 분석입니다.",
    verdictHandoff: "{name}님, 이 노래에 대한 최종 평가는 무엇인가요?",
    verdictIntro: "그럼 최종 평가는 어떤가요?",
    scoreIs: "철학적 점수는",
    outOf10: "점(10점 만점)입니다.",
    classification: "이것은",
    category: "카테고리에 해당합니다.",
    thanks: "또 훌륭한 분석이었습니다. 필로시파이를 들어주셔서 감사합니다!",
    reactions: [
      "정말 매력적이네요.",
      "흥미로운 포인트입니다.",
      "그런 식으로 생각해본 적이 없었어요.",
      "정말 공감이 됩니다.",
      "꽤 심오하네요.",
      "설득력 있는 관점이네요.",
      "맞습니다.",
      "많은 의미가 있네요.",
    ],
  },
  zh: {
    welcome: "欢迎！这里是Filosifai。今天我们将深入分析",
    byArtist: "的",
    fascinating: "。这是一首迷人的歌曲。",
    interesting: "是的，这首歌有一些非常有趣的哲学维度值得探索。",
    hostGreeting: "好的，{name}，",
    historianHandoff: "{name}，请给我们讲讲这首歌的历史背景。",
    background: "让我们从背景开始。这首歌背后的故事是什么？",
    criticHandoff: "谢谢！{name}，你能告诉我们创作过程吗？",
    creativeIntro: "多么迷人的背景。创作过程呢？",
    philosopherHandoff: "精彩的见解！{name}，让我们深入哲学分析。",
    analysisIntro: "现在让我们进入核心 - 哲学分析。",
    verdictHandoff: "{name}，你对这首歌的最终评价是什么？",
    verdictIntro: "那么，最终评价是什么？",
    scoreIs: "哲学评分是",
    outOf10: "分（满分10分）。",
    classification: "这将其归类为",
    category: "类别。",
    thanks: "又一次精彩的分析。感谢收听Filosifai！",
    reactions: [
      "这真的很有趣。",
      "有意思的观点。",
      "我之前没有这样想过。",
      "这很有共鸣。",
      "相当深刻。",
      "一个令人信服的观点。",
      "确实如此。",
      "很有道理。",
    ],
  },
  ru: {
    welcome: "Добро пожаловать! Это Философай. Сегодня мы погружаемся в",
    byArtist: "",
    fascinating: ". Это увлекательная песня.",
    interesting:
      "Да, у этой песни есть действительно интересные философские измерения для исследования.",
    hostGreeting: "Итак, {name},",
    historianHandoff: "{name}, расскажите нам об истории этой песни.",
    background: "Начнём с контекста. Какова история этой песни?",
    criticHandoff:
      "Спасибо! {name}, что вы можете рассказать о творческом процессе?",
    creativeIntro:
      "Какой увлекательный контекст. А как насчёт творческого процесса?",
    philosopherHandoff:
      "Отличные мысли! {name}, давайте погрузимся в философский анализ.",
    analysisIntro: "Теперь перейдём к сути - философскому анализу.",
    verdictHandoff: "{name}, каков ваш окончательный вердикт об этой песне?",
    verdictIntro: "Итак, каков окончательный вердикт?",
    scoreIs: "Философская оценка составляет",
    outOf10: "из 10.",
    classification: "Это относит её к категории",
    category: ".",
    thanks: "Ещё один отличный анализ. Спасибо за прослушивание Философай!",
    reactions: [
      "Это действительно увлекательно.",
      "Интересная мысль.",
      "Я не думал об этом так.",
      "Это очень созвучно.",
      "Довольно глубоко.",
      "Убедительная перспектива.",
      "Безусловно.",
      "Это имеет большой смысл.",
    ],
  },
  ar: {
    welcome: "مرحباً بكم! هذا هو في-لو-سي-فاي. اليوم نغوص في",
    byArtist: "لـ",
    fascinating: ". هذه أغنية رائعة.",
    interesting:
      "نعم، هذه الأغنية لها أبعاد فلسفية مثيرة للاهتمام تستحق الاستكشاف.",
    hostGreeting: "حسناً، {name}،",
    historianHandoff: "{name}، أخبرنا عن تاريخ هذه الأغنية.",
    background: "لنبدأ ببعض السياق. ما هي القصة وراء هذه الأغنية؟",
    criticHandoff: "شكراً! {name}، ماذا يمكنك أن تخبرنا عن العملية الإبداعية؟",
    creativeIntro: "يا له من سياق رائع. وماذا عن العملية الإبداعية؟",
    philosopherHandoff: "رؤى ممتازة! {name}، دعنا نتعمق في التحليل الفلسفي.",
    analysisIntro: "الآن دعونا ندخل في صلب الموضوع - التحليل الفلسفي.",
    verdictHandoff: "{name}، ما هو حكمك النهائي على هذه الأغنية؟",
    verdictIntro: "إذاً، ما هو الحكم النهائي؟",
    scoreIs: "الدرجة الفلسفية هي",
    outOf10: "من 10.",
    classification: "هذا يضعها في فئة",
    category: ".",
    thanks: "تحليل رائع آخر. شكراً للاستماع إلى في-لو-سي-فاي!",
    reactions: [
      "هذا رائع حقاً.",
      "نقطة مثيرة للاهتمام.",
      "لم أفكر في الأمر بهذه الطريقة.",
      "هذا يتردد صداه بعمق.",
      "عميق جداً.",
      "منظور مقنع.",
      "بالتأكيد.",
      "هذا منطقي جداً.",
    ],
  },
  he: {
    welcome: "ברוכים הבאים! כאן פילוסיפאי. היום אנחנו צוללים לתוך",
    byArtist: "של",
    fascinating: ". זה שיר מרתק.",
    interesting: "כן, לשיר הזה יש ממדים פילוסופיים מעניינים באמת לחקור.",
    hostGreeting: "ובכן, {name},",
    historianHandoff: "{name}, ספר לנו על ההיסטוריה של השיר הזה.",
    background: "בואו נתחיל עם קצת רקע. מה הסיפור מאחורי השיר הזה?",
    criticHandoff: "תודה! {name}, מה אתה יכול לספר לנו על התהליך היצירתי?",
    creativeIntro: "איזה הקשר מרתק. ומה לגבי התהליך היצירתי?",
    philosopherHandoff: "תובנות מצוינות! {name}, בוא נצלול לניתוח הפילוסופי.",
    analysisIntro: "עכשיו בואו נגיע ללב העניין - הניתוח הפילוסופי.",
    verdictHandoff: "{name}, מה פסק הדין הסופי שלך על השיר הזה?",
    verdictIntro: "אז מה פסק הדין הסופי?",
    scoreIs: "הציון הפילוסופי הוא",
    outOf10: "מתוך 10.",
    classification: "זה מציב אותו בקטגוריה",
    category: ".",
    thanks: "עוד ניתוח מעולה. תודה שהאזנתם לפילוסיפאי!",
    reactions: [
      "זה באמת מרתק.",
      "נקודה מעניינת.",
      "לא חשבתי על זה ככה.",
      "זה באמת מהדהד.",
      "די עמוק.",
      "פרספקטיבה משכנעת.",
      "בהחלט.",
      "זה מאוד הגיוני.",
    ],
  },
  hi: {
    welcome: "आपका स्वागत है! यह फ़िलोसिफ़ाय है। आज हम गहराई से देखेंगे",
    byArtist: "का",
    fascinating: "। यह एक आकर्षक गाना है।",
    interesting:
      "हाँ, इस गाने में खोजने योग्य कुछ वाकई दिलचस्प दार्शनिक आयाम हैं।",
    hostGreeting: "तो, {name},",
    historianHandoff: "{name}, हमें इस गाने के इतिहास के बारे में बताइए।",
    background:
      "आइए कुछ पृष्ठभूमि से शुरू करें। इस गाने के पीछे की कहानी क्या है?",
    criticHandoff:
      "धन्यवाद! {name}, रचनात्मक प्रक्रिया के बारे में क्या बता सकते हैं?",
    creativeIntro:
      "कितना आकर्षक संदर्भ। और रचनात्मक प्रक्रिया के बारे में क्या?",
    philosopherHandoff:
      "उत्कृष्ट अंतर्दृष्टि! {name}, चलिए दार्शनिक विश्लेषण में उतरते हैं।",
    analysisIntro: "अब मुख्य बात पर आते हैं - दार्शनिक विश्लेषण।",
    verdictHandoff: "{name}, इस गाने पर आपका अंतिम फैसला क्या है?",
    verdictIntro: "तो, अंतिम फैसला क्या है?",
    scoreIs: "दार्शनिक स्कोर है",
    outOf10: "10 में से।",
    classification: "यह इसे श्रेणी में रखता है",
    category: "।",
    thanks: "एक और शानदार विश्लेषण। फ़िलोसिफ़ाय सुनने के लिए धन्यवाद!",
    reactions: [
      "यह वाकई आकर्षक है।",
      "दिलचस्प बात है।",
      "मैंने इसके बारे में इस तरह नहीं सोचा था।",
      "यह बहुत प्रभावशाली है।",
      "काफी गहरा है।",
      "एक प्रभावशाली दृष्टिकोण।",
      "बिल्कुल।",
      "यह बहुत समझ में आता है।",
    ],
  },
  nl: {
    welcome: "Welkom! Dit is Filosifai. Vandaag duiken we in",
    byArtist: "van",
    fascinating: ". Dit is een fascinerend nummer.",
    interesting:
      "Ja, dit nummer heeft echt interessante filosofische dimensies om te verkennen.",
    hostGreeting: "Nou, {name},",
    historianHandoff:
      "{name}, vertel ons over de geschiedenis achter dit nummer.",
    background:
      "Laten we beginnen met wat achtergrond. Wat is het verhaal achter dit nummer?",
    criticHandoff:
      "Bedankt! {name}, wat kun je ons vertellen over het creatieve proces?",
    creativeIntro: "Wat een fascinerende context. En het creatieve proces?",
    philosopherHandoff:
      "Uitstekende inzichten! {name}, laten we duiken in de filosofische analyse.",
    analysisIntro: "Nu komen we bij de kern - de filosofische analyse.",
    verdictHandoff: "{name}, wat is jouw eindoordeel over dit nummer?",
    verdictIntro: "Dus, wat is het eindoordeel?",
    scoreIs: "De filosofische score is",
    outOf10: "van de 10.",
    classification: "Dit plaatst het in de categorie",
    category: ".",
    thanks:
      "Weer een geweldige analyse. Bedankt voor het luisteren naar Filosifai!",
    reactions: [
      "Dat is echt fascinerend.",
      "Interessant punt.",
      "Zo had ik er nog niet over nagedacht.",
      "Dat resoneert echt.",
      "Behoorlijk diepzinnig.",
      "Een overtuigend perspectief.",
      "Absoluut.",
      "Dat is heel logisch.",
    ],
  },
  pl: {
    welcome: "Witamy! To jest Filosifaj. Dziś zagłębiamy się w",
    byArtist: "",
    fascinating: ". To fascynujący utwór.",
    interesting:
      "Tak, ta piosenka ma naprawdę interesujące wymiary filozoficzne do zbadania.",
    hostGreeting: "Cóż, {name},",
    historianHandoff: "{name}, opowiedz nam o historii tej piosenki.",
    background: "Zacznijmy od kontekstu. Jaka jest historia tej piosenki?",
    criticHandoff:
      "Dziękuję! {name}, co możesz nam powiedzieć o procesie twórczym?",
    creativeIntro: "Cóż za fascynujący kontekst. A proces twórczy?",
    philosopherHandoff:
      "Doskonałe spostrzeżenia! {name}, zagłębmy się w analizę filozoficzną.",
    analysisIntro: "Teraz przejdźmy do sedna - analizy filozoficznej.",
    verdictHandoff: "{name}, jaki jest twój ostateczny werdykt o tej piosence?",
    verdictIntro: "Więc, jaki jest ostateczny werdykt?",
    scoreIs: "Ocena filozoficzna to",
    outOf10: "na 10.",
    classification: "To plasuje ją w kategorii",
    category: ".",
    thanks: "Kolejna świetna analiza. Dziękujemy za słuchanie Filosifaj!",
    reactions: [
      "To naprawdę fascynujące.",
      "Ciekawy punkt.",
      "Nie myślałem o tym w ten sposób.",
      "To naprawdę rezonuje.",
      "Dość głębokie.",
      "Przekonująca perspektywa.",
      "Zdecydowanie.",
      "To ma dużo sensu.",
    ],
  },
  tr: {
    welcome: "Hoş geldiniz! Burası Filosifay. Bugün",
    byArtist: "sanatçısının",
    fascinating: "şarkısına dalıyoruz. Bu büyüleyici bir parça.",
    interesting:
      "Evet, bu şarkının keşfedilmeye değer gerçekten ilginç felsefi boyutları var.",
    hostGreeting: "Peki, {name},",
    historianHandoff: "{name}, bize bu şarkının tarihçesini anlat.",
    background:
      "Biraz arka planla başlayalım. Bu şarkının arkasındaki hikaye nedir?",
    criticHandoff:
      "Teşekkürler! {name}, yaratıcı süreç hakkında neler söyleyebilirsin?",
    creativeIntro: "Ne kadar büyüleyici bir bağlam. Peki yaratıcı süreç?",
    philosopherHandoff: "Mükemmel görüşler! {name}, felsefi analize dalalım.",
    analysisIntro: "Şimdi konunun özüne gelelim - felsefi analiz.",
    verdictHandoff: "{name}, bu şarkı hakkındaki nihai kararın nedir?",
    verdictIntro: "Peki, nihai karar nedir?",
    scoreIs: "Felsefi puan",
    outOf10: "üzerinden 10.",
    classification: "Bu onu",
    category: "kategorisine yerleştiriyor.",
    thanks:
      "Bir harika analiz daha. Filosifay'ı dinlediğiniz için teşekkürler!",
    reactions: [
      "Bu gerçekten büyüleyici.",
      "İlginç bir nokta.",
      "Bunu o şekilde düşünmemiştim.",
      "Bu gerçekten yankı uyandırıyor.",
      "Oldukça derin.",
      "İkna edici bir bakış açısı.",
      "Kesinlikle.",
      "Bu çok mantıklı.",
    ],
  },
  hu: {
    welcome: "Üdvözöljük! Ez a Filosifáj. Ma belemerülünk",
    byArtist: "",
    fascinating: "dalába. Ez egy lenyűgöző szám.",
    interesting:
      "Igen, ennek a dalnak igazán érdekes filozófiai dimenziói vannak, amelyeket érdemes felfedezni.",
    hostGreeting: "Nos, {name},",
    historianHandoff: "{name}, mesélj nekünk a dal történetéről.",
    background: "Kezdjük egy kis háttérrel. Mi a történet e dal mögött?",
    criticHandoff: "Köszönöm! {name}, mit tudsz mondani a kreatív folyamatról?",
    creativeIntro: "Milyen lenyűgöző kontextus. És a kreatív folyamat?",
    philosopherHandoff:
      "Kiváló meglátások! {name}, merüljünk el a filozófiai elemzésben.",
    analysisIntro: "Most térjünk a lényegre - a filozófiai elemzésre.",
    verdictHandoff: "{name}, mi a végső ítéleted erről a dalról?",
    verdictIntro: "Szóval, mi a végső ítélet?",
    scoreIs: "A filozófiai pontszám",
    outOf10: "a 10-ből.",
    classification: "Ez a következő kategóriába helyezi",
    category: ".",
    thanks: "Újabb remek elemzés. Köszönjük, hogy a Filosifáj-t hallgattátok!",
    reactions: [
      "Ez igazán lenyűgöző.",
      "Érdekes pont.",
      "Nem gondoltam erre így.",
      "Ez nagyon rezonál.",
      "Elég mély.",
      "Meggyőző perspektíva.",
      "Abszolút.",
      "Ennek sok értelme van.",
    ],
  },
  fa: {
    welcome: "خوش آمدید! اینجا فیلوسیفای است. امروز به",
    byArtist: "از",
    fascinating: "می‌پردازیم. این یک آهنگ جذاب است.",
    interesting: "بله، این آهنگ ابعاد فلسفی واقعاً جالبی برای کاوش دارد.",
    hostGreeting: "خب، {name}،",
    historianHandoff: "{name}، درباره تاریخچه این آهنگ به ما بگو.",
    background: "بیایید با کمی زمینه شروع کنیم. داستان پشت این آهنگ چیست؟",
    criticHandoff:
      "ممنون! {name}، چه چیزی درباره فرآیند خلاقانه می‌توانی بگویی؟",
    creativeIntro: "چه زمینه جذابی. و فرآیند خلاقانه چطور؟",
    philosopherHandoff: "بینش‌های عالی! {name}، بیا به تحلیل فلسفی بپردازیم.",
    analysisIntro: "حالا بیایید به اصل مطلب برسیم - تحلیل فلسفی.",
    verdictHandoff: "{name}، نظر نهایی تو درباره این آهنگ چیست؟",
    verdictIntro: "خب، حکم نهایی چیست؟",
    scoreIs: "امتیاز فلسفی",
    outOf10: "از 10 است.",
    classification: "این آن را در دسته‌بندی",
    category: "قرار می‌دهد.",
    thanks: "یک تحلیل عالی دیگر. ممنون که به فیلوسیفای گوش دادید!",
    reactions: [
      "این واقعاً جذاب است.",
      "نکته جالبی است.",
      "به این شکل فکر نکرده بودم.",
      "این واقعاً طنین‌انداز است.",
      "کاملاً عمیق.",
      "دیدگاه قانع‌کننده‌ای.",
      "قطعاً.",
      "این خیلی منطقی است.",
    ],
  },
};

// ============================================================
// PODCAST PHRASES - BOOK OVERRIDES (only the phrases that differ from music)
// ============================================================

const PODCAST_PHRASES_BOOK = {
  en: {
    fascinating: "This is a fascinating one.",
    interesting: "Yes, this book has some really interesting philosophical dimensions worth exploring.",
    historianHandoff: "{name}, tell us about the history behind this book.",
    background: "Let's start with some background. What's the story behind this book?",
    verdictHandoff: "{name}, what's your final verdict on this book?",
  },
  pt: {
    fascinating: "Este é um livro fascinante.",
    interesting: "Sim, este livro tem dimensões filosóficas realmente interessantes para explorar.",
    historianHandoff: "{name}, conte-nos sobre a história por trás desse livro.",
    background: "Vamos começar com um pouco de contexto. Qual é a história por trás deste livro?",
    verdictHandoff: "{name}, qual é o seu veredito final sobre esse livro?",
  },
  es: {
    fascinating: "Este es un libro fascinante.",
    interesting: "Sí, este libro tiene dimensiones filosóficas realmente interesantes para explorar.",
    historianHandoff: "{name}, cuéntanos sobre la historia detrás de este libro.",
    background: "Empecemos con algo de contexto. ¿Cuál es la historia detrás de este libro?",
    verdictHandoff: "{name}, ¿cuál es tu veredicto final sobre este libro?",
  },
  fr: {
    fascinating: "C'est un livre fascinant.",
    interesting: "Oui, ce livre a des dimensions philosophiques vraiment intéressantes à explorer.",
    historianHandoff: "{name}, parlez-nous de l'histoire derrière ce livre.",
    background: "Commençons par le contexte. Quelle est l'histoire derrière ce livre ?",
    verdictHandoff: "{name}, quel est votre verdict final sur ce livre ?",
  },
  de: {
    fascinating: "Das ist ein faszinierendes Buch.",
    interesting: "Ja, dieses Buch hat wirklich interessante philosophische Dimensionen zu erkunden.",
    historianHandoff: "{name}, erzählen Sie uns von der Geschichte hinter diesem Buch.",
    background: "Beginnen wir mit dem Hintergrund. Was ist die Geschichte hinter diesem Buch?",
    verdictHandoff: "{name}, wie lautet Ihr endgültiges Urteil über dieses Buch?",
  },
  it: {
    fascinating: "Questo è un libro affascinante.",
    interesting: "Sì, questo libro ha dimensioni filosofiche davvero interessanti da esplorare.",
    historianHandoff: "{name}, raccontaci la storia dietro questo libro.",
    background: "Iniziamo con un po' di contesto. Qual è la storia dietro questo libro?",
    verdictHandoff: "{name}, qual è il tuo verdetto finale su questo libro?",
  },
};

/**
 * Get phrases for a language, falling back to English.
 * If isBook is true, overlay book-specific phrases on top of the base music phrases.
 */
function getPhrases(lang, isBook = false) {
  const base = PODCAST_PHRASES[lang] || PODCAST_PHRASES.en;
  if (!isBook) return base;
  const bookOverrides = PODCAST_PHRASES_BOOK[lang] || PODCAST_PHRASES_BOOK.en;
  return { ...base, ...bookOverrides };
}

// ============================================================
// DYNAMIC INTERJECTION SYSTEM (v3.0 - 4 chunks)
// ============================================================

/**
 * Split text roughly in half by sentences
 * @returns {{ part1: string, part2: string }}
 */
function splitTextInHalf(text) {
  if (!text || text.length < 100) {
    return { part1: text || "", part2: "" };
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 5);

  if (sentences.length < 2) {
    return { part1: text, part2: "" };
  }

  const midpoint = Math.ceil(sentences.length / 2);
  return {
    part1: sentences.slice(0, midpoint).join(" "),
    part2: sentences.slice(midpoint).join(" "),
  };
}

/**
 * Fixed interjection count per chunk: 2-3 interjections
 * 1 question per 2 interjections
 * @returns {number}
 */
function getChunkInterjectionCount(text) {
  if (!text || text.length < 50) return 0;

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  // 2-3 interjections per chunk based on content length
  if (sentences.length < 3) return 1;
  if (sentences.length < 6) return 2;
  return 3;
}

/**
 * Generate interjection pattern: 1Q per 2 interjections
 * @returns {string[]} Array of 'R' (reaction) or 'Q' (question)
 */
function generateInterjectionPattern(count) {
  if (count === 0) return [];
  if (count === 1) return ["R"];
  if (count === 2) return ["R", "Q"];
  // count >= 3: R, Q, R pattern
  return ["R", "Q", "R"];
}

/**
 * Pick random reactions from the fixed phrases, avoiding duplicates
 */
function pickReactions(count, phrases, usedIndices = new Set()) {
  const reactions = phrases.reactions || PODCAST_PHRASES.en.reactions;
  const picked = [];

  for (let i = 0; i < count; i++) {
    let idx;
    let attempts = 0;
    do {
      idx = Math.floor(Math.random() * reactions.length);
      attempts++;
    } while (usedIndices.has(idx) && attempts < reactions.length * 2);

    usedIndices.add(idx);
    picked.push(reactions[idx]);
  }

  return picked;
}

/**
 * Generate contextual questions for 4 chunks using Gemini LLM
 * 1 question per chunk (since each chunk has 2-3 interjections, 1Q per 2)
 */
async function generateContextualQuestions(chunks, lang, hostName, apiKey) {
  const langName = LANGUAGE_NAMES[lang] || "English";

  // Build context summary
  const contextParts = [];
  if (chunks.history) {
    contextParts.push(
      `HISTORICAL CONTEXT:\n${chunks.history.substring(0, 400)}`,
    );
  }
  if (chunks.creative) {
    contextParts.push(
      `CREATIVE PROCESS:\n${chunks.creative.substring(0, 400)}`,
    );
  }
  if (chunks.analysis1) {
    contextParts.push(
      `ANALYSIS PART 1:\n${chunks.analysis1.substring(0, 400)}`,
    );
  }
  if (chunks.analysis2) {
    contextParts.push(
      `ANALYSIS PART 2:\n${chunks.analysis2.substring(0, 400)}`,
    );
  }

  const contextText = contextParts.join("\n\n");

  const prompt = `You are ${hostName}, the warm female host of the Filosifai podcast. Generate 4 contextual follow-up questions (1 per section).

ANALYSIS CONTENT:
"""
${contextText}
"""

Generate exactly 4 questions in ${langName}:
- 1 for historical context (to the Historian)
- 1 for creative process (to the Music Critic)
- 1 for analysis part 1 (to the Philosopher)
- 1 for analysis part 2 (to the Philosopher)

RULES:
- Questions should lead naturally into the next point of discussion
- Be specific to the content, not generic
- Keep questions concise (1 sentence max)
- All questions must be in ${langName}

OUTPUT JSON only (no markdown):
{"history": "question", "creative": "question", "analysis1": "question", "analysis2": "question"}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      },
    );

    if (!response.ok) {
      console.error("[TTS] Question generation failed:", response.status);
      return { history: "", creative: "", analysis1: "", analysis2: "" };
    }

    const data = await response.json();
    let jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    jsonText = jsonText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(jsonText);
    console.log(`[TTS] ✓ Generated 4 contextual questions`);
    return result;
  } catch (error) {
    console.error("[TTS] Question generation error:", error.message);
    return { history: "", creative: "", analysis1: "", analysis2: "" };
  }
}

/**
 * Build dialogue for a chunk with interjections (2-3 interjections, 1 question)
 * @param {string} text - The content for the expert to discuss
 * @param {string[]} reactions - Fixed reaction phrases (1-2)
 * @param {string} question - Contextual question (1)
 * @param {string} hostVoice - Host voice name (Gemini voice)
 * @param {string} expertVoice - Expert voice name (Gemini voice)
 * @param {string} expertCharacterName - Expert character name for addressing in questions
 * @param {string} [hostGreeting] - Optional greeting to host name (only for first chunk)
 * @returns {string} Formatted dialogue
 */
function buildChunkDialogue(
  text,
  reactions,
  question,
  hostVoice,
  expertVoice,
  expertCharacterName,
  hostGreeting,
) {
  // Prepend host greeting to content if provided (e.g., "Bem, Cláudia, ")
  const contentWithGreeting = hostGreeting ? `${hostGreeting} ${text}` : text;

  if (!contentWithGreeting || contentWithGreeting.length < 50) {
    return contentWithGreeting
      ? `**${expertVoice}:** ${contentWithGreeting}\n\n`
      : "";
  }

  const sentences = contentWithGreeting
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 10);

  if (sentences.length < 2) {
    return `**${expertVoice}:** ${contentWithGreeting}\n\n`;
  }

  const interjectionCount = getChunkInterjectionCount(text);
  const pattern = generateInterjectionPattern(interjectionCount);

  // Calculate insertion points (evenly spaced)
  const insertionPoints = [];
  const spacing = Math.floor(sentences.length / (interjectionCount + 1));
  for (let i = 1; i <= interjectionCount; i++) {
    insertionPoints.push(i * spacing);
  }

  let result = "";
  let currentChunk = "";
  let interjectionIdx = 0;
  let reactionIdx = 0;
  let questionUsed = false;

  for (let i = 0; i < sentences.length; i++) {
    currentChunk += (currentChunk ? " " : "") + sentences[i].trim();

    // Check if we should insert an interjection after this sentence
    if (
      interjectionIdx < insertionPoints.length &&
      i + 1 >= insertionPoints[interjectionIdx]
    ) {
      result += `**${expertVoice}:** ${currentChunk}\n\n`;
      currentChunk = "";

      // Get the interjection (R or Q)
      const type = pattern[interjectionIdx];
      let interjection;

      if (type === "Q" && question && !questionUsed) {
        // Prepend expert's name to the question for natural dialogue
        interjection = expertCharacterName
          ? `${expertCharacterName}, ${question}`
          : question;
        questionUsed = true;
      } else if (reactions && reactions.length > reactionIdx) {
        interjection = reactions[reactionIdx];
        reactionIdx++;
      } else {
        interjection = "That's fascinating.";
      }

      result += `**${hostVoice}:** ${interjection}\n\n`;
      interjectionIdx++;
    }
  }

  // Emit remaining text
  if (currentChunk.trim()) {
    result += `**${expertVoice}:** ${currentChunk.trim()}\n\n`;
  }

  return result;
}

// ============================================================
// TRANSLATION
// ============================================================

/**
 * Translate text using Gemini 2.0 Flash
 */
export async function translateWithGemini(
  text,
  targetLang,
  sourceLang,
  apiKey,
) {
  if (!text || text.length < 10) return text;
  if (targetLang === sourceLang) return text;

  const targetLangName = LANGUAGE_NAMES[targetLang] || "English";
  const sourceLangName = LANGUAGE_NAMES[sourceLang] || "English";

  console.log(`[TTS] Translating from ${sourceLangName} to ${targetLangName}`);

  const translationPrompt = `You are a professional translator. Translate ALL text from ${sourceLangName} to ${targetLangName}.

CRITICAL: Do NOT leave ANY English words untranslated except proper nouns (artist names, song titles in quotes).

MUST TRANSLATE (examples for Spanish):
- body positivity → positividad corporal
- self-love → amor propio  
- self-empowerment → autoempoderamiento
- feminism → feminismo
- empowerment → empoderamiento
- anthem → himno
- samples → muestras
- pop-dance → pop bailable
- productiveness → productividad
- boundaries → límites
- refusal → rechazo
- trade → intercambio
- mainstream → corriente principal
- breakup → ruptura
- heartbreak → desamor
- catchy → pegadizo
- hook → gancho
- chorus → estribillo
- verse → verso
- bridge → puente

Rules:
1. TRANSLATE every English word to ${targetLangName} - no exceptions except names
2. Keep artist names and song titles in quotes unchanged
3. Preserve numerical scores exactly
4. Sound natural and native in ${targetLangName}
5. Output ONLY the translation, no commentary

Text:
${text}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: translationPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
      },
    );

    if (!response.ok) {
      console.error("[TTS] Translation API error:", response.status);
      return text; // Return original on failure
    }

    const data = await response.json();
    const translatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translatedText) {
      console.error("[TTS] No translation in response");
      return text;
    }

    console.log(
      `[TTS] ✓ Translated ${text.length} → ${translatedText.length} chars`,
    );
    return translatedText.trim();
  } catch (error) {
    console.error("[TTS] Translation error:", error.message);
    return text;
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Strip HTML tags for TTS
 */
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
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Extract sections from analysis result
 */
function extractSectionsFromResult(result) {
  return {
    song: result.song || result.song_name || result.title || "",
    artist: result.artist || result.author || "",
    isBook: result.media_type === "literature" || (!result.song && !result.song_name && !!result.title && !!result.author),
    historicalContext: stripHtml(
      result.historical_context || result.context || "",
    ),
    creativeProcess: stripHtml(result.creative_process || ""),
    philosophicalAnalysis: stripHtml(
      result.philosophical_analysis || result.integrated_analysis || "",
    ),
    finalScore: result.final_score || result.philosophical_note || null,
    classification:
      result.classification_localized || result.classification || null,
    model: result.model || "unknown",
  };
}

/**
 * Convert PCM audio to WAV format
 */
export function pcmToWav(
  pcmData,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
) {
  const pcmBytes = new Uint8Array(pcmData);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcmBytes.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const wav = new ArrayBuffer(totalSize);
  const view = new DataView(wav);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Copy PCM data
  const wavBytes = new Uint8Array(wav);
  wavBytes.set(pcmBytes, headerSize);

  return wav;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Concatenate multiple PCM audio buffers into a single WAV
 * @param {ArrayBuffer[]} pcmBuffers - Array of PCM audio buffers
 * @param {number} sampleRate - Audio sample rate (default 24000)
 * @returns {ArrayBuffer} Combined WAV file
 */
function concatenatePcmToWav(pcmBuffers, sampleRate = 24000) {
  // Calculate total PCM data size
  let totalPcmSize = 0;
  for (const buf of pcmBuffers) {
    totalPcmSize += buf.byteLength;
  }

  const channels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const headerSize = 44;
  const totalSize = headerSize + totalPcmSize;

  const wav = new ArrayBuffer(totalSize);
  const view = new DataView(wav);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, totalPcmSize, true);

  // Copy all PCM data
  const wavBytes = new Uint8Array(wav);
  let offset = headerSize;
  for (const buf of pcmBuffers) {
    wavBytes.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }

  console.log(
    `[TTS] Concatenated ${pcmBuffers.length} chunks → ${totalPcmSize} bytes PCM → ${totalSize} bytes WAV`,
  );

  return wav;
}

// ============================================================
// CHUNK SCRIPT BUILDERS
// ============================================================

/**
 * Build intro chunk script (Host introduces, then hands off to Historian)
 */
function buildIntroChunkScript(
  song,
  artist,
  historyContent,
  reactions,
  question,
  names,
  phrases,
  langName,
) {
  const hostVoice = VOICE_CONFIG.host.geminiVoice;
  const historianVoice = VOICE_CONFIG.historian.geminiVoice;

  let script = `# PODCAST: Filosifai - Historical Context (${langName})
Voices:
- ${hostVoice} (${names.host}): Warm, engaging female host.
- ${historianVoice} (${names.historian}): Knowledgeable male historian.

PACING: Natural conversational flow. Brief pauses between speakers.
LANGUAGE: Speak ONLY in ${langName}.

## SCRIPT

`;

  // Intro - Host welcomes and addresses Historian by name
  script += `**${hostVoice}:** ${phrases.welcome} "${song}" ${phrases.byArtist} ${artist}. ${phrases.fascinating}\n\n`;

  // Host addresses historian by name (use handoff phrase or fallback to background)
  const historianHandoff = phrases.historianHandoff
    ? phrases.historianHandoff.replace("{name}", names.historian)
    : `${names.historian}, ${phrases.background}`;
  script += `**${hostVoice}:** ${historianHandoff}\n\n`;

  // Historical content with interjections
  // Include host greeting (e.g., "Bem, Cláudia,") - expert addresses host by name once
  const hostGreeting = phrases.hostGreeting
    ? phrases.hostGreeting.replace("{name}", names.host)
    : null;

  script += buildChunkDialogue(
    historyContent,
    reactions,
    question,
    hostVoice,
    historianVoice,
    names.historian,
    hostGreeting,
  );

  return script;
}

/**
 * Build creative process chunk script
 */
function buildCreativeChunkScript(
  creativeContent,
  reactions,
  question,
  names,
  phrases,
  langName,
  isBook = false,
) {
  const hostVoice = VOICE_CONFIG.host.geminiVoice;
  const criticVoice = VOICE_CONFIG.critic.geminiVoice;
  const criticRole = isBook ? "Enthusiastic male literary critic." : "Enthusiastic male music critic.";

  let script = `# PODCAST: Filosifai - Creative Process (${langName})
Voices:
- ${hostVoice} (${names.host}): Warm, engaging female host.
- ${criticVoice} (${names.critic}): ${criticRole}

PACING: Natural conversational flow. Brief pauses between speakers.
LANGUAGE: Speak ONLY in ${langName}.

## SCRIPT

`;

  // Host addresses critic by name
  const criticHandoff = phrases.criticHandoff
    ? phrases.criticHandoff.replace("{name}", names.critic)
    : `${names.critic}, ${phrases.creativeIntro}`;
  script += `**${hostVoice}:** ${criticHandoff}\n\n`;

  script += buildChunkDialogue(
    creativeContent,
    reactions,
    question,
    hostVoice,
    criticVoice,
    names.critic,
  );

  return script;
}

/**
 * Build analysis part 1 chunk script
 */
function buildAnalysis1ChunkScript(
  analysisContent,
  reactions,
  question,
  names,
  phrases,
  langName,
) {
  const hostVoice = VOICE_CONFIG.host.geminiVoice;
  const philosopherVoice = VOICE_CONFIG.philosopher.geminiVoice;

  let script = `# PODCAST: Filosifai - Philosophical Analysis Part 1 (${langName})
Voices:
- ${hostVoice} (${names.host}): Warm, engaging female host.
- ${philosopherVoice} (${names.philosopher}): Thoughtful male philosopher.

PACING: Natural conversational flow. Brief pauses between speakers.
LANGUAGE: Speak ONLY in ${langName}.

## SCRIPT

`;

  // Host addresses philosopher by name
  const philosopherHandoff = phrases.philosopherHandoff
    ? phrases.philosopherHandoff.replace("{name}", names.philosopher)
    : `${names.philosopher}, ${phrases.analysisIntro}`;
  script += `**${hostVoice}:** ${philosopherHandoff}\n\n`;

  script += buildChunkDialogue(
    analysisContent,
    reactions,
    question,
    hostVoice,
    philosopherVoice,
    names.philosopher,
  );

  return script;
}

/**
 * Build analysis part 2 + verdict chunk script
 */
function buildAnalysis2ChunkScript(
  analysisContent,
  finalScore,
  classification,
  reactions,
  question,
  names,
  phrases,
  langName,
) {
  const hostVoice = VOICE_CONFIG.host.geminiVoice;
  const philosopherVoice = VOICE_CONFIG.philosopher.geminiVoice;

  let script = `# PODCAST: Filosifai - Philosophical Analysis Part 2 & Verdict (${langName})
Voices:
- ${hostVoice} (${names.host}): Warm, engaging female host.
- ${philosopherVoice} (${names.philosopher}): Thoughtful male philosopher.

PACING: Natural conversational flow. Brief pauses between speakers.
LANGUAGE: Speak ONLY in ${langName}.

## SCRIPT

`;

  // Continue analysis with interjections
  script += buildChunkDialogue(
    analysisContent,
    reactions,
    question,
    hostVoice,
    philosopherVoice,
    names.philosopher,
  );

  // Verdict - Host addresses philosopher by name
  if (finalScore || classification) {
    const verdictHandoff = phrases.verdictHandoff
      ? phrases.verdictHandoff.replace("{name}", names.philosopher)
      : `${names.philosopher}, ${phrases.verdictIntro}`;
    script += `**${hostVoice}:** ${verdictHandoff}\n\n`;

    let verdict = "";
    if (finalScore) {
      verdict += `${phrases.scoreIs} ${finalScore} ${phrases.outOf10} `;
    }
    if (classification) {
      verdict += `${phrases.classification} "${classification}" ${phrases.category}`;
    }
    script += `**${philosopherVoice}:** ${verdict.trim()}\n\n`;
    script += `**${hostVoice}:** ${phrases.thanks}\n\n`;
  }

  return script;
}

/**
 * Generate TTS for a single chunk
 * @param {string} script - The multi-speaker script text
 * @param {Array} voiceConfigs - Speaker voice configurations
 * @param {string} chunkName - Label for logging
 * @param {string} apiKey - Gemini API key
 * @param {string} [systemInstruction] - Optional system instruction for voice enforcement
 * @returns {Promise<ArrayBuffer>} PCM audio data
 */
async function generateChunkTTS(
  script,
  voiceConfigs,
  chunkName,
  apiKey,
  systemInstruction,
) {
  const startTime = Date.now();

  try {
    const requestBody = {
      contents: [{ parts: [{ text: script }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: voiceConfigs,
          },
        },
      },
    };

    // Add system instruction if provided (enforces voice role adherence)
    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ${chunkName} error:`, response.status, errorText);
      throw new Error(`TTS ${chunkName} failed: ${response.status}`);
    }

    const data = await response.json();
    const b64Audio =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!b64Audio) {
      throw new Error(`No audio data in ${chunkName} response`);
    }

    // Decode base64 to bytes
    const binaryString = atob(b64Audio);
    const audioBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      audioBytes[i] = binaryString.charCodeAt(i);
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[TTS] ✓ ${chunkName}: ${audioBytes.length} bytes in ${elapsed}ms`,
    );

    return audioBytes.buffer;
  } catch (error) {
    console.error(`[TTS] ${chunkName} generation error:`, error.message);
    throw error;
  }
}

// ============================================================
// MAIN TTS GENERATION FUNCTION
// ============================================================

/**
 * Generate TTS audio using Gemini 2.5 Flash TTS
 * v3.0 - 4 parallel TTS calls with different expert voices per chunk
 */
export async function generateGeminiTTS(
  sections,
  targetLang,
  analysisLang,
  env,
) {
  const startTime = Date.now();
  const apiKey = await getSecret(env.GEMINI_API_KEY);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  console.log(`[TTS] ========== START (v3.0 - 4 Parallel Chunks) ==========`);
  console.log(`[TTS] Target: ${targetLang}, Source: ${analysisLang}`);

  const needsTranslation = targetLang !== analysisLang;
  let translatedSections = { ...sections };

  // ============================================================
  // STEP 1: TRANSLATION (if needed) - parallel
  // ============================================================
  if (needsTranslation) {
    const step1Start = Date.now();
    console.log(`[TTS] Step 1: Translating to ${targetLang}...`);

    const translationTasks = [];

    if (sections.historicalContext?.length > 10) {
      translationTasks.push(
        translateWithGemini(
          sections.historicalContext,
          targetLang,
          analysisLang,
          apiKey,
        ).then((t) => {
          translatedSections.historicalContext = t;
        }),
      );
    }
    if (sections.creativeProcess?.length > 10) {
      translationTasks.push(
        translateWithGemini(
          sections.creativeProcess,
          targetLang,
          analysisLang,
          apiKey,
        ).then((t) => {
          translatedSections.creativeProcess = t;
        }),
      );
    }
    if (sections.philosophicalAnalysis?.length > 10) {
      translationTasks.push(
        translateWithGemini(
          sections.philosophicalAnalysis,
          targetLang,
          analysisLang,
          apiKey,
        ).then((t) => {
          translatedSections.philosophicalAnalysis = t;
        }),
      );
    }

    await Promise.all(translationTasks);
    console.log(`[TTS] Step 1 complete: ${Date.now() - step1Start}ms`);
  }

  // ============================================================
  // STEP 2: PREPARE 4 CHUNKS
  // ============================================================
  const step2Start = Date.now();
  console.log(`[TTS] Step 2: Preparing 4 chunks...`);

  // Split philosophical analysis in half
  const { part1: analysis1, part2: analysis2 } = splitTextInHalf(
    translatedSections.philosophicalAnalysis || "",
  );

  const chunks = {
    history: translatedSections.historicalContext || "",
    creative: translatedSections.creativeProcess || "",
    analysis1: analysis1,
    analysis2: analysis2,
  };

  console.log(
    `[TTS] Chunk sizes: history=${chunks.history.length}, creative=${chunks.creative.length}, analysis1=${chunks.analysis1.length}, analysis2=${chunks.analysis2.length}`,
  );

  // ============================================================
  // STEP 3: GENERATE CONTEXTUAL QUESTIONS (1 LLM call)
  // ============================================================
  const names = getNames(targetLang);
  const contextualQuestions = await generateContextualQuestions(
    chunks,
    targetLang,
    names.host,
    apiKey,
  );
  console.log(`[TTS] Step 2-3 complete: ${Date.now() - step2Start}ms`);

  // ============================================================
  // STEP 4: BUILD 4 CHUNK SCRIPTS
  // ============================================================
  const step4Start = Date.now();
  const isBook = sections.isBook || false;
  const p = getPhrases(targetLang, isBook);
  const langName = LANGUAGE_NAMES[targetLang] || "English";
  const usedReactionIndices = new Set();

  // Pick reactions for each chunk (2 reactions per chunk max)
  const historyReactions = pickReactions(2, p, usedReactionIndices);
  const creativeReactions = pickReactions(2, p, usedReactionIndices);
  const analysis1Reactions = pickReactions(2, p, usedReactionIndices);
  const analysis2Reactions = pickReactions(2, p, usedReactionIndices);

  // Build scripts for each chunk
  const script1 = buildIntroChunkScript(
    sections.song,
    sections.artist,
    chunks.history,
    historyReactions,
    contextualQuestions.history,
    names,
    p,
    langName,
  );

  const script2 = buildCreativeChunkScript(
    chunks.creative,
    creativeReactions,
    contextualQuestions.creative,
    names,
    p,
    langName,
    isBook,
  );

  const script3 = buildAnalysis1ChunkScript(
    chunks.analysis1,
    analysis1Reactions,
    contextualQuestions.analysis1,
    names,
    p,
    langName,
  );

  const script4 = buildAnalysis2ChunkScript(
    chunks.analysis2,
    sections.finalScore,
    sections.classification,
    analysis2Reactions,
    contextualQuestions.analysis2,
    names,
    p,
    langName,
  );

  console.log(`[TTS] Step 4 (script building): ${Date.now() - step4Start}ms`);
  console.log(
    `[TTS] Script lengths: chunk1=${script1.length}, chunk2=${script2.length}, chunk3=${script3.length}, chunk4=${script4.length}`,
  );

  // ============================================================
  // STEP 5: PARALLEL TTS GENERATION (4 calls)
  // ============================================================
  const step5Start = Date.now();
  console.log(`[TTS] Step 5: Generating 4 TTS chunks in parallel...`);

  // Voice configs for each chunk
  const hostVoice = VOICE_CONFIG.host.geminiVoice;
  const historianVoice = VOICE_CONFIG.historian.geminiVoice;
  const criticVoice = VOICE_CONFIG.critic.geminiVoice;
  const philosopherVoice = VOICE_CONFIG.philosopher.geminiVoice;

  const voiceConfig1 = [
    {
      speaker: hostVoice,
      voiceConfig: { prebuiltVoiceConfig: { voiceName: hostVoice } },
    },
    {
      speaker: historianVoice,
      voiceConfig: { prebuiltVoiceConfig: { voiceName: historianVoice } },
    },
  ];

  const voiceConfig2 = [
    {
      speaker: hostVoice,
      voiceConfig: { prebuiltVoiceConfig: { voiceName: hostVoice } },
    },
    {
      speaker: criticVoice,
      voiceConfig: { prebuiltVoiceConfig: { voiceName: criticVoice } },
    },
  ];

  const voiceConfig34 = [
    {
      speaker: hostVoice,
      voiceConfig: { prebuiltVoiceConfig: { voiceName: hostVoice } },
    },
    {
      speaker: philosopherVoice,
      voiceConfig: { prebuiltVoiceConfig: { voiceName: philosopherVoice } },
    },
  ];

  try {
    // Generate all 4 chunks in parallel
    const [audio1, audio2, audio3, audio4] = await Promise.all([
      generateChunkTTS(script1, voiceConfig1, "Chunk1-History", apiKey),
      generateChunkTTS(script2, voiceConfig2, "Chunk2-Creative", apiKey),
      generateChunkTTS(script3, voiceConfig34, "Chunk3-Analysis1", apiKey),
      generateChunkTTS(script4, voiceConfig34, "Chunk4-Analysis2", apiKey),
    ]);

    console.log(`[TTS] Step 5 (parallel TTS): ${Date.now() - step5Start}ms`);

    // ============================================================
    // STEP 6: CONCATENATE AUDIO
    // ============================================================
    const step6Start = Date.now();
    const combinedWav = concatenatePcmToWav([audio1, audio2, audio3, audio4]);
    console.log(`[TTS] Step 6 (concatenation): ${Date.now() - step6Start}ms`);

    const totalTime = Date.now() - startTime;
    console.log(
      `[TTS] ========== DONE: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s) ==========`,
    );

    return combinedWav;
  } catch (error) {
    console.error("[TTS] Parallel TTS generation error:", error.message);
    throw error;
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

/**
 * Main handler function for Gemini TTS endpoint
 */
export async function handleGeminiTTS(request, env, origin) {
  const corsHeaders = getCorsHeaders(origin, env);
  const jsonResponse = (data, status) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  console.log("[TTS] Handler started");

  try {
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[TTS] Failed to parse request body:", parseError.message);
      return jsonResponse({ error: "Invalid JSON in request body" }, 400);
    }

    const { result, targetLang = "en", analysisLang, analysisId } = body || {};

    if (!result || typeof result !== "object") {
      return jsonResponse({ error: "Missing analysis result" }, 400);
    }

    const sourceLang = analysisLang || result.lang || result.language || "en";

    // ============================================================
    // R2 CACHE CHECK (before content validation for faster response)
    // ============================================================
    const cacheKey = await getCacheKey(result, targetLang);
    console.log(`[TTS] Cache key: ${cacheKey}`);

    const cachedAudio = await getFromR2Cache(env, cacheKey);
    if (cachedAudio) {
      const audioUrl = getR2PublicUrl(env, cacheKey);
      console.log(
        `[TTS] ✓ Returning cached audio (${cachedAudio.byteLength} bytes)`,
      );

      return new Response(cachedAudio, {
        status: 200,
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": cachedAudio.byteLength.toString(),
          "Cache-Control": "public, max-age=31536000",
          "X-TTS-Cache": "HIT",
          "X-TTS-Audio-Url": audioUrl,
          ...corsHeaders,
        },
      });
    }

    // ============================================================
    // CACHE MISS - Validate content and generate new audio
    // ============================================================
    const sections = extractSectionsFromResult(result);
    const totalContent =
      (sections.historicalContext || "").length +
      (sections.creativeProcess || "").length +
      (sections.philosophicalAnalysis || "").length;

    if (totalContent < 50) {
      console.error("[TTS] Not enough content:", totalContent);
      return jsonResponse({ error: "Analysis content too short for TTS" }, 400);
    }

    console.log(
      `[TTS] Processing: ${totalContent} chars, target: ${targetLang}, source: ${sourceLang}`,
    );

    const wavAudio = await generateGeminiTTS(
      sections,
      targetLang,
      sourceLang,
      env,
    );

    console.log(`[TTS] ✓ Generated ${wavAudio.byteLength} bytes of WAV audio`);

    // ============================================================
    // SAVE TO R2 AND UPDATE ANALYSIS
    // ============================================================
    const audioUrl = getR2PublicUrl(env, cacheKey);

    // Save to R2 with metadata (don't await - run in background)
    const r2Metadata = {
      song: result?.song || result?.song_name || result?.title || "unknown",
      artist: result?.artist || result?.author || "unknown",
      language: targetLang,
      model: result?.model || result?.generated_by || "unknown",
    };
    saveToR2Cache(env, cacheKey, wavAudio, r2Metadata).catch((err) => {
      console.error("[TTS] Background R2 save failed:", err.message);
    });

    // Update analysis with audio URL (don't await - run in background)
    if (analysisId) {
      updateAnalysisAudioUrl(env, analysisId, audioUrl).catch((err) => {
        console.error("[TTS] Background audio_url update failed:", err.message);
      });
    }

    return new Response(wavAudio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": wavAudio.byteLength.toString(),
        "Cache-Control": "public, max-age=86400",
        "X-TTS-Cache": "MISS",
        "X-TTS-Audio-Url": audioUrl,
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[TTS] Error:", error);
    return jsonResponse({ error: "TTS generation failed" }, 500);
  }
}

// Export supported languages
export const SUPPORTED_TTS_LANGUAGES = Object.keys(LANGUAGE_NAMES);

// ============================================================
// ADMIN: CLEAR TTS CACHE
// ============================================================

/**
 * Clear all TTS audio files from R2 cache
 * Requires ADMIN_SECRET header for authentication
 */
export async function handleClearTTSCache(request, env, origin) {
  const corsHeaders = getCorsHeaders(origin, env);
  const jsonResp = (data, status) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  // Verify admin secret
  const adminSecret = request.headers.get("X-Admin-Secret");
  const expectedSecret = await getSecret(env.ADMIN_SECRET);

  if (!adminSecret || !expectedSecret || !safeEq(adminSecret, expectedSecret)) {
    return jsonResp({ error: "Unauthorized" }, 401);
  }

  if (!env.TTS_CACHE) {
    return jsonResp({ error: "R2 bucket not configured" }, 500);
  }

  try {
    console.log("[TTS Admin] Starting cache clear...");

    let deletedCount = 0;
    let cursor = undefined;
    const deletedFiles = [];

    // List and delete all objects in batches
    do {
      const listed = await env.TTS_CACHE.list({
        limit: 1000,
        cursor: cursor,
      });

      if (listed.objects.length === 0) break;

      // Delete each object and collect info
      for (const obj of listed.objects) {
        try {
          // Get metadata before deleting
          const metadata = obj.customMetadata || {};
          deletedFiles.push({
            key: obj.key,
            song: metadata.song || "unknown",
            artist: metadata.artist || "unknown",
            language: metadata.language || "unknown",
            size: obj.size,
          });

          await env.TTS_CACHE.delete(obj.key);
          deletedCount++;
          console.log(`[TTS Admin] Deleted: ${obj.key}`);
        } catch (err) {
          console.error(
            `[TTS Admin] Failed to delete ${obj.key}:`,
            err.message,
          );
        }
      }

      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);

    console.log(
      `[TTS Admin] Cache clear complete. Deleted ${deletedCount} files.`,
    );

    return jsonResp(
      {
        success: true,
        message: `Deleted ${deletedCount} cached TTS files`,
        deletedCount,
        deletedFiles,
      },
      200,
    );
  } catch (error) {
    console.error("[TTS Admin] Cache clear error:", error);
    return jsonResp({ error: "Cache clear failed" }, 500);
  }
}

// ============================================================
// DEBATE WRAP-UP TTS — 2-VOICE PODCAST
// ============================================================
// Generates a podcast-style audio for debate philosophical verdicts.
// Uses 2 voices: Host (Kore/Emma) introduces + reacts,
// Philosopher (Puck/Michael) delivers the verdict.
// Single TTS chunk — wrap-ups are ~600 words.
//
// ⚠️  PHILOSIFY PRONUNCIATION: "Filosifai" (see header)
// ============================================================

/**
 * Build a 2-voice podcast script from the debate wrap-up text.
 *
 * @param {string} wrapupText - Markdown wrap-up from Grok (≤600 words)
 * @param {string} threadTitle - The debate proposition title
 * @returns {string} Multi-speaker script for Gemini TTS
 */
// Debate wrap-up TTS phrases per language
const WRAPUP_PHRASES = {
  en: {
    debateVerdict: "Filosifai Debate Verdict.",
    theDebate: "The debate:",
    hereIsAnalysis: "Here is the philosophical analysis.",
    strongestArg: "Which argument was strongest?",
    fallacies: "Any fallacies or contradictions?",
    theVerdict: "The verdict.",
    noFallacies: "No major logical fallacies were identified in this debate.",
    concludes: "That concludes this Filosifai debate verdict.",
  },
  pt: {
    debateVerdict: "Veredito do Debate Filosifai.",
    theDebate: "O debate:",
    hereIsAnalysis: "Aqui está a análise filosófica.",
    strongestArg: "Qual argumento foi o mais forte?",
    fallacies: "Alguma falácia ou contradição?",
    theVerdict: "O veredito.",
    noFallacies:
      "Nenhuma falácia lógica importante foi identificada neste debate.",
    concludes: "Isso conclui este veredito de debate do Filosifai.",
  },
  es: {
    debateVerdict: "Veredicto del Debate Filosifai.",
    theDebate: "El debate:",
    hereIsAnalysis: "Aquí está el análisis filosófico.",
    strongestArg: "¿Cuál fue el argumento más fuerte?",
    fallacies: "¿Alguna falacia o contradicción?",
    theVerdict: "El veredicto.",
    noFallacies:
      "No se identificaron falacias lógicas importantes en este debate.",
    concludes: "Así concluye este veredicto de debate de Filosifai.",
  },
  fr: {
    debateVerdict: "Verdict du Débat Filosifai.",
    theDebate: "Le débat :",
    hereIsAnalysis: "Voici l'analyse philosophique.",
    strongestArg: "Quel argument était le plus fort ?",
    fallacies: "Des sophismes ou contradictions ?",
    theVerdict: "Le verdict.",
    noFallacies:
      "Aucun sophisme logique majeur n'a été identifié dans ce débat.",
    concludes: "Ceci conclut ce verdict de débat Filosifai.",
  },
  de: {
    debateVerdict: "Filosifai Debattenurteil.",
    theDebate: "Die Debatte:",
    hereIsAnalysis: "Hier ist die philosophische Analyse.",
    strongestArg: "Welches Argument war das stärkste?",
    fallacies: "Irgendwelche Trugschlüsse oder Widersprüche?",
    theVerdict: "Das Urteil.",
    noFallacies:
      "In dieser Debatte wurden keine größeren logischen Trugschlüsse festgestellt.",
    concludes: "Damit endet dieses Filosifai Debattenurteil.",
  },
  it: {
    debateVerdict: "Verdetto del Dibattito Filosifai.",
    theDebate: "Il dibattito:",
    hereIsAnalysis: "Ecco l'analisi filosofica.",
    strongestArg: "Quale argomento è stato il più forte?",
    fallacies: "Qualche fallacia o contraddizione?",
    theVerdict: "Il verdetto.",
    noFallacies:
      "Non sono state identificate fallacie logiche importanti in questo dibattito.",
    concludes: "Si conclude così questo verdetto di dibattito Filosifai.",
  },
  ru: {
    debateVerdict: "Вердикт дебатов Filosifai.",
    theDebate: "Дебаты:",
    hereIsAnalysis: "Вот философский анализ.",
    strongestArg: "Какой аргумент был самым сильным?",
    fallacies: "Есть ли логические ошибки или противоречия?",
    theVerdict: "Вердикт.",
    noFallacies: "В этих дебатах не было выявлено серьёзных логических ошибок.",
    concludes: "На этом завершается вердикт дебатов Filosifai.",
  },
  ja: {
    debateVerdict: "Filosifai ディベート判定。",
    theDebate: "ディベート：",
    hereIsAnalysis: "哲学的分析をお伝えします。",
    strongestArg: "最も強い議論はどれでしたか？",
    fallacies: "誤謬や矛盾はありましたか？",
    theVerdict: "判定です。",
    noFallacies: "このディベートでは重大な論理的誤謬は確認されませんでした。",
    concludes: "以上でFilosifaiディベート判定を終わります。",
  },
  ko: {
    debateVerdict: "Filosifai 토론 판정.",
    theDebate: "토론:",
    hereIsAnalysis: "철학적 분석입니다.",
    strongestArg: "가장 강력한 논거는 무엇이었나요?",
    fallacies: "오류나 모순이 있었나요?",
    theVerdict: "판정입니다.",
    noFallacies: "이 토론에서는 주요 논리적 오류가 확인되지 않았습니다.",
    concludes: "이상으로 Filosifai 토론 판정을 마칩니다.",
  },
  zh: {
    debateVerdict: "Filosifai 辩论裁决。",
    theDebate: "辩论：",
    hereIsAnalysis: "以下是哲学分析。",
    strongestArg: "哪个论点最有力？",
    fallacies: "有没有逻辑谬误或矛盾？",
    theVerdict: "裁决。",
    noFallacies: "本次辩论中未发现重大逻辑谬误。",
    concludes: "Filosifai辩论裁决到此结束。",
  },
  ar: {
    debateVerdict: "حكم نقاش Filosifai.",
    theDebate: "النقاش:",
    hereIsAnalysis: "إليكم التحليل الفلسفي.",
    strongestArg: "أي حجة كانت الأقوى؟",
    fallacies: "هل هناك مغالطات أو تناقضات؟",
    theVerdict: "الحكم.",
    noFallacies: "لم يتم تحديد مغالطات منطقية كبيرة في هذا النقاش.",
    concludes: "بهذا ينتهي حكم نقاش Filosifai.",
  },
  hi: {
    debateVerdict: "Filosifai बहस फैसला।",
    theDebate: "बहस:",
    hereIsAnalysis: "यहाँ दार्शनिक विश्लेषण है।",
    strongestArg: "सबसे मजबूत तर्क कौन सा था?",
    fallacies: "कोई तर्कदोष या विरोधाभास?",
    theVerdict: "फैसला।",
    noFallacies: "इस बहस में कोई बड़ा तार्किक दोष नहीं पाया गया।",
    concludes: "यह Filosifai बहस फैसला समाप्त होता है।",
  },
  he: {
    debateVerdict: "פסק דין דיון Filosifai.",
    theDebate: "הדיון:",
    hereIsAnalysis: "הנה הניתוח הפילוסופי.",
    strongestArg: "איזו טענה הייתה החזקה ביותר?",
    fallacies: "יש כשלים לוגיים או סתירות?",
    theVerdict: "פסק הדין.",
    noFallacies: "לא זוהו כשלים לוגיים משמעותיים בדיון זה.",
    concludes: "בכך מסתיים פסק דין הדיון של Filosifai.",
  },
  nl: {
    debateVerdict: "Filosifai Debat Oordeel.",
    theDebate: "Het debat:",
    hereIsAnalysis: "Hier is de filosofische analyse.",
    strongestArg: "Welk argument was het sterkst?",
    fallacies: "Zijn er drogredenen of tegenstrijdigheden?",
    theVerdict: "Het oordeel.",
    noFallacies:
      "Er zijn geen grote logische drogredenen vastgesteld in dit debat.",
    concludes: "Hiermee eindigt dit Filosifai debat oordeel.",
  },
  pl: {
    debateVerdict: "Werdykt Debaty Filosifai.",
    theDebate: "Debata:",
    hereIsAnalysis: "Oto analiza filozoficzna.",
    strongestArg: "Który argument był najsilniejszy?",
    fallacies: "Jakieś błędy logiczne lub sprzeczności?",
    theVerdict: "Werdykt.",
    noFallacies:
      "W tej debacie nie zidentyfikowano poważnych błędów logicznych.",
    concludes: "Na tym kończy się werdykt debaty Filosifai.",
  },
  tr: {
    debateVerdict: "Filosifai Tartışma Kararı.",
    theDebate: "Tartışma:",
    hereIsAnalysis: "İşte felsefi analiz.",
    strongestArg: "Hangi argüman en güçlüydü?",
    fallacies: "Herhangi bir mantık hatası veya çelişki var mı?",
    theVerdict: "Karar.",
    noFallacies: "Bu tartışmada önemli bir mantık hatası tespit edilmedi.",
    concludes: "Filosifai tartışma kararı burada sona eriyor.",
  },
  hu: {
    debateVerdict: "Filosifai Vita Ítélet.",
    theDebate: "A vita:",
    hereIsAnalysis: "Íme a filozófiai elemzés.",
    strongestArg: "Melyik érv volt a legerősebb?",
    fallacies: "Vannak logikai hibák vagy ellentmondások?",
    theVerdict: "Az ítélet.",
    noFallacies: "Ebben a vitában nem azonosítottak jelentős logikai hibákat.",
    concludes: "Ezzel véget ér ez a Filosifai vita ítélet.",
  },
  fa: {
    debateVerdict: "حکم بحث Filosifai.",
    theDebate: "بحث:",
    hereIsAnalysis: "تحلیل فلسفی اینجاست.",
    strongestArg: "کدام استدلال قوی‌ترین بود؟",
    fallacies: "آیا مغالطه یا تناقضی وجود دارد؟",
    theVerdict: "حکم.",
    noFallacies: "در این بحث هیچ مغالطه منطقی مهمی شناسایی نشد.",
    concludes: "حکم بحث Filosifai به پایان رسید.",
  },
};

/**
 * Clean verdict text for TTS: strip markdown, apply pronunciation lock.
 */
function cleanVerdictForTTS(wrapupText) {
  let clean = wrapupText
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/#{1,4}\s*/g, "") // headings
    .replace(/\n{3,}/g, "\n\n") // excess newlines
    .trim();

  // ⚠️ PRONUNCIATION LOCK: Replace "Philosify" with phonetic "Filosifai"
  clean = clean.replace(/Philosify/gi, "Filosifai");
  return clean;
}

/**
 * Split text into chunks at sentence boundaries, each under maxChars.
 */
function splitTextIntoChunks(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    // Find last sentence boundary before maxChars
    const slice = remaining.substring(0, maxChars);
    let splitAt = -1;

    // Try period+space, then period+newline, then just period
    for (const sep of [". ", ".\n", "."]) {
      const idx = slice.lastIndexOf(sep);
      if (idx > maxChars * 0.4) {
        splitAt = idx + sep.length;
        break;
      }
    }

    // Fallback: split at last space
    if (splitAt === -1) {
      splitAt = slice.lastIndexOf(" ");
      if (splitAt < maxChars * 0.4) splitAt = maxChars;
    }

    chunks.push(remaining.substring(0, splitAt).trim());
    remaining = remaining.substring(splitAt).trim();
  }

  return chunks;
}

/**
 * Build TTS script chunks for a verdict. If the verdict fits in one chunk,
 * returns a single script. Otherwise splits into multiple scripts:
 *   - Chunk 1: Kore intro + first part of verdict (Puck)
 *   - Middle chunks: Puck continues
 *   - Last chunk: Puck finishes + Kore closing
 */
function buildWrapupScriptChunks(wrapupText, threadTitle, langCode) {
  const clean = cleanVerdictForTTS(wrapupText);
  const p = WRAPUP_PHRASES[langCode] || WRAPUP_PHRASES.en;
  const langName = LANGUAGE_NAMES[langCode] || "English";

  const header = `# PODCAST: Filosifai - Debate Verdict (${langName})
Voices:
- Kore: Warm, engaging female host — introduces and closes.
- Puck: Knowledgeable male analyst — delivers the philosophical analysis.
PRONUNCIATION: The platform name is "Filosifai" (rhymes with Spotify). NEVER say "Philosophy" or "Philosofy".
PACING: Measured, thoughtful pace.
LANGUAGE: Speak ONLY in ${langName}.

## SCRIPT`;

  const koreIntro = `**Kore:** ${p.debateVerdict} ${p.theDebate} "${threadTitle}". ${p.hereIsAnalysis}`;
  const koreClosing = `**Kore:** ${p.concludes}`;

  // Budget for verdict text per chunk: total limit minus header/framing overhead
  const CHUNK_LIMIT = 4400;
  const overhead = header.length + koreIntro.length + 100; // 100 for formatting
  const firstChunkBudget = CHUNK_LIMIT - overhead;
  const middleChunkBudget = CHUNK_LIMIT - header.length - 80;

  // If it all fits in one chunk, return as-is
  if (clean.length <= firstChunkBudget) {
    const script = `${header}\n\n${koreIntro}\n\n**Puck:** ${clean}\n\n${koreClosing}\n\n=== END SCRIPT ===`;
    return [script];
  }

  // Split the verdict text into pieces
  const textChunks = splitTextIntoChunks(
    clean,
    Math.min(firstChunkBudget, middleChunkBudget),
  );

  console.log(
    `[TTS-Wrapup] Verdict too long (${clean.length} chars), splitting into ${textChunks.length} TTS chunks`,
  );

  return textChunks.map((chunk, i) => {
    const isFirst = i === 0;
    const isLast = i === textChunks.length - 1;

    let script = header + "\n\n";
    if (isFirst) {
      script += koreIntro + "\n\n";
    }
    script += `**Puck:** ${chunk}\n\n`;
    if (isLast) {
      script += koreClosing + "\n\n";
    }
    script += "=== END SCRIPT ===";
    return script;
  });
}

/**
 * Generate podcast-style TTS audio for a debate wrap-up.
 * Automatically chunks long verdicts into multiple TTS calls and
 * concatenates the audio so the FULL verdict is captured.
 *
 * @param {string} wrapupText - The markdown wrap-up text from Grok
 * @param {string} threadTitle - The debate proposition title
 * @param {Object} env - Cloudflare Worker env bindings (needs GEMINI_API_KEY)
 * @param {string} [langCode='en'] - Language code for the TTS audio
 * @returns {Promise<ArrayBuffer>} WAV audio buffer
 */
export async function generateWrapupTTS(
  wrapupText,
  threadTitle,
  env,
  langCode = "en",
) {
  const apiKey = await getSecret(env.GEMINI_API_KEY);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured for TTS");
  }

  console.log(
    `[TTS-Wrapup] Generating podcast for debate: "${threadTitle}" in ${langCode} (${wrapupText.length} chars)`,
  );

  const scriptChunks = buildWrapupScriptChunks(
    wrapupText,
    threadTitle,
    langCode,
  );

  // 2-voice config: Host (Kore) + Philosopher (Puck)
  const voiceConfigs = [
    {
      speaker: "Kore",
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
    },
    {
      speaker: "Puck",
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
    },
  ];

  if (scriptChunks.length === 1) {
    // Single chunk — same as before
    const pcmBuffer = await generateChunkTTS(
      scriptChunks[0],
      voiceConfigs,
      "wrapup",
      apiKey,
    );
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1, 16);
    console.log(
      `[TTS-Wrapup] ✓ Single chunk: ${wavBuffer.byteLength} bytes WAV`,
    );
    return wavBuffer;
  }

  // Multiple chunks — generate in parallel, concatenate PCM
  console.log(
    `[TTS-Wrapup] Generating ${scriptChunks.length} chunks in parallel...`,
  );
  const pcmBuffers = await Promise.all(
    scriptChunks.map((script, i) =>
      generateChunkTTS(
        script,
        voiceConfigs,
        `wrapup-${i + 1}/${scriptChunks.length}`,
        apiKey,
      ),
    ),
  );

  const wavBuffer = concatenatePcmToWav(pcmBuffers);
  console.log(
    `[TTS-Wrapup] ✓ ${scriptChunks.length} chunks concatenated: ${wavBuffer.byteLength} bytes WAV`,
  );

  return wavBuffer;
}
