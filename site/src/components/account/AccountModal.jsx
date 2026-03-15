// AccountModal - Account settings with Profile, History, Notifications and Security tabs
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, TransactionSkeleton, PasswordInput } from '../common';
import { useAuth, useAccountHistory } from '@/hooks';
import { profileService } from '@/services/api/profile.js';
import { config } from '@/config';
import { isValidPassword } from '@utils/validation.js';
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '../../utils/pwa.js';

// Common country codes for the dropdown
const COUNTRY_CODES = [
  { code: '+1', label: '+1 (US/CA)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+55', label: '+55 (BR)' },
  { code: '+34', label: '+34 (ES)' },
  { code: '+33', label: '+33 (FR)' },
  { code: '+49', label: '+49 (DE)' },
  { code: '+39', label: '+39 (IT)' },
  { code: '+351', label: '+351 (PT)' },
  { code: '+31', label: '+31 (NL)' },
  { code: '+48', label: '+48 (PL)' },
  { code: '+36', label: '+36 (HU)' },
  { code: '+90', label: '+90 (TR)' },
  { code: '+7', label: '+7 (RU)' },
  { code: '+81', label: '+81 (JP)' },
  { code: '+82', label: '+82 (KR)' },
  { code: '+86', label: '+86 (CN)' },
  { code: '+91', label: '+91 (IN)' },
  { code: '+966', label: '+966 (SA)' },
  { code: '+972', label: '+972 (IL)' },
  { code: '+98', label: '+98 (IR)' },
  { code: '+61', label: '+61 (AU)' },
  { code: '+52', label: '+52 (MX)' },
  { code: '+54', label: '+54 (AR)' },
  { code: '+56', label: '+56 (CL)' },
  { code: '+57', label: '+57 (CO)' },
  { code: '+27', label: '+27 (ZA)' },
  { code: '+234', label: '+234 (NG)' },
  { code: '+20', label: '+20 (EG)' },
  { code: '+65', label: '+65 (SG)' },
  { code: '+60', label: '+60 (MY)' },
  { code: '+66', label: '+66 (TH)' },
  { code: '+84', label: '+84 (VN)' },
  { code: '+62', label: '+62 (ID)' },
  { code: '+63', label: '+63 (PH)' },
];

