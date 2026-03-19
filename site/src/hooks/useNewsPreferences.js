// ============================================================
// useNewsPreferences Hook
// ============================================================
// Manages user's news source preferences.
// - Fetches preferences on mount
// - Handles unlock (1 credit) and source updates
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { getNewsPreferences, unlockNewsSources, updateNewsSources } from '../services/api/newsApi.js';
import { useAuth } from './useAuth.js';

export function useNewsPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [unlocked, setUnlocked] = useState(false);
  const [enabledSources, setEnabledSources] = useState(null);
  const [defaultSources, setDefaultSources] = useState([]);
  const [availableSources, setAvailableSources] = useState({});

  // Fetch preferences on mount (if user is logged in)
  useEffect(() => {
    if (!user) return;

    const fetchPrefs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getNewsPreferences();
        setUnlocked(data.unlocked || false);
        setEnabledSources(data.enabledSources);
        setDefaultSources(data.defaultSources || []);
        setAvailableSources(data.availableSources || {});
      } catch (err) {
        console.error('[useNewsPreferences] Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, [user]);

  // Unlock custom source selection (costs 1 credit)
  const unlock = useCallback(async () => {
    if (unlocked) return { success: true };

    setUnlocking(true);
    setError(null);
    try {
      const result = await unlockNewsSources();
      if (result.success) {
        setUnlocked(true);
        // Dispatch credits-changed event so balance updates
        window.dispatchEvent(new CustomEvent('credits-changed'));
      }
      return result;
    } catch (err) {
      console.error('[useNewsPreferences] Unlock error:', err);
      setError(err.message);
      return { success: false, error: err.message, code: err.code };
    } finally {
      setUnlocking(false);
    }
  }, [unlocked]);

  // Update enabled sources
  const updateSources = useCallback(async (sources) => {
    if (!unlocked) {
      setError('Source customization not unlocked');
      return { success: false, error: 'NOT_UNLOCKED' };
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateNewsSources(sources);
      if (result.success) {
        setEnabledSources(result.enabledSources);
      }
      return result;
    } catch (err) {
      console.error('[useNewsPreferences] Update error:', err);
      setError(err.message);
      return { success: false, error: err.message, code: err.code };
    } finally {
      setSaving(false);
    }
  }, [unlocked]);

  // Get currently active sources (custom if unlocked, default otherwise)
  const activeSources = unlocked && enabledSources ? enabledSources : defaultSources;

  return {
    // State
    loading,
    unlocking,
    saving,
    error,
    unlocked,
    enabledSources,
    defaultSources,
    availableSources,
    activeSources,
    
    // Actions
    unlock,
    updateSources,
  };
}

export default useNewsPreferences;
