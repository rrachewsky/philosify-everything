// ============================================================
// SECURITY TESTS - CORS Headers
// ============================================================

import { describe, it, expect } from 'vitest';
import { getCorsHeaders } from './cors.js';

describe('getCorsHeaders', () => {
  const prodEnv = {
    ENVIRONMENT: 'production',
    ALLOWED_ORIGINS: 'https://philosify.org https://www.philosify.org',
  };

  const devEnv = {
    ENVIRONMENT: 'development',
    ALLOWED_ORIGINS: 'http://localhost:3000',
  };

  it('should allow listed production origins', () => {
    const headers = getCorsHeaders('https://philosify.org', prodEnv);
    expect(headers['Access-Control-Allow-Origin']).toBe('https://philosify.org');
  });

  it('should not allow arbitrary origins in production', () => {
    const headers = getCorsHeaders('https://evil.com', prodEnv);
    // Should fallback to first allowed origin, NOT echo back the evil origin
    expect(headers['Access-Control-Allow-Origin']).not.toBe('https://evil.com');
  });

  it('should block localhost in production', () => {
    const headers = getCorsHeaders('http://localhost:3000', prodEnv);
    expect(headers['Access-Control-Allow-Origin']).not.toBe('http://localhost:3000');
  });

  it('should allow localhost in development', () => {
    const headers = getCorsHeaders('http://localhost:3000', devEnv);
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
  });

  it('should include security headers', () => {
    const headers = getCorsHeaders('https://philosify.org', prodEnv);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Strict-Transport-Security']).toContain('max-age=');
    expect(headers['Permissions-Policy']).toContain('geolocation=()');
  });

  it('should include Vary: Origin for cache safety', () => {
    const headers = getCorsHeaders('https://philosify.org', prodEnv);
    expect(headers['Vary']).toBe('Origin');
  });

  it('should set credentials to true', () => {
    const headers = getCorsHeaders('https://philosify.org', prodEnv);
    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('should handle null origin gracefully', () => {
    const headers = getCorsHeaders(null, prodEnv);
    expect(headers).toBeDefined();
    expect(headers['Access-Control-Allow-Origin']).toBeDefined();
  });

  it('should handle missing env gracefully', () => {
    const headers = getCorsHeaders('https://philosify.org', {});
    expect(headers).toBeDefined();
  });
});
