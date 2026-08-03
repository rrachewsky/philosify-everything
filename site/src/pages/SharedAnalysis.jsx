// SharedAnalysis — the PUBLIC permalink for a shared analysis (/a/:slug, /shared/:id).
//
// This is the first thing a visitor arriving from WhatsApp sees, so it wears the
// v2 skin like every other surface. The 30 Jul cutover moved the module pages and
// left this route on the retired v1 components (ResultsContainer, /logo.png,
// violet gradients); corrected 1 Aug.
//
// The token semantics — expiry, view cap, auth gating, referral tracking — are
// untouched: only the rendering changed.
//
// Auth: Uses HttpOnly cookies (credentials: 'include')
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  PageShell,
  Button,
  Verdict,
  ExpandableSection,
  formatSignedScore,
  verdictRationale,
} from '../components/v2';
import { ShareButton } from '../components/sharing/ShareButton';
// The verdict is stored in canonical English; this is the existing map from
// classification to the UI's own wording. Reused rather than copied — there are
// already three identical copies of it in the tree.
import { classificationLabel } from './v2/cinema/AnalysisSections.jsx';
import { useAuth, useSharedContentLanguage } from '../hooks';
import { getApiUrl } from '../config';
import { logger } from '../utils';
import '../styles/v2-pages/music.css';
import '../styles/v2-pages/news.css';

const AXES = ['ethics', 'metaphysics', 'epistemology', 'politics', 'aesthetics'];

