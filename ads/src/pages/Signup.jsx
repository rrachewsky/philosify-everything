import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const LOGO = '/logo.png';

function Signup() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company_name: '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setLoading(true);

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name,
        website: formData.website,
      });
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <img src={LOGO} alt="Philosify" className="auth-card__logo" />
        <p className="eyebrow">{t('auth.signupTitle')}</p>
        <h1>{t('auth.signupSubtitle')}</h1>

        <form className="stack" onSubmit={handleSubmit}>
          {error ? <div className="alert alert--error">{error}</div> : null}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="signup-email">{t('common.email')}</label>
              <input
                id="signup-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="signup-company">{t('auth.companyName')}</label>
              <input
                id="signup-company"
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Studio name"
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="signup-website">{t('common.website')}</label>
            <input
              id="signup-website"
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          <div className="field-grid">
            <div className="field field--password">
              <label htmlFor="signup-password">{t('common.password')}</label>
              <div className="field__password-row">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  required
                />
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="field field--password">
              <label htmlFor="signup-confirm">{t('settings.confirmPassword')}</label>
              <div className="field__password-row">
                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                />
                <button
                  type="button"
                  className="field__toggle"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--large" disabled={loading}>
            {loading ? t('auth.creatingAccount') : t('common.signUp')}
          </button>
        </form>

        <p className="helper-text">
          {t('auth.agreePolicy')}{' '}
          <Link to="/policy">{t('policy.title')}</Link>
        </p>

        <p className="auth-card__footer">
          <Link to="/login">{t('auth.alreadyHaveAccount')}</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
