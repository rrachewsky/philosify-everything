// Terms of Service Page
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';

const CDN_URL = import.meta.env.VITE_CDN_URL;

export function TermsOfService() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      {/* Logo */}
      <div className="legal-page__header">
        <img
          src={`${CDN_URL}/logo.png`}
          alt="Philosify Logo"
          className="legal-page__logo"
          onClick={() => navigate('/')}
        />
      </div>

      {/* Content */}
      <div className="legal-page__content">
        <h1 className="legal-page__title">
          {t('legal.terms.title', { defaultValue: 'Terms of Service' })}
        </h1>

        <div className="legal-page__body">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                t('legal.terms.content', {
                  defaultValue: `
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
                })
              ),
            }}
          />
        </div>

        <div className="legal-page__footer">
          <button onClick={() => navigate('/')} className="legal-page__back-btn">
            {t('legal.backToHome', { defaultValue: 'Back to Home' })}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
