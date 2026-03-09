// ============================================================
// Realtime Client Singleton
// ============================================================
// Centralized Supabase Realtime client shared across all hooks.
// Prevents N independent WebSocket connections (one per hook).
// Token refresh calls setAuth() on the existing connection —
// no channel teardown or reconnection needed.
//
// iOS Safari Handling:
// iOS aggressively closes WebSocket connections when tabs are
// backgrounded. We listen for visibilitychange and force
// reconnection when the tab becomes visible again.

import { createClient } from '@supabase/supabase-js';
import { getApiUrl } from '../config';
import { logger } from '../utils';

let supabaseInstance = null;
let initPromise = null;
let currentToken = null;
let authResolve = null;
let visibilityListenerAdded = false;
const authPromise = new Promise((resolve) => {
  authResolve = resolve;
});

/**
 * Force reconnection of the Realtime WebSocket.
 * Called when tab becomes visible (iOS fix).
 * Emits 'realtime-reconnected' event so hooks can refresh data.
 */
function forceReconnect() {
  if (!supabaseInstance) return;

  const ws = supabaseInstance.realtime;
  const state = ws.connectionState?.();

  logger.log(`[Realtime] Visibility change — connection state: ${state}`);

  // If disconnected or in a bad state, force reconnect
  if (state === 'closed' || state === 'disconnected' || !ws.isConnected?.()) {
    logger.log('[Realtime] Forcing reconnect after visibility change...');
    try {
      ws.connect();
      // Re-apply auth token after reconnect
      if (currentToken) {
        setTimeout(() => {
          ws.setAuth(currentToken);
          logger.log('[Realtime] Auth token re-applied after reconnect');
          // Notify hooks that reconnection happened — they may want to refetch data
          window.dispatchEvent(new CustomEvent('realtime-reconnected'));
        }, 500);
      }
    } catch (err) {
      logger.warn('[Realtime] Reconnect failed:', err.message);
    }
  } else {
    // Connection still active, but iOS may have missed messages while backgrounded
    // Emit event so hooks can refresh data just in case
    logger.log('[Realtime] Connection still active, emitting refresh hint');
    window.dispatchEvent(new CustomEvent('realtime-reconnected'));
  }
}

/**
 * Setup visibility change listener for iOS.
 * Only added once when the client is first initialized.
 */
function setupVisibilityListener() {
  if (visibilityListenerAdded || typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Small delay to let iOS restore network
      setTimeout(forceReconnect, 300);
    }
  });

  visibilityListenerAdded = true;
  logger.log('[Realtime] Visibility change listener added (iOS fix)');
}

/**
 * Wait until a realtime auth token has been set.
 * Hooks call this before subscribing to private channels.
 * Resolves immediately if token was already set.
 * Times out after 10 seconds to prevent infinite hangs.
 */
export function waitForAuth() {
  if (currentToken) return Promise.resolve();
  return Promise.race([
    authPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Realtime auth timeout')), 10000)),
  ]);
}

/**
 * Get the shared Supabase Realtime client.
 * Lazily creates one client on first call (fetches /api/config once).
 * Subsequent calls return the same instance.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function getRealtimeClient() {
  if (supabaseInstance) return supabaseInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/config`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Config fetch failed: ${res.status}`);
      }
      const cfg = await res.json();

      logger.log(
        `[Realtime] Config loaded — url: ${cfg.supabaseUrl}, anonKey length: ${cfg.supabaseAnonKey?.length || 0}`
      );

      const sb = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        realtime: { params: { eventsPerSecond: 10 } },
      });

      // ── Connection lifecycle diagnostics ──────────────────
      const ws = sb.realtime;

      // Log connection state changes
      ws.onopen = () => {
        logger.log('[Realtime] WebSocket OPEN');
      };
      ws.onclose = (event) => {
        logger.warn(
          `[Realtime] WebSocket CLOSED — code: ${event?.code}, reason: "${event?.reason || 'none'}", wasClean: ${event?.wasClean}`
        );
      };
      ws.onerror = (event) => {
        logger.error('[Realtime] WebSocket ERROR:', event);
      };

      // If a token was set before the client was ready, apply it now
      if (currentToken) {
        sb.realtime.setAuth(currentToken);
        logger.log('[Realtime] Auth token applied to new client (was set before init)');
      } else {
        logger.warn(
          '[Realtime] Client created WITHOUT auth token — private channels will fail until setRealtimeAuth() is called'
        );
      }

      supabaseInstance = sb;
      logger.log('[Realtime] Shared client initialized');

      // Setup iOS visibility handler
      setupVisibilityListener();

      return sb;
    } catch (err) {
      logger.error('[Realtime] Client init FAILED:', err.message);
      initPromise = null; // Allow retry on failure
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Update the Realtime auth token on the shared client.
 * Calls setAuth() on the existing WebSocket connection — no teardown.
 * @param {string} token - Supabase access token (JWT)
 */
export function setRealtimeAuth(token) {
  currentToken = token;
  if (authResolve) {
    authResolve();
    authResolve = null; // Only resolve once
  }
  if (supabaseInstance && token) {
    supabaseInstance.realtime.setAuth(token);
    logger.log('[Realtime] Auth token updated on shared client');
  } else if (!supabaseInstance && token) {
    logger.log('[Realtime] Auth token stored (client not yet initialized)');
  }
}

/**
 * Destroy the shared client (on sign-out).
 * Removes all channels and resets the singleton.
 */
export function destroyRealtimeClient() {
  if (supabaseInstance) {
    supabaseInstance.removeAllChannels();
    supabaseInstance = null;
    logger.log('[Realtime] Shared client destroyed');
  }
  initPromise = null;
  currentToken = null;
}
