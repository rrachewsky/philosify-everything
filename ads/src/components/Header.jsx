import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    { to: '/app/new', label: t('header.newCampaign') },
    { to: '/app/analytics', label: t('header.analytics') },
    { to: '/app/billing', label: t('header.billing') },
    { to: '/app/placements', label: t('header.placements') },
    { to: '/app/settings', label: t('header.settings') },
  ];
}

function getAdminNav(t) {
  return [
    { to: '/admin', label: t('header.controlRoom'), end: true },
    { to: '/admin?focus=advertisers', label: t('header.advertisers') },
    { to: '/admin?focus=studio', label: t('header.creativeStudio') },
    { to: '/admin?focus=launches', label: t('header.launches') },
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

  const navItems = admin ? getAdminNav(t) : agency ? getAgencyNav(t) : getAdvertiserNav(t);
  const identity = admin
    ? 'Philosify Admin'
    : agency
      ? agencyUser?.company_name || agencyUser?.email || 'Agency'
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

  return (
    <header className="studio-header">
      <div className="studio-header__brand">
        <img src={LOGO} alt="Philosify" className="studio-header__logo" />
        <div>
          <p className="studio-header__eyebrow">{eyebrow}</p>
          <h1 className="studio-header__title">{BRAND}</h1>
        </div>
      </div>

      <nav className="studio-header__nav" aria-label={`${badge} navigation`}>
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
