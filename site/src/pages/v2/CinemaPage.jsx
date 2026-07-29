// CinemaPage - v2 stub (WP3 build in progress; page-builder replaces this file)
import { useTranslation } from 'react-i18next';
import { PageShell, ModuleHeader } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';

export default function CinemaPage() {
  const { t } = useTranslation();
  return (
    <PageShell status="Analysis Engine // Active" nav={<NavAccount />}>
      <ModuleHeader title={t('v2.cinema.title', 'CINEMA')} />
      <div className="mnote">Preview build in progress.</div>
      <V2ModalsHost />
    </PageShell>
  );
}
