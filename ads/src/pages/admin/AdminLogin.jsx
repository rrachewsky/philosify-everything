import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '@contexts/AdminContext';

function AdminLogin() {
  const { t } = useTranslation();
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const ok = await login(secret);
    setLoading(false);

    if (!ok) {
      setError(t('admin.invalidSecret'));
      return;
    }

    navigate('/admin');
  };

  return (
    <div className="auth-page auth-page--admin">
      <div className="auth-card">
        <p className="eyebrow">{t('admin.loginEyebrow')}</p>
        <h1>{t('admin.loginTitle')}</h1>
        <p className="auth-card__lede">
          {t('admin.loginDesc')}
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          {error ? <div className="alert alert--error">{error}</div> : null}

          <div className="field">
            <label htmlFor="admin-secret">{t('admin.secret')}</label>
            <input
              id="admin-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder={t('admin.secretPlaceholder')}
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--large" disabled={loading}>
            {loading ? t('admin.unlocking') : t('admin.enterControlRoom')}
          </button>
        </form>

        <p className="auth-card__footer">
          {t('admin.returnTo')} <Link to="/">{t('admin.publicAtelier')}</Link>.
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
