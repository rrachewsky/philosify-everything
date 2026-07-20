// useLocalizedPricing - approximate local-currency prices for the payment modals
import { useEffect, useState } from 'react';
import { fetchLocalizedPricing } from '@/services/api';
import { logger } from '@/utils';

/**
 * Load localized pricing when `enabled` becomes true (e.g. modal open).
 * Returns null until loaded or when only USD applies — callers fall back
 * to the hardcoded USD display in that case.
 */
export function useLocalizedPricing(enabled = true) {
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;

    fetchLocalizedPricing()
      .then((p) => {
        if (alive) setPricing(p);
      })
      .catch((err) => {
        // Non-fatal: modal keeps showing USD prices
        logger.error('[useLocalizedPricing] Failed:', err);
      });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return pricing;
}

/**
 * Format an amount in the given currency for the user's locale.
 */
export function formatLocalPrice(amount, currency, locale) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
