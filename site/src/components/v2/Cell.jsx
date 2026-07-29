// Cell - v2 module cell (Design Law §4): square corners, hairline border,
// corner → affordance, underline sweep on hover.
// variant 'landing' = .cell9 (24px pad); 'compact' = .cell (20px pad, module pages).
import { Link } from 'react-router-dom';

export function Cell({
  variant = 'compact',
  inverted = false,
  to,
  href,
  onClick,
  title,
  credit,
  children,
  className = '',
  ...props
}) {
  const base = variant === 'landing' ? 'cell9' : 'cell';
  const cls = `${base}${inverted ? ' uz' : ''}${className ? ` ${className}` : ''}`;
  const content = (
    <>
      {title && <h2>{title}</h2>}
      {children && <p>{children}</p>}
      {credit && <span className="credit">{credit}</span>}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} onClick={onClick} {...props}>
      {content}
    </a>
  );
}
