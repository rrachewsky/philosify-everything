// ModuleHeader - v2 module title + marker line with end node
// (Design Law §4: top chrome → lockup → MODULE NAME → marker line → ticker)
export function MarkerLine({ draw = false }) {
  return <div className={`mrail${draw ? ' draw' : ''}`} aria-hidden="true" />;
}

export function ModuleHeader({ title, draw = false, children }) {
  return (
    <>
      <h1 className="mod">{title}</h1>
      <MarkerLine draw={draw} />
      {children}
    </>
  );
}
