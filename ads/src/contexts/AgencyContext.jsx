/* eslint-disable react-refresh/only-export-components */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@services/api';

const AgencyContext = createContext(null);

export function AgencyProvider({ children }) {
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const data = await api.get('/ads/agency/auth/me');
      setAgency(data.agency || null);
    } catch {
      setAgency(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/ads/agency/auth/login', { email, password });
    if (data.agency) {
      setAgency(data.agency);
    }
    return data;
  };

  const signup = async (formData) => {
    const data = await api.post('/ads/agency/auth/signup', formData);
    if (data.agency) {
      setAgency(data.agency);
    }
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/ads/agency/auth/logout');
    } catch {
      // ignore
    }
    setAgency(null);
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const value = useMemo(
    () => ({ agency, loading, login, signup, logout, refresh: checkSession }),
    [agency, loading, checkSession],
  );

  return <AgencyContext.Provider value={value}>{children}</AgencyContext.Provider>;
}

export function useAgency() {
  const ctx = useContext(AgencyContext);
  if (!ctx) throw new Error('useAgency must be used within AgencyProvider');
  return ctx;
}
