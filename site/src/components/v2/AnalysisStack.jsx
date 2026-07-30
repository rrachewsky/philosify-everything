// AnalysisStack - v2 analysis card stack (music mockup):
// Verdict (label + silver Note numeral + ink classification + score line +
// rationale), AudioBar, ExpandableSection, ActionsRow, AdSlot, TrackCard.
import { useState } from 'react';

// Display formatting: true minus sign for negative scores (tabular numerals).
export function formatSignedScore(score) {
  return String(score).replace('-', '−');
}

// Rationale for the verdict card: the opening 1–2 sentences of the analysis
// itself — integrated analysis first, else the top-weighted scorecard
// justification (ethics, 40%). Frontend-only; the engine output is untouched.
const stripTags = (html) =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function verdictRationale(result) {
  if (!result) return '';
  const source =
    result.philosophical_analysis ||
    result.summary ||
    result.integrated_analysis ||
    result.scorecard?.ethics?.justification ||
    result.ethics_analysis ||
    '';
  const text = stripTags(source);
  if (!text) return '';
  // Sentence boundaries across scripts: Latin/Cyrillic enders + CJK/Arabic marks.
  const parts = text.match(/[^.!?。！？؟…]+[.!?。！？؟…]+["»”“』」]?/g) || [text];
  let out = parts.slice(0, 2).join(' ').trim();
  if (out.length > 340) out = parts[0].trim();
  if (out.length > 340) out = out.slice(0, 339).trimEnd() + '…';
  return out;
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
      {rationale && <p className="vwhy">{rationale}</p>}
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
