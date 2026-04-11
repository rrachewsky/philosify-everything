import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@contexts/AuthContext';
import LanguageSelector from '@components/LanguageSelector';

const LOGO = '/logo.png';

function Landing() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-topbar__brand">
          <img src={LOGO} alt="Philosify" />
          <div>
            <p className="landing-topbar__eyebrow">Philosify Commercial Atelier</p>
            <strong>Ads Atelier</strong>
          </div>
        </div>
        <div className="landing-topbar__actions">
          <Link to="/placements" className="btn btn--ghost">
            {t('landing.placements')}
          </Link>
          <Link to="/policy" className="btn btn--ghost">
            {t('landing.policy')}
          </Link>
          <Link to="/agency/login" className="btn btn--ghost">
            {t('landing.agencies')}
          </Link>
          <Link to="/login" className="btn btn--ghost">
            {t('common.signIn')}
          </Link>
          <Link to={isAuthenticated ? '/app' : '/signup'} className="btn btn--primary">
            {isAuthenticated ? t('landing.openAtelier') : t('landing.applyNow')}
          </Link>
        </div>
      </header>

      <main className="landing-main">
        {/* Language Selector */}
        <LanguageSelector />

        <section className="hero-panel">
          <div className="hero-panel__copy">
            <p className="eyebrow">{t('landing.hero')}</p>
            <h1>{t('landing.heroSub')}</h1>
            <div className="hero-panel__cta">
              <Link to={isAuthenticated ? '/app/new' : '/signup'} className="btn btn--primary btn--large">
                {t('landing.ctaCreate')}
              </Link>
              <Link to="/placements" className="btn btn--secondary btn--large">
                {t('landing.ctaExplore')}
              </Link>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <span className="metric-card__value">2</span>
                <span className="metric-card__label">{t('landing.metricsFormats')}</span>
              </div>
              <div className="metric-card">
                <span className="metric-card__value">{t('landing.metricsSelfServe')}</span>
              </div>
              <div className="metric-card">
                <span className="metric-card__value">{t('landing.metricsAutomated')}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="editorial-grid">
          <article className="editorial-card">
            <p className="eyebrow">{t('landing.howItWorks')}</p>
            <h2>{t('landing.howItWorksTitle')}</h2>
            <p>{t('landing.howItWorksDesc')}</p>
          </article>
          <article className="editorial-card">
            <h2>{t('landing.studioTitle')}</h2>
            <p>{t('landing.studioDesc')}</p>
          </article>
          <article className="editorial-card">
            <h2>{t('landing.trustTitle')}</h2>
            <p>{t('landing.trustDesc')}</p>
          </article>
          <article className="editorial-card">
            <h2>{t('landing.agencyTitle')}</h2>
            <p>{t('landing.agencyDesc')}</p>
            <Link to="/agency/signup" className="btn btn--secondary" style={{ marginTop: '12px' }}>
              {t('landing.agencyRegister')}
            </Link>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Landing;
