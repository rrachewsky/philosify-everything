// ============================================================
// Localized Pricing Service
// ============================================================
// Fetches approximate local-currency package prices from the backend
// (/api/pricing). Display only — the actual charge is created from the
// USD Stripe price IDs, and Stripe Adaptive Pricing sets the final
// converted amount at checkout.

import { config } from '@/config';
import { logger } from '@/utils';

let cachedPricing = null;

/**
 * Fetch localized pricing (cached for the page session — FX rates on the
 * backend only refresh every 12h, so one fetch per visit is enough).
 * @returns {Promise<{currency: string, approximate: boolean, packages: Array}>}
 */
export async function fetchLocalizedPricing() {
  if (cachedPricing) return cachedPricing;

  const response = await fetch(`${config.apiUrl}/api/pricing`);
  if (!response.ok) {
    logger.error('[Pricing] Fetch failed:', response.status);
    throw new Error('PRICING_FETCH_FAILED');
  }

  cachedPricing = await response.json();
  return cachedPricing;
}
