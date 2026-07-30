// QuizPage - v2 QUIZ module page (WP3).
// Visual truth: new_design/philosify-quiz.html (question cell + option
// cells + module template chrome). Functionality: every behavior of
// components/quiz/QuizSidebar.jsx — start (1 credit), answer loop,
// pay-to-continue (1 credit), resume, end, nickname profile,
// leaderboard, credit gates via pendingAction + v2-open-buy-credits,
// payment-resume on mount (Addendum 1), InlineAdSlot on feedback
// (Addendum 2), quizFetch 401 refresh-retry.
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell, ModuleHeader, Ticker, Button } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import InlineAdSlot from '../../components/ads/InlineAdSlot.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { setPendingAction, getPendingAction, clearPendingAction } from '../../utils/pendingAction.js';
import { config } from '../../config';
import '../../styles/v2-pages/quiz.css';

// ============================================================
// QUIZ API FUNCTIONS (copied from components/quiz/QuizSidebar.jsx)
// All API calls use quizFetch which auto-refreshes the auth
// cookie on 401 and retries once before failing.
// ============================================================
async function refreshAuthSession() {
  const resp = await fetch(`${config.apiUrl}/auth/session`, { credentials: 'include' });
  return resp.ok;
}

async function quizFetch(url, options = {}) {
  const resp = await fetch(url, { credentials: 'include', ...options });
  if (resp.status === 401) {
    // Token expired — refresh and retry once
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      const retry = await fetch(url, { credentials: 'include', ...options });
      const data = await retry.json();
      if (!retry.ok) {
        const error = new Error(data.error || 'Request failed');
        error.code = data.code;
        error.isAuthError = retry.status === 401;
        throw error;
      }
      return data;
    }
    const error = new Error('Unauthorized');
    error.isAuthError = true;
    throw error;
  }
  const data = await resp.json();
  if (!resp.ok) {
    const error = new Error(data.error || 'Request failed');
    error.code = data.code;
    throw error;
  }
  return data;
}

async function startQuiz(lang) {
  return quizFetch(`${config.apiUrl}/api/quiz/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang }),
  });
}

async function submitAnswer(sessionId, questionId, answer, lang) {
  return quizFetch(`${config.apiUrl}/api/quiz/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, questionId, answer, lang }),
  });
}

