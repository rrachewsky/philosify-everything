// AnalysisStack - v2 analysis card stack (music mockup):
// Verdict (label + silver Note numeral + classification), AudioBar,
// ExpandableSection, ActionsRow, AdSlot, TrackCard.
import { useState } from 'react';

export function Verdict({ label = 'Philosify Verdict', note, classification }) {
  return (
    <div className="verdict">
      <span className="vlabel">{label}</span>
      <div className="vgrid">
        <span className="note9">{note}</span>
        <span className="classif">{classification}</span>
      </div>
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
