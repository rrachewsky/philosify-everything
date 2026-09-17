// MethodologyPage - v2 /methodology. The declared yardstick: why Objectivism,
// the five axes and their weights, the verdict scale, what an analysis is.
// Text comes from the i18n key legal.methodology.content (HTML, 18 languages;
// canonical PT essay in docs/philosify-metodologia-canonical-PT.md, EN
// reference validated 16 Sep 2026). Same sanitize + Contents-rail pattern as
// LegalPage (dedicated component by ruling 1 Sep 2026: not a legal document —
// no dated ticker, no cross-document link — and it keeps /tos + /pp untouched).
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { PageShell, ModuleHeader } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import '../../styles/v2-pages/legal.css';

export default function MethodologyPage() {
  const { t } = useTranslation();

  const title = t('v2.legal.methodologyTitle', {
    defaultValue: t('legal.methodology.title', { defaultValue: 'Methodology' }),
  });

  // Sanitize (default config, as LegalPage), then index the h2 headings for
  // the Contents rail and give each an anchor id.
  const { html, toc } = useMemo(() => {
    const raw = t('legal.methodology.content', { defaultValue: '' });
    const clean = DOMPurify.sanitize(raw);
    const parsed = new DOMParser().parseFromString(clean, 'text/html');
    const items = [];
    parsed.body.querySelectorAll('h2').forEach((h, i) => {
      const id = `s${i + 1}`;
      h.id = id;
      items.push({ id, label: h.textContent.replace(/^\d+[.)]\s*/, '').trim() });
    });
    return { html: parsed.body.innerHTML, toc: items };
  }, [t]);

  const jump = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView();
  };

  return (
    <PageShell variant="interior" nav={<NavAccount />} footer={null}>
      <div className="pg-legal pg-methodology">
        <ModuleHeader title={title} />

        <div className="legalgrid">
          {/* Sanitized above with DOMPurify (default config, as the legal pages) */}
          <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
          {toc.length > 0 && (
            <aside className="toc">
              <div className="tlab">{t('v2.legal.contents', 'Contents')}</div>
              {toc.map((item) => (
                <a key={item.id} href={`#${item.id}`} onClick={(e) => jump(e, item.id)}>
                  {item.label}
                </a>
              ))}
            </aside>
          )}
        </div>
      </div>
      <V2ModalsHost />
    </PageShell>
  );
}
