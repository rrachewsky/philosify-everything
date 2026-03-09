// Service Worker for Philosify PWA
// IMPORTANT: Increment version to force cache invalidation when site updates
const CACHE_NAME = 'philosify-v11';
const RUNTIME_CACHE = 'philosify-runtime-v11';

// API URL for fetching push notification content
// API URL for fetching push notification content
// Robust detection: use custom origin if provided, else fallback to standard
const API_URL = (() => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return 'http://localhost:8787';
  }
  // Try to use a placeholder that can be replaced during build,
  // or fallback to the standard production API
  return 'https://api-everything.philosify.org';
})();

// Keep production console clean
const DEBUG_SW = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const log = (...args) => {
  if (DEBUG_SW) console.log(...args);
};

// Assets to cache on install
const PRECACHE_ASSETS = ['/', '/index.html', '/logo.png', '/favicon.ico'];

// Install event - cache assets
self.addEventListener('install', (event) => {
  log('[SW] Installing service worker...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        log('[SW] Caching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old versioned caches only
self.addEventListener('activate', (event) => {
  log('[SW] Activating service worker - cleaning stale caches...');
  const currentCaches = new Set([CACHE_NAME, RUNTIME_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        // Delete only caches that don't match the CURRENT version
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.has(name))
            .map((name) => {
              log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        // Soft notification — let the UI decide whether to refresh
        return self.clients.matchAll().then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
          });
        });
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests (always use network)
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Skip external resources (fonts, CDN, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);

      // For HTML/index.html - ALWAYS fetch from network first (never use cache)
      // This prevents old site from being served after refresh
      if (
        event.request.destination === 'document' ||
        event.request.url.endsWith('/') ||
        event.request.url.endsWith('/index.html')
      ) {
        try {
          const networkResponse = await fetch(event.request, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              Pragma: 'no-cache',
            },
          });
          // Delete any cached version
          if (cachedResponse) {
            caches.open(RUNTIME_CACHE).then((cache) => cache.delete(event.request));
            caches.open(CACHE_NAME).then((cache) => cache.delete(event.request));
          }
          return networkResponse;
        } catch (error) {
          // Only use cache if network completely fails
          return cachedResponse || new Response('Network error', { status: 503 });
        }
      }

      // For CSS files - stale-while-revalidate: serve cached immediately,
      // update cache in background. One transient error won't break styling.
      if (event.request.url.match(/\.css$/)) {
        try {
          const networkResponse = await fetch(event.request, { cache: 'no-store' });
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, responseToCache));
            return networkResponse;
          }
        } catch (error) {
          log('[SW] CSS network fetch failed, using cache fallback');
        }
        // Fallback to any cached version (better than unstyled app)
        if (cachedResponse) return cachedResponse;
        return new Response('/* CSS unavailable */', {
          headers: { 'Content-Type': 'text/css' },
          status: 503,
        });
      }

      // For JS files, NETWORK FIRST (never use old cached JS)
      if (event.request.url.match(/\.js$/)) {
        try {
          const networkResponse = await fetch(event.request, { cache: 'no-store' });
          if (networkResponse && networkResponse.status === 200) {
            // Update cache with fresh version in background
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          }
        } catch (error) {
          log('[SW] Network fetch failed for JS, trying cache as fallback');
          // Only use cache if network completely fails
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        // If both fail, return error
        return new Response('JS fetch failed', { status: 503 });
      }

      // For other assets (images, fonts), try network first
      try {
        const networkResponse = await fetch(event.request, { cache: 'reload' });
        if (networkResponse && networkResponse.status === 200) {
          // Cache fresh version
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }
      } catch (error) {
        // If network fails, use cache as fallback
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // If both fail, return error
      return new Response('Asset fetch failed', { status: 503 });
    })()
  );
});

// Handle background sync (for offline actions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analyses') {
    event.waitUntil(syncAnalyses());
  }
});

async function syncAnalyses() {
  // Implement offline analysis queue sync when back online
  log('[SW] Syncing offline analyses...');
}

// ============================================================
// PUSH NOTIFICATIONS (Empty Push + Fetch Pattern)
// ============================================================
// The server sends an empty push (wake-up signal only).
// We then fetch the actual notification content from the API.
// This avoids encryption issues with Cloudflare Workers.

self.addEventListener('push', (event) => {
  log('[SW] Push event received');
  event.waitUntil(handlePushEvent());
});

