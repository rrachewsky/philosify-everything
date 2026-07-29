// PageShell - v2 page chrome (Design Law §4, module-template standard)
// HUD corners + telemetry chrome + centered lockup band + footer.
import { GridVeil, Lockup } from '../common';
import { FooterV2 } from './FooterV2.jsx';
import '../../styles/v2-components.css';

export function HudFrame({ status }) {
  return (
    <>
      <span className="hc tl" aria-hidden="true" />
      <span className="hc tr" aria-hidden="true" />
      <span className="hc bl" aria-hidden="true" />
      <span className="hc br" aria-hidden="true" />
      {status && <div className="hudtxt hud-status">{status}</div>}
    </>
  );
}

export function NavChrome({ children }) {
  return <nav className="hudtxt navr">{children}</nav>;
}

export function PageShell({
  variant = 'module', // 'module' (81px top) | 'interior' (76px top)
  status,
  nav,
  footer = 'module', // 'module' | 'landing' | null
  lockup, // override Lockup variant; defaults to match shell variant
  children,
}) {
  const lockupVariant = lockup || (variant === 'module' ? 'module' : 'interior');
  return (
    <div className="v2">
      <GridVeil />
      <HudFrame status={status} />
      {nav && <NavChrome>{nav}</NavChrome>}
      <div className={`page${variant === 'interior' ? ' interior' : ''}`}>
        <div className="lockband">
          <Lockup variant={lockupVariant} />
        </div>
        {children}
      </div>
      {footer && <FooterV2 variant={footer} />}
    </div>
  );
}
