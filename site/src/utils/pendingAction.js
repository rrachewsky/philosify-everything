// ============================================================
// Pending Credit Action - Survive Stripe redirect
// ============================================================
// Stores the action a user was trying to perform when they ran out
// of credits. After purchasing via Stripe (which navigates away),
// the app reads this on return and auto-retries the action.
//
// Action types:
//   colloquium:access          { threadId }
//   colloquium:participate     { threadId }
//   colloquium:addPhilosopher  { threadId, philosopher }
//   colloquium:propose         { title, content, visibility }
//   colloquium:proposeOpenDebate { title, content }
//   space:unlock               { space }
//   analysis                   { track: { song, artist, spotify_id }, model, lang }

import { logger } from './logger.js';

const STORAGE_KEY = 'pendingCreditAction';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Store a pending action before Stripe redirect.
 * @param {Object} action - Must include `type` plus action-specific fields
 */
export function setPendingAction(action) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...action, timestamp: Date.now() }));
    logger.log('[PendingAction] Stored:', action.type);
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Retrieve the pending action (returns null if expired or absent).
 */
export function getPendingAction() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const action = JSON.parse(raw);
    if (Date.now() - action.timestamp > MAX_AGE_MS) {
      clearPendingAction();
      logger.log('[PendingAction] Expired, cleared');
      return null;
    }
    return action;
  } catch {
    clearPendingAction();
    return null;
  }
}

/**
 * Remove the pending action (call after successful retry or on expiry).
 */
export function clearPendingAction() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
