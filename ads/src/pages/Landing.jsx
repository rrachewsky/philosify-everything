import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const LOGO = '/logo.png';

function Landing() {
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
            Placements
          </Link>
          <Link to="/login" className="btn btn--ghost">
            Sign in
          </Link>
          <Link to={isAuthenticated ? '/app' : '/signup'} className="btn btn--primary">
            {isAuthenticated ? 'Open atelier' : 'Apply now'}
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="hero-panel">
          <div className="hero-panel__copy">
            <p className="eyebrow">Curated advertising for a cultivated audience</p>
            <h1>Launch campaigns with the pace of a studio and the taste of an atelier.</h1>
            <p className="lead">
              Philosify Ads is a premium placement program for brands that want to appear beside
              reflective music analysis, discovery, and cultural exploration.
            </p>
            <div className="hero-panel__cta">
              <Link to={isAuthenticated ? '/app/new' : '/signup'} className="btn btn--primary btn--large">
                {isAuthenticated ? 'Create a campaign' : 'Start your campaign'}
              </Link>
              <Link to="/placements" className="btn btn--secondary btn--large">
                Explore placements
              </Link>
            </div>
            <div className="hero-metrics">
              <div className="metric-card">
                <span className="metric-card__value">2</span>
                <span className="metric-card__label">Placement formats in v1</span>
              </div>
              <div className="metric-card">
                <span className="metric-card__value">Self-serve</span>
                <span className="metric-card__label">Creative upload and campaign setup</span>
              </div>
              <div className="metric-card">
                <span className="metric-card__value">Automated</span>
                <span className="metric-card__label">Approval and launch workflow</span>
              </div>
            </div>
          </div>

          <div className="hero-panel__art">
            <div className="atelier-card">
              <p className="atelier-card__eyebrow">Campaign journey</p>
              <ol className="atelier-steps">
                <li>Shape the brief and budget</li>
                <li>Upload assets or request a mock</li>
                <li>Review, approve, and launch</li>
              </ol>
            </div>
            <div className="atelier-card atelier-card--accent">
              <p className="atelier-card__eyebrow">Why brands choose this</p>
              <p>
                Thoughtful context, elegant presentation, clear approvals, and direct access to
                Philosify’s team when the campaign needs polish.
              </p>
            </div>
          </div>
        </section>

        <section className="editorial-grid">
          <article className="editorial-card">
            <p className="eyebrow">How it works</p>
            <h2>Simple for advertisers. Clear for operators.</h2>
            <p>
              Submit a brief, define your budget, pay securely, review the creative, and track the
              campaign from a single dashboard.
            </p>
          </article>
          <article className="editorial-card">
            <p className="eyebrow">Studio support</p>
            <h2>Bring your own creative or commission one from Philosify.</h2>
            <p>
              Static creatives are supported today. If you want Philosify to craft the visual, the
              mock enters a review loop before launch.
            </p>
          </article>
          <article className="editorial-card">
            <p className="eyebrow">Trust</p>
            <h2>Reviewed, scheduled, and launched with care.</h2>
            <p>
              Every campaign passes through an approval flow so the experience stays premium for
              both audiences and partners.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default Landing;
