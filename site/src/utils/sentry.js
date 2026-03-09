// Sentry Error Monitoring Configuration
import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking
 * Only runs in production
 */
export function initSentry() {
  // Only initialize in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      debug: false,

      // Environment
      environment: import.meta.env.MODE, // 'production' or 'development'

      // Performance Monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: false,
        }),
      ],

      // Performance traces (10% of transactions)
      tracesSampleRate: 0.1,

      // Session Replay (10% of sessions)
      replaysSessionSampleRate: 0.1,

      // Capture 100% of sessions with errors
      replaysOnErrorSampleRate: 1.0,

      // Filter out non-critical errors
      beforeSend(event, hint) {
        // Don't send canceled requests
        if (hint.originalException?.message?.includes('AbortError')) {
          return null;
        }

        // Don't send network errors (often user's internet)
        if (hint.originalException?.message?.includes('NetworkError')) {
          return null;
        }

        return event;
      },

      // Add user context
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive data from breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null; // Don't send console.log breadcrumbs
        }
        return breadcrumb;
      },
    });
  }
}

/**
 * Manually capture an exception
 */
export function captureException(error, context = {}) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('[Sentry (dev)]', error, context);
  }
}

/**
 * Manually capture a message
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[Sentry (dev)] ${level}:`, message, context);
  }
}

/**
 * Set user context
 */
export function setUser(userId, email) {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: userId,
      email: email,
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
}

export default Sentry;
