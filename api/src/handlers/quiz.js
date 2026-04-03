// ============================================================
// QUIZ HANDLERS - Philosophical Quiz API
// Uses getServiceSupabase (same as all other handlers)
// Uses reserveCredit/confirmReservation (same credit system)
// ============================================================

import { jsonResponse } from '../utils/index.js';
import { getServiceSupabase, callRpc } from '../utils/supabase.js';
import { getUserFromAuth } from '../auth/index.js';
import { reserveCredit, confirmReservation, releaseReservation } from '../credits/index.js';

// ============================================================
// HELPER: Error response with CORS
// ============================================================
function errorResponse(message, status, origin, env) {
  return jsonResponse({ error: message }, status, origin, env);
}

// ============================================================
// HELPER: Get translated question content
// Falls back to English if translation not available
// ============================================================
function getTranslatedQuestion(question, lang) {
  if (!lang || lang === 'en' || !question.translations || !question.translations[lang]) {
    return {
      id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      question: question.question,
      options: question.options,
    };
  }

  const t = question.translations[lang];
  return {
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: t.question || question.question,
    options: t.options || question.options,
  };
}

// ============================================================
// HELPER: Get translated explanation
// Falls back to English if translation not available
// ============================================================
function getTranslatedExplanation(question, lang, isCorrect, userAnswer) {
  if (!lang || lang === 'en' || !question.translations || !question.translations[lang]) {
    return isCorrect
      ? question.explanation
      : (question.wrong_explanations?.[userAnswer] || question.explanation);
  }

  const t = question.translations[lang];
  return isCorrect
    ? (t.explanation || question.explanation)
    : (t.wrong_explanations?.[userAnswer] || t.explanation || question.explanation);
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

    // Get first question (difficulty 1)
    const { data: question, error: questionError } = await supabase
      .rpc('get_quiz_question', {
        p_difficulty: 1,
        p_excluded_ids: [],
      });

    if (questionError || !question) {
      console.error('[Quiz] Failed to get question:', questionError);
      return errorResponse('No questions available', 500, origin, env);
    }

    // Return session and translated question (without correct answer!)
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
      question: getTranslatedQuestion(question, lang),
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

    // Check answer
    const isCorrect = answer === question.correct_answer;

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

    // Build response with translated explanation
    return jsonResponse({
      isCorrect,
      correctAnswer: question.correct_answer,
      explanation: getTranslatedExplanation(question, lang, isCorrect, answer),
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

    // Get next question at current difficulty
    const { data: question, error: questionError } = await supabase
      .rpc('get_quiz_question', {
        p_difficulty: session.current_difficulty,
        p_excluded_ids: session.answered_question_ids || [],
      });

    let nextQuestion = question;

    if (questionError || !nextQuestion) {
      // Try lower difficulty
      const { data: fallback } = await supabase
        .rpc('get_quiz_question', {
          p_difficulty: Math.max(1, session.current_difficulty - 1),
          p_excluded_ids: session.answered_question_ids || [],
        });

      nextQuestion = fallback;
      if (!nextQuestion) {
        return errorResponse('No more questions available', 500, origin, env);
      }
    }

    // Reactivate session
    await supabase.from('quiz_sessions').update({
      status: 'active',
      credits_spent: session.credits_spent + 1,
      current_question_number: 0,
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
      question: getTranslatedQuestion(nextQuestion, lang),
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

    // Get question at current difficulty, falling back to nearby difficulties
    const excludedIds = session.answered_question_ids || [];
    let question = null;
    const targetDiff = session.current_difficulty;

    // Try exact difficulty, then expand range ±1, ±2, etc.
    for (let offset = 0; offset <= 5 && !question; offset++) {
      const diffs = offset === 0
        ? [targetDiff]
        : [targetDiff + offset, targetDiff - offset].filter(d => d >= 1 && d <= 10);

      for (const diff of diffs) {
        const { data: questionData, error: questionError } = await supabase
          .rpc('get_quiz_question', {
            p_difficulty: diff,
            p_excluded_ids: excludedIds,
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

    return jsonResponse({
      question: getTranslatedQuestion(question, lang),
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
    if (session.status === 'active') {
      const excludedIds = session.answered_question_ids || [];
      const targetDiff = session.current_difficulty;
      for (let offset = 0; offset <= 5 && !question; offset++) {
        const diffs = offset === 0
          ? [targetDiff]
          : [targetDiff + offset, targetDiff - offset].filter(d => d >= 1 && d <= 10);
        for (const diff of diffs) {
          const { data: qData, error: qError } = await supabase
            .rpc('get_quiz_question', { p_difficulty: diff, p_excluded_ids: excludedIds });
          const q = Array.isArray(qData) ? qData[0] : qData;
          if (!qError && q && q.question) { question = q; break; }
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
      question: question ? getTranslatedQuestion(question, lang) : null,
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
        `id=eq.${sessionId}&user_id=eq.${user.userId}&status=eq.active`
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
