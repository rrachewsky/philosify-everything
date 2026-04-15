import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function FloatingActionButton() {
  const { t } = useTranslation();
  const location = useLocation();

  // Don't show FAB on certain pages
  const hiddenPaths = ['/app/new', '/', '/login', '/signup', '/admin', '/agency'];
  const shouldHide = hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <Link to="/app/new" className="fab" title={t('dashboard.newCampaign')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </Link>
  );
}

export default FloatingActionButton;
