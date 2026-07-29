// Pill - v2 status pill (Design Law §4: radius 999px, tracked uppercase)
export function Pill({ silver = false, className = '', children, ...props }) {
  const style = silver
    ? { color: 'var(--silver)', borderColor: 'var(--strong)' }
    : undefined;
  return (
    <span className={`pill${className ? ` ${className}` : ''}`} style={style} {...props}>
      {children}
    </span>
  );
}
