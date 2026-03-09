// PaymentSuccess - Payment successful page
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/common';
import { useAuth } from '../hooks';
import { useCreditsContext } from '../contexts';
import { verifyPayment } from '../services/api';
import { logger, getPendingAction } from '../utils';

export function PaymentSuccess() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { balance, fetchBalance, setBalance } = useCreditsContext();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [displayBalance, setDisplayBalance] = useState(null);
  const hasProcessedRef = useRef(false); // Prevent duplicate processing

  // Get params from URL
  const sessionId = searchParams.get('session_id');
  const [creditsPurchased, setCreditsPurchased] = useState(null); // Get from backend, NOT URL

  logger.log(
    '[PaymentSuccess] Component render - sessionId from URL:',
    sessionId,
    'user:',
    user ? 'exists' : 'null',
    'authLoading:',
    authLoading
  );

  useEffect(() => {
    logger.log(
      '[PaymentSuccess] useEffect triggered - sessionId:',
      sessionId,
      'user:',
      user ? 'exists' : 'null',
      'authLoading:',
      authLoading
    );

    // Verify payment and update balance
    const processPayment = async () => {
      logger.log('[PaymentSuccess] Processing payment - user state:', user ? 'loaded' : 'null');

      if (!user || !sessionId) {
        logger.log('[PaymentSuccess] Missing user or sessionId:', {
          user: !!user,
          sessionId: !!sessionId,
        });
        return;
      }

      // Prevent duplicate processing
      if (hasProcessedRef.current) {
        logger.log('[PaymentSuccess] Already processed, skipping...');
        return;
      }
      hasProcessedRef.current = true;

      setLoading(true);
      setVerifying(true);

      try {
        logger.log('[PaymentSuccess] Calling verifyPayment for session:', sessionId);

        // Call backend to verify payment and update database
        const result = await verifyPayment(sessionId);
        logger.log('[PaymentSuccess] Verification result:', result);

        if (result.success) {
          // Verification succeeded - set balance and credits
          setCreditsPurchased(result.credits);
          const newBalanceObj = {
            total: result.newBalance,
            credits: result.newBalance,
            freeRemaining: 0,
          };
          setDisplayBalance(newBalanceObj);

          // Set global balance directly from verifyPayment result (no API call needed)
          setBalance(newBalanceObj);

          logger.log(
            '[PaymentSuccess] Payment verified, credits added:',
            result.credits,
            'New balance:',
            result.newBalance
          );
        } else {
          // Verification failed
          logger.error('[PaymentSuccess] Verification failed:', result.error);
          setError(result.error || t('paymentSuccess.verificationFailed'));
        }
      } catch (err) {
        logger.error('[PaymentSuccess] Error verifying payment:', err);
        // Map sentinel codes to localized messages
        if (err.message === 'PAYMENT_SESSION_MISSING') {
          setError(t('errors.paymentSessionMissing'));
        } else if (err.message === 'PAYMENT_VERIFY_FAILED') {
          setError(t('errors.paymentVerifyFailed'));
        } else if (err.message === 'UNAUTHORIZED') {
          setError(t('errors.signInRequired'));
        } else {
          setError(t('paymentSuccess.verificationError'));
        }
      } finally {
        setLoading(false);
        setVerifying(false);
      }
    };

    // Wait for auth to finish loading
    if (authLoading) {
      logger.log('[PaymentSuccess] Auth still loading, waiting...');
      return;
    }

    // Process payment when user is authenticated
    if (user && sessionId) {
      logger.log('[PaymentSuccess] User and sessionId present, processing payment');
      processPayment();
    } else {
      logger.log(
        '[PaymentSuccess] Missing requirements - user:',
        !!user,
        'sessionId:',
        !!sessionId
      );

      // If no user after auth loaded, session was lost - redirect to sign in
      if (!user) {
        logger.error('[PaymentSuccess] No user after Stripe redirect. Redirecting to home...');
        setError(t('paymentSuccess.signInRequired'));
        setLoading(false);
        setTimeout(() => navigate('/'), 3000);
      }
    }
  }, [user, authLoading, sessionId, fetchBalance, navigate, t, setBalance]);

  // Sync displayBalance with global balance ONLY if we don't have one from verifyPayment
  useEffect(() => {
    logger.log(
      '[PaymentSuccess] Sync effect - balance:',
      balance,
      'verifying:',
      verifying,
      'displayBalance:',
      displayBalance
    );
    // Only sync if:
    // 1. We have a global balance
    // 2. We're not currently verifying
    // 3. We don't already have a displayBalance from verifyPayment (or it's stale)
    if (balance && !verifying && !displayBalance) {
      logger.log('[PaymentSuccess] Syncing displayBalance with global balance:', balance);
      setDisplayBalance(balance);
    }
  }, [balance, verifying, displayBalance, setBalance]);

  const handleReturn = () => {
    const pending = getPendingAction();
    if (pending) {
      // Colloquium actions with a threadId — open community hub + colloquium
      if (pending.threadId && pending.type?.startsWith('colloquium:')) {
        navigate('/', { state: { openColloquiumId: pending.threadId } });
        return;
      }
      // Colloquium propose / open-debate — open community hub to debates tab
      if (
        pending.type === 'colloquium:propose' ||
        pending.type === 'colloquium:proposeOpenDebate'
      ) {
        navigate('/', { state: { openCommunity: 'debates' } });
        return;
      }
      // Space unlock — open community hub to that space tab
      if (pending.type === 'space:unlock') {
        navigate('/', { state: { openCommunity: pending.space || 'underground' } });
        return;
      }
      // Analysis — return home (track is restored from pending action)
      if (pending.type === 'analysis') {
        navigate('/');
        return;
      }
    }
    navigate('/');
  };

  logger.log(
    '[PaymentSuccess] Render - displayBalance:',
    displayBalance,
    'loading:',
    loading,
    'verifying:',
    verifying
  );

  return (
    <Modal
      isOpen={true}
      onClose={handleReturn}
      title={t('paymentSuccess.title')}
      maxWidth="420px"
      className="payment-success-modal"
    >
      {/* Success Icon */}
      <div className="text-center mb-6">
        <div className="status-icon status-icon--success">
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
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center mb-6">
        {loading ? (
          <>
            <p className="text-white-90 text-base mb-3">{t('paymentSuccess.loadingBalance')}</p>
            <div className="loading-spinner--sm mx-auto" />
          </>
        ) : error ? (
          <>
            <p className="text-warning text-base mb-3">⚠️ {error}</p>
            <p className="text-white-70 text-sm">
              {t('paymentSuccess.errorMessage', {
                defaultValue: 'This payment session is not valid or does not belong to you.',
              })}
            </p>
          </>
        ) : (
          <>
            <p className="text-white-90 text-base mb-3">{t('paymentSuccess.message')}</p>
            {creditsPurchased && (
              <p className="text-success text-lg font-bold">
                {t('paymentSuccess.creditsPurchased', { count: creditsPurchased })}
              </p>
            )}
          </>
        )}
      </div>

      {/* Updated Balance - Only show if verification succeeded */}
      {!error && (
        <div className="current-balance mb-6">
          <div className="current-balance-label">{t('payment.currentBalance')}</div>
          <div className="current-balance-amount">
            {displayBalance?.total !== undefined
              ? displayBalance.total
              : balance?.total !== undefined
                ? balance.total
                : '...'}
          </div>
          {(displayBalance?.freeRemaining || balance?.freeRemaining) > 0 && (
            <div className="text-sm text-white-70 mt-2">
              ({displayBalance?.freeRemaining || balance?.freeRemaining}{' '}
              {t('payment.freeRemaining')})
            </div>
          )}
        </div>
      )}

      {/* Return Button */}
      <button className="form-button mt-3" onClick={handleReturn}>
        {t('paymentSuccess.returnButton')}
      </button>
    </Modal>
  );
}

export default PaymentSuccess;
