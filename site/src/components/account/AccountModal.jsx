// AccountModal - Account settings with Profile, History, Notifications and Security tabs
// v2 skin (WP6.2): Console-for-Thinking modal anatomy (mwrap/mhead/mbody kit,
// new_design/philosify-modals.html). Behavior, props contract, hooks and
// handlers are unchanged from the legacy surface — only the skin moved.
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '../common';
import { useAuth, useAccountHistory } from '@/hooks';
import { profileService } from '@/services/api/profile.js';
import { config } from '@/config';
import { isValidPassword } from '@utils/validation.js';
import { isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '../../utils/pwa.js';
import '../../styles/v2-pages/account.css';

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

// v2 chrome carries no emojis (Design Law): strip pictographs from the
// hook-formatted descriptions at render time. Data and behavior untouched.
const stripPictographs = (s) =>
  String(s || '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/️/gu, '') // stray emoji variation selectors
    .replace(/\s+/g, ' ')
    .trim();

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

  // Escape closes (v2 modal kit parity)
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

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
      const newValue = !notifPrefs[key];
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
    const credits = Number(item.credits || item.amount || 0);
    const isNavigable = item.kind === 'analysis' || item.kind === 'panel' || item.kind === 'debate' || item.kind === 'unsafe-zone' || getDebateThreadId(item);

    // Quiz — show credits consumed but no arrow (not navigable)
    if (item.kind === 'quiz') {
      return credits > 0 ? <span className="acct-amt neg">-{credits}</span> : null;
    }

    if (isNavigable) {
      return (
        <span className="acct-right">
          {credits > 0 && <span className="acct-amt neg">-{credits}</span>}
          <span className="acct-arrow" aria-hidden="true">&#8250;</span>
        </span>
      );
    }

    // For non-clickable items (purchases, etc.)
    const amt = Number(item.amount || 0);
    const receiptUrl =
      item.kind === 'credit' && item.type === 'purchase' ? item.metadata?.receipt_url : null;
    return (
      <span className="acct-right">
        <span className={`acct-amt ${amt >= 0 ? 'pos' : 'neg'}`}>
          {amt >= 0 ? '+' : ''}
          {amt}
        </span>
        {receiptUrl && (
          <a
            className="acct-receipt"
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {t('account.receipt', { defaultValue: 'Receipt' })} &#8594;
          </a>
        )}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="v2 acct-surface"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mwrap" role="dialog" aria-modal="true" aria-labelledby="acct-title">
        <div className="mhead">
          <h2 id="acct-title">{t('account.title', { defaultValue: 'My Account' })}</h2>
          <button className="x" onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>
        <div className="mbody">
          {/* Tabs */}
          <div className="tabs" role="tablist">
            <button
              className={`tab ${activeTab === 'profile' ? 'on' : ''}`}
              role="tab"
              aria-selected={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            >
              {t('account.profile', { defaultValue: 'Profile' })}
            </button>
            <button
              className={`tab ${activeTab === 'history' ? 'on' : ''}`}
              role="tab"
              aria-selected={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
            >
              {t('account.history', { defaultValue: 'History' })}
            </button>
            <button
              className={`tab ${activeTab === 'notifications' ? 'on' : ''}`}
              role="tab"
              aria-selected={activeTab === 'notifications'}
              onClick={() => setActiveTab('notifications')}
            >
              {t('account.notifications', { defaultValue: 'Notifications' })}
            </button>
            <button
              className={`tab ${activeTab === 'security' ? 'on' : ''}`}
              role="tab"
              aria-selected={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
            >
              {t('account.security', { defaultValue: 'Security' })}
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="acct-pane">
              {profileLoading ? (
                <div className="mnote">{t('account.loading', { defaultValue: 'Loading...' })}</div>
              ) : (
                <form onSubmit={handleSaveProfile}>
                  <label className="f">{t('account.email', { defaultValue: 'Email' })}</label>
                  <div className="acct-value">{user?.email || '--'}</div>

                  <label className="f" htmlFor="acctDisplayName">
                    {t('account.displayNameLabel', { defaultValue: 'Display Name' })}
                  </label>
                  <input
                    id="acctDisplayName"
                    type="text"
                    className="f"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={user?.email?.split('@')[0] || 'Your name'}
                    maxLength={50}
                    autoComplete="name"
                  />

                  <div className="acct-sec">
                    {t('account.phoneLabel', { defaultValue: 'Mobile Phone' })}
                  </div>

                  <label className="f" htmlFor="phoneCountryCode">
                    {t('account.countryCode', { defaultValue: 'Country Code' })}
                  </label>
                  <select
                    id="phoneCountryCode"
                    className="f"
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

                  <div className="acct-phone-row">
                    <div className="acct-phone-area">
                      <label className="f" htmlFor="phoneAreaCode">
                        {t('account.areaCode', { defaultValue: 'Area Code' })}
                      </label>
                      <input
                        id="phoneAreaCode"
                        type="text"
                        className="f"
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
                    <div className="acct-phone-number">
                      <label className="f" htmlFor="phoneNumber">
                        {t('account.phoneNumber', { defaultValue: 'Number' })}
                      </label>
                      <input
                        id="phoneNumber"
                        type="text"
                        className="f"
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

                  {profileMessage && <div className="acct-ok">{profileMessage}</div>}
                  {profileError && <div className="aerr">{profileError}</div>}

                  <div className="acct-foot">
                    <button type="submit" className="btnp" disabled={profileSaving}>
                      {profileSaving
                        ? t('account.saving', { defaultValue: 'Saving...' })
                        : t('account.saveProfile', { defaultValue: 'Save Profile' })}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="acct-pane">
              {historyLoading ? (
                <div className="mnote">{t('account.loading', { defaultValue: 'Loading...' })}</div>
              ) : historyError ? (
                <div className="aerr">{historyError}</div>
              ) : historyItems.length === 0 ? (
                <div className="mnote">
                  {t('account.noTransactions', { defaultValue: 'No history yet' })}
                </div>
              ) : (
                <div className="acct-rows">
                  {historyItems.map((item) => {
                    const isInteraction = item.kind === 'analysis' || item.kind === 'panel' || item.kind === 'debate' || item.kind === 'unsafe-zone';
                    const debateThreadId = item.kind === 'debate' ? item.id : getDebateThreadId(item);
                    const isClickable = (isInteraction || !!debateThreadId) && item.kind !== 'quiz';
                    const handler = isInteraction
                      ? () => onViewAnalysis?.(item.analysisId || item.id, item.mediaType, item.kind)
                      : debateThreadId
                        ? () => onViewDebate?.(debateThreadId)
                        : null;
                    const title = isInteraction
                      ? t('account.viewAnalysis', { defaultValue: 'View this analysis' })
                      : debateThreadId
                        ? t('account.viewDebate', { defaultValue: 'View this debate' })
                        : undefined;
                    return (
                      <div
                        key={item.id}
                        className={`acct-row ${isClickable ? 'clickable' : ''}`}
                        {...(isClickable && {
                          onClick: handler,
                          role: 'button',
                          tabIndex: 0,
                          onKeyDown: (e) => e.key === 'Enter' && handler(),
                          title,
                        })}
                      >
                        <span className="acct-cell">
                          <span className="acct-desc">
                            {stripPictographs(formatDescription(item, historyItems))}
                          </span>
                          <span className="acct-date">{item.date ? formatDate(item.date) : ''}</span>
                        </span>
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
            <div className="acct-pane">
              {notifLoading ? (
                <div className="mnote">{t('account.loading', { defaultValue: 'Loading...' })}</div>
              ) : (
                <>
                  <p className="acct-note">{t('community.notifications.description')}</p>

                  <div
                    className={`acct-notif${pushToggling ? ' waiting' : ''}`}
                    onClick={pushToggling ? undefined : togglePush}
                  >
                    <div className="acct-notif-info">
                      <span className="acct-notif-label">
                        {t('community.notifications.pushLabel', {
                          defaultValue: 'Push notifications',
                        })}
                      </span>
                      <span className="acct-notif-hint">
                        {t('community.notifications.pushHint', {
                          defaultValue: 'Receive notifications on this device',
                        })}
                      </span>
                    </div>
                    <div
                      className={`acct-toggle${pushSubscribed ? ' on' : ''}${pushToggling ? ' waiting' : ''}`}
                    >
                      <div className="acct-knob" />
                    </div>
                  </div>

                  <div className="acct-notif" onClick={() => toggleNotifPref('dm_enabled')}>
                    <div className="acct-notif-info">
                      <span className="acct-notif-label">
                        {t('community.notifications.dmLabel')}
                      </span>
                      <span className="acct-notif-hint">{t('community.notifications.dmHint')}</span>
                    </div>
                    <div className={`acct-toggle${notifPrefs.dm_enabled ? ' on' : ''}`}>
                      <div className="acct-knob" />
                    </div>
                  </div>

                  <div className="acct-notif" onClick={() => toggleNotifPref('replies_enabled')}>
                    <div className="acct-notif-info">
                      <span className="acct-notif-label">
                        {t('community.notifications.repliesLabel')}
                      </span>
                      <span className="acct-notif-hint">
                        {t('community.notifications.repliesHint')}
                      </span>
                    </div>
                    <div className={`acct-toggle${notifPrefs.replies_enabled ? ' on' : ''}`}>
                      <div className="acct-knob" />
                    </div>
                  </div>

                  <div className="acct-notif" onClick={() => toggleNotifPref('collective_enabled')}>
                    <div className="acct-notif-info">
                      <span className="acct-notif-label">
                        {t('community.notifications.collectiveLabel')}
                      </span>
                      <span className="acct-notif-hint">
                        {t('community.notifications.collectiveHint')}
                      </span>
                    </div>
                    <div className={`acct-toggle${notifPrefs.collective_enabled ? ' on' : ''}`}>
                      <div className="acct-knob" />
                    </div>
                  </div>

                  {notifMessage && <div className="acct-ok">{notifMessage}</div>}
                  {notifError && <div className="aerr">{notifError}</div>}
                </>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="acct-pane">
              <div className="acct-sec">
                {t('account.changePassword', { defaultValue: 'Change Password' })}
              </div>

              {message && <div className="acct-ok">{message}</div>}
              {error && <div className="aerr">{error}</div>}

              <form onSubmit={handleChangePassword}>
                <label className="f" htmlFor="newPassword">
                  {t('account.newPassword', { defaultValue: 'New Password' })}
                </label>
                <PasswordInput
                  id="newPassword"
                  className="f"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />

                <label className="f" htmlFor="confirmPassword">
                  {t('account.confirmPassword', { defaultValue: 'Confirm Password' })}
                </label>
                <PasswordInput
                  id="confirmPassword"
                  className="f"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />

                <div className="acct-foot">
                  <button type="submit" className="btnp" disabled={authLoading}>
                    {authLoading
                      ? t('account.changing', { defaultValue: 'Changing...' })
                      : t('account.changePassword', { defaultValue: 'Change Password' })}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountModal;
