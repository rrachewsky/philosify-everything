// ============================================================
// SECRETS UTILITY
// ============================================================
// Handles both Secrets Store (.get()) and .dev.vars (direct string)

// Per-isolate cache of resolved Secrets Store values. Every .get() is a
// subrequest against the invocation's budget (50 on the free plan), and the
// hot paths resolve the same handful of secrets a dozen times per request —
// on 21 Aug that alone ate ~half the music-analysis budget and starved the
// credit confirm at the end of the invocation. Values live as long as the
// isolate; a rotated secret takes effect on the next isolate recycle.
const resolved = new WeakMap();

/**
 * Get secret value from env
 * Handles both Secrets Store (production) and .dev.vars (local dev)
 * @param {any} secret - The secret from env object
 * @returns {Promise<string>} The secret value
 */
export async function getSecret(secret) {
    // If it's a Secrets Store secret, it has a .get() method
    if (secret && typeof secret.get === 'function') {
        let pending = resolved.get(secret);
        if (!pending) {
            // Cache the promise so concurrent callers share one subrequest;
            // drop it on rejection so a transient failure is not permanent.
            pending = secret.get().catch((err) => {
                resolved.delete(secret);
                throw err;
            });
            resolved.set(secret, pending);
        }
        return await pending;
    }
    // If it's a string (wrangler secret put), return it
    if (typeof secret === 'string') {
        return secret;
    }
    // Fallback for null/undefined
    return secret || '';
}
