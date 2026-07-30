// PaymentModal - Credit purchase modal, v2 skin (WP6.2): Buy-Credits anatomy
// from new_design/philosify-modals.html (packs grid + note + Cancel footer),
// matching the shared V2ModalsHost Buy Credits modal. The purchase flow is
// unchanged underneath: packs -> purchaseCredits(amount) -> Stripe Checkout
// redirect; pendingAction resume is handled by the caller (SpaceLock et al).
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreditsContext } from '@/contexts';
import { useLocalizedPricing, formatLocalPrice } from '@/hooks';
import { logger } from '@/utils';
import '../../styles/v2-pages/account.css';

export function PaymentModal({ isOpen, onClose }) {
  const { t, i18n } = useTranslation();
  const { balance, purchaseCredits } = useCreditsContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pricing = useLocalizedPricing(isOpen);

  // tier is the legacy SKU sent to the backend; credits is what the user gets
  const creditOptions = [
    { tier: 10, credits: 20, price: 'US$6.00', amount: 6.0, perAnalysis: 'US$0.30' },
    { tier: 20, credits: 40, price: 'US$10.00', amount: 10.0, perAnalysis: 'US$0.25' },
    { tier: 50, credits: 100, price: 'US$20.00', amount: 20.0, perAnalysis: 'US$0.20' },
  ];

  // Approximate local-currency price (mirrors Stripe Adaptive Pricing);
  // Stripe confirms the exact figure at checkout
  const localPriceFor = (tier) => {
    if (!pricing?.approximate) return null;
    const pkg = pricing.packages.find((p) => p.tier === String(tier));
    return pkg ? formatLocalPrice(pkg.amountLocal, pricing.currency, i18n.language) : null;
  };

  const handlePurchase = async (amount) => {
    if (loading) return; // Prevent double-clicks

    setError('');
    setLoading(true);

    try {
      logger.log('[PaymentModal] Initiating purchase for $' + amount);
      await purchaseCredits(amount);
      // Redirects to Stripe, so won't execute after
    } catch (err) {
      logger.error('[PaymentModal] Purchase error:', err);
      setError(
        err.message ||
          t('payment.errorDefault', { defaultValue: 'Payment failed. Please try again.' })
      );
      setLoading(false);
    }
  };

  // Escape closes (v2 modal kit parity)
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalCredits = balance?.total || 0;
  const freeRemaining = balance?.freeRemaining || 0;

  return (
    <div
      className="v2 pay-surface"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mwrap" role="dialog" aria-modal="true" aria-labelledby="pay-title">
        <div className="mhead">
          <h2 id="pay-title">{t('payment.title')}</h2>
          <button className="x" onClick={onClose} aria-label="Close">
            &#10005;
          </button>
        </div>
        <div className="mbody">
          {error && <div className="aerr">{error}</div>}

          <div className="pay-balance">
            <span className="pay-balance-label">{t('payment.currentBalance')}</span>
            <span className="pay-balance-n">{totalCredits}</span>
            {freeRemaining > 0 && (
              <span className="pay-balance-free">
                ({freeRemaining} {t('payment.freeRemaining')})
              </span>
            )}
          </div>

          <div className="packs">
            {creditOptions.map((option, i) => (
              <a
                key={option.tier}
                href="#pack"
                className={`cell pack${loading ? ' waiting' : ''}`}
                aria-disabled={loading || undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (!loading) handlePurchase(option.amount);
                }}
              >
                {i === 1 && <span className="best">{t('v2.commerce.bestValue', 'Best value')}</span>}
                <span className="n">{option.credits}</span>
                <span className="u">{t('payment.creditsSuffix')}</span>
                <span className="pr">
                  {localPriceFor(option.tier) ? (
                    <>
                      &#8776; {localPriceFor(option.tier)}
                      <span className="usd">{option.price}</span>
                    </>
                  ) : (
                    option.price
                  )}
                </span>
              </a>
            ))}
          </div>

          {pricing?.approximate && <div className="mnote">{t('payment.localPriceNote')}</div>}

          {loading && (
            <div className="mnote">
              {t('payment.redirecting', { defaultValue: 'Redirecting to payment...' })}
            </div>
          )}

          <div className="mnote">
            {t('payment.securePayment', { defaultValue: 'Secure Payment' })} &middot; Stripe
          </div>
        </div>
        <div className="cfoot">
          <button className="btns" onClick={onClose}>
            {t('v2.commerce.cancel', 'Cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
