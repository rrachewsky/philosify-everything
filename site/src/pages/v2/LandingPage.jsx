// LandingPage - v2 landing (MASTER: new_design/philosify-landing.html).
// Masthead lockup → tagline → rail with account line → "Select a module"
// → 3×3 module grid (Law §4 order, Unsafe Zone inverted) → landing footer.
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GridVeil, Lockup } from '../../components/common';
import { HudFrame, NavChrome, Cell, FooterV2, ThemeBar } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import { useAuth } from '../../hooks/useAuth';
import { useCreditsContext } from '../../contexts/CreditsContext';
import '../../styles/v2-components.css';

const MODULES = [
  ['music', 'MUSIC', 'Search <hl>1.7M songs</hl> via Spotify and Genius and receive a philosophical analysis of the lyrics, with audio playback.'],
  ['cinema', 'CINEMA', "Philosophical analysis of <hl>over 1.3 million films</hl> from the TMDb catalog — themes, characters and ideas."],
  ['literature', 'LITERATURE', 'Philosophical analysis of <hl>over 40 million books</hl> from the Google Books catalog, by scan or philosopher panel.'],
  ['news', 'NEWS', "Analysis of current news: the source and its bias, where it errs and where it is right, and <hl>Philosify's opinion</hl>."],
  ['ideas', 'IDEAS', 'Debates and colloquiums between historical philosophers, <hl>in character</hl>, on questions you propose.'],
  ['history', 'HISTORY', 'An interactive globe and timeline of <hl>over 300 philosophers</hl>, their schools and events across 2,600 years.'],
  ['quiz', 'QUIZ', 'A questionnaire that identifies which <hl>premises you actually hold</hl>.'],
  ['community', 'COMMUNITY', 'Member profiles, groups, direct messages and public debates, in <hl>18 languages</hl>.'],
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
  const { isAuthenticated } = useAuth();
  const { balance } = useCreditsContext();

  return (
    <div className="v2" style={{ display: 'flex', flexDirection: 'column' }}>
      <GridVeil />
      <div className="hudground" aria-hidden="true" />
      <HudFrame status={t('v2.landing.status', 'Analysis Engine // Active')} />
      <NavChrome>
        <NavAccount />
      </NavChrome>

      <div className="page" style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingTop: 0 }}>
        <header className="masthead">
          <div className="rv lock-plate" style={{ animationDelay: '.08s', display: 'flex', justifyContent: 'center' }}>
            <Lockup variant="landing" />
          </div>
          <div className="tagline rv" style={{ animationDelay: '.3s' }}>
            {t('v2.landing.tagline', 'The final word is always yours')}
          </div>
        </header>

        <div>
          <div className="rail" aria-hidden="true" />
          <div className="rail-label rv" style={{ animationDelay: '.6s' }}>
            {isAuthenticated ? (
              <>
                <a
                  className="acct"
                  href="#balance"
                  onClick={(e) => {
                    e.preventDefault();
                    window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
                  }}
                >
                  {t('v2.nav.balance', 'Balance')}: <b className="hl">{balance?.total ?? 0} {t('v2.commerce.credits', 'Credits')}</b>
                </a>
                <span className="acct-links">
                  <a
                    className="acct"
                    href="#buy"
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('v2-open-buy-credits'));
                    }}
                  >
                    {t('v2.nav.buyCredits', 'Buy Credits')}
                  </a>
                  <a
                    className="acct"
                    href="#history"
                    onClick={(e) => {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('v2-open-history'));
                    }}
                  >
                    {t('v2.nav.history', 'History')}
                  </a>
                </span>
              </>
            ) : (
              <>
                <span>{t('v2.landing.guestLine', 'Two free analyses on signup')}</span>
                <span className="acct-links">
                  <Link className="acct" to="/signup">
                    {t('v2.nav.signUp', 'Sign up')}
                  </Link>
                  <Link className="acct" to="/signin">
                    {t('v2.nav.signIn', 'Sign in')}
                  </Link>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="selectline rv" style={{ animationDelay: '.58s', marginTop: 30 }}>
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
              style={{ animationDelay: `${0.62 + i * 0.05}s` }}
            >
              <HlText text={t(`v2.landing.cells.${slug}.desc`, desc)} />
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
