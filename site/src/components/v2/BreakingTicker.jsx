// BreakingTicker - the news-mockup breaking line (ruling 30 Jul 2026):
// fixed silver "BREAKING >>>" label on the LEFT, headlines rolling
// continuously to the edge in a seamless -50% loop (content duplicated,
// twin aria-hidden). Hover pauses; prefers-reduced-motion renders the
// strip static (CSS). Reusable — items come from the caller (live data).
// Duration is measured, not fixed (WP7 item 4): ~60px/s whatever the load.
import { useMarqueeDuration } from './useMarqueeDuration.js';

export function BreakingTicker({ label, items = [], onSelect, loading, loadingText, emptyText }) {
  const [rollRef, duration] = useMarqueeDuration([items]);
  const hasItems = items.length > 0;
  const strip = (hidden) => (
    <span aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={(item.url || item.title || i) + (hidden ? '-b' : '')}>
          {i > 0 && ' · '}
          <button
            type="button"
            className="bk-item"
            tabIndex={hidden ? -1 : undefined}
            onClick={() => onSelect?.(item)}
          >
            {item.title}
          </button>
        </span>
      ))}
      {' · '}
    </span>
  );
  return (
    <div className="tick brk">
      <b className="brklabel">{label}</b>
      <span className="roll">
        {hasItems ? (
          <span
            className="rollin"
            ref={rollRef}
            style={duration ? { animationDuration: `${duration}s` } : undefined}
          >
            {strip(false)}
            {strip(true)}
          </span>
        ) : (
          <span className="rollempty">{loading ? loadingText : emptyText}</span>
        )}
      </span>
    </div>
  );
}
