// TTS Cache Service - Pre-generates audio in background after analysis completes
// Audio is cached and ready for instant playback when user clicks Listen
// Auth: Uses HttpOnly cookies (credentials: 'include')
//
// Flow:
// 1. Check if result.audio_url exists (already cached in R2) -> instant playback
// 2. If not, call /api/tts to generate -> backend caches in R2 and updates analysis.audio_url
// 3. On next load, audio_url will be populated -> instant playback

const API_URL = import.meta.env.VITE_API_URL || 'https://api-everything.philosify.org';

// Timeout for TTS generation (2 minutes - Gemini TTS can take 60-90s)
const TTS_TIMEOUT_MS = 120000;

// Retry configuration
const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 2; // 3 total attempts (initial + 2 retries)

// In-memory cache for pre-generated audio URLs
// Key: `${songName}|${artist}|${lang}` -> { url: blobUrl|r2Url, status: 'loading'|'ready'|'error', permanent?: boolean }
const audioCache = new Map();

// Active fetch controllers for cancellation
const activeRequests = new Map();

/**
 * Generate a cache key for a result + language combination
 */
function getCacheKey(result, lang) {
  const song = result?.song || result?.song_name || '';
  const artist = result?.artist || '';
  return `${song}|${artist}|${lang}`;
}

/**
 * Check if audio is ready for a given result + language
 * First checks if result.audio_url exists (R2 cached), then checks in-memory cache
 * @returns {string|null} URL if ready (R2 or blob), null otherwise
 */
export function getPreloadedAudio(result, lang) {
  // Check in-memory cache only (blob URL from current session)
  // NOTE: We don't use result.audio_url (direct R2 URL) because R2 public bucket
  // may not be accessible. Instead, /api/tts reads from R2 via Worker binding.
  const key = getCacheKey(result, lang);
  const cached = audioCache.get(key);

  if (cached?.status === 'ready' && cached?.url) {
    console.log('[TTS Cache] Hit (in-memory):', key);
    return cached.url;
  }

  return null;
}

/**
 * Check the loading status of audio for a given result + language
 * @returns {'loading'|'ready'|'error'|'none'}
 */
export function getAudioStatus(result, lang) {
  // Check in-memory cache status only
  const key = getCacheKey(result, lang);
  const cached = audioCache.get(key);
  return cached?.status || 'none';
}

/**
 * Get the error message if status is 'error'
 * @returns {string|null} Error message or null
 */
export function getAudioError(result, lang) {
  const key = getCacheKey(result, lang);
  const cached = audioCache.get(key);
  return cached?.error || null;
}

/**
 * Pre-generate TTS audio in background
 * Does NOT play the audio - just caches it for later
 */
