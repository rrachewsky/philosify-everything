// ============================================================
// QUIZ HANDLERS - Philosophical Quiz API
// ============================================================

import { jsonResponse, sanitizeErrorMessage } from '../utils/index.js';
import { getServiceSupabase, callRpc } from '../utils/supabase.js';
import { getUserFromAuth } from '../auth/index.js';
import { reserveCredit, confirmReservation, releaseReservation } from '../credits/index.js';
import { getSecret } from '../utils/secrets.js';
import { isValidUUID } from '../utils/validation.js';

// ============================================================
// HELPER: Error response with CORS
// ============================================================
function errorResponse(message, status, origin, env) {
  return jsonResponse({ error: message }, status, origin, env);
}

// ============================================================
// HELPER: Randomize option order
// Returns options in random order with letters a/b/c/d assigned by position.
// The correct option retains its correct:true flag so validation never needs
// session storage — the server simply checks which letter the user picked
// and whether that option has correct:true in the DB.
// ============================================================
function randomizeOptions(options) {
  const parsed = typeof options === 'string' ? JSON.parse(options) : options;
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  const letters = ['a', 'b', 'c', 'd'];

  // Fisher-Yates shuffle on a copy
  const shuffled = [...parsed];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Assign letters by position, keep correct flag
  return shuffled.map((opt, i) => ({
    id: letters[i],
    text: opt.text,
    ...(opt.correct ? { _correct: true } : {}),
  }));
}

// ============================================================
// HELPER: Prepare question for serving
// Randomizes option order, strips internal flags before sending to client.
// Returns:
//   clientQuestion  - safe to send to frontend (no correct flag)
//   optionMap       - {letter: {text, correct}} for server-side validation
// ============================================================
function prepareQuestion(question, translatedOptions) {
  const rawOptions = translatedOptions ||
    (typeof question.options === 'string' ? JSON.parse(question.options) : question.options);

  const randomized = randomizeOptions(rawOptions);

  // Build map for validation: letter -> {text, correct}
  const optionMap = {};
  randomized.forEach(opt => {
    optionMap[opt.id] = { text: opt.text, correct: !!opt._correct };
  });

  // Strip _correct flag before sending to client
  const clientOptions = randomized.map(({ id, text }) => ({ id, text }));

  return { clientOptions, optionMap };
}

// ============================================================
// HELPER: Build full exclusion list for question selection
// Combines: correct answers (forever) + recent wrong answers (last 3 sessions) + current session
// ============================================================
async function getExcludedQuestionIds(supabase, userId, sessionAnsweredIds = []) {
  const [correctResult, recentWrongResult] = await Promise.all([
    supabase.rpc('get_user_correct_question_ids', { p_user_id: userId }),
    supabase.rpc('get_user_recent_wrong_question_ids', { p_user_id: userId, p_last_n_sessions: 3 }),
  ]);
  const correctIds = Array.isArray(correctResult.data) ? correctResult.data : [];
  const recentWrongIds = Array.isArray(recentWrongResult.data) ? recentWrongResult.data : [];
  return [...new Set([...sessionAnsweredIds, ...correctIds, ...recentWrongIds])];
}

// ============================================================
// HELPER: Map user language to philosophical/cultural region
// ============================================================
const LANG_TO_REGION = {
  pt: 'lusophone',       // Brazil, Portugal — Portuguese-speaking world
  es: 'hispanic',        // Spain, Latin America
  fr: 'francophone',     // France, French-speaking world
  de: 'germanic',        // Germany, Austria, Switzerland (German)
  it: 'italian',         // Italy, Renaissance heritage
  ru: 'russian',         // Russia, Eastern Europe
  ja: 'japanese',        // Japan
  ko: 'korean',          // Korea
  zh: 'chinese',         // China, Chinese-speaking world
  ar: 'arab',            // Arabic-speaking world, Islamic philosophy
  fa: 'persian',         // Iran, Persian philosophy
  he: 'jewish',          // Israel, Jewish philosophy
  hi: 'indian',          // India, Hindu/Buddhist philosophy
  tr: 'turkish',         // Turkey, Ottoman heritage
  pl: 'polish',          // Poland
  nl: 'dutch',           // Netherlands
  hu: 'hungarian',       // Hungary
  en: 'anglophone',      // English-speaking world (US, UK, Australia)
};

