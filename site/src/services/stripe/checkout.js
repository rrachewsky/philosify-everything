// ============================================================
// Stripe Checkout Service
// ============================================================
// Uses HttpOnly cookies - no token handling in JavaScript.

import { config } from '@/config';
import { CREDIT_PACKAGES } from '@/utils/constants.js';
import { logger } from '@/utils';

/**
 * Create Stripe checkout session and redirect to payment
 * @param {number} amount - Package amount in USD (6.00, 10.00, or 20.00)
 */
export async function createCheckoutSession(amount) {
  const packageInfo = CREDIT_PACKAGES.find((pkg) => pkg.amount === amount);

  if (!packageInfo) {
    throw new Error('CHECKOUT_PACKAGE_ERROR');
  }

  logger.log('[Stripe] Creating checkout session for tier:', packageInfo.tier);

  const response = await fetch(`${config.apiUrl}/api/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tier: packageInfo.tier,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    logger.error('[Stripe] Checkout session creation failed:', response.status);
    throw new Error('CHECKOUT_CREATE_FAILED');
  }

  const data = await response.json();

  if (!data.sessionUrl && !data.url) {
    logger.error('[Stripe] No checkout URL in response');
    throw new Error('CHECKOUT_URL_MISSING');
  }

  const checkoutUrl = data.sessionUrl || data.url;

  // Validate redirect URL points to Stripe to prevent open redirect
  if (!checkoutUrl || !checkoutUrl.startsWith('https://checkout.stripe.com/')) {
    logger.error('[Stripe] Invalid checkout URL:', checkoutUrl);
    throw new Error('CHECKOUT_URL_INVALID');
  }

  logger.log('[Stripe] Redirecting to checkout');

  window.location.href = checkoutUrl;
}

/**
 * Purchase credits (alternative API accepting amount directly)
 * @param {number} amount - Package amount in USD
 */
export async function purchaseCredits(amount) {
  return createCheckoutSession(amount);
}

export default {
  createCheckoutSession,
  purchaseCredits,
};
