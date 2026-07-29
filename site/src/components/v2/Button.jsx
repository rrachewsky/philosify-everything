// Button - v2 (Design Law §4): primary = the inversion (white fill/black
// text, one per screen), secondary = hairline outline.
export function Button({ variant = 'primary', className = '', children, ...props }) {
  const cls = `${variant === 'primary' ? 'btnp' : 'btns'}${className ? ` ${className}` : ''}`;
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
