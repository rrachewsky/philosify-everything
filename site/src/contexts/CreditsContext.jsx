// CreditsContext - Global credits state provider (single source of truth)
import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../hooks/useCredits';

const CreditsContext = createContext(null);

/**
 * Credits Provider Component
 * Centralizes credit balance management to prevent multiple API calls
 */
export function CreditsProvider({ children }) {
  const { user, sessionBalance } = useAuth();
  const creditsState = useCredits(user, sessionBalance);

  return <CreditsContext.Provider value={creditsState}>{children}</CreditsContext.Provider>;
}

/**
 * Hook to use CreditsContext
 * Use this instead of useCredits(user) in components
 */
export function useCreditsContext() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error('useCreditsContext must be used within CreditsProvider');
  }
  return context;
}

export default CreditsContext;
