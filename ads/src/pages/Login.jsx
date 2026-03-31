import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const LOGO = import.meta.env.VITE_CDN_URL
  ? `${import.meta.env.VITE_CDN_URL}/logo.png`
  : 'https://pub-2485a0b8727445bbb7148e85adb44812.r2.dev/logo.png';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src={LOGO} alt="Philosify" className="auth-card__logo" />
        <p className="eyebrow">Advertiser sign in</p>
        <h1>Welcome back to the atelier.</h1>
        <p className="auth-card__lede">
          Review your campaigns, approve new creative drafts, and keep launches moving.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          {error ? <div className="alert alert--error">{error}</div> : null}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn btn--primary btn--large" disabled={loading}>
            {loading ? 'Opening atelier...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-card__footer">
          Need an account? <Link to="/signup">Apply as an advertiser</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
