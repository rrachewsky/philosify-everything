// GridVeil - the v2 global atmosphere layer (Design Law §4):
// viewport-fixed 64px hairline grid with radial fade at the extremes.
// Styles live in tokens.css (.grid-veil). Mounted by the v2 PageShell (WP2);
// not rendered anywhere until the new pages ship.
export function GridVeil() {
  return <div className="grid-veil" aria-hidden="true" />;
}
