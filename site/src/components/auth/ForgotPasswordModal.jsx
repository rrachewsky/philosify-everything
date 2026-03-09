// ForgotPasswordModal - Request password reset email
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common';
import { useAuth } from '@/hooks';

export function ForgotPasswordModal({ isOpen, onClose, onSwitchToLogin }) {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { success, error: resetError } = await resetPassword(email);

    if (success) {
      setSubmitted(true);
    } else {
      setError(
        resetError ||
          t('forgotPassword.errorDefault', { defaultValue: 'Failed to send reset email' })
      );
    }
    setLoading(false);
  };

  const handleClose = () => {
    // Reset state when closing
    setEmail('');
    setError('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('forgotPassword.title', { defaultValue: 'Reset Password' })}
      subtitle={
        submitted
          ? ''
          : t('forgotPassword.subtitle', {
              defaultValue: 'Enter your email to receive a reset link',
            })
      }
      maxWidth="420px"
    >
      {submitted ? (
        <div className="reset-success-content">
          <p className="text-white-90 mb-6 text-center leading-normal">
            {t('forgotPassword.checkEmail', {
              defaultValue: 'Check your email for a password reset link.',
            })}
          </p>
          <button type="button" className="form-button w-full" onClick={handleClose}>
            {t('forgotPassword.done', { defaultValue: 'Done' })}
          </button>
        </div>
      ) : (
        <>
          <div id="forgotError" className={`auth-error ${error ? 'active' : ''}`}>
            {error}
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="forgotEmail">
                {t('forgotPassword.email', { defaultValue: 'Email' })}
              </label>
              <input
                type="email"
                id="forgotEmail"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="form-button w-full" disabled={loading}>
              {loading
                ? t('forgotPassword.sending', { defaultValue: 'Sending...' })
                : t('forgotPassword.sendLink', { defaultValue: 'Send Reset Link' })}
            </button>
          </form>

          <div className="auth-switch">
            {t('forgotPassword.rememberPassword', { defaultValue: 'Remember your password?' })}{' '}
            <a onClick={onSwitchToLogin}>
              {t('forgotPassword.signIn', { defaultValue: 'Sign In' })}
            </a>
          </div>
        </>
      )}
    </Modal>
  );
}

export default ForgotPasswordModal;
