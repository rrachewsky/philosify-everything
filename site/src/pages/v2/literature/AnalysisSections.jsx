// AnalysisSections (Literature) - the v2 result stack for a 1-credit scan:
// Verdict (silver Note numeral + classification + weighted score line),
// TTS audio bar, expandable prose sections (historical context open by
// default per the music-template mockup, then creative process, the five
// weighted branches with their scores, the integrated analysis), and the
// guide-proof record. Content parity with components/results/
// ResultsContainer.jsx (schools-of-thought stays hidden, as there).
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import { ExpandableSection } from '../../../components/v2';
import { V2AudioBar } from './V2AudioBar.jsx';

const BRANCHES = [
  ['ethics', 40],
  ['metaphysics', 20],
  ['epistemology', 20],
  ['politics', 10],
  ['aesthetics', 10],
];

// English classification -> existing top-level i18n key
// (same map as ResultsContainer.translateClassification)
const CLASSIFICATION_KEYS = {
  'Extremely Revolutionary': 'extremelyRevolutionary',
  Revolutionary: 'revolutionary',
  'Moderately Revolutionary': 'moderatelyRevolutionary',
  'Constructive Critique': 'constructiveCritique',
  'Ambiguous, Leaning Realist': 'ambiguousLeaningRealist',
  'Ambiguous, Leaning Evasion': 'ambiguousLeaningEvasion',
  'Soft Conformist': 'softConformist',
  'Directly Conformist': 'directlyConformist',
  'Strongly Conformist': 'stronglyConformist',
  'Doctrinally Conformist': 'doctrinaireConformist',
  'Mildly Conformist': 'mildlyConformist',
  'Ambivalent/Mixed': 'ambivalentMixed',
};

// Models self-report word counts like "(218 words)" — strip, never compute
const stripWordCount = (value) =>
  value ? String(value).replace(/\s*\(\s*\d+\s*(palavras|words)\s*\)\s*$/i, '').trim() : value;

const clean = (value) => ({ __html: DOMPurify.sanitize(stripWordCount(value) || '') });

export function classificationLabel(t, result) {
  if (result.classification_localized) return result.classification_localized;
  if (!result.classification) return '';
  const raw = String(result.classification).trim();
  const normalized = raw === 'Constructive Critiqu' ? 'Constructive Critique' : raw;
  const key = CLASSIFICATION_KEYS[normalized] || normalized.toLowerCase().replace(/\s+/g, '');
  return t(key, { defaultValue: normalized });
}

function formatModelName(model) {
  if (!model) return '';
  const names = {
    claude: 'Claude Opus 4.8',
    'claude-sonnet': 'Claude Opus 4.8',
    openai: 'GPT-5.5',
    gpt4: 'GPT-5.5',
    'gpt-4': 'GPT-5.5',
    gemini: 'Gemini 3.5 Flash',
    grok: 'Grok 4.5',
  };
  return (
    names[String(model).toLowerCase()] ||
    String(model)
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

export function AnalysisSections({ result }) {
  const { t } = useTranslation();
  if (!result) return null;

  const classif = classificationLabel(t, result);
  const finalScore = result.scorecard?.final_score ?? result.final_score ?? result.overall_grade;
  const integrated =
    result.philosophical_analysis || result.summary || result.integrated_analysis || null;

  const proofVersion = result.guide_proof?.version || result.metadata?.guide_version;
  const proofModel =
    result.guide_proof?.modelo ||
    result.metadata?.guide_modelo ||
    formatModelName(result.model || result.model_used);
  const proofSha = result.guide_proof?.sha256 || result.metadata?.guide_sha256;
  const proofSig = result.guide_proof?.signature || result.metadata?.guide_signature;
  const proofMs = result.analysis_duration_ms || result.metadata?.analysis_duration_ms;
  const hasProof = !!(proofSha || result.guide_proof);

  const branchNames = {
    ethics: t('v2.literature.branchEthics', 'Ethics'),
    metaphysics: t('v2.literature.branchMetaphysics', 'Metaphysics'),
    epistemology: t('v2.literature.branchEpistemology', 'Epistemology'),
    politics: t('v2.literature.branchPolitics', 'Politics'),
    aesthetics: t('v2.literature.branchAesthetics', 'Aesthetics'),
  };

  return (
    <>
      <div className="verdict">
        <span className="vlabel">{t('v2.literature.verdictLabel', 'Philosify Verdict')}</span>
        <div className="vgrid">
          {result.philosophical_note != null && (
            <span className="note9">{result.philosophical_note}</span>
          )}
          {classif && <span className="classif">{classif}</span>}
        </div>
        {finalScore !== undefined && finalScore !== null && (
          <div className="vmeta">
            {t('v2.literature.weightedScore', 'Weighted score')} {finalScore}
          </div>
        )}
      </div>

      <V2AudioBar result={result} />

      {result.historical_context && (
        <ExpandableSection
          defaultOpen
          title={t('v2.literature.sectionHistorical', 'Historical context')}
        >
          <div dangerouslySetInnerHTML={clean(result.historical_context)} />
        </ExpandableSection>
      )}

      {result.creative_process && (
        <ExpandableSection title={t('v2.literature.sectionCreative', 'Creative process')}>
          <div dangerouslySetInnerHTML={clean(result.creative_process)} />
        </ExpandableSection>
      )}

      {BRANCHES.map(([branch, weight]) => {
        const data = result.scorecard?.[branch];
        if (!data) return null;
        const score = Number(data.score);
        return (
          <ExpandableSection
            key={branch}
            title={
              <>
                {branchNames[branch]} ({weight}%)
                <span className="xscore">{score > 0 ? `+${score}` : score}</span>
              </>
            }
          >
            <div dangerouslySetInnerHTML={clean(data.justification || '')} />
          </ExpandableSection>
        );
      })}

      {integrated && (
        <ExpandableSection
          title={t('v2.literature.sectionIntegrated', 'Integrated philosophical analysis')}
        >
          <div dangerouslySetInnerHTML={clean(integrated)} />
        </ExpandableSection>
      )}

      {hasProof && (
        <div className="proof">
          {proofVersion && (
            <span>
              {t('v2.literature.proofVersion', 'Guide version')} <b>{proofVersion}</b>
            </span>
          )}
          {proofModel && (
            <span>
              {t('v2.literature.proofModel', 'AI model')} <b>{proofModel}</b>
            </span>
          )}
          {proofSha && (
            <span>
              {t('v2.literature.proofSha', 'SHA-256')} <b>{proofSha}</b>
            </span>
          )}
          {proofSig && (
            <span>
              {t('v2.literature.proofSignature', 'Signature')} <b>{proofSig}</b>
            </span>
          )}
          {proofMs && (
            <span>
              {t('v2.literature.proofTime', 'Analysis time')} <b>{(proofMs / 1000).toFixed(1)}s</b>
            </span>
          )}
        </div>
      )}
    </>
  );
}

export default AnalysisSections;
