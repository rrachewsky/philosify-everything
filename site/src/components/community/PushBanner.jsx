// ============================================================
// PushBanner - Subtle push notification opt-in banner
// ============================================================
// Shows at the bottom of CommunityHub when push is not yet enabled.
// User requirement: subtle, non-intrusive, not a modal.
// Appears only once per session unless dismissed (then stays hidden).
// If permission is 'denied' or 'unsupported', banner never shows.

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getPushPermission, isPushSubscribed, subscribeToPush } from '../../utils/pwa.js';

const DISMISSED_KEY = 'philosify_push_banner_dismissed';

export function PushBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Don't show if browser doesn't support push
        const permission = getPushPermission();
        if (permission === 'unsupported' || permission === 'denied') return;

        // Don't show if already subscribed
        const subscribed = await isPushSubscribed();
        if (subscribed) return;

        // Don't show if dismissed this session
        if (sessionStorage.getItem(DISMISSED_KEY)) return;

        if (!cancelled) setVisible(true);
      } catch (err) {
        // On error, show banner so user can subscribe
        console.warn('[PushBanner] Check failed, showing banner:', err);
        if (!cancelled) setVisible(true);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEnable = useCallback(async () => {
    setSubscribing(true);
    const result = await subscribeToPush();
    setSubscribing(false);

    if (result.success) {
      setVisible(false);
    }
    // If permission denied, hide banner permanently for this session
    if (result.error === 'Permission denied') {
      sessionStorage.setItem(DISMISSED_KEY, '1');
      setVisible(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="push-banner">
      <div className="push-banner__content">
        <span className="push-banner__text">{t('community.push.bannerText')}</span>
        <div className="push-banner__actions">
          <button className="push-banner__enable" onClick={handleEnable} disabled={subscribing}>
            {subscribing ? t('community.push.enabling') : t('community.push.enable')}
          </button>
          <button className="push-banner__dismiss" onClick={handleDismiss} aria-label="Dismiss">
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}

export default PushBanner;