// Cultural context for each region (used in AI generation prompts)
const REGION_CONTEXT = {
  lusophone: 'Brazilian and Portuguese philosophy: Machado de Assis, Fernando Pessoa, Paulo Freire, Gilberto Freyre, Sérgio Buarque de Holanda, Olavo de Carvalho, Portuguese Age of Discoveries, Lusotropicalism, saudade, Brazilian positivism, Liberation Theology in Latin America',
  hispanic: 'Spanish and Latin American philosophy: Ortega y Gasset, Borges, Octavio Paz, Sor Juana Inés de la Cruz, Bartolomé de las Casas, Simón Bolívar, Mariátegui, philosophy of mestizaje, Salamanca School, Hispanic scholasticism, Latin American liberation philosophy',
  francophone: 'French philosophy: Descartes, Voltaire, Rousseau, Sartre, Beauvoir, Camus, Foucault, Derrida, Montaigne, Pascal, French Enlightenment, existentialism, structuralism, poststructuralism, laïcité, French Revolution ideals',
  germanic: 'German and Austrian philosophy: Kant, Hegel, Marx, Nietzsche, Heidegger, Wittgenstein, Hayek, Popper, Frankfurt School, German Idealism, phenomenology, hermeneutics, Bildung, Mitteleuropa intellectual tradition',
  italian: 'Italian philosophy: Machiavelli, Aquinas, Vico, Croce, Gramsci, Eco, Renaissance humanism, Roman Stoicism, Galileo and science vs. Church, Italian political thought, civic humanism',
  russian: 'Russian philosophy: Dostoevsky, Tolstoy, Solzhenitsyn, Berdyaev, Solovyov, Herzen, Russian religious philosophy, nihilism in Russian literature, Soviet Marxism-Leninism, dissident thought, Slavophiles vs. Westernizers',
  japanese: 'Japanese philosophy: Zen Buddhism, bushido, Nishida Kitaro, Watsuji Tetsuro, wabi-sabi, mono no aware, Kyoto School, samurai ethics, Japanese aesthetics, Dōgen, harmony (wa) in Japanese thought',
  korean: 'Korean philosophy: Neo-Confucianism in Joseon dynasty, Yi Toegye, Yi Yulgok, Korean Buddhism, Donghak movement, Korean concept of jeong (deep emotional bond), han (collective sorrow), Korean ethics of filial piety',
  chinese: 'Chinese philosophy: Confucius, Laozi, Zhuangzi, Mencius, Mozi, Han Fei, Zhu Xi, Wang Yangming, Daoism, Legalism, Neo-Confucianism, Chinese concept of ren (benevolence), li (ritual), dao (the Way)',
  arab: 'Arab and Islamic philosophy: Al-Farabi, Avicenna, Averroes, Al-Ghazali, Ibn Khaldun, Islamic Golden Age, kalam (theology), falsafa (philosophy), Sufism, ijtihad, Mutazilites vs. Asharites',
  persian: 'Persian philosophy: Zoroaster, Rumi, Hafez, Omar Khayyam, Suhrawardi, Mulla Sadra, Illumination philosophy, Persian Sufism, Persian poetry as philosophy, concept of fana (annihilation of self)',
  jewish: 'Jewish philosophy: Maimonides, Spinoza, Buber, Levinas, Arendt, Philo of Alexandria, Talmudic reasoning, Kabbalah, Jewish ethics (tikkun olam), Holocaust philosophy, Zionist thought, Jewish existentialism',
  indian: 'Indian philosophy: Vedanta, Buddhism, Jainism, Charvaka, Nyaya, Yoga, Gandhi, Tagore, Ambedkar, Sri Aurobindo, concept of dharma, karma, moksha, ahimsa, Indian debate traditions (shastrartha)',
  turkish: 'Turkish and Ottoman philosophy: Ottoman intellectual tradition, Sufi orders, Kemalist modernization, Ziya Gökalp, Namık Kemal, Turkish synthesis of East and West, secular vs. religious identity',
  polish: 'Polish philosophy: Copernicus, Twardowski, Lwów-Warsaw School, Kołakowski, Wojtyła (John Paul II), Polish Romanticism (Mickiewicz), Solidarity movement, Polish messianism, Jan Patočka influence',
  dutch: 'Dutch philosophy: Spinoza, Erasmus, Grotius, Dutch Golden Age thought, tolerance and pluralism, Dutch Reformed tradition, Huizinga, concept of gezelligheid, Dutch pragmatic liberalism',
  hungarian: 'Hungarian philosophy: Lukács, Polányi, Lakatos, Hungarian contributions to Vienna Circle, Budapest School, Hungarian liberalism, Bibó István on political hysteria, Central European intellectual tradition',
  anglophone: 'Anglo-American philosophy: Locke, Hume, Mill, American Founders, Emerson, Thoreau, pragmatism (James, Dewey, Peirce), analytic philosophy, Ayn Rand, common law tradition, individual rights',
};

function getRegionForLang(lang) {
  if (!lang) return 'anglophone';
  const base = lang.split('-')[0].toLowerCase();
  return LANG_TO_REGION[base] || 'anglophone';
}

// Fetch a regional question, falling back to universal if none available
async function getRegionalQuestion(supabase, difficulty, region, excludedIds) {
  // Try region-specific first
  const { data: regionalData } = await supabase
    .rpc('get_quiz_question_for_region', {
      p_difficulty: difficulty,
      p_region: region,
      p_excluded_ids: excludedIds,
    });
  const regional = Array.isArray(regionalData) ? regionalData[0] : regionalData;
  if (regional?.question) return regional;

  // Relax difficulty: try adjacent levels for regional
  for (let offset = 1; offset <= 3; offset++) {
    for (const diff of [difficulty + offset, difficulty - offset].filter(d => d >= 1 && d <= 10)) {
      const { data: fallbackData } = await supabase
        .rpc('get_quiz_question_for_region', {
          p_difficulty: diff,
          p_region: region,
          p_excluded_ids: excludedIds,
        });
      const fallback = Array.isArray(fallbackData) ? fallbackData[0] : fallbackData;
      if (fallback?.question) return fallback;
    }
  }

  // No regional question available at all — return null (caller will use universal)
  return null;
}

// Determine if the current question position should be regional (2 out of 10)
// Positions 3 and 7 (0-indexed) are regional slots
function shouldBeRegional(questionNumber) {
  const pos = (questionNumber || 0) % 10;
  return pos === 2 || pos === 6; // 3rd and 7th questions in each block of 10
}

// Smart question fetcher: picks regional or universal based on position
// Objectivism questions are part of the general pool (no forced slot)
// Distribution per 10 questions: 2 regional (pos 3, 7) + 8 universal (including Objectivism in the mix)
async function fetchNextQuestion(supabase, difficulty, lang, excludedIds, questionNumber) {
  const region = getRegionForLang(lang);

  // Positions 3 and 7: Regional question
  if (shouldBeRegional(questionNumber)) {
    const regional = await getRegionalQuestion(supabase, difficulty, region, excludedIds);
    if (regional) return regional;
    // Fall through to universal if no regional available
  }

  // Universal question (fallback for all slots)
  const { data: questionData, error: questionError } = await supabase
    .rpc('get_quiz_question', { p_difficulty: difficulty, p_excluded_ids: excludedIds });
  let question = Array.isArray(questionData) ? questionData[0] : questionData;

  if (questionError || !question) {
    for (let offset = 1; offset <= 3 && !question; offset++) {
      for (const diff of [difficulty - offset, difficulty + offset].filter(d => d >= 1 && d <= 10)) {
        const { data: fallbackData } = await supabase
          .rpc('get_quiz_question', { p_difficulty: diff, p_excluded_ids: excludedIds });
        const q = Array.isArray(fallbackData) ? fallbackData[0] : fallbackData;
        if (q?.question) { question = q; break; }
      }
    }
  }

  return question;
}

