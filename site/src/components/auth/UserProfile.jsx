// UserProfile - User profile display component
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks';
import { useCreditsContext } from '@/contexts';

// Force 10px font size on mobile - inline style overrides all CSS
const mobileStyle = { fontSize: '10px' };

export function UserProfile({ onOpenPayment, onOpenAccount }) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { balance } = useCreditsContext();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
  };

  const totalCredits = balance ? balance.total : 0;

  // Get username part from email (before @)
  const username = user.email ? user.email.split('@')[0].toUpperCase() : 'USER';

  return (
    <div className="user-profile-buttons">
      {/* Username Display - Fixed position top-left, clickable */}
      <div
        className="user-profile__username"
        onClick={onOpenAccount}
        title={t('account.title')}
        style={mobileStyle}
      >
        {username}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </div>

      {/* Logout Button - positioned below username */}
      <button
        type="button"
        className="auth-btn logout-btn"
        onClick={handleSignOut}
        style={mobileStyle}
      >
        {t('userProfile.logout')}
      </button>

      {/* Buy Credits Button - positioned below logout */}
      <button
        className="auth-btn balance-display user-profile__refill-btn"
        onClick={onOpenPayment}
        style={mobileStyle}
      >
        {t('userProfile.buyCredits')}
      </button>

      {/* Balance Display - Bottom, right aligned */}
      <div
        className="balance-display user-profile__balance"
        onClick={onOpenAccount}
        title={t('account.viewHistory', { defaultValue: 'View transaction history' })}
        style={mobileStyle}
      >
        <span className="user-profile__balance-text" style={mobileStyle}>
          {t('userProfile.balance')}
        </span>
        <span className="user-profile__balance-text" style={mobileStyle}>
          {totalCredits} {totalCredits === 1 ? t('userProfile.credit') : t('userProfile.credits')}
        </span>
      </div>
    </div>
  );
}

export default UserProfile;
