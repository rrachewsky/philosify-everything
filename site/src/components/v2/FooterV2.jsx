// FooterV2 - v2 footer with the horizontal lockup (Design Law §1.3)
import { Lockup } from '../common';

export function FooterV2({ variant = 'module', links, children }) {
  return (
    <footer className={variant}>
      <div className={variant === 'landing' ? 'brandline lock-plate-s' : undefined}>
        <Lockup variant="footer" />
      </div>
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
