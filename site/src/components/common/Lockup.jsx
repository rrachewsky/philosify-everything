// Lockup - the official Philosify brand lockup (Design Law §1.3)
// Placed only as the single official image asset — never rebuilt from
// parts (owl file + CSS line + live text). Always a link home.
import { Link } from 'react-router-dom';
import './Lockup.css';

// Image heights lifted from the approved mockups; the owl inside the
// vertical asset is 528/646 of image height → owl 132 / 96 / 64 px.
const VARIANTS = {
  landing: { src: '/brand/philosify-logo-lockup.png', height: 162, plate: 'lock-plate' },
  module: { src: '/brand/philosify-logo-lockup.png', height: 117, plate: 'lock-plate' },
  interior: { src: '/brand/philosify-logo-lockup.png', height: 78, plate: 'lock-plate' },
  auth: { src: '/brand/philosify-logo-lockup.png', height: 105, plate: 'lock-plate' },
  footer: { src: '/brand/philosify-logo-horizontal.png', height: 32, plate: 'lock-plate-s' },
};

export function Lockup({ variant = 'module', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.module;
  return (
    <Link
      to="/"
      className={`lockup ${v.plate} ${className}`.trim()}
      aria-label="philosify — home"
    >
      <img
        src={v.src}
        alt="philosify"
        style={{ height: `${v.height}px`, width: 'auto', display: 'block' }}
      />
    </Link>
  );
}
