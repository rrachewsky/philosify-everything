// ============================================================
// AD PREVIEW - Shows how an ad will appear in Philosify
// ============================================================
// Used in: CreateCampaign (live preview), PlanDetail, Placements
// Renders the ad creative inside a simulated Philosify UI shell.

import { useState } from 'react';

const DEMO_CREATIVES = {
  sidebar: {
    url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/></linearGradient></defs>
      <rect width="300" height="250" fill="url(#g)"/>
      <text x="150" y="100" text-anchor="middle" fill="#c9a861" font-family="serif" font-size="22" font-weight="bold">Your Ad Here</text>
      <text x="150" y="130" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="13">300 x 250 — Sidebar Placement</text>
      <rect x="90" y="160" width="120" height="36" rx="8" fill="#c9a861"/>
      <text x="150" y="183" text-anchor="middle" fill="#0a0a0f" font-family="sans-serif" font-size="13" font-weight="bold">Learn More</text>
    </svg>`),
    label: 'Sidebar Interstitial',
  },
  constellation: {
    url: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="250" height="120" viewBox="0 0 250 120">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f0f1a"/><stop offset="100%" stop-color="#1a1a2e"/></linearGradient></defs>
      <rect width="250" height="120" fill="url(#g)" rx="8"/>
      <text x="125" y="50" text-anchor="middle" fill="#c9a861" font-family="serif" font-size="16" font-weight="bold">Your Ad Here</text>
      <text x="125" y="75" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="11">250 x 120 — Constellation</text>
    </svg>`),
    label: 'Constellation Panel',
  },
};

function PhilosifyShell({ placement, children }) {
  if (placement === 'sidebar') {
    return (
      <div className="preview-shell preview-shell--sidebar">
        <div className="preview-shell__browser">
          <div className="preview-shell__dots">
            <span /><span /><span />
          </div>
          <div className="preview-shell__url">philosify.org</div>
        </div>
        <div className="preview-shell__content">
          <div className="preview-shell__main">
            <div className="preview-shell__skeleton">
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-line" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
            <div className="preview-shell__skeleton">
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line--short" />
            </div>
          </div>
          <div className="preview-shell__sidebar">
            <div className="preview-shell__ad-slot">
              <span className="preview-shell__sponsored">Sponsored</span>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Constellation placement
  return (
    <div className="preview-shell preview-shell--constellation">
      <div className="preview-shell__browser">
        <div className="preview-shell__dots">
          <span /><span /><span />
        </div>
        <div className="preview-shell__url">philosify.org/constellation</div>
      </div>
      <div className="preview-shell__content preview-shell__content--constellation">
        <div className="preview-shell__starfield">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="preview-shell__star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
          <div className="preview-shell__node" style={{ left: '30%', top: '40%' }}>Aristotle</div>
          <div className="preview-shell__node" style={{ left: '60%', top: '25%' }}>Kant</div>
          <div className="preview-shell__node" style={{ left: '45%', top: '65%' }}>Rand</div>
        </div>
        <div className="preview-shell__constellation-ad">
          <span className="preview-shell__sponsored">Sponsored</span>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdPreview({
  placement = 'sidebar',
  creativeUrl,
  targetUrl,
  duration = 5,
  showControls = true,
}) {
  const [activePlacement, setActivePlacement] = useState(placement);
  // SECURITY: Validate URLs to prevent javascript: XSS
  const safeCreativeUrl = creativeUrl && /^https?:\/\/|^data:image\//.test(creativeUrl) ? creativeUrl : null;
  const safeTargetUrl = targetUrl && /^https?:\/\//.test(targetUrl) ? targetUrl : null;
  const imgSrc = safeCreativeUrl || DEMO_CREATIVES[activePlacement].url;

  return (
    <div className="ad-preview">
      {showControls && (
        <div className="ad-preview__controls">
          <button
            type="button"
            className={`btn btn-sm ${activePlacement === 'sidebar' ? 'btn-primary' : ''}`}
            onClick={() => setActivePlacement('sidebar')}
          >
            Sidebar
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activePlacement === 'constellation' ? 'btn-primary' : ''}`}
            onClick={() => setActivePlacement('constellation')}
          >
            Constellation
          </button>
          <span className="ad-preview__duration">{duration}s</span>
        </div>
      )}

      <PhilosifyShell placement={activePlacement}>
        <a
          href={safeTargetUrl || '#'}
          target="_blank"
          rel="noreferrer"
          className="ad-preview__creative"
          onClick={(e) => { if (!safeTargetUrl) e.preventDefault(); }}
        >
          <img src={imgSrc} alt="Ad creative preview" />
        </a>
      </PhilosifyShell>

      <p className="ad-preview__caption">
        {creativeUrl
          ? 'Live preview of your creative in context'
          : `Demo: ${DEMO_CREATIVES[activePlacement].label}`}
      </p>
    </div>
  );
}

export { DEMO_CREATIVES };
