import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAgency } from '@contexts/AgencyContext';


export default function AgencySignup() {
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
        <h1>Agency Registration</h1>
        <p className="auth-subtitle">Manage ad campaigns for your clients on Philosify</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="company_name">Agency Name</label>
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
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Password</label>
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
            <label htmlFor="website">Website</label>
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
            <label htmlFor="description">About Your Agency</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about your agency and the clients you serve"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Agency Account'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/agency/login">Already have an account? Sign in</Link>
          <Link to="/signup">Advertiser signup</Link>
        </div>
      </div>
    </div>
  );
}
