// ============================================================
// FETCH WITH TIMEOUT (Issue #12 - Prevent AI model hangs)
// ============================================================

const AI_MODEL_TIMEOUT_MS = 55000; // 55 seconds (Cloudflare Worker limit is 60s CPU time)

export async function fetchWithTimeout(url, options = {}, timeoutMs = AI_MODEL_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
