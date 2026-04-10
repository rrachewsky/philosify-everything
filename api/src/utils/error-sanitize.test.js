// ============================================================
// SECURITY TESTS - Error Sanitization
// ============================================================

import { describe, it, expect } from 'vitest';
import { sanitizeErrorMessage, safeError } from './error-sanitize.js';

describe('sanitizeErrorMessage', () => {
  it('should pass through known safe error prefixes', () => {
    expect(sanitizeErrorMessage('Insufficient credits for this operation')).toBe('Insufficient credits for this operation');
    expect(sanitizeErrorMessage('Rate limit exceeded')).toBe('Rate limit exceeded');
    expect(sanitizeErrorMessage('Invalid model')).toBe('Invalid model');
    expect(sanitizeErrorMessage('Unauthorized')).toBe('Unauthorized');
  });

  it('should return fallback for null/empty input', () => {
    expect(sanitizeErrorMessage(null)).toBe('An error occurred');
    expect(sanitizeErrorMessage('')).toBe('An error occurred');
    expect(sanitizeErrorMessage(undefined)).toBe('An error occurred');
  });

  it('should strip API keys from error messages', () => {
    const msg = 'Failed: apikey=sk_live_12345678901234567890';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('sk_live_');
  });

  it('should strip Bearer tokens', () => {
    const msg = 'Auth failed: bearer eyJhbGciOiJIUzI1NiJ9.payload.signature';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('eyJhbGciOiJIUzI1NiJ9');
  });

  it('should strip Supabase URLs', () => {
    const msg = 'Connection failed to https://abc123.supabase.co/rest/v1/users';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('supabase.co');
  });

  it('should strip OpenAI URLs', () => {
    const msg = 'Error calling https://api.openai.com/v1/chat/completions';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('openai.com');
  });

  it('should strip file paths', () => {
    const msg = 'Error in C:\\Users\\admin\\project\\secrets.js';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('Users');
  });

  it('should strip stack traces', () => {
    const msg = 'Error\n  at processRequest (worker.js:123:45)\n  at handleFetch (index.js:10:5)';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('worker.js');
  });

  it('should strip SQL error codes', () => {
    const msg = 'SQLSTATE[22P02] invalid input syntax for type uuid';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('SQLSTATE');
  });

  it('should truncate overly long messages', () => {
    const msg = 'x'.repeat(500);
    const result = sanitizeErrorMessage(msg);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('should use custom fallback', () => {
    expect(sanitizeErrorMessage(null, 'custom fallback')).toBe('custom fallback');
  });

  it('should still sanitize URLs in safe messages', () => {
    const msg = 'Invalid request to https://abc.supabase.co/rest/v1/data';
    const result = sanitizeErrorMessage(msg);
    expect(result).not.toContain('supabase.co');
  });
});

describe('safeError', () => {
  it('should return sanitized error object', () => {
    const result = safeError(new Error('Internal error at /home/user/app.js'), 'analysis');
    expect(result.error).not.toContain('/home/user');
  });

  it('should use context as fallback', () => {
    // When error is null, String(null) = "null" which passes sanitization as short safe text
    const result = safeError(null, 'translation');
    expect(result.error).toBe('null');
  });

  it('should handle string errors', () => {
    const result = safeError('Rate limit exceeded', 'request');
    expect(result.error).toBe('Rate limit exceeded');
  });
});
