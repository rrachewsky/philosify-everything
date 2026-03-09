// ResetPasswordPage - Set new password after clicking email link
// Styled to match LoginModal, SignupModal, and ForgotPasswordModal
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { PasswordInput } from '@/components/common';
import { isValidPassword } from '@utils/validation.js';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    // Supabase automatically handles the token from URL hash
    // The session should be set by Supabase after redirect
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch', { defaultValue: 'Passwords do not match' }));
      return;
    }

    // Validate password strength (must match backend: 8+ chars, uppercase, number)
    if (!isValidPassword(password)) {
      setError(
        t('resetPassword.passwordTooShort', {
          defaultValue:
            'Password must be at least 8 characters with one uppercase letter and one number',
        })
      );
      return;
    }

    const { success: updateSuccess, error: updateError } = await updatePassword(password);

    if (updateSuccess) {
      setSuccess(true);
      // Redirect to home after 2 seconds
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(
        updateError ||
          t('resetPassword.errorDefault', { defaultValue: 'Failed to update password' })
      );
    }
  };

  return (
    <div className="auth-overlay active">
      <div className="auth-modal max-w-sm">
        <button className="close-modal" onClick={() => navigate('/')} aria-label="Close">
          &times;
        </button>

        <h2>{t('resetPassword.title', { defaultValue: 'Set New Password' })}</h2>

        {success ? (
          <div className="reset-success-content">
            <p
              style={{
                color: '#4ade80',
                marginBottom: '24px',
                textAlign: 'center',
                lineHeight: '1.5',
              }}
            >
              {t('resetPassword.success', {
                defaultValue: 'Password updated successfully! Redirecting...',
              })}
            </p>
            <button type="button" className="form-button w-full" onClick={() => navigate('/')}>
              {t('resetPassword.goHome', { defaultValue: 'Go to Home' })}
            </button>
          </div>
        ) : (
          <>
            <p>{t('resetPassword.subtitle', { defaultValue: 'Enter your new password below.' })}</p>

            <div className={`auth-error ${error ? 'active' : ''}`}>{error}</div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="resetPassword">
                  {t('resetPassword.newPassword', { defaultValue: 'New Password' })}
                </label>
                <PasswordInput
                  id="resetPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('resetPassword.enterPassword', {
                    defaultValue: 'Enter new password',
                  })}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="resetConfirmPassword">
                  {t('resetPassword.confirmPassword', { defaultValue: 'Confirm Password' })}
                </label>
                <PasswordInput
                  id="resetConfirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('resetPassword.confirmPlaceholder', {
                    defaultValue: 'Confirm new password',
                  })}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="form-button w-full" disabled={loading}>
                {loading
                  ? t('resetPassword.updating', { defaultValue: 'Updating...' })
                  : t('resetPassword.updateButton', { defaultValue: 'Update Password' })}
              </button>
            </form>

            <div className="auth-switch">
              <Link to="/" style={{ color: '#e2007a', textDecoration: 'none' }}>
                {t('resetPassword.backHome', { defaultValue: 'Back to Home' })}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
