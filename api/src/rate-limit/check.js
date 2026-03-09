// ============================================================
// RATE LIMITING (NATIVE BINDING)
// ============================================================
// Uses Cloudflare's native rate limiting binding (no KV operations)
// Limits are per Cloudflare location (PoP), not global
// Config in wrangler.toml: [[unsafe.bindings]] type = "ratelimit"

export async function checkRateLimit(env, keyBase, failClosed = false) {
  // Check if binding is configured
  if (!env.RATE_LIMITER) {
    console.error('[RateLimit] RATE_LIMITER binding not configured');
    if (failClosed) {
      console.error('[RateLimit] FAIL CLOSED - blocking request (no binding)');
      return false;
    }
    return true; // Fail open
  }

  try {
    const { success } = await env.RATE_LIMITER.limit({ key: keyBase });

    if (!success) {
      console.log('[RateLimit] Rate limit exceeded for:', keyBase);
    }

    return success;
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    if (failClosed) {
      console.error('[RateLimit] FAIL CLOSED - blocking request due to error for:', keyBase);
      return false;
    }
    // Fail open: allow request if rate limiting system fails
    return true;
  }
}
