// Lockup - the official Philosify brand lockup (Design Law §1.3)
// Placed only as the single official image asset — never rebuilt from
// parts (owl file + CSS line + live text). Always a link home.
// White theme swaps the SRC to the transparent black-ink assets
// (ruling 30 Jul 2026) — never a CSS filter/inversion, never a plate.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTheme } from '../../utils/theme';
import './Lockup.css';

// Image heights lifted from the approved mockups; the owl inside the
// vertical asset is 528/646 of image height → owl 132 / 96 / 64 px.
const VARIANTS = {
  landing: { asset: 'lockup', height: 162 },
  module: { asset: 'lockup', height: 117 },
  interior: { asset: 'lockup', height: 78 },
  auth: { asset: 'lockup', height: 105 },
  footer: { asset: 'horizontal', height: 32 },
};

const src = (asset, theme) =>
  `/brand/philosify-logo-${asset}${theme === 'white' ? '-black' : ''}.png`;

export function Lockup({ variant = 'module', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.module;
  const [theme, setThemeState] = useState(getTheme());
  useEffect(() => {
    const onTheme = (e) => setThemeState(e.detail);
    window.addEventListener('philosify-theme', onTheme);
    return () => window.removeEventListener('philosify-theme', onTheme);
  }, []);
  return (
    <Link to="/" className={`lockup ${className}`.trim()} aria-label="philosify — home">
      <img
        src={src(v.asset, theme)}
        alt="philosify"
        style={{ height: `${v.height}px`, width: 'auto', display: 'block' }}
      />
    </Link>
  );
}
