// NavAccount - shared v2 top-right chrome: language pill, balance,
// account menu (History / Buy Credits / Logout) or Sign in when logged out.
// Opens the shared transaction modals via the v2-open-* window events.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useCreditsContext } from '../../contexts/CreditsContext';
import { changeLanguageWithPreload } from '../../i18n/config.js';

const LOCALES = [
  'en', 'pt', 'es', 'de', 'fr', 'it', 'hu', 'zh', 'ja',
  'ko', 'ru', 'he', 'ar', 'hi', 'fa', 'nl', 'pl', 'tr',
];

export function NavAccount() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { balance } = useCreditsContext();
  const [menu, setMenu] = useState(null); // 'acct' | 'lang' | null
  const rootRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setMenu(null);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '';

  return (
    <span ref={rootRef} style={{ display: 'flex', gap: 26 }}>
      <span style={{ position: 'relative' }}>
        <a
          onClick={(e) => {
            e.preventDefault();
            setMenu(menu === 'lang' ? null : 'lang');
          }}
          href="#lang"
        >
          {i18n.language.toUpperCase()} · {LOCALES.length}
        </a>
        <span className={`acctmenu langgrid${menu === 'lang' ? ' open' : ''}`}>
          {LOCALES.map((code) => (
            <a
              key={code}
              href={`#${code}`}
              onClick={(e) => {
                e.preventDefault();
                changeLanguageWithPreload(code);
                setMenu(null);
              }}
              style={code === i18n.language ? { color: 'var(--ink)' } : undefined}
            >
              {code.toUpperCase()}
            </a>
          ))}
        </span>
      </span>

      {isAuthenticated ? (
        <>
          <a
            href="#balance"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
            }}
          >
            {t('v2.nav.balance', 'Balance')}: {balance?.total ?? 0}
          </a>
          <span style={{ position: 'relative' }}>
            <a
              href="#account"
              onClick={(e) => {
                e.preventDefault();
                setMenu(menu === 'acct' ? null : 'acct');
              }}
            >
              {displayName} <span style={{ opacity: 0.55 }}>▾</span>
            </a>
            <span className={`acctmenu${menu === 'acct' ? ' open' : ''}`}>
              <a
                href="#history"
                onClick={(e) => {
                  e.preventDefault();
                  setMenu(null);
                  window.dispatchEvent(new CustomEvent('v2-open-history'));
                }}
              >
                {t('v2.nav.history', 'History')}
              </a>
              <a
                href="#buy"
                onClick={(e) => {
                  e.preventDefault();
                  setMenu(null);
                  window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
                }}
              >
                {t('v2.nav.buyCredits', 'Buy Credits')}
              </a>
              <hr />
              <a
                href="#logout"
                onClick={async (e) => {
                  e.preventDefault();
                  setMenu(null);
                  await signOut();
                  navigate('/');
                }}
              >
                {t('v2.nav.logout', 'Logout')}
              </a>
            </span>
          </span>
        </>
      ) : (
        <>
          <a
            href="/signin"
            onClick={(e) => {
              e.preventDefault();
              navigate('/signin');
            }}
          >
            {t('v2.nav.signIn', 'Sign in')}
          </a>
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              navigate('/signup');
            }}
          >
            {t('v2.nav.signUp', 'Sign up')}
          </a>
        </>
      )}
    </span>
  );
}
