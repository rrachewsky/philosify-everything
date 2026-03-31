export const MIN_ANALYSIS_AD_WINDOW_MS = 20_000;

export async function waitForMinimumAnalysisWindow(startedAt, minimumMs = MIN_ANALYSIS_AD_WINDOW_MS) {
  const remainingMs = minimumMs - (Date.now() - startedAt);

  if (remainingMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingMs));
  }
}
