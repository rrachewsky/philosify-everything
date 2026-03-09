// useLanguage hook - i18n language management
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/utils';

/**
 * Custom hook for managing language
 * Uses react-i18next under the hood
 */
export function useLanguage() {
  const { i18n, t } = useTranslation();

  // Get current language
  const currentLanguage = i18n.language || 'en';

  // Change language
  const changeLanguage = useCallback(
    async (lang) => {
      try {
        await i18n.changeLanguage(lang);
        logger.log('[i18n] Language changed to:', lang);
      } catch (error) {
        logger.error('[i18n] Error changing language:', error);
      }
    },
    [i18n]
  );

  // Get available languages
  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'hu', name: 'Magyar' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ru', name: 'Русский' },
    { code: 'he', name: 'עברית' },
  ];

  // Check if RTL language (Hebrew, Arabic, Farsi)
  // Note: RTL applies only to text content, not layout
  const isRTL = ['he', 'ar', 'fa'].includes(currentLanguage);

  return {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isRTL,
    t, // Translation function
  };
}

export default useLanguage;
