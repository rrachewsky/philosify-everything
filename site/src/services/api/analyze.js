// ============================================================
// Analysis API Service
// ============================================================
// Uses HttpOnly cookies - no token handling in JavaScript.

import { config } from '@/config';
import { DEFAULT_MODEL, DEFAULT_LANGUAGE } from '@/utils/constants.js';
import { logger } from '@/utils';

/**
 * Analyze a song with specified model and language
 * @param {Object} params - Analysis parameters
 * @param {string} params.song - Song title
 * @param {string} params.artist - Artist name
 * @param {string} [params.model] - AI model to use (default: claude)
 * @param {string} [params.lang] - Language for analysis (default: en)
 * @param {string} [params.spotify_id] - Spotify track ID (optional)
 * @param {boolean} [params.isFree] - Whether this is a free analysis (from ticker)
 * @param {AbortSignal} [params.signal] - Abort signal for cancellation
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeSong({ song, artist, model, lang, spotify_id, isFree, signal }) {
  const requestBody = {
    song,
    artist: artist || '',
    model: model || DEFAULT_MODEL,
    lang: lang || DEFAULT_LANGUAGE,
  };

  if (spotify_id) {
    requestBody.spotify_id = spotify_id;
  }

  if (isFree) {
    requestBody.is_free = true;
  }

  logger.log('[Analyze] Requesting analysis:', requestBody);

  try {
    const response = await fetch(`${config.apiUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      credentials: 'include',
      signal,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (response.status === 402) {
        throw new Error('INSUFFICIENT_CREDITS');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      // Handle timeout - trigger cleanup to refund credit
      if (response.status === 504 || response.status === 524) {
        logger.error('[Analyze] Timeout detected (504/524), triggering cleanup');
        try {
          await fetch(`${config.apiUrl}/api/cleanup-timeout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });
          window.dispatchEvent(new CustomEvent('credits-changed'));
        } catch (e) {
          logger.error('[Analyze] Failed to trigger cleanup:', e);
        }
        throw new Error('ANALYSIS_TIMEOUT');
      }

      // Handle 409 - analysis in progress (stale lock from interrupted request)
      if (response.status === 409) {
        throw new Error('ANALYSIS_IN_PROGRESS');
      }

      const errorData = await response.json().catch(() => ({}));
      logger.error('[Analyze] Server error:', errorData.message || errorData.error);

      // Check for content blocked by AI safety filters
      if (errorData.error === 'Content blocked' || errorData.message?.includes('blocked')) {
        throw new Error('CONTENT_BLOCKED');
      }

      // Pass through backend-localized message if present, otherwise use sentinel
      throw new Error(errorData.message || 'ANALYSIS_FAILED');
    }

    const data = await response.json();

    logger.log('[Analyze] Success:', {
      song: data.song || data.title,
      cached: data.cached || false,
      id: data.id,
      balance: data.balance,
    });

    // Balance is now included in response - caller should use data.balance directly
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.log('[Analyze] Request cancelled by user');
      throw new Error('ANALYSIS_CANCELLED');
    }

    // Handle network errors
    if (
      error.name === 'TypeError' ||
      error.message?.includes('fetch') ||
      error.message?.includes('network')
    ) {
      logger.error('[Analyze] Network error detected, triggering cleanup');
      try {
        await fetch(`${config.apiUrl}/api/cleanup-timeout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        window.dispatchEvent(new CustomEvent('credits-changed'));
      } catch (e) {
        logger.error('[Analyze] Failed to trigger cleanup:', e);
      }
      throw new Error('ANALYSIS_TIMEOUT');
    }

    throw error;
  }
}

export default {
  analyzeSong,
};
