import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

function Policy() {
  const { t } = useTranslation();
  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-topbar__brand">
          <img src="/logo.png" alt="Philosify" />
          <div>
            <p className="landing-topbar__eyebrow">Commercial Atelier</p>
            <strong>{t('policy.title')}</strong>
          </div>
        </div>
        <div className="landing-topbar__actions">
          <Link to="/" className="btn btn--ghost">
            {t('common.back')}
          </Link>
          <Link to="/placements" className="btn btn--ghost">
            {t('landing.placements')}
          </Link>
          <Link to="/signup" className="btn btn--primary">
            {t('landing.ctaCreate')}
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <div className="page-stack">
          <section className="section-heading">
            <div>
              <p className="eyebrow">{t('policy.title')}</p>
              <h2>{t('policy.title')}</h2>
              <p className="lead">
                {t('policy.policyLead')}
              </p>
            </div>
          </section>

          <section className="surface-card stack">
            <div>
              <p className="eyebrow">{t('policy.responsibility')}</p>
              <h3>{t('policy.responsibilityText')}</h3>
            </div>
            <p className="helper-text">
              {t('policy.responsibilityFull')}
            </p>
            <p className="helper-text">
              {t('policy.responsibilityCreative')}
            </p>
            <div className="detail-list">
              <div>
                <span>{t('policy.responsibleFor')}</span>
                <strong>{t('policy.responsibleForValue')}</strong>
              </div>
              <div>
                <span>{t('policy.philosifyMay')}</span>
                <strong>{t('policy.philosifyMayValue')}</strong>
              </div>
            </div>
          </section>

          <div className="editorial-grid">
            <section className="surface-card stack">
              <div>
                <p className="eyebrow">{t('policy.permitted')}</p>
                <h3>{t('policy.permitted')}</h3>
              </div>
              <ul className="bullet-list">
                <li>{t('policy.permitted1')}</li>
                <li>{t('policy.permitted2')}</li>
                <li>{t('policy.permitted3')}</li>
                <li>{t('policy.permitted4')}</li>
                <li>{t('policy.permitted5')}</li>
                <li>{t('policy.permitted6')}</li>
              </ul>
            </section>

            <section className="surface-card stack">
              <div>
                <p className="eyebrow">{t('policy.prohibited')}</p>
                <h3>{t('policy.prohibited')}</h3>
              </div>
              <ul className="bullet-list">
                <li>{t('policy.prohibited1')}</li>
                <li>{t('policy.prohibited2')}</li>
                <li>{t('policy.prohibited3')}</li>
                <li>{t('policy.prohibited4')}</li>
                <li>{t('policy.prohibited5')}</li>
                <li>{t('policy.prohibited6')}</li>
                <li>{t('policy.prohibited7')}</li>
                <li>{t('policy.prohibited8')}</li>
                <li>{t('policy.prohibited9')}</li>
                <li>{t('policy.prohibited10')}</li>
              </ul>
            </section>
          </div>

          <section className="surface-card stack">
            <div>
              <p className="eyebrow">{t('policy.operations')}</p>
              <h3>{t('policy.operations')}</h3>
            </div>
            <ul className="bullet-list">
              <li>{t('policy.operations1')}</li>
              <li>{t('policy.operations2')}</li>
              <li>{t('policy.operations3')}</li>
              <li>{t('policy.operations4')}</li>
              <li>{t('policy.operations5')}</li>
              <li>{t('policy.operations6')}</li>
            </ul>
          </section>

          <section className="surface-card stack">
            <div>
              <p className="eyebrow">{t('policy.warranties')}</p>
              <h3>{t('policy.warranties')}</h3>
            </div>
            <ul className="bullet-list">
              <li>{t('policy.warranties1')}</li>
              <li>{t('policy.warranties2')}</li>
              <li>{t('policy.warranties3')}</li>
              <li>{t('policy.warranties4')}</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Policy;
