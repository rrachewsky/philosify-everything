# WP3 AGENT CONTRACT — page-builder conventions (binding)

You are building ONE v2 module page for Philosify on branch `redesign/v2`. Authority order: `new_design/philosify-design-law.md` (frozen) > your module's mockup HTML in `new_design/` (visual truth — lift, don't interpret) > `new_design/philosify-visual-reshape-spec.md` read through the Law (monochrome+silver; NO magenta/cyan voices, NO module tints). Functionality is NEVER sacrificed: every behavior the current sidebar implements must exist on your page (see `new_design/philosify-system-map.md` §4 for your module's endpoints/hooks).

## File boundaries (hard rules)
- Write ONLY: `site/src/pages/v2/<Module>Page.jsx` (replace the stub), optional extra components under `site/src/pages/v2/<module>/`, and `site/src/styles/v2-pages/<module>.css` (import it from your page). Scope every selector under `.v2 .pg-<module>`.
- Do NOT edit: Router.jsx, components/v2/* (use them as-is), styles/tokens.css, styles/v2-components.css, i18n files, contexts, hooks in site/src/hooks (REUSE them; if a hook is sidebar-coupled, copy the needed logic INTO your page rather than editing the hook), api/**.
- Do NOT run git commands. Do NOT deploy. You may run `cd site && npx vite build` to check compilation.

## Page skeleton (News-standard template)
```jsx
import { useTranslation } from 'react-i18next';
import { PageShell, ModuleHeader, Ticker, Cell, Button, Pill, Telemetry, ModalV2, Field,
         Verdict, AudioBar, ExpandableSection, ActionsRow, AdSlot, TrackCard } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import '../../styles/v2-pages/<module>.css';
export default function <Module>Page() {
  const { t } = useTranslation();
  return (
    <PageShell status="Analysis Engine // Active" nav={<NavAccount />}>
      <ModuleHeader title={t('v2.<module>.title', '<MODULE>')}>
        <Ticker stat={t(...)}>{...}</Ticker>
      </ModuleHeader>
      {/* content per mockup */}
    </PageShell>
  );
}
```
- PageShell provides grid veil, header ground, HUD chrome, centered lockup (links home), footer. Lockup/theme are handled — don't add your own.
- i18n: EVERY user-visible string via `t('v2.<module>.<key>', 'English default')`. English default must be the mockup's exact copy. List all keys you used in your final report (they get centralized in WP4).

## Functional wiring (per module — see system map §4)
- Reuse existing hooks/services (`useSpotifySearch`, `useNews`, `useColloquium`, services/api/*, etc.). Auth: `useAuth()`; balance: `useCreditsContext()` — never fetch /api/balance yourself.
- Credit-gated actions: check `balance.total`; if insufficient, call `setPendingAction({...})` (utils/pendingAction) with the SAME action shapes the current system uses, then open the Buy Credits modal via `window.dispatchEvent(new CustomEvent('v2-open-buy-credits'))`.
- Cost transparency: any button that spends credits shows its cost (silver credit label / pill) BEFORE the click, per mockups.
- **Payment-resume (Addendum 1):** on mount, read `location.state` and query params: if `location.state?.resume` or a pending action for your module exists (`getPendingAction()`), resume it exactly as the old `PaymentReturnHandler` + sidebar `openWithPendingAction` did. Also support `?analysis=<id>` (history replay): load via your module's detail endpoint (`GET /api/analysis/:id`, `/api/book-analysis/:id`, `/api/cinema-analysis/:id`, `/api/panel/:id`) and render the full result stack.
- **Ads (Addendum 2, billing-relevant):** mount `InlineAdSlot` (site/src/components/ads/InlineAdSlot.jsx) exactly where the sidebar does, pass `onAdLoaded` through, and keep `waitForMinimumAnalysisWindow` gating the result reveal. Do not restyle its internals; wrap it in the v2 `.slot`-style container only if the mockup shows one. Never silver, never on Unsafe Zone.
- 401 handling: follow the existing pattern (refresh via `GET /auth/session`, retry once).
- Escape/back: modules are PAGES — no overlay close button; the lockup links home. Modals (confirm-spend etc.) are ModalV2 transactions only.

## Law lint (your page must pass)
- No hex colors — tokens/aliases only. No fonts beyond Michroma/Inter/Newsreader stacks (`--fd/--fu/--fp`). Silver only for meaning, max one per region, never buttons/borders/ads. Square cells; inputs radius via token; pills 999px. Sentence case except tracked-uppercase chrome. `prefers-reduced-motion` respected (v2 CSS handles the shared bits).

## Report back (final message)
Return: files written; i18n keys added (key → English default); endpoints wired; the mockup features implemented (list); any current-system behavior you could NOT preserve and why (this triggers a stop-and-ask to Roberto — do not silently drop); build status.
