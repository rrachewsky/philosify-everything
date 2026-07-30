// PageShell - v2 page chrome (Design Law §4, C.3 header ruling 30 Jul)
// Fixed header band (lockup + session chrome) + bottom HUD corners +
// page column + footer. Content takes padding-top = header height (CSS).
import { GridVeil } from '../common';
import { FooterV2 } from './FooterV2.jsx';
import { HeaderBar } from './HeaderBar.jsx';
import '../../styles/v2-components.css';

// Top HUD corners retired with the fixed header (C.3); bottom pair stays.
export function HudFrame() {
  return (
    <>
      <span className="hc bl" aria-hidden="true" />
      <span className="hc br" aria-hidden="true" />
    </>
  );
}

export function PageShell({
  variant = 'module', // 'module' | 'interior' (kept for page-level CSS hooks)
  status,
  nav, // optional session-chrome override (V2Gallery mock); default NavAccount
  footer = 'module', // 'module' | 'landing' | null
  children,
}) {
  return (
    <div className="v2">
      <GridVeil />
      <HeaderBar status={status} nav={nav} />
      <HudFrame />
      <div className={`page${variant === 'interior' ? ' interior' : ''}`}>{children}</div>
      {footer && <FooterV2 variant={footer} />}
    </div>
  );
}
