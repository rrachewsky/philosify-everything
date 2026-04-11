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
                These rules protect the Philosify audience, advertisers, agencies, and the platform.
                All campaigns, creatives, landing pages, claims, and targeting choices must comply
                with this policy at all times.
              </p>
            </div>
          </section>

          <section className="surface-card stack">
            <div>
              <p className="eyebrow">{t('policy.responsibility')}</p>
              <h3>{t('policy.responsibilityText')}</h3>
            </div>
            <p className="helper-text">
              The advertiser and, where applicable, the agency are fully and solely responsible for
              all ads posted through Philosify Ads, including creative assets, copy, claims,
              disclosures, targeting inputs, landing pages, offers, products, services, and legal
              compliance.
            </p>
            <p className="helper-text">
              This responsibility applies whether the ad was created entirely by the advertiser or
              agency, adapted with Philosify tools, or prepared with any creative assistance,
              drafting, formatting, or mock production provided by Philosify. Philosify&apos;s creative
              assistance does not transfer ownership, legal responsibility, or compliance
              responsibility away from the advertiser or agency.
            </p>
            <div className="detail-list">
              <div>
                <span>You remain responsible for</span>
                <strong>Accuracy, legality, permissions, rights, disclosures, and destination pages</strong>
              </div>
              <div>
                <span>Philosify may</span>
                <strong>Reject, pause, limit, or remove any ad at any time</strong>
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
                <li>Lawful products and services presented accurately and in good faith.</li>
                <li>Educational, cultural, literary, artistic, and technology-related offers.</li>
                <li>Apps, platforms, courses, books, events, subscriptions, and media brands.</li>
                <li>Brand campaigns with clear identity, honest claims, and functional landing pages.</li>
                <li>Comparative or persuasive messaging that is truthful, substantiated, and not deceptive.</li>
                <li>Creative that respects intellectual property, privacy rights, and publicity rights.</li>
              </ul>
            </section>

            <section className="surface-card stack">
              <div>
                <p className="eyebrow">{t('policy.prohibited')}</p>
                <h3>{t('policy.prohibited')}</h3>
              </div>
              <ul className="bullet-list">
                <li>Illegal products, illegal services, or content promoting unlawful activity.</li>
                <li>False, misleading, unverifiable, or deceptive claims, pricing, or offers.</li>
                <li>Malware, phishing, spyware, credential harvesting, or unsafe downloads.</li>
                <li>Hate speech, harassment, extremist propaganda, or incitement to violence.</li>
                <li>Adult sexual content, sexual exploitation, or content inappropriate for a broad audience.</li>
                <li>Counterfeit goods, intellectual-property infringement, or unauthorized use of third-party assets.</li>
                <li>Fraud, scams, impersonation, fake endorsements, fake reviews, or fabricated urgency.</li>
                <li>Weapons, human exploitation, or prohibited drug-related content.</li>
                <li>Gambling, sweepstakes, financial, health, or legal claims that lack required approvals or disclosures.</li>
                <li>Landing pages that are broken, unsafe, misleading, or materially inconsistent with the ad.</li>
              </ul>
            </section>
          </div>

          <section className="surface-card stack">
            <div>
              <p className="eyebrow">{t('policy.operations')}</p>
              <h3>{t('policy.operations')}</h3>
            </div>
            <ul className="bullet-list">
              <li>Submission does not guarantee approval, launch, continued delivery, or uninterrupted distribution.</li>
              <li>Philosify may request edits, supporting documentation, or additional disclosures before launch.</li>
              <li>Philosify may reject, suspend, throttle, or remove ads for policy, security, quality, legal, or brand-safety reasons.</li>
              <li>Philosify may act immediately where there is suspected abuse, fraud, impersonation, malware, or policy evasion.</li>
              <li>Advertisers and agencies must maintain records and substantiation for objective claims when requested.</li>
              <li>Repeated or serious violations may result in account suspension, campaign cancellation, or permanent bans.</li>
            </ul>
          </section>

          <section className="surface-card stack">
            <div>
              <p className="eyebrow">{t('policy.warranties')}</p>
              <h3>{t('policy.warranties')}</h3>
            </div>
            <ul className="bullet-list">
              <li>You have the rights, licenses, consents, and authority needed to publish the ad and destination content.</li>
              <li>You will comply with all applicable laws, regulations, platform rules, and required disclosures.</li>
              <li>You will not use Philosify Ads to evade enforcement, hide ownership, or misrepresent products or services.</li>
              <li>You accept full responsibility for third-party claims, investigations, disputes, and liabilities arising from your ads.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Policy;