// ============================================================
// HELPER: Runtime AI translation via Gemini
// ============================================================
async function translateQuestionWithAI(question, lang, env) {
  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) return null;

    const options = typeof question.options === 'string'
      ? JSON.parse(question.options) : question.options;
    const wrongExpl = typeof question.wrong_explanations === 'string'
      ? JSON.parse(question.wrong_explanations) : question.wrong_explanations;

    const prompt = `Translate this philosophical quiz question into the language with ISO code "${lang}".
Return ONLY a valid JSON object, no markdown fences, no explanation.

Input:
{
  "question": ${JSON.stringify(question.question)},
  "options": ${JSON.stringify(options)},
  "explanation": ${JSON.stringify(question.explanation)},
  "wrong_explanations": ${JSON.stringify(wrongExpl)}
}

Rules:
- Translate question text, all option texts, explanation, and each wrong_explanation value
- Keep the "correct" field on the correct option UNCHANGED
- Use local name forms for philosophers
- Keep it natural and punchy, not word-for-word
- CRITICAL: All four option texts MUST be approximately the same length (within 3 words of each other)
- Return the EXACT same JSON structure with translated strings`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        }),
      },
    );

    if (!res.ok) return null;

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const translated = JSON.parse(jsonStr);

    if (!translated.question || !translated.options || !translated.explanation) return null;

    cacheTranslation(question.id, lang, translated, env).catch(() => {});

    return translated;
  } catch (err) {
    console.error(`[Quiz] AI translation failed for ${lang}:`, err.message);
    return null;
  }
}

async function cacheTranslation(questionId, lang, translated, env) {
  try {
    const supabase = await getServiceSupabase(env);
    const { data: rows } = await supabase
      .from('quiz_questions')
      .select('translations', { filter: `id=eq.${questionId}`, limit: 1 });
    const current = (Array.isArray(rows) ? rows[0] : rows)?.translations || {};
    current[lang] = translated;
    await supabase.from('quiz_questions').update(
      { translations: current },
      `id=eq.${questionId}`
    );
  } catch (err) {
    console.error(`[Quiz] Cache translation failed:`, err.message);
  }
}

// ============================================================
// HELPER: Get translated options for a question
// Ensures correct:true flag is always present on exactly one option.
// Some cached translations used the old format without the flag —
// in that case we restore it by matching position with the original DB options.
// ============================================================
async function getTranslatedOptions(question, lang, env) {
  const originalOptions = typeof question.options === 'string'
    ? JSON.parse(question.options) : question.options;

  if (!lang || lang === 'en') return originalOptions;

  let translatedOptions = null;

  // Check DB cache
  if (question.translations?.[lang]?.options) {
    translatedOptions = question.translations[lang].options;
  } else {
    // AI translation
    const ai = await translateQuestionWithAI(question, lang, env);
    if (ai?.options) translatedOptions = ai.options;
  }

  if (!translatedOptions) return originalOptions;

  // Ensure correct:true flag exists — old cached translations may lack it
  const hasCorrectFlag = translatedOptions.some(o => o.correct === true);
  if (!hasCorrectFlag && Array.isArray(originalOptions)) {
    const correctIdx = originalOptions.findIndex(o => o.correct === true);
    if (correctIdx >= 0 && translatedOptions[correctIdx]) {
      translatedOptions = translatedOptions.map((opt, i) => ({
        text: opt.text,
        ...(i === correctIdx ? { correct: true } : {}),
      }));
    }
  }

  return translatedOptions;
}

// ============================================================
// HELPER: Get translated question text
// ============================================================
async function getTranslatedText(question, lang, env) {
  if (!lang || lang === 'en') return question.question;
  if (question.translations?.[lang]?.question) return question.translations[lang].question;
  const ai = await translateQuestionWithAI(question, lang, env);
  return ai?.question || question.question;
}

// ============================================================
// HELPER: Get translated explanation
// wrongKey is the numeric index string ("0","1","2","3") of the original wrong option
// ============================================================
async function getTranslatedExplanation(question, lang, isCorrect, wrongKey, env) {
  const wrongExpl = typeof question.wrong_explanations === 'string'
    ? JSON.parse(question.wrong_explanations) : question.wrong_explanations;

  const englishFallback = isCorrect
    ? question.explanation
    : (wrongExpl?.[wrongKey] || question.explanation);

  if (!lang || lang === 'en') return englishFallback;

  if (question.translations?.[lang]?.explanation) {
    const t = question.translations[lang];
    return isCorrect
      ? t.explanation
      : (t.wrong_explanations?.[wrongKey] || t.explanation);
  }

  const ai = await translateQuestionWithAI(question, lang, env);
  if (ai) {
    return isCorrect
      ? (ai.explanation || englishFallback)
      : (ai.wrong_explanations?.[wrongKey] || ai.explanation || englishFallback);
  }

  return englishFallback;
}

// ============================================================
// HELPER: Extract language from request
// ============================================================
function getLangFromRequest(request, body) {
  if (body?.lang) return body.lang;
  const url = new URL(request.url);
  if (url.searchParams.get('lang')) return url.searchParams.get('lang');
  const accept = request.headers.get('Accept-Language');
  if (accept) return accept.split(',')[0].split('-')[0].trim();
  return 'en';
}

// ============================================================
// HELPER: Add credit to user (streak bonus)
// ============================================================
async function addStreakBonus(env, userId) {
  try {
    const supabase = await getServiceSupabase(env);
    const { data: credits, error: fetchError } = await supabase
      .from('credits')
      .select('free_remaining', { filter: `user_id=eq.${userId}`, limit: 1 });

    if (fetchError || !credits || credits.length === 0) return;

    const current = Array.isArray(credits) ? credits[0] : credits;
    const newFree = (current.free_remaining || 0) + 1;

    await supabase.from('credits').update(
      { free_remaining: newFree },
      `user_id=eq.${userId}`
    );
    console.log(`[Quiz] Streak bonus: +1 free credit for ${userId}`);
  } catch (err) {
    console.error('[Quiz] Streak bonus error:', err.message);
  }
}

