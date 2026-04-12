import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const LOGO = '/logo.png';

function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || t('auth.signInFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={LOGO} alt="Philosify" className="auth-card__logo" />
        <p className="eyebrow">{t('auth.loginTitle')}</p>
        <h1>{t('auth.loginSubtitle')}</h1>

        <form className="stack" onSubmit={handleSubmit}>
          {error ? <div className="alert alert--error">{error}</div> : null}

          <div className="field">
            <label htmlFor="email">{t('common.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>

          <div className="field field--password">
            <label htmlFor="password">{t('common.password')}</label>
            <div className="field__password-row">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t('auth.enterPassword')}
                required
              />
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? t('common.hide') : t('common.show')}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--large" disabled={loading}>
            {loading ? t('auth.signingIn') : t('common.signIn')}
          </button>
        </form>

        <p className="auth-card__footer">
          <Link to="/signup">{t('auth.noAccount')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
