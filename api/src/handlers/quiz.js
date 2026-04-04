// ============================================================
// QUIZ HANDLERS - Philosophical Quiz API
// Uses getServiceSupabase (same as all other handlers)
// Uses reserveCredit/confirmReservation (same credit system)
// ============================================================

import { jsonResponse } from '../utils/index.js';
import { getServiceSupabase, callRpc } from '../utils/supabase.js';
import { getUserFromAuth } from '../auth/index.js';
import { reserveCredit, confirmReservation, releaseReservation } from '../credits/index.js';
import { getSecret } from '../utils/secrets.js';

// ============================================================
// HELPER: Error response with CORS
// ============================================================
function errorResponse(message, status, origin, env) {
  return jsonResponse({ error: message }, status, origin, env);
}

// ============================================================
// HELPER: Runtime AI translation via Gemini
// Translates a quiz question on-the-fly and caches to DB
// ============================================================
async function translateQuestionWithAI(question, lang, env) {
  try {
    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) return null;

    const options = typeof question.options === 'string'
      ? JSON.parse(question.options) : question.options;
    const wrongExpl = typeof question.wrong_explanations === 'string'
      ? JSON.parse(question.wrong_explanations) : question.wrong_explanations;

    // NEW STRUCTURE: options = [{"text": "...", "correct": true}, {"text": "..."}, ...]
    // wrong_explanations keyed by index: {"0": "...", "1": "...", "2": "..."}
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
- Keep the "correct": true field on the correct option UNCHANGED
- Keep wrong_explanations keys unchanged (they are indices: "0", "1", "2", "3")
- Use local name forms for philosophers (e.g., Aristóteles, Платон, 亚里士多德)
- Keep it natural and punchy, not word-for-word
- CRITICAL: All four option texts MUST be approximately the same length (within ±3 words of each other). If the correct answer is longer, expand the wrong answers to match. If the correct answer is shorter, expand it slightly. The user must NOT be able to guess the correct answer by picking the longest option.
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

    // Validate translation has required fields
    if (!translated.question || !translated.options || !translated.explanation) return null;

    // Cache to DB (fire-and-forget — don't block the response)
    cacheTranslation(question.id, lang, translated, env).catch(() => {});

    return translated;
  } catch (err) {
    console.error(`[Quiz] AI translation failed for ${lang}:`, err.message);
    return null;
  }
}

// Cache AI translation back to the DB so future requests don't need Gemini
async function cacheTranslation(questionId, lang, translated, env) {
  try {
    const supabase = await getServiceSupabase(env);
    // First read current translations
    const { data: rows } = await supabase
      .from('quiz_questions')
      .select('translations', { filter: `id=eq.${questionId}`, limit: 1 });
    const current = (Array.isArray(rows) ? rows[0] : rows)?.translations || {};
    current[lang] = translated;
    // Write merged translations back
    await supabase.from('quiz_questions').update(
      { translations: current },
      `id=eq.${questionId}`
    );
    console.log(`[Quiz] Cached ${lang} translation for question ${questionId}`);
  } catch (err) {
    console.error(`[Quiz] Cache translation failed:`, err.message);
  }
}

