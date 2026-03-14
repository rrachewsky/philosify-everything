// PWA utilities - Service Worker registration, install prompt, and push notifications
import logger from './logger.js';
import { getApiUrl } from '../config/index.js';

/**
 * Register service worker for PWA functionality
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // IMPORTANT (Cloudflare Pages):
      // Do NOT add query params to sw.js. Pages treats "/sw.js?v=..." as a different path,
      // which can get SPA-rewritten to index.html, causing "Not found" / invalid SW script.
      const swUrl = '/sw.js';
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      });

      logger.log('[PWA] Service Worker registered:', registration.scope);

      // Force update check on registration
      await registration.update();

      // SW manages its own cache lifecycle — no blanket cache clearing here.

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker waiting — notify user instead of forced reload
              logger.log('[PWA] New service worker available');
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
          logger.log('[PWA] SW update available — user can refresh at their convenience');
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
        // Handle push notification clicks (in-app navigation)
        if (event.data && event.data.type === 'PUSH_CLICK') {
          const url = event.data.url;
          if (url && url !== window.location.pathname) {
            logger.log('[PWA] Push click navigation to:', url);
            window.dispatchEvent(new CustomEvent('push-navigate', { detail: { url } }));
          }
        }
      });

      return registration;
    } catch (error) {
      logger.error('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Check if app is installed
 */
export function isInstalled() {
  // Check if running in standalone mode (installed PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // Check if running in fullscreen mode (iOS)
  if (window.navigator.standalone === true) {
    return true;
  }

  return false;
}

/**
 * Show install prompt (if browser supports it)
 */
export async function showInstallPrompt() {
  // Check if browser supports beforeinstallprompt event
  if (window.deferredPrompt) {
    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    logger.log('[PWA] User choice:', outcome);
    window.deferredPrompt = null;
    return outcome === 'accepted';
  }
  return false;
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

/**
 * Get current push notification permission state
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getPushPermission() {
  if (!('Notification' in window) || !('PushManager' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Check if push notifications are currently subscribed and saved on server.
 * Returns false if there's a stale browser subscription (e.g. VAPID key changed).
 * @returns {Promise<boolean>}
 */
export async function isPushSubscribed() {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    // Verify the subscription is actually saved on our server
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/push/vapid-key`, { credentials: 'include' });
    if (!res.ok) return false; // API error — show banner so user can subscribe

    const { publicKey } = await res.json();
    const currentKey = urlBase64ToUint8Array(publicKey);
    const subKey = new Uint8Array(subscription.options?.applicationServerKey || []);

    // If keys don't match, subscription is stale
    if (currentKey.length !== subKey.length) return false;
    for (let i = 0; i < currentKey.length; i++) {
      if (currentKey[i] !== subKey[i]) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Subscribe to push notifications.
 * Requests permission if needed, then subscribes with VAPID key.
 *
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function subscribeToPush() {
  // 1. Check browser support
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Push notifications not supported in this browser' };
  }

  try {
    // 2. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.log('[Push] Permission denied');
      return { success: false, error: 'Permission denied' };
    }

    // 3. Get VAPID public key from API
    const apiUrl = getApiUrl();
    const vapidRes = await fetch(`${apiUrl}/api/push/vapid-key`, {
      credentials: 'include',
    });

    if (!vapidRes.ok) {
      throw new Error('Failed to fetch VAPID key');
    }

    const { publicKey } = await vapidRes.json();

    // Convert VAPID key from base64url to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 4. Clear any stale subscription (e.g. VAPID key changed)
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      logger.log('[Push] Clearing stale subscription before re-subscribing');
      await existing.unsubscribe();
    }

    // 5. Subscribe via PushManager with current VAPID key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // 6. Send subscription to our API
    const subJson = subscription.toJSON();
    const saveRes = await fetch(`${apiUrl}/api/push/subscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      }),
    });

    if (!saveRes.ok) {
      throw new Error('Failed to save subscription on server');
    }

    logger.log('[Push] Successfully subscribed to push notifications');
    return { success: true };
  } catch (error) {
    logger.error('[Push] Subscribe failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe from push notifications.
 * Removes browser subscription and notifies server.
 *
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) {
    return { success: false, error: 'Service worker not supported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return { success: true }; // Already unsubscribed
    }

    const endpoint = subscription.endpoint;

    // Unsubscribe from browser
    await subscription.unsubscribe();

    // Notify server to remove subscription
    const apiUrl = getApiUrl();
    await fetch(`${apiUrl}/api/push/unsubscribe`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {}); // Best effort - browser already unsubscribed

    logger.log('[Push] Successfully unsubscribed from push notifications');
    return { success: true };
  } catch (error) {
    logger.error('[Push] Unsubscribe failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Convert a base64url-encoded string to Uint8Array
 * (needed for applicationServerKey)
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Initialize PWA features
 */
export async function initPWA() {
  // Skip service worker in development - causes reload loops with Vite HMR
  if (import.meta.env.DEV) {
    logger.log('[PWA] Skipping service worker in dev mode');
    return;
  }

  // Register service worker
  await registerServiceWorker();

  // NOTE: beforeinstallprompt and appinstalled listeners are registered
  // at module level in main.jsx to avoid race conditions. Chrome fires
  // beforeinstallprompt as soon as installability criteria are met, which
  // can happen before this async function runs.

  logger.log('[PWA] PWA initialized. Installed:', isInstalled());
}
