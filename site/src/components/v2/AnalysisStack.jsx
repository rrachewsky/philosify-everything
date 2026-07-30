// AnalysisStack - v2 analysis card stack (music mockup):
// Verdict (label + silver Note numeral + ink classification + score line +
// rationale), AudioBar, ExpandableSection, ActionsRow, AdSlot, TrackCard.
import { useState } from 'react';
import DOMPurify from 'dompurify';

// Display formatting: true minus sign for negative scores (tabular numerals).
export function formatSignedScore(score) {
  return String(score).replace('-', '−');
}

// Rationale for the verdict card (ruling 30 Jul): why THIS verdict and
// THIS note — never a description of the work. Composed deterministically
// from the scorecard's weighted verdicts in the canonical grade vocabulary
// (new_design/philosify-grade-vocabulary.md): which premises the work
// accepts or challenges along the five axes, closing with the score's
// coherence. Non-Disclosure-safe; results without a scorecard render no
// rationale rather than a poetic slice. No new engine fields (vocabulary
// note 3): the axis scores ARE each justification's distilled verdict.
const AXES = ['ethics', 'metaphysics', 'epistemology', 'politics', 'aesthetics'];

const CLAUSE_EN = {
  pos: {
    ethics: 'upholds earned self-esteem against sacrifice',
    metaphysics: 'grants a knowable, benevolent reality open to success',
    epistemology: 'answers to reason',
    politics: 'defends freedom and voluntary dealings',
    aesthetics: 'renders beauty as the celebration of life',
  },
  neg: {
    ethics: 'trades self-esteem for altruist guilt and sacrifice',
    metaphysics: 'casts reality as malevolent or fated',
    epistemology: 'reaches for mysticism and skepticism over reason',
    politics: 'places coercion and the collective above the individual',
    aesthetics: 'settles for nihilism against beauty',
  },
};

const CONCEPT_EN = {
  ethics: 'self-esteem',
  metaphysics: 'reality',
  epistemology: 'reason',
  politics: 'freedom',
  aesthetics: 'beauty',
};

export function verdictRationale(result, t, band) {
  if (!result || typeof t !== 'function') return '';
  const sc = result.scorecard || {};
  const axes = AXES.map((k) => ({ k, s: Number(sc[k]?.score) })).filter((a) => Number.isFinite(a.s));
  if (!axes.length) return '';

  // Salience: ethics always (the dominant 40% axis), then the strongest
  // remaining axes; near-balance axes (|s|<2) speak only when nothing
  // clearer exists. At most three clauses — the rule caps at 1–2 sentences.
  const ethics = axes.find((a) => a.k === 'ethics');
  const rest = axes
    .filter((a) => a.k !== 'ethics')
    .sort((a, b) => Math.abs(b.s) - Math.abs(a.s));
  const picked = [...(ethics ? [ethics] : []), ...rest.filter((a) => Math.abs(a.s) >= 2)].slice(0, 3);
  if (picked.length < 2 && rest.length) picked.push(rest[0]);

  const clause = (a) => {
    const text =
      Math.abs(a.s) < 2
        ? t('v2.verdict.r.mix', 'holds {{concept}} and its opponents in near balance', {
            concept: t(`v2.verdict.r.concept.${a.k}`, CONCEPT_EN[a.k]),
          })
        : t(`v2.verdict.r.${a.s > 0 ? 'pos' : 'neg'}.${a.k}`, CLAUSE_EN[a.s > 0 ? 'pos' : 'neg'][a.k]);
    return `${text} (${formatSignedScore(a.s > 0 ? `+${a.s}` : a.s)})`;
  };
  const clauses = picked.map(clause).join(t('v2.verdict.r.join', '; '));

  const finalScore = sc.final_score ?? result.final_score ?? result.overall_grade;
  if (finalScore == null || !band) {
    return t('v2.verdict.r.frameOpen', 'The work {{clauses}}.', { clauses });
  }
  return t('v2.verdict.r.frame', 'The work {{clauses}} — hence {{score}}: {{band}}.', {
    clauses,
    score: formatSignedScore(finalScore),
    band,
  });
}

export function Verdict({ label = 'Philosify Verdict', note, classification, scoreLine, rationale }) {
  return (
    <div className="verdict">
      <span className="vlabel">{label}</span>
      <div className="vgrid">
        {note != null && <span className="note9">{note}</span>}
        {classification && <span className="classif">{classification}</span>}
      </div>
      {scoreLine && <div className="vscore">{scoreLine}</div>}
      {rationale && (
        <p
          className="vwhy"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(rationale, { ALLOWED_TAGS: ['hl'] }),
          }}
        />
      )}
    </div>
  );
}

export function AudioBar({ label = 'Listen to the analysis', speed = 'Speed 1x', onPlay, onSpeed, playing = false }) {
  return (
    <div className="audio">
      <button className="play" onClick={onPlay} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <span>{label}</span>
      <span className="aline" />
      <span onClick={onSpeed} style={onSpeed ? { cursor: 'pointer' } : undefined}>
        {speed}
      </span>
    </div>
  );
}

export function ExpandableSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`xcard${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="head">
        <h4>{title}</h4>
        <span className="chev">{open ? '— collapse' : '+ expand'}</span>
      </div>
      <div className="body" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ActionsRow({ children }) {
  return <div className="actions">{children}</div>;
}

export function AdSlot({ tag = 'Sponsored', children }) {
  return (
    <div className="slot">
      <span className="tag">{tag}</span>
      {children}
    </div>
  );
}

export function TrackCard({ cover = '♪', title, meta }) {
  return (
    <div className="trackc">
      <div className="coverc">{cover}</div>
      <div>
        <h3>{title}</h3>
        <p>{meta}</p>
      </div>
    </div>
  );
}
