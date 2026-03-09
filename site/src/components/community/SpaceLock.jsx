// SpaceLock - Unlock overlay for credit-gated spaces
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { config } from '@/config';
import { PaymentModal } from '../payment/PaymentModal.jsx';
import { setPendingAction, getPendingAction, clearPendingAction } from '@utils/pendingAction.js';
import { logger } from '@utils';

export function SpaceLock({ space, onUnlocked }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const autoRetryRef = useRef(false);

  // Space metadata
  const spaceInfo = {
    underground: {
      titleKey: 'community.underground.title',
      descriptionKey: 'community.underground.description',
      cost: 3,
    },
  };

  const info = spaceInfo[space] || { titleKey: space, descriptionKey: '', cost: 3 };

  const handleUnlock = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiUrl}/api/spaces/${space}/unlock`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 402 || data.code === 'INSUFFICIENT_CREDITS') {
          setPendingAction({ type: 'space:unlock', space });
          setShowBuyCredits(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Failed to unlock space');
      }

      // Notify parent to refresh access
      onUnlocked?.(space);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-retry after returning from payment with pending space:unlock action
  useEffect(() => {
    if (autoRetryRef.current) return;
    const pending = getPendingAction();
    if (pending?.type === 'space:unlock' && pending.space === space) {
      autoRetryRef.current = true;
      clearPendingAction();
      logger.log('[SpaceLock] Auto-retrying: unlock space', space);
      handleUnlock();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-lock">
      <div className="space-lock__icon">&#128274;</div>
      <div className="space-lock__title">{t(info.titleKey)}</div>
      <div className="space-lock__description">{t(info.descriptionKey)}</div>
      <div className="space-lock__cost">
        {t('community.underground.cost', { count: info.cost })}
      </div>
      {error && <div className="chat-error">{error}</div>}
      <button className="space-lock__unlock-btn" onClick={handleUnlock} disabled={loading}>
        {loading ? t('community.underground.unlocking') : t('community.underground.unlockAccess')}
      </button>
      <PaymentModal isOpen={showBuyCredits} onClose={() => setShowBuyCredits(false)} />
    </div>
  );
}

export default SpaceLock;
