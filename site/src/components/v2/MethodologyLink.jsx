// MethodologyLink - the one entry point to /methodology, reused wherever a
// verdict/scorecard is shown (ruling 1 Sep 2026: the yardstick must be one
// click away from every analysis). Label from v2.legal.methodologyLink.
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function MethodologyLink({ className = '' }) {
  const { t } = useTranslation();
  return (
    <Link to="/methodology" className={`mlink${className ? ` ${className}` : ''}`}>
      {t('v2.legal.methodologyLink', 'Methodology')} →
    </Link>
  );
}

export default MethodologyLink;
