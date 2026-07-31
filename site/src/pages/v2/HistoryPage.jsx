// HistoryPage - v2 History module (new_design/philosify-history.html).
// Template chrome + threshold into the full-bleed Living Globe (Shell C).
// Addendum 5: constellation internals are NOT rethemed — we mount the
// existing HistorySidebar (error boundary + scroll lock) untouched.
// Free module — no credits. Ad-free surface (spec §10).
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageShell, ModuleHeader, BreakingTicker, Cell, Pill } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { HistorySidebar } from '../../components/history';

// label = mockup wording (unchanged); school = node.school value in the
// constellation data (SCHOOL_COLORS keys) — three differ from the labels.
const SCHOOL_PILLS = [
  { label: 'Stoicism', school: 'Stoic' },
  { label: 'Pre-Socratics', school: 'Pre-Socratic' },
  { label: 'Enlightenment', school: 'Enlightenment' },
  { label: 'German Idealism', school: 'German Idealism' },
  { label: 'Objectivism', school: 'Objectivist' },
];

export default function HistoryPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [globeOpen, setGlobeOpen] = useState(searchParams.get('enter') === '1');
  const [initialSchool, setInitialSchool] = useState(null);

  useEffect(() => {
    if (searchParams.get('enter') === '1' && !globeOpen) setGlobeOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Single open path: pills pass their school; other entries clear it.
  const openGlobe = (school = null) => {
    setInitialSchool(school);
    setGlobeOpen(true);
  };

  const closeGlobe = () => {
    setGlobeOpen(false);
    setInitialSchool(null);
    if (searchParams.get('enter')) setSearchParams({}, { replace: true });
  };

  return (
    <PageShell status={t('v2.history.status', 'Temporal Sync // Active')} nav={<NavAccount />}>
      {/* Universal ticker anatomy (C.4): BREAKING label + rolling feed of
          historical events (locale line split on the >>> separator). */}
      <ModuleHeader title={t('v2.history.title', 'HISTORY')}>
        <BreakingTicker
          label={`${t('v2.news.breaking', 'Breaking')} >>>`}
          items={t(
            'v2.history.eventsLine',
            'Aristotle begins tutoring Alexander — 343 BCE >>> Hypatia teaches in Alexandria — c. 400 CE'
          )
            .split(/\s*>>>\s*/)
            .filter(Boolean)
            .map((title) => ({ title }))}
          onSelect={() => openGlobe()}
        />
      </ModuleHeader>

      <div style={{ marginTop: 22 }}>
        <Cell
          href="#globe"
          title={t('v2.history.enterTitle', 'ENTER THE LIVING GLOBE')}
          onClick={(e) => {
            e.preventDefault();
            openGlobe();
          }}
          style={{ minHeight: 180, justifyContent: 'center' }}
        >
          {t(
            'v2.history.enterDesc',
            'Philosophers and events rise over their regions. Timeline scrub below. Ad-free surface.'
          )}
        </Cell>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {/* Pill renders a span and spreads props (a style prop would clobber
              the silver variant), so interactivity goes in via role/tabIndex
              and the cursor via .hist-school-pill (history-ui.css). */}
          {SCHOOL_PILLS.map(({ label, school }, i) => (
            <Pill
              key={school}
              silver={i === 0}
              className="hist-school-pill"
              role="button"
              tabIndex={0}
              onClick={() => openGlobe(school)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openGlobe(school);
                }
              }}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      <HistorySidebar isOpen={globeOpen} onClose={closeGlobe} initialSchool={initialSchool} />
      <V2ModalsHost />
    </PageShell>
  );
}
