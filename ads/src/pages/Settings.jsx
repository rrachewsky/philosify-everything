import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@services/api';

function Settings() {
  const { t } = useTranslation();
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
      setMessage({ type: 'error', text: t('settings.companyRequired') });
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
      setMessage({ type: 'success', text: t('settings.profileUpdated') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || t('settings.updateFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordMinLength') });
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordsMustMatch') });
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
      setPasswordMessage({ type: 'success', text: t('settings.passwordChanged') });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || t('settings.passwordFailed') });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(t('settings.deletePrompt'));

    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      await api.delete('/ads/account');
      logout();
    } catch (err) {
      alert(err.message || t('settings.deleteFailed'));
    }
  };

  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">{t('settings.title')}</p>
          <h2>{t('settings.title')}</h2>
        </div>
      </section>

      <div className="editorial-grid editorial-grid--settings">
        <section className="surface-card stack">
          <div>
            <p className="eyebrow">{t('settings.profile')}</p>
            <h3>{t('settings.profile')}</h3>
          </div>

          {message.text ? <div className={`alert alert--${message.type}`}>{message.text}</div> : null}

          <form className="stack" onSubmit={handleSaveProfile}>
            <div className="field">
              <label htmlFor="settings-email">{t('common.email')}</label>
              <input id="settings-email" type="email" value={advertiser?.email || ''} disabled />
            </div>
            <div className="field">
              <label htmlFor="settings-company">{t('auth.companyName')}</label>
              <input
                id="settings-company"
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-website">{t('common.website')}</label>
              <input
                id="settings-website"
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-contact">{t('auth.contactEmail')}</label>
              <input
                id="settings-contact"
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleChange}
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? t('settings.updating') : t('settings.updateProfile')}
            </button>
          </form>
        </section>

        <section className="surface-card stack">
          <div>
            <p className="eyebrow">{t('settings.changePassword')}</p>
            <h3>{t('settings.changePassword')}</h3>
          </div>
          {passwordMessage.text ? (
            <div className={`alert alert--${passwordMessage.type}`}>{passwordMessage.text}</div>
          ) : null}
          <form className="stack" onSubmit={handleChangePassword}>
            <div className="field">
              <label htmlFor="new-password">{t('settings.newPassword')}</label>
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
              <label htmlFor="confirm-password">{t('settings.confirmPassword')}</label>
              <input
                id="confirm-password"
                type="password"
                name="confirm_password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
              />
            </div>
            <button type="submit" className="btn btn--secondary" disabled={savingPassword}>
              {savingPassword ? t('settings.updating') : t('settings.changePassword')}
            </button>
          </form>

          <div>
            <p className="eyebrow">{t('settings.statusLabel')}</p>
            <div className="detail-list">
              <div><span>{t('settings.accountStatus')}</span><strong>{advertiser?.status || 'pending'}</strong></div>
              <div><span>{t('settings.memberSince')}</span><strong>{advertiser?.created_at ? new Date(advertiser.created_at).toLocaleDateString() : t('settings.unknown')}</strong></div>
            </div>
          </div>
        </section>
      </div>

      <section className="surface-card surface-card--danger stack">
        <div>
          <p className="eyebrow">{t('settings.dangerZone')}</p>
          <h3>{t('settings.deleteAccount')}</h3>
        </div>
        <p className="helper-text">
          {t('settings.deleteWarning')}
        </p>
        <button type="button" className="btn btn--danger" onClick={handleDeleteAccount}>
          {t('settings.deleteAccount')}
        </button>
      </section>
    </div>
  );
}

export default Settings;
