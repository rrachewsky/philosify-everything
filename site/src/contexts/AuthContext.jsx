// ============================================================
// AuthContext - single authentication state for the whole app
// ============================================================
// Ruling 19 Sep 2026 (Bloco 3a): the auth state machine used to live inside
// the useAuth hook, so every consumer (46 call sites) ran its own copy —
// ~8 GET /auth/session + ~8 GET /auth/realtime-token per page load. It now
// runs ONCE here; hooks/useAuth.js reads this context. Public API of
// useAuth() is unchanged (consumers keep their code, only the source moves).
//
// Uses HttpOnly cookie auth via backend proxy.
// Realtime token fetched from dedicated /auth/realtime-token endpoint.
// Token stored in memory only, refreshed on timer before expiry.

import { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { logger } from '@/utils';
import { authService } from '@/services/auth';
import { getApiUrl } from '@/config';
import { setRealtimeAuth, destroyRealtimeClient } from '@/services/realtime.js';
import i18n from '@/i18n/config';

const AuthContext = createContext(null);

// The former hook body, unchanged except that actions no longer touch the
// shared `loading`/`error` (those are per-consumer, see hooks/useAuth.js).
// `loading` here means: the initial session check has not resolved yet.
function useAuthState() {
  const [user, setUser] = useState(null);
  const [sessionBalance, setSessionBalance] = useState(null);
  const [realtimeToken, setRealtimeToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const refreshTimerRef = useRef(null);
  const prevUserIdRef = useRef(null);
  const rtBackoffRef = useRef(0); // exponential-backoff attempt counter for realtime-token
  const fetchRealtimeTokenRef = useRef(null); // latest fetchRealtimeToken, for timers/retry

  // Fetch realtime token from dedicated endpoint and schedule refresh.
  // On 401 (stale cookie) try a one-shot session refresh then retry; if it
  // still fails, use bounded exponential backoff so a stale session can't spin
  // an unthrottled 401 loop. Success resets the backoff.
  const fetchRealtimeToken = useCallback(async (afterRefresh = false) => {
    const MAX_BACKOFF_ATTEMPTS = 6;
    const scheduleBackoff = () => {
      if (!mountedRef.current) return;
      const attempt = rtBackoffRef.current;
      if (attempt >= MAX_BACKOFF_ATTEMPTS) return; // give up until next auth/visibility event
      rtBackoffRef.current = attempt + 1;
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => fetchRealtimeTokenRef.current?.(), delay);
    };

    try {
      const res = await fetch(`${getApiUrl()}/auth/realtime-token`, {
        credentials: 'include',
      });

      // Stale cookie — try one session refresh, then retry immediately.
      if (res.status === 401 && !afterRefresh) {
        const refreshed = await fetch(`${getApiUrl()}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
          .then((r) => r.ok)
          .catch(() => false);
        if (refreshed && mountedRef.current) {
          return fetchRealtimeTokenRef.current?.(true);
        }
      }

      if (!res.ok) {
        logger.warn('[useAuth] Realtime token fetch failed:', res.status);
        if (mountedRef.current) setRealtimeToken(null);
        scheduleBackoff();
        return;
      }

      const { token, expiresAt } = await res.json();

      if (mountedRef.current && token) {
        rtBackoffRef.current = 0; // success resets backoff
        setRealtimeToken(token);
        // Update the shared Realtime client (no WebSocket teardown)
        setRealtimeAuth(token);

        // Schedule refresh 60s before expiry
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        if (expiresAt) {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const refreshInMs = Math.max((expiresAt - nowSeconds - 60) * 1000, 10000);
          refreshTimerRef.current = setTimeout(() => {
            logger.log('[useAuth] Refreshing realtime token (pre-expiry)');
            fetchRealtimeTokenRef.current?.();
          }, refreshInMs);
        }
      }
    } catch (err) {
      logger.warn('[useAuth] Realtime token fetch error:', err.message);
      if (mountedRef.current) setRealtimeToken(null);
      scheduleBackoff();
    }
  }, []);

  useEffect(() => {
    fetchRealtimeTokenRef.current = fetchRealtimeToken;
  }, [fetchRealtimeToken]);

  // Set the user and keep the realtime token in step with it. Compare user
  // IDs to avoid redundant fetches when checkSession creates a new object
  // reference for the same user (e.g. on every tab focus).
  const applyUser = useCallback(
    (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        if (nextUser.id !== prevUserIdRef.current) {
          prevUserIdRef.current = nextUser.id;
          rtBackoffRef.current = 0; // fresh session — reset backoff
          fetchRealtimeToken();
        }
      } else {
        prevUserIdRef.current = null;
        rtBackoffRef.current = 0;
        // Clear token and timer when user is null (logged out)
        setRealtimeToken(null);
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    },
    [fetchRealtimeToken],
  );

  // Check session on mount and when tab becomes visible
  const checkSession = useCallback(async () => {
    try {
      const { user: sessionUser, balance } = await authService.getSession();
      if (mountedRef.current) {
        applyUser(sessionUser);
        // Always sync sessionBalance — clear it on logout so stale data doesn't persist
        setSessionBalance(balance || null);
      }
    } catch (err) {
      logger.error('[useAuth] Session check failed:', err);
      if (mountedRef.current) {
        applyUser(null);
        setSessionBalance(null);
        setRealtimeToken(null);
      }
    }
  }, [applyUser]);

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
          // language: sets preferred_language for OAuth users (whose metadata has
          // none) so their localized auth emails (incl. password reset) match the UI.
          body: JSON.stringify({ code, language: i18n.language || 'en' }),
          credentials: 'include', // sends pkce_id cookie
        });

        if (!res.ok) {
          logger.error('[useAuth] PKCE code exchange failed:', res.status);
          return false;
        }

        const data = await res.json();
        if (mountedRef.current && data.user) {
          applyUser(data.user);
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
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          language: i18n.language || 'en',
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        logger.error('[useAuth] OAuth token exchange failed:', res.status);
        return false;
      }

      const data = await res.json();
      if (mountedRef.current && data.user) {
        applyUser(data.user);
        window.dispatchEvent(new CustomEvent('auth-changed'));
        logger.log('[useAuth] OAuth token exchange successful');
      }
      return true;
    } catch (err) {
      logger.error('[useAuth] OAuth token exchange error:', err.message);
      return false;
    }
  }, [applyUser]);

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
    try {
      const { user: signedInUser } = await authService.signIn(email, password);
      applyUser(signedInUser);
      // Notify other components that auth state changed
      window.dispatchEvent(new CustomEvent('auth-changed'));
      return { success: true, user: signedInUser };
    } catch (err) {
      logger.error('[useAuth] Sign in error:', err);
      return { success: false, error: err.message };
    }
  }, [applyUser]);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    try {
      await authService.signInWithGoogle();
      // Redirects to Google - user will be set on redirect back
      return { success: true };
    } catch (err) {
      logger.error('[useAuth] Google sign in error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Sign up with email and password
  // Automatically captures user's current UI language for localized auth emails
  const signUp = useCallback(async (email, password, fullName) => {
    try {
      // Get current UI language for localized emails
      const language = i18n.language || 'en';
      const result = await authService.signUp(email, password, language, fullName);
      // If email confirmation required, user might be null
      if (result.user) {
        applyUser(result.user);
      }
      return { success: true, user: result.user, message: result.message };
    } catch (err) {
      logger.error('[useAuth] Sign up error:', err);
      return { success: false, error: err.message };
    }
  }, [applyUser]);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      applyUser(null);
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
      return { success: false, error: err.message };
    }
  }, [applyUser]);

  // Request password reset email
  const resetPassword = useCallback(async (email) => {
    try {
      await authService.resetPassword(email);
      return { success: true };
    } catch (err) {
      logger.error('[useAuth] Reset password error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    try {
      await authService.updatePassword(newPassword);
      return { success: true };
    } catch (err) {
      logger.error('[useAuth] Update password error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Refresh session manually (can be called after OAuth callback)
  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return useMemo(
    () => ({
      user,
      sessionBalance,
      realtimeToken,
      loading,
      isAuthenticated: !!user,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshSession,
    }),
    [
      user,
      sessionBalance,
      realtimeToken,
      loading,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshSession,
    ],
  );
}

/**
 * AuthProvider — mount ONCE above every consumer of useAuth() (main.jsx).
 */
export function AuthProvider({ children }) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