// ============================================================
// START QUIZ - Pay 1 credit, get first question
// ============================================================
export async function handleQuizStart(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    let body = {};
    try { body = await request.json(); } catch (e) {}
    const lang = getLangFromRequest(request, body);

    const supabase = await getServiceSupabase(env);

    const { data: existingSessions } = await supabase
      .from('quiz_sessions')
      .select('id', { filter: `user_id=eq.${user.userId}&status=eq.active`, limit: 1 });

    if (existingSessions && existingSessions.length > 0) {
      return errorResponse('You already have an active quiz session', 400, origin, env);
    }

    let reservation;
    try {
      reservation = await reserveCredit(env, user.userId);
    } catch (reserveErr) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }
    if (!reservation.success) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }

    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.userId,
        status: 'active',
        current_difficulty: 1,
        credits_spent: 1,
      });

    if (sessionError || !session) {
      await releaseReservation(env, reservation.reservationId, 'quiz-session-creation-failed');
      return errorResponse('Failed to start quiz', 500, origin, env);
    }

    await confirmReservation(env, reservation.reservationId, `quiz:start:${session.id}`);

    const allExcluded = await getExcludedQuestionIds(supabase, user.userId);

    const question = await fetchNextQuestion(supabase, 1, lang, allExcluded, 0);

    if (!question) {
      return errorResponse('No questions available', 500, origin, env);
    }

    const translatedOptions = await getTranslatedOptions(question, lang, env);
    const translatedText = await getTranslatedText(question, lang, env);
    const { clientOptions, optionMap } = prepareQuestion(question, translatedOptions);

    // Store the option map in session so answer validation knows which letter = which option
    await supabase.from('quiz_sessions').update({
      current_question_id: question.id,
      current_option_map: optionMap,
    }, `id=eq.${session.id}`);

    return jsonResponse({
      session: {
        id: session.id,
        questionNumber: 1,
        difficulty: 1,
        streak: 0,
        score: 0,
        creditsSpent: 1,
        creditsEarned: 0,
      },
      question: {
        id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        question: translatedText,
        options: clientOptions,
      },
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Start error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to start quiz', 500, origin, env);
  }
}

