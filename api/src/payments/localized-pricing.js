// ============================================================
// LOCALIZED PRICING - Approximate local-currency display prices
// ============================================================
// Used by the frontend payment modal to show package prices in the
// visitor's currency, mirroring Stripe Adaptive Pricing as closely as
// possible. These figures are DISPLAY ONLY: the charge itself is created
// from the USD price IDs, and Stripe Adaptive Pricing sets the final
// converted amount when the buyer opens the checkout page.
//
// FX rates come from open.er-api.com (free, ~160 currencies, daily
// updates) and are cached in KV for 12h. A 2% uplift approximates the
// currency-conversion cost Stripe includes in Adaptive Pricing figures.

const FX_KV_KEY = 'fx_rates_usd_v1';
const FX_TTL_SECONDS = 12 * 60 * 60;
const ADAPTIVE_PRICING_UPLIFT = 1.02;

// USD package amounts (must match src/payments/config.js)
const PACKAGES = [
  { tier: '10', credits: 20, amountUsd: 6.0 },
  { tier: '20', credits: 40, amountUsd: 10.0 },
  { tier: '50', credits: 100, amountUsd: 20.0 },
];

// Currencies where the minor unit is not used (Stripe zero-decimal set, abridged)
const ZERO_DECIMAL = new Set(['JPY', 'KRW', 'VND', 'CLP', 'ISK', 'HUF', 'TWD', 'UGX', 'RWF', 'XOF', 'XAF']);

// ISO 3166 country → ISO 4217 currency. Countries not listed fall back to USD.
// Coverage priority: the site's 18 UI languages plus other large markets.
const COUNTRY_TO_CURRENCY = {
  // Americas
  BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', MX: 'MXN', PE: 'PEN', UY: 'UYU', CA: 'CAD',
  // Eurozone
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  IE: 'EUR', FI: 'EUR', GR: 'EUR', SK: 'EUR', SI: 'EUR', LV: 'EUR', LT: 'EUR', EE: 'EUR',
  LU: 'EUR', CY: 'EUR', MT: 'EUR', HR: 'EUR',
  // Rest of Europe
  GB: 'GBP', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CZ: 'CZK', HU: 'HUF',
  RO: 'RON', BG: 'BGN', RS: 'RSD', UA: 'UAH', TR: 'TRY', IS: 'ISK',
  // Middle East / Africa
  IL: 'ILS', SA: 'SAR', AE: 'AED', QA: 'QAR', KW: 'KWD', EG: 'EGP', MA: 'MAD', ZA: 'ZAR', NG: 'NGN', KE: 'KES',
  // Asia / Pacific
  JP: 'JPY', KR: 'KRW', CN: 'CNY', HK: 'HKD', TW: 'TWD', IN: 'INR', ID: 'IDR', TH: 'THB',
  MY: 'MYR', SG: 'SGD', PH: 'PHP', VN: 'VND', PK: 'PKR', BD: 'BDT', AU: 'AUD', NZ: 'NZD',
};

/**
 * Fetch USD-based FX rates, cached in KV for 12h.
 * @returns {Promise<Object|null>} Map of currency → rate, or null on failure
 */
async function getFxRates(env) {
  try {
    const cached = await env.PHILOSIFY_KV.get(FX_KV_KEY);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.log('[Pricing] KV read failed:', e.message);
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`FX fetch HTTP ${res.status}`);
    const data = await res.json();
    if (data?.result !== 'success' || !data?.rates) throw new Error('FX payload invalid');

    try {
      await env.PHILOSIFY_KV.put(FX_KV_KEY, JSON.stringify(data.rates), {
        expirationTtl: FX_TTL_SECONDS,
      });
    } catch (e) {
      console.log('[Pricing] KV write failed:', e.message);
    }
    return data.rates;
  } catch (e) {
    console.log('[Pricing] FX fetch failed:', e.message);
    return null;
  }
}

/**
 * Round a converted amount the way a checkout price would look:
 * whole units for zero-decimal currencies, 2 decimals otherwise.
 */
function roundAmount(amount, currency) {
  if (ZERO_DECIMAL.has(currency)) return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

/**
 * Build the localized package list for a visitor country.
 * Falls back to USD (approximate=false) when the country is unmapped
 * or FX rates are unavailable.
 */
export async function getLocalizedPricing(env, country) {
  const currency = COUNTRY_TO_CURRENCY[String(country || '').toUpperCase()] || 'USD';

  const usdResponse = {
    currency: 'USD',
    approximate: false,
    packages: PACKAGES.map((p) => ({ ...p, amountLocal: p.amountUsd })),
  };

  if (currency === 'USD') return usdResponse;

  const rates = await getFxRates(env);
  const rate = rates?.[currency];
  if (!rate || typeof rate !== 'number' || rate <= 0) return usdResponse;

  return {
    currency,
    approximate: true,
    packages: PACKAGES.map((p) => ({
      ...p,
      amountLocal: roundAmount(p.amountUsd * rate * ADAPTIVE_PRICING_UPLIFT, currency),
    })),
  };
}
