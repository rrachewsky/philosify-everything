import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './translations/en.json';

const SUPPORTED_LANGUAGES = [
  'en', 'pt', 'es', 'de', 'fr', 'it', 'hu', 'zh',
  'ja', 'ko', 'ru', 'he', 'ar', 'hi', 'fa', 'nl', 'pl', 'tr',
];

const RTL_LANGUAGES = ['he', 'ar', 'fa'];

const normalizeLang = (lng) => String(lng || '').split('-')[0].trim();

const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem('ads-language');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {}
  const browserLang = normalizeLang(navigator?.language);
  if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;
  return 'en';
};

const loadTranslation = async (lang) => {
  if (lang === 'en') return en;
  try {
    const module = await import(`./translations/${lang}.json`);
    return module.default || module;
  } catch {
    console.warn(`[i18n] Failed to load ${lang}, falling back to English`);
    return en;
  }
};

export const changeLanguageWithPreload = async (langCode) => {
  if (langCode !== 'en' && !i18n.hasResourceBundle(langCode, 'translation')) {
    const translations = await loadTranslation(langCode);
    i18n.addResourceBundle(langCode, 'translation', translations, true, true);
  }
  await i18n.changeLanguage(langCode);
};

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'translation',
  ns: ['translation'],
  returnNull: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

let hasFinishedInit = false;

export const initI18nLanguage = async () => {
  const savedLang = getSavedLanguage();
  if (savedLang !== 'en') {
    const translations = await loadTranslation(savedLang);
    i18n.addResourceBundle(savedLang, 'translation', translations, true, true);
    await i18n.changeLanguage(savedLang);
  }
  hasFinishedInit = true;
};

i18n.on('languageChanged', async (lng) => {
  try {
    const hasPreference = !!localStorage.getItem('ads-language');
    if (hasFinishedInit || hasPreference || lng !== 'en') {
      localStorage.setItem('ads-language', lng);
    }
  } catch {}
  document.documentElement.lang = lng;
  document.documentElement.setAttribute('data-rtl', RTL_LANGUAGES.includes(lng) ? 'true' : 'false');
  if (lng !== 'en') {
    const translations = await loadTranslation(lng);
    i18n.addResourceBundle(lng, 'translation', translations, true, true);
  }
});

export { SUPPORTED_LANGUAGES, RTL_LANGUAGES };
export default i18n;