// ============================================================
// SUBMIT ANSWER
// Validation: look up what letter the user picked in the stored option map,
// check if that option has correct:true. No shuffle tracking needed.
// ============================================================
export async function handleQuizAnswer(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    const body = await request.json();
    const { sessionId, questionId, answer, lang: bodyLang } = body;
    const lang = bodyLang || getLangFromRequest(request, body);

    if (!sessionId || !questionId || !answer) {
      return errorResponse('Missing required fields', 400, origin, env);
    }

    if (!isValidUUID(sessionId)) {
      return errorResponse('Invalid session ID format', 400, origin, env);
    }
    if (!isValidUUID(questionId)) {
      return errorResponse('Invalid question ID format', 400, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `id=eq.${sessionId}&user_id=eq.${user.userId}&status=eq.active`, limit: 1 });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;
    if (!session) return errorResponse('Invalid or expired session', 400, origin, env);

    const { data: questions } = await supabase
      .from('quiz_questions')
      .select('*', { filter: `id=eq.${questionId}`, limit: 1 });

    const question = Array.isArray(questions) ? questions[0] : questions;
    if (!question) return errorResponse('Invalid question', 400, origin, env);

    const answeredIds = session.answered_question_ids || [];
    if (answeredIds.includes(questionId)) {
      return errorResponse('Question already answered', 400, origin, env);
    }

    // Validate using the stored option map for this question
    // option map: { a: {text, correct}, b: {text, correct}, ... }
    const questionOptionMaps = session.question_option_maps || {};
    const optionMap = questionOptionMaps[questionId] || session.current_option_map || {};

    const pickedOption = optionMap[answer];
    if (!pickedOption) {
      console.error('[Quiz] No option map entry for answer', answer, 'in question', questionId);
      return errorResponse('Invalid answer option', 400, origin, env);
    }

    const isCorrect = pickedOption.correct === true;

    // Find correct letter and text from option map
    const correctEntry = Object.entries(optionMap).find(([, v]) => v.correct === true);
    const correctLetter = correctEntry?.[0] || '';
    const correctText = correctEntry?.[1]?.text || '';

    // Find original index of picked option for wrong_explanations lookup
    const rawOptions = typeof question.options === 'string'
      ? JSON.parse(question.options) : question.options;
    const pickedOriginalIdx = rawOptions.findIndex(o => o.text === pickedOption.text);
    const wrongKey = pickedOriginalIdx >= 0 ? String(pickedOriginalIdx) : '0';

    let newStreak = isCorrect ? session.current_streak + 1 : 0;
    let newMaxStreak = Math.max(session.max_streak || 0, newStreak);
    let newDifficulty = isCorrect ? Math.min(session.current_difficulty + 1, 10) : session.current_difficulty;
    let newScore = (session.score || 0) + (isCorrect ? question.difficulty * 10 : 0);
    let newQuestionNumber = (session.current_question_number || 0) + 1;
    let creditEarned = 0;

    if (newStreak > 0 && newStreak % 10 === 0) {
      creditEarned = 1;
      await addStreakBonus(env, user.userId);
    }

    await supabase.from('quiz_answers').insert({
      session_id: sessionId,
      question_id: questionId,
      user_answer: wrongKey,
      is_correct: isCorrect,
      difficulty_at_time: question.difficulty,
    });

    let newStatus = 'active';
    let needsPayment = false;

    if (!isCorrect) {
      newStatus = 'failed';
      needsPayment = true;
    } else if (newQuestionNumber >= 10) {
      needsPayment = true;
      newQuestionNumber = 0;
    }

    const updateData = {
      current_question_number: newQuestionNumber,
      current_difficulty: newDifficulty,
      current_streak: newStreak,
      max_streak: newMaxStreak,
      total_correct: (session.total_correct || 0) + (isCorrect ? 1 : 0),
      total_wrong: (session.total_wrong || 0) + (isCorrect ? 0 : 1),
      score: newScore,
      credits_earned: (session.credits_earned || 0) + creditEarned,
      answered_question_ids: [...answeredIds, questionId],
      status: newStatus,
      last_activity_at: new Date().toISOString(),
    };

    if (newStatus !== 'active') updateData.ended_at = new Date().toISOString();

    await supabase.from('quiz_sessions').update(updateData, `id=eq.${sessionId}`);

    // Fire-and-forget: check if we should auto-generate new questions
    maybeGenerateQuestions(env, lang);

    const wrongExplanation = await getTranslatedExplanation(question, lang, false, wrongKey, env);
    const correctExplanation = await getTranslatedExplanation(question, lang, true, wrongKey, env);

    return jsonResponse({
      isCorrect,
      correctAnswer: correctLetter,
      correctAnswerText: correctText,
      explanation: isCorrect ? correctExplanation : wrongExplanation,
      correctExplanation: isCorrect ? null : correctExplanation,
      session: {
        id: sessionId,
        questionNumber: newQuestionNumber + 1,
        difficulty: newDifficulty,
        streak: newStreak,
        maxStreak: newMaxStreak,
        score: newScore,
        totalCorrect: (session.total_correct || 0) + (isCorrect ? 1 : 0),
        totalWrong: (session.total_wrong || 0) + (isCorrect ? 0 : 1),
        creditsEarned: (session.credits_earned || 0) + creditEarned,
        status: newStatus,
      },
      needsPayment,
      streakBonus: creditEarned > 0,
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Answer error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to submit answer', 500, origin, env);
  }
}

// ============================================================
// CONTINUE QUIZ - Pay 1 credit after wrong answer or 10 questions
// ============================================================
export async function handleQuizContinue(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    const body = await request.json();
    const { sessionId } = body;
    const lang = getLangFromRequest(request, body);

    if (!sessionId) return errorResponse('Missing session ID', 400, origin, env);
    if (!isValidUUID(sessionId)) return errorResponse('Invalid session ID format', 400, origin, env);

    const supabase = await getServiceSupabase(env);

    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `id=eq.${sessionId}&user_id=eq.${user.userId}`, limit: 1 });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;

    if (!session || !['active', 'failed'].includes(session.status)) {
      return errorResponse('Invalid session', 400, origin, env);
    }

    let reservation;
    try {
      reservation = await reserveCredit(env, user.userId);
    } catch (err) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }
    if (!reservation.success) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }

    await confirmReservation(env, reservation.reservationId, `quiz:continue:${sessionId}`);

    const allExcluded = await getExcludedQuestionIds(supabase, user.userId, session.answered_question_ids || []);
    const questionNum = (session.answered_question_ids || []).length;

    const nextQuestion = await fetchNextQuestion(supabase, session.current_difficulty, lang, allExcluded, questionNum);
    if (!nextQuestion) return errorResponse('No more questions available', 500, origin, env);

    const translatedOptions = await getTranslatedOptions(nextQuestion, lang, env);
    const translatedText = await getTranslatedText(nextQuestion, lang, env);
    const { clientOptions, optionMap } = prepareQuestion(nextQuestion, translatedOptions);

    // Store option map keyed by question ID so pre-fetch cannot overwrite answers
    const questionOptionMaps = { ...(session.question_option_maps || {}), [nextQuestion.id]: optionMap };

    const { error: updateError } = await supabase.from('quiz_sessions').update({
      status: 'active',
      credits_spent: (session.credits_spent || 0) + 1,
      current_question_number: 0,
      current_question_id: nextQuestion.id,
      current_option_map: optionMap,
      question_option_maps: questionOptionMaps,
      ended_at: null,
      last_activity_at: new Date().toISOString(),
    }, `id=eq.${sessionId}`);

    if (updateError) {
      console.error('[Quiz] Failed to store option map in continue:', updateError);
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    return jsonResponse({
      session: {
        id: sessionId,
        questionNumber: 1,
        difficulty: session.current_difficulty,
        streak: session.current_streak || 0,
        score: session.score || 0,
        creditsSpent: (session.credits_spent || 0) + 1,
        creditsEarned: session.credits_earned || 0,
      },
      question: {
        id: nextQuestion.id,
        category: nextQuestion.category,
        difficulty: nextQuestion.difficulty,
        question: translatedText,
        options: clientOptions,
      },
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Continue error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to continue quiz', 500, origin, env);
  }
}

// ============================================================
// GET NEXT QUESTION - For active sessions
// ============================================================
export async function handleQuizNextQuestion(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const lang = url.searchParams.get('lang') || getLangFromRequest(request, {});

    if (!sessionId) return errorResponse('Missing session ID', 400, origin, env);

    const supabase = await getServiceSupabase(env);

    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `id=eq.${sessionId}&user_id=eq.${user.userId}&status=eq.active`, limit: 1 });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;
    if (!session) return errorResponse('No active session', 400, origin, env);

    const allExcluded = await getExcludedQuestionIds(supabase, user.userId, session.answered_question_ids || []);
    const questionNum = (session.answered_question_ids || []).length;

    const question = await fetchNextQuestion(supabase, session.current_difficulty, lang, allExcluded, questionNum);

    if (!question) return errorResponse('No questions available', 500, origin, env);

    const translatedOptions = await getTranslatedOptions(question, lang, env);
    const translatedText = await getTranslatedText(question, lang, env);

    // Reuse existing option map if already stored for this question
    // to prevent re-randomization overwriting the map the user already sees
    const existingMaps = session.question_option_maps || {};
    let optionMap, clientOptions;

    if (existingMaps[question.id]) {
      optionMap = existingMaps[question.id];
      // Reconstruct clientOptions from stored map preserving order
      const letters = ['a', 'b', 'c', 'd'];
      clientOptions = letters
        .filter(l => optionMap[l])
        .map(l => ({ id: l, text: optionMap[l].text }));
    } else {
      ({ clientOptions, optionMap } = prepareQuestion(question, translatedOptions));
    }

    const questionOptionMaps = { ...existingMaps, [question.id]: optionMap };

    const { error: updateError } = await supabase.from('quiz_sessions').update({
      current_question_id: question.id,
      current_option_map: optionMap,
      question_option_maps: questionOptionMaps,
    }, `id=eq.${sessionId}`);

    if (updateError) {
      console.error('[Quiz] Failed to store option map in next-question:', updateError);
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    return jsonResponse({
      question: {
        id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        question: translatedText,
        options: clientOptions,
      },
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Next question error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to get question', 500, origin, env);
  }
}

// ============================================================
// RESUME QUIZ
// ============================================================
export async function handleQuizResume(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || getLangFromRequest(request, {});

    const supabase = await getServiceSupabase(env);

    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `user_id=eq.${user.userId}&status=in.(active,failed)`, limit: 1, order: 'last_activity_at.desc' });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;
    if (!session) return jsonResponse({ hasSession: false }, 200, origin, env);

    let translatedQuestion = null;

    if (session.status === 'active') {
      const allExcluded = await getExcludedQuestionIds(supabase, user.userId, session.answered_question_ids || []);
      const questionNum = (session.answered_question_ids || []).length;

      const question = await fetchNextQuestion(supabase, session.current_difficulty, lang, allExcluded, questionNum);

      if (question) {
        const translatedOptions = await getTranslatedOptions(question, lang, env);
        const translatedText = await getTranslatedText(question, lang, env);
        const { clientOptions, optionMap } = prepareQuestion(question, translatedOptions);

        const questionOptionMaps = { ...(session.question_option_maps || {}), [question.id]: optionMap };

        const { error: updateError } = await supabase.from('quiz_sessions').update({
          current_question_id: question.id,
          current_option_map: optionMap,
          question_option_maps: questionOptionMaps,
        }, `id=eq.${session.id}`);

        if (!updateError) {
          translatedQuestion = {
            id: question.id,
            category: question.category,
            difficulty: question.difficulty,
            question: translatedText,
            options: clientOptions,
          };
        }
      }
    }

    return jsonResponse({
      hasSession: true,
      session: {
        id: session.id,
        status: session.status,
        questionNumber: (session.current_question_number || 0) + 1,
        difficulty: session.current_difficulty,
        streak: session.current_streak || 0,
        maxStreak: session.max_streak || 0,
        score: session.score || 0,
        totalCorrect: session.total_correct || 0,
        totalWrong: session.total_wrong || 0,
        creditsSpent: session.credits_spent || 0,
        creditsEarned: session.credits_earned || 0,
      },
      question: translatedQuestion,
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Resume error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to resume quiz', 500, origin, env);
  }
}

