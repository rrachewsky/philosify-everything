// SignupModal - Signup modal matching exact original design
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, PasswordInput } from '../common';
import { useAuth } from '@/hooks';

export function SignupModal({ isOpen, onClose, onSwitchToLogin }) {
  const { t } = useTranslation();
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!fullName.trim()) {
      setError(t('signup.errorNameRequired', { defaultValue: 'Full name is required' }));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t('signup.errorPasswordMismatch'));
      setLoading(false);
      return;
    }

    const { success, error: signUpError } = await signUp(email, password, fullName.trim());

    if (success) {
      setEmailSent(true);
    } else {
      setError(signUpError || t('signup.errorDefault'));
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    const { success, error: signUpError } = await signInWithGoogle();

    if (!success) {
      setError(
        signUpError || t('signup.googleError', { defaultValue: 'Failed to sign up with Google' })
      );
      setLoading(false);
    }
    // If successful, Google OAuth will redirect - don't reset loading
  };

  const handleCloseAfterSuccess = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setEmailSent(false);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={emailSent ? handleCloseAfterSuccess : onClose}
      title={emailSent ? t('signup.emailSentTitle') : t('signup.title')}
      subtitle={emailSent ? undefined : t('signup.subtitle')}
      maxWidth="420px"
    >
      {emailSent ? (
        <div className="auth-email-sent">
          <div className="auth-email-sent__icon-container">
            <div className="auth-email-sent__icon-glow" />
            <svg
              className="auth-email-sent__icon"
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13L2 4" />
            </svg>
            <svg
              className="auth-email-sent__check"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="auth-email-sent__message">{t('signup.emailSentMessage')}</p>
          <div className="auth-email-sent__email-container">
            <span className="auth-email-sent__email-label">
              {t('signup.emailSentTo', { defaultValue: 'Sent to' })}
            </span>
            <p className="auth-email-sent__email">{email}</p>
          </div>
          <p className="auth-email-sent__hint">{t('signup.emailSentHint')}</p>
          <button className="form-button" onClick={handleCloseAfterSuccess}>
            {t('signup.emailSentClose')}
          </button>
        </div>
      ) : (
        <>
          <div id="signupError" className={`auth-error ${error ? 'active' : ''}`}>
            {error}
          </div>

          {/* Google Sign-Up Button */}
          <button
            type="button"
            className="google-signin-button"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            {t('signup.googleSignUp', { defaultValue: 'Sign up with Google' })}
          </button>

          <div className="auth-divider">
            <span>{t('signup.orDivider', { defaultValue: 'or' })}</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="signupFullName">
                {t('signup.fullName', { defaultValue: 'Full Name' })}
              </label>
              <input
                type="text"
                id="signupFullName"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                placeholder={t('signup.fullNamePlaceholder', { defaultValue: 'Your full name' })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signupEmail">{t('signup.email')}</label>
              <input
                type="email"
                id="signupEmail"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signupPassword">{t('signup.password')}</label>
              <PasswordInput
                id="signupPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="signupConfirmPassword">{t('signup.confirmPassword')}</label>
              <PasswordInput
                id="signupConfirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="form-button" id="signupButton" disabled={loading}>
              {loading ? t('signup.creatingAccount') : t('signup.createAccount')}
            </button>
          </form>

          <div className="auth-switch">
            {t('signup.hasAccount')} <a onClick={onSwitchToLogin}>{t('signup.signInLink')}</a>
          </div>

          <p className="auth-disclaimer">
            {t('signup.disclaimer', { defaultValue: 'By signing up, you agree to our' })}{' '}
            <a href="/tos" target="_blank" rel="noopener noreferrer">
              {t('signup.termsLink', { defaultValue: 'Terms of Service' })}
            </a>{' '}
            {t('signup.and', { defaultValue: 'and' })}{' '}
            <a href="/pp" target="_blank" rel="noopener noreferrer">
              {t('signup.privacyLink', { defaultValue: 'Privacy Policy' })}
            </a>
            .
          </p>
        </>
      )}
    </Modal>
  );
}

export default SignupModal;
