import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const LOGO = import.meta.env.VITE_CDN_URL
  ? `${import.meta.env.VITE_CDN_URL}/logo.png`
  : 'https://pub-2485a0b8727445bbb7148e85adb44812.r2.dev/logo.png';

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
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
        <p className="eyebrow">Advertiser application</p>
        <h1>Apply for a curated campaign workspace.</h1>
        <p className="auth-card__lede">
          We review accounts to keep the placement environment elegant, relevant, and safe for the
          Philosify audience.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          {error ? <div className="alert alert--error">{error}</div> : null}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="signup-email">Email</label>
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
              <label htmlFor="signup-company">Company</label>
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
            <label htmlFor="signup-website">Website</label>
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
            <div className="field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="signup-confirm">Confirm password</label>
              <input
                id="signup-confirm"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn--primary btn--large" disabled={loading}>
            {loading ? 'Creating atelier...' : 'Create account'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already approved? <Link to="/login">Sign in instead</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
