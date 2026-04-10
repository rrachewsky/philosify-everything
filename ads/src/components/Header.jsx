import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useAdmin } from '@contexts/AdminContext';
import { useAgency } from '@contexts/AgencyContext';

const BRAND = 'Philosify Ads Atelier';
const LOGO = '/logo.png';

const advertiserNav = [
  { to: '/app', label: 'Overview', end: true },
  { to: '/app/campaigns', label: 'Campaigns' },
  { to: '/app/new', label: 'New Campaign' },
  { to: '/app/analytics', label: 'Analytics' },
  { to: '/app/billing', label: 'Billing' },
  { to: '/app/placements', label: 'Placements' },
  { to: '/app/settings', label: 'Settings' },
];

const adminNav = [
  { to: '/admin', label: 'Control Room', end: true },
  { to: '/admin?focus=advertisers', label: 'Advertisers' },
  { to: '/admin?focus=studio', label: 'Creative Studio' },
  { to: '/admin?focus=launches', label: 'Launches' },
];

const agencyNav = [
  { to: '/agency', label: 'Dashboard', end: true },
  { to: '/agency/clients', label: 'Clients' },
  { to: '/agency/earnings', label: 'Earnings' },
];

function Header({ admin = false, agency = false }) {
  const { advertiser, logout: advertiserLogout } = useAuth();
  const { logout: adminLogout } = useAdmin();
  const { agency: agencyUser, logout: agencyLogout } = useAgency();
  const navigate = useNavigate();

  const navItems = admin ? adminNav : agency ? agencyNav : advertiserNav;
  const identity = admin
    ? 'Philosify Admin'
    : agency
      ? agencyUser?.company_name || agencyUser?.email || 'Agency'
      : advertiser?.company_name || advertiser?.email;
  const badge = admin ? 'Admin' : agency ? 'Agency' : 'Advertiser';
  const eyebrow = admin
    ? 'Operations Atelier'
    : agency
      ? 'Agency Atelier'
      : 'Commercial Atelier';

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
        <button type="button" className="btn btn--ghost" onClick={handleLogout}>
          {admin ? 'Lock atelier' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}

export default Header;