export async function preloadTTS(result, lang) {
  if (!result || typeof result !== 'object') {
    console.warn('[TTS Cache] Invalid result for preload');
    return;
  }

  // Always preload via /api/tts - it handles R2 cache internally
  const key = getCacheKey(result, lang);

  // Already loading or ready
  const existing = audioCache.get(key);
  if (existing?.status === 'loading' || existing?.status === 'ready') {
    console.log('[TTS Cache] Already processing/cached:', key);
    return;
  }

  // Mark as loading
  audioCache.set(key, { status: 'loading', url: null });
  console.log('[TTS Cache] Pre-generating audio for:', key);

  // Create abort controller (let so we can reassign on retry)
  let abortController = new AbortController();
  activeRequests.set(key, abortController);

  let retries = 0;
  let wasTimeout = false;

  // Track timeout separately (AbortSignal.any is not supported in all browsers)
  let timeoutId = null;

  try {
    while (retries <= MAX_RETRIES) {
      try {
        // Detect analysis language
        const analysisLang = result?.lang || result?.language || 'en';

        // Set up timeout
        timeoutId = setTimeout(() => {
          wasTimeout = true;
          abortController.abort();
        }, TTS_TIMEOUT_MS);

        const response = await fetch(`${API_URL}/api/tts`, {
          method: 'POST',
          credentials: 'include', // Send HttpOnly cookie for auth
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            result,
            targetLang: lang,
            analysisLang: analysisLang,
            analysisId: result?.id || null, // Pass analysis ID for cache key
          }),
          signal: abortController.signal,
        });

        // Clear timeout on successful response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`TTS failed: ${response.status} ${errorText}`);
        }

        // Get audio blob and create local URL
        // Always use blob URL for playback (not R2 URL due to access issues)
        const audioBlob = await response.blob();
        const blobUrl = URL.createObjectURL(audioBlob);

        // Cache as ready with blob URL
        audioCache.set(key, {
          status: 'ready',
          url: blobUrl,
          blobUrl: blobUrl,
        });

        console.log('[TTS Cache] ✓ Audio ready:', key);

        // Success - exit
        return;
      } catch (err) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (err.name === 'AbortError') {
          if (!wasTimeout) {
            // User cancelled - exit immediately
            console.log('[TTS Cache] Pre-generation cancelled:', key);
            audioCache.delete(key);
            return;
          }

          // Timeout occurred - check if we should retry
          if (retries < MAX_RETRIES) {
            retries++;
            console.warn(`[TTS Cache] Timeout - Retry ${retries}/${MAX_RETRIES}`);
            // Set status to 'retrying' so UI can show feedback
            audioCache.set(key, { status: 'retrying', url: null, retryCount: retries });
            // Reset timeout flag and create new abort controller
            wasTimeout = false;
            abortController = new AbortController();
            activeRequests.set(key, abortController);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            continue;
          }

          // All retries exhausted after timeout
          console.error('[TTS Cache] Pre-generation timed out after all retries:', key);
          audioCache.set(key, {
            status: 'error',
            url: null,
            error: 'timeout',
            errorMessage: 'Audio generation timed out. Please try again.',
          });
          return;
        }

        // Other errors - retry logic
        if (retries < MAX_RETRIES) {
          retries++;
          console.warn(`[TTS Cache] Retry ${retries}/${MAX_RETRIES} after error:`, err.message);
          audioCache.set(key, { status: 'retrying', url: null, retryCount: retries });
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }

        // All retries exhausted
        console.error('[TTS Cache] Pre-generation failed after retries:', key, err.message);
        audioCache.set(key, {
          status: 'error',
          url: null,
          error: 'failed',
          errorMessage: err.message || 'Audio generation failed. Please try again.',
        });
        return;
      }
    }
  } finally {
    // Always clean up the active request
    activeRequests.delete(key);
  }
}

/**
 * Cancel any pending pre-generation for a result + language
 */
export function cancelPreload(result, lang) {
  const key = getCacheKey(result, lang);
  const controller = activeRequests.get(key);

  if (controller) {
    console.log('[TTS Cache] Cancelling preload:', key);
    controller.abort();
    activeRequests.delete(key);
    audioCache.delete(key);
  }
}

/**
 * Clear cached audio for a specific result + language
 */
export function clearCachedAudio(result, lang) {
  const key = getCacheKey(result, lang);
  const cached = audioCache.get(key);

  // Only revoke blob URLs, not R2 URLs
  if (cached?.blobUrl && cached.blobUrl.startsWith('blob:')) {
    URL.revokeObjectURL(cached.blobUrl);
  }

  audioCache.delete(key);
}

/**
 * Clear all cached audio (call on logout or memory pressure)
 */
export function clearAllCachedAudio() {
  for (const [, cached] of audioCache.entries()) {
    // Only revoke blob URLs, not R2 URLs
    if (cached?.blobUrl && cached.blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cached.blobUrl);
    }
  }

  // Cancel all active requests
  for (const controller of activeRequests.values()) {
    controller.abort();
  }

  audioCache.clear();
  activeRequests.clear();
  console.log('[TTS Cache] Cleared all cached audio');
}

// Export for debugging
export function getCacheStats() {
  const stats = {
    total: audioCache.size,
    ready: 0,
    loading: 0,
    error: 0,
    permanent: 0,
  };

  for (const cached of audioCache.values()) {
    if (cached.status === 'ready') {
      stats.ready++;
      if (cached.permanent) stats.permanent++;
    } else if (cached.status === 'loading') {
      stats.loading++;
    } else if (cached.status === 'error') {
      stats.error++;
    }
  }

  return stats;
}