// ============================================================
// GET LEADERBOARD
// ============================================================
export async function handleQuizLeaderboard(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const supabase = await getServiceSupabase(env);

    const { data: leaderboard, error } = await supabase
      .from('quiz_leaderboard')
      .select('*', { limit: 100 });

    if (error) return errorResponse('Failed to fetch leaderboard', 500, origin, env);

    let userRank = null;
    try {
      const user = await getUserFromAuth(request, env);
      if (user?.userId) {
        const { data: rankData } = await supabase
          .rpc('get_user_quiz_rank', { p_user_id: user.userId });
        if (rankData) userRank = Array.isArray(rankData) ? rankData[0] : rankData;
      }
    } catch (e) {}

    return jsonResponse({ leaderboard: leaderboard || [], userRank }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Leaderboard error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to get leaderboard', 500, origin, env);
  }
}

// ============================================================
// END QUIZ
// ============================================================
export async function handleQuizEnd(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    const body = await request.json();
    const { sessionId } = body;
    if (!sessionId) return errorResponse('Missing session ID', 400, origin, env);

    const supabase = await getServiceSupabase(env);

    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .update(
        { status: 'completed', ended_at: new Date().toISOString() },
        `id=eq.${sessionId}&user_id=eq.${user.userId}&status=in.(active,failed)`
      );

    if (error || !session) return errorResponse('Failed to end session', 500, origin, env);

    const { data: rankData } = await supabase
      .rpc('get_user_quiz_rank', { p_user_id: user.userId });

    return jsonResponse({
      session: {
        id: session.id,
        score: session.score,
        totalCorrect: session.total_correct,
        totalWrong: session.total_wrong,
        maxStreak: session.max_streak,
        creditsSpent: session.credits_spent,
        creditsEarned: session.credits_earned,
      },
      rank: rankData || null,
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] End error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to end quiz', 500, origin, env);
  }
}

// ============================================================
// GET PROFILE
// ============================================================
export async function handleQuizGetProfile(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    const supabase = await getServiceSupabase(env);

    const { data: profiles } = await supabase
      .from('quiz_profiles')
      .select('nickname', { filter: `user_id=eq.${user.userId}`, limit: 1 });

    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    return jsonResponse({ nickname: profile?.nickname || null }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Get profile error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to get profile', 500, origin, env);
  }
}

// ============================================================
// SET PROFILE
// ============================================================
export async function handleQuizSetProfile(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) return errorResponse('Unauthorized', 401, origin, env);

    const body = await request.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== 'string') {
      return errorResponse('Nickname is required', 400, origin, env);
    }

    const clean = nickname.trim().replace(/[<>&"'`\x00-\x1f]/g, '').substring(0, 20);

    if (clean.length < 2) return errorResponse('Nickname must be at least 2 characters', 400, origin, env);
    if (clean.length > 20) return errorResponse('Nickname must be 20 characters or less', 400, origin, env);

    const blocked = /admin|moderator|philosify|staff|support/i;
    if (blocked.test(clean)) return errorResponse('This nickname is not allowed', 400, origin, env);

    const supabase = await getServiceSupabase(env);

    const { data: existing } = await supabase
      .from('quiz_profiles')
      .select('user_id', { filter: `user_id=eq.${user.userId}`, limit: 1 });

    const hasProfile = Array.isArray(existing) ? existing.length > 0 : !!existing;

    if (hasProfile) {
      const { error } = await supabase
        .from('quiz_profiles')
        .update({ nickname: clean, updated_at: new Date().toISOString() }, `user_id=eq.${user.userId}`);
      if (error) {
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
          return errorResponse('This nickname is already taken', 409, origin, env);
        }
        return errorResponse('Failed to update nickname', 500, origin, env);
      }
    } else {
      const { error } = await supabase
        .from('quiz_profiles')
        .insert({ user_id: user.userId, nickname: clean });
      if (error) {
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
          return errorResponse('This nickname is already taken', 409, origin, env);
        }
        return errorResponse('Failed to set nickname', 500, origin, env);
      }
    }

    return jsonResponse({ nickname: clean }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Set profile error:', err);
    return errorResponse(sanitizeErrorMessage(err.message) || 'Failed to set nickname', 500, origin, env);
  }
}

// ============================================================
// AUTO-GENERATION: Create new quiz questions via AI
// Triggered after every 10 answers to keep the pool fresh.
// Generates questions at the difficulty level with the smallest pool.
// ============================================================

const QUIZ_CATEGORIES = [
  'metaphysics', 'epistemology', 'ethics', 'politics',
  'aesthetics', 'applied', 'history', 'american_exceptionalism',
  'virtues', 'economics', 'law', 'music', 'cinema', 'quotes',
];

