// ============================================================
// useAuth hook - Authentication state and methods
// ============================================================
// Ruling 19 Sep 2026 (Bloco 3a): the state lives in contexts/AuthContext.jsx
// (one instance per app). This hook reads it and keeps the historical
// per-consumer semantics of `loading`/`error` around the auth actions:
// a sign-in started from one component shows loading/error THERE, not in
// every page that gates on authLoading. Public API unchanged.

import { useContext, useState, useCallback, useMemo } from 'react';
import AuthContext from '@/contexts/AuthContext.jsx';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  // Wrap a shared action so this consumer sees its own loading/error.
  const wrap = useCallback(
    (action, { keepPendingOnSuccess = false } = {}) =>
      async (...args) => {
        setPending(true);
        setError(null);
        const result = await action(...args);
        if (!result?.success) {
          setError(result?.error || null);
          setPending(false);
        } else if (!keepPendingOnSuccess) {
          setPending(false);
        }
        return result;
      },
    [],
  );

  const actions = useMemo(
    () => ({
      signIn: wrap(ctx.signIn),
      // Redirects to Google on success — loading stays true like before.
      signInWithGoogle: wrap(ctx.signInWithGoogle, { keepPendingOnSuccess: true }),
      signUp: wrap(ctx.signUp),
      signOut: wrap(ctx.signOut),
      resetPassword: wrap(ctx.resetPassword),
      updatePassword: wrap(ctx.updatePassword),
    }),
    [wrap, ctx.signIn, ctx.signInWithGoogle, ctx.signUp, ctx.signOut, ctx.resetPassword, ctx.updatePassword],
  );

  return {
    user: ctx.user,
    sessionBalance: ctx.sessionBalance,
    realtimeToken: ctx.realtimeToken,
    loading: ctx.loading || pending,
    error,
    isAuthenticated: ctx.isAuthenticated,
    ...actions,
    refreshSession: ctx.refreshSession,
  };
}

export default useAuth;
