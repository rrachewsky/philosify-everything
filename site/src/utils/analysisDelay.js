// Default minimum: enough time for analysis animation even without ads
export const MIN_ANALYSIS_AD_WINDOW_MS = 20_000;

// Minimum padding added to the ad duration to ensure the full ad is seen
// before results appear (accounts for ad load time + impression recording)
const AD_PADDING_MS = 2_000;

/**
 * Wait until the minimum analysis display window has elapsed.
 * If an ad duration is provided, the hold is at least (ad duration + padding).
 * Otherwise falls back to the default 20s window.
 *
 * @param {number} startedAt - Date.now() when analysis started
 * @param {number|null} adDurationSeconds - contracted ad duration in seconds (5, 10, 15, 20)
 */
export async function waitForMinimumAnalysisWindow(startedAt, adDurationSeconds = null) {
  let minimumMs;

  if (adDurationSeconds && adDurationSeconds > 0) {
    // Hold for at least the ad's contracted duration + padding
    minimumMs = Math.max(adDurationSeconds * 1000 + AD_PADDING_MS, MIN_ANALYSIS_AD_WINDOW_MS);
  } else {
    minimumMs = MIN_ANALYSIS_AD_WINDOW_MS;
  }

  const remainingMs = minimumMs - (Date.now() - startedAt);

  if (remainingMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingMs));
  }
}
