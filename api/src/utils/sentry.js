// Sentry Error Monitoring for Cloudflare Workers
// Lightweight error tracking without official SDK

/**
 * Send error to Sentry
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 * @param {Object} env - Cloudflare environment with SENTRY_DSN
 */
export async function captureException(error, context = {}, env = {}) {
  // Skip if no Sentry DSN configured
  if (!env.SENTRY_DSN) {
    console.error('[Sentry] No DSN configured, skipping error report:', error);
    return;
  }

  try {
    // Parse DSN
    const dsn = env.SENTRY_DSN;
    const dsnMatch = dsn.match(/https:\/\/(.+)@(.+)\/(\d+)/);
    
    if (!dsnMatch) {
      console.error('[Sentry] Invalid DSN format');
      return;
    }

    const [, key, host, projectId] = dsnMatch;
    const sentryUrl = `https://${host}/api/${projectId}/store/`;

    // Build Sentry event
    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      environment: env.ENVIRONMENT || 'production',
      server_name: 'cloudflare-worker',
      
      // Error details
      exception: {
        values: [{
          type: error.name || 'Error',
          value: error.message || String(error),
          stacktrace: error.stack ? {
            frames: parseStackTrace(error.stack)
          } : undefined,
        }]
      },

      // Context
      extra: {
        ...context,
        worker: 'philosify-api',
      },

      // Request context (if available)
      request: context.request ? {
        url: context.request.url,
        method: context.request.method,
        headers: sanitizeHeaders(context.request.headers),
      } : undefined,

      // User context (if available)
      user: context.userId ? {
        id: context.userId,
      } : undefined,
    };

    // Send to Sentry
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=cloudflare-worker/1.0`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error('[Sentry] Failed to send error:', response.status);
    } else {
      console.log('[Sentry] Error reported:', event.event_id);
    }
  } catch (sentryError) {
    console.error('[Sentry] Error reporting failed:', sentryError);
  }
}

/**
 * Parse stack trace into Sentry format
 */
function parseStackTrace(stack) {
  const lines = stack.split('\n').slice(1); // Skip first line (error message)
  return lines.map(line => {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return {
        filename: match[2],
        function: match[1],
        lineno: parseInt(match[3]),
        colno: parseInt(match[4]),
      };
    }
    return {
      filename: '<anonymous>',
      function: line.trim(),
    };
  }).reverse(); // Sentry expects oldest frame first
}

/**
 * Sanitize headers to remove sensitive data
 */
function sanitizeHeaders(headers) {
  const sanitized = {};
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  
  if (headers && typeof headers.forEach === 'function') {
    headers.forEach((value, key) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    });
  }
  
  return sanitized;
}

/**
 * Capture a message
 */
export async function captureMessage(message, level = 'info', context = {}, env = {}) {
  if (!env.SENTRY_DSN) return;

  try {
    const dsn = env.SENTRY_DSN;
    const dsnMatch = dsn.match(/https:\/\/(.+)@(.+)\/(\d+)/);
    if (!dsnMatch) return;

    const [, key, host, projectId] = dsnMatch;
    const sentryUrl = `https://${host}/api/${projectId}/store/`;

    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: Date.now() / 1000,
      platform: 'javascript',
      environment: env.ENVIRONMENT || 'production',
      level: level,
      message: {
        formatted: message,
      },
      extra: context,
    };

    await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=cloudflare-worker/1.0`,
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('[Sentry] Message reporting failed:', error);
  }
}

