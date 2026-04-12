import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAgency } from '@contexts/AgencyContext';


export default function AgencyLogin() {
  const { t } = useTranslation();
  const { login } = useAgency();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/agency');
    } catch (err) {
      setError(err.message || t('agency.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('auth.agencyLoginTitle')}</h1>
        <p className="auth-subtitle">{t('auth.agencyLoginSubtitle')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('common.email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('common.password')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? t('auth.signingIn') : t('common.signIn')}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/agency/signup">{t('auth.createAgencyAccount')}</Link>
          <Link to="/login">{t('auth.advertiserLogin')}</Link>
        </div>
      </div>
    </div>
  );
}
