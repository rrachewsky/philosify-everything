// LandingPage - v2 landing (MASTER: new_design/philosify-landing.html,
// C.3 header ruling 30 Jul): fixed header band (lockup + tagline +
// session chrome) → "Select a module" → 3×3 module grid (Law §4 order,
// Unsafe Zone inverted) → landing footer. Session chrome lives ONLY in
// the header; the old masthead and account rail are retired.
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GridVeil } from '../../components/common';
import { HudFrame, HeaderBar, Cell, FooterV2, ThemeBar } from '../../components/v2';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { CATALOG } from '../../config/catalog';
import '../../styles/v2-components.css';

// Counts interpolate from CATALOG (telemetry honesty — spec §5b).
const MODULES = [
  ['music', 'MUSIC', 'Search <hl>{{songs}} songs</hl> via Spotify and Genius and receive a philosophical analysis of the lyrics, with audio playback.'],
  ['cinema', 'CINEMA', "Philosophical analysis of <hl>over {{films}} films</hl> from the TMDb catalog — themes, characters and ideas."],
  ['literature', 'LITERATURE', 'Philosophical analysis of <hl>over {{books}} books</hl> from the Google Books catalog, by scan or philosopher panel.'],
  ['news', 'NEWS', "Analysis of current news: the source and its bias, where it errs and where it is right, and <hl>Philosify's opinion</hl>."],
  ['ideas', 'IDEAS', 'Debates and colloquiums between historical philosophers, <hl>in character</hl>, on questions you propose.'],
  ['history', 'HISTORY', 'An interactive globe and timeline of <hl>{{philosophers}} philosophers</hl>, their schools and events across 2,600 years.'],
  ['quiz', 'QUIZ', 'A questionnaire that identifies which <hl>premises you actually hold</hl>.'],
  ['community', 'COMMUNITY', 'Member profiles, groups, direct messages and public debates, in <hl>{{locales}} languages</hl>.'],
  ['unsafe-zone', 'UNSAFE ZONE', 'No dogmas. No fallacies. No fantasy. No evasions. Bring your real questions. And answers.'],
];

// Renders mockup copy with its single silver phrase (<hl>…</hl> marker).
function HlText({ text }) {
  const m = text.match(/^(.*?)<hl>(.*?)<\/hl>(.*)$/s);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span className="hl">{m[2]}</span>
      {m[3]}
    </>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="v2 hdr-tagged" style={{ display: 'flex', flexDirection: 'column' }}>
      <GridVeil />
      <HeaderBar
        tagline={t('v2.landing.tagline', 'The final word is always yours')}
        status={t('v2.landing.status', 'Analysis Engine // Active')}
      />
      <HudFrame />

      <div className="page" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="selectline rv" style={{ animationDelay: '.18s' }}>
          {t('v2.landing.select', 'Select a module')}
        </div>

        <main className="modules" style={{ marginTop: 14 }}>
          {MODULES.map(([slug, title, desc], i) => (
            <Cell
              key={slug}
              variant="landing"
              inverted={slug === 'unsafe-zone'}
              to={`/${slug}`}
              title={t(`v2.landing.cells.${slug}.title`, title)}
              className="rv"
              style={{ animationDelay: `${0.22 + i * 0.05}s` }}
            >
              <HlText text={t(`v2.landing.cells.${slug}.desc`, { defaultValue: desc, ...CATALOG })} />
            </Cell>
          ))}
        </main>

        <FooterV2 variant="landing">
          <a href="https://philosify.org">philosify.org</a>
          <a href="https://ads.philosify.org" target="_blank" rel="noopener noreferrer">
            {t('v2.landing.adsAtelier', 'Ads Ateliê')}
          </a>
          <a
            href="#buy"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
            }}
          >
            {t('v2.nav.buyCredits', 'Buy Credits')}
          </a>
          <a href="/tos" onClick={(e) => { e.preventDefault(); navigate('/tos'); }}>
            {t('v2.landing.terms', 'Terms')}
          </a>
          <a href="/pp" onClick={(e) => { e.preventDefault(); navigate('/pp'); }}>
            {t('v2.landing.privacy', 'Privacy')}
          </a>
          <a href="#c">© 2026</a>
        </FooterV2>
      </div>

      <ThemeBar />
      <V2ModalsHost />
    </div>
  );
}
