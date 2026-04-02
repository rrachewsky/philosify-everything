// QuizSidebar - Slide-out Sidebar for Philosophical Quiz
// Follows same pattern as CinemaSidebar/LiteratureSidebar

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginModal, SignupModal, ForgotPasswordModal, PaymentModal } from '../index';
import { useModal } from '../../hooks';
import { config } from '@/config';
import '../../styles/music-sidebar.css';
import '../TopTenTicker.css';

// ============================================================
// QUIZ API FUNCTIONS
// ============================================================
async function startQuiz(lang) {
  const response = await fetch(`${config.apiUrl}/api/quiz/start`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Failed to start quiz');
    error.code = data.code;
    throw error;
  }
  return data;
}

async function submitAnswer(sessionId, questionId, answer, lang) {
  const response = await fetch(`${config.apiUrl}/api/quiz/answer`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, questionId, answer, lang }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Failed to submit answer');
    error.code = data.code;
    throw error;
  }
  return data;
}

async function continueQuiz(sessionId, lang) {
  const response = await fetch(`${config.apiUrl}/api/quiz/continue`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, lang }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'Failed to continue quiz');
    error.code = data.code;
    throw error;
  }
  return data;
}

async function fetchLeaderboard() {
  const response = await fetch(`${config.apiUrl}/api/quiz/leaderboard`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch leaderboard');
  }
  return data;
}