// Analysis fields arrive as sanitized-on-render HTML, same treatment the module
// pages give them. Plain text is wrapped into paragraphs.
function Prose({ text, className = 'prose' }) {
  const html = useMemo(() => {
    if (!text) return '';
    const s = String(text);
    const isHtml = /<\/?[a-z][^>]*>/i.test(s);
    const raw = isHtml
      ? s
      : s
          .split(/\n{2,}/)
          .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
    return DOMPurify.sanitize(raw, { ADD_TAGS: ['hl'] });
  }, [text]);
  if (!html) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SharedAnalysis() {
  const { t, i18n } = useTranslation();
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Routes supported:
  // - /a/:slug      (token-based share links, referral tracking)
  // - /shared/:id   (legacy/direct links; may be analysisId UUID OR old slug)
  const identifier = slug || id;

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [maxViewsReached, setMaxViewsReached] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [teaser, setTeaser] = useState(null);

  // A shared analysis is read in the language it was written in — the sender's.
  // This overrides the visitor's preference for this view only; the hook puts
  // their stored preference back so the rest of the site is unaffected.
  useSharedContentLanguage(analysis?.language || analysis?.lang);

  // Normalize analyses coming from different endpoints/shapes so ResultsContainer
  // always receives a consistent structure.
  const normalizeAnalysisForUI = (raw) => {
    if (!raw || typeof raw !== 'object') return raw;

    const a = { ...raw };

    // Ensure integrated analysis field exists for UI:
    // - Cached flow uses philosophical_analysis
    // - Some DB/API shapes use summary
    a.philosophical_analysis =
      a.philosophical_analysis ||
      a.summary ||
      a.integrated_analysis ||
      (a.philosophical_analysis && typeof a.philosophical_analysis === 'object'
        ? a.philosophical_analysis.integrated_analysis
        : null) ||
      null;

    // Ensure scorecard exists for UI (shared endpoints may return *_score + *_analysis columns only).
    if (!a.scorecard) {
      const hasBranchScores =
        a.ethics_score !== undefined ||
        a.metaphysics_score !== undefined ||
        a.epistemology_score !== undefined ||
        a.politics_score !== undefined ||
        a.aesthetics_score !== undefined;

      if (hasBranchScores) {
        const toNumber = (v) => (typeof v === 'number' ? v : v == null ? null : Number(v));
        a.scorecard = {
          ethics: { score: toNumber(a.ethics_score) ?? 0, justification: a.ethics_analysis || '' },
          metaphysics: {
            score: toNumber(a.metaphysics_score) ?? 0,
            justification: a.metaphysics_analysis || '',
          },
          epistemology: {
            score: toNumber(a.epistemology_score) ?? 0,
            justification: a.epistemology_analysis || '',
          },
          politics: {
            score: toNumber(a.politics_score) ?? 0,
            justification: a.politics_analysis || '',
          },
          aesthetics: {
            score: toNumber(a.aesthetics_score) ?? 0,
            justification: a.aesthetics_analysis || '',
          },
          final_score: toNumber(a.final_score) ?? toNumber(a.overall_grade) ?? null,
        };
      }
    }

    // Ensure guide proof is reachable by ResultsContainer
    if (!a.guide_proof && a.metadata && typeof a.metadata === 'object') {
      if (a.metadata.guide_sha256 || a.metadata.guide_signature || a.metadata.guide_version) {
        a.guide_proof = {
          sha256: a.metadata.guide_sha256 || null,
          signature: a.metadata.guide_signature || null,
          version: a.metadata.guide_version || null,
          modelo: a.metadata.guide_modelo || null,
        };
      }
    }

    return a;
  };

  // Track referral after signup/login
  useEffect(() => {
    const trackReferralIfNeeded = async () => {
      // Check if user just signed up/logged in from a share link
      const pendingReferralSlug = sessionStorage.getItem('pendingReferralSlug');

      if (pendingReferralSlug && isAuthenticated && user) {
        logger.log('[SharedAnalysis] Tracking referral for slug:', pendingReferralSlug);

        try {
          const response = await fetch(`${getApiUrl()}/api/track-referral`, {
            method: 'POST',
            credentials: 'include', // Send HttpOnly cookie for auth
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ slug: pendingReferralSlug }),
          });

          if (response.ok) {
            const data = await response.json();
            logger.log('[SharedAnalysis] Referral tracked:', data);
          }

          // Clear pending referral
          sessionStorage.removeItem('pendingReferralSlug');
        } catch (error) {
          logger.error('[SharedAnalysis] Error tracking referral:', error);
          sessionStorage.removeItem('pendingReferralSlug');
        }
      }
    };

    trackReferralIfNeeded();
  }, [isAuthenticated, user]);

  // Fetch shared analysis
  useEffect(() => {
    const fetchSharedAnalysis = async () => {
      if (!identifier) {
        setError(t('share.shareErrorInvalidLink'));
        setLoading(false);
        return;
      }

      try {
        const isUuid =
          typeof identifier === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        // Choose endpoints based on route/identifier shape
        // - /a/:slug always uses token endpoint (/api/shared/:slug)
        // - /shared/:id: if UUID, prefer direct endpoint (/shared/:analysisId) then fallback to token endpoint
        // - /shared/:id: if not UUID, treat as slug (token endpoint)
        const endpoints = slug
          ? [`${getApiUrl()}/api/shared/${identifier}`]
          : isUuid
            ? [`${getApiUrl()}/shared/${identifier}`, `${getApiUrl()}/api/shared/${identifier}`]
            : [`${getApiUrl()}/api/shared/${identifier}`];

        let response = null;
        let data = null;
        let lastErrorData = null;

        for (const endpoint of endpoints) {
          response = await fetch(endpoint, { credentials: 'include' });
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            data = await response.json().catch(() => null);
          } else {
            const text = await response.text().catch(() => '');
            const isCloudflareChallenge =
              text.includes('Just a moment') ||
              text.includes('__cf_chl') ||
              text.includes('cf-chl') ||
              text.includes('cloudflare');
            data = {
              error: isCloudflareChallenge
                ? t('share.shareErrorGeneric', {
                    defaultValue:
                      'The API was blocked by a Cloudflare security challenge. Please try again in a standard browser session, or try later.',
                  })
                : null,
            };
          }

          if (response.ok) break;
          lastErrorData = data;
        }

        if (!response?.ok) {
          const errorData = lastErrorData || {};

          if (errorData.requiresAuth) {
            setRequiresAuth(true);
            setTeaser(errorData.teaser || null);
            setLoading(false);
            return;
          } else if (errorData.expired) {
            setExpired(true);
            setError(t('share.shareErrorExpired'));
          } else if (errorData.maxViewsReached) {
            setMaxViewsReached(true);
            setError(t('share.shareErrorMaxViews'));
          } else {
            setError(errorData.error || t('share.shareErrorNotFound'));
          }

          setLoading(false);
          return;
        }

        if (!data.success || !data.analysis) {
          setError(t('share.shareErrorNotFound'));
          setLoading(false);
          return;
        }

        setAnalysis(normalizeAnalysisForUI(data.analysis));

        // Store referral slug for tracking after signup ONLY for token-based links (/a/:slug)
        if (!isAuthenticated && slug) {
      sessionStorage.setItem('pendingReferralSlug', identifier);
        }
      } catch (error) {
        logger.error('[SharedAnalysis] Error fetching analysis:', error);
        setError(t('share.shareErrorGeneric'));
      } finally {
        setLoading(false);
      }
    };

    // Reset auth-required state when user authenticates, so fetch retries
    if (isAuthenticated && requiresAuth) {
      setRequiresAuth(false);
      setTeaser(null);
      setLoading(true);
    }

    fetchSharedAnalysis();
  }, [identifier, t, isAuthenticated, i18n, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle CTA click - go to home
  const handleJoinClick = () => {
    // Store referral slug for tracking after signup ONLY for token-based links (/a/:slug)
    if (slug) {
      sessionStorage.setItem('pendingReferralSlug', identifier);
    }

    // Store song data for pre-filling search after they get access
    if (analysis) {
      const songData = {
        song: analysis.song || analysis.song_name || analysis.title,
        artist: analysis.artist,
        spotify_id: analysis.spotify_id,
      };
      sessionStorage.setItem('sharedSongData', JSON.stringify(songData));
    }

    navigate('/');
  };

  const cta = (
    <div className="sharecta">
      <h3>{t('share.ctaTitle', 'Want to analyze your favorite songs?')}</h3>
      <p>
        {t(
          'share.ctaDescription',
          'Discover the philosophical meaning behind any song with Philosify.'
        )}
      </p>
      <Button onClick={handleJoinClick}>{t('share.ctaButton', 'Join Philosify')}</Button>
    </div>
  );

  const shell = (children, pageClass = 'pg-music') => (
    <PageShell status={t('v2.landing.status', 'Analysis Engine // Active')}>
      <div className={pageClass}>{children}</div>
    </PageShell>
  );

  // Loading state
  if (loading) {
    return shell(<div className="loadnote">{t('share.shareLoading', 'Loading analysis…')}</div>);
  }

  // Error state (expired link, view cap reached, not found)
  if (error) {
    return shell(
      <div className="empty">
        <p>{error}</p>
        {(expired || maxViewsReached) && (
          <p className="mnote">
            {expired
              ? t('share.expiredNote', 'This link has expired. Ask for a fresh one.')
              : t('share.maxViewsNote', 'This link reached its view limit.')}
          </p>
        )}
        <div className="btns">
          <Button onClick={() => navigate('/')}>{t('share.discoverPhilosify', 'Discover Philosify')}</Button>
        </div>
      </div>
    );
  }

  // Auth required — teaser only
  if (requiresAuth) {
    return shell(
      <>
        {teaser?.song && (
          <div className="trackc">
            <h3>{teaser.song}</h3>
            {teaser.artist && <p>{teaser.artist}</p>}
          </div>
        )}
        <div className="sharecta">
          <h3>{t('share.loginRequired', 'Log in to view this analysis')}</h3>
          <p>
            {t(
              'share.loginRequiredDescription',
              'Sign up or log in to Philosify to read the full philosophical analysis.'
            )}
          </p>
          <Button onClick={handleJoinClick}>{t('share.ctaButton', 'Join Philosify')}</Button>
        </div>
      </>
    );
  }

  // ── The analysis itself, in the v2 anatomy ──
  const meta = (analysis && typeof analysis.metadata === 'object' && analysis.metadata) || {};
  const theFacts = analysis?.the_facts || meta.the_facts;
  const isNews = !!theFacts || meta.media_type === 'news' || analysis?.classification === 'news';
  const panelText = analysis?.panel_analysis || meta.panel_analysis;

  const workTitle = analysis?.song || analysis?.song_name || analysis?.title || '';
  const workBy = analysis?.artist || analysis?.author || analysis?.director || analysis?.source || '';

  const sc = analysis?.scorecard || {};
  const finalScore = sc.final_score ?? analysis?.final_score ?? analysis?.overall_grade;
  const scoreLine =
    finalScore != null
      ? analysis?.philosophical_note != null
        ? t('v2.verdict.scoreLine', 'Final score {{score}} · Note {{n}} of 10', {
            score: formatSignedScore(finalScore),
            n: analysis.philosophical_note,
          })
        : t('v2.verdict.scoreOnly', 'Final score {{score}}', { score: formatSignedScore(finalScore) })
      : null;

  // Cinema and Literature store the verdict in canonical English and send no
  // localized copy, so an untranslated word would sit in the middle of an
  // otherwise Portuguese page.
  const verdictText = analysis ? classificationLabel(t, analysis) : '';

  const proof = analysis?.guide_proof;

  return shell(
    <>
      {workTitle && (
        <div className="trackc">
          <h3>{workTitle}</h3>
          {workBy && <p>{workBy}</p>}
        </div>
      )}

      {/* News wears the four-box anatomy; everything else the verdict stack. */}
      {isNews ? (
        <div className="scan">
          {theFacts && (
            <div className="cell static facts">
              <h2>{t('news.theFactsTitle', 'The Facts')}</h2>
              <Prose text={theFacts} />
            </div>
          )}
          {(analysis.source_analysis || meta.source_analysis) && (
            <div className="cell static">
              <h2>{t('news.sourceAnalysisTitle', 'Source Analysis')}</h2>
              <Prose text={analysis.source_analysis || meta.source_analysis} />
            </div>
          )}
          {(analysis.hits_and_misses || meta.hits_and_misses) && (
            <div className="cell static hits">
              <h2>{t('news.hitsAndMissesTitle', 'Hits, Misses and Omissions')}</h2>
              <Prose text={analysis.hits_and_misses || meta.hits_and_misses} />
            </div>
          )}
          {(analysis.philosify_opinion || meta.philosify_opinion) && (
            <div className="cell static">
              <h2>{t('v2.news.opinionTitle', 'PHILOSIFY OPINION')}</h2>
              <Prose text={analysis.philosify_opinion || meta.philosify_opinion} />
            </div>
          )}
        </div>
      ) : (
        <>
          {(finalScore != null || analysis?.classification) && (
            <Verdict
              label={t('v2.music.verdictLabel', 'Philosify Verdict')}
              note={analysis.philosophical_note}
              classification={verdictText}
              scoreLine={scoreLine}
              rationale={verdictRationale(analysis, t, analysis.classification)}
            />
          )}

          {AXES.filter((k) => sc[k]?.justification).map((k) => (
            <ExpandableSection
              key={k}
              title={`${t(`v2.axis.${k}`, k.toUpperCase())} ${formatSignedScore(sc[k].score)}`}
            >
              <Prose text={sc[k].justification} />
            </ExpandableSection>
          ))}

          {analysis?.philosophical_analysis && (
            <ExpandableSection
              title={t('v2.music.integratedTitle', 'Integrated Analysis')}
              defaultOpen
            >
              <Prose text={analysis.philosophical_analysis} />
            </ExpandableSection>
          )}

          {analysis?.historical_context && (
            <ExpandableSection title={t('v2.music.historicalTitle', 'Historical Context')}>
              <Prose text={analysis.historical_context} />
            </ExpandableSection>
          )}

          {analysis?.creative_process && (
            <ExpandableSection title={t('v2.music.creativeTitle', 'Creative Process')}>
              <Prose text={analysis.creative_process} />
            </ExpandableSection>
          )}
        </>
      )}

      {panelText && (
        <ExpandableSection title={t('v2.music.panelTitle', 'Philosopher Panel')} defaultOpen>
          <Prose text={panelText} />
        </ExpandableSection>
      )}

      {proof && (proof.version || proof.sha256 || proof.modelo) && (
        <div className="proof">
          {proof.version && (
            <span>
              {t('v2.music.guideVersion', 'Guide')} <b>{proof.version}</b>
            </span>
          )}
          {proof.modelo && (
            <span>
              {t('v2.music.aiModel', 'Model')} <b>{proof.modelo}</b>
            </span>
          )}
          {proof.sha256 && (
            <span>
              {t('v2.music.sha256', 'SHA-256')} <b>{proof.sha256}</b>
            </span>
          )}
        </div>
      )}

      {/* Closing the loop: whoever arrives by a link can pass the same link on.
          It is handed to ShareButton directly instead of letting it mint a fresh
          token — minting requires a session, and this visitor usually has none.
          Re-sharing the URL keeps the original referral attribution intact.
          No shareText: this route serves music, news, film and books alike, so
          the message is the component's own analysis default, the one line that
          is true for all of them. */}
      <div className="sharetray">
        <ShareButton
          shareUrl={`${window.location.origin}${slug ? `/a/${slug}` : `/shared/${identifier}`}`}
          songName={workTitle}
          artist={workBy}
        />
      </div>

      {cta}
    </>,
    isNews ? 'pg-news' : 'pg-music'
  );
}

export default SharedAnalysis;
