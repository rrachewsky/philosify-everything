// Ticker - v2 module ticker line (universal anatomy, C.4 ruling 30 Jul):
// fixed label left, feed running to the edge. The right-side catalog
// stats are retired; feeds use the .t50 / .roll marquee kits.
export function Ticker({ children }) {
  return (
    <div className="tick">
      <span className="tkbody">{children}</span>
    </div>
  );
}
