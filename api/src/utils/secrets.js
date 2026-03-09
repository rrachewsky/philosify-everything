// ============================================================
// SECRETS UTILITY
// ============================================================
// Handles both Secrets Store (.get()) and .dev.vars (direct string)

/**
 * Get secret value from env
 * Handles both Secrets Store (production) and .dev.vars (local dev)
 * @param {any} secret - The secret from env object
 * @returns {Promise<string>} The secret value
 */
export async function getSecret(secret) {
    // If it's a Secrets Store secret, it has a .get() method
    if (secret && typeof secret.get === 'function') {
        return await secret.get();
    }
    // If it's a string (wrangler secret put), return it
    if (typeof secret === 'string') {
        return secret;
    }
    // Fallback for null/undefined
    return secret || '';
}
