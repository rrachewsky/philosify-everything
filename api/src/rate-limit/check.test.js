// ============================================================
// SECURITY TESTS - Rate Limiting
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { checkRateLimit } from './check.js';

describe('checkRateLimit', () => {
  it('should return true (allow) when rate limiter succeeds', async () => {
    const env = {
      RATE_LIMITER: {
        limit: vi.fn().mockResolvedValue({ success: true }),
      },
    };
    const result = await checkRateLimit(env, 'test:key');
    expect(result).toBe(true);
  });

  it('should return false (block) when rate limited', async () => {
    const env = {
      RATE_LIMITER: {
        limit: vi.fn().mockResolvedValue({ success: false }),
      },
    };
    const result = await checkRateLimit(env, 'test:key');
    expect(result).toBe(false);
  });

  it('should fail OPEN when binding is missing and failClosed=false', async () => {
    const result = await checkRateLimit({}, 'test:key', false);
    expect(result).toBe(true);
  });

  it('should fail CLOSED when binding is missing and failClosed=true', async () => {
    const result = await checkRateLimit({}, 'test:key', true);
    expect(result).toBe(false);
  });

  it('should fail OPEN on rate limiter error when failClosed=false', async () => {
    const env = {
      RATE_LIMITER: {
        limit: vi.fn().mockRejectedValue(new Error('Service down')),
      },
    };
    const result = await checkRateLimit(env, 'test:key', false);
    expect(result).toBe(true);
  });

  it('should fail CLOSED on rate limiter error when failClosed=true', async () => {
    const env = {
      RATE_LIMITER: {
        limit: vi.fn().mockRejectedValue(new Error('Service down')),
      },
    };
    const result = await checkRateLimit(env, 'test:key', true);
    expect(result).toBe(false);
  });
});
