// ============================================================
// SECURITY EVENT LOGGING
// ============================================================
// Structured security event logger for Cloudflare Workers.
// Produces machine-parseable JSON logs for security-relevant
// events, enabling monitoring, alerting, and incident response.
//
// Usage:
//   import { securityLog } from '../utils/security-log.js';
//   securityLog.authFailure(request, { reason: 'expired_token', userId });
//   securityLog.rateLimited(request, { key: 'chat:user123', endpoint: '/api/chat' });

const SEVERITY = {
  INFO: 'INFO',
  WARN: 'WARN',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

/**
 * Extract request metadata for logging (no sensitive data)
 */
function requestMeta(request) {
  if (!request) return {};
  return {
    ip: request.headers?.get?.('cf-connecting-ip') || 'unknown',
    method: request.method,
    path: new URL(request.url).pathname,
    userAgent: (request.headers?.get?.('user-agent') || '').substring(0, 120),
    country: request.headers?.get?.('cf-ipcountry') || 'unknown',
    requestId: request.headers?.get?.('cf-ray') || crypto.randomUUID?.() || Date.now().toString(36),
  };
}

/**
 * Emit a structured security log entry
 */
function emit(severity, event, request, details = {}) {
  const entry = {
    _type: 'security_event',
    timestamp: new Date().toISOString(),
    severity,
    event,
    ...requestMeta(request),
    ...details,
  };
  // Remove undefined values
  Object.keys(entry).forEach((k) => entry[k] === undefined && delete entry[k]);
  console.log(JSON.stringify(entry));
}

export const securityLog = {
  /** Authentication failure (bad token, expired, missing) */
  authFailure(request, details) {
    emit(SEVERITY.WARN, 'auth_failure', request, details);
  },

  /** Rate limit triggered */
  rateLimited(request, details) {
    emit(SEVERITY.WARN, 'rate_limited', request, details);
  },

  /** Input validation rejected (malformed UUID, bad lang, injection attempt) */
  inputRejected(request, details) {
    emit(SEVERITY.WARN, 'input_rejected', request, details);
  },

  /** Authorization failure (valid auth but insufficient permissions) */
  authzDenied(request, details) {
    emit(SEVERITY.HIGH, 'authz_denied', request, details);
  },

  /** Webhook signature verification failed */
  webhookRejected(request, details) {
    emit(SEVERITY.HIGH, 'webhook_rejected', request, details);
  },

  /** Suspicious activity (unusual patterns, potential attack) */
  suspicious(request, details) {
    emit(SEVERITY.HIGH, 'suspicious_activity', request, details);
  },

  /** Admin action performed */
  adminAction(request, details) {
    emit(SEVERITY.INFO, 'admin_action', request, details);
  },

  /** Payment event (purchase, refund, failure) */
  paymentEvent(request, details) {
    emit(SEVERITY.INFO, 'payment_event', request, details);
  },

  /** Critical security event (potential breach, data access anomaly) */
  critical(request, details) {
    emit(SEVERITY.CRITICAL, 'security_critical', request, details);
  },
};
