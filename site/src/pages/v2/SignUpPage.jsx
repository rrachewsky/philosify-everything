// SignUpPage - v2 /signup (mockup: new_design/philosify-auth.html anatomy).
// Preserves the full SignupModal behavior as a page: full name + email +
// password + confirm, client validation (utils/validation to match the
// backend), Google OAuth (secondary button), email-confirmation sent view,
// ToS/PP disclaimer. signUp() captures the current UI language internally
// (useAuth) for localized auth emails.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail, isValidPassword, doPasswordsMatch } from '../../utils/validation.js';
import { AuthShell } from './auth/AuthShell.jsx';

export default function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle, isAuthenticated, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const from = location.state?.from || '/';

  // Already signed in — back to where they came from (unless we are
  // showing the confirmation-sent view after a successful signup)
  useEffect(() => {
    if (!loading && isAuthenticated && !emailSent) navigate(from, { replace: true });
  }, [loading, isAuthenticated, emailSent, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation (mirrors the backend rules in api/src/auth/proxy.js)
    if (!fullName.trim()) {
      setError(t('v2.auth.errorNameRequired', 'Full name is required'));
      return;
    }
    if (!isValidEmail(email)) {
      setError(t('v2.auth.errorInvalidEmail', 'Enter a valid email address'));
      return;
    }
    if (!isValidPassword(password)) {
      setError(
        t(
          'v2.auth.errorWeakPassword',
          'Password must be at least 8 characters with one uppercase letter and one number'
        )
      );
      return;
    }
    if (!doPasswordsMatch(password, confirmPassword)) {
      setError(t('v2.auth.errorPasswordMismatch', 'Passwords do not match'));
      return;
    }

    setBusy(true);
    const { success, error: signUpError } = await signUp(email, password, fullName.trim());
    if (success) {
      setEmailSent(true);
    } else {
      setError(
        signUpError || t('v2.auth.signUpErrorDefault', 'Failed to create account. Please try again.')
      );
    }
    setBusy(false);
  };

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    const { success, error: googleError } = await signInWithGoogle();
    if (!success) {
      setError(googleError || t('v2.auth.googleSignUpError', 'Failed to sign up with Google'));
      setBusy(false);
    }
    // On success Google OAuth redirects — keep busy state
  };

  return (
    <AuthShell>
      {emailSent ? (
        <div className="authcard">
          <div className="amsg" role="status">
            {t(
              'v2.auth.emailSentMessage',
              'We sent a confirmation link to your email. Click the link to activate your account.'
            )}
          </div>
          <div className="amsg">
            {t('v2.auth.emailSentTo', 'Sent to')} <span className="hl">{email}</span>
          </div>
          <div className="amsg">
            {t(
              'v2.auth.emailSentHint',
              "Check your spam folder if you don't see it within a few minutes."
            )}
          </div>
          <button type="button" className="btnp" onClick={() => navigate('/')}>
            {t('v2.auth.emailSentClose', 'Got it')}
          </button>
        </div>
      ) : (
        <>
          <div className="authcard">
            <form onSubmit={handleSubmit} noValidate>
              <label className="f" htmlFor="signupFullName">
                {t('v2.auth.fullName', 'Full name')}
              </label>
              <input
                className="f"
                id="signupFullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
              <label className="f" htmlFor="signupEmail">
                {t('v2.auth.email', 'Email')}
              </label>
              <input
                className="f"
                id="signupEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label className="f" htmlFor="signupPassword">
                {t('v2.auth.password', 'Password')}
              </label>
              <input
                className="f"
                id="signupPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <label className="f" htmlFor="signupConfirmPassword">
                {t('v2.auth.confirmPassword', 'Confirm password')}
              </label>
              <input
                className="f"
                id="signupConfirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {error && (
                <div className="aerr" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" className="btnp" disabled={busy}>
                {busy
                  ? t('v2.auth.creatingAccount', 'Creating account…')
                  : t('v2.auth.createAccount', 'Create account')}
              </button>
            </form>
            <div className="oauth">
              <button type="button" className="btns" onClick={handleGoogle} disabled={busy}>
                {t('v2.auth.google', 'Google')}
              </button>
            </div>
          </div>
          <div className="aalt">
            {t('v2.auth.haveAccount', 'Already have an account?')}{' '}
            <Link to="/signin" state={location.state}>
              {t('v2.auth.signIn', 'Sign in')}
            </Link>
          </div>
          <div className="aalt adisc">
            {t('v2.auth.disclaimer', 'By signing up, you agree to our')}{' '}
            <a href="/tos" target="_blank" rel="noopener noreferrer">
              {t('v2.auth.termsLink', 'Terms of Service')}
            </a>{' '}
            {t('v2.auth.and', 'and')}{' '}
            <a href="/pp" target="_blank" rel="noopener noreferrer">
              {t('v2.auth.privacyLink', 'Privacy Policy')}
            </a>
            .
          </div>
        </>
      )}
    </AuthShell>
  );
}
