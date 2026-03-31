import { useEffect, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@services/api';

function Settings() {
  const { advertiser, refreshAdvertiser, logout } = useAuth();
  
  const [form, setForm] = useState({
    company_name: '',
    website: '',
    contact_email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (advertiser) {
      setForm({
        company_name: advertiser.company_name || '',
        website: advertiser.website || '',
        contact_email: advertiser.contact_email || advertiser.email || '',
      });
    }
  }, [advertiser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!form.company_name.trim()) {
      setMessage({ type: 'error', text: 'Company name is required' });
      return;
    }

    setSaving(true);

    try {
      await api.put('/ads/account/profile', {
        company_name: form.company_name.trim(),
        website: form.website.trim(),
        contact_email: form.contact_email.trim(),
      });
      
      await refreshAdvertiser();
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSavingPassword(true);

    try {
      await api.put('/ads/account/password', {
        new_password: passwordForm.new_password,
      });
      
      setPasswordForm({
        new_password: '',
        confirm_password: '',
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt('Type DELETE to permanently remove your advertiser account.');

    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      await api.delete('/ads/account');
      logout();
    } catch (err) {
      alert(err.message || 'Failed to delete account');
    }
  };

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Account atelier</p>
          <h2>Profile and security</h2>
        </div>
      </section>

      <div className="editorial-grid editorial-grid--settings">
        <section className="surface-card stack">
          <div>
            <p className="eyebrow">Profile</p>
            <h3>Company details</h3>
          </div>

          {message.text ? <div className={`alert alert--${message.type}`}>{message.text}</div> : null}

          <form className="stack" onSubmit={handleSaveProfile}>
            <div className="field">
              <label htmlFor="settings-email">Email address</label>
              <input id="settings-email" type="email" value={advertiser?.email || ''} disabled />
            </div>
            <div className="field">
              <label htmlFor="settings-company">Company name</label>
              <input
                id="settings-company"
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-website">Website</label>
              <input
                id="settings-website"
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-contact">Contact email</label>
              <input
                id="settings-contact"
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </section>

        <section className="surface-card stack">
          <div>
            <p className="eyebrow">Security</p>
            <h3>Password</h3>
          </div>
          {passwordMessage.text ? (
            <div className={`alert alert--${passwordMessage.type}`}>{passwordMessage.text}</div>
          ) : null}
          <form className="stack" onSubmit={handleChangePassword}>
            <div className="field">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                minLength={8}
              />
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
              />
            </div>
            <button type="submit" className="btn btn--secondary" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <div>
            <p className="eyebrow">Status</p>
            <div className="detail-list">
              <div><span>Account status</span><strong>{advertiser?.status || 'pending'}</strong></div>
              <div><span>Member since</span><strong>{advertiser?.created_at ? new Date(advertiser.created_at).toLocaleDateString() : 'Unknown'}</strong></div>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-card surface-card--danger stack">
        <div>
          <p className="eyebrow">Danger zone</p>
          <h3>Delete account</h3>
        </div>
        <p className="helper-text">
          This permanently removes your advertiser profile and the campaigns attached to it.
        </p>
        <button type="button" className="btn btn--danger" onClick={handleDeleteAccount}>
          Delete account
        </button>
      </section>
    </div>
  );
}

export default Settings;
