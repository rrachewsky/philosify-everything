// HeaderBar - the fixed brand band (C.3 ruling, 30 Jul): a full-width
// viewport-fixed strip carrying the centered official vertical lockup
// (uniform ~64px owl on every page) and the session chrome top-right
// inside the band. Ground is seamless: canvas + the same 64px grid as
// the page veil, no hairline, no shadow — the body scrolls beneath and
// the owl never moves. The landing adds the tagline under the lockup;
// every other page is lockup + chrome only.
import { Lockup } from '../common';
import { NavAccount } from './NavAccount.jsx';

export function HeaderBar({ tagline, status, nav }) {
  return (
    <header className="hdr">
      <div className="hdrgrid" aria-hidden="true" />
      {status && <div className="hudtxt hud-status">{status}</div>}
      <nav className="hudtxt navr">{nav !== undefined ? nav : <NavAccount />}</nav>
      <div className="hdrlock">
        <Lockup variant="header" />
      </div>
      {tagline && <div className="hdrtag">{tagline}</div>}
    </header>
  );
}
