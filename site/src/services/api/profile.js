// ============================================================
// PROFILE SERVICE
// ============================================================
// API calls for user profile management.
//
// Usage:
//   import { profileService } from '@/services/api/profile';
//   const { profile } = await profileService.getProfile();
//   await profileService.updateProfile({ phoneCountryCode: '+55', phoneNumber: '912345678' });

import { config } from '@/config';

const API_BASE = `${config.apiUrl}/api`;

/**
 * Fetch the current user's profile
 */
async function getProfile() {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load profile');
  }

  return response.json();
}

/**
 * Update profile fields
 * @param {Object} fields - Fields to update
 * @param {string} [fields.displayName] - Display name
 * @param {string} [fields.phoneCountryCode] - Country code (e.g. '+55')
 * @param {string} [fields.phoneAreaCode] - Area code (e.g. '11')
 * @param {string} [fields.phoneNumber] - Phone number (digits only)
 */
async function updateProfile(fields) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
    credentials: 'include',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update profile');
  }

  return response.json();
}

export { getProfile, updateProfile };

export const profileService = {
  getProfile,
  updateProfile,
};

export default profileService;
