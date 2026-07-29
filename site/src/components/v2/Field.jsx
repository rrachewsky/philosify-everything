// Field - v2 input (Design Law §4: inset ground, hairline border,
// radius 6px per tokens; label = tracked uppercase chrome)
export function Field({ label, textarea = false, className = '', ...props }) {
  const cls = `f${className ? ` ${className}` : ''}`;
  return (
    <>
      {label && <label className="f">{label}</label>}
      {textarea ? <textarea className={cls} {...props} /> : <input className={cls} {...props} />}
    </>
  );
}
