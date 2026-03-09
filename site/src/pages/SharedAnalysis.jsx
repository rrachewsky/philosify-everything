// SharedAnalysis - Page for viewing shared analysis via link
// Auth: Uses HttpOnly cookies (credentials: 'include')
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ResultsContainer, Spinner, Button } from '../components';
import { useAuth } from '../hooks';
import { getApiUrl } from '../config';
import { logger } from '../utils';

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
      const pendingReferralSlug = localStorage.getItem('pendingReferralSlug');

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
          localStorage.removeItem('pendingReferralSlug');
        } catch (error) {
          logger.error('[SharedAnalysis] Error tracking referral:', error);
          localStorage.removeItem('pendingReferralSlug');
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
          response = await fetch(endpoint);
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

          if (errorData.expired) {
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

        // If user has no explicit language preference yet, try to align UI language with analysis language.
        // This prevents mixed-language pages on shared links (analysis text in PT, UI in EN).
        try {
          const hasPreferred = !!localStorage.getItem('preferredLanguage');
          if (!hasPreferred) {
            const analysisLangRaw = data.analysis?.lang || data.analysis?.language || null;
            const analysisLang = String(analysisLangRaw || '')
              .split('-')[0]
              .trim();
            if (analysisLang && analysisLang !== i18n.language) {
              await i18n.changeLanguage(analysisLang);
            }
          }
        } catch {
          // ignore (private mode / blocked storage)
        }

        // Store referral slug for tracking after signup ONLY for token-based links (/a/:slug)
        if (!isAuthenticated && slug) {
          localStorage.setItem('pendingReferralSlug', identifier);
        }
      } catch (error) {
        logger.error('[SharedAnalysis] Error fetching analysis:', error);
        setError(t('share.shareErrorGeneric'));
      } finally {
        setLoading(false);
      }
    };

    fetchSharedAnalysis();
  }, [identifier, t, isAuthenticated, i18n, slug]);

  // Handle CTA click - go to home
  const handleJoinClick = () => {
    // Store referral slug for tracking after signup ONLY for token-based links (/a/:slug)
    if (slug) {
      localStorage.setItem('pendingReferralSlug', identifier);
    }

    // Store song data for pre-filling search after they get access
    if (analysis) {
      const songData = {
        song: analysis.song || analysis.song_name || analysis.title,
        artist: analysis.artist,
        spotify_id: analysis.spotify_id,
      };
      localStorage.setItem('sharedSongData', JSON.stringify(songData));
    }

    navigate('/');
  };

  // Loading state
  if (loading) {
    return (
      <div className="page-center">
        <Spinner size={60} />
        <p className="mt-6 text-lg text-muted">{t('share.shareLoading')}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page-center text-center">
        <div className="text-3xl mb-6" style={{ fontSize: '48px' }}>
          {expired ? '⏰' : maxViewsReached ? '👁️' : '❌'}
        </div>
        <h2 className="text-xl mb-4 text-dark">{error}</h2>
        <Button
          onClick={() => navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
            color: 'white',
            fontWeight: 'bold',
            padding: '12px 32px',
            fontSize: '16px',
          }}
        >
          {t('share.discoverPhilosify')}
        </Button>
      </div>
    );
  }

  // Show analysis to everyone (authenticated or not)
  return (
    <div className="max-w-xl mx-auto py-6 px-6">
      {/* Header */}
      <div className="mb-8 flex justify-center">
        <img
          src="/logo.png"
          alt="Philosify"
          style={{ height: '136px', width: 'auto' }} // 2x
        />
      </div>

      {/* Analysis Results */}
      {analysis && <ResultsContainer result={analysis} />}

      {/* CTA (consistent layout for everyone) */}
      <div
        className="mt-8 p-6 rounded-lg text-center"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
        }}
      >
        <h3 className="text-xl font-bold mb-3">
          {t('share.ctaTitle', 'Want to analyze your favorite songs?')}
        </h3>
        <p className="text-base mb-5" style={{ opacity: 0.9 }}>
          {t(
            'share.ctaDescription',
            'Discover the philosophical meaning behind any song with Philosify.'
          )}
        </p>
        <Button
          onClick={handleJoinClick}
          style={{
            background: 'rgba(255, 255, 255, 0.18)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.55)',
            fontWeight: 'bold',
            padding: '12px 32px',
            fontSize: '16px',
            width: '50%',
            maxWidth: '320px',
            minWidth: '180px',
            display: 'block',
            margin: '0 auto',
          }}
        >
          {t('share.ctaButton', 'Join Philosify')}
        </Button>
      </div>
    </div>
  );
}

export default SharedAnalysis;
