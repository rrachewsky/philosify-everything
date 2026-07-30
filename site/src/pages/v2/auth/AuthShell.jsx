// AuthShell - shared quiet chrome for /signin and /signup
// (mockup: new_design/philosify-auth.html). Auth pages are the quietest
// surfaces: no ads, no ticker, no module header, no footer — HUD corners,
// top-right chrome, and the auth lockup over the card (.awrap pattern).
import { GridVeil, Lockup } from '../../../components/common';
import { HudFrame, NavChrome } from '../../../components/v2';
import { NavAccount } from '../../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../../components/v2/CommerceModals.jsx';
import '../../../styles/v2-components.css';
import '../../../styles/v2-pages/auth.css';

export function AuthShell({ children }) {
  return (
    <div className="v2">
      <GridVeil />
      <div className="hudground" aria-hidden="true" />
      <HudFrame />
      <NavChrome>
        <NavAccount />
      </NavChrome>
      <div className="page interior pg-auth">
        <div className="awrap">
          <div className="alock">
            <Lockup variant="auth" />
          </div>
          {children}
        </div>
      </div>
      <V2ModalsHost />
    </div>
  );
}
