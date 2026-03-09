// Data formatting utilities

/**
 * Format currency (USD)
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format credits count
 */
export function formatCredits(count) {
  if (count === 1) return '1 credit';
  return `${count} credits`;
}

/**
 * Format balance info string
 */
export function formatBalanceInfo(credits, freeRemaining) {
  const parts = [];
  if (freeRemaining > 0) {
    parts.push(`${freeRemaining} free`);
  }
  if (credits > 0) {
    parts.push(`${credits} paid`);
  }
  if (parts.length === 0) {
    return '0 credits';
  }
  return parts.join(' + ');
}

/**
 * Truncate text to maximum length
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Format song display name
 */
export function formatSongDisplay(song, artist) {
  if (!song) return '';
  if (!artist) return song;
  return `${song} - ${artist}`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
