/**
 * Auto-prompt for push notifications when user is logged in.
 * Push is default ON: we proactively ask for permission.
 * Users who don't want push can turn it off in Account → Notifications.
 */
import { useEffect, useRef } from 'react';
import { getPushPermission, isPushSubscribed, subscribeToPush } from '../utils/pwa.js';

const AUTO_PROMPT_DELAY_MS = 2500;
const SESSION_KEY = 'philosify_push_auto_prompted';

export function useAutoSubscribePush(isAuthenticated) {
  const prompted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(async () => {
      if (prompted.current) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;

      try {
        const permission = getPushPermission();
        if (permission !== 'default') return; // Already granted or denied

        const subscribed = await isPushSubscribed();
        if (subscribed) return;

        prompted.current = true;
        sessionStorage.setItem(SESSION_KEY, '1');

        const result = await subscribeToPush();
        if (result.success) {
          // User granted — we're done
        }
        // If denied, permission becomes 'denied' — we won't prompt again (browser remembers)
      } catch {
        // Silently ignore — user can enable in Account → Notifications
      }
    }, AUTO_PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);
}
