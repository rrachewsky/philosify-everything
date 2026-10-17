import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// Visual mockup of Philosify analysis page with sidebar ad
function SidebarMockup({ t }) {
  return (
    <div className="mockup mockup--sidebar">
      {/* Browser chrome */}
      <div className="mockup__browser">
        <div className="mockup__browser-dots">
          <span></span><span></span><span></span>
        </div>
        <div className="mockup__browser-url">philosify.org/analysis</div>
      </div>
      
      {/* Page content */}
      <div className="mockup__page">
        {/* Header */}
        <div className="mockup__header">
          <div className="mockup__logo">Philosify</div>
          <div className="mockup__nav">
            <span></span><span></span><span></span>
          </div>
        </div>
        
        {/* Main layout */}
        <div className="mockup__layout">
          {/* Main content - Analysis in progress */}
          <div className="mockup__main">
            <div className="mockup__song-info">
              <div className="mockup__album-art"></div>
              <div className="mockup__song-meta">
                <div className="mockup__song-title"></div>
                <div className="mockup__song-artist"></div>
              </div>
            </div>
            <div className="mockup__progress">
              <div className="mockup__progress-bar">
                <div className="mockup__progress-fill"></div>
              </div>
              <div className="mockup__progress-text">{t('placements.mockupAnalyzing')}</div>
            </div>
            <div className="mockup__skeleton">
              <div className="mockup__skeleton-line"></div>
              <div className="mockup__skeleton-line mockup__skeleton-line--short"></div>
              <div className="mockup__skeleton-line"></div>
            </div>
          </div>
          
          {/* Sidebar - AD PLACEMENT */}
          <div className="mockup__sidebar">
            <div className="mockup__ad-slot mockup__ad-slot--highlight">
              <div className="mockup__ad-label">{t('placements.mockupYourAdHere')}</div>
              <div className="mockup__ad-size">{t('placements.mockupAdSize300')}</div>
              <div className="mockup__ad-arrow"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPlacements(t) {
  return [
    {
      id: 'sidebar',
      name: t('placements.sidebarName'),
      description: t('placements.sidebarFullDesc'),
      context: t('placements.sidebarContext'),
      durations: [
        { seconds: 5, cpm: 10 },
        { seconds: 10, cpm: 20 },
        { seconds: 15, cpm: 30 },
        { seconds: 20, cpm: 40 },
        { seconds: 30, cpm: 60 },
      ],
      specs: {
        dimensions: t('placements.sidebarDimensions'),
        formats: t('placements.sidebarFormats'),
        maxSize: t('placements.sidebarMaxSize'),
      },
      features: [
        t('placements.sidebarFeature1'),
        t('placements.sidebarFeature2'),
        t('placements.sidebarFeature3'),
        t('placements.sidebarFeature4'),
      ],
      MockupComponent: SidebarMockup,
    },
  ];
}

function Placements({ publicView = false }) {
  const { t } = useTranslation();
  const PLACEMENTS = getPlacements(t);
  return (
    <div className="page-stack">
      <section className="section-heading">
        <div>
          <p className="eyebrow">{t('placements.title')}</p>
          <h2>{t('placements.title')}</h2>
          <p className="lead">
            {t('placements.subtitle')}
          </p>
        </div>
        <Link to={publicView ? '/signup' : '/app/new'} className="btn btn--primary">
          {publicView ? t('common.signUp') : t('create.createCampaign')}
        </Link>
      </section>

      <div className="placements-detailed">
        {PLACEMENTS.map((placement) => (
          <section key={placement.id} className="placement-detail">
            <div className="placement-detail__mockup">
              <placement.MockupComponent t={t} />
            </div>
            <div className="placement-detail__info">
              <p className="eyebrow">{t('placements.placementLabel')}</p>
              <h3>{placement.name}</h3>
              <p>{placement.description}</p>
              <div className="detail-list">
                <div><span>{t('placements.contextLabel')}</span><strong>{placement.context}</strong></div>
                <div><span>{t('placements.specsLabel')}</span><strong>{placement.specs.dimensions} · {placement.specs.formats}</strong></div>
                <div><span>{t('placements.maxAssetLabel')}</span><strong>{placement.specs.maxSize}</strong></div>
              </div>
              <ul className="bullet-list">
                {placement.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <div className="choice-row choice-row--wrap">
                {placement.durations.map((duration) => (
                  <span key={duration.seconds} className="choice-pill choice-pill--static">
                    {duration.seconds}s · ${duration.cpm} CPM
                  </span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default Placements;
