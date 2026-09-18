// FooterV2 - v2 footer, links only (ruling 30 Jul 2026: no lockup here —
// the brand lives in the permanent fixed bar). `end` renders after the
// nav as the footer's last item (landing: the inline theme switch).
import { useTranslation } from 'react-i18next';

export function FooterV2({ variant = 'module', links, children, end }) {
  const { t } = useTranslation();
  return (
    <footer className={variant}>
      <nav>
        {children || (
          <>
            <a href="https://philosify.org">philosify.org</a>
            {links}
            <a href="/tos">{t('v2.landing.terms', 'Terms')}</a>
            <a href="/pp">{t('v2.landing.privacy', 'Privacy')}</a>
            <a href="/methodology">{t('v2.legal.methodologyLink', 'Methodology')}</a>
            <a href="#">© 2026</a>
          </>
        )}
      </nav>
      {end}
    </footer>
  );
}
