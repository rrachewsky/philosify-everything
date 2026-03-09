// ============================================================
// PAYMENT CONFIGURATION - Single Source of Truth
// ============================================================
// This file defines the ONLY mapping between Stripe price IDs and credits.
// ALL other code derives from this.

/**
 * Get credit packages configuration
 * @param {Object} env - Worker environment with Stripe price IDs
 * @returns {Promise<Object>} Map of price_id → package details
 */
export async function getCreditPackages(env) {
  const { getSecret } = await import('../utils/secrets.js');

  // Get price IDs from secrets
  const priceId10 = await getSecret(env.STRIPE_PRICE_ID_10);
  const priceId20 = await getSecret(env.STRIPE_PRICE_ID_20);
  const priceId50 = await getSecret(env.STRIPE_PRICE_ID_50);

  // Single source of truth: price_id → credits mapping
  return {
    [priceId10]: {
      credits: 10,
      amount: 6.00,
      tier: '10',
      displayPrice: 'US$6.00',
      perCredit: 'US$0.60',
    },
    [priceId20]: {
      credits: 20,
      amount: 10.00,
      tier: '20',
      displayPrice: 'US$10.00',
      perCredit: 'US$0.50',
    },
    [priceId50]: {
      credits: 50,
      amount: 20.00,
      tier: '50',
      displayPrice: 'US$20.00',
      perCredit: 'US$0.40',
    },
  };
}

/**
 * Get credits for a given price ID
 * @param {Object} env - Worker environment
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<number|null>} Credits or null if invalid
 */
export async function getCreditsForPriceId(env, priceId) {
  const packages = await getCreditPackages(env);
  return packages[priceId]?.credits || null;
}

/**
 * Get price ID for a given tier
 * @param {Object} env - Worker environment
 * @param {string} tier - Tier ('10', '20', '50')
 * @returns {Promise<string|null>} Price ID or null if invalid
 */
export async function getPriceIdForTier(env, tier) {
  const packages = await getCreditPackages(env);

  for (const [priceId, pkg] of Object.entries(packages)) {
    if (pkg.tier === tier) {
      return priceId;
    }
  }

  return null;
}

/**
 * Validate tier input from frontend
 * @param {string} tier - Tier from request
 * @returns {boolean} Is valid tier
 */
export function isValidTier(tier) {
  return ['10', '20', '50'].includes(String(tier));
}
