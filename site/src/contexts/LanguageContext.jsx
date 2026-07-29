// LanguageContext - Global language state provider
import { createContext, useContext, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useLanguage } from '../hooks/useLanguage';
import { ensureLocaleFont } from '../utils/localeFonts';

const LanguageContext = createContext(null);

/**
 * Language Provider Component
 * Wraps the app with i18next and provides language utilities
 */
export function LanguageProvider({ children }) {
  const languageUtils = useLanguage();

  // Set initial document attributes
  // NOTE: We use data-rtl attribute instead of dir="rtl" to keep layout LTR
  // RTL text direction is applied via CSS only to text content elements
  useEffect(() => {
    document.documentElement.lang = languageUtils.currentLanguage;
    document.documentElement.setAttribute('data-rtl', languageUtils.isRTL ? 'true' : 'false');
    ensureLocaleFont(languageUtils.currentLanguage);
  }, [languageUtils.currentLanguage, languageUtils.isRTL]);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={languageUtils}>{children}</LanguageContext.Provider>
    </I18nextProvider>
  );
}

/**
 * Hook to use LanguageContext
 */
export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
}

export default LanguageContext;