export function AccountModal({ isOpen, onClose, user, onViewAnalysis, onViewDebate }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('history');
  const {
    items: historyItems,
    loading: historyLoading,
    error: historyError,
    formatDescription,
  } = useAccountHistory(user);
  const { updatePassword, loading: authLoading } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('');
  const [phoneAreaCode, setPhoneAreaCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState({
    dm_enabled: true,
    replies_enabled: true,
    collective_enabled: true,
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [, setNotifSaving] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifError, setNotifError] = useState('');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushToggling, setPushToggling] = useState(false);

  // Load profile when modal opens or tab switches to profile
  useEffect(() => {
    if (isOpen && user && activeTab === 'profile') {
      loadProfile();
    }
  }, [isOpen, user, activeTab]);

  // Load notification preferences when tab switches
  useEffect(() => {
    if (isOpen && user && activeTab === 'notifications') {
      loadNotifPrefs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadNotifPrefs is defined later and changes identity; using stable deps only
  }, [isOpen, user, activeTab]);

  const loadProfile = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const { profile } = await profileService.getProfile();
      setDisplayName(profile.display_name || '');
      setPhoneCountryCode(profile.phone_country_code || '');
      setPhoneAreaCode(profile.phone_area_code || '');
      setPhoneNumber(profile.phone_number || '');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setProfileSaving(true);

    try {
      await profileService.updateProfile({
        displayName: displayName.trim(),
        phoneCountryCode: phoneCountryCode.trim(),
        phoneAreaCode: phoneAreaCode.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      setProfileMessage(t('account.profileSaved', { defaultValue: 'Profile saved!' }));
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Load notification preferences and push subscription state
  const loadNotifPrefs = useCallback(async () => {
    setNotifLoading(true);
    setNotifError('');
    try {
      const [prefsRes, subscribed] = await Promise.all([
        fetch(`${config.apiUrl}/api/push/preferences`, {
          method: 'GET',
          credentials: 'include',
        }),
        isPushSubscribed(),
      ]);
      if (!prefsRes.ok) throw new Error('Failed to load preferences');
      const data = await prefsRes.json();
      setNotifPrefs(
        data.preferences || { dm_enabled: true, replies_enabled: true, collective_enabled: true }
      );
      setPushSubscribed(subscribed);
    } catch (err) {
      setNotifError(err.message);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Toggle a notification preference
  const toggleNotifPref = useCallback(
    async (key) => {
      // Compute new value from current state
      const newValue = !notifPrefs[key];

      // Optimistic update
      setNotifPrefs((prev) => ({ ...prev, [key]: newValue }));
      setNotifMessage('');
      setNotifError('');
      setNotifSaving(true);

      try {
        const res = await fetch(`${config.apiUrl}/api/push/preferences`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: newValue }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error ${res.status}`);
        }
        setNotifMessage(t('account.saved', { defaultValue: 'Saved' }));
      } catch (err) {
        // Revert on error
        setNotifPrefs((prev) => ({ ...prev, [key]: !newValue }));
        setNotifError(err.message);
      } finally {
        setNotifSaving(false);
      }
    },
    [notifPrefs, t]
  );

  // Toggle push notifications (master switch)
  const togglePush = useCallback(async () => {
    if (pushToggling) return;
    setPushToggling(true);
    setNotifError('');
    try {
      if (pushSubscribed) {
        await unsubscribeFromPush();
        setPushSubscribed(false);
        setNotifMessage(t('account.saved', { defaultValue: 'Saved' }));
      } else {
        const result = await subscribeToPush();
        if (result.success) {
          setPushSubscribed(true);
          setNotifMessage(t('account.saved', { defaultValue: 'Saved' }));
        } else {
          setNotifError(
            result.error || t('community.push.enableFailed', { defaultValue: 'Could not enable' })
          );
        }
      }
    } catch (err) {
      setNotifError(err.message);
    } finally {
      setPushToggling(false);
    }
  }, [pushSubscribed, pushToggling, t]);

  // Auto-dismiss notif messages
  useEffect(() => {
    if (notifMessage) {
      const timer = setTimeout(() => setNotifMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [notifMessage]);

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (profileMessage) {
      const timer = setTimeout(() => setProfileMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('account.passwordMismatch', { defaultValue: 'Passwords do not match' }));
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError(
        t('account.passwordTooShort', {
          defaultValue:
            'Password must be at least 8 characters with one uppercase letter and one number',
        })
      );
      return;
    }

    const { success, error: updateError } = await updatePassword(newPassword);

    if (success) {
      setMessage(t('account.passwordChanged', { defaultValue: 'Password changed successfully!' }));
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(
        updateError ||
          t('account.passwordChangeFailed', { defaultValue: 'Failed to change password' })
      );
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Determine if a credit item links to a debate (has thread_id in metadata)
  const getDebateThreadId = (item) => {
    if (item.kind === 'credit' && item.metadata?.thread_id) {
      return item.metadata.thread_id;
    }
    return null;
  };

  const renderRight = (item) => {
    if (item.kind === 'analysis')
      return <span className="transaction-amount analysis-arrow">&#8250;</span>;
    const threadId = getDebateThreadId(item);
    if (threadId) {
      const amt = Number(item.amount || 0);
      return (
        <span className="transaction-right-group">
          <span className={`transaction-amount ${amt >= 0 ? 'positive' : 'negative'}`}>
            {amt >= 0 ? '+' : ''}
            {amt}
          </span>
          <span className="transaction-amount analysis-arrow">&#8250;</span>
        </span>
      );
    }
    const amt = Number(item.amount || 0);
    return (
      <span className={`transaction-amount ${amt >= 0 ? 'positive' : 'negative'}`}>
        {amt >= 0 ? '+' : ''}
        {amt}
      </span>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('account.title', { defaultValue: 'My Account' })}
      maxWidth="500px"
      className="account-modal"
    >
      {/* Tabs */}
      <div className="account-tabs">
        <button
          className={`account-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          {t('account.profile', { defaultValue: 'Profile' })}
        </button>
        <button
          className={`account-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t('account.history', { defaultValue: 'History' })}
        </button>
        <button
          className={`account-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          {t('account.notifications', { defaultValue: 'Notifications' })}
        </button>
        <button
          className={`account-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          {t('account.security', { defaultValue: 'Security' })}
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="account-security">
          {profileLoading ? (
            <div className="account-empty">
              {t('account.loading', { defaultValue: 'Loading...' })}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="security-section">
                <h3>{t('account.email', { defaultValue: 'Email' })}</h3>
                <p className="security-value">{user?.email || '--'}</p>
              </div>

              <div className="security-section">
                <h3>{t('account.displayNameLabel', { defaultValue: 'Display Name' })}</h3>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={user?.email?.split('@')[0] || 'Your name'}
                    maxLength={50}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="security-section">
                <h3>{t('account.phoneLabel', { defaultValue: 'Mobile Phone' })}</h3>

                <div className="form-group">
                  <label htmlFor="phoneCountryCode">
                    {t('account.countryCode', { defaultValue: 'Country Code' })}
                  </label>
                  <select
                    id="phoneCountryCode"
                    className="form-input"
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                  >
                    <option value="">--</option>
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="phone-row">
                  <div className="form-group phone-area">
                    <label htmlFor="phoneAreaCode">
                      {t('account.areaCode', { defaultValue: 'Area Code' })}
                    </label>
                    <input
                      id="phoneAreaCode"
                      type="text"
                      className="form-input"
                      value={phoneAreaCode}
                      onChange={(e) =>
                        setPhoneAreaCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                      }
                      placeholder="11"
                      maxLength={5}
                      inputMode="numeric"
                      autoComplete="tel-area-code"
                    />
                  </div>
                  <div className="form-group phone-number">
                    <label htmlFor="phoneNumber">
                      {t('account.phoneNumber', { defaultValue: 'Number' })}
                    </label>
                    <input
                      id="phoneNumber"
                      type="text"
                      className="form-input"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 15))
                      }
                      placeholder="912345678"
                      maxLength={15}
                      inputMode="numeric"
                      autoComplete="tel-local"
                    />
                  </div>
                </div>
              </div>

              {profileMessage && <div className="security-success">{profileMessage}</div>}
              {profileError && <div className="security-error">{profileError}</div>}

              <button type="submit" className="form-button mt-2" disabled={profileSaving}>
                {profileSaving
                  ? t('account.saving', { defaultValue: 'Saving...' })
                  : t('account.saveProfile', { defaultValue: 'Save Profile' })}
              </button>
            </form>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="account-history">
          {historyLoading ? (
            <TransactionSkeleton count={5} message="Loading history..." />
          ) : historyError ? (
            <div className="account-error">{historyError}</div>
          ) : historyItems.length === 0 ? (
            <div className="account-empty">
              {t('account.noTransactions', { defaultValue: 'No history yet' })}
            </div>
          ) : (
            <div className="transaction-list">
              {historyItems.map((item) => {
                const isInteraction = item.kind === 'analysis' || item.kind === 'panel' || item.kind === 'debate';
                const debateThreadId = item.kind === 'debate' ? item.id : getDebateThreadId(item);
                const isClickable = isInteraction || !!debateThreadId;
                const handler = isInteraction
                  ? () => onViewAnalysis?.(item.analysisId || item.id, item.mediaType, item.kind)
                  : debateThreadId
                    ? () => onViewDebate?.(debateThreadId)
                    : null;
                const title = isAnalysis
                  ? t('account.viewAnalysis', { defaultValue: 'View this analysis' })
                  : debateThreadId
                    ? t('account.viewDebate', { defaultValue: 'View this debate' })
                    : undefined;
                return (
                  <div
                    key={item.id}
                    className={`transaction-item ${isClickable ? 'clickable' : ''}`}
                    {...(isClickable && {
                      onClick: handler,
                      role: 'button',
                      tabIndex: 0,
                      onKeyDown: (e) => e.key === 'Enter' && handler(),
                      title,
                    })}
                  >
                    <div className="transaction-info">
                      <div className="transaction-description">{formatDescription(item)}</div>
                      <div className="transaction-date">
                        {item.date ? formatDate(item.date) : ''}
                      </div>
                    </div>
                    {renderRight(item)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="account-security">
          {notifLoading ? (
            <div className="account-empty">
              {t('account.loading', { defaultValue: 'Loading...' })}
            </div>
          ) : (
            <>
              <p className="notif-pref__description">{t('community.notifications.description')}</p>

              <div
                className={`notif-pref__item notif-pref__item--push-master${pushToggling ? ' notif-pref__item--disabled' : ''}`}
                onClick={pushToggling ? undefined : togglePush}
              >
                <div className="notif-pref__info">
                  <span className="notif-pref__label">
                    {t('community.notifications.pushLabel', { defaultValue: 'Push notifications' })}
                  </span>
                  <span className="notif-pref__hint">
                    {t('community.notifications.pushHint', {
                      defaultValue: 'Receive notifications on this device',
                    })}
                  </span>
                </div>
                <div
                  className={`notif-pref__toggle ${pushSubscribed ? 'notif-pref__toggle--on' : ''} ${pushToggling ? 'notif-pref__toggle--disabled' : ''}`}
                >
                  <div className="notif-pref__toggle-knob" />
                </div>
              </div>

              <div className="notif-pref__item" onClick={() => toggleNotifPref('dm_enabled')}>
                <div className="notif-pref__info">
                  <span className="notif-pref__label">{t('community.notifications.dmLabel')}</span>
                  <span className="notif-pref__hint">{t('community.notifications.dmHint')}</span>
                </div>
                <div
                  className={`notif-pref__toggle ${notifPrefs.dm_enabled ? 'notif-pref__toggle--on' : ''}`}
                >
                  <div className="notif-pref__toggle-knob" />
                </div>
              </div>

              <div className="notif-pref__item" onClick={() => toggleNotifPref('replies_enabled')}>
                <div className="notif-pref__info">
                  <span className="notif-pref__label">
                    {t('community.notifications.repliesLabel')}
                  </span>
                  <span className="notif-pref__hint">
                    {t('community.notifications.repliesHint')}
                  </span>
                </div>
                <div
                  className={`notif-pref__toggle ${notifPrefs.replies_enabled ? 'notif-pref__toggle--on' : ''}`}
                >
                  <div className="notif-pref__toggle-knob" />
                </div>
              </div>

              <div
                className="notif-pref__item"
                onClick={() => toggleNotifPref('collective_enabled')}
              >
                <div className="notif-pref__info">
                  <span className="notif-pref__label">
                    {t('community.notifications.collectiveLabel')}
                  </span>
                  <span className="notif-pref__hint">
                    {t('community.notifications.collectiveHint')}
                  </span>
                </div>
                <div
                  className={`notif-pref__toggle ${notifPrefs.collective_enabled ? 'notif-pref__toggle--on' : ''}`}
                >
                  <div className="notif-pref__toggle-knob" />
                </div>
              </div>

              {notifMessage && <div className="security-success">{notifMessage}</div>}
              {notifError && <div className="security-error">{notifError}</div>}
            </>
          )}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="account-security">
          <div className="security-section">
            <h3>{t('account.changePassword', { defaultValue: 'Change Password' })}</h3>

            {message && <div className="security-success">{message}</div>}
            {error && <div className="security-error">{error}</div>}

            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-group">
                <label htmlFor="newPassword">
                  {t('account.newPassword', { defaultValue: 'New Password' })}
                </label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  {t('account.confirmPassword', { defaultValue: 'Confirm Password' })}
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="form-button mt-2" disabled={authLoading}>
                {authLoading
                  ? t('account.changing', { defaultValue: 'Changing...' })
                  : t('account.changePassword', { defaultValue: 'Change Password' })}
              </button>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default AccountModal;
