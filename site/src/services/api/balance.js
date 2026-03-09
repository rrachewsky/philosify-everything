// ============================================================
// Balance API Service
// ============================================================
// Uses HttpOnly cookies - no token handling in JavaScript.

import { config } from '@/config';
import { logger } from '@/utils';

/**
 * Get user's credit balance
 * Returns { userId, credits, freeRemaining, total }
 */
export async function getBalance() {
  const response = await fetch(`${config.apiUrl}/api/balance`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('BALANCE_FETCH_ERROR');
  }

  const data = await response.json();

  if (
    !data ||
    typeof data.total === 'undefined' ||
    typeof data.credits === 'undefined' ||
    typeof data.freeRemaining === 'undefined'
  ) {
    logger.error('[Balance] Invalid response format:', data);
    throw new Error('BALANCE_FORMAT_ERROR');
  }

  return data;
}

export default {
  getBalance,
};
