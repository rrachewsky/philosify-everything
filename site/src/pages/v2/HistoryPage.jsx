// HistoryPage - v2 History module (new_design/philosify-history.html).
// Template chrome + threshold into the full-bleed Living Globe (Shell C).
// Addendum 5: constellation internals are NOT rethemed — we mount the
// existing HistorySidebar (error boundary + scroll lock) untouched.
// Free module — no credits. Ad-free surface (spec §10).
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell, ModuleHeader, Ticker, Cell, Pill } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { HistorySidebar } from '../../components/history';

const SCHOOL_PILLS = ['Stoicism', 'Pre-Socratics', 'Enlightenment', 'German Idealism', 'Objectivism'];

export default function HistoryPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [globeOpen, setGlobeOpen] = useState(searchParams.get('enter') === '1');

  useEffect(() => {
    if (searchParams.get('enter') === '1' && !globeOpen) setGlobeOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const closeGlobe = () => {
    setGlobeOpen(false);
    if (searchParams.get('enter')) setSearchParams({}, { replace: true });
  };

  return (
    <PageShell status={t('v2.history.status', 'Temporal Sync // Active')} nav={<NavAccount />}>
      <ModuleHeader title={t('v2.history.title', 'HISTORY')}>
        <Ticker stat={t('v2.history.stat', 'The Living Globe')}>
          {t('v2.history.tickerLine', 'Temporal sync // Shell C')}
        </Ticker>
      </ModuleHeader>

      <div style={{ marginTop: 22 }}>
        <Cell
          href="#globe"
          title={t('v2.history.enterTitle', 'ENTER THE LIVING GLOBE')}
          onClick={(e) => {
            e.preventDefault();
            setGlobeOpen(true);
          }}
          style={{ minHeight: 180, justifyContent: 'center' }}
        >
          {t(
            'v2.history.enterDesc',
            'Philosophers and events rise over their regions. Timeline scrub below. Ad-free surface.'
          )}
        </Cell>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {SCHOOL_PILLS.map((school, i) => (
            <Pill key={school} silver={i === 0}>
              {school}
            </Pill>
          ))}
        </div>

        <Ticker stat={t('v2.history.countStat', 'Over 300 philosophers')}>
          {t(
            'v2.history.eventsLine',
            'Aristotle begins tutoring Alexander — 343 BCE /// Hypatia teaches in Alexandria — c. 400 CE'
          )}
        </Ticker>
      </div>

      <HistorySidebar isOpen={globeOpen} onClose={closeGlobe} />
      <V2ModalsHost />
    </PageShell>
  );
}