// ============================================================
// HELPER: Balance option lengths using Gemini (for English)
// Rewrites short wrong answers to match correct answer length.
// Cached to DB under translations._balanced so it runs once per question.
// ============================================================
async function balanceOptionsWithAI(question, env) {
  try {
    const options = typeof question.options === 'string'
      ? JSON.parse(question.options) : question.options;
    if (!Array.isArray(options) || options.length < 4) return options;

    // NEW STRUCTURE: options = [{"text": "...", "correct": true}, {"text": "..."}, ...]
    const correctOpt = options.find(o => o.correct === true);
    const wrongOpts = options.filter(o => o.correct !== true);
    const correctWords = correctOpt?.text?.split(/\s+/).length || 0;
    const avgWrongWords = wrongOpts.reduce((s, o) => s + (o.text?.split(/\s+/).length || 0), 0) / wrongOpts.length;

    // Only balance if correct is significantly longer
    if (correctWords / (avgWrongWords || 1) <= 1.3) return options;

    // Check cache
    if (question.translations?._balanced) return question.translations._balanced;

    const apiKey = await getSecret(env.GEMINI_API_KEY);
    if (!apiKey) return options;

    // Find correct answer index for reference
    const correctIndex = options.findIndex(o => o.correct === true);

    const prompt = `Rewrite ONLY the wrong answers in this quiz question to be approximately the same word count as the correct answer (${correctWords} words). The correct answer must NOT change. Wrong answers must remain plausible but clearly incorrect.

Question: "${question.question}"
Correct answer (index ${correctIndex}): "${correctOpt.text}" (${correctWords} words)
Wrong answers: ${wrongOpts.map((o, i) => `"${o.text}" (${o.text.split(/\s+/).length}w)`).join(', ')}

Return ONLY a JSON array of all 4 options in the SAME ORDER as the input:
[{"text":"...", "correct": true}, {"text":"..."}, {"text":"..."}, {"text":"..."}]
The option at index ${correctIndex} must have "correct": true and its text must be EXACTLY: "${correctOpt.text}"
No markdown fences.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      },
    );

    if (!res.ok) return options;

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const balanced = JSON.parse(jsonStr);

    if (!Array.isArray(balanced) || balanced.length !== 4) return options;
    
    // Validate the correct answer is still marked
    if (!balanced.some(o => o.correct === true)) {
      console.error('[Quiz] Balanced options missing correct marker, using original');
      return options;
    }

    // Cache to DB
    cacheTranslation(question.id, '_balanced', balanced, env).catch(() => {});

    return balanced;
  } catch (err) {
    console.error('[Quiz] Balance options failed:', err.message);
    return typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
  }
}

// ============================================================
// HELPER: Shuffle options so correct answer lands on a random letter
// NEW STRUCTURE: options = [{"text": "...", "correct": true}, {"text": "..."}, ...]
// Letters (a, b, c, d) are assigned ONLY at display time based on position.
// Returns:
//   options: [{id, text}, ...] - options with assigned letter IDs for display
//   correctAnswer: 'letter' - the letter of the correct answer after shuffle
//   letterToIndex: {a: 2, b: 0, c: 3, d: 1} - maps letter -> original index (for wrong_explanations)
// ============================================================
function shuffleOptions(options) {
  const parsed = typeof options === 'string' ? JSON.parse(options) : options;
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { options: parsed, correctAnswer: null, letterToIndex: {} };
  }

  // Find original index of correct answer
  const originalCorrectIndex = parsed.findIndex(opt => opt.correct === true);
  if (originalCorrectIndex === -1) {
    console.error('[Quiz] CRITICAL: No option has correct: true', JSON.stringify(parsed));
    return { options: parsed, correctAnswer: null, letterToIndex: {} };
  }

  // Create array with original indices to track through shuffle
  const withIndices = parsed.map((opt, i) => ({ ...opt, _originalIndex: i }));

  // Fisher-Yates shuffle
  for (let i = withIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [withIndices[i], withIndices[j]] = [withIndices[j], withIndices[i]];
  }

  // Assign letter IDs (a, b, c, d) based on shuffled positions
  const letters = ['a', 'b', 'c', 'd'];
  let correctLetter = null;
  const letterToIndex = {}; // maps letter -> original index

  const newOptions = withIndices.map((opt, i) => {
    const letter = letters[i];
    letterToIndex[letter] = opt._originalIndex;
    if (opt.correct === true) {
      correctLetter = letter;
    }
    // Return option with assigned letter (don't expose "correct" or _originalIndex to frontend)
    return { id: letter, text: opt.text };
  });

  return {
    options: newOptions,
    correctAnswer: correctLetter,
    letterToIndex: letterToIndex,
  };
}

// ============================================================
// HELPER: Get translated question content
// Uses DB cache first, falls back to AI translation, then English
// NEW STRUCTURE: options = [{"text": "...", "correct": true}, {"text": "..."}, ...]
// ============================================================
async function getTranslatedQuestion(question, lang, env) {
  let qText = question.question;
  let qOptions = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;

  // Apply translation if not English
  if (lang && lang !== 'en') {
    // Check DB cache first
    if (question.translations && question.translations[lang]?.question) {
      const t = question.translations[lang];
      qText = t.question || qText;
      qOptions = t.options || qOptions;
    } else {
      // Try AI translation (also balances option lengths in the prompt)
      const ai = await translateQuestionWithAI(question, lang, env);
      if (ai) {
        qText = ai.question || qText;
        qOptions = ai.options || qOptions;
      }
    }
  } else {
    // English: balance option lengths if needed (correct answer typically longer)
    qOptions = await balanceOptionsWithAI(question, env);
  }

  // Shuffle options so correct answer is not always in the same position
  // NEW: shuffleOptions now takes only options (finds correct via "correct: true")
  const { options: shuffledOptions, correctAnswer: shuffledCorrect, letterToIndex } =
    shuffleOptions(qOptions);

  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: qText,
    options: shuffledOptions,
    // Internal: stored in session for answer validation
    _shuffledCorrectAnswer: shuffledCorrect,
    _letterToIndex: letterToIndex, // maps letter -> original option index (for wrong_explanations)
  };
}

// ============================================================
// HELPER: Get translated explanation
// Uses DB cache first, falls back to AI translation, then English
// userAnswerIndex is the original option index as a string ("0", "1", "2", "3")
// ============================================================
async function getTranslatedExplanation(question, lang, isCorrect, userAnswerIndex, env) {
  const wrongExpl = typeof question.wrong_explanations === 'string'
    ? JSON.parse(question.wrong_explanations) : question.wrong_explanations;
  
  // wrong_explanations keyed by index ("0", "1", "2", "3")
  const englishFallback = isCorrect
    ? question.explanation
    : (wrongExpl?.[userAnswerIndex] || question.explanation);

  if (!lang || lang === 'en') return englishFallback;

  // Check DB cache
  if (question.translations && question.translations[lang]?.explanation) {
    const t = question.translations[lang];
    return isCorrect
      ? t.explanation
      : (t.wrong_explanations?.[userAnswerIndex] || t.explanation);
  }

  // No cached translation — call Gemini to translate the explanation
  const ai = await translateQuestionWithAI(question, lang, env);
  if (ai) {
    return isCorrect
      ? (ai.explanation || englishFallback)
      : (ai.wrong_explanations?.[userAnswerIndex] || ai.explanation || englishFallback);
  }

  return englishFallback;
}

// ============================================================
// HELPER: Extract language from request
// ============================================================
function getLangFromRequest(request, body) {
  // From request body
  if (body?.lang) return body.lang;
  // From query string
  const url = new URL(request.url);
  if (url.searchParams.get('lang')) return url.searchParams.get('lang');
  // From Accept-Language header
  const accept = request.headers.get('Accept-Language');
  if (accept) return accept.split(',')[0].split('-')[0].trim();
  return 'en';
}

// ============================================================
// HELPER: Add credit to user (streak bonus)
// Direct REST update on credits table - adds to free_remaining
// ============================================================
async function addStreakBonus(env, userId) {
  try {
    const supabase = await getServiceSupabase(env);
    // Get current free_remaining
    const { data: credits, error: fetchError } = await supabase
      .from('credits')
      .select('free_remaining', { filter: `user_id=eq.${userId}`, limit: 1 });

    if (fetchError || !credits || credits.length === 0) {
      console.error('[Quiz] Failed to fetch credits for streak bonus:', fetchError);
      return;
    }

    const current = Array.isArray(credits) ? credits[0] : credits;
    const newFree = (current.free_remaining || 0) + 1;

    const { error: updateError } = await supabase
      .from('credits')
      .update(
        { free_remaining: newFree },
        `user_id=eq.${userId}`
      );

    if (updateError) {
      console.error('[Quiz] Failed to add streak bonus:', updateError);
    } else {
      console.log(`[Quiz] Streak bonus: +1 free credit for ${userId}`);
    }
  } catch (err) {
    console.error('[Quiz] Streak bonus error:', err.message);
    // Don't throw - streak bonus is a nice-to-have
  }
}

// ============================================================
// START QUIZ - Pay 1 credit, get first question
// ============================================================
export async function handleQuizStart(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    // Parse body for lang (POST request)
    let body = {};
    try { body = await request.json(); } catch (e) { /* no body is ok */ }
    const lang = getLangFromRequest(request, body);

    const supabase = await getServiceSupabase(env);

    // Check for existing active session
    const { data: existingSessions } = await supabase
      .from('quiz_sessions')
      .select('id', { filter: `user_id=eq.${user.userId}&status=eq.active`, limit: 1 });

    if (existingSessions && existingSessions.length > 0) {
      return errorResponse('You already have an active quiz session', 400, origin, env);
    }

    // Reserve 1 credit (same pattern as cinema/news)
    let reservation;
    try {
      reservation = await reserveCredit(env, user.userId);
    } catch (reserveErr) {
      console.error('[Quiz] Reserve credit threw:', reserveErr.message);
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }
    if (!reservation.success) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }

    // Create new session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.userId,
        status: 'active',
        current_difficulty: 1,
        credits_spent: 1,
      });

    if (sessionError || !session) {
      console.error('[Quiz] Failed to create session:', sessionError);
      await releaseReservation(env, reservation.reservationId, 'quiz-session-creation-failed');
      return errorResponse('Failed to start quiz', 500, origin, env);
    }

    // Confirm the credit reservation
    await confirmReservation(env, reservation.reservationId, `quiz:start:${session.id}`);

    // Get question IDs this user already answered correctly (across all sessions)
    const { data: historyData } = await supabase
      .rpc('get_user_correct_question_ids', { p_user_id: user.userId });
    const userCorrectIds = Array.isArray(historyData) ? historyData : (historyData || []);

    // Get first question (difficulty 1), excluding previously correct ones
    const { data: questionData, error: questionError } = await supabase
      .rpc('get_quiz_question', {
        p_difficulty: 1,
        p_excluded_ids: userCorrectIds,
      });
    const question = Array.isArray(questionData) ? questionData[0] : questionData;

    if (questionError || !question) {
      console.error('[Quiz] Failed to get question:', questionError);
      return errorResponse('No questions available', 500, origin, env);
    }

    // Translate and shuffle options
    const translated = await getTranslatedQuestion(question, lang, env);

    // Validate shuffled answer exists (critical for answer validation)
    if (!translated._shuffledCorrectAnswer) {
      console.error('[Quiz] CRITICAL: shuffleOptions did not return a valid correct answer');
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    // Store current question + shuffled correct answer in session
    const { error: updateError } = await supabase.from('quiz_sessions').update({
      current_question_id: question.id,
      current_correct_answer: translated._shuffledCorrectAnswer,
      current_shuffle_reverse: translated._letterToIndex || {}, // maps letter -> original index
    }, `id=eq.${session.id}`);

    if (updateError) {
      console.error('[Quiz] Failed to store shuffled answer in session:', updateError);
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    // Return session and question (without correct answer!)
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
        id: translated.id,
        category: translated.category,
        difficulty: translated.difficulty,
        question: translated.question,
        options: translated.options,
      },
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Start error:', err);
    return errorResponse(err.message || 'Failed to start quiz', 500, origin, env);
  }
}

// ============================================================
// SUBMIT ANSWER - Check answer, return feedback
// ============================================================
export async function handleQuizAnswer(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    const body = await request.json();
    const { sessionId, questionId, answer, lang: bodyLang } = body;
    const lang = bodyLang || getLangFromRequest(request, body);

    if (!sessionId || !questionId || !answer) {
      return errorResponse('Missing required fields', 400, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Get session
    const { data: sessions, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `id=eq.${sessionId}&user_id=eq.${user.userId}&status=eq.active`, limit: 1 });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;

    if (sessionError || !session) {
      return errorResponse('Invalid or expired session', 400, origin, env);
    }

    // Get question with correct answer
    const { data: questions, error: questionError } = await supabase
      .from('quiz_questions')
      .select('*', { filter: `id=eq.${questionId}`, limit: 1 });

    const question = Array.isArray(questions) ? questions[0] : questions;

    if (questionError || !question) {
      return errorResponse('Invalid question', 400, origin, env);
    }

    // Check if already answered
    const answeredIds = session.answered_question_ids || [];
    if (answeredIds.includes(questionId)) {
      return errorResponse('Question already answered', 400, origin, env);
    }

    // Check answer against the shuffled correct answer stored in the session
    // CRITICAL: We must use the shuffled answer, NOT the original question.correct_answer
    // The options were shuffled when served, so the correct letter changes each time
    const shuffledCorrect = session.current_correct_answer;
    
    // If shuffled answer is missing, the session is corrupted - fail safely
    if (!shuffledCorrect) {
      console.error('[Quiz] CRITICAL: session.current_correct_answer is missing for session', sessionId);
      console.error('[Quiz] This indicates the shuffle data was not stored. Question ID:', questionId);
      return errorResponse('Session data corrupted. Please start a new quiz.', 400, origin, env);
    }
    
    const isCorrect = answer === shuffledCorrect;

    // Calculate new values
    let newStreak = isCorrect ? session.current_streak + 1 : 0;
    let newMaxStreak = Math.max(session.max_streak, newStreak);
    let newDifficulty = isCorrect
      ? Math.min(session.current_difficulty + 1, 10)
      : session.current_difficulty;
    let newScore = session.score + (isCorrect ? question.difficulty * 10 : 0);
    let newQuestionNumber = session.current_question_number + 1;
    let creditEarned = 0;

    // Streak bonus: 10 correct in a row = 1 credit back
    if (newStreak > 0 && newStreak % 10 === 0) {
      creditEarned = 1;
      await addStreakBonus(env, user.userId);
    }

    // Record answer - store the original option index (for analytics/wrong_explanations)
    // letterToIndex maps shuffled letter -> original index (e.g., {a: 2, b: 0, c: 3, d: 1})
    const letterToIndex = session.current_shuffle_reverse || {};
    const originalIndex = letterToIndex[answer];
    await supabase.from('quiz_answers').insert({
      session_id: sessionId,
      question_id: questionId,
      user_answer: String(originalIndex ?? answer), // Store as string index ("0", "1", etc.)
      is_correct: isCorrect,
      difficulty_at_time: question.difficulty,
    });

    // Determine session status
    let newStatus = 'active';
    let needsPayment = false;

    if (!isCorrect) {
      newStatus = 'failed';
      needsPayment = true;
    } else if (newQuestionNumber >= 10) {
      needsPayment = true;
      newQuestionNumber = 0;
    }

    // Update session
    const updateData = {
      current_question_number: newQuestionNumber,
      current_difficulty: newDifficulty,
      current_streak: newStreak,
      max_streak: newMaxStreak,
      total_correct: session.total_correct + (isCorrect ? 1 : 0),
      total_wrong: session.total_wrong + (isCorrect ? 0 : 1),
      score: newScore,
      credits_earned: session.credits_earned + creditEarned,
      answered_question_ids: [...answeredIds, questionId],
      status: newStatus,
      last_activity_at: new Date().toISOString(),
    };

    if (newStatus !== 'active') {
      updateData.ended_at = new Date().toISOString();
    }

    await supabase.from('quiz_sessions').update(updateData, `id=eq.${sessionId}`);

    // Find the correct answer text — use translated options if available
    let translatedOptions = question.translations?.[lang]?.options;
    if (!translatedOptions && lang && lang !== 'en') {
      // Translation not cached yet — translate now
      const ai = await translateQuestionWithAI(question, lang, env);
      if (ai?.options) translatedOptions = ai.options;
    }
    const optionsToUse = translatedOptions || question.options;
    const parsedOptions = typeof optionsToUse === 'string' ? JSON.parse(optionsToUse) : optionsToUse;
    // NEW: Find correct option by "correct: true" flag instead of separate correct_answer column
    const correctOption = parsedOptions?.find(o => o.correct === true);

    // Get the shuffled correct letter (what the user would have seen)
    const shuffledCorrectLetter = shuffledCorrect;

    // Get explanation: wrong-specific when wrong, correct explanation when correct
    // originalIndex is the original option index (0, 1, 2, 3) for wrong_explanations lookup
    const wrongExplanation = await getTranslatedExplanation(question, lang, false, String(originalIndex), env);
    const correctExplanation = await getTranslatedExplanation(question, lang, true, String(originalIndex), env);

    // Build response with translated explanation
    return jsonResponse({
      isCorrect,
      correctAnswer: shuffledCorrectLetter,
      correctAnswerText: correctOption?.text || '',
      explanation: isCorrect ? correctExplanation : wrongExplanation,
      correctExplanation: isCorrect ? null : correctExplanation,
      session: {
        id: sessionId,
        questionNumber: newQuestionNumber + 1,
        difficulty: newDifficulty,
        streak: newStreak,
        maxStreak: newMaxStreak,
        score: newScore,
        totalCorrect: session.total_correct + (isCorrect ? 1 : 0),
        totalWrong: session.total_wrong + (isCorrect ? 0 : 1),
        creditsEarned: session.credits_earned + creditEarned,
        status: newStatus,
      },
      needsPayment,
      streakBonus: creditEarned > 0,
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Answer error:', err);
    return errorResponse(err.message || 'Failed to submit answer', 500, origin, env);
  }
}

// ============================================================
// CONTINUE QUIZ - Pay 1 credit after wrong answer or 10 questions
// ============================================================
export async function handleQuizContinue(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    const body = await request.json();
    const { sessionId } = body;
    const lang = getLangFromRequest(request, body);

    if (!sessionId) {
      return errorResponse('Missing session ID', 400, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Get session (can be active or failed)
    const { data: sessions, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `id=eq.${sessionId}&user_id=eq.${user.userId}`, limit: 1 });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;

    if (sessionError || !session || !['active', 'failed'].includes(session.status)) {
      return errorResponse('Invalid session', 400, origin, env);
    }

    // Reserve 1 credit
    let reservation;
    try {
      reservation = await reserveCredit(env, user.userId);
    } catch (reserveErr) {
      console.error('[Quiz] Continue reserve credit threw:', reserveErr.message);
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }
    if (!reservation.success) {
      return jsonResponse({ error: 'Insufficient credits', code: 'INSUFFICIENT_CREDITS' }, 402, origin, env);
    }

    // Confirm immediately
    await confirmReservation(env, reservation.reservationId, `quiz:continue:${sessionId}`);

    // Get user's cross-session correct history
    const { data: historyData } = await supabase
      .rpc('get_user_correct_question_ids', { p_user_id: user.userId });
    const userCorrectIds = Array.isArray(historyData) ? historyData : (historyData || []);
    // Merge with current session's answered IDs
    const allExcluded = [...new Set([...(session.answered_question_ids || []), ...userCorrectIds])];

    // Get next question at current difficulty
    const { data: question, error: questionError } = await supabase
      .rpc('get_quiz_question', {
        p_difficulty: session.current_difficulty,
        p_excluded_ids: allExcluded,
      });

    let nextQuestion = question;

    if (questionError || !nextQuestion) {
      // Try lower difficulty
      const { data: fallback } = await supabase
        .rpc('get_quiz_question', {
          p_difficulty: Math.max(1, session.current_difficulty - 1),
          p_excluded_ids: allExcluded,
        });

      nextQuestion = fallback;
      if (!nextQuestion) {
        return errorResponse('No more questions available', 500, origin, env);
      }
    }

    // Translate and shuffle
    const translated = await getTranslatedQuestion(nextQuestion, lang, env);

    // Validate shuffled answer exists (critical for answer validation)
    if (!translated._shuffledCorrectAnswer) {
      console.error('[Quiz] CRITICAL: shuffleOptions did not return a valid correct answer in continue');
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    // Reactivate session with new question tracking
    const { error: updateError } = await supabase.from('quiz_sessions').update({
      status: 'active',
      credits_spent: session.credits_spent + 1,
      current_question_number: 0,
      current_question_id: nextQuestion.id,
      current_correct_answer: translated._shuffledCorrectAnswer,
      current_shuffle_reverse: translated._letterToIndex || {}, // maps letter -> original index
      ended_at: null,
      last_activity_at: new Date().toISOString(),
    }, `id=eq.${sessionId}`);

    if (updateError) {
      console.error('[Quiz] Failed to store shuffled answer in continue:', updateError);
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    return jsonResponse({
      session: {
        id: sessionId,
        questionNumber: 1,
        difficulty: session.current_difficulty,
        streak: session.current_streak,
        score: session.score,
        creditsSpent: session.credits_spent + 1,
        creditsEarned: session.credits_earned,
      },
      question: {
        id: translated.id,
        category: translated.category,
        difficulty: translated.difficulty,
        question: translated.question,
        options: translated.options,
      },
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Continue error:', err);
    return errorResponse(err.message || 'Failed to continue quiz', 500, origin, env);
  }
}

// ============================================================
// GET NEXT QUESTION - For active sessions
// ============================================================
export async function handleQuizNextQuestion(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const lang = url.searchParams.get('lang') || getLangFromRequest(request, {});

    if (!sessionId) {
      return errorResponse('Missing session ID', 400, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Get active session
    const { data: sessions, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `id=eq.${sessionId}&user_id=eq.${user.userId}&status=eq.active`, limit: 1 });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;

    if (sessionError || !session) {
      return errorResponse('No active session', 400, origin, env);
    }

    // Get user's cross-session correct history
    const { data: historyData } = await supabase
      .rpc('get_user_correct_question_ids', { p_user_id: user.userId });
    const userCorrectIds = Array.isArray(historyData) ? historyData : (historyData || []);
    const allExcluded = [...new Set([...(session.answered_question_ids || []), ...userCorrectIds])];

    // Get question at current difficulty, falling back to nearby difficulties
    let question = null;
    const targetDiff = session.current_difficulty;

    for (let offset = 0; offset <= 5 && !question; offset++) {
      const diffs = offset === 0
        ? [targetDiff]
        : [targetDiff + offset, targetDiff - offset].filter(d => d >= 1 && d <= 10);

      for (const diff of diffs) {
        const { data: questionData, error: questionError } = await supabase
          .rpc('get_quiz_question', {
            p_difficulty: diff,
            p_excluded_ids: allExcluded,
          });
        const q = Array.isArray(questionData) ? questionData[0] : questionData;
        if (!questionError && q && q.question) {
          question = q;
          break;
        }
      }
    }

    if (!question) {
      return errorResponse('No questions available', 500, origin, env);
    }

    // Translate and shuffle
    const translated = await getTranslatedQuestion(question, lang, env);

    // Validate shuffled answer exists (critical for answer validation)
    if (!translated._shuffledCorrectAnswer) {
      console.error('[Quiz] CRITICAL: shuffleOptions did not return a valid correct answer in next-question');
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    // Store current question + shuffled answer in session
    const { error: updateError } = await supabase.from('quiz_sessions').update({
      current_question_id: question.id,
      current_correct_answer: translated._shuffledCorrectAnswer,
      current_shuffle_reverse: translated._letterToIndex || {}, // maps letter -> original index
    }, `id=eq.${sessionId}`);

    if (updateError) {
      console.error('[Quiz] Failed to store shuffled answer in next-question:', updateError);
      return errorResponse('Failed to prepare question', 500, origin, env);
    }

    return jsonResponse({
      question: {
        id: translated.id,
        category: translated.category,
        difficulty: translated.difficulty,
        question: translated.question,
        options: translated.options,
      },
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Next question error:', err);
    return errorResponse(err.message || 'Failed to get question', 500, origin, env);
  }
}

// ============================================================
// RESUME QUIZ - Check for active session and return it
// ============================================================
export async function handleQuizResume(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || getLangFromRequest(request, {});

    const supabase = await getServiceSupabase(env);

    // Find active or failed session for this user
    const { data: sessions, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*', { filter: `user_id=eq.${user.userId}&status=in.(active,failed)`, limit: 1, order: 'last_activity_at.desc' });

    const session = Array.isArray(sessions) ? sessions[0] : sessions;

    if (sessionError || !session) {
      return jsonResponse({ hasSession: false }, 200, origin, env);
    }

    // If session is active, get the next question (with difficulty fallback)
    let question = null;
    let translatedQuestion = null;
    if (session.status === 'active') {
      // Get user's cross-session correct history
      const { data: historyData } = await supabase
        .rpc('get_user_correct_question_ids', { p_user_id: user.userId });
      const userCorrectIds = Array.isArray(historyData) ? historyData : (historyData || []);
      const allExcluded = [...new Set([...(session.answered_question_ids || []), ...userCorrectIds])];

      const targetDiff = session.current_difficulty;
      for (let offset = 0; offset <= 5 && !question; offset++) {
        const diffs = offset === 0
          ? [targetDiff]
          : [targetDiff + offset, targetDiff - offset].filter(d => d >= 1 && d <= 10);
        for (const diff of diffs) {
          const { data: qData, error: qError } = await supabase
            .rpc('get_quiz_question', { p_difficulty: diff, p_excluded_ids: allExcluded });
          const q = Array.isArray(qData) ? qData[0] : qData;
          if (!qError && q && q.question) { question = q; break; }
        }
      }

      if (question) {
        const t = await getTranslatedQuestion(question, lang, env);
        
        // Validate shuffled answer exists (critical for answer validation)
        if (!t._shuffledCorrectAnswer) {
          console.error('[Quiz] CRITICAL: shuffleOptions did not return a valid correct answer in resume');
          // Don't fail the whole resume, just don't return a question
          translatedQuestion = null;
        } else {
          // Store shuffled answer in session
          const { error: updateError } = await supabase.from('quiz_sessions').update({
            current_question_id: question.id,
            current_correct_answer: t._shuffledCorrectAnswer,
            current_shuffle_reverse: t._letterToIndex || {}, // maps letter -> original index
          }, `id=eq.${session.id}`);
          
          if (updateError) {
            console.error('[Quiz] Failed to store shuffled answer in resume:', updateError);
            // Don't fail the whole resume, just don't return a question
            translatedQuestion = null;
          } else {
            translatedQuestion = {
              id: t.id, category: t.category, difficulty: t.difficulty,
              question: t.question, options: t.options,
            };
          }
        }
      }
    }

    return jsonResponse({
      hasSession: true,
      session: {
        id: session.id,
        status: session.status,
        questionNumber: session.current_question_number + 1,
        difficulty: session.current_difficulty,
        streak: session.current_streak,
        maxStreak: session.max_streak,
        score: session.score,
        totalCorrect: session.total_correct,
        totalWrong: session.total_wrong,
        creditsSpent: session.credits_spent,
        creditsEarned: session.credits_earned,
      },
      question: translatedQuestion,
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Resume error:', err);
    return errorResponse(err.message || 'Failed to resume quiz', 500, origin, env);
  }
}

// ============================================================
// GET LEADERBOARD - Anonymous rankings
// ============================================================
export async function handleQuizLeaderboard(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const supabase = await getServiceSupabase(env);

    // Get top 100 from leaderboard view
    const { data: leaderboard, error } = await supabase
      .from('quiz_leaderboard')
      .select('*', { limit: 100 });

    if (error) {
      console.error('[Quiz] Leaderboard error:', error);
      return errorResponse('Failed to fetch leaderboard', 500, origin, env);
    }

    // Get user's rank if authenticated
    let userRank = null;
    try {
      const user = await getUserFromAuth(request, env);
      if (user?.userId) {
        const { data: rankData } = await supabase
          .rpc('get_user_quiz_rank', { p_user_id: user.userId });
        if (rankData) {
          userRank = Array.isArray(rankData) ? rankData[0] : rankData;
        }
      }
    } catch (e) {
      // Not authenticated, skip user rank
    }

    return jsonResponse({
      leaderboard: leaderboard || [],
      userRank,
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Leaderboard error:', err);
    return errorResponse(err.message || 'Failed to get leaderboard', 500, origin, env);
  }
}

// ============================================================
// END QUIZ - Voluntarily end session
// ============================================================
export async function handleQuizEnd(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return errorResponse('Missing session ID', 400, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Update session to completed
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .update(
        { status: 'completed', ended_at: new Date().toISOString() },
        `id=eq.${sessionId}&user_id=eq.${user.userId}&status=in.(active,failed)`
      );

    if (error || !session) {
      return errorResponse('Failed to end session', 500, origin, env);
    }

    // Get user's rank
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
    return errorResponse(err.message || 'Failed to end quiz', 500, origin, env);
  }
}

// ============================================================
// GET PROFILE - Get user's quiz nickname
// ============================================================
export async function handleQuizGetProfile(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    const { data: profiles } = await supabase
      .from('quiz_profiles')
      .select('nickname', { filter: `user_id=eq.${user.userId}`, limit: 1 });

    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    return jsonResponse({
      nickname: profile?.nickname || null,
    }, 200, origin, env);

  } catch (err) {
    console.error('[Quiz] Get profile error:', err);
    return errorResponse(err.message || 'Failed to get profile', 500, origin, env);
  }
}

// ============================================================
// SET PROFILE - Set/update quiz nickname
// ============================================================
export async function handleQuizSetProfile(request, env) {
  const origin = request.headers.get('Origin') || '';

  try {
    const user = await getUserFromAuth(request, env);
    if (!user?.userId) {
      return errorResponse('Unauthorized', 401, origin, env);
    }

    const body = await request.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== 'string') {
      return errorResponse('Nickname is required', 400, origin, env);
    }

    // Sanitize: trim, limit length, remove special chars
    const clean = nickname.trim().replace(/[<>&"']/g, '').substring(0, 20);

    if (clean.length < 2) {
      return errorResponse('Nickname must be at least 2 characters', 400, origin, env);
    }

    if (clean.length > 20) {
      return errorResponse('Nickname must be 20 characters or less', 400, origin, env);
    }

    // Block offensive patterns (basic filter)
    const blocked = /admin|moderator|philosify|staff|support/i;
    if (blocked.test(clean)) {
      return errorResponse('This nickname is not allowed', 400, origin, env);
    }

    const supabase = await getServiceSupabase(env);

    // Upsert profile (insert or update)
    // Try insert first
    const { data: existing } = await supabase
      .from('quiz_profiles')
      .select('user_id', { filter: `user_id=eq.${user.userId}`, limit: 1 });

    const hasProfile = Array.isArray(existing) ? existing.length > 0 : !!existing;

    if (hasProfile) {
      const { error } = await supabase
        .from('quiz_profiles')
        .update(
          { nickname: clean, updated_at: new Date().toISOString() },
          `user_id=eq.${user.userId}`
        );
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
    return errorResponse(err.message || 'Failed to set nickname', 500, origin, env);
  }
}
