// PrivacyModal - Privacy Policy modal
import { useTranslation } from 'react-i18next';
import { Modal } from '../common';

export function PrivacyModal({ isOpen, onClose }) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('privacy.title')}
      maxWidth="600px"
      className="legal-modal"
    >
      <div className="legal-content">
        <p>
          <strong>{t('privacy.effectiveDate')}</strong> {t('privacy.date')}
        </p>
        <p>{t('privacy.intro')}</p>

        <h3>{t('privacy.section1Title')}</h3>
        <p>{t('privacy.section1Content')}</p>

        <h3>{t('privacy.section2Title')}</h3>
        <p>{t('privacy.section2Content')}</p>

        <h3>{t('privacy.section3Title')}</h3>
        <p>{t('privacy.section3Content')}</p>

        <h3>{t('privacy.section4Title')}</h3>
        <p>{t('privacy.section4Content')}</p>

        <h3>{t('privacy.section5Title')}</h3>
        <p>{t('privacy.section5Content')}</p>

        <h3>{t('privacy.section6Title')}</h3>
        <p>{t('privacy.section6Content')}</p>

        <h3>{t('privacy.section7Title')}</h3>
        <p>{t('privacy.section7Content')}</p>

        <p className="legal-footer">
          {t('privacy.contactFooter')} <a href="mailto:bob@philosify.org">bob@philosify.org</a>
        </p>
      </div>
    </Modal>
  );
}

export default PrivacyModal;
