// FooterV2 - v2 footer, links only (ruling 30 Jul 2026: no lockup here —
// the brand lives in the permanent fixed bar).
export function FooterV2({ variant = 'module', links, children }) {
  return (
    <footer className={variant}>
      <nav>
        {children || (
          <>
            <a href="https://philosify.org">philosify.org</a>
            {links}
            <a href="/tos">Terms</a>
            <a href="/pp">Privacy</a>
            <a href="#">© 2026</a>
          </>
        )}
      </nav>
    </footer>
  );
}
