import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguageWithPreload, SUPPORTED_LANGUAGES } from '../i18n/config';

const LANGUAGE_FLAGS = {
  en: '🇬🇧', pt: '🇧🇷', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
  ru: '🇷🇺', hu: '🇭🇺', he: '🇮🇱', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷',
  ar: '🇸🇦', hi: '🇮🇳', fa: '🇮🇷', nl: '🇳🇱', pl: '🇵🇱', tr: '🇹🇷',
};

export default function LanguageSelector({ compact = false }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleChange = async (lang) => {
    await changeLanguageWithPreload(lang);
    setOpen(false);
  };

  if (compact) {
    return (
      <div className="lang-selector lang-selector--compact">
        <button
          type="button"
          className="lang-selector__trigger"
          onClick={() => setOpen(!open)}
          aria-label="Change language"
        >
          {LANGUAGE_FLAGS[i18n.language] || '🌐'} {i18n.language.toUpperCase()}
        </button>
        {open && (
          <>
            <div className="lang-selector__overlay" onClick={() => setOpen(false)} />
            <div className="lang-selector__dropdown">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`lang-selector__option ${lang === i18n.language ? 'active' : ''}`}
                  onClick={() => handleChange(lang)}
                >
                  <span className="lang-selector__flag">{LANGUAGE_FLAGS[lang]}</span>
                  <span>{t(`languages.${lang}`)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full grid for landing page
  return (
    <div className="lang-grid">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          className={`lang-grid__item ${lang === i18n.language ? 'selected' : ''}`}
          onClick={() => handleChange(lang)}
          title={t(`languages.${lang}`)}
        >
          <span className="lang-grid__flag">{LANGUAGE_FLAGS[lang]}</span>
          <span className="lang-grid__code">{lang.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
