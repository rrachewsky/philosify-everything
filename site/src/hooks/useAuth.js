// ============================================================
// useAuth hook - Authentication state and methods
// ============================================================
// Uses HttpOnly cookie auth via backend proxy.
// Realtime token fetched from dedicated /auth/realtime-token endpoint.
// Token stored in memory only, refreshed on timer before expiry.

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils';
import { authService } from '@/services/auth';
import { getApiUrl } from '@/config';
import { setRealtimeAuth, destroyRealtimeClient } from '@/services/realtime.js';
import i18n from '@/i18n/config';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [sessionBalance, setSessionBalance] = useState(null);
  const [realtimeToken, setRealtimeToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const refreshTimerRef = useRef(null);
  const prevUserIdRef = useRef(null);

  // Fetch realtime token from dedicated endpoint and schedule refresh
  const fetchRealtimeToken = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/auth/realtime-token`, {
        credentials: 'include',
      });

      if (!res.ok) {
        logger.warn('[useAuth] Realtime token fetch failed:', res.status);
        if (mountedRef.current) {
          setRealtimeToken(null);
        }
        return;
      }

      const { token, expiresAt } = await res.json();

      if (mountedRef.current && token) {
        setRealtimeToken(token);
        // Update the shared Realtime client (no WebSocket teardown)
        setRealtimeAuth(token);

        // Schedule refresh 60s before expiry
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
        }
        if (expiresAt) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const refreshInMs = Math.max((expiresAt - nowSeconds - 60) * 1000, 10000);
          refreshTimerRef.current = setTimeout(() => {
            logger.log('[useAuth] Refreshing realtime token (pre-expiry)');
            fetchRealtimeToken();
          }, refreshInMs);
        }
      }
    } catch (err) {
      logger.warn('[useAuth] Realtime token fetch error:', err.message);
      if (mountedRef.current) {
        setRealtimeToken(null);
      }
    }
  }, []);

  // Check session on mount and when tab becomes visible
  const checkSession = useCallback(async () => {
    try {
      const { user: sessionUser, balance } = await authService.getSession();
      if (mountedRef.current) {
        setUser(sessionUser);
        // Always sync sessionBalance — clear it on logout so stale data doesn't persist
        setSessionBalance(balance || null);
      }
    } catch (err) {
      logger.error('[useAuth] Session check failed:', err);
      if (mountedRef.current) {
        setUser(null);
        setSessionBalance(null);
        setRealtimeToken(null);
      }
    }
  }, []);

  // Handle OAuth callback on the frontend
  // Detects two scenarios:
  // 1. PKCE flow: ?code=xxx in query params → send to /auth/exchange-code (tokens never in URL)
  // 2. Implicit fallback: #access_token=xxx in hash → send to /auth/exchange
  const handleOAuthCallback = useCallback(async () => {
    // --- PKCE flow: ?code= in query params ---
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      logger.log('[useAuth] Detected PKCE code in URL, exchanging...');
      // Clean the URL immediately (remove ?code= but keep path)
      window.history.replaceState(null, '', window.location.pathname);

      try {
        const res = await fetch(`${getApiUrl()}/auth/exchange-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
          credentials: 'include', // sends pkce_id cookie
        });

        if (!res.ok) {
          logger.error('[useAuth] PKCE code exchange failed:', res.status);
          return false;
        }

        const data = await res.json();
        if (mountedRef.current && data.user) {
          setUser(data.user);
          window.dispatchEvent(new CustomEvent('auth-changed'));
          logger.log('[useAuth] PKCE code exchange successful');
        }
        return true;
      } catch (err) {
        logger.error('[useAuth] PKCE code exchange error:', err.message);
        return false;
      }
    }

    // --- Implicit fallback: #access_token= in hash ---
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token=')) return false;

    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (!accessToken || !refreshToken) return false;

    logger.log('[useAuth] Detected OAuth tokens in URL hash, exchanging...');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    try {
      const res = await fetch(`${getApiUrl()}/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
        credentials: 'include',
      });

      if (!res.ok) {
        logger.error('[useAuth] OAuth token exchange failed:', res.status);
        return false;
      }

      const data = await res.json();
      if (mountedRef.current && data.user) {
        setUser(data.user);
        window.dispatchEvent(new CustomEvent('auth-changed'));
        logger.log('[useAuth] OAuth token exchange successful');
      }
      return true;
    } catch (err) {
      logger.error('[useAuth] OAuth token exchange error:', err.message);
      return false;
    }
  }, []);

  // Initial session check + realtime token fetch
  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      // First check if we have OAuth code/tokens in the URL (PKCE or implicit flow)
      const exchanged = await handleOAuthCallback();
      if (!exchanged) {
        // No OAuth params — check existing session cookie
        await checkSession();
      }
      if (mountedRef.current) {
        setLoading(false);
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [checkSession, handleOAuthCallback]);

  // Fetch realtime token once user is authenticated.
  // Compare user ID to avoid redundant fetches when checkSession creates
  // a new object reference for the same user (e.g. on every tab focus).
  useEffect(() => {
    if (user) {
      if (user.id !== prevUserIdRef.current) {
        prevUserIdRef.current = user.id;
        fetchRealtimeToken();
      }
    } else {
      prevUserIdRef.current = null;
      // Clear token and timer when user is null (logged out)
      setRealtimeToken(null);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    }
  }, [user, fetchRealtimeToken]);

  // Refresh session when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession]);

  // Listen for auth changes from other components
  useEffect(() => {
    const handleAuthChanged = () => {
      checkSession();
    };

    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, [checkSession]);

  // Sign in with email and password
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { user: signedInUser } = await authService.signIn(email, password);
      setUser(signedInUser);
      // Notify other components that auth state changed
      window.dispatchEvent(new CustomEvent('auth-changed'));
      return { success: true, user: signedInUser };
    } catch (err) {
      logger.error('[useAuth] Sign in error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authService.signInWithGoogle();
      // Redirects to Google - user will be set on redirect back
      return { success: true };
    } catch (err) {
      logger.error('[useAuth] Google sign in error:', err);
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign up with email and password
  // Automatically captures user's current UI language for localized auth emails
  const signUp = useCallback(async (email, password, fullName) => {
    setLoading(true);
    setError(null);

    try {
      // Get current UI language for localized emails
      const language = i18n.language || 'en';
      const result = await authService.signUp(email, password, language, fullName);
      // If email confirmation required, user might be null
      if (result.user) {
        setUser(result.user);
      }
      return { success: true, user: result.user, message: result.message };
    } catch (err) {
      logger.error('[useAuth] Sign up error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authService.signOut();
      setUser(null);
      setSessionBalance(null);
      setRealtimeToken(null);
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      // Destroy the shared Realtime client
      destroyRealtimeClient();
      // Notify other components that auth state changed
      window.dispatchEvent(new CustomEvent('auth-changed'));
      return { success: true };
    } catch (err) {
      logger.error('[useAuth] Sign out error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Request password reset email
  const resetPassword = useCallback(async (email) => {
    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(email);
      return { success: true };
    } catch (err) {
      logger.error('[useAuth] Reset password error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    setLoading(true);
    setError(null);

    try {
      await authService.updatePassword(newPassword);
      return { success: true };
    } catch (err) {
      logger.error('[useAuth] Update password error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh session manually (can be called after OAuth callback)
  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return {
    user,
    sessionBalance,
    realtimeToken,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
  };
}

export default useAuth;
