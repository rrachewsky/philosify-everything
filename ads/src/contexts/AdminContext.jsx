/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@services/api';

const ADMIN_SECRET_KEY = 'philosify-ads-admin-secret';
const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const validateSecret = useCallback(async (secret) => {
    if (!secret) {
      setAuthenticated(false);
      return false;
    }

    setLoading(true);
    try {
      await api.adminGet('/ads/admin/overview', secret);
      setAuthenticated(true);
      window.localStorage.setItem(ADMIN_SECRET_KEY, secret);
      setAdminSecret(secret);
      return true;
    } catch {
      setAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedSecret = window.localStorage.getItem(ADMIN_SECRET_KEY) || '';
    if (!savedSecret) {
      return;
    }

    setAdminSecret(savedSecret);
    validateSecret(savedSecret);
  }, [validateSecret]);

  const logout = () => {
    window.localStorage.removeItem(ADMIN_SECRET_KEY);
    setAdminSecret('');
    setAuthenticated(false);
  };

  const value = useMemo(
    () => ({
      adminSecret,
      loading,
      isAuthenticated: authenticated,
      login: validateSecret,
      logout,
    }),
    [adminSecret, authenticated, loading, validateSecret]
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
