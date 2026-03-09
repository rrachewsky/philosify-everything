// Privacy Policy Page
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';

const CDN_URL = import.meta.env.VITE_CDN_URL;

export function PrivacyPolicy() {
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
          {t('legal.privacy.title', { defaultValue: 'Privacy Policy' })}
        </h1>

        <div className="legal-page__body">
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                t('legal.privacy.content', {
                  defaultValue: `
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

export default PrivacyPolicy;
