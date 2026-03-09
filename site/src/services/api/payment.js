// ============================================================
// Payment Verification Service
// ============================================================
// Uses HttpOnly cookies - no token handling in JavaScript.

import { config } from '@/config';
import { logger } from '@/utils';

/**
 * Verify and process payment manually (fallback when webhook doesn't fire)
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<{success: boolean, credits: number, newBalance: number}>}
 */
export async function verifyPayment(sessionId) {
  if (!sessionId) {
    throw new Error('PAYMENT_SESSION_MISSING');
  }

  logger.log('[Payment] Verifying payment session:', sessionId);

  const response = await fetch(`${config.apiUrl}/api/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    logger.error('[Payment] Verification failed:', response.status);
    throw new Error('PAYMENT_VERIFY_FAILED');
  }

  const data = await response.json();

  logger.log('[Payment] Verification result:', {
    success: data.success,
    alreadyProcessed: data.alreadyProcessed,
    credits: data.credits,
    newBalance: data.newBalance,
  });

  return data;
}

export default {
  verifyPayment,
};