async function generateQuizQuestions(env, count = 10) {
  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) {
      console.error('[Quiz Gen] No Gemini API key');
      return;
    }

    const supabase = await getServiceSupabase(env);

    // Find difficulty levels with fewest questions
    const { data: diffCounts } = await supabase
      .from('quiz_questions')
      .select('difficulty', { count: 'exact', filter: 'active=eq.true' });

    // Count per difficulty from raw data
    const counts = {};
    if (Array.isArray(diffCounts)) {
      diffCounts.forEach(q => {
        counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
      });
    }

    // Find the difficulty level(s) that need the most questions
    const targetDifficulties = [];
    for (let d = 1; d <= 10; d++) {
      targetDifficulties.push({ difficulty: d, count: counts[d] || 0 });
    }
    targetDifficulties.sort((a, b) => a.count - b.count);

    // Distribute generation across the 3 most underserved difficulties
    const targets = targetDifficulties.slice(0, 3);
    const questionsPerTarget = Math.ceil(count / targets.length);

    for (const target of targets) {
      const numToGenerate = Math.min(questionsPerTarget, count);
      const category = QUIZ_CATEGORIES[Math.floor(Math.random() * QUIZ_CATEGORIES.length)];

      const prompt = `Generate ${numToGenerate} unique philosophy quiz questions at difficulty level ${target.difficulty}/10.

DIFFICULTY GUIDE:
- 1-2: Famous quotes, well-known philosophers, easy identification
- 3-4: Intermediate concepts, matching ideas to thinkers, basic arguments
- 5-6: Advanced concepts, nuanced distinctions, cross-tradition comparisons
- 7-8: Expert level, obscure works, detailed doctrines, subtle philosophical differences
- 9-10: Master level, specialized academic knowledge, original source texts

CATEGORIES (pick a mix): ${QUIZ_CATEGORIES.join(', ')}

PHILOSIFY CONTEXT: This is for Philosify, a platform that analyzes ideas through philosophical lenses.
Key values: reason over faith, reality over mysticism, individual rights, freedom, objective values.
Include questions about Objectivism, classical liberalism, and their critics alongside mainstream philosophy.

FORMAT: Return a JSON array. Each element must have exactly these fields:
{
  "category": "one of the categories above",
  "difficulty": ${target.difficulty},
  "question": "The question text in English",
  "options": [
    {"text": "Option A text", "correct": true},
    {"text": "Option B text"},
    {"text": "Option C text"},
    {"text": "Option D text"}
  ],
  "explanation": "Detailed explanation shown after correct answer (2-3 sentences)",
  "wrong_explanations": {
    "1": "Why option B is wrong",
    "2": "Why option C is wrong",
    "3": "Why option D is wrong"
  }
}

RULES:
- Exactly 4 options per question, exactly 1 correct
- Questions must be factually accurate
- Wrong explanations must be educational
- No duplicate questions (be creative and varied)
- Return ONLY the JSON array, no markdown fences`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
        }),
      });

      if (!res.ok) {
        console.error('[Quiz Gen] Gemini API error:', res.status);
        continue;
      }

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let questions;
      try {
        questions = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.error('[Quiz Gen] Failed to parse Gemini response:', parseErr.message);
        continue;
      }

      if (!Array.isArray(questions)) continue;

      // Insert valid questions into DB
      let inserted = 0;
      for (const q of questions) {
        if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) continue;
        if (!q.explanation || !q.wrong_explanations) continue;

        // Find which option is correct and build the DB format
        const correctIdx = q.options.findIndex(o => o.correct);
        if (correctIdx < 0) continue;

        const correctAnswer = String(correctIdx);
        const dbOptions = q.options.map(o => ({ text: o.text, ...(o.correct ? { correct: true } : {}) }));

        const validCategory = QUIZ_CATEGORIES.includes(q.category) ? q.category : category;
        const validDifficulty = Math.max(1, Math.min(10, q.difficulty || target.difficulty));

        const { error: insertError } = await supabase.from('quiz_questions').insert({
          category: validCategory,
          difficulty: validDifficulty,
          question: q.question,
          options: dbOptions,
          correct_answer: correctAnswer,
          explanation: q.explanation,
          wrong_explanations: q.wrong_explanations,
        });

        if (!insertError) {
          inserted++;
        } else {
          console.error('[Quiz Gen] Insert error:', insertError.message);
        }
      }

      console.log(`[Quiz Gen] Generated ${inserted} questions at difficulty ${target.difficulty} (pool was ${target.count})`);
    }
  } catch (err) {
    console.error('[Quiz Gen] Error:', err);
  }
}

// Generate region-specific questions for a given region
async function generateRegionalQuestions(env, region, count = 4) {
  const context = REGION_CONTEXT[region];
  if (!context) return;

  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) return;

    const supabase = await getServiceSupabase(env);

    const prompt = `Generate ${count} unique philosophy quiz questions specifically about ${region} cultural and philosophical traditions.

REGIONAL FOCUS — these questions MUST be about:
${context}

DIFFICULTY: Mix of levels 1-6 (accessible to a broad audience).

CATEGORIES (pick a mix): ${QUIZ_CATEGORIES.join(', ')}

IMPORTANT: Questions must be about philosophers, thinkers, ideas, literary figures, historical events, or cultural concepts SPECIFIC to this region. Not generic philosophy that happens to mention the region.

FORMAT: Return a JSON array. Each element must have exactly these fields:
{
  "category": "one of the categories above",
  "difficulty": 3,
  "question": "The question text in English",
  "options": [
    {"text": "Option A text", "correct": true},
    {"text": "Option B text"},
    {"text": "Option C text"},
    {"text": "Option D text"}
  ],
  "explanation": "Detailed explanation shown after correct answer (2-3 sentences)",
  "wrong_explanations": {
    "1": "Why option B is wrong",
    "2": "Why option C is wrong",
    "3": "Why option D is wrong"
  }
}

RULES:
- Exactly 4 options per question, exactly 1 correct
- Questions must be factually accurate and culturally respectful
- Wrong explanations must be educational
- Return ONLY the JSON array, no markdown fences`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      }),
    });

    if (!res.ok) {
      console.error('[Quiz Gen Regional] Gemini API error:', res.status);
      return;
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[Quiz Gen Regional] Failed to parse:', parseErr.message);
      return;
    }

    if (!Array.isArray(questions)) return;

    let inserted = 0;
    for (const q of questions) {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) continue;
      if (!q.explanation || !q.wrong_explanations) continue;

      const correctIdx = q.options.findIndex(o => o.correct);
      if (correctIdx < 0) continue;

      const correctAnswer = String(correctIdx);
      const dbOptions = q.options.map(o => ({ text: o.text, ...(o.correct ? { correct: true } : {}) }));
      const validCategory = QUIZ_CATEGORIES.includes(q.category) ? q.category : 'history';
      const validDifficulty = Math.max(1, Math.min(10, q.difficulty || 3));

      const { error: insertError } = await supabase.from('quiz_questions').insert({
        category: validCategory,
        difficulty: validDifficulty,
        question: q.question,
        options: dbOptions,
        correct_answer: correctAnswer,
        explanation: q.explanation,
        wrong_explanations: q.wrong_explanations,
        region: region,
      });

      if (!insertError) inserted++;
    }

    console.log(`[Quiz Gen Regional] Generated ${inserted} questions for ${region}`);
  } catch (err) {
    console.error('[Quiz Gen Regional] Error:', err);
  }
}

