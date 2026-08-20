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
import { ShareButton } from '../../components/sharing/ShareButton';
import PanelAnalysisCards from '../../components/results/PanelAnalysisCards.jsx';
import { useSharedContentLanguage } from '../../hooks';
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

  // The panel text cannot be translated — a panel in another language is a
  // different panel, generated and paid for separately — so the interface
  // follows the text rather than the other way round.
  useSharedContentLanguage(panel?.lang);

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

      {/* Whoever arrives by a link must be able to pass it on. The link is this
          very route — the same one the modules' share button now generates — so
          the edge already has the localized card for it. Unlike the modules, the
          tray is open: there is no ActionsRow here to toggle it from, and the
          visitor is typically anonymous (no token to mint). */}
      <div className="sharetray">
        <ShareButton
          shareUrl={`${window.location.origin}/panel/${id}`}
          songName={panel.title}
          artist={panel.artist}
          shareText={
            panel.mediaType === 'news'
              ? t('share.shareNewsText', { title: panel.title })
              : panel.mediaType === 'cinema'
                ? t('share.shareFilmText', { title: panel.title, artist: panel.artist })
                : panel.mediaType === 'literature'
                  ? t('share.shareLiteratureText', { title: panel.title, artist: panel.artist })
                  : t('share.shareMusicText', { title: panel.title, artist: panel.artist })
          }
        />
      </div>

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
