// Telemetry - v2 analyzing state line (music mockup .state):
// label, tabular-nums timer in silver, progress hairline, cancel.

// One pacing law for every ANALYZING strip (ruling 31 Jul). Linear fills read
// as broken at both ends: a 3-philosopher panel scaled over 90s looked frozen
// for its first seconds, and any job outrunning its estimate sat pinned at the
// cap. This eases in — visible movement from the first second whatever the job
// length — and approaches the end asymptotically, so the bar never claims a
// result that has not arrived.
export function analysisProgress(elapsedMs, expectedMs) {
  if (!expectedMs || expectedMs <= 0 || !elapsedMs || elapsedMs <= 0) return 0;
  return 96 * (1 - Math.exp((-2.2 * elapsedMs) / expectedMs));
}
export function Telemetry({ label = 'Analyzing', time, progress = 0, onCancel, cancelLabel = 'Cancel' }) {
  return (
    <div className="state">
      <span>{label}</span>
      {time && <b>{time}</b>}
      <span className="bar">
        <i style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </span>
      {onCancel && (
        <a onClick={onCancel} role="button" tabIndex={0}>
          {cancelLabel}
        </a>
      )}
    </div>
  );
}
