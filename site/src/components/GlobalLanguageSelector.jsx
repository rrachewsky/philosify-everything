// GlobalLanguageSelector - Language selection for the entire app experience
// Sets the language for all analyses and TTS audio generation
// English is the default language

import { useTranslation } from 'react-i18next';

// Supported languages with their codes and native names
// 16 languages supported by Gemini TTS
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'es', label: 'ES', name: 'Español' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'de', label: 'DE', name: 'Deutsch' },
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'ja', label: 'JP', name: '日本語' },
  { code: 'ko', label: 'KR', name: '한국어' },
  { code: 'zh', label: 'ZH', name: '中文' },
  { code: 'hi', label: 'HI', name: 'हिन्दी' },
  { code: 'ar', label: 'AR', name: 'العربية' },
  { code: 'he', label: 'HE', name: 'עברית' },
  { code: 'nl', label: 'NL', name: 'Nederlands' },
  { code: 'pl', label: 'PL', name: 'Polski' },
  { code: 'tr', label: 'TR', name: 'Türkçe' },
];

export function GlobalLanguageSelector({ selectedLang, onSelectLang }) {
  useTranslation();

  return (
    <div className="global-language-selector">
      <div className="global-language-codes">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className={`global-language-code ${selectedLang === lang.code ? 'selected' : ''}`}
            onClick={() => onSelectLang(lang.code)}
            title={lang.name}
            aria-label={`${lang.name}`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GlobalLanguageSelector;
export { SUPPORTED_LANGUAGES };
