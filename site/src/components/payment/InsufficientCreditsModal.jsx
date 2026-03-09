// InsufficientCreditsModal - Modal shown when user has no credits
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common';
import { CREDIT_PACKAGES } from '@/utils/constants';

export function InsufficientCreditsModal({ isOpen, onClose, onPurchase }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (amount) => {
    setLoading(true);
    try {
      await onPurchase(amount);
      // Redirects to Stripe, so won't execute after
    } catch (err) {
      console.error('[InsufficientCreditsModal] Purchase error:', err);
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('insufficientCredits.title')}
      maxWidth="420px"
      className="credits-modal"
    >
      {/* Warning Icon */}
      <div className="text-center mb-5">
        <div className="status-icon status-icon--sm status-icon--error">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
      </div>

      {/* Current Balance */}
      <div className="current-balance mb-4">
        <div className="current-balance-label">{t('payment.currentBalance')}</div>
        <div className="current-balance-amount">0</div>
      </div>

      {/* Message */}
      <div className="text-center mb-5">
        <p className="text-white-90 text-sm">{t('insufficientCredits.message')}</p>
      </div>

      {/* Credit Packages */}
      <div className="credits-options">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.tier}
            className={`credit-option ${loading ? 'disabled' : ''}`}
            onClick={() => !loading && handlePurchase(pkg.amount)}
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <div className="credit-option-left">
              <div className="credit-amount">{pkg.credits}</div>
              <div className="credit-analyses">{t('payment.creditsSuffix')}</div>
            </div>
            <div className="credit-price">US${pkg.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center text-white-70 text-sm mt-3">{t('payment.redirecting')}</div>
      )}

      {/* Divider */}
      <div className="auth-divider">
        <span>{t('payment.securePayment')}</span>
      </div>

      {/* Stripe Badge */}
      <div className="stripe-powered-badge">
        <span className="mr-3">{t('payment.poweredBy')}</span>
        <svg
          width="33"
          height="14"
          viewBox="0 0 33 14"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M32.956 5.977c0-2.577-1.266-4.612-3.692-4.612-2.433 0-3.93 2.035-3.93 4.584 0 3.025 1.71 4.557 4.168 4.557 1.197 0 2.1-.265 2.79-.636v-1.976c-.69.344-1.508.557-2.524.557-1.001 0-1.888-.344-2.002-1.544h5.162c0-.132.028-.661.028-.93zm-5.19-1.066c0-1.148.705-1.621 1.47-1.621.737 0 1.414.473 1.414 1.621h-2.884zm-5.358-3.52c-.963 0-1.582.45-1.93.768l-.126-.61h-2.226v13.066l2.524-.529.007-3.17c.355.252.88.608 1.738.608 1.758 0 3.356-1.396 3.356-4.64-.007-2.925-1.619-4.493-3.343-4.493zm-.607 6.958c-.58 0-.922-.204-1.162-.462l-.014-3.643c.26-.28.61-.49 1.176-.49.899 0 1.526 1.001 1.526 2.289 0 1.316-.613 2.306-1.526 2.306zm-6.993-9.283l2.531-.538V0l-2.531.529v1.537zm0 .818h2.531v9.622h-2.531V-.114zm-1.533.608l-.16-.608h-2.191v9.622h2.524V3.402c.594-.768 1.603-.628 1.916-.523v-2.32c-.32-.112-1.491-.315-2.089.517zM7.629 2.08c0-.768.623-.873 1.183-.873.803 0 1.821.241 2.623.676V-.077c-.873-.337-1.738-.489-2.623-.489C6.257-.566 4.5.692 4.5 3.158c0 3.818 5.26 3.206 5.26 4.858 0 .636-.558.845-1.337.845-.957 0-2.191-.39-3.158-.922v2.031c.98.426 1.972.608 3.158.608 2.623 0 4.492-1.288 4.492-3.727-.007-4.123-5.286-3.387-5.286-4.771z"
            fill="currentColor"
          />
        </svg>
      </div>
    </Modal>
  );
}

export default InsufficientCreditsModal;
