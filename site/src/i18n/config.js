// i18next configuration with lazy loading
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Only bundle English (fallback) - others loaded on demand
import en from './translations/en.json';

// Supported languages (all 15 supported by Gemini TTS + existing)
const SUPPORTED_LANGUAGES = [
  'en',
  'pt',
  'es',
  'de',
  'fr',
  'it',
  'hu',
  'zh',
  'ja',
  'ko',
  'ru',
  'he',
  'ar',
  'hi',
  'fa',
  'nl',
  'pl',
  'tr',
];

// RTL languages
const RTL_LANGUAGES = ['he', 'ar', 'fa'];

// Normalize navigator language like "pt-BR" -> "pt"
const normalizeLang = (lng) =>
  String(lng || '')
    .split('-')[0]
    .trim();

// Get saved language from localStorage, otherwise prefer browser language, otherwise EN
const getSavedLanguage = () => {
  const saved = localStorage.getItem('preferredLanguage');
  const browserLang = normalizeLang(navigator?.language);

  // If a previous version auto-saved "en", prefer the browser language when available.
  // This avoids "sticky English" for users with browsers set to PT/ES/etc.
  if (
    saved === 'en' &&
    browserLang &&
    SUPPORTED_LANGUAGES.includes(browserLang) &&
    browserLang !== 'en'
  ) {
    return browserLang;
  }

  if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
    return saved;
  }

  if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }

  return 'en';
};

// Dynamic import for translations (Vite will code-split these)
const loadTranslation = async (lang) => {
  if (lang === 'en') return en; // Already bundled

  try {
    // Dynamic import - Vite will create separate chunks
    const module = await import(`./translations/${lang}.json`);
    return module.default || module;
  } catch {
    console.warn(`[i18n] Failed to load ${lang} translations, falling back to English`);
    return en;
  }
};

// Change language with pre-loading (avoids flash to English)
export const changeLanguageWithPreload = async (langCode) => {
  if (langCode !== 'en' && !i18n.hasResourceBundle(langCode, 'translation')) {
    const translations = await loadTranslation(langCode);
    i18n.addResourceBundle(langCode, 'translation', translations, true, true);
  }
  await i18n.changeLanguage(langCode);
};

// Initialize i18n with English first
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en', // Start with English (always available)
  fallbackLng: 'en',

  // i18next v25: Type safety configuration
  defaultNS: 'translation',
  ns: ['translation'],
  returnNull: false,

  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // We handle loading ourselves
  },
});

let hasFinishedInitialLanguageSetup = false;

// Load saved/browser language if not English (call this BEFORE rendering the app to avoid flicker)
export const initI18nLanguage = async () => {
  const savedLang = getSavedLanguage();
  if (savedLang !== 'en') {
    const translations = await loadTranslation(savedLang);
    i18n.addResourceBundle(savedLang, 'translation', translations, true, true);
    await i18n.changeLanguage(savedLang);
  }
  hasFinishedInitialLanguageSetup = true;
};

// Save language changes to localStorage and load translations
i18n.on('languageChanged', async (lng) => {
  // Avoid persisting "en" by default on first load (prevents sticky English).
  // Persist only after initial language setup is done, or when user already has a preference.
  try {
    const alreadyHasPreference = !!localStorage.getItem('preferredLanguage');
    if (hasFinishedInitialLanguageSetup || alreadyHasPreference || lng !== 'en') {
      localStorage.setItem('preferredLanguage', lng);
    }
  } catch {
    // ignore storage failures
  }

  // Update document language attribute
  // NOTE: We do NOT set dir="rtl" on the document - layout should remain LTR
  // RTL text direction is applied via CSS only to text content elements
  document.documentElement.lang = lng;
  document.documentElement.setAttribute('data-rtl', RTL_LANGUAGES.includes(lng) ? 'true' : 'false');

  // Always reload translations (deep merge + overwrite) so new keys from
  // fresh deployments are picked up without requiring a hard refresh.
  if (lng !== 'en') {
    const translations = await loadTranslation(lng);
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
  }
});

export default i18n;
