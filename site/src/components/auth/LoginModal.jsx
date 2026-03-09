// LoginModal - Login modal matching exact original design
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, PasswordInput } from '../common';
import { useAuth } from '@/hooks';

export function LoginModal({ isOpen, onClose, onSwitchToSignup, onSwitchToForgotPassword }) {
  const { t } = useTranslation();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { success, error: signInError } = await signIn(email, password);

    if (success) {
      setEmail('');
      setPassword('');
      onClose();
    } else {
      setError(signInError || t('login.errorDefault'));
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    const { success, error: signInError } = await signInWithGoogle();

    if (!success) {
      setError(
        signInError || t('login.googleError', { defaultValue: 'Failed to sign in with Google' })
      );
      setLoading(false);
    }
    // If successful, Google OAuth will redirect - don't reset loading
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      maxWidth="420px"
    >
      <div id="loginError" className={`auth-error ${error ? 'active' : ''}`}>
        {error}
      </div>

      {/* Google Sign-In Button */}
      <button
        type="button"
        className="google-signin-button"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {t('login.googleSignIn', { defaultValue: 'Sign in with Google' })}
      </button>

      <div className="auth-divider">
        <span>{t('login.orDivider', { defaultValue: 'or' })}</span>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="loginEmail">{t('login.email')}</label>
          <input
            type="email"
            id="loginEmail"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="loginPassword">{t('login.password')}</label>
          <PasswordInput
            id="loginPassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <a className="forgot-password-link" onClick={onSwitchToForgotPassword}>
            {t('login.forgotPassword', { defaultValue: 'Forgot password?' })}
          </a>
        </div>

        <button type="submit" className="form-button" id="loginButton" disabled={loading}>
          {loading ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>

      <div className="auth-switch">
        {t('login.noAccount')} <a onClick={onSwitchToSignup}>{t('login.signUpLink')}</a>
      </div>
    </Modal>
  );
}

export default LoginModal;