async function handlePushEvent() {
  // Philosify branding: large icon for notification panel, badge for status bar
  const iconUrl = new URL('/logo.png', self.location.origin).href;
  // Badge: small monochrome icon shown in Android status bar / notification tray.
  // Using favicon.ico as it's small and recognizable. Chrome ignores badge on desktop.
  const badgeUrl = new URL('/favicon.ico', self.location.origin).href;

  try {
    // 1. Get our subscription endpoint to identify ourselves
    const subscription = await self.registration.pushManager.getSubscription();
    if (!subscription) {
      log('[SW] No push subscription found');
      return showFallbackNotification(iconUrl, badgeUrl);
    }

    const endpoint = subscription.endpoint;
    log('[SW] Fetching pending notifications...');

    // 2. Fetch pending notifications from API
    //    No auth cookie needed: endpoint proves device identity
    let notifications = await fetchPendingNotifications(endpoint);

    // Retry once with backoff if no notifications (race condition: DB write may not have committed yet)
    if (notifications.length === 0) {
      log('[SW] No notifications yet, retrying in 500ms...');
      await new Promise((resolve) => setTimeout(resolve, 500));
      notifications = await fetchPendingNotifications(endpoint);
    }

    // If still nothing, show a minimal notification (push must always show something)
    if (notifications.length === 0) {
      log('[SW] No notifications after retry, showing minimal');
      return self.registration.showNotification('Philosify', {
        body: 'You have new activity',
        icon: iconUrl,
        badge: badgeUrl,
        tag: 'philosify-activity',
        data: { url: '/community?tab=messages' },
      });
    }

    // 3. Show each notification with proper branding and sender info
    const notificationIds = [];
    for (const notif of notifications) {
      notificationIds.push(notif.id);

      // Build notification title: include sender name when available
      // e.g. "Alice via Philosify" or just "Philosify"
      const title = notif.sender_name ? `${notif.sender_name}` : notif.title || 'Philosify';

      const options = {
        body: notif.body || 'You have a new message',
        icon: iconUrl,
        badge: badgeUrl,
        vibrate: [100, 50, 100, 50, 200], // Distinct Philosify vibration pattern
        tag: notif.tag || `philosify-${notif.type || 'dm'}`,
        renotify: true, // Vibrate again even if tag matches existing notification
        requireInteraction: true, // Keep visible until user interacts (desktop)
        timestamp: Date.now(),
        data: {
          url: notif.url || '/community?tab=messages',
          type: notif.type || 'dm',
        },
        // Actions shown on expanded notification (Android + some desktop browsers)
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      };

      await self.registration.showNotification(title, options);
      log('[SW] Showed notification:', title, '-', notif.body);
    }

    // 4. Acknowledge so they don't show again on next push
    if (notificationIds.length > 0) {
      try {
        await fetch(`${API_URL}/api/push/ack`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: notificationIds, endpoint }),
        });
        log('[SW] Acknowledged', notificationIds.length, 'notification(s)');
      } catch (err) {
        log('[SW] Failed to ack:', err.message);
      }
    }
  } catch (err) {
    log('[SW] Push error:', err.message);
    return showFallbackNotification(iconUrl, badgeUrl);
  }
}

/**
 * Fetch pending notifications from the API.
 * Returns an array of notification objects, or empty array on failure.
 */
async function fetchPendingNotifications(endpoint) {
  try {
    const response = await fetch(`${API_URL}/api/push/pending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      log('[SW] /api/push/pending returned', response.status);
      return [];
    }

    const data = await response.json();
    return data.notifications || [];
  } catch (err) {
    log('[SW] Fetch pending error:', err.message);
    return [];
  }
}

async function showFallbackNotification(iconUrl, badgeUrl) {
  await self.registration.showNotification('Philosify', {
    body: 'You have new activity',
    icon: iconUrl,
    badge: badgeUrl,
    vibrate: [100, 50, 100, 50, 200],
    tag: 'philosify-fallback',
    data: {
      url: '/community?tab=messages',
      type: 'general',
    },
  });
}

// Handle notification clicks - open the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // "Dismiss" action: just close, don't navigate
  if (event.action === 'dismiss') return;

  const targetPath = event.notification.data?.url || '/';
  const fullUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    // Try to focus existing window first, open new one if none found
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Look for an existing Philosify window
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate existing window to the target URL
          if ('navigate' in client) {
            return client.navigate(fullUrl).then((c) => c.focus());
          }
          client.postMessage({ type: 'PUSH_CLICK', url: targetPath });
          return client.focus();
        }
      }
      // No existing window - open new one with absolute URL
      return clients.openWindow(fullUrl);
    })
  );
});
