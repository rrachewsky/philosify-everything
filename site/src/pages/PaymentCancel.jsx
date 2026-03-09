// PaymentCancel - Payment cancelled page
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/common';

export function PaymentCancel() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleTryAgain = () => {
    // Navigate home with state flag so App can re-open the payment modal
    navigate('/', { state: { openPaymentModal: true } });
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleReturnHome}
      title={t('paymentCancel.title')}
      maxWidth="420px"
      className="payment-cancel-modal"
    >
      {/* Cancel Icon */}
      <div className="text-center mb-6">
        <div className="status-icon status-icon--warning">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
      </div>

      {/* Cancel Message */}
      <div className="text-center mb-6">
        <p className="text-white-90 text-base mb-2">{t('paymentCancel.message')}</p>
        <p className="text-white-70 text-sm">{t('paymentCancel.subtitle')}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex-col gap-3">
        <button className="form-button button-gradient-brand" onClick={handleTryAgain}>
          {t('paymentCancel.tryAgainButton')}
        </button>

        <button className="form-button button-ghost-light" onClick={handleReturnHome}>
          {t('paymentCancel.returnHomeButton')}
        </button>
      </div>
    </Modal>
  );
}

export default PaymentCancel;
