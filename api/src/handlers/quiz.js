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
- Keep option "id" fields unchanged (a, b, c, d)
- Use local name forms for philosophers (e.g., Aristóteles, Платон, 亚里士多德)
- Keep it natural and punchy, not word-for-word
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
// HELPER: Shuffle options so correct answer lands on a random letter
// Returns { options: [...], correctAnswer: 'new_letter', shuffleMap: {old -> new} }
// ============================================================
function shuffleOptions(options, correctAnswer) {
  const parsed = typeof options === 'string' ? JSON.parse(options) : options;
  if (!Array.isArray(parsed) || parsed.length === 0) return { options: parsed, correctAnswer };

  // Fisher-Yates shuffle
  const shuffled = [...parsed];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Assign new letter IDs (a, b, c, d) based on new positions
  const letters = ['a', 'b', 'c', 'd'];
  const oldToNew = {}; // maps old option id -> new letter
  const newOptions = shuffled.map((opt, i) => {
    oldToNew[opt.id] = letters[i];
    return { id: letters[i], text: opt.text };
  });

  return {
    options: newOptions,
    correctAnswer: oldToNew[correctAnswer] || correctAnswer,
    shuffleMap: oldToNew,
  };
}

// ============================================================
// HELPER: Get translated question content
// Uses DB cache first, falls back to AI translation, then English
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
      // Try AI translation
      const ai = await translateQuestionWithAI(question, lang, env);
      if (ai) {
        qText = ai.question || qText;
        qOptions = ai.options || qOptions;
      }
    }
  }

  // Shuffle options so correct answer is not always in the same position
  const { options: shuffledOptions, correctAnswer: shuffledCorrect, shuffleMap } =
    shuffleOptions(qOptions, question.correct_answer);

  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: qText,
    options: shuffledOptions,
    // Internal: the shuffled correct answer letter (stored in session for validation)
    _shuffledCorrectAnswer: shuffledCorrect,
    _shuffleMap: shuffleMap,
  };
}

// ============================================================
// HELPER: Get translated explanation
// Uses DB cache first, falls back to AI translation, then English
// ============================================================
async function getTranslatedExplanation(question, lang, isCorrect, userAnswer, env) {
  const wrongExpl = typeof question.wrong_explanations === 'string'
    ? JSON.parse(question.wrong_explanations) : question.wrong_explanations;
  const englishFallback = isCorrect
    ? question.explanation
    : (wrongExpl?.[userAnswer] || question.explanation);

  if (!lang || lang === 'en') return englishFallback;

  // Check DB cache
  if (question.translations && question.translations[lang]?.explanation) {
    const t = question.translations[lang];
    return isCorrect
      ? t.explanation
      : (t.wrong_explanations?.[userAnswer] || t.explanation);
  }

  // No cached translation — call Gemini to translate the explanation
  const ai = await translateQuestionWithAI(question, lang, env);
  if (ai) {
    return isCorrect
      ? (ai.explanation || englishFallback)
      : (ai.wrong_explanations?.[userAnswer] || ai.explanation || englishFallback);
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

    // Store current question + shuffled correct answer in session
    await supabase.from('quiz_sessions').update({
      current_question_id: question.id,
      current_correct_answer: translated._shuffledCorrectAnswer,
    }, `id=eq.${session.id}`);

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
    // (options are shuffled when served, so the correct letter changes each time)
    const shuffledCorrect = session.current_correct_answer || question.correct_answer;
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

    // Record answer
    await supabase.from('quiz_answers').insert({
      session_id: sessionId,
      question_id: questionId,
      user_answer: answer,
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

    // Find the correct answer text (using original option ID from DB)
    const options = question.translations?.[lang]?.options || question.options;
    const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
    const correctOption = parsedOptions?.find(o => o.id === question.correct_answer);

    // Get the shuffled correct letter (what the user would have seen)
    const shuffledCorrectLetter = shuffledCorrect;

    // Get explanation: wrong-specific when wrong, correct explanation when correct
    const wrongExplanation = await getTranslatedExplanation(question, lang, false, answer, env);
    const correctExplanation = await getTranslatedExplanation(question, lang, true, answer, env);

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

    // Reactivate session with new question tracking
    await supabase.from('quiz_sessions').update({
      status: 'active',
      credits_spent: session.credits_spent + 1,
      current_question_number: 0,
      current_question_id: nextQuestion.id,
      current_correct_answer: translated._shuffledCorrectAnswer,
      ended_at: null,
      last_activity_at: new Date().toISOString(),
    }, `id=eq.${sessionId}`);

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

    // Store current question + shuffled answer in session
    await supabase.from('quiz_sessions').update({
      current_question_id: question.id,
      current_correct_answer: translated._shuffledCorrectAnswer,
    }, `id=eq.${sessionId}`);

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
        // Store shuffled answer in session
        await supabase.from('quiz_sessions').update({
          current_question_id: question.id,
          current_correct_answer: t._shuffledCorrectAnswer,
        }, `id=eq.${session.id}`);
        translatedQuestion = {
          id: t.id, category: t.category, difficulty: t.difficulty,
          question: t.question, options: t.options,
        };
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