async function continueQuiz(sessionId, lang) {
  return quizFetch(`${config.apiUrl}/api/quiz/continue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, lang }),
  });
}

async function fetchLeaderboard() {
  return quizFetch(`${config.apiUrl}/api/quiz/leaderboard`, { method: 'GET' });
}

async function getQuizProfile() {
  return quizFetch(`${config.apiUrl}/api/quiz/profile`, { method: 'GET' });
}

async function setQuizProfile(nickname) {
  return quizFetch(`${config.apiUrl}/api/quiz/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
}

async function resumeQuiz(lang) {
  return quizFetch(`${config.apiUrl}/api/quiz/resume?lang=${lang}`, { method: 'GET' });
}

async function endQuizSession(sessionId) {
  return quizFetch(`${config.apiUrl}/api/quiz/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
}

// Validate a question has all required fields including option text
function isValidQuizQuestion(q) {
  if (!q || !q.question || !q.category) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  return q.options.every((o) => o && o.id && typeof o.text === 'string' && o.text.trim().length > 0);
}

// ============================================================
// LEADERBOARD (idle state) — same data/refresh cadence as the
// sidebar's LeaderboardTicker, rendered as a v2 row list.
// ============================================================
function Leaderboard({ refreshKey }) {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchLeaderboard();
        if (!cancelled) setLeaderboard(data.leaderboard || []);
      } catch {
        // Non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60 * 1000); // Refresh every minute
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshKey]);

  if (loading || leaderboard.length === 0) return null;

  return (
    <div className="lb">
      <div className="lbhead">{t('v2.quiz.leaderboard', 'Top scores')}</div>
      {leaderboard.map((entry, i) => (
        <div className="lbrow" key={`${entry.rank || i}-${entry.nickname || i}`}>
          <span className="rk">{String(i + 1).padStart(2, '0')}</span>
          <span className="nk">
            {entry.nickname || `${t('v2.quiz.player', 'Player')} #${i + 1}`}
          </span>
          <span className="sc">
            {entry.score} {t('v2.quiz.pts', 'pts')}
          </span>
          <span className="st">
            {t('v2.quiz.streak', 'Streak')} {entry.max_streak}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN QUIZ PAGE
// ============================================================
export default function QuizPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { balance } = useCreditsContext();

  // Quiz state (mirrors QuizSidebar)
  const [gameState, setGameState] = useState('idle'); // idle, playing, feedback, paused, ended
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [nickname, setNickname] = useState(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameError, setNicknameError] = useState(null);
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false);
  const sessionTimerRef = useRef(null);
  const bootRanRef = useRef(false);

  // Credit gate: store the pending action, open the shared Buy Credits
  // modal (v2 pattern), and resume on return (Addendum 1).
  const gateCredits = (action) => {
    setPendingAction(action);
    window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
  };

  // Internal start (after nickname exists). Cost: 1 credit.
  const handleStartQuizInternal = async () => {
    if (balance && (balance.total ?? 0) < 1) {
      gateCredits({ type: 'quiz:start' });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await startQuiz(i18n.language);
      const q = data.question;
      if (isValidQuizQuestion(q)) {
        setSession(data.session);
        setCurrentQuestion(q);
        setGameState('playing');
        window.dispatchEvent(new CustomEvent('credits-changed'));
      } else {
        setError(t('v2.quiz.noQuestions', 'No questions available. Please try again later.'));
      }
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        gateCredits({ type: 'quiz:start' });
      } else if (err.isAuthError) {
        setError(t('v2.quiz.sessionExpired', 'Session expired. Please sign in again.'));
        navigate('/signin');
      } else {
        setError(t('v2.quiz.genericError', 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Start quiz - prompt for nickname if not set
  const handleStartQuiz = () => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }
    if (!nickname) {
      setShowNicknamePrompt(true);
      return;
    }
    handleStartQuizInternal();
  };

  // Save nickname, then start
  const handleSaveNickname = async () => {
    if (!nicknameInput.trim()) return;
    setNicknameError(null);
    try {
      const data = await setQuizProfile(nicknameInput.trim());
      setNickname(data.nickname);
      setShowNicknamePrompt(false);
      handleStartQuizInternal();
    } catch (err) {
      setNicknameError(err.message);
    }
  };

  // Submit answer
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !session || !currentQuestion) return;
    setLoading(true);
    setError(null);
    try {
      const data = await submitAnswer(session.id, currentQuestion.id, selectedAnswer, i18n.language);
      setFeedback(data);
      setSession(data.session);
      setGameState('feedback');
      if (data.streakBonus) {
        window.dispatchEvent(new CustomEvent('credits-changed'));
      }
    } catch (err) {
      if (err.isAuthError) {
        setError(t('v2.quiz.sessionExpired', 'Session expired. Please sign in again.'));
        navigate('/signin');
      } else {
        setError(t('v2.quiz.genericError', 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Continue after feedback
  const handleContinue = async () => {
    setSelectedAnswer(null);
    setFeedback(null);

    // Wrong answer or completed 10 questions → pay to continue
    if (feedback?.needsPayment) {
      setGameState('paused');
      return;
    }

    setLoading(true);
    try {
      const data = await quizFetch(
        `${config.apiUrl}/api/quiz/question?sessionId=${session.id}&lang=${i18n.language}`,
        { method: 'GET' }
      );
      const q = data.question;
      if (isValidQuizQuestion(q)) {
        setCurrentQuestion(q);
        // Increment questionNumber since the API doesn't return updated session for next-question
        setSession((prev) => (prev ? { ...prev, questionNumber: (prev.questionNumber || 1) + 1 } : prev));
        setGameState('playing');
      } else {
        setError(t('v2.quiz.noQuestions', 'No questions available. Please try again later.'));
        setGameState('idle');
        setSession(null);
        setCurrentQuestion(null);
      }
    } catch (err) {
      if (err.isAuthError) {
        setError(t('v2.quiz.sessionExpired', 'Session expired. Please sign in again.'));
        navigate('/signin');
      } else {
        setError(t('v2.quiz.genericError', 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Pay to continue (1 credit) — optional session id for payment-resume
  const handlePayToContinue = async (sessionIdOverride) => {
    const sid = typeof sessionIdOverride === 'string' ? sessionIdOverride : session?.id;
    if (!sid) return;
    if (balance && (balance.total ?? 0) < 1) {
      gateCredits({ type: 'quiz:continue', sessionId: sid });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await continueQuiz(sid, i18n.language);
      const q = data.question;
      setSelectedAnswer(null);
      setFeedback(null);
      if (isValidQuizQuestion(q)) {
        setSession(data.session);
        setCurrentQuestion(q);
        setGameState('playing');
      } else {
        setError(t('v2.quiz.noQuestions', 'No questions available. Please try again later.'));
        setGameState('idle');
      }
      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        gateCredits({ type: 'quiz:continue', sessionId: sid });
      } else if (err.isAuthError) {
        setError(t('v2.quiz.sessionExpired', 'Session expired. Please sign in again.'));
        navigate('/signin');
      } else {
        setError(t('v2.quiz.genericError', 'Something went wrong. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // End quiz
  const handleEndQuiz = async () => {
    if (!session) {
      setGameState('idle');
      return;
    }
    setLoading(true);
    try {
      const data = await endQuizSession(session.id);
      setSession(data.session);
      setGameState('ended');
      setLeaderboardRefresh((prev) => prev + 1);
    } catch {
      // If already ended, just go to idle
      setGameState('idle');
    } finally {
      setLoading(false);
    }
  };

  // Boot: profile → resume active/failed session → payment-resume of a
  // pending quiz action (Addendum 1: location.state?.resume arrives via
  // the Router's PaymentReturnRedirect; the pendingAction survives the
  // Stripe round-trip in localStorage either way).
  useEffect(() => {
    if (authLoading || !isAuthenticated || bootRanRef.current) return;
    bootRanRef.current = true;

    (async () => {
      // 1. Nickname profile
      let nick = null;
      try {
        const profile = await getQuizProfile();
        if (profile.nickname) {
          nick = profile.nickname;
          setNickname(profile.nickname);
        }
      } catch {
        // Not critical
      }

      // 2. Resume any active session
      let resumed = null; // 'playing' | 'paused' | null
      let resumedSession = null;
      try {
        const data = await resumeQuiz(i18n.language);
        if (data.hasSession && data.session) {
          const q = data.question;
          if (data.session.status === 'active' && isValidQuizQuestion(q)) {
            setSession(data.session);
            setCurrentQuestion(q);
            setGameState('playing');
            setError(null);
            resumed = 'playing';
            resumedSession = data.session;
          } else if (data.session.status === 'failed') {
            setSession(data.session);
            setGameState('paused');
            resumed = 'paused';
            resumedSession = data.session;
          } else if (data.session.status === 'active') {
            // Session exists but question data is invalid — end it silently
            try {
              await endQuizSession(data.session.id);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // No session to resume, stay on idle
      }

      // 3. Payment-resume: retry the credit-gated action that sent the
      // user to Stripe (same shapes this page stores before the gate).
      const pending = getPendingAction();
      if (!pending?.type?.startsWith('quiz:')) return;
      clearPendingAction();
      if (pending.type === 'quiz:start' && resumed === null) {
        if (!nick) {
          setShowNicknamePrompt(true);
        } else {
          handleStartQuizInternal();
        }
      } else if (pending.type === 'quiz:continue' && resumed === 'paused') {
        handlePayToContinue(pending.sessionId || resumedSession?.id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  // Session expiry warning — warn before typical JWT expiry (~55 min)
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'feedback') {
      setSessionWarning(false);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      return undefined;
    }
    sessionTimerRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, 50 * 60 * 1000);
    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [gameState]);

  const questionNumber = session?.questionNumber || 1;
  const categoryLabel = currentQuestion
    ? t(`quiz.categories.${currentQuestion.category || 'general'}`, currentQuestion.category || 'General')
    : '';
  const credit1 = t('v2.quiz.cost1', '1 credit');

  return (
    <PageShell status={t('v2.landing.status', 'Analysis Engine // Active')} nav={<NavAccount />}>
      <ModuleHeader title={t('v2.quiz.title', 'QUIZ')}>
        <Ticker stat={t('v2.quiz.tickerStat', 'What you actually hold')}>
          {t('v2.quiz.ticker', 'Premise check // 10 questions per credit')}
        </Ticker>
      </ModuleHeader>

      <section className="pg-quiz">
        {error && <div className="err">{error}</div>}

        {/* IDLE — start screen (+ nickname prompt + leaderboard) */}
        {gameState === 'idle' && (
          <>
            <div className="cell qcell">
              <h2>{t('v2.quiz.welcome', 'TEST YOUR PHILOSOPHY')}</h2>
              <p>
                {t(
                  'v2.quiz.description',
                  'Answer questions about metaphysics, epistemology, ethics, politics, and more. Questions get harder as you progress.'
                )}
              </p>
              <ul className="rules">
                <li>{t('v2.quiz.rule1', '10 questions per credit')}</li>
                <li>{t('v2.quiz.rule2', 'Questions get harder with each correct answer')}</li>
                <li>{t('v2.quiz.rule3', 'Wrong answer? Pay 1 credit to continue')}</li>
                <li>{t('v2.quiz.rule4', '10 correct in a row = 1 credit back')}</li>
              </ul>
            </div>

            {showNicknamePrompt ? (
              <div className="cell qcell" style={{ marginTop: 12 }}>
                <h2>{t('v2.quiz.chooseNickname', 'CHOOSE YOUR NICKNAME FOR THE LEADERBOARD')}</h2>
                <input
                  className="f"
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  maxLength={20}
                  placeholder={t('v2.quiz.nicknamePlaceholder', 'e.g. PhiloMaster')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                />
                {nicknameError && <div className="err" style={{ margin: '10px 0 0' }}>{nicknameError}</div>}
                <div className="actionrow" style={{ marginTop: 14 }}>
                  <Button
                    onClick={handleSaveNickname}
                    disabled={!nicknameInput.trim() || nicknameInput.trim().length < 2}
                  >
                    {t('v2.quiz.saveAndStart', 'Save & start quiz')}
                  </Button>
                  <span className="costlab">{credit1}</span>
                </div>
              </div>
            ) : (
              <>
                {nickname && (
                  <div className="mnote">
                    {t('v2.quiz.playingAs', 'Playing as')}: {nickname}
                  </div>
                )}
                <div className="actionrow">
                  <Button onClick={handleStartQuiz} disabled={loading}>
                    {loading ? t('v2.quiz.starting', 'Starting…') : t('v2.quiz.start', 'Start quiz')}
                  </Button>
                  <span className="costlab">{credit1}</span>
                </div>
              </>
            )}

            <Leaderboard refreshKey={leaderboardRefresh} />
          </>
        )}

        {/* PLAYING — telemetry line + question cell + option cells */}
        {gameState === 'playing' && currentQuestion && (
          <>
            {sessionWarning && (
              <div className="warnnote">
                {t('v2.quiz.sessionExpiring', 'Your session is expiring soon. Submit your answer quickly.')}
              </div>
            )}
            <div className="state" style={{ marginTop: 0, marginBottom: 16 }}>
              <span>
                {t('v2.quiz.questionShort', 'Q')}
                {questionNumber}/10
              </span>
              <span>
                {t('v2.quiz.streak', 'Streak')} {session?.streak || 0}
              </span>
              <b>{session?.score || 0}</b>
              <span className="bar">
                <i style={{ width: `${Math.min(100, (questionNumber / 10) * 100)}%` }} />
              </span>
              <span>
                {categoryLabel} · {t('v2.quiz.difficulty', 'Difficulty')} {Math.min(currentQuestion.difficulty || 1, 10)}/10
              </span>
            </div>

            <div className="cell qcell">
              <h2>
                {t('v2.quiz.question', 'QUESTION')} {questionNumber} / 10
              </h2>
              <p className="q">{currentQuestion.question}</p>
            </div>

            <div className="opts">
              {(currentQuestion.options || []).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`cell opt${selectedAnswer === option.id ? ' on' : ''}`}
                  onClick={() => setSelectedAnswer(option.id)}
                  disabled={loading}
                >
                  <h2>{option.id.toUpperCase()}</h2>
                  <p>{option.text}</p>
                </button>
              ))}
            </div>

            <div className="actionrow">
              <Button onClick={handleSubmitAnswer} disabled={!selectedAnswer || loading}>
                {loading ? t('v2.quiz.checking', 'Checking…') : t('v2.quiz.submit', 'Submit answer')}
              </Button>
            </div>
          </>
        )}

        {/* FEEDBACK — verdict + explanations + ad slot + continue */}
        {gameState === 'feedback' && feedback && (
          <>
            <div className="verdict" style={{ marginTop: 0 }}>
              <div className="vlabel">{t('v2.quiz.result', 'Result')}</div>
              <div className="vgrid">
                <div className="classif">
                  {feedback.isCorrect ? t('v2.quiz.correct', 'Correct') : t('v2.quiz.wrong', 'Wrong')}
                </div>
                {feedback.isCorrect && feedback.streakBonus && (
                  <span className="hl">{t('v2.quiz.streakBonus', '+1 credit — streak bonus')}</span>
                )}
                {!feedback.isCorrect && (
                  <span className="vsub">
                    {t('v2.quiz.correctWas', 'Correct answer')}: {feedback.correctAnswer?.toUpperCase() ?? '?'}
                    {feedback.correctAnswerText && <> — {feedback.correctAnswerText}</>}
                  </span>
                )}
              </div>
            </div>

            <div className="xplain">
              <div className="vlabel">
                {feedback.isCorrect
                  ? t('v2.quiz.whyCorrect', 'Why this is correct')
                  : t('v2.quiz.whyWrong', 'Why your answer was wrong')}
              </div>
              <p className="prose">{feedback.explanation}</p>
            </div>
            {!feedback.isCorrect && feedback.correctExplanation && (
              <div className="xplain">
                <div className="vlabel">{t('v2.quiz.theCorrectAnswer', 'The correct answer')}</div>
                <p className="prose">{feedback.correctExplanation}</p>
              </div>
            )}

            <div className="state">
              <span>
                {t('v2.quiz.streak', 'Streak')} {session?.streak || 0}
              </span>
              <b>{session?.score || 0}</b>
              <span className="bar">
                <i style={{ width: `${Math.min(100, (questionNumber / 10) * 100)}%` }} />
              </span>
              <span>
                {session?.totalCorrect || 0} / {session?.totalWrong || 0}
              </span>
            </div>

            {/* Ad slot — same mount as the sidebar's feedback state (Addendum 2) */}
            <InlineAdSlot
              key={`quiz-feedback-${session?.questionNumber || 0}`}
              userId={user?.id}
              placement="sidebar"
              layout="card"
              refreshKey={`quiz-q${session?.questionNumber || 0}`}
              className="analysis-ad-slot"
            />

            <div className="actionrow">
              <Button onClick={handleContinue} disabled={loading}>
                {feedback.needsPayment
                  ? t('v2.quiz.continue', 'Continue')
                  : t('v2.quiz.next', 'Next question')}
              </Button>
            </div>
          </>
        )}

        {/* PAUSED — pay 1 credit to continue, or end */}
        {gameState === 'paused' && (
          <>
            <div className="verdict" style={{ marginTop: 0 }}>
              <div className="vlabel">
                {feedback?.isCorrect === false
                  ? t('v2.quiz.wrongAnswerTitle', 'Wrong answer')
                  : t('v2.quiz.completed10Title', 'Great run')}
              </div>
              <div className="vgrid">
                <div className="classif">
                  {feedback?.isCorrect === false
                    ? t('v2.quiz.payToContinueWrong', 'Pay 1 credit to continue your quiz session.')
                    : t('v2.quiz.payToContinue10', 'You completed 10 questions. Pay 1 credit for 10 more.')}
                </div>
              </div>
            </div>

            <div className="state">
              <b>{session?.score || 0}</b>
              <span>
                {t('v2.quiz.bestStreak', 'Best streak')} {session?.maxStreak || 0}
              </span>
              <span className="bar">
                <i style={{ width: '100%' }} />
              </span>
              <span>
                {t('v2.quiz.correct', 'Correct')} {session?.totalCorrect || 0}
              </span>
            </div>

            <div className="actionrow">
              <Button onClick={handlePayToContinue} disabled={loading}>
                {loading
                  ? t('v2.quiz.continuing', 'Continuing…')
                  : t('v2.quiz.payToContinue', 'Continue quiz')}
              </Button>
              <span className="costlab">{credit1}</span>
              <Button variant="secondary" onClick={handleEndQuiz} disabled={loading}>
                {t('v2.quiz.endQuiz', 'End quiz')}
              </Button>
            </div>
          </>
        )}

        {/* ENDED — final results */}
        {gameState === 'ended' && session && (
          <>
            <div className="cell qcell">
              <h2>{t('v2.quiz.quizComplete', 'QUIZ COMPLETE')}</h2>
            </div>
            <div className="endgrid">
              <div className="cell">
                <span className="n hl">{session.score}</span>
                <span className="u">{t('v2.quiz.finalScore', 'Final score')}</span>
              </div>
              <div className="cell">
                <span className="n">{session.maxStreak}</span>
                <span className="u">{t('v2.quiz.bestStreak', 'Best streak')}</span>
              </div>
              <div className="cell">
                <span className="n">{session.totalCorrect}</span>
                <span className="u">{t('v2.quiz.totalCorrect', 'Correct')}</span>
              </div>
              <div className="cell">
                <span className="n">{session.creditsEarned}</span>
                <span className="u">{t('v2.quiz.creditsEarned', 'Credits earned')}</span>
              </div>
            </div>
            <div className="actionrow">
              <Button
                onClick={() => {
                  setGameState('idle');
                  setSession(null);
                  setCurrentQuestion(null);
                  setSelectedAnswer(null);
                  setFeedback(null);
                }}
              >
                {t('v2.quiz.playAgain', 'Play again')}
              </Button>
            </div>
          </>
        )}
      </section>

      <V2ModalsHost />
    </PageShell>
  );
}
