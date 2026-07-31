// Marquee calibration (WP7 item 4, 30 Jul): rolling feeds travel at a
// fixed legible speed, so duration follows the measured strip width —
// never a fixed clock. 60px/s sits mid the mandated 50-70px/s band.
// The observed element is the doubled strip of the seamless -50% loop;
// ResizeObserver re-measures on font load and content changes.
import { useLayoutEffect, useRef, useState } from 'react';

const SPEED_PX_S = 60;
const MIN_S = 12;

export function useMarqueeDuration(deps = []) {
  const ref = useRef(null);
  const [duration, setDuration] = useState(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      setDuration(null);
      return undefined;
    }
    const measure = () => {
      const single = el.scrollWidth / 2;
      if (single > 0) setDuration(Math.max(MIN_S, Math.round(single / SPEED_PX_S)));
    };
    measure();
    if (typeof window.ResizeObserver === 'undefined') return undefined;
    const ro = new window.ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [ref, duration];
}
