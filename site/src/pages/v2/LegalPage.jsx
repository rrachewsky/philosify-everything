// LegalPage - v2 /tos + /pp (mockup: new_design/philosify-legal.html).
// Interior chrome via PageShell; the REAL ToS/PP text comes from the
// existing i18n keys legal.terms.content / legal.privacy.content and is
// rendered through DOMPurify.sanitize exactly as pages/TermsOfService.jsx
// and pages/PrivacyPolicy.jsx do (default config, no options). Prose in
// the reading register (Newsreader); sticky Contents rail built from the
// document's own h2 headings.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { PageShell, ModuleHeader, Ticker } from '../../components/v2';
import { NavAccount } from '../../components/v2/NavAccount.jsx';
import { V2ModalsHost } from '../../components/v2/CommerceModals.jsx';
import '../../styles/v2-pages/legal.css';

// English fallbacks preserved verbatim from pages/TermsOfService.jsx and
// pages/PrivacyPolicy.jsx (used only when the i18n key is missing).
const FALLBACK = {
  terms: `
              <h2>1. Acceptance of Terms</h2>
              <p>By accessing and using Philosify, you accept and agree to be bound by the terms and provision of this agreement.</p>

              <h2>2. Use License</h2>
              <p>Permission is granted to use Philosify for personal, non-commercial use. This license shall automatically terminate if you violate any of these restrictions.</p>

              <h2>3. Service Description</h2>
              <p>Philosify provides philosophical analysis of music using AI technology. The analysis is based on Objectivist philosophy principles.</p>

              <h2>4. Credits and Payments</h2>
              <p>Users receive free credits upon signup. Additional credits can be purchased through our payment system. All sales are final.</p>

              <h2>5. User Conduct</h2>
              <p>You agree not to use the service for any unlawful purpose or to violate any laws in your jurisdiction.</p>

              <h2>6. Intellectual Property</h2>
              <p>The service and its original content, features, and functionality are owned by Philosify and are protected by international copyright laws.</p>

              <h2>7. Disclaimer</h2>
              <p>The service is provided "as is" without any warranties, expressed or implied. We do not guarantee the accuracy or completeness of any content.</p>

              <h2>8. Limitation of Liability</h2>
              <p>Philosify shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of the service.</p>

              <h2>9. Changes to Terms</h2>
              <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>

              <h2>10. Contact</h2>
              <p>For questions about these Terms, please contact us through our website.</p>
            `,
  privacy: `
              <h2>1. Information We Collect</h2>
              <p>We collect information you provide directly to us, including your email address, name, and payment information when you create an account or make purchases.</p>

              <h2>2. How We Use Your Information</h2>
              <p>We use your information to:
                <ul>
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                </ul>
              </p>

              <h2>3. Information Sharing</h2>
              <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with service providers who assist us in operating our service.</p>

              <h2>4. Data Storage and Security</h2>
              <p>We use Supabase for authentication and data storage. Your data is encrypted and stored securely. We implement industry-standard security measures to protect your information.</p>

              <h2>5. Cookies and Tracking</h2>
              <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve your experience.</p>

              <h2>6. Third-Party Services</h2>
              <p>We use third-party services including:
                <ul>
                  <li>Stripe for payment processing</li>
                  <li>Supabase for authentication and database</li>
                  <li>Cloudflare for hosting and content delivery</li>
                  <li>OpenAI, Google, and other AI providers for analysis</li>
                </ul>
              </p>

              <h2>7. Your Rights</h2>
              <p>You have the right to access, update, or delete your personal information. You can do this through your account settings or by contacting us.</p>

              <h2>8. Children's Privacy</h2>
              <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>

              <h2>9. Changes to This Policy</h2>
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>

              <h2>10. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us through our website.</p>
            `,
};

export default function LegalPage({ doc = 'terms' }) {
  const { t } = useTranslation();
  const isTerms = doc === 'terms';

  const title = isTerms
    ? t('v2.legal.termsTitle', {
        defaultValue: t('legal.terms.title', { defaultValue: 'Terms of Service' }),
      })
    : t('v2.legal.privacyTitle', {
        defaultValue: t('legal.privacy.title', { defaultValue: 'Privacy Policy' }),
      });

  // Sanitize (same call as the current legal pages), then index the h2
  // headings for the Contents rail and give each an anchor id.
  const { html, toc } = useMemo(() => {
    const raw = t(isTerms ? 'legal.terms.content' : 'legal.privacy.content', {
      defaultValue: FALLBACK[isTerms ? 'terms' : 'privacy'],
    });
    const clean = DOMPurify.sanitize(raw);
    const parsed = new DOMParser().parseFromString(clean, 'text/html');
    const items = [];
    parsed.body.querySelectorAll('h2').forEach((h, i) => {
      const id = `s${i + 1}`;
      h.id = id;
      items.push({ id, label: h.textContent.replace(/^\d+[.)]\s*/, '').trim() });
    });
    return { html: parsed.body.innerHTML, toc: items };
  }, [t, isTerms]);

  const jump = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView();
  };

  return (
    <PageShell variant="interior" nav={<NavAccount />} footer={null}>
      <div className="pg-legal">
        <ModuleHeader title={title}>
          <Ticker>{t('v2.legal.updated', 'Last updated // 27 Jul 2026')}</Ticker>
        </ModuleHeader>

        <div className="legalgrid">
          {/* Sanitized above with DOMPurify (default config, as the current legal pages) */}
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

        {/* Cross-document link. Lived in the retired Ticker `stat` prop
            (right-side stats removed by the C.4 ruling), so it never
            rendered; in the body it survives the one-line ticker clip. */}
        <p className="crossdoc">
          {isTerms ? (
            <Link to="/pp">{t('v2.legal.privacyLink', 'Privacy Policy')} →</Link>
          ) : (
            <Link to="/tos">{t('v2.legal.termsLink', 'Terms of Service')} →</Link>
          )}
        </p>
      </div>
      <V2ModalsHost />
    </PageShell>
  );
}
