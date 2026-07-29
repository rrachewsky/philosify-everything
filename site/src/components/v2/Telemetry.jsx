// Telemetry - v2 analyzing state line (music mockup .state):
// label, tabular-nums timer in silver, progress hairline, cancel.
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