// Generate Objectivism-specific questions
// Sources: Ayn Rand's works, Objectivist philosophers, Bob Rach's songs, "O Grego, O Frade e a Heroína"
async function generateObjectivismQuestions(env, count = 3) {
  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) return;

    const supabase = await getServiceSupabase(env);

    const prompt = `Generate ${count} unique quiz questions about Objectivism and related works.

CORE SOURCES (mix questions from ALL of these):

1. AYN RAND'S PHILOSOPHY & WORKS:
- Atlas Shrugged: John Galt's speech, Dagny Taggart, Hank Rearden, Francisco d'Anconia's money speech, the motor of the world, "Who is John Galt?", the Gulch
- The Fountainhead: Howard Roark, Ellsworth Toohey, Dominique Francon, the Cortlandt trial, second-handers vs creators
- The Virtue of Selfishness: rational self-interest, the trader principle, individual rights
- Capitalism: The Unknown Ideal, Introduction to Objectivist Epistemology
- Key concepts: A is A (law of identity), existence exists, consciousness as identification, reason as man's only absolute, the virtue of productiveness, sacrifice = trading a greater value for a lesser one, hero vs martyr (reason vs faith)

2. BOB RACH'S SONGS (Objectivist-themed music by Philosify's creator):
- "Heroine" — celebrates the Randian heroine archetype: a woman of reason, independence, and productive achievement; the rational woman who lives by her own judgment rather than others' approval
- "My Life is Mine" — anthem of individual sovereignty and self-ownership; rejects sacrifice of self to collective; echoes Roark's "I came here to say that I do not recognize anyone's right to one minute of my life"
- "Blank Slate" — challenges the tabula rasa / blank slate myth; argues humans have a specific nature (volitional, rational); references Steven Pinker's critique and Rand's view that man has an identity
- Other songs explore themes of: virtuous self-interest, the producer vs the looter, romantic love as a response to values, the heroic in everyday life

3. "O GREGO, O FRADE E A HEROÍNA" (The Greek, The Friar, and The Heroine):
- A book exploring the fundamental distinction between animal instinct and human reason
- Animals operate by instinct (automatic, deterministic); humans operate by reason (volitional, conceptual)
- The "Greek" represents Aristotle and the rational tradition; the "Friar" represents medieval faith/mysticism; the "Heroine" represents the Objectivist ideal
- Central thesis: applying the word "instinct" to humans is a philosophical error that denies man's rational nature
- Key themes: reason vs faith, free will vs determinism, individual identity, the heroic human

4. OBJECTIVIST THINKERS: Leonard Peikoff (OPAR), Yaron Brook, Tara Smith, Harry Binswanger, David Kelley, Stephen Hicks (Explaining Postmodernism), Andrew Bernstein, Craig Biddle, Nathaniel Branden (psychology of self-esteem)

DIFFICULTY: Mix of levels 1-6.

CATEGORIES: ethics, epistemology, aesthetics, music, applied, quotes

FORMAT: Return a JSON array. Each element:
{
  "category": "one of the categories above",
  "difficulty": 3,
  "question": "The question text in English",
  "options": [
    {"text": "Option A text", "correct": true},
    {"text": "Option B text"},
    {"text": "Option C text"},
    {"text": "Option D text"}
  ],
  "explanation": "Detailed explanation (2-3 sentences)",
  "wrong_explanations": {
    "1": "Why option B is wrong",
    "2": "Why option C is wrong",
    "3": "Why option D is wrong"
  }
}

RULES:
- At least 1 question must reference Bob Rach's songs or "O Grego, O Frade e a Heroína"
- Questions must be factually accurate about Objectivism
- Use "virtuous self-interest" NOT "rational egoism"
- Sacrifice = trading a greater value for a lesser value (not all trade-offs)
- Hero vs Martyr distinction: hero acts by reason, martyr acts by faith
- Return ONLY the JSON array, no markdown fences`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
      }),
    });

    if (!res.ok) {
      console.error('[Quiz Gen Objectivism] Gemini API error:', res.status);
      return;
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[Quiz Gen Objectivism] Failed to parse:', parseErr.message);
      return;
    }

    if (!Array.isArray(questions)) return;

    let inserted = 0;
    for (const q of questions) {
      if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) continue;
      if (!q.explanation || !q.wrong_explanations) continue;

      const correctIdx = q.options.findIndex(o => o.correct);
      if (correctIdx < 0) continue;

      const correctAnswer = String(correctIdx);
      const dbOptions = q.options.map(o => ({ text: o.text, ...(o.correct ? { correct: true } : {}) }));
      const validCategory = QUIZ_CATEGORIES.includes(q.category) ? q.category : 'ethics';
      const validDifficulty = Math.max(1, Math.min(10, q.difficulty || 3));

      const { error: insertError } = await supabase.from('quiz_questions').insert({
        category: validCategory,
        difficulty: validDifficulty,
        question: q.question,
        options: dbOptions,
        correct_answer: correctAnswer,
        explanation: q.explanation,
        wrong_explanations: q.wrong_explanations,
        region: 'objectivism',
      });

      if (!insertError) inserted++;
    }

    console.log(`[Quiz Gen Objectivism] Generated ${inserted} questions`);
  } catch (err) {
    console.error('[Quiz Gen Objectivism] Error:', err);
  }
}

// Check if auto-generation should trigger (every 10 global answers)
// Generates: 5 universal + 3 regional + 2 objectivism questions
async function maybeGenerateQuestions(env, lang) {
  try {
    const supabase = await getServiceSupabase(env);
    const { data: countData } = await supabase.rpc('get_global_answer_count');
    const totalAnswers = typeof countData === 'number' ? countData : parseInt(countData, 10) || 0;

    // Generate every 10 answers
    if (totalAnswers > 0 && totalAnswers % 10 === 0) {
      const region = getRegionForLang(lang);
      // Fire and forget — don't block the response
      Promise.all([
        generateQuizQuestions(env, 5),
        generateRegionalQuestions(env, region, 3),
        generateObjectivismQuestions(env, 2),
      ]).catch(err => {
        console.error('[Quiz Gen] Background generation failed:', err);
      });
    }
  } catch (err) {
    console.error('[Quiz Gen] Check error:', err);
  }
}
