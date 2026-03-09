// Form validation utilities

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate password strength
 * Minimum 8 characters, at least one uppercase letter, at least one number
 * (must match backend validation in api/src/auth/proxy.js)
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Validate password match
 */
export function doPasswordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

/**
 * Validate song query (not empty, minimum 2 characters)
 */
export function isValidQuery(query) {
  if (!query || typeof query !== 'string') return false;
  return query.trim().length >= 2;
}

/**
 * Parse song and artist from query string
 * Format: "Song Title - Artist Name"
 */
export function parseSongQuery(query) {
  if (!query || typeof query !== 'string') {
    return { song: '', artist: '' };
  }

  const trimmed = query.trim();

  if (trimmed.includes(' - ')) {
    const [song, artist] = trimmed.split(' - ').map((s) => s.trim());
    return { song, artist };
  }

  return { song: trimmed, artist: '' };
}
