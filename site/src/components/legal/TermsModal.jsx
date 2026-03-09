// TermsModal - Terms of Service modal
import { useTranslation } from 'react-i18next';
import { Modal } from '../common';

export function TermsModal({ isOpen, onClose }) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('terms.title')}
      maxWidth="600px"
      className="legal-modal"
    >
      <div className="legal-content">
        <p>
          <strong>{t('terms.effectiveDate')}</strong> {t('terms.date')}
        </p>

        <h3>{t('terms.section1Title')}</h3>
        <p>{t('terms.section1Content')}</p>

        <h3>{t('terms.section2Title')}</h3>
        <p>{t('terms.section2Content')}</p>

        <h3>{t('terms.section3Title')}</h3>
        <p>{t('terms.section3Content')}</p>

        <h3>{t('terms.section4Title')}</h3>
        <p>{t('terms.section4Content')}</p>

        <h3>{t('terms.section5Title')}</h3>
        <p>{t('terms.section5Content')}</p>

        <h3>{t('terms.section6Title')}</h3>
        <p>{t('terms.section6Content')}</p>

        <h3>{t('terms.section7Title')}</h3>
        <p>{t('terms.section7Content')}</p>

        <p className="legal-footer">
          {t('terms.contactFooter')} <a href="mailto:bob@philosify.org">bob@philosify.org</a>
        </p>
      </div>
    </Modal>
  );
}

export default TermsModal;
