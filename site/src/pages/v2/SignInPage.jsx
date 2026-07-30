// SignInPage - v2 /signin (mockup: new_design/philosify-auth.html).
// Preserves the full LoginModal + ForgotPasswordModal behavior as a page:
// email/password sign in, Google OAuth (secondary button), forgot-password
// as a third view, errors in the functional error register (--warn),
// success -> navigate back to location.state?.from or home.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail } from '../../utils/validation.js';
import { AuthShell } from './auth/AuthShell.jsx';

export default function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, resetPassword, isAuthenticated, loading } = useAuth();

  const [view, setView] = useState('signin'); // 'signin' | 'forgot' | 'forgot-sent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const from = location.state?.from || '/';

  // Already signed in — back to where they came from
  useEffect(() => {
    if (!loading && isAuthenticated) navigate(from, { replace: true });
  }, [loading, isAuthenticated, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError(t('v2.auth.errorInvalidEmail', 'Enter a valid email address'));
      return;
    }
    setBusy(true);
    const { success, error: signInError } = await signIn(email, password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError(signInError || t('v2.auth.signInErrorDefault', 'Failed to sign in. Please try again.'));
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    const { success, error: googleError } = await signInWithGoogle();
    if (!success) {
      setError(googleError || t('v2.auth.googleError', 'Failed to sign in with Google'));
      setBusy(false);
    }
    // On success Google OAuth redirects — keep busy state
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError(t('v2.auth.errorInvalidEmail', 'Enter a valid email address'));
      return;
    }
    setBusy(true);
    const { success, error: resetError } = await resetPassword(email);
    if (success) {
      setView('forgot-sent');
    } else {
      setError(resetError || t('v2.auth.resetErrorDefault', 'Failed to send reset email'));
    }
    setBusy(false);
  };

  const switchView = (next) => {
    setError('');
    setView(next);
  };

  return (
    <AuthShell>
      {view === 'signin' && (
        <>
          <div className="authcard">
            <form onSubmit={handleSubmit} noValidate>
              <label className="f" htmlFor="signinEmail">
                {t('v2.auth.email', 'Email')}
              </label>
              <input
                className="f"
                id="signinEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label className="f" htmlFor="signinPassword">
                {t('v2.auth.password', 'Password')}
              </label>
              <input
                className="f"
                id="signinPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {error && (
                <div className="aerr" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" className="btnp" disabled={busy}>
                {busy ? t('v2.auth.signingIn', 'Signing in…') : t('v2.auth.signIn', 'Sign in')}
              </button>
            </form>
            <div className="oauth">
              <button type="button" className="btns" onClick={handleGoogle} disabled={busy}>
                {t('v2.auth.google', 'Google')}
              </button>
            </div>
          </div>
          <div className="aalt">
            {t('v2.auth.noAccount', 'No account?')}{' '}
            <Link to="/signup" state={location.state}>
              {t('v2.auth.createOne', 'Create one')}
            </Link>{' '}
            ·{' '}
            <a
              href="#reset"
              onClick={(e) => {
                e.preventDefault();
                switchView('forgot');
              }}
            >
              {t('v2.auth.resetPassword', 'Reset password')}
            </a>
          </div>
        </>
      )}

      {view === 'forgot' && (
        <>
          <div className="authcard">
            <form onSubmit={handleReset} noValidate>
              <label className="f" htmlFor="forgotEmail">
                {t('v2.auth.email', 'Email')}
              </label>
              <input
                className="f"
                id="forgotEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {error && (
                <div className="aerr" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" className="btnp" disabled={busy}>
                {busy
                  ? t('v2.auth.sending', 'Sending…')
                  : t('v2.auth.sendResetLink', 'Send reset link')}
              </button>
            </form>
          </div>
          <div className="aalt">
            {t('v2.auth.rememberPassword', 'Remember your password?')}{' '}
            <a
              href="#signin"
              onClick={(e) => {
                e.preventDefault();
                switchView('signin');
              }}
            >
              {t('v2.auth.signIn', 'Sign in')}
            </a>
          </div>
        </>
      )}

      {view === 'forgot-sent' && (
        <>
          <div className="authcard">
            <div className="amsg" role="status">
              {t('v2.auth.resetSent', 'Check your email for a password reset link.')}
            </div>
            <button type="button" className="btnp" onClick={() => switchView('signin')}>
              {t('v2.auth.done', 'Done')}
            </button>
          </div>
          <div className="aalt">
            {t('v2.auth.rememberPassword', 'Remember your password?')}{' '}
            <a
              href="#signin"
              onClick={(e) => {
                e.preventDefault();
                switchView('signin');
              }}
            >
              {t('v2.auth.signIn', 'Sign in')}
            </a>
          </div>
        </>
      )}
    </AuthShell>
  );
}
