// useAnalysis hook - Song analysis logic
import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeSong } from '@/services/api';
import { parseSongQuery, logger } from '@/utils';
import { DEFAULT_MODEL, DEFAULT_LANGUAGE } from '@/utils/constants';

export function useAnalysis() {
  const { t } = useTranslation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Analyze song
  const analyze = useCallback(
    async ({
      query,
      song,
      artist,
      model = DEFAULT_MODEL,
      lang = DEFAULT_LANGUAGE,
      spotify_id,
      isFree = false,
    }) => {
      setLoading(true);
      setError(null);
      setResult(null);

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      try {
        // Parse query if provided instead of song/artist
        let songTitle = song;
        let artistName = artist;

        if (query && !song) {
          const parsed = parseSongQuery(query);
          songTitle = parsed.song;
          artistName = parsed.artist;
        }

        if (!songTitle) {
          throw new Error('MISSING_SONG_TITLE');
        }

        logger.log('[useAnalysis] Analyzing:', { songTitle, artistName, model, lang });

        const data = await analyzeSong({
          song: songTitle,
          artist: artistName,
          model,
          lang,
          spotify_id,
          isFree,
          signal: abortControllerRef.current.signal,
        });

        setResult(data);
        return { success: true, data };
      } catch (err) {
        logger.error('[useAnalysis] Error:', err);

        // Handle specific error types with i18n
        if (err.message === 'ANALYSIS_CANCELLED') {
          setError(t('analysisErrors.cancelled'));
          return { success: false, error: 'cancelled' };
        } else if (err.message === 'MISSING_SONG_TITLE') {
          setError(t('analysisErrors.missingSong'));
        } else if (err.message === 'UNAUTHORIZED') {
          setError(t('analysisErrors.unauthorized'));
        } else if (err.message === 'INSUFFICIENT_CREDITS') {
          setError(t('analysisErrors.insufficientCredits'));
        } else if (err.message === 'RATE_LIMIT_EXCEEDED') {
          setError(t('analysisErrors.rateLimit'));
        } else if (err.message === 'ANALYSIS_TIMEOUT') {
          setError(t('analysisErrors.timeout'));
        } else if (err.message === 'ANALYSIS_IN_PROGRESS') {
          setError(t('analysisErrors.inProgress'));
        } else if (err.message === 'CONTENT_BLOCKED') {
          setError(t('analysisErrors.contentBlocked'));
        } else if (err.message === 'ANALYSIS_FAILED') {
          setError(t('analysisErrors.generic'));
        } else {
          // Backend-localized message (lyricsNotFound, lyricsTooShort, etc.) or fallback
          setError(err.message || t('analysisErrors.generic'));
        }

        return { success: false, error: err.message };
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [t]
  );

  // Cancel ongoing analysis
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      logger.log('[useAnalysis] Cancelling analysis...');
      abortControllerRef.current.abort();
      setLoading(false);
      setError(t('analysisErrors.cancelled'));
    }
  }, [t]);

  // Clear results
  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    setResult, // Expose for viewing cached analyses from history
    loading,
    error,
    analyze,
    cancel,
    clear,
  };
}

export default useAnalysis;
