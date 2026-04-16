/* eslint-disable react-refresh/only-export-components */

/**
 * ADMIN AUTHENTICATION CONTEXT
 * 
 * SECURITY FIX (CVE-2026-001): Moved from sessionStorage to HTTPOnly cookies
 * - Admin secret NEVER stored in JavaScript-accessible storage
 * - Session managed via secure HTTPOnly cookies
 * - Automatic session expiration (8 hours)
 * - Protected against XSS attacks
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@services/api';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);

  // Verify current session on mount
  useEffect(() => {
    verifySession();
  }, []);

  const verifySession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/ads/admin/auth/verify');
      setAuthenticated(data.authenticated);
      setExpiresIn(data.expiresIn || 0);
      return data.authenticated;
    } catch (error) {
      setAuthenticated(false);
      setExpiresIn(0);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (secret) => {
    if (!secret) {
      return false;
    }

    setLoading(true);
    try {
      // Send secret to backend, which validates and sets HTTPOnly cookie
      const data = await api.post('/ads/admin/auth/login', { secret });
      
      if (data.success) {
        setAuthenticated(true);
        setExpiresIn(data.expiresIn || 0);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AdminContext] Login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/ads/admin/auth/logout', {});
    } catch (error) {
      console.error('[AdminContext] Logout error:', error);
    }
    
    setAuthenticated(false);
    setExpiresIn(0);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      isAuthenticated: authenticated,
      expiresIn,
      login,
      logout,
      verifySession,
    }),
    [loading, authenticated, expiresIn, login, logout, verifySession]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }

  return context;
}

export default AdminContext;
