// ============================================================
// AUTH SERVICE
// ============================================================
// Clean authentication service using HttpOnly cookies.
// All auth operations go through backend proxy - no tokens in JS.
//
// Usage:
//   import { authService } from '@/services/auth';
//   await authService.signIn(email, password);
//   await authService.signOut();
//   const { user } = await authService.getSession();

import { config } from '@/config';

const AUTH_BASE = `${config.apiUrl}/auth`;

/**
 * Sign in with email and password
 */
async function signIn(email, password) {
  const response = await fetch(`${AUTH_BASE}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Sign in failed');
  }

  return response.json();
}

/**
 * Sign up with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} [language] - User's preferred language (for localized emails)
 * @param {string} [fullName] - User's full name (stored in user_metadata)
 */
async function signUp(email, password, language, fullName) {
  const response = await fetch(`${AUTH_BASE}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, language, fullName }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Sign up failed');
  }

  return response.json();
}

/**
 * Sign out - clears HttpOnly cookie
 */
async function signOut() {
  const response = await fetch(`${AUTH_BASE}/signout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Sign out failed');
  }

  return response.json();
}

/**
 * Get current session from HttpOnly cookie
 */
async function getSession() {
  try {
    const response = await fetch(`${AUTH_BASE}/session`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return { user: null };
    }

    return response.json();
  } catch (error) {
    console.error('[Auth] Failed to get session:', error.message);
    return { user: null };
  }
}

/**
 * Initiate Google OAuth - redirects to Google
 */
async function signInWithGoogle() {
  const response = await fetch(`${AUTH_BASE}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Google sign in failed');
  }

  const { url } = await response.json();

  // Validate redirect URL points to Google/Supabase to prevent open redirect
  if (
    !url ||
    (!url.startsWith('https://accounts.google.com/') &&
      !url.startsWith('https://') &&
      !url.includes('.supabase.co/'))
  ) {
    throw new Error('Invalid OAuth redirect URL');
  }

  window.location.href = url;
}

/**
 * Request password reset email
 */
async function resetPassword(email) {
  const response = await fetch(`${AUTH_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Password reset failed');
  }

  return response.json();
}

/**
 * Update password (when logged in)
 */
async function updatePassword(newPassword) {
  const response = await fetch(`${AUTH_BASE}/update-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: newPassword }),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Password update failed');
  }

  return response.json();
}

// Export as named functions and as service object
export { signIn, signUp, signOut, getSession, signInWithGoogle, resetPassword, updatePassword };

export const authService = {
  signIn,
  signUp,
  signOut,
  getSession,
  signInWithGoogle,
  resetPassword,
  updatePassword,
};

export default authService;
