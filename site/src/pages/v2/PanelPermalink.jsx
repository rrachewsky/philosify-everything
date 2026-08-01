// PanelPermalink — the PUBLIC permalink for a philosopher panel (/panel/:id).
//
// Until 1 Aug 2026 the share button for a panel pointed at an API endpoint that
// served a bare meta-tag stub and bounced the visitor to the home page, so a
// shared panel was unreachable: the card appeared, the content never did. This
// is the page those links needed.
//
// Panels are written to KV without a TTL ("user paid credits, analysis must be
// permanent"), and `GET /api/panel/:id` reads them without auth, so the
// permalink keeps working for anyone the link reaches.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell, Button } from '../../components/v2';
import PanelAnalysisCards from '../../components/results/PanelAnalysisCards.jsx';
import { getApiUrl } from '../../config';
import { logger } from '../../utils';
import '../../styles/v2-pages/music.css';

export function PanelPermalink() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [panel, setPanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id) {
        setError(t('share.shareErrorInvalidLink', 'This link is not valid.'));
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${getApiUrl()}/api/panel/${encodeURIComponent(id)}`);
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && data?.success && data?.panel) {
          setPanel(data.panel);
        } else {
          setError(t('share.shareErrorNotFound', 'This analysis could not be found.'));
        }
      } catch (err) {
        logger.error('[PanelPermalink] Failed to load panel:', err);
        if (!cancelled) setError(t('share.shareErrorGeneric', 'Something went wrong.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const shell = (children) => (
    <PageShell status={t('v2.landing.status', 'Analysis Engine // Active')}>
      <div className="pg-music">{children}</div>
    </PageShell>
  );

  if (loading) {
    return shell(<div className="loadnote">{t('share.shareLoading', 'Loading analysis…')}</div>);
  }

  if (error || !panel) {
    return shell(
      <div className="empty">
        <p>{error}</p>
        <div className="btns">
          <Button onClick={() => navigate('/')}>
            {t('share.discoverPhilosify', 'Discover Philosify')}
          </Button>
        </div>
      </div>
    );
  }

  return shell(
    <>
      <div className="trackc">
        <h3>{panel.title}</h3>
        {panel.artist && <p>{panel.artist}</p>}
      </div>

      <div className="panelhead">
        {t('philosopherPanel.button', 'Philosopher Panel')}
        {Array.isArray(panel.philosophers) && panel.philosophers.length > 0
          ? ` // ${panel.philosophers.join(' · ')}`
          : ''}
      </div>

      <PanelAnalysisCards analysis={panel.analysis} />

      <div className="sharecta">
        <h3>{t('share.ctaTitle', 'Want to analyze your favorite songs?')}</h3>
        <p>
          {t(
            'share.ctaDescription',
            'Discover the philosophical meaning behind any song with Philosify.'
          )}
        </p>
        <Button onClick={() => navigate('/')}>{t('share.ctaButton', 'Join Philosify')}</Button>
      </div>
    </>
  );
}

export default PanelPermalink;
