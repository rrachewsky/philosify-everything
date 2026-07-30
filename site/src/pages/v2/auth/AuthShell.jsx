// AuthShell - shared quiet chrome for /signin and /signup
// (mockup: new_design/philosify-auth.html; C.3 header ruling 30 Jul).
// Auth pages are the quietest surfaces: no ads, no ticker, no module
// header, no footer — the fixed header band carries the brand and the
// session chrome; the card sits alone in the column.
import { GridVeil } from '../../../components/common';
import { HudFrame, HeaderBar } from '../../../components/v2';
import { V2ModalsHost } from '../../../components/v2/CommerceModals.jsx';
import '../../../styles/v2-components.css';
import '../../../styles/v2-pages/auth.css';

export function AuthShell({ children }) {
  return (
    <div className="v2">
      <GridVeil />
      <HeaderBar />
      <HudFrame />
      <div className="page interior pg-auth">
        <div className="awrap">{children}</div>
      </div>
      <V2ModalsHost />
    </div>
  );
}
