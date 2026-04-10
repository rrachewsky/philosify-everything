// ============================================================
// SECURITY TESTS - Structured Security Logging
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { securityLog } from './security-log.js';

// Mock console.log to capture structured output
function captureLog(fn) {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  fn();
  const output = spy.mock.calls[0]?.[0];
  spy.mockRestore();
  return output ? JSON.parse(output) : null;
}

// Fake request object
function fakeRequest(overrides = {}) {
  return {
    method: 'POST',
    url: 'https://api.philosify.org/api/chat',
    headers: {
      get: (name) => {
        const headers = {
          'cf-connecting-ip': '1.2.3.4',
          'user-agent': 'Mozilla/5.0 TestBrowser',
          'cf-ipcountry': 'US',
          'cf-ray': 'test-ray-id-123',
          ...overrides,
        };
        return headers[name.toLowerCase()] || null;
      },
    },
  };
}

describe('securityLog', () => {
  it('should emit structured JSON for auth failures', () => {
    const entry = captureLog(() =>
      securityLog.authFailure(fakeRequest(), { reason: 'expired_token', userId: 'user-123' })
    );
    expect(entry._type).toBe('security_event');
    expect(entry.event).toBe('auth_failure');
    expect(entry.severity).toBe('WARN');
    expect(entry.ip).toBe('1.2.3.4');
    expect(entry.path).toBe('/api/chat');
    expect(entry.reason).toBe('expired_token');
    expect(entry.timestamp).toBeDefined();
  });

  it('should emit rate limit events', () => {
    const entry = captureLog(() =>
      securityLog.rateLimited(fakeRequest(), { key: 'chat:user123' })
    );
    expect(entry.event).toBe('rate_limited');
    expect(entry.severity).toBe('WARN');
    expect(entry.key).toBe('chat:user123');
  });

  it('should emit input rejection events', () => {
    const entry = captureLog(() =>
      securityLog.inputRejected(fakeRequest(), { field: 'campaignId', value: 'not-a-uuid' })
    );
    expect(entry.event).toBe('input_rejected');
    expect(entry.field).toBe('campaignId');
  });

  it('should emit webhook rejection at HIGH severity', () => {
    const entry = captureLog(() =>
      securityLog.webhookRejected(fakeRequest(), { reason: 'signature_mismatch' })
    );
    expect(entry.severity).toBe('HIGH');
    expect(entry.event).toBe('webhook_rejected');
  });

  it('should emit critical events', () => {
    const entry = captureLog(() =>
      securityLog.critical(fakeRequest(), { reason: 'cross_user_data_access' })
    );
    expect(entry.severity).toBe('CRITICAL');
  });

  it('should include request metadata', () => {
    const entry = captureLog(() =>
      securityLog.authFailure(fakeRequest(), {})
    );
    expect(entry.ip).toBe('1.2.3.4');
    expect(entry.method).toBe('POST');
    expect(entry.path).toBe('/api/chat');
    expect(entry.country).toBe('US');
    expect(entry.requestId).toBe('test-ray-id-123');
    expect(entry.userAgent).toContain('Mozilla');
  });

  it('should truncate long user agents', () => {
    const longUA = 'A'.repeat(300);
    const req = {
      method: 'GET',
      url: 'https://api.philosify.org/test',
      headers: { get: (name) => name === 'user-agent' ? longUA : null },
    };
    const entry = captureLog(() => securityLog.authFailure(req, {}));
    expect(entry.userAgent.length).toBeLessThanOrEqual(120);
  });

  it('should handle null request gracefully', () => {
    const entry = captureLog(() => securityLog.authFailure(null, { reason: 'test' }));
    expect(entry.event).toBe('auth_failure');
    expect(entry.reason).toBe('test');
  });

  it('should not include undefined values', () => {
    const entry = captureLog(() => securityLog.authFailure(null, {}));
    const json = JSON.stringify(entry);
    expect(json).not.toContain('undefined');
  });
});
