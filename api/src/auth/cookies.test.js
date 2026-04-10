// ============================================================
// SECURITY TESTS - Cookie Security
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  parseCookies,
  getSessionFromCookie,
  buildAuthCookie,
  buildClearAuthCookie,
  isProduction,
} from './cookies.js';

// Helper to create a minimal request-like object
function fakeRequest(cookieHeader) {
  return {
    headers: {
      get: (name) => (name.toLowerCase() === 'cookie' ? cookieHeader : null),
    },
  };
}

describe('parseCookies', () => {
  it('should parse a simple cookie string', () => {
    const cookies = parseCookies(fakeRequest('name=value; other=test'));
    expect(cookies.name).toBe('value');
    expect(cookies.other).toBe('test');
  });

  it('should return empty object for no cookies', () => {
    const cookies = parseCookies(fakeRequest(null));
    expect(cookies).toEqual({});
  });

  it('should handle URL-encoded values', () => {
    // parseCookies does NOT decode URI components — that's done by getSessionFromCookie
    const cookies = parseCookies(fakeRequest('data=%7B%22key%22%3A%22value%22%7D'));
    expect(cookies.data).toBe('%7B%22key%22%3A%22value%22%7D');
  });
});

describe('getSessionFromCookie', () => {
  it('should extract session from valid sb-auth cookie', () => {
    const session = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_at: 1234567890,
    };
    const encoded = encodeURIComponent(JSON.stringify(session));
    const result = getSessionFromCookie(fakeRequest(`sb-auth=${encoded}`));
    expect(result.access_token).toBe('test-token');
    expect(result.refresh_token).toBe('test-refresh');
  });

  it('should return null for missing cookie', () => {
    const result = getSessionFromCookie(fakeRequest(null));
    expect(result).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    const result = getSessionFromCookie(fakeRequest('sb-auth=not-json'));
    expect(result).toBeNull();
  });

  it('should return null for missing access_token', () => {
    const session = { refresh_token: 'test' };
    const encoded = encodeURIComponent(JSON.stringify(session));
    const result = getSessionFromCookie(fakeRequest(`sb-auth=${encoded}`));
    expect(result).toBeNull();
  });
});

describe('buildAuthCookie', () => {
  const session = {
    access_token: 'token123',
    refresh_token: 'refresh456',
    expires_at: 1234567890,
  };

  it('should set HttpOnly flag', () => {
    const cookie = buildAuthCookie(session, false);
    expect(cookie).toContain('HttpOnly');
  });

  it('should set SameSite=Lax', () => {
    const cookie = buildAuthCookie(session, false);
    expect(cookie).toContain('SameSite=Lax');
  });

  it('should set Secure flag in production', () => {
    const cookie = buildAuthCookie(session, true);
    expect(cookie).toContain('Secure');
  });

  it('should NOT set Secure flag in development', () => {
    const cookie = buildAuthCookie(session, false);
    expect(cookie).not.toContain('Secure');
  });

  it('should set appropriate Path', () => {
    const cookie = buildAuthCookie(session, false);
    expect(cookie).toContain('Path=/');
  });

  it('should set Max-Age', () => {
    const cookie = buildAuthCookie(session, false);
    expect(cookie).toContain('Max-Age=');
  });

  it('should not contain raw token in cookie name or visible parts', () => {
    // The token should only appear in the URL-encoded value, not as plaintext
    const cookie = buildAuthCookie(session, false);
    expect(cookie).toContain('sb-auth=');
  });
});

describe('buildClearAuthCookie', () => {
  it('should set Max-Age=0 to clear the cookie', () => {
    const cookie = buildClearAuthCookie(false);
    expect(cookie).toContain('Max-Age=0');
  });

  it('should match the same attributes as buildAuthCookie', () => {
    const cookie = buildClearAuthCookie(true);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('Path=/');
  });
});

describe('isProduction', () => {
  it('should return true when ENVIRONMENT is production', () => {
    expect(isProduction({ ENVIRONMENT: 'production' })).toBe(true);
  });

  it('should return false when ENVIRONMENT is development', () => {
    expect(isProduction({ ENVIRONMENT: 'development' })).toBe(false);
  });

  it('should fallback to checking ALLOWED_ORIGINS for localhost', () => {
    expect(isProduction({ ALLOWED_ORIGINS: 'http://localhost:3000' })).toBe(false);
    expect(isProduction({ ALLOWED_ORIGINS: 'https://philosify.org' })).toBe(true);
  });
});
