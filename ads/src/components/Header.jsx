import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useAdmin } from '@contexts/AdminContext';
import { useAgency } from '@contexts/AgencyContext';
import LanguageSelector from './LanguageSelector';

const BRAND = 'Philosify Ads Atelier';
const LOGO = '/logo.png';

function getAdvertiserNav(t) {
  return [
    { to: '/app', label: t('header.overview'), end: true },
    { to: '/app/campaigns', label: t('header.campaigns') },
    { to: '/app/analytics', label: t('header.analytics') },
    { to: '/app/billing', label: t('header.billing') },
  ];
}

function getAdminNav(t) {
  return [
    { to: '/admin', label: t('header.controlRoom'), end: true },
  ];
}

function getAgencyNav(t) {
  return [
    { to: '/agency', label: t('header.dashboard'), end: true },
    { to: '/agency/clients', label: t('header.clients') },
    { to: '/agency/earnings', label: t('header.earnings') },
  ];
}

function Header({ admin = false, agency = false }) {
  const { t } = useTranslation();
  const { advertiser, logout: advertiserLogout } = useAuth();
  const { logout: adminLogout } = useAdmin();
  const { agency: agencyUser, logout: agencyLogout } = useAgency();
  const navigate = useNavigate();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  const navItems = admin ? getAdminNav(t) : agency ? getAgencyNav(t) : getAdvertiserNav(t);
  const identity = admin
    ? t('header.adminIdentity')
    : agency
      ? agencyUser?.company_name || agencyUser?.email || t('header.agencyIdentity')
      : advertiser?.company_name || advertiser?.email;
  const badge = admin ? t('common.admin') : agency ? t('common.agency') : t('common.advertiser');
  const eyebrow = admin
    ? t('header.operationsAtelier')
    : agency
      ? t('header.agencyAtelier')
      : t('header.commercialAtelier');

  const handleLogout = async () => {
    if (admin) {
      adminLogout();
      navigate('/admin/login');
      return;
    }
    if (agency) {
      await agencyLogout();
      navigate('/agency/login');
      return;
    }
    await advertiserLogout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="studio-header">
      <div className="studio-header__brand">
        <img src={LOGO} alt="Philosify" className="studio-header__logo" />
        <div>
          <p className="studio-header__eyebrow">{eyebrow}</p>
          <h1 className="studio-header__title">{t('header.brandName')}</h1>
        </div>
      </div>

      <nav className="studio-header__nav" aria-label={t('header.navigation', { role: badge })}>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `studio-header__link ${isActive ? 'studio-header__link--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
        {!admin && !agency && (
          <div className="studio-header__dropdown" ref={moreMenuRef}>
            <button
              type="button"
              className="studio-header__link"
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              aria-expanded={moreMenuOpen}
            >
              {t('header.more')} ▾
            </button>
            {moreMenuOpen && (
              <div className="studio-header__menu">
                <NavLink
                  to="/app/placements"
                  className="studio-header__menu-item"
                  onClick={() => setMoreMenuOpen(false)}
                >
                  {t('header.placements')}
                </NavLink>
                <NavLink
                  to="/app/settings"
                  className="studio-header__menu-item"
                  onClick={() => setMoreMenuOpen(false)}
                >
                  {t('header.settings')}
                </NavLink>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="studio-header__actions">
        <div className="studio-header__identity">
          <span className="studio-header__badge">{badge}</span>
          <span>{identity}</span>
        </div>
        <LanguageSelector compact />
        <button type="button" className="btn btn--ghost" onClick={handleLogout}>
          {admin ? t('header.lockAtelier') : t('common.signOut')}
        </button>
      </div>
    </header>
  );
}

export default Header;
