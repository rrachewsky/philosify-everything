import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '@contexts/AdminContext';

function AdminLogin() {
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
      setError('Invalid admin secret.');
      return;
    }

    navigate('/admin');
  };

  return (
    <div className="auth-page auth-page--admin">
      <div className="auth-card">
        <p className="eyebrow">Operations atelier</p>
        <h1>Unlock the admin control room.</h1>
        <p className="auth-card__lede">
          This area follows advertiser approvals, creative requests, and campaign launches.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          {error ? <div className="alert alert--error">{error}</div> : null}

          <div className="field">
            <label htmlFor="admin-secret">Admin secret</label>
            <input
              id="admin-secret"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              placeholder="Enter X-Admin-Secret"
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--large" disabled={loading}>
            {loading ? 'Unlocking...' : 'Enter control room'}
          </button>
        </form>

        <p className="auth-card__footer">
          Return to the <Link to="/">public atelier</Link>.
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
