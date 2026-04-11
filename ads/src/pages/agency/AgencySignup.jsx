import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAgency } from '@contexts/AgencyContext';


export default function AgencySignup() {
  const { t } = useTranslation();
  const { signup } = useAgency();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    password: '',
    website: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/agency');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{t('auth.agencySignupTitle')}</h1>
        <p className="auth-subtitle">{t('auth.agencySignupSubtitle')}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="company_name">{t('auth.agencyName')}</label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              value={form.company_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">{t('common.email')}</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('common.password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="website">{t('common.website')}</label>
            <input
              id="website"
              name="website"
              type="url"
              value={form.website}
              onChange={handleChange}
              placeholder="https://youragency.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">{t('auth.aboutAgency')}</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder={t('auth.aboutAgencyPlaceholder')}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? t('auth.creatingAccount') : t('auth.createAgencyAccount')}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/agency/login">{t('auth.agencyHasAccount')}</Link>
          <Link to="/signup">{t('auth.advertiserSignup')}</Link>
        </div>
      </div>
    </div>
  );
}
