// Lockup - the official Philosify brand lockup (Design Law §1.3)
// Placed only as the single official image asset — never rebuilt from
// parts (owl file + CSS line + live text). Always a link home.
// White theme swaps the SRC to the transparent black-ink assets
// (ruling 30 Jul 2026) — never a CSS filter/inversion, never a plate.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTheme } from '../../utils/theme';
import './Lockup.css';

// Header ruling (C.3, 30 Jul): the lockup renders at ONE uniform size on
// every page — the fixed header band's vertical lockup, ~64px owl (the owl
// is 528/646 of image height → 78px image). The horizontal variant is
// retired: assets stay archived in /brand but nothing may use them.
const VARIANTS = {
  header: { asset: 'lockup', height: 78 },
};

const src = (asset, theme) =>
  `/brand/philosify-logo-${asset}${theme === 'white' ? '-black' : ''}.png`;

export function Lockup({ variant = 'header', className = '' }) {
  const v = VARIANTS[variant] || VARIANTS.header;
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
