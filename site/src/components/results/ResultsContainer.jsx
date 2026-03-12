// ResultsContainer - Complete analysis results display matching old frontend
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { ScorecardTable } from './ScorecardTable';
import { ShareButton } from '../sharing/ShareButton';
import { ShareToCommunityButton } from '../sharing/ShareToCommunityButton';
import { ShareToDMButton } from '../sharing/ShareToDMButton';
import { ListenButton } from './ListenButton';

export const ResultsContainer = forwardRef(function ResultsContainer(
  { result, showShareActions = true, mediaType = 'music' },
  ref
) {
  const { t } = useTranslation();

  // Some models add self-reported word counts like "(218 palavras)" or "(218 words)".
  // We do NOT compute these in the app; strip them for cleaner UI.
  const stripTrailingWordCount = (value) => {
    if (!value) return value;
    const s = String(value);
    return s.replace(/\s*\(\s*\d+\s*(palavras|words)\s*\)\s*$/i, '').trim();
  };

  // Normalize Spotify track identifiers to a plain track ID.
  // Accepts: "2U8D...", "spotify:track:2U8D...", "https://open.spotify.com/track/2U8D...?si=..."
  const normalizeSpotifyTrackId = (value) => {
    if (!value) return null;
    const raw = String(value).trim();

    // Check for invalid string representations
    if (raw.toLowerCase() === 'null' || raw.toLowerCase() === 'undefined') {
      return null;
    }

    // spotify:track:<id>
    if (raw.startsWith('spotify:')) {
      const parts = raw.split(':');
      return parts[parts.length - 1] || null;
    }

    // URL forms
    try {
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const url = new URL(raw);
        const match = url.pathname.match(/\/track\/([^/]+)/i);
        if (match?.[1]) return match[1];
      }
    } catch {
      // ignore
    }

    // Already looks like an ID
    return raw;
  };

  const spotifyTrackId = normalizeSpotifyTrackId(result.spotify_id);
  const spotifyQuery =
    `${result.song || result.song_name || result.title || ''} ${result.artist || ''}`.trim();

  let spotifyEmbedSrc = null;
  if (spotifyTrackId) {
    spotifyEmbedSrc = `https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator`;
  } else if (spotifyQuery) {
    // Only search if we have a robust query (song + artist) to avoid empty searches
    spotifyEmbedSrc = `https://open.spotify.com/embed/search/${encodeURIComponent(spotifyQuery)}`;
  }

  // Format AI model name to show full version
  const formatModelName = (model) => {
    if (!model) return '';

    const modelLower = model.toLowerCase();

    // Map short names to full display names
    const modelDisplayNames = {
      claude: 'Claude Sonnet 4.5',
      'claude-sonnet': 'Claude Sonnet 4.5',
      openai: 'GPT-4.1',
      gpt4: 'GPT-4.1',
      'gpt-4': 'GPT-4.1',
      gemini: 'Gemini 3 Flash',
      grok: 'Grok 4.1 Fast',
      deepseek: 'DeepSeek Reasoner',
      'deepseek-r1': 'DeepSeek Reasoner',
      'deepseek-reasoner': 'DeepSeek Reasoner',
    };

    // Return formatted name or capitalize the original if not found
    return (
      modelDisplayNames[modelLower] ||
      model
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  // Translate classification from English to current language
  const translateClassification = (classification) => {
    if (!classification) return '';

    // Normalize common model typos / near-misses before mapping
    const normalizedRaw = String(classification).trim();
    const normalized =
      normalizedRaw === 'Constructive Critiqu' ? 'Constructive Critique' : normalizedRaw;

    // Map English classification to translation key
    const classificationMap = {
      'Extremely Revolutionary': 'extremelyRevolutionary',
      Revolutionary: 'revolutionary',
      'Moderately Revolutionary': 'moderatelyRevolutionary',
      // Current canonical values (Guide v2.7)
      'Constructive Critique': 'constructiveCritique',
      'Ambiguous, Leaning Realist': 'ambiguousLeaningRealist',
      'Ambiguous, Leaning Evasion': 'ambiguousLeaningEvasion',
      'Soft Conformist': 'softConformist',
      'Directly Conformist': 'directlyConformist',
      'Strongly Conformist': 'stronglyConformist',
      'Doctrinally Conformist': 'doctrinaireConformist',

      // Legacy values (older guide outputs)
      'Mildly Conformist': 'mildlyConformist',
      'Ambivalent/Mixed': 'ambivalentMixed',
    };

    const key = classificationMap[normalized] || normalized.toLowerCase().replace(/\s+/g, '');
    return t(key, { defaultValue: normalized });
  };

  // Determine media type: explicit prop > result field > default 'music'
  const resolvedMediaType = mediaType !== 'music' ? mediaType : (result.media_type || 'music');
  const isLiterature = resolvedMediaType === 'literature';

  if (!result) return null;

  if (result.error) {
    return (
      <div className="error-message-container">
        <div className="error-message-text">{result.error}</div>
      </div>
    );
  }

  return (
    <div className="results-container">
      {/* 1. Technical Specifications with Embed */}
      <div className="result-card" ref={ref}>
        <h3 className="result-card-title">
          {t('technicalSpecs', { defaultValue: 'Technical Specs' })}
        </h3>

        <h2 className="text-2xl font-bold mb-2 text-dark">
          {result.song || result.song_name || result.title}
        </h2>
        <h3 className="text-xl text-dark mb-4">{result.artist || result.author}</h3>

        {/* Technical Specifications Grid */}
        {isLiterature ? (
          /* Literature-specific specs */
          (result.release_year ||
            result.genre ||
            result.country ||
            result.page_count ||
            result.publisher) && (
            <div className="tech-specs-grid">
              {result.country && (
                <>
                  <div className="tech-specs-label">
                    {t('country', { defaultValue: 'Country' })}:
                  </div>
                  <div className="tech-specs-value">{result.country}</div>
                </>
              )}
              {result.release_year && (
                <>
                  <div className="tech-specs-label">{t('year', { defaultValue: 'Year' })}:</div>
                  <div className="tech-specs-value">{result.release_year}</div>
                </>
              )}
              {result.genre && (
                <>
                  <div className="tech-specs-label">{t('genre', { defaultValue: 'Genre' })}:</div>
                  <div className="tech-specs-value">{result.genre}</div>
                </>
              )}
              {result.page_count && (
                <>
                  <div className="tech-specs-label">
                    {t('pageCount', { defaultValue: 'Pages' })}:
                  </div>
                  <div className="tech-specs-value">{result.page_count}</div>
                </>
              )}
              {result.publisher && (
                <>
                  <div className="tech-specs-label">
                    {t('publisher', { defaultValue: 'Publisher' })}:
                  </div>
                  <div className="tech-specs-value">{result.publisher}</div>
                </>
              )}
            </div>
          )
        ) : (
          /* Music-specific specs */
          (result.release_year ||
            result.genre ||
            result.country ||
            result.tempo ||
            result.key ||
            result.time_signature) && (
            <div className="tech-specs-grid">
              {result.country && (
                <>
                  <div className="tech-specs-label">
                    {t('country', { defaultValue: 'Country' })}:
                  </div>
                  <div className="tech-specs-value">{result.country}</div>
                </>
              )}
              {result.release_year && (
                <>
                  <div className="tech-specs-label">{t('year', { defaultValue: 'Year' })}:</div>
                  <div className="tech-specs-value">{result.release_year}</div>
                </>
              )}
              {result.genre && (
                <>
                  <div className="tech-specs-label">{t('genre', { defaultValue: 'Genre' })}:</div>
                  <div className="tech-specs-value">{result.genre}</div>
                </>
              )}
              {result.tempo && (
                <>
                  <div className="tech-specs-label">{t('tempo', { defaultValue: 'Tempo' })}:</div>
                  <div className="tech-specs-value">{result.tempo} BPM</div>
                </>
              )}
              {result.key && (
                <>
                  <div className="tech-specs-label">{t('key', { defaultValue: 'Key' })}:</div>
                  <div className="tech-specs-value">{result.key}</div>
                </>
              )}
              {result.time_signature && (
                <>
                  <div className="tech-specs-label">
                    {t('timeSignature', { defaultValue: 'Time' })}:
                  </div>
                  <div className="tech-specs-value">{result.time_signature}</div>
                </>
              )}
            </div>
          )
        )}

        {/* Book Cover (literature) or Spotify Player (music) */}
        {isLiterature ? (
          result.cover_url && (
            <div className="mt-5" style={{ textAlign: 'center' }}>
              <img
                src={result.cover_url}
                alt={`${result.title || ''} cover`}
                style={{
                  maxHeight: '300px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  margin: '0 auto',
                }}
                loading="lazy"
              />
            </div>
          )
        ) : (
          spotifyEmbedSrc && (
            <div className="mt-5">
              <iframe
                key={spotifyTrackId || spotifyQuery}
                className="spotify-embed rounded-lg w-full border-0"
                height="352"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                src={spotifyEmbedSrc}
                title="Spotify Player"
              />
            </div>
          )
        )}
      </div>

      {/* Listen to Analysis Button - Prominent placement between sections (music only) */}
      {showShareActions && !isLiterature && (
        <div className="listen-section">
          <ListenButton result={result} lang={result.lang} />
        </div>
      )}

      {/* 2. Historical Context */}
      {result.historical_context && (
        <div className="result-card">
          <h3 className="result-card-title">
            {t('historicalContext', { defaultValue: 'Historical Context' })}
          </h3>
          <div
            className="result-card-text"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(stripTrailingWordCount(result.historical_context)),
            }}
          />
        </div>
      )}

      {/* 3. Creative Process */}
      {result.creative_process && (
        <div className="result-card">
          <h3 className="result-card-title">
            {t('creativeProcess', { defaultValue: 'Creative Process' })}
          </h3>
          <div
            className="result-card-text"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(stripTrailingWordCount(result.creative_process)),
            }}
          />
        </div>
      )}

      {/* 4. Weighted Philosophical Scorecard TABLE */}
      {result.scorecard && <ScorecardTable scorecard={result.scorecard} />}

      {/* 5. Integrated Philosophical Analysis */}
      {(() => {
        // Shared pages may receive the integrated essay in different fields depending on API/db schema.
        // Prefer philosophical_analysis, but fall back to summary/integrated_analysis when needed.
        const integrated =
          result.philosophical_analysis ||
          result.summary ||
          result.integrated_analysis ||
          (result.philosophical_analysis && result.philosophical_analysis.integrated_analysis);

        if (!integrated) return null;

        return (
          <div className="result-card">
            <h3 className="result-card-title">
              {t('integratedPhilosophicalAnalysis', {
                defaultValue: 'Integrated Philosophical Analysis',
              })}
            </h3>
            <div
              className="result-card-text"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(stripTrailingWordCount(integrated)),
              }}
            />
          </div>
        );
      })()}

      {/* 5.1 School(s) of Thought component REMOVED per user request */}

      {/* Guide Proof - show even if integrated analysis field is missing in API/db */}
      {(result.guide_proof || (result.metadata && result.metadata.guide_sha256)) && (
        <div className="guide-proof-container">
          <div className="guide-proof-content">
            {(result.guide_proof?.version || result.metadata?.guide_version) && (
              <div className="guide-proof-item">
                <span className="guide-proof-label">
                  {t('guideProofVersion', { defaultValue: 'Guide Version' })}:
                </span>
                <span className="guide-proof-value">
                  {result.guide_proof?.version || result.metadata?.guide_version}
                </span>
              </div>
            )}
            {(result.guide_proof?.modelo ||
              result.metadata?.guide_modelo ||
              result.model ||
              result.model_used) && (
              <div className="guide-proof-item">
                <span className="guide-proof-label">
                  {t('guideProofModel', { defaultValue: 'AI Model' })}:
                </span>
                <span className="guide-proof-value">
                  {result.guide_proof?.modelo ||
                    result.metadata?.guide_modelo ||
                    formatModelName(result.model || result.model_used)}
                </span>
              </div>
            )}
            {(result.guide_proof?.sha256 || result.metadata?.guide_sha256) && (
              <div className="guide-proof-item">
                <span className="guide-proof-label">
                  {t('guideProofSha256', { defaultValue: 'SHA-256' })}:
                </span>
                <span className="guide-proof-value">
                  {result.guide_proof?.sha256 || result.metadata?.guide_sha256}
                </span>
              </div>
            )}
            {(result.guide_proof?.signature || result.metadata?.guide_signature) && (
              <div className="guide-proof-item">
                <span className="guide-proof-label">
                  {t('guideProofSignature', { defaultValue: 'Signature' })}:
                </span>
                <span className="guide-proof-value">
                  {result.guide_proof?.signature || result.metadata?.guide_signature}
                </span>
              </div>
            )}
            {(result.analysis_duration_ms || result.metadata?.analysis_duration_ms) && (
              <div className="guide-proof-item">
                <span className="guide-proof-label">
                  {t('guideProofAnalysisTime', { defaultValue: 'Analysis Time' })}:
                </span>
                <span className="guide-proof-value">
                  {(
                    (result.analysis_duration_ms || result.metadata?.analysis_duration_ms) / 1000
                  ).toFixed(1)}
                  s
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Philosophical Weighted Score */}
      {(result.scorecard?.final_score ?? result.final_score ?? result.overall_grade) !==
        undefined && (
        <div className="result-card">
          <h3 className="result-card-title">
            {t('philosophicalWeightedScore', { defaultValue: 'Philosophical Weighted Score' })}
          </h3>
          <div className="text-xl font-bold text-dark text-center py-3">
            {result.scorecard?.final_score ?? result.final_score ?? result.overall_grade}
          </div>
        </div>
      )}

      {/* 7. Philosophical Note */}
      {result.philosophical_note && (
        <div className="result-card">
          <h3 className="result-card-title">
            {t('philosophicalNote', { defaultValue: 'Philosophical Note' })}
          </h3>
          <div className="text-xl font-bold text-dark text-center py-3">
            {result.philosophical_note}
          </div>
        </div>
      )}

      {/* 8. Philosophical Classification */}
      {result.classification && (
        <div className="result-card">
          <h3 className="result-card-title">
            {t('philosophicalClassification', { defaultValue: 'Philosophical Classification' })}
          </h3>
          <div className="text-xl font-bold text-dark text-center py-3">
            {result.classification_localized || translateClassification(result.classification)}
          </div>
        </div>
      )}

      {/* 9. Share Buttons */}
      {showShareActions && result.id && (
        <div className="result-card flex-center p-6" style={{ gap: '12px', flexWrap: 'wrap' }}>
          <ShareButton
            analysisId={result.id}
            songName={result.song || result.song_name || result.title}
            artist={result.artist || result.author}
          />
          <ShareToDMButton
            analysisId={result.id}
            songName={result.song || result.song_name || result.title}
            artist={result.artist || result.author}
            philosophicalNote={result.philosophical_note}
            classification={result.classification}
          />
          <ShareToCommunityButton
            analysisId={result.id}
            songName={result.song || result.song_name || result.title}
            artist={result.artist || result.author}
          />
        </div>
      )}
    </div>
  );
});

export default ResultsContainer;
// Note: Use named export (ResultsContainer) for forwardRef compatibility