async function resumeQuiz(lang) {
  const response = await fetch(`${config.apiUrl}/api/quiz/resume?lang=${lang}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to resume quiz');
  }
  return data;
}

async function endQuiz(sessionId) {
  const response = await fetch(`${config.apiUrl}/api/quiz/end`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to end quiz');
  }
  return data;
}

// ============================================================
// LEADERBOARD TICKER
// ============================================================
function LeaderboardTicker({ onRefresh }) {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchLeaderboard();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, 60 * 1000); // Refresh every minute
    return () => clearInterval(interval);
  }, [onRefresh]);

  if (loading || leaderboard.length === 0) return null;

  const duplicated = [...leaderboard, ...leaderboard, ...leaderboard];
  const count = leaderboard.length;
  const animationDuration = count * 6;

  const handleMouseDown = (e) => {
    if (!trackRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - trackRef.current.offsetLeft);
    setScrollLeftState(trackRef.current.scrollLeft);
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeftState - (x - startX) * 2;
  };

  return (
    <div className="top-ten-ticker" style={{ direction: 'ltr', position: 'relative', borderRadius: '6px' }}>
      <div className="ticker-label">
        <span className="ticker-icon">🏆</span>
        <span>{t('quiz.leaderboard', 'TOP SCORES')}</span>
      </div>
      <div
        className="ticker-track"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div
          className={`ticker-content ${isDragging ? 'paused' : ''}`}
          style={{ animationDuration: `${animationDuration}s` }}
        >
          {duplicated.map((entry, i) => {
            const rank = (i % count) + 1;
            return (
              <div
                key={`${entry.rank}-${i}`}
                className="ticker-item"
                style={{ direction: 'ltr', cursor: 'default' }}
              >
                <span className="ticker-rank">#{rank}</span>
                <span className="ticker-song">{entry.score} pts</span>
                <span className="ticker-separator">·</span>
                <span className="ticker-artist">{entry.max_streak} streak</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN QUIZ SIDEBAR COMPONENT
// ============================================================
export function QuizSidebar({
  isOpen,
  onClose,
  user,
}) {
  const { t, i18n } = useTranslation();
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);

  // Quiz state
  const [gameState, setGameState] = useState('idle'); // idle, playing, feedback, paused, ended
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [sessionWarning, setSessionWarning] = useState(false);
  const sessionTimerRef = useRef(null);

  // Modals
  const loginModal = useModal();
  const signupModal = useModal();
  const forgotPasswordModal = useModal();
  const paymentModal = useModal();

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0', 10) * -1);
    };
  }, [isOpen]);

  // Check for active session when sidebar opens or user logs back in
  useEffect(() => {
    if (!isOpen || !user) return;

    const checkResume = async () => {
      try {
        const data = await resumeQuiz(i18n.language);
        if (data.hasSession && data.session) {
          setSession(data.session);
          if (data.session.status === 'active' && data.question) {
            setCurrentQuestion(data.question);
            setGameState('playing');
            setError(null);
          } else if (data.session.status === 'failed') {
            // Session failed (wrong answer) - show payment prompt
            setGameState('paused');
          }
        }
      } catch (e) {
        // No session to resume, stay on idle
      }
    };

    // Only auto-resume if we're in idle or had a session expire
    if (gameState === 'idle' || error) {
      checkResume();
    }
  }, [isOpen, user]);

  // Session expiry warning — warn 2 minutes before typical JWT expiry (~55 min)
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'feedback') {
      setSessionWarning(false);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      return;
    }

    // Warn after 50 minutes of playing (JWT typically expires at 60 min)
    sessionTimerRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, 50 * 60 * 1000);

    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    };
  }, [gameState]);

  // Reset state when sidebar closes — but preserve session ID for resume
  useEffect(() => {
    if (!isOpen) {
      setGameState('idle');
      setSession(null);
      setCurrentQuestion(null);
      setSelectedAnswer(null);
      setFeedback(null);
      setError(null);
      setSessionWarning(false);
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    }
  }, [isOpen]);

  // Start quiz - don't pre-check balance, let API handle insufficient credits
  const handleStartQuiz = async () => {
    if (!user) {
      signupModal.open();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await startQuiz(i18n.language);
      setSession(data.session);
      setCurrentQuestion(data.question);
      setGameState('playing');
      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        paymentModal.open();
      } else if (err.message === 'Unauthorized') {
        setError(t('quiz.sessionExpired', 'Session expired. Please log in again.'));
        loginModal.open();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
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
      if (err.message === 'Unauthorized') {
        // Session expired — try refreshing auth by calling /auth/session
        try {
          const refreshResp = await fetch(`${config.apiUrl}/auth/session`, { credentials: 'include' });
          if (refreshResp.ok) {
            // Auth refreshed — retry the answer
            setError(t('quiz.sessionRefreshed', 'Session refreshed. Please submit your answer again.'));
          } else {
            setError(t('quiz.sessionExpired', 'Session expired. Please log in again.'));
            loginModal.open();
          }
        } catch (e) {
          setError(t('quiz.sessionExpired', 'Session expired. Please log in again.'));
          loginModal.open();
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Continue after feedback
  const handleContinue = async () => {
    setSelectedAnswer(null);
    setFeedback(null);

    // Check if needs payment (wrong answer or completed 10 questions)
    if (feedback?.needsPayment) {
      setGameState('paused');
      return;
    }

    // Get next question
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/quiz/question?sessionId=${session.id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCurrentQuestion(data.question);
      setGameState('playing');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pay to continue - let API handle insufficient credits
  const handlePayToContinue = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await continueQuiz(session.id, i18n.language);
      setSession(data.session);
      setCurrentQuestion(data.question);
      setSelectedAnswer(null);
      setFeedback(null);
      setGameState('playing');
      window.dispatchEvent(new CustomEvent('credits-changed'));
    } catch (err) {
      if (err.code === 'INSUFFICIENT_CREDITS') {
        paymentModal.open();
      } else if (err.message === 'Unauthorized') {
        setError(t('quiz.sessionExpired', 'Session expired. Please log in again.'));
        loginModal.open();
      } else {
        setError(err.message);
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
      const data = await endQuiz(session.id);
      setSession(data.session);
      setGameState('ended');
      setLeaderboardRefresh(prev => prev + 1);
    } catch (err) {
      // If already ended, just go to idle
      setGameState('idle');
    } finally {
      setLoading(false);
    }
  };

  // Get category emoji
  const getCategoryEmoji = (category) => {
    const emojis = {
      metaphysics: '🌌',
      epistemology: '🧠',
      ethics: '⚖️',
      politics: '🏛️',
      aesthetics: '🎨',
      applied: '🔬',
      history: '📜',
      american_exceptionalism: '🗽',
      virtues: '💎',
      economics: '📈',
      law: '⚖️',
      music: '🎵',
      cinema: '🎬',
      quotes: '💬',
    };
    return emojis[category] || '❓';
  };

  // Get difficulty stars
  const getDifficultyStars = (difficulty) => {
    const filled = Math.min(difficulty, 10);
    return '★'.repeat(filled) + '☆'.repeat(10 - filled);
  };

  return (
    <>
      <div className={`music-backdrop ${isOpen ? 'music-backdrop--open' : ''}`} />
      <div
        ref={sidebarRef}
        className={`music-sidebar ${isOpen ? 'music-sidebar--open' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="music-sidebar__header">
          <span className="music-sidebar__title">
            <span className="music-sidebar__icon">🧠</span>
            {t('quiz.title', 'Quiz')}
          </span>
          <button className="music-sidebar__close" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Leaderboard Ticker */}
        {gameState === 'idle' && (
          <div className="music-sidebar__ticker">
            <LeaderboardTicker onRefresh={leaderboardRefresh} />
          </div>
        )}

        <div ref={contentRef} className="music-sidebar__content">
          {error && (
            <div className="music-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {/* IDLE STATE - Start screen */}
          {gameState === 'idle' && (
            <div className="quiz-start">
              <div className="quiz-start__intro">
                <h3>{t('quiz.welcome', 'Test Your Philosophy')}</h3>
                <p>{t('quiz.description', 'Answer questions about metaphysics, epistemology, ethics, politics, and more. Questions get harder as you progress!')}</p>
                
                <div className="quiz-start__rules">
                  <div className="quiz-start__rule">
                    <span>📝</span>
                    <span>{t('quiz.rule1', '10 questions per credit')}</span>
                  </div>
                  <div className="quiz-start__rule">
                    <span>⚡</span>
                    <span>{t('quiz.rule2', 'Questions get harder with each correct answer')}</span>
                  </div>
                  <div className="quiz-start__rule">
                    <span>❌</span>
                    <span>{t('quiz.rule3', 'Wrong answer? Pay 1 credit to continue')}</span>
                  </div>
                  <div className="quiz-start__rule">
                    <span>🔥</span>
                    <span>{t('quiz.rule4', '10 correct in a row = 1 credit back!')}</span>
                  </div>
                </div>
              </div>

              <button
                className="music-analyze__button"
                onClick={handleStartQuiz}
                disabled={loading}
              >
                {loading ? t('quiz.starting', 'Starting...') : t('quiz.start', 'Start Quiz')}
                <span className="music-analyze__cost">1 {t('philosopherPanel.credit', 'credit')}</span>
              </button>
            </div>
          )}

          {/* PLAYING STATE - Question display */}
          {gameState === 'playing' && currentQuestion && (
            <div className="quiz-question">
              {/* Session expiry warning */}
              {sessionWarning && (
                <div className="music-error" style={{ marginBottom: '0.75rem', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)', color: '#EAB308' }}>
                  {t('quiz.sessionExpiring', 'Your session is expiring soon. Submit your answer quickly!')}
                </div>
              )}
              {/* Progress bar */}
              <div className="quiz-progress">
                <div className="quiz-progress__stats">
                  <span>Q{session?.questionNumber || 1}/10</span>
                  <span>🔥 {session?.streak || 0}</span>
                  <span>⭐ {session?.score || 0}</span>
                </div>
                <div className="quiz-progress__difficulty">
                  {getCategoryEmoji(currentQuestion.category)} {t(`quiz.categories.${currentQuestion.category}`, currentQuestion.category)}
                  <span className="quiz-progress__stars">{getDifficultyStars(currentQuestion.difficulty)}</span>
                </div>
              </div>

              {/* Question */}
              <div className="quiz-question__text">
                {currentQuestion.question}
              </div>

              {/* Options */}
              <div className="quiz-question__options">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    className={`quiz-option ${selectedAnswer === option.id ? 'quiz-option--selected' : ''}`}
                    onClick={() => setSelectedAnswer(option.id)}
                    disabled={loading}
                  >
                    <span className="quiz-option__letter">{option.id.toUpperCase()}</span>
                    <span className="quiz-option__text">{option.text}</span>
                  </button>
                ))}
              </div>

              {/* Submit button */}
              <button
                className="music-analyze__button"
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || loading}
              >
                {loading ? t('quiz.checking', 'Checking...') : t('quiz.submit', 'Submit Answer')}
              </button>
            </div>
          )}

          {/* FEEDBACK STATE - Answer feedback */}
          {gameState === 'feedback' && feedback && (
            <div className="quiz-feedback">
              <div className={`quiz-feedback__result ${feedback.isCorrect ? 'quiz-feedback__result--correct' : 'quiz-feedback__result--wrong'}`}>
                {feedback.isCorrect ? (
                  <>
                    <span className="quiz-feedback__icon">✓</span>
                    <span>{t('quiz.correct', 'Correct!')}</span>
                    {feedback.streakBonus && (
                      <span className="quiz-feedback__bonus">🎉 +1 credit (streak bonus!)</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="quiz-feedback__icon">✗</span>
                    <span>{t('quiz.wrong', 'Wrong!')}</span>
                    <span className="quiz-feedback__correct">
                      {t('quiz.correctWas', 'Correct answer:')} {feedback.correctAnswer.toUpperCase()}
                    </span>
                  </>
                )}
              </div>

              <div className="quiz-feedback__explanation">
                <h4>{t('quiz.explanation', 'Explanation')}</h4>
                <p>{feedback.explanation}</p>
              </div>

              <div className="quiz-feedback__stats">
                <span>🔥 {t('quiz.streak', 'Streak')}: {session?.streak || 0}</span>
                <span>⭐ {t('quiz.score', 'Score')}: {session?.score || 0}</span>
                <span>✓ {session?.totalCorrect || 0} / ✗ {session?.totalWrong || 0}</span>
              </div>

              <button
                className="music-analyze__button"
                onClick={handleContinue}
                disabled={loading}
              >
                {feedback.needsPayment 
                  ? t('quiz.continue', 'Continue') 
                  : t('quiz.next', 'Next Question')}
              </button>
            </div>
          )}

          {/* PAUSED STATE - Need to pay to continue */}
          {gameState === 'paused' && (
            <div className="quiz-paused">
              <div className="quiz-paused__message">
                {feedback?.isCorrect === false ? (
                  <>
                    <span className="quiz-paused__icon">💔</span>
                    <h3>{t('quiz.wrongAnswer', 'Wrong Answer!')}</h3>
                    <p>{t('quiz.payToContinueWrong', 'Pay 1 credit to continue your quiz session.')}</p>
                  </>
                ) : (
                  <>
                    <span className="quiz-paused__icon">🎯</span>
                    <h3>{t('quiz.completed10', 'Great job!')}</h3>
                    <p>{t('quiz.payToContinue10', 'You completed 10 questions! Pay 1 credit for 10 more.')}</p>
                  </>
                )}
              </div>

              <div className="quiz-paused__stats">
                <div><strong>{t('quiz.score', 'Score')}:</strong> {session?.score || 0}</div>
                <div><strong>{t('quiz.bestStreak', 'Best Streak')}:</strong> {session?.maxStreak || 0}</div>
                <div><strong>{t('quiz.correct', 'Correct')}:</strong> {session?.totalCorrect || 0}</div>
              </div>

              <div className="music-analyze__buttons-row">
                <button
                  className="music-analyze__button"
                  onClick={handlePayToContinue}
                  disabled={loading}
                >
                  {loading ? t('quiz.continuing', 'Continuing...') : t('quiz.payToContinue', 'Continue Quiz')}
                  <span className="music-analyze__cost">1 {t('philosopherPanel.credit', 'credit')}</span>
                </button>
                <button
                  className="music-analyze__button music-analyze__button--another"
                  onClick={handleEndQuiz}
                  disabled={loading}
                >
                  {t('quiz.endQuiz', 'End Quiz')}
                </button>
              </div>
            </div>
          )}

          {/* ENDED STATE - Final results */}
          {gameState === 'ended' && session && (
            <div className="quiz-ended">
              <div className="quiz-ended__header">
                <span className="quiz-ended__icon">🏆</span>
                <h3>{t('quiz.quizComplete', 'Quiz Complete!')}</h3>
              </div>

              <div className="quiz-ended__stats">
                <div className="quiz-ended__stat quiz-ended__stat--score">
                  <span className="quiz-ended__stat-value">{session.score}</span>
                  <span className="quiz-ended__stat-label">{t('quiz.finalScore', 'Final Score')}</span>
                </div>
                <div className="quiz-ended__stat">
                  <span className="quiz-ended__stat-value">{session.maxStreak}</span>
                  <span className="quiz-ended__stat-label">{t('quiz.bestStreak', 'Best Streak')}</span>
                </div>
                <div className="quiz-ended__stat">
                  <span className="quiz-ended__stat-value">{session.totalCorrect}</span>
                  <span className="quiz-ended__stat-label">{t('quiz.totalCorrect', 'Correct')}</span>
                </div>
                <div className="quiz-ended__stat">
                  <span className="quiz-ended__stat-value">{session.creditsEarned}</span>
                  <span className="quiz-ended__stat-label">{t('quiz.creditsEarned', 'Credits Earned')}</span>
                </div>
              </div>

              <button
                className="music-analyze__button"
                onClick={() => setGameState('idle')}
              >
                {t('quiz.playAgain', 'Play Again')}
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        {(loginModal.isOpen || signupModal.isOpen || forgotPasswordModal.isOpen || paymentModal.isOpen) && (
          <div className="music-sidebar__modals">
            {loginModal.isOpen && (
              <LoginModal
                isOpen={true}
                onClose={loginModal.close}
                onSwitchToSignup={() => { loginModal.close(); signupModal.open(); }}
                onSwitchToForgot={() => { loginModal.close(); forgotPasswordModal.open(); }}
              />
            )}
            {signupModal.isOpen && (
              <SignupModal
                isOpen={true}
                onClose={signupModal.close}
                onSwitchToLogin={() => { signupModal.close(); loginModal.open(); }}
              />
            )}
            {forgotPasswordModal.isOpen && (
              <ForgotPasswordModal
                isOpen={true}
                onClose={forgotPasswordModal.close}
                onSwitchToLogin={() => { forgotPasswordModal.close(); loginModal.open(); }}
              />
            )}
            {paymentModal.isOpen && <PaymentModal isOpen={true} onClose={paymentModal.close} />}
          </div>
        )}
      </div>
    </>
  );
}

export default QuizSidebar;
