/* eslint-disable react-refresh/only-export-components */

// ============================================================
// Auth Context for Philosify Ads Platform
// ============================================================
// Uses HttpOnly cookies managed by the API (same as main Philosify)
// - No token storage in JavaScript (XSS protection)
// - Browser handles cookie storage/sending automatically
// - Frontend simply calls API endpoints
// ============================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [advertiser, setAdvertiser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const data = await api.get('/ads/auth/me');
      setAdvertiser(data.advertiser || null);
    } catch {
      setAdvertiser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/ads/auth/login', { email, password });
    if (data.advertiser) {
      setAdvertiser(data.advertiser);
    }
    return data;
  };

  const signup = async (formData) => {
    const data = await api.post('/ads/auth/signup', formData);
    if (data.advertiser) {
      setAdvertiser(data.advertiser);
    }
    return data;
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const logout = async () => {
    try {
      await api.post('/ads/auth/logout');
    } catch {
      // Ignore errors and still clear local state.
    }
    setAdvertiser(null);
  };

  const value = useMemo(
    () => ({
      advertiser,
      loading,
      isAuthenticated: !!advertiser,
      login,
      signup,
      logout,
      refreshSession: checkSession,
      refreshAdvertiser: checkSession,
    }),
    [advertiser, loading, checkSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
