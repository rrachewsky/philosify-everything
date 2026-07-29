// Ticker - v2 module ticker line: bright text left + silver stat right
// (Design Law §4 module page order)
export function Ticker({ stat, children }) {
  return (
    <div className="tick">
      <span>{children}</span>
      {stat && <b>{stat}</b>}
    </div>
  );
}
